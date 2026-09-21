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
// The dotted-theta interlude is an original mark plus the site's own sourced
// wording; it must stay readable, labelled in the chapter bar, and light, so the
// ink-dark 404 that follows is not the second dark set piece in a row.
const theta = markup.match(/<section[^>]*id="theta"[\s\S]*?<\/section>/)?.[0] || '';
check(Boolean(theta), 'The dotted-theta interlude is present on the home page');
check(/data-chapter="Interlude[^"]*"/.test(theta), 'The interlude is labelled in the chapter bar');
check(/<svg class="theta-mark"[\s\S]*?<circle[^>]*r="15\.5"[\s\S]*?<circle[^>]*r="2\.8"/.test(theta),
  'The interlude draws the wordmark\'s own circle-and-dot, not a font glyph');
check(theta.includes('class="theta-interlude"') && !/section-(ink|dark|olive)/.test(theta),
  'The interlude stays light, so two dark set pieces never stack');
check(theta.includes('id="theta-title"') && /<h2 id="theta-title">/.test(theta), 'The interlude has a heading');
for (const id of ['acropolis', 'openlearn-theta']) {
  check(theta.includes(`data-source="${id}"`), `The interlude keeps its existing citation: ${id}`);
}
check(!/2,400-year-old letterform|still in use/i.test(theta),
  'The interlude does not promote the unsupported "letterform still in use" claim');
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
const mintingCss = styles.slice(styles.indexOf('/* === CHUNK 3 / MINTING'));
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
console.log(`PASS: ${tests} structural/rendering checks; ${data.sources.length} sources; ${Object.keys(data.images).length} images; ${data.families.length} family records.\nExternal network availability and historical claims require separate review.`);
