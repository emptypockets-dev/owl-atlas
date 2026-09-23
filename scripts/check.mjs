/** Dependency-free content, reference, markup and JavaScript sanity checks. */
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {escapeHtml, sourceRefs, sourceShortLabel, SOURCE_SHORT_LABEL_MAX, photoMarkup, comparisonMarkup, marketStats, marketCsv} from '../src/render.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8'));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const template = await readFile(path.join(root, 'src/page.html'), 'utf8');
const pricing = await readFile(path.join(root, 'pricing/index.html'), 'utf8');
const atlas = await readFile(path.join(root, 'atlas/index.html'), 'utf8');
const atlasTemplate = await readFile(path.join(root, 'src/atlas.html'), 'utf8');
const journey = await readFile(path.join(root, 'one-owl/index.html'), 'utf8');
let tests = 0;
function check(condition, message) { assert(condition, message); tests++; }
const ids = new Set();
for (const source of data.sources) {
  check(!ids.has(source.id), `Duplicate source id: ${source.id}`); ids.add(source.id);
  for (const key of ['id','title','author','url','kind','scope','accessed']) check(Boolean(source[key]), `${source.id} lacks ${key}`);
  check(new URL(source.url).protocol === 'https:', `${source.id} must use HTTPS`);
}
for (const [id, image] of Object.entries(data.images)) {
  check(image.width > 0 && image.height > 0, `${id}: missing dimensions`);
  for (const key of ['title','url','source','credit','license','licenseUrl','alt','note','changes']) check(Boolean(image[key]), `${id}: missing ${key}`);
  for (const key of ['url','source','licenseUrl']) check(new URL(image[key]).protocol === 'https:', `${id}: invalid ${key}`);
  check(!/__\w+__/.test(image.url), `${id}: unresolved URL`);
  check(photoMarkup(id, data).includes('data-image='), `${id}: failed rendering`);
}
// Self-hosted resized display copies. The linked originals stay untouched, the
// six reuse-review-pending photographs stay hotlinked, and every derived file
// the build references must exist on disk at its declared size.
let derivedManifest = null;
try { derivedManifest = JSON.parse(await readFile(path.join(root, 'public/images/derived/manifest.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const declaredDerivatives = new Map();
for (const [id, record] of Object.entries(derivedManifest?.images || {})) {
  check(Boolean(data.images[id]), `Derived manifest names an unknown image: ${id}`);
  check(record.sourceUrl === data.images[id].url, `${id}: derivatives must be resized from the record's own original`);
  for (const derivative of record.derivatives) {
    check(/^public\/images\/derived\/[a-zA-Z0-9_-]+\.jpg$/.test(derivative.path), `${id}: unsupported derived path ${derivative.path}`);
    check((await stat(path.join(root, derivative.path))).size === derivative.bytes, `${derivative.path}: file size differs from the declared bytes`);
    check(derivative.width <= record.sourceWidth, `${derivative.path}: a derivative may never enlarge its source`);
    declaredDerivatives.set(derivative.path, derivative.bytes);
  }
}
const figuresFor = (document, id) =>
  [...document.matchAll(new RegExp(`<figure class="image-figure[^"]*" data-photo="${id}"[\\s\\S]*?</figure>`, 'g'))].map(match => match[0]);
for (const [id, image] of Object.entries(data.images)) {
  if (image.reuseStatus !== 'review-pending') continue;
  check(!derivedManifest?.images?.[id], `${id}: a reuse-review-pending photograph must not be derived`);
  const figures = [...figuresFor(html, id), ...figuresFor(atlas, id)];
  check(figures.length > 0, `${id}: the reuse-review-pending photograph is no longer displayed`);
  for (const figure of figures) {
    check(!figure.includes('srcset='), `${id}: a reuse-review-pending photograph must not get derivatives`);
    check(figure.includes(`src="${escapeHtml(image.url)}"`), `${id}: must keep hotlinking its unchanged original`);
  }
}
for (const family of data.families) {
  family.refs.forEach(id => check(ids.has(id), `Unknown family citation: ${id}`));
  for (const side of ['image','obverse','reverse']) if (family[side]) check(Boolean(data.images[family[side]]), `Unknown family image: ${family[side]}`);
  for (const side of ['obverse','reverse']) check(comparisonMarkup(family.id, side, data).includes('comparison-panel'), `Comparison failed: ${family.id}`);
}
for (const specimen of Object.values(data.specimens || {})) {
  check(Boolean(specimen.accession && specimen.catalogueDate && specimen.dateNote), `${specimen.id}: missing specimen/date metadata`);
  specimen.refs.forEach(id => check(ids.has(id), `Unknown specimen source: ${id}`));
  for (const side of ['obverse', 'reverse']) {
    const image = data.images[specimen[side]];
    check(Boolean(image), `${specimen.id}: missing ${side} image`);
    check(image.specimenId === specimen.id && image.side === side, `${specimen.id}: mismatched ${side}`);
    check(image.objectUrl === specimen.objectUrl, `${specimen.id}: mismatched catalogue link`);
    check(image.reuseStatus === 'review-pending' && Boolean(image.rightsNote), `${specimen.id}: missing reuse caveat`);
    check(image.width >= 2500 && image.height >= 2500, `${specimen.id}: unexpectedly low image resolution`);
  }
}
for (const family of data.families) {
  for (const id of family.specimens || []) {
    check(Boolean(data.specimens[id]), `Unknown family specimen: ${id}`);
    for (const side of ['obverse', 'reverse']) {
      const rendered = comparisonMarkup(family.id, side, data, id);
      check(rendered.includes(data.specimens[id][side]), `Comparison lost exact specimen: ${id}/${side}`);
      check(rendered.includes('Catalogue date:'), `Comparison lost museum dating distinction: ${id}`);
    }
  }
}
check(!markupGapText(), 'Obsolete missing-image claim remains');
function markupGapText() {
  return ['Why there is no Pi-style photograph here yet', 'Pi-style and later Old Style. Securely attributed, rights-cleared plates remain to be added.'].some(text => html.includes(text));
}
for (const story of Object.values(data.artifactStories)) {
  check(story.id && story.steps.length > 0, 'Artifact story requires an id and steps');
  const stepIds = new Set();
  for (const face of Object.values(story.faces)) {
    check(Boolean(data.images[face.image]), 'Artifact face requires an existing image');
    if (face.outline) check(face.outline.every(point => point.length === 2 && point.every(n => n >= 0 && n <= 1)), 'Outline uses normalized photo coordinates');
  }
  for (const step of story.steps) {
    check(!stepIds.has(step.id), 'Artifact step IDs must be unique'); stepIds.add(step.id);
    check(Boolean(story.faces[step.state.side]), 'Artifact step requires a known face');
    check(step.state.focus.x >= 0 && step.state.focus.x <= 1 && step.state.focus.y >= 0 && step.state.focus.y <= 1, 'Artifact focus uses normalized coordinates');
    check(Number.isFinite(step.state.zoom) && step.state.zoom >= 1 && Number.isFinite(step.state.rotation), 'Artifact state has valid zoom and rotation');
    check(step.paragraphs.length > 0, 'Each artifact view has a readable narrative');
    step.refs.forEach(id => check(ids.has(id), `Unknown artifact citation: ${id}`));
  }
}
for (const [, , refs] of data.glossary) refs.forEach(id => check(ids.has(id), `Unknown glossary source: ${id}`));
for (const match of (template + atlasTemplate).matchAll(/\{\{CITE:([^}]+)\}\}/g)) match[1].split(',').forEach(id => check(ids.has(id), `Unknown narrative citation: ${id}`));
const geography = JSON.parse(await readFile(path.join(root, 'src/geography.json'), 'utf8'));
const hooks = JSON.parse(await readFile(path.join(root, 'research/hooks-findings.json'), 'utf8'));
const placeIds = new Set();
for (const place of data.geography.places) {
  check(!placeIds.has(place.id), `Duplicate geographic place: ${place.id}`); placeIds.add(place.id);
  check(Boolean(geography.shapes[place.shape]?.length), `Missing area outline: ${place.id}`);
  check(place.bounds.length === 4 && place.bounds.every(Number.isFinite) && place.bounds[0] < place.bounds[2] && place.bounds[1] < place.bounds[3], `Invalid map extent: ${place.id}`);
  check(Boolean(place.kind && place.where && place.legend && place.mapNote), `Missing geographic explanation: ${place.id}`);
  place.refs.forEach(id => check(ids.has(id), `Unknown geographic source: ${id}`));
}
const markup = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const sales = data.market.records;
check(sales.length === 66 && new Set(sales.map(r=>r.id)).size === 66, '66 distinct market observations');
check(sales.filter(r=>r.venue !== 'eBay').length === 64, '64 auction results');
for (const sale of sales) {
  check(new URL(sale.source_url).protocol === 'https:', `${sale.id}: HTTPS primary source`);
  check(sale.reported_date <= data.market.asOf && sale.checked_on === data.market.asOf, `${sale.id}: dated snapshot, no future sales`);
  check(data.families.some(f=>f.id === sale.familyId), `${sale.id}: known coin family`);
  check(sale.currency === 'USD' && sale.amount > 0, `${sale.id}: explicit USD amount`);
  if (sale.venue === 'eBay') {
    check(sale.buyer_price_before_tax_shipping === null, `${sale.id}: unverified eBay display excluded from buyer statistics`);
  } else {
    const expected = sale.price_basis === 'hammer' ? Math.round(sale.amount * (1+sale.buyer_premium_rate)*100)/100 : sale.amount;
    check(sale.buyer_price_before_tax_shipping === expected, `${sale.id}: buyer-premium arithmetic`);
  }
}
const current = sales.filter(r=>r.cohort === 'current consecutive lots');
check(current.length === 28, 'All 28 lots in the specified current ranges retained');
check(marketStats(current.filter(r=>r.grade === 'Choice XF')).median === 1067.5, 'Current Choice XF median matches the headline');
const matched = sales.filter(r=>['current consecutive lots','historical matched grade'].includes(r.cohort) && r.grade === 'Choice XF' && r.strike === 5 && r.surface === 4);
check(matched.length === 24, 'Historical chart has 24 matched-grade observations');
check(marketStats(sales.filter(r=>r.venue === 'eBay')) === null, 'Displayed eBay prices cannot create a sale statistic');
for (const note of Object.values(data.market.familyNotes)) note.ids.forEach(id=>check(sales.some(r=>r.id === id), `Family pricing cites a known record: ${id}`));
check(marketCsv({records:[{value:'=1+1',note:'a,"quoted" value'}]}).includes('"\'=1+1"'), 'CSV formula-like strings are escaped');
check(JSON.stringify(JSON.parse(await readFile(path.join(root,'research/market-sales.json'),'utf8')).records) === JSON.stringify(sales), 'Public JSON agrees with authoritative records');
const recent = sales.filter(r => r.venue !== 'eBay' && r.reported_date.startsWith('2026'));
check(recent.length === 45 && marketStats(recent).min === 420 && marketStats(recent).max === 6710, 'Homepage summary matches the 2026 sample');
const documents = new Map([['/',html],['/pricing/',pricing],['/one-owl/',journey],['/atlas/',atlas]]);
for (const [pathname, document] of documents) {
  const pageMarkup = document.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
  const pageIds = [...pageMarkup.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  check(new Set(pageIds).size === pageIds.length, `${pathname}: unique IDs`);
  check((pageMarkup.match(/<h1\b/g)||[]).length === 1, `${pathname}: one main heading`);
  check(pageMarkup.includes(`href="https://theowlatlas.com${pathname}" rel="canonical"`), `${pathname}: correct canonical URL`);
  for (const match of pageMarkup.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(match[1],`https://theowlatlas.com${pathname}`);
    if (url.origin !== 'https://theowlatlas.com' || !url.hash) continue;
    const destination = documents.get(url.pathname);
    check(Boolean(destination?.includes(`id="${url.hash.slice(1)}"`)), `${pathname}: valid link ${match[1]}`);
  }
  for (const [,attrs,script] of document.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) if (!/application\/(ld\+)?json/.test(attrs)) { new vm.Script(script); tests++; }
  check(!/\{\{[A-Z]|INLINE_(STYLES|SCRIPT|DATA)/.test(document), `${pathname}: no unrendered template tokens`);
  for (const match of document.matchAll(/(?:\.\.\/)?(public\/images\/derived\/[A-Za-z0-9._-]+)/g)) {
    check(declaredDerivatives.has(match[1]), `${pathname}: references an undeclared derived file ${match[1]}`);
  }
}
const heroFigure = html.match(/<figure class="image-figure hero-photo"[\s\S]*?<\/figure>/)?.[0] || '';
check(/<img [^>]*\bsrcset="[^"]*public\/images\/derived\/[^"]*"[^>]*\bsizes="/.test(heroFigure), 'The hero photograph renders a responsive srcset of self-hosted derivatives');
check(/\bfetchpriority="high"/.test(heroFigure) && /\bloading="eager"/.test(heroFigure), 'The hero photograph keeps its eager, high-priority load');
check(/style="background-image:url\(data:image\/jpeg;base64,/.test(heroFigure), 'The hero disc paints a placeholder while the photograph arrives');
check(/<link as="image"[^>]*\bimagesrcset="[^"]*public\/images\/derived\/[^"]*"[^>]*\brel="preload"\/>/.test(html), 'The head preloads the hero derivative');
check(!/<link as="image"[^>]*rel="preload"/.test(atlas + pricing + journey), 'Only the homepage preloads the hero photograph');
// Share cards and structured data: every page must unfurl with its own picture
// and describe itself to search engines without drifting from src/content.json.
const socialPages = new Map([['/','home'],['/pricing/','pricing'],['/one-owl/','one-owl'],['/atlas/','atlas']]);
const reviewPending = new Set(Object.values(data.images).filter(image => image.reuseStatus === 'review-pending').map(image => image.url));
for (const [pathname, document] of documents) {
  const page = socialPages.get(pathname);
  const card = data.social?.[page];
  check(Boolean(card?.file && card.alt), `${pathname}: social card record in src/content.json`);
  const image = `https://theowlatlas.com/social/${card.file}`;
  const head = document.slice(0, document.indexOf('</head>'));
  const meta = (attribute) => (head.match(new RegExp(`content="([^"]*)" ${attribute}/>`)) || [])[1];
  check(meta('property="og:image"') === image, `${pathname}: absolute og:image`);
  check(meta('name="twitter:image"') === image, `${pathname}: twitter:image`);
  check(meta('property="og:image:width"') === '1200' && meta('property="og:image:height"') === '630', `${pathname}: declared share image size`);
  check(meta('property="og:image:type"') === 'image/png', `${pathname}: declared share image type`);
  check(meta('name="twitter:card"') === 'summary_large_image', `${pathname}: large summary card`);
  check(meta('property="og:image:alt"') === escapeHtml(card.alt) && meta('name="twitter:image:alt"') === escapeHtml(card.alt), `${pathname}: share image alt text`);
  const blocks = [...document.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(blocks.length === 1, `${pathname}: exactly one JSON-LD block`);
  check(!/<\/script/i.test(blocks[0][1]), `${pathname}: JSON-LD cannot close its own tag`);
  const graph = JSON.parse(blocks[0][1])['@graph'];
  const work = graph.find(node => ['Article','CreativeWork'].includes(node['@type']));
  check(Boolean(work), `${pathname}: Article or CreativeWork node`);
  for (const key of ['headline','description','image','dateModified','author','publisher','inLanguage']) check(Boolean(work[key]), `${pathname}: JSON-LD ${key}`);
  check(work.image === image, `${pathname}: JSON-LD image is the share card`);
  check(work.dateModified === data.reviewed, `${pathname}: JSON-LD dateModified is the reviewed date`);
  check(work.inLanguage === 'en' && work.url === `https://theowlatlas.com${pathname}`, `${pathname}: JSON-LD language and URL`);
  check(graph.find(node => node['@type'] === 'Organization')?.name === 'The Owl Atlas', `${pathname}: publisher Organization`);
  check(graph.some(node => node['@type'] === 'WebSite') === (pathname === '/'), `${pathname}: WebSite node on the home page only`);
  const photographs = graph.filter(node => node['@type'] === 'ImageObject');
  check((photographs.length > 0) === ['/','/atlas/'].includes(pathname), `${pathname}: photograph metadata only where the register applies`);
  for (const photograph of photographs) {
    for (const key of ['contentUrl','license','acquireLicensePage','creditText','creator','copyrightNotice']) check(Boolean(photograph[key]), `${pathname}: ${photograph['@id']} lacks ${key}`);
    check(!reviewPending.has(photograph.contentUrl), `${pathname}: no review-pending photograph in structured data`);
  }
}
// The referenced PNGs exist at the declared size; IHDR read directly, no dependency.
for (const [page, card] of Object.entries(data.social)) {
  const png = await readFile(path.join(root, 'public/social', card.file));
  check(png.subarray(0, 8).toString('latin1') === '\x89PNG\r\n\x1a\n', `${page}: ${card.file} is a PNG`);
  check(png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, `${page}: ${card.file} is 1200x630`);
  check(png.length <= 600 * 1024, `${page}: ${card.file} fits the 600 KiB share budget`);
}
const sitemap = await readFile(path.join(root, 'public/sitemap.xml'), 'utf8');
check(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), 'Sitemap declares the image namespace');
for (const [pathname, page] of socialPages) {
  check(sitemap.includes(`<loc>https://theowlatlas.com${pathname}</loc>`), `Sitemap lists ${pathname}`);
  check(sitemap.includes(`<image:loc>https://theowlatlas.com/social/${data.social[page].file}</image:loc>`), `Sitemap lists the ${page} share card`);
}
check((sitemap.match(new RegExp(`<lastmod>${data.reviewed}</lastmod>`,'g'))||[]).length === socialPages.size, 'Every sitemap entry carries the reviewed lastmod');
check(!/\bsocial\b/.test(await readFile(path.join(root, 'public/robots.txt'), 'utf8')), 'robots.txt does not block the share cards');
// Self-hosted display faces. The stylesheet is inlined into all four pages and
// three of them sit a directory down, so every font URL has to be root-absolute
// and has to resolve to a file that prepare-deploy will stage into dist/.
const inlineStyles = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
check(inlineStyles.includes('@font-face'), 'The built CSS carries the self-hosted @font-face rules');
const fontUrls = new Set([...inlineStyles.matchAll(/url\((\/public\/fonts\/[^)'"]+)\)/g)].map(match => match[1]));
check(fontUrls.size > 0, 'The built CSS references at least one self-hosted font file');
for (const reference of fontUrls) {
  check(/^\/public\/fonts\/[a-z0-9-]+\/[a-zA-Z0-9_-]+\.woff2$/.test(reference), `Unsupported font URL in the built CSS: ${reference}`);
  check((await stat(path.join(root, reference.slice(1)))).size > 0, `The built CSS references a missing font file: ${reference}`);
}
check(![...fontUrls].some(reference => reference.includes('instrument-serif')), 'The rejected Instrument Serif candidate is not referenced');
// Fraunces' own default instance is wght 900, so a face declared at a single
// weight would render every headline Black. Each subset declares the full range
// instead, which lets the ordinary CSS font-weight (400 throughout) drive the
// axis even where a rule also sets font-variation-settings for SOFT and WONK.
const fraunces = [...inlineStyles.matchAll(/@font-face\s*\{[^}]*\}/g)].map(match => match[0]).filter(face => face.includes("font-family:'Fraunces'"));
check(fraunces.length === 4, 'Fraunces ships as four subset faces: upright and italic, latin and latin-ext');
for (const face of fraunces) {
  check(face.includes('font-weight:100 900'), 'Every Fraunces face declares font-weight:100 900 so nothing inherits the 900 default');
  check(face.includes('font-display:swap'), 'Every Fraunces face swaps in rather than blocking first paint');
  check(face.includes('unicode-range:'), 'Every Fraunces face is bound to its own subset');
}
check(/@font-face\s*\{[^}]*font-family:'Fraunces Fallback'[^}]*size-adjust:/.test(inlineStyles), 'The Georgia fallback is metrics-matched with size-adjust');
for (const descriptor of ['ascent-override:', 'descent-override:', 'line-gap-override:']) {
  check(inlineStyles.includes(descriptor), `The Georgia fallback declares ${descriptor.slice(0, -1)}`);
}
// Both Latin subsets are on the critical path: the headlines are the first thing
// on screen and the italic runs inside them.
for (const [pathname, document] of documents) {
  const head = document.slice(0, document.indexOf('</head>'));
  for (const file of ['fraunces-latin-var-normal.woff2', 'fraunces-latin-var-italic.woff2']) {
    check(head.includes(`<link as="font" crossorigin="" href="/public/fonts/fraunces/${file}" rel="preload" type="font/woff2"/>`), `${pathname}: preloads ${file}`);
  }
}
check(!/<tr\b[^>]*data-market-row/.test(markup) && !markup.includes('class="market-history-figure"'), 'Homepage has only the pricing summary');
check((pricing.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').match(/<tr\b[^>]*data-market-row/g)||[]).length === 66, 'Full page preserves all 66 observations');
const htmlIds = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
check(new Set(htmlIds).size === htmlIds.length, 'Duplicate DOM IDs');
for (const match of markup.matchAll(/href="#([^"]+)"/g)) check(htmlIds.includes(match[1]), `Broken internal link #${match[1]}`);
check(!/\{\{[A-Z]|INLINE_(STYLES|SCRIPT|DATA)|__\w+_URL__/.test(html), 'Unresolved template token');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
for (const [, attrs, script] of scripts) if (!/application\/(ld\+)?json/.test(attrs)) { new vm.Script(script); tests++; }
check(escapeHtml('<img "x" onerror=\'x\'>&') === '&lt;img &quot;x&quot; onerror=&#39;x&#39;&gt;&amp;', 'HTML escaping regression');
assert.throws(() => sourceRefs(['not-real'], data)); tests++;
assert.throws(() => photoMarkup('not-real', data)); tests++;
assert.throws(() => comparisonMarkup('not-real', 'reverse', data)); tests++;
assert.throws(() => comparisonMarkup('pi', 'reverse', data, 'bnf-quadridigite-1478')); tests++;
assert.throws(() => comparisonMarkup('pi', 'edge', data)); tests++;
// Chunk 2 set pieces and the wide-screen citation apparatus.
// The dotted-theta interlude was removed on 23 September 2026 at the owner's
// request. The close reading's ΑΘΕ detail now carries the dotted theta, so the
// guard against the unsupported "letterform still in use" claim moves with it.
const identityReading = markup.match(/<article class="close-reading-item" id="close-reading-identity">[\s\S]*?<\/article>/)?.[0] || '';
check(identityReading.includes('circle with a central dot'), 'The ΑΘΕ reading carries the dotted theta');
check(!/2,400-year-old letterform|still in use/i.test(identityReading),
  'The ΑΘΕ reading does not promote the unsupported "letterform still in use" claim');
// The home page's generations set piece invites the companion story; it must not
// restate it, and its scale claim stays an illustration.
const invitation = markup.match(/<aside[^>]*id="one-owl"[\s\S]*?<\/aside>/)?.[0] || '';
check(Boolean(invitation), 'The one-owl invitation is present');
check(invitation.includes('How does an owl') && invitation.includes('survive 2,400 years?'),
  'The invitation keeps its headline');
check(invitation.includes('80&#x2013;100') || invitation.includes('80–100'), 'The invitation shows the 80-100 range');
check((invitation.match(/<span( class="range-end")?><\/span>/g) || []).length === 100,
  'The invitation reuses all one hundred generation marks');
check((invitation.match(/class="range-end"/g) || []).length === 20, 'Twenty marks show the rounded upper range');
check(invitation.includes('An illustration of elapsed time, not a count of owners.'),
  'The invitation states what the generation scale is not');
check(invitation.includes('Still graded Mint State') && invitation.includes('One coin.'),
  'The Mint State claim stays about the single companion coin');
check(invitation.includes('href="one-owl/"'), 'The invitation still links to the companion story');
check(!invitation.includes('Beni Hasan') && !invitation.includes('journey-generation-marks'),
  'The invitation is not a second copy of the companion page');
// Citation sidenote labels: derived, short, escaped, and attached to every chip
// without disturbing the dialog target or the no-JavaScript anchor.
for (const source of data.sources) {
  const label = sourceShortLabel(source);
  check(label.length > 0 && label.length <= SOURCE_SHORT_LABEL_MAX,
    `${source.id}: margin label must be 1-${SOURCE_SHORT_LABEL_MAX} characters, got ${label.length}`);
  check(!/^\s|\s$/.test(label), `${source.id}: margin label is trimmed`);
  check(!/access/i.test(label), `${source.id}: a visit date must not read as a publication date`);
}
check(sourceShortLabel({author: 'Cleveland Museum of Art', year: 'Collection record'}) === 'Cleveland Museum of Art',
  'An undated institution is named without a year');
check(sourceShortLabel({author: 'Alexandra Fullname, Bernard Secondname, Carol Third & Dmitri Fourth', year: '2025'})
  === 'Fullname et al. 2025', 'A byline too long for the margin collapses to the first surname');
check(sourceShortLabel({author: 'Stephen Lambert & P. J. Rhodes', year: 'Updated 2024'}) === 'Lambert & Rhodes updated 2024',
  'Two authors keep both surnames and the revision year');
check(sourceShortLabel({author: 'X', year: 'Undated; accessed 2026'}) === 'X', 'An access year is dropped');
check(sourceShortLabel({author: 'A'.repeat(80), year: '2020'}).length <= SOURCE_SHORT_LABEL_MAX,
  'An over-long name is truncated to the margin width');
for (const [pathname, document] of documents) {
  const pageMarkup = document.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
  const chips = [...pageMarkup.matchAll(/<a href="[^"]*#source-([^"]+)" data-source="[^"]+" data-short="([^"]*)"[^>]*>(\d\d)<\/a><span class="cite-note" aria-hidden="true"><span class="cite-note-index">(\d\d)<\/span>([^<]*)<\/span>/g)];
  check(chips.length > 0, `${pathname}: renders citation chips with margin labels`);
  const plainChips = (pageMarkup.match(/<a [^>]*\bdata-source="/g) || []).length;
  check(chips.length === plainChips, `${pathname}: every citation carries a data-short label and a note`);
  for (const [, id, short, number, noteNumber, noteText] of chips) {
    check(number === noteNumber, `${pathname}: chip ${number} and its note disagree`);
    check(short === noteText, `${pathname}: chip ${number} label and note text disagree`);
    check(short.length > 0 && short.length <= SOURCE_SHORT_LABEL_MAX + 6,
      `${pathname}: ${id} margin label is too long once escaped`);
    check(!/[<>]/.test(short), `${pathname}: ${id} margin label is escaped`);
  }
  // The brackets are drawn by CSS; nothing may reintroduce them as chip text.
  check(!/data-source="[^"]*"[^>]*>\[\d\d\]</.test(pageMarkup), `${pathname}: chip text is the bare numeral`);
}
const styles = await readFile(path.join(root, 'src/styles.css'), 'utf8');
check(/\.citation a::before\s*\{\s*content:"\[";/.test(styles) && /\.citation a::after\s*\{\s*content:"\]";/.test(styles),
  'The chip brackets are still drawn for every narrow, touch and printed reading');
check(/@media screen and \(min-width:1180px\) and \(hover:hover\)/.test(styles),
  'Sidenotes are gated on a wide viewport and a hovering pointer');
check(!/\.artifact-step-copy[^{]*\.cite-note/.test(styles), 'The sticky Anatomy stage never carries a sidenote');
// Each sub-page names itself where the home page names the chapter under way.
for (const [document, label, page] of [[pricing, 'PRICING RESEARCH', '/pricing/'], [atlas, 'THE REFERENCE ATLAS', '/atlas/'], [journey, 'ONE OWL', '/one-owl/']]) {
  const strip = document.match(/<div class="chrome-utility">[\s\S]*?<\/div>/)?.[0] || '';
  check(strip.includes(`<span class="chrome-utility-page">${label}</span>`), `${page}: chrome strip names the page`);
  check(strip.includes('id="motion-toggle"'), `${page}: chrome strip keeps the motion control`);
}
check(!html.includes('class="chrome-utility"'), 'The home page keeps its chapter bar rather than the sub-page strip');
// Chunk 3: the minting strike animation.
// The three diagrams stay the whole explanation. The motion is decorative, so
// the accessible descriptions, the schematic disclaimer and the ban on invented
// coin imagery all have to survive the animation, and every moving part has to
// be gated behind the class the observer adds.
const minting = markup.match(/<section class="minting-section"[\s\S]*?<\/section>/)?.[0] || '';
check(Boolean(minting), 'The minting section is present on the home page');
check(/<section class="minting-section"[^>]*\bdata-animate-on-view="[^"]+"/.test(minting),
  'The minting section carries the play-once-in-view hook');
const diagrams = [...minting.matchAll(/<svg class="minting-diagram"[\s\S]*?<\/svg>/g)].map(match => match[0]);
check(diagrams.length === 3, 'All three minting diagrams are still drawn');
const diagramLabels = [
  ['mint-tools', 'Two engraved dies', 'Side view: the upper die makes the owl reverse; the lower die, fixed in the anvil, makes Athena\'s obverse.'],
  ['mint-blank', 'A blank between the dies', 'A silver blank rests on the lower die. The upper die is aligned above it.'],
  ['mint-strike', 'The hammer strikes the upper die', 'Force passes through the upper die to the silver, impressing the designs on both faces.'],
];
for (const [index, [id, title, desc]] of diagramLabels.entries()) {
  const diagram = diagrams[index] || '';
  check(diagram.includes(`aria-labelledby="${id}-title ${id}-desc"`), `${id}: the diagram is still named by its title and description`);
  check(diagram.includes(`<title id="${id}-title">${title}</title>`), `${id}: unchanged accessible title`);
  check(diagram.includes(`<desc id="${id}-desc">${desc}</desc>`), `${id}: unchanged accessible description`);
  // Nothing the animation adds may be a picture of a coin: the diagrams stay
  // hand-drawn geometry, with no raster, no reused symbol and no embedded markup.
  const drawn = diagram.replace(/<(title|desc)[^>]*>[\s\S]*?<\/\1>/g, '');
  const elements = new Set([...drawn.matchAll(/<([a-zA-Z][\w-]*)/g)].map(match => match[1]));
  elements.delete('svg');
  check([...elements].every(name => ['g', 'path', 'circle', 'text'].includes(name)),
    `${id}: only schematic shapes, not [${[...elements].join(', ')}]`);
}
const strike = diagrams[2] || '';
check(/<g class="mint-a-relief"[^>]*\bopacity="0"/.test(strike), 'The struck-disc relief hint starts invisible in the markup itself');
check(/<circle class="mint-a-ring"[^>]*\bopacity="0"/.test(strike), 'The impact ring starts invisible in the markup itself');
check(minting.includes('Schematic side views. Tool shapes, engraved marks and spacing are simplified; not to scale. Silver is highlighted in gold.'),
  'The schematic disclaimer is unchanged');
check(/the struck disc carries no design/.test(minting) && /not a measured speed, force or number of blows/.test(minting),
  'The disclaimer states what the animation does not claim');
// The replay control: a real button, named, at the touch target, and rendered
// hidden so a reader without JavaScript is never offered a control that is inert.
const replay = minting.match(/<button[^>]*class="mint-replay"[^>]*>[\s\S]*?<\/button>/)?.[0] || '';
check(Boolean(replay), 'The minting section renders a replay control');
check(/\btype="button"/.test(replay), 'The replay control is a plain button, not a submit');
check(/\bdata-animate-replay\b/.test(replay), 'The replay control is wired to the generic hook');
check(/\bhidden\b/.test(replay), 'The replay control is hidden until JavaScript unhides it');
check(replay.replace(/<[^>]*>/g, '').trim().startsWith('Play again'), 'The replay control has a visible, accessible name');
check(minting.includes('<div class="minting-footer-actions">'), 'The replay control sits with the onward link, beside the copy');
// Every moving part waits for the class the observer adds, and motion off puts
// the figure back to the frame it was drawn in.
const mintingEnd = styles.indexOf('end CHUNK 3 / MINTING');
const mintingCss = styles.slice(styles.indexOf('/* === CHUNK 3 / MINTING'), mintingEnd + 'end CHUNK 3 / MINTING'.length);
check(Boolean(mintingCss) && mintingCss.includes('end CHUNK 3 / MINTING'), 'The minting styles are one self-contained block');
for (const rule of mintingCss.split('\n')) {
  if (!/^\s*\.[^{]*\{[^}]*animation:/.test(rule)) continue;
  check(/\.is-playing\b/.test(rule), `A minting animation runs before the section is read: ${rule.trim()}`);
}
check(/html\.motion-off .minting-section \[class\*="mint-a-"\][\s\S]{0,260}animation:none!important/.test(mintingCss),
  'Motion off stops the minting sequence');
check(/html\.motion-off \.mint-replay \{ display:none; \}/.test(mintingCss), 'Motion off takes the replay control away');
check(/@media print \{[\s\S]*?\.mint-replay \{ display:none; \}/.test(mintingCss), 'The replay control does not print');
check(mintingCss.includes('.minting-diagram .mint-a-relief { opacity:0; }'), 'The relief hint is invisible at rest');
// The hook itself is generic and ships in the built script.
const appSource = (await readFile(path.join(root, 'src/app.js'), 'utf8'));
check(/document\.querySelectorAll\('\[data-animate-on-view\]'\)/.test(appSource), 'app.js exposes a generic data-animate-on-view hook');
check(/\[data-animate-replay\]/.test(appSource), 'app.js wires a generic replay control');
check(html.includes('data-animate-on-view') && html.includes('is-playing'), 'The built page ships both the hook and the class it adds');

/* ---------------------------------------------------------------------------
 * One Owl: the owner's CC BY 4.0 release, and the measured display crops.
 *
 * A licence a reader cannot act on is not a licence, so every record has to
 * carry the deed URL and the page has to name the credit the licence requires.
 * The two close-ups are shown as circular crops measured off the owner's own
 * files; the measurement, the CSS that draws it and the complete frames in the
 * record all have to agree, or the crop has stopped being declared.
 * ------------------------------------------------------------------------- */
const companion = JSON.parse(await readFile(path.join(root, 'src/one-owl.json'), 'utf8'));
const OWNER_PHOTOS = ['owner-athena', 'owner-owl', 'owner-holder-obverse', 'owner-holder-reverse'];
const CC_BY_URL = 'https://creativecommons.org/licenses/by/4.0/';
const REQUIRED_CREDIT = 'The Owl Atlas (theowlatlas.com)';
check(Object.keys(companion.images).length === OWNER_PHOTOS.length,
  'The companion still carries exactly the four owner photographs');
for (const id of OWNER_PHOTOS) {
  const image = companion.images[id];
  check(Boolean(image), `${id}: owner photograph record is present`);
  check(image.license === 'CC BY 4.0' && image.licenseUrl === CC_BY_URL,
    `${id}: must carry the CC BY 4.0 name and its deed URL`);
  check(image.reuseStatus === 'cc-by-4.0', `${id}: reuse status records the CC BY 4.0 release`);
  check(image.credit === 'Photograph courtesy of the owner, via The Owl Atlas',
    `${id}: credit stays anonymous and names the party to attribute`);
  check(image.rightsNote.includes('CC BY 4.0') && image.rightsNote.includes(REQUIRED_CREDIT)
    && image.rightsNote.includes('MIT'),
    `${id}: rights note states the licence, the required credit and the code-licence exclusion`);
}
check(journey.includes(`href="${CC_BY_URL}"`), 'The companion page links the CC BY 4.0 deed');
check(journey.includes(REQUIRED_CREDIT), 'The companion page states the credit the licence requires');
const photoRecord = journey.match(/<details id="photographs"[\s\S]*?<\/details>/)?.[0] || '';
check(photoRecord.includes('CC BY 4.0') && photoRecord.includes(REQUIRED_CREDIT)
  && photoRecord.includes(CC_BY_URL),
  'The photograph record itself carries the licence, its deed link and the required credit');
const styleBlock = styles.slice(styles.indexOf('CHUNK 3 / ONE OWL'));
check(styles.includes('CHUNK 3 / ONE OWL'), 'The One Owl styles are appended in their own block');
for (const [id, selector] of [['owner-owl', '.journey-disc .image-trigger img'],
                              ['owner-athena', '.journey-face-small .image-trigger img']]) {
  const image = companion.images[id];
  const crop = image.displayCrop;
  check(crop?.shape === 'circle', `${id}: the display crop is declared as a circle`);
  check([crop.centreX, crop.centreY, crop.radius].every(Number.isInteger),
    `${id}: the display crop is a measurement, not a description`);
  check(crop.centreX - crop.radius >= 0 && crop.centreY - crop.radius >= 0
    && crop.centreX + crop.radius <= image.width && crop.centreY + crop.radius <= image.height,
    `${id}: the display crop stays inside the photographed frame`);
  check(image.crop === 'none', `${id}: the record still points at the complete original`);
  check(image.changes.includes(`radius ${crop.radius} px`)
    && image.changes.includes(`(${crop.centreX}, ${crop.centreY})`),
    `${id}: the changes note states the measured circle`);
  check(photoRecord.includes(`radius ${crop.radius} pixels`)
    && photoRecord.includes(`(${crop.centreX}, ${crop.centreY})`),
    `${id}: the page states the measured circle`);
  check(photoRecord.includes(`data-photo="${id}"`),
    `${id}: the complete frame is shown in the photograph record`);
  // The stylesheet draws the crop, so its percentages have to be the arithmetic
  // of the measurement: width 960/side, height 1280/side, offsets -x/side, -y/side.
  const side = crop.radius * 2;
  const rule = styleBlock.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*\\}`))?.[0] || '';
  check(rule.length > 0, `${id}: the stylesheet rule that draws the crop is present`);
  for (const [property, expected] of [
    ['width', 96000 / side], ['height', 128000 / side],
    ['left', -100 * (crop.centreX - crop.radius) / side],
    ['top', -100 * (crop.centreY - crop.radius) / side],
  ]) {
    const declared = Number(rule.match(new RegExp(`(?:^|[;{\\s])${property}:(-?[\\d.]+)%`, 'm'))?.[1]);
    check(Number.isFinite(declared) && Math.abs(declared - expected) < 0.01,
      `${id}: stylesheet ${property} must be ${expected.toFixed(3)}% for the measured crop, found ${declared}%`);
  }
}

// --- CHUNK 3 / GEOGRAPHY -------------------------------------------------
// The eight focused maps must keep every label, scale bar and north mark they
// had before the design pass, and the water and land they are now painted on
// have to be real CSS classes rather than a figure background, so they survive
// printing. The opening sweep is decoration: it adds classes and nothing else.
const geographyBlock = markup.match(/<div class="geography-explorer"[\s\S]*?<p class="geo-credit"/)?.[0] || '';
check(Boolean(geographyBlock), 'The geographic explorer renders');
const focusMaps = [...geographyBlock.matchAll(/<svg class="geo-focus-map"[\s\S]*?<\/svg>/g)].map(match => match[0]);
check(focusMaps.length === data.geography.places.length, `Eight focused area maps, got ${focusMaps.length}`);
for (const [index, place] of data.geography.places.entries()) {
  const map = focusMaps[index];
  check(map.includes(`<title id="geo-${place.id}-map-title">`), `${place.id}: the focused map still names itself`);
  check(/<g class="geo-scale"><rect[^>]*\/><path[^>]*\/><text[^>]*>\d+ km<\/text><\/g>/.test(map), `${place.id}: the focused map keeps its scale bar`);
  check(/<text class="geo-north"[^>]*>N /.test(map), `${place.id}: the focused map keeps its north mark`);
  for (const [name, , , kind] of place.labels) {
    check(map.includes(`class="geo-map-label geo-map-label-${kind}"`), `${place.id}: keeps a ${kind} label`);
    check(map.includes(`>${escapeHtml(name)}</text>`), `${place.id}: keeps the ${name} label`);
  }
  check(map.includes('<rect class="geo-sea"') && map.includes('class="geo-base geo-land"'), `${place.id}: sea and land are painted layers, not a background`);
  check(map.includes('<use class="geo-shelf'), `${place.id}: the coast is drawn as a shelf`);
  check(map.includes('<path class="geo-graticule"'), `${place.id}: the water carries a graticule`);
  check(map.includes('class="geo-area-trace"') && map.includes('pathLength="1"'), `${place.id}: the area outline can draw itself in`);
}
const locatorMaps = [...geographyBlock.matchAll(/<svg class="geo-locator-map"[\s\S]*?<\/svg>/g)].map(match => match[0]);
check(locatorMaps.length === data.geography.places.length, 'Every place keeps its wider locator');
for (const map of locatorMaps) {
  check(map.includes('<rect class="geo-sea"') && map.includes('class="geo-base geo-land"'), 'A locator gets the same painted water and land');
  check(map.includes('class="geo-area-trace"'), 'A locator highlight can draw itself in');
}
// The overview of all eight areas lives inside the controls, which are hidden
// without JavaScript and in print, and it names nothing the buttons do not.
const geographyControls = geographyBlock.match(/<div class="geo-controls" hidden>[\s\S]*?<\/select><\/label><\/div>/)?.[0] || '';
check(geographyControls.includes('<figure class="geo-reach" data-animate-on-view>'), 'The overview map is the scroll hook, inside the JavaScript-only controls');
check(/<svg class="geo-reach-map"[^>]*aria-hidden="true"[^>]*focusable="false"/.test(geographyControls), 'The overview repeats the buttons, so it stays decorative');
for (const place of data.geography.places) {
  check((geographyControls.match(new RegExp(`data-geo-reach="${place.id}"`, 'g')) || []).length === 2, `${place.id}: has an overview halo and area`);
  check(geographyBlock.includes(`<path id="geo-reach-${place.id}" pathLength="1"`), `${place.id}: one shared overview outline`);
  if (place.approximate) check(new RegExp(`data-geo-reach="${place.id}" href="#geo-reach-${place.id}" style="fill:url\\(#geo-reach-hatch\\)"`).test(geographyControls),
    `${place.id}: an approximate region stays hatched in the overview`);
}
// Water and land are classes in the built stylesheet, and the opening sweep is
// switched off for every reduced-motion state as well as for print.
for (const rule of ['.geo-sea {', '.geo-land {', '.geo-shelf {', '.geo-graticule {', '.geo-area-trace {', '.geo-reach-area {', '.geo-reach-halo {']) {
  check(inlineStyles.includes(rule), `The built CSS carries ${rule.slice(0, -2)}`);
}
const geoToken = (name) => (inlineStyles.match(new RegExp(`--${name}:(#[0-9a-f]{6})`)) || [])[1];
for (const name of ['geo-sea', 'geo-land', 'geo-coast', 'geo-water-ink', 'geo-sea-shelf', 'geo-graticule']) {
  check(Boolean(geoToken(name)), `The built CSS declares --${name}`);
}
const channel = (value) => { const c = value / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const relativeLuminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map(at => channel(parseInt(hex.slice(at, at + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrastRatio = (a, b) => {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
check(Math.abs(contrastRatio('#ffffff', '#767676') - 4.54) < 0.01, 'Contrast arithmetic regression');
for (const [ink, ground, minimum, label] of [
  [geoToken('geo-water-ink'), geoToken('geo-sea'), 4.5, 'sea labels on the water'],
  ['#1c2420', geoToken('geo-land'), 4.5, 'place labels on the land'],
  ['#596258', geoToken('geo-land'), 4.5, 'context labels on the land'],
  ['#1c2420', geoToken('geo-land'), 4.5, 'the scale bar on its plaque'],
  [geoToken('geo-coast'), geoToken('geo-land'), 3, 'the coastline against the land'],
  [geoToken('geo-sea-shelf'), geoToken('geo-sea'), 1.2, 'the shelf against the open water'],
  [geoToken('geo-land'), geoToken('geo-sea'), 1.25, 'land against sea'],
]) {
  const ratio = contrastRatio(ink, ground);
  check(ratio >= minimum, `Geographic contrast: ${label} is ${ratio.toFixed(2)}:1, below ${minimum}:1`);
}
// An author `display` on the bare selector would beat the user agent's [hidden]
// rule and expose the inert controls to a reader without JavaScript.
check(!/\.geo-controls\s*\{[^}]*display:/.test(inlineStyles), 'Nothing overrides the hidden attribute on the geographic controls');
check(!/\.geo-reach\s*\{[^}]*position:(fixed|sticky)/.test(inlineStyles), 'The overview map never pins itself over the reading');
for (const guard of ['html.motion-off .geography-explorer .geo-area', '@media (prefers-reduced-motion:reduce)', '@media print']) {
  check(inlineStyles.includes(guard), `The geographic reveal is switched off for ${guard}`);
}
const appScript = await readFile(path.join(root, 'src/app.js'), 'utf8');
check(/const geographyStill = \(\) => motionOff \|\| document\.documentElement\.classList\.contains\('motion-off'\)/.test(appScript),
  'The geographic sweep reads both motion switches before it runs');
check(appScript.includes("geographyExplorer.querySelector('[data-animate-on-view]')"),
  'The geographic sweep is hooked to its own in-view observer');
check(!/scrollIntoView|scrollTo/.test(appScript.slice(appScript.indexOf('const geographyExplorer'), appScript.indexOf('// Inline citations'))),
  'The geographic block never moves the page for the reader');

/* --- CHUNK 4 / SHARE ------------------------------------------------------
   The coin-card maker may only ever draw a rights-cleared photograph, so the
   preset table is held against the two content records on disk, against the
   files themselves, and against the data each built page actually ships. The
   copy-link and Share controls are runtime enhancements, so they must NOT be
   in the built markup at all; only their dialog is. */
const {SHARE_CARD_PRESETS, SHARE_CARD_SIZES, shareCardAssetPath, resolveShareCards} = await import('../src/share-cards.js');
const shareOwnerData = JSON.parse(await readFile(path.join(root, 'src/one-owl.json'), 'utf8'));
const shareRecords = {...data.images, ...shareOwnerData.images};
const shareModule = await readFile(path.join(root, 'src/share-cards.js'), 'utf8');
const shareBuild = await readFile(path.join(root, 'build.mjs'), 'utf8');
const shareMarkupOnly = (document) => document.replace(/<script[\s\S]*?<\/script>/gi, '');
const sharePages = [['index.html', html], ['atlas/index.html', atlas], ['pricing/index.html', pricing], ['one-owl/index.html', journey]];

check(SHARE_CARD_PRESETS.length === 5, 'The card maker offers its five preset cards');
check(SHARE_CARD_SIZES.some(size => size.width === 1080 && size.height === 1350), 'A 1080×1350 portrait card is offered');
check(SHARE_CARD_SIZES.some(size => size.width === 1200 && size.height === 630), 'A 1200×630 landscape card is offered');
const sharePresetIds = new Set();
for (const preset of SHARE_CARD_PRESETS) {
  check(!sharePresetIds.has(preset.id), `Duplicate share-card preset: ${preset.id}`);
  sharePresetIds.add(preset.id);
  const record = shareRecords[preset.image];
  check(Boolean(record), `${preset.id}: names a photograph no content record describes (${preset.image})`);
  check(record.reuseStatus !== 'review-pending', `${preset.id}: a reuse-review-pending photograph must never reach a share card`);
  check(record.width === preset.source.width && record.height === preset.source.height,
    `${preset.id}: the coin disc was measured against ${preset.source.width}×${preset.source.height}, but ${preset.image} is ${record.width}×${record.height}`);
  check(preset.disc.cx > 0 && preset.disc.cy > 0 && preset.disc.r > 0, `${preset.id}: needs a measured coin disc`);
  check(preset.disc.cx + preset.disc.r <= preset.source.width * 1.05 && preset.disc.cy + preset.disc.r <= preset.source.height * 1.05,
    `${preset.id}: the coin disc falls outside its own photograph`);
  check(preset.headline.length === 2 && preset.headline.every(Boolean), `${preset.id}: needs a two-line headline`);
  for (const key of ['name', 'eyebrow', 'fact', 'object']) check(Boolean(preset[key]), `${preset.id}: needs ${key}`);
  // Every file this preset could draw, in any build: the self-hosted
  // derivatives when the photograph has them, the record's own local file when
  // it does not. Each one has to be a same-origin path and be on disk.
  const files = (derivedManifest?.images?.[preset.image]?.derivatives || []).map(derivative => derivative.path);
  if (!files.length) files.push(preset.fallback?.path || record.localUrl);
  check(files.length > 0 && files.every(Boolean), `${preset.id}: has no image file to draw`);
  for (const file of files) {
    check(Boolean(shareCardAssetPath(file)), `${preset.id}: ${file} is not a same-origin /public/images path`);
    check((await stat(path.join(root, file))).isFile(), `${preset.id}: ${file} is missing on disk`);
  }
}
// The owner's owl is credited the way its own rights note prescribes, because
// src/one-owl.json is not inlined into the home page that offers the card.
const shareOwner = SHARE_CARD_PRESETS.find(preset => preset.image === 'owner-owl');
check(Boolean(shareOwner?.fallback), 'The owner-photograph card carries its own credit and licence');
check(shareRecords['owner-owl'].reuseStatus === 'cc-by-4.0', 'The owner photograph is released under CC BY 4.0');
check(shareOwner.fallback.license === shareRecords['owner-owl'].license, 'The card prints the licence the record declares');
check(shareRecords['owner-owl'].rightsNote.includes('The Owl Atlas (theowlatlas.com)'), 'The record prescribes the credit the card prints');
check(shareOwner.fallback.credit.includes('The Owl Atlas (theowlatlas.com)'), 'The card prints the prescribed credit');
check(/^One coin,/.test(shareOwner.fact) && !/\bowls\b|\bmost\b|\busually\b|survival rate/i.test(shareOwner.fact),
  'The “Still here” card stays a claim about one coin, not about owls in general');
// The four-days card and the €1 card each name the evidence on the image.
check(SHARE_CARD_PRESETS.find(preset => preset.id === 'four-days').note.includes('IG I³ 476'),
  'The four-days card prints the Erechtheion accounts it rests on');
check(SHARE_CARD_PRESETS.find(preset => preset.id === 'euro-echo').note.includes('European Central Bank'),
  'The €1 card prints the ECB as its source');

// The runtime guard, proved against this build's own data: a review-pending
// record is refused even when it is handed a perfectly good same-origin file.
const sharePendingId = Object.keys(data.images).find(id => data.images[id].reuseStatus === 'review-pending');
check(Boolean(sharePendingId), 'The BnF reuse-review flags are still in the data');
check(resolveShareCards(
  {[sharePendingId]: {...data.images[sharePendingId], localUrl: 'public/images/one-owl-owl.jpg'}},
  [{...SHARE_CARD_PRESETS[0], id: 'smuggled', image: sharePendingId}],
).length === 0, 'A reuse-review-pending record is refused even when it has a same-origin file');
for (const rejected of ['https://upload.wikimedia.org/a.jpg', 'data:image/png;base64,AAAA', 'public/images/../../secret.jpg', '/etc/passwd', '']) {
  check(shareCardAssetPath(rejected) === null, `A share card refuses ${rejected || '(an empty path)'}`);
}
check(shareCardAssetPath('../public/images/derived/classic-owl-800-b4cb57d2.jpg') === '/public/images/derived/classic-owl-800-b4cb57d2.jpg',
  'A sub-page image path resolves to the one root-absolute file');

// The preset table is inlined into every page, so it can be read back out of
// the built HTML and held to the same rule as the table on disk.
const shareEmbedded = html.slice(html.indexOf('SHARE_CARD_PRESETS'), html.indexOf('SHARE_CARD_LAYOUTS'));
check(shareEmbedded.length > 800, 'The built page carries the share-card preset table');
check(!/https?:\/\//.test(shareEmbedded), 'No embedded preset names a remote image');
for (const [id, image] of Object.entries(data.images)) {
  if (image.reuseStatus !== 'review-pending') continue;
  check(!shareEmbedded.includes(id), `${id}: a reuse-review-pending photograph must not appear in the embedded preset table`);
  check(!shareEmbedded.includes(image.url), `${id}: its original must not appear in the embedded preset table`);
}
for (const preset of SHARE_CARD_PRESETS) check(shareEmbedded.includes(`'${preset.image}'`), `${preset.id}: the built page carries its photograph id`);

// Each page resolves the full set from its own inlined records, and every file
// the dialog would load is on disk.
for (const [name, document] of sharePages) {
  const pageData = JSON.parse(document.match(/<script\b[^>]*\bid="atlas-data"[^>]*>([\s\S]*?)<\/script>/i)[1]);
  const cards = resolveShareCards(pageData.images);
  check(cards.length === SHARE_CARD_PRESETS.length, `${name}: offers all ${SHARE_CARD_PRESETS.length} cards`);
  for (const card of cards) {
    check(card.path.startsWith('/public/images/'), `${name}: ${card.id} draws a same-origin file, not ${card.path}`);
    check((await stat(path.join(root, card.path.slice(1)))).isFile(), `${name}: ${card.id} points at a file that exists`);
    check(card.credit.trim().length > 0, `${name}: ${card.id} carries a credit line`);
  }
}

// The dialog is the only part of the feature that ships as markup.
for (const [name, document] of sharePages) {
  const markup = shareMarkupOnly(document);
  check(markup.includes('<dialog aria-labelledby="share-card-title" class="share-dialog" id="share-card-dialog">'), `${name}: carries the share-card dialog`);
  for (const label of ['Make a share card', 'Choose a card', 'Card size', 'id="share-card-canvas"', 'id="share-card-presets"',
    'id="share-card-download"', 'id="share-card-status"', 'aria-label="Close the share card maker"']) {
    check(markup.includes(label), `${name}: the share-card dialog keeps ${label}`);
  }
  check(markup.includes('<canvas height="1350" id="share-card-canvas" role="img" width="1080">'), `${name}: the preview canvas exports at its full size`);
  check(markup.includes('<button class="share-card-action" hidden id="share-card-share" type="button">'), `${name}: the dialog's Share button waits for a browser that can share a file`);
  check(markup.includes('value="portrait"') && markup.includes('value="landscape"'), `${name}: both card sizes are offered`);
  // Runtime enhancements: nothing that copies or shares a link is in the markup.
  for (const marker of ['class="heading-share"', 'class="chapter-copy', 'id="share-page"', 'id="share-card-open"', 'class="share-control"']) {
    check(!markup.includes(marker), `${name}: ${marker} is built at runtime, not shipped as markup`);
  }
}
for (const marker of ['heading-share', 'chapter-copy', 'share-page', 'share-control']) {
  check(!template.includes(marker), `src/page.html does not hand-write the ${marker} enhancement`);
}
check(/<button class="hero-share-card" hidden id="hero-share-card" type="button">/.test(html),
  'The hero invitation ships hidden and waits for JavaScript');
check(/Make a share card\s*<span aria-hidden="true">\s*↗/.test(html), 'The hero invitation reads “Make a share card ↗”');
check(!atlas.includes('id="hero-share-card"') && !pricing.includes('id="hero-share-card"'), 'Only the home page carries the hero invitation');

// Styling and inlining contracts.
check(inlineStyles.includes('CHUNK 4 / SHARE'), 'The built CSS carries the share block under its own header');
for (const rule of ['.heading-share {', '.chapter-copy {', '.share-button {', '.share-dialog {', '.share-card-stage canvas {', '.hero-share-card {']) {
  check(inlineStyles.includes(rule), `The built CSS carries ${rule.slice(0, -2)}`);
}
check(/\.share-dialog:not\(\[open\]\)\s*\{\s*display:none/.test(inlineStyles), 'A closed card maker stays closed');
check(/\.chapter-copy\s*\{[^}]*min-height:44px/.test(inlineStyles), 'The copy control keeps a 44px target');
check(/@media \(hover:hover\) and \(pointer:fine\)\s*\{\s*\.chapter-copy\s*\{[^}]*opacity:0/.test(inlineStyles),
  'The copy control only hides itself where there is a hover to reveal it with');
check(inlineStyles.includes('html:not(.motion-off) .chapter-copy'), 'The share controls transition only while motion is on');
check(/@media print\s*\{\s*\.chapter-copy,\s*\.share-control/.test(inlineStyles), 'The share controls leave the printed page');
check(!/^import /m.test(shareModule), 'The share module stays self-contained so build.mjs can inline it');
check(!/\.crossOrigin\s*=/.test(shareModule), 'Nothing asks the browser for a cross-origin photograph');
check(shareModule.includes("querySelector('link[rel=\"canonical\"]')"), 'A copied link is built from the canonical address, not the preview origin');
check(shareModule.includes('navigator.canShare'), 'A file is only shared where the browser says it can share one');
check(shareModule.includes('navigator.share'), 'The Share control uses the native share sheet where there is one');
check(shareBuild.includes("read('src/share-cards.js')"), 'build.mjs inlines the share module');
check(/\$\{shareCards\}[^$]*\$\{app\}/.test(shareBuild), 'The share module is inlined ahead of src/app.js, which calls it');
check(/^initShareCards\(\{$/m.test(appScript), 'src/app.js starts the share controls');

/* === CHUNK 6 / STORY ORDER =============================================== */
// The home page was reordered so the reader meets the coin before the maps.
// These checks hold the order itself, the two moves that carry live behaviour
// (the eight-place explorer and the One Owl finale), the one new drawing, and
// the wording of the chapter that was halved.
const sectionOrder = [...markup.matchAll(/<(?:section|aside)[^>]*\bid="([a-z0-9-]+)"[^>]*>/g)]
  .map(match => match[1])
  .filter(id => ['top','origins','classical','404','new-style','beyond','evidence','pricing','atlas','one-owl'].includes(id));
assert.deepEqual(sectionOrder,
  ['top','origins','classical','404','new-style','beyond','evidence','pricing','atlas','one-owl'],
  `Home page story order changed: ${sectionOrder.join(' > ')}`); tests++;
check(markup.indexOf('id="one-owl"') < markup.indexOf('<footer class="site-footer')
  && markup.indexOf('id="atlas"') < markup.indexOf('id="one-owl"'),
  'The One Owl invitation is the last thing before the footer');
// Chapter numbers are still 01-07, in the eyebrows and the chapter-bar labels.
// Top-level story sections are the ones the build indents by three spaces;
// #minting is nested inside chapter 01 and must not end a slice.
const storyParts = markup.split(/(?=\n   <(?:section|aside|footer)\b)/);
const storySection = (id) => storyParts.find(part => new RegExp(`^\\s*<(?:section|aside)[^>]*\\bid="${id}"`).test(part)) || '';
for (const [id, number, label] of [['origins','01','Silver from Laurion'],['classical','02','The classical icon'],
  ['404','03','War and its aftermath'],['new-style','04','The redesign'],['beyond','05','An owl beyond Attica'],
  ['evidence','06','How we know'],['pricing','07','The owl today']]) {
  const section = storySection(id);
  check(Boolean(section), `Chapter ${number} is present: #${id}`);
  check(section.includes(`data-chapter="${number} / ${label}"`), `#${id} is labelled "${number} / ${label}" in the chapter bar`);
  check(new RegExp(`<span class="eyebrow[^"]*">\\s*${number} / `).test(section), `#${id} still numbers itself ${number}`);
  // Every chapter hands the reader to the next one, in static markup.
  check(/class="onward-cue|class="minting-footer-actions"/.test(section), `#${id} ends with an onward cue`);
}
const onwardTargets = [...markup.matchAll(/<div class="onward-cue[^"]*"[^>]*><a class="quiet-link" href="#([a-z0-9-]+)"/g)].map(m => m[1]);
assert.deepEqual(onwardTargets, ['404','new-style','beyond','evidence','pricing','atlas'],
  `Onward cues point somewhere unexpected: ${onwardTargets.join(', ')}`); tests++;
const pageScripts = [...html.matchAll(/<script(?![^>]*application\/(?:ld\+)?json)[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
check(!pageScripts.includes('onward-cue'), 'The onward cues are markup, not script');

// Chapter 01: the silver, then its ore. Since 23 September 2026 a photograph of
// Laurion ore stands where the static Attica map was, so the chapter draws no
// map at all; the eight-region explorer, with its own Athens view, is chapter 05's.
const origins = storySection('origins');
check(!origins.includes('geography-explorer') && !origins.includes('data-geography='),
  'The eight-region explorer has left chapter 01');
check(!/<svg class="geo-(?:focus|locator)-map"/.test(origins) && !origins.includes('origins-map'),
  'Chapter 01 draws no map: the ore photograph replaced the static Attica figure');
check((origins.match(/<figure class="image-figure/g) || []).length === 1, 'Chapter 01 carries exactly one photograph');
const oreFigure = figuresFor(origins, 'laurion-galena')[0] || '';
check(/^<figure class="image-figure origins-photo" data-photo="laurion-galena"/.test(oreFigure)
  && oreFigure.includes('data-image="laurion-galena"'), 'Chapter 01 shows the Laurion ore photograph, openable in the viewer');
check(/<img [^>]*\bsrcset="[^"]*public\/images\/derived\/laurion-galena-[^"]*"[^>]*\bsizes="/.test(oreFigure),
  'The ore photograph loads self-hosted derivatives through srcset and sizes');
check(oreFigure.includes(`href="${escapeHtml(data.images['laurion-galena']?.source)}"`)
  && oreFigure.includes(`>${escapeHtml(data.images['laurion-galena']?.license)}</a>`),
  'The ore photograph carries its credit, rights record and licence');
const oreCaption = origins.match(/<p class="micro-copy origins-caption">([\s\S]*?)<\/p>/)?.[1] || '';
check(/Laurion/.test(oreCaption) && /galena/.test(oreCaption) && /not an ancient find/.test(oreCaption),
  'The caption names the ore and says it is not an ancient find');
check(origins.includes('data-source="laurion-cupellation"') && /cupellation/.test(origins) && /litharge/.test(origins),
  'Chapter 01 takes the ore to lead and the lead to silver by cupellation, with its source');
check(!origins.slice(0, origins.indexOf('id="minting"')).includes('<button'), 'The chapter-01 opening has nothing to operate');
check(origins.includes('id="minting"'), 'The minting illustration stays in chapter 01');

// Chapter 05 now holds the explorer, with every deep-link id intact.
const beyond = storySection('beyond');
check(beyond.includes('id="geography-explorer"'), 'The explorer now lives in chapter 05');
for (const place of data.geography.places) {
  check(beyond.includes(`id="geography-${place.id}"`), `Deep link survives the move: #geography-${place.id}`);
}
check(beyond.includes('class="geography-key') && beyond.includes('class="geography-evidence'),
  'Chapter 05 keeps a trimmed lead-in and the mint/circulation/findspot key');
check(beyond.includes('data-image="sabakes"') && beyond.indexOf('data-image="sabakes"') < beyond.indexOf('geography-explorer'),
  'Chapter 05 opens on the Sabakes example, before the explorer');

// Chapter 06, halved: four one-line kinds of evidence and one document. The
// Nikophon wording is the phrasing already vetted in research/hooks-findings,
// so the two must not drift apart.
const evidence = storySection('evidence');
check(!evidence.includes('research-feature') && !evidence.includes('modern-coda'),
  'The research feature and euro coda have left chapter 06');
check((evidence.match(/<span class="evidence-index">/g) || []).length === 4, 'Four kinds of evidence remain');
for (const id of ['profile', 'isotopes', 'early-silver', 'law', 'mines', 'accounts']) {
  check(evidence.includes(`data-source="${id}"`), `Chapter 06 keeps its ${id} citation`);
}
const sacredFake = 'became sacred property of the Mother of the Gods, deposited with the Council';
check(evidence.includes(sacredFake), 'Chapter 06 tells the Nikophon story in the vetted wording');
check(hooks.hooks.find(hook => hook.id === 'hook-sacred-fake').expansion.includes(sacredFake),
  'The vetted wording is the one the research file records');
check(evidence.includes('Nikophon’s law of 375/4 BCE') && evidence.includes('bronze or lead core'),
  'Chapter 06 dates the law and names what was cut through');
check(evidence.includes('survives only in a debated restoration'),
  'The foreign-silver clause keeps its restoration caveat');
check(evidence.includes('href="https://atticinscriptions.com/inscription/RO/25"'), 'The translated inscription stays one click away');
// Sources the removed material carried are still cited on this page.
for (const id of ['ecb', 'isotopes', 'law']) {
  check((markup.match(new RegExp(`data-source="${id}"`, 'g')) || []).length > 0,
    `${id} is still cited on the home page after the cut`);
}

// The continue row replaces the old invitation section but keeps its id. With
// the identifier and the creator kit withdrawn on 23 September 2026, it offers
// two destinations: the reference atlas, then its sources and image credits.
const continueRow = storySection('atlas');
check(continueRow.includes('class="chapter section-paper continue-row"'), 'The continue row keeps the #atlas id');
const continueTargets = [...continueRow.matchAll(/<li><a href="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(continueTargets, ['atlas/', 'atlas/#sources'],
  `The continue row offers the atlas, then its sources: ${continueTargets.join(', ')}`); tests++;
check((continueRow.match(/<li>/g) || []).length === 2, 'The continue row offers exactly two destinations');

// Styles: one appended block, and the dark chapter restates the control fills
// that were painted for a paper ground.
const storyStart = styles.indexOf('/* ==========================================================================\n   CHUNK 6 / STORY ORDER');
check(storyStart > styles.lastIndexOf('end CHUNK 5 / CLOSE READING'), 'The story-order styles are appended after chunk 5');
const storyCss = styles.slice(storyStart);
check(storyCss.includes('end CHUNK 6 / STORY ORDER') && storyCss.trim().endsWith('*/'),
  'The story-order styles are one self-contained block at the end of the sheet');
for (const rule of ['.onward-cue {', '.origins-opening {', '.continue-cards {', '#one-owl {']) {
  check(inlineStyles.includes(rule), `The built CSS carries ${rule.slice(0, -2)}`);
}
check(/<section[^>]*id="classical"[^>]*class="chapter section-dark"|<section[^>]*class="chapter section-dark"[^>]*id="classical"/.test(markup),
  'Chapter 02 reads on a dark ground');
for (const selector of ['.section-dark .detail-buttons button[aria-pressed="true"]',
  '.section-dark .detail-buttons button:hover:not([aria-pressed="true"])',
  '.section-dark .segmented input:checked+span']) {
  check(storyCss.includes(selector), `The dark ground restates ${selector}`);
}
// Contrast for the text the dark chapter introduces. The pressed control is a
// light fill, so its numeral needs a dark gold rather than the paper-ground one.
for (const [ink, ground, minimum, label] of [
  ['#b4b9ad', '#191e1c', 4.5, 'muted copy on the dark chapter'],
  ['#f1eee4', '#191e1c', 4.5, 'reading text on the dark chapter'],
  ['#c5b88b', '#191e1c', 4.5, 'citation sidenote index on the dark chapter'],
  ['#6f6233', '#f1eee4', 4.5, 'the pressed detail button numeral'],
  ['#191e1c', '#f1eee4', 4.5, 'the pressed detail button label'],
  ['#778072', '#191e1c', 3, 'the unpressed control border'],
  ['#b4b9ad', '#111714', 4.5, 'the One Owl invitation on the deeper dark'],
]) {
  const ratio = contrastRatio(ink, ground);
  check(ratio >= minimum, `Story-order contrast: ${label} is ${ratio.toFixed(2)}:1, below ${minimum}:1`);
}
check(storyCss.includes('#6f6233'), 'The pressed-control numeral uses the dark gold, not the paper-ground one');
/* === end CHUNK 6 / STORY ORDER =========================================== */

/* === CHUNK 7 / WITHDRAWN FEATURES AND SEAM =============================== */
// "Which owl does this resemble?" and the /kit/ creator kit were withdrawn on
// 23 September 2026 at the owner's request; the kit's template is archived in
// research/kit-page-archived/ and sources 44-50 stay in the bibliography.
// Nothing built may point at either, and nothing may build or stage /kit/.
for (const [pathname, document] of documents) {
  check(!/\bid="identify"|data-identify-|href="[^"]*#identify"/.test(document), `${pathname}: the withdrawn identifier is gone`);
  check(!/href="(?:\.\.\/|\/)?kit\/"/.test(document), `${pathname}: nothing links to the withdrawn creator kit`);
}
check(data.families.every(family => !('identify' in family)), 'No family keeps the withdrawn identify block');
check(!('kit' in data.social) && Object.keys(data.social).length === socialPages.size, 'One share card per published page, none for /kit/');
check((sitemap.match(/<loc>/g) || []).length === socialPages.size && !sitemap.includes('/kit/'), 'The sitemap lists the four published pages and not /kit/');
check(!shareBuild.includes('kit.html') && !shareBuild.includes("'kit/index.html'"), 'build.mjs no longer builds /kit/');
const deployScript = await readFile(path.join(root, 'scripts/prepare-deploy.mjs'), 'utf8');
check(!deployScript.includes('kit/index.html'), 'prepare-deploy no longer stages kit/index.html');
// Chapter 02 (dark) now meets chapter 03 (ink) directly, so 404 opens on a
// hairline. One block, appended after everything else in the sheet.
const seamStart = styles.indexOf('/* === CHUNK 7 / SEAM');
const seamCss = seamStart === -1 ? '' : styles.slice(seamStart);
check(seamStart > styles.lastIndexOf('end CHUNK 6 / STORY ORDER') && seamCss.trim().endsWith('/* === end CHUNK 7 / SEAM === */'),
  'The seam styles are one block at the end of the sheet');
check(/\.crisis\.section-ink\s*\{[^}]*border-top:1px solid var\(--line-dark\)/.test(seamCss), 'Chapter 03 opens on a --line-dark hairline');
check((markup.match(/class="crisis section-ink"/g) || []).length === 1 && /class="crisis section-ink"[^>]*\bid="404"/.test(markup),
  'The seam rule reaches exactly one section, #404');
check(inlineStyles.includes('.crisis.section-ink {'), 'The built CSS carries the seam');
/* === end CHUNK 7 / WITHDRAWN FEATURES AND SEAM =========================== */

/* === LAURION ORE PHOTOGRAPH ==============================================
   Added 23 September 2026 with the chapter-01 photograph. A record's stated
   pixel size has to be the size of the original its derivatives were resized
   from, for every derived photograph. The ore itself is a modern mineral
   specimen, so its record has to say where the ore came from and what the
   picture is not, and to carry a licence the page can act on. */
for (const [id, record] of Object.entries(derivedManifest?.images || {})) {
  const image = data.images[id];
  check(record.sourceWidth === image.width && record.sourceHeight === image.height,
    `${id}: the record says ${image.width}×${image.height}, the original measured ${record.sourceWidth}×${record.sourceHeight}`);
}
const ore = data.images['laurion-galena'] || {};
check(ore.license === 'CC BY 2.0' && ore.licenseUrl === 'https://creativecommons.org/licenses/by/2.0/' && ore.reuseStatus === 'cc-by-2.0',
  'laurion-galena: CC BY 2.0, and its reuse status records it');
check(ore.crop === 'none' && !ore.rightsNote, 'laurion-galena: the full frame, with no open reuse review');
check(/Laurion \(Lavrion\)/.test(ore.note) && /not an ancient find/.test(ore.note) && /Carnegie Museum of Natural History/.test(ore.note),
  'laurion-galena: the note gives the locality, the holding museum and what the photograph is not');
check(/^No crop, retouching, upscaling or AI enhancement\./.test(ore.changes),
  'laurion-galena: the only declared change is the self-hosted resize');
check((derivedManifest?.images?.['laurion-galena']?.derivatives || []).length > 0, 'laurion-galena: has self-hosted derivatives');
check(ore.source === 'https://www.flickr.com/photos/jsjgeology/49365343353',
  'laurion-galena: links the photographer\'s own photo page, where the licence is stated');
const cupellation = data.sources.find(source => source.id === 'laurion-cupellation');
check(Boolean(cupellation) && cupellation.accessed === '2026-09-23' && /Laurion/.test(cupellation.title),
  'The chapter-01 metallurgy sentence rests on a dated Laurion cupellation source');
/* === end LAURION ORE PHOTOGRAPH ========================================== */

console.log(`PASS: ${tests} structural/rendering checks; ${data.sources.length} sources; ${Object.keys(data.images).length} images; ${data.families.length} family records.\nExternal network availability and historical claims require separate review.`);
