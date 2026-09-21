import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {escapeHtml, sourceRefs, photoMarkup, comparisonMarkup, familyFacesMarkup, artifactStoryMarkup, geographyMarkup, marketFamilyMarkup, marketSummaryMarkup, marketCurrentMarkup, marketHistoryMarkup, marketFamiliesMarkup, marketLedgerMarkup, marketCsv} from './src/render.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => readFile(path.join(root, relative), 'utf8');
const data = JSON.parse(await read('src/content.json'));
const journey = JSON.parse(await read('src/one-owl.json'));
const geography = JSON.parse(await read('src/geography.json'));
const useLocalImages = process.argv.includes('--local-images');
if (useLocalImages) {
  const manifest = JSON.parse(await read('public/images/local-manifest.json'));
  const missing = Object.keys(data.images).filter(id => !manifest[id]);
  if (missing.length) throw new Error(`Local image build is incomplete: ${missing.join(', ')}. Run npm run vendor:images first.`);
  for (const [id, record] of Object.entries(manifest)) {
    if (!data.images[id]) throw new Error(`Unknown local image: ${id}`);
    await access(path.join(root, record.path));
    data.images[id].localUrl = record.path;
  }
}

function familyCard(family, index) {
  const image = familyFacesMarkup(family, data);
  return `<article class="family-card" id="family-${escapeHtml(family.id)}"><div class="family-number"><span>${String(index + 1).padStart(2,'0')}</span><span>${family.id === 'egypt' ? 'REGIONAL BRANCH' : 'ATHENS'}</span></div>${image}<h4>${escapeHtml(family.name)}</h4><p class="date">${escapeHtml(family.date)}</p><p>${escapeHtml(family.feature)} ${sourceRefs(family.refs,data)}</p><p class="status">${escapeHtml(family.status)}</p><details><summary>Attribution & dating notes</summary><p>${escapeHtml(family.detail)}</p></details>${marketFamilyMarkup(family,data)}</article>`;
}
function sourceEntry(source, index) {
  return `<article class="source-entry" id="source-${escapeHtml(source.id)}"><span class="source-number">${String(index + 1).padStart(2,'0')}</span><div><div class="source-kind">${escapeHtml(source.kind)}</div><h3><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a></h3><p class="source-byline">${escapeHtml(source.author)} · ${escapeHtml(source.year)}</p><p class="source-scope">${escapeHtml(source.scope)}</p>${source.note ? `<details><summary>Scope & limitations</summary><p>${escapeHtml(source.note)}</p></details>` : ''}</div><a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open source ${index + 1}: ${escapeHtml(source.title)}">↗</a></article>`;
}
function imageRecord(image) {
  const objectLink = image.objectUrl ? `<a class="quiet-link" href="${escapeHtml(image.objectUrl)}" target="_blank" rel="noopener noreferrer">Museum / object catalogue ↗</a>` : '';
  const rights = image.rightsNote ? `<p class="record-rights"><strong>Reuse review pending.</strong> ${escapeHtml(image.rightsNote.replace(/^Reuse review pending\. /, ''))} <a href="${escapeHtml(image.rightsPolicyUrl)}" target="_blank" rel="noopener noreferrer">BnF policy ↗</a></p>` : '';
  return `<article class="image-record"><h4>${escapeHtml(image.title)}</h4><p>${escapeHtml(image.credit)}<br><a href="${escapeHtml(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(image.license)}</a> · ${image.width.toLocaleString('en-US')} × ${image.height.toLocaleString('en-US')} px</p><p>${escapeHtml(image.date)}</p><p>${escapeHtml(image.note)}</p><p>${escapeHtml(image.changes)}</p>${rights}${objectLink}<a class="quiet-link" href="${escapeHtml(image.source)}" target="_blank" rel="noopener noreferrer">Photograph & rights record ↗</a><a class="quiet-link" href="${escapeHtml(image.url)}" target="_blank" rel="noopener noreferrer">Full-resolution original ↗</a></article>`;
}

const options = (selected) => data.families.map((family) => `<option value="${family.id}"${family.id === selected ? ' selected' : ''}>${escapeHtml(family.name)}</option>`).join('');
const mainTemplate = await read('src/page.html');
const pricingTemplate = await read('src/pricing.html');
const atlasTemplate = await read('src/atlas.html');
const legacyMarketIds = [...new Set([
  ...[...pricingTemplate.matchAll(/id="(market-[^"]+)"/g)].map(match => match[1]),
  ...data.market.records.map(record => `sale-${record.id}`),
])];
const replacements = {
  JOURNEY_SOURCE_COUNT: journey.sourceIds.length,
  GENERATION_MARKS: Array.from({length:100}, (_,i) => `<span${i >= 80 ? ' class="range-end"' : ''}></span>`).join(''),
  MARKET_SUMMARY: marketSummaryMarkup(data),
  MARKET_LEGACY_LINKS: legacyMarketIds.map(id => `<span id="${escapeHtml(id)}" class="market-legacy-anchor" data-pricing-redirect aria-hidden="true"></span>`).join(''),
  MARKET_SOURCES: data.sources.map((source,index) => source.id.startsWith('market-') ? sourceEntry(source,index) : '').join('\n'),
  MARKET_CURRENT: marketCurrentMarkup(data),
  MARKET_HISTORY: marketHistoryMarkup(data),
  MARKET_FAMILIES: marketFamiliesMarkup(data),
  MARKET_LEDGER: marketLedgerMarkup(data),
  GEOGRAPHY: geographyMarkup(data, geography),
  SOURCE_COUNT: data.sources.length,
  IMAGE_COUNT: Object.keys(data.images).length,
  ANATOMY: artifactStoryMarkup(data.artifactStories.anatomy, data),
  COMPARE_LEFT: options('classical'),
  COMPARE_RIGHT: options('new'),
  COMPARE_PANEL_LEFT: comparisonMarkup('classical','reverse',data),
  COMPARE_PANEL_RIGHT: comparisonMarkup('new','reverse',data),
  FAMILY_CARDS: data.families.map(familyCard).join('\n'),
  GLOSSARY: data.glossary.map(([term,definition,refs]) => `<details><summary>${escapeHtml(term)}</summary><p>${escapeHtml(definition)} ${refs.length ? sourceRefs(refs,data) : ''}</p></details>`).join('\n'),
  SOURCES: data.sources.map(sourceEntry).join('\n'),
  IMAGE_REGISTER: Object.values(data.images).map(imageRecord).join('\n'),
};
const shared = (await read('src/render.mjs')).replace(/^export /gm,'');
const artifact = (await read('src/artifact-explorer.js')).replace(/^export /gm,'');
const app = (await read('src/app.js')).replace(/^import .*from '\.\/(?:render\.mjs|artifact-explorer\.js)';\s*/gm,'');
const script = `(() => {\n'use strict';\n${shared}\n${artifact}\n${app}\n})();`;
const styles = await read('src/styles.css');
function renderPage(template, pageData = data) {
  let html = template;
  html = html.replace(/\{\{PHOTO:([^:}]+):([^}]+)\}\}/g, (_,id,className) => {
    const crop = className === 'archaic-photo' ? 'top' : className === 'eye-profile' ? 'left' : undefined;
    return photoMarkup(id,pageData,className,crop,className === 'hero-photo' || id === 'owner-athena' || id === 'owner-owl');
  });
  html = html.replace(/\{\{CITE:([^}]+)\}\}/g, (_,ids) => sourceRefs(ids.split(','),pageData));
  html = html.replace(/\{\{([A-Z_]+)\}\}/g, (_,key) => {
    if (!(key in replacements)) throw new Error(`Unknown template token: ${key}`);
    return replacements[key];
  });
  html = html.replace('/* INLINE_STYLES */', styles)
    .replace('/* INLINE_DATA */', JSON.stringify(pageData).replace(/</g,'\\u003c'))
    .replace('/* INLINE_SCRIPT */', script.replace(/<\/script/gi,'<\\/script'));
  if (/\{\{[A-Z_]+|__\w+_URL__/.test(html)) throw new Error('An unresolved build token remains.');
  return html;
}
// Keep moved reference bookmarks reachable, including without JavaScript.
const referenceIds = ['sources','sources-title','family-tree','coin-descriptions','glossary-title','image-reuse-policy',...data.families.map(f=>`family-${f.id}`),...data.sources.map(s=>`source-${s.id}`)];
replacements.ATLAS_LEGACY_LINKS = referenceIds.filter(id=>!['atlas','atlas-title'].includes(id)).map(id=>`<span id="${escapeHtml(id)}" class="market-legacy-anchor" data-reference-redirect aria-hidden="true"></span>`).join('');
const html = renderPage(mainTemplate).replace(/href="#(source-[^"]+|image-reuse-policy)"/g,'href="atlas/#$1"');
await writeFile(path.join(root,'index.html'),html);
// Reuse the existing site chrome and native dialogs; only the page content differs.
// The motion control lives in the home page's chapter bar, which is inside <main>
// and therefore not part of the shared header slice. The sub-pages have no chapter
// tracker, so they open <main> with the same sticky strip carrying just that control.
const motionToggle = mainTemplate.match(/<button[^>]*id="motion-toggle"[\s\S]*?<\/button>/)[0];
const chromeUtility = `<div class="chrome-utility">${motionToggle}</div>`;
const pricingTitle = 'Athenian Owl Prices & Auction History — The Owl Atlas';
const pricingDescription = 'Explore current Athenian owl auction prices, 2019–2026 comparisons, buyer fees and 66 source-linked market observations. Research snapshot: September 2026.';
const pricingStart = mainTemplate.slice(0,mainTemplate.indexOf('<main id="main">') + '<main id="main">'.length)
  .replace('<body>', '<body class="pricing-page">')
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${pricingTitle}</title>`)
  .replace(/content="[^"]*" (name="description"|property="og:description"|name="twitter:description")/g, `content="${pricingDescription}" $1`)
  .replace(/content="[^"]*" (property="og:title"|name="twitter:title")/g, `content="${pricingTitle}" $1`)
  .replaceAll('https://theowlatlas.com/','https://theowlatlas.com/pricing/')
  .replace(/href="#(top|origins|atlas)"/g,'href="../#$1"')
  .replace('href="/atlas/#sources"','href="#sources"')
  .replace('class="pricing-nav"','class="pricing-nav" aria-current="page"')
  .replace('{{SOURCE_COUNT}}', String(data.sources.filter(s=>s.id.startsWith('market-')).length))
  .replace('Skip to the story','Skip to the pricing research') + chromeUtility;
const pricingEnd = mainTemplate.slice(mainTemplate.indexOf('   <footer class="site-footer'))
  .replace('href="#top"','href="../#pricing"').replace('Back to the beginning ↑','Back to the story ↗')
  .replace('The story, family entries and bibliography remain readable without JavaScript. Image links open the original photographs; interactive comparison and zoom controls require JavaScript.', 'The price comparisons, chart, sales ledger and sources remain readable without JavaScript. The calculator and ledger filters require JavaScript.');
const pricingHtml = renderPage(pricingTemplate.replace('{{PRICING_START}}',pricingStart).replace('{{PRICING_END}}',pricingEnd));
await mkdir(path.join(root,'pricing'),{recursive:true});
await writeFile(path.join(root,'pricing/index.html'),pricingHtml);
// The reference page retains the complete comparison, glossary and bibliography.
const atlasStart = mainTemplate.slice(0,mainTemplate.indexOf('<main id="main">') + '<main id="main">'.length)
  .replace('<body>', '<body class="reference-page">')
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Compare Owl Coins &amp; Explore the Sources — The Owl Atlas</title>')
  .replace(/content="[^"]*" (property="og:title"|name="twitter:title")/g, 'content="The Owl Atlas — Reference atlas and sources" $1')
  .replace(/content="[^"]*" (name="description"|property="og:description"|name="twitter:description")/g, 'content="Compare eight owl coin families, examine both faces, and explore the glossary, source bibliography and image credits." $1')
  .replaceAll('https://theowlatlas.com/','https://theowlatlas.com/atlas/')
  .replace(/href="#(top|origins|pricing)"/g,'href="../#$1"')
  .replace('Skip to the story','Skip to the reference atlas') + chromeUtility;
const atlasEnd = mainTemplate.slice(mainTemplate.indexOf('   <footer class="site-footer'))
  .replace('href="#top"','href="../"').replace('Back to the beginning ↑','Back to the story ↗');
const atlasData = {...data, images:Object.fromEntries(Object.entries(data.images).map(([id,image])=>[id,image.localUrl ? {...image,localUrl:`../${image.localUrl}`} : image]))};
const atlasHtml = renderPage(atlasTemplate.replace('{{ATLAS_START}}',atlasStart).replace('{{ATLAS_END}}',atlasEnd),atlasData)
  .replace(/href="pricing\//g,'href="../pricing/');
await mkdir(path.join(root,'atlas'),{recursive:true});
await writeFile(path.join(root,'atlas/index.html'),atlasHtml);
// Owner-supplied photographs and personal records belong to this companion only.
// Keep the main atlas's general-audience image register and bibliography intact.
const journeyData = {
  ...data,
  sources: [...data.sources, ...journey.sources],
  images: Object.fromEntries(Object.entries({...data.images, ...journey.images}).map(([id, image]) =>
    [id, image.localUrl ? {...image, localUrl:`../${image.localUrl}`} : image])),
};
const journeyTitle = '2,400 Years. Still Here. — One Owl’s Survival | The Owl Atlas';
const journeyDescription = 'Follow one Mint State Athenian owl across 2,400 years: original photographs, the scale of human generations, possible preservation paths and its documented modern appearances.';
const journeyStart = mainTemplate.slice(0,mainTemplate.indexOf('<main id="main">') + '<main id="main">'.length)
  .replace('<body>', '<body class="journey-page">')
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${journeyTitle}</title>`)
  .replace(/content="[^"]*" (name="description"|property="og:description"|name="twitter:description")/g, `content="${journeyDescription}" $1`)
  .replace(/content="[^"]*" (property="og:title"|name="twitter:title")/g, `content="${journeyTitle}" $1`)
  .replaceAll('https://theowlatlas.com/','https://theowlatlas.com/one-owl/')
  .replace(/href="#(top|origins|atlas|pricing)"/g,'href="../#$1"')
  .replace('href="/atlas/#sources"','href="#sources"')
  .replace('{{SOURCE_COUNT}}',String(journey.sourceIds.length)) + chromeUtility;
const journeyEnd = mainTemplate.slice(mainTemplate.indexOf('   <footer class="site-footer'))
  .replace('href="#top"','href="../#one-owl"').replace('Back to the beginning ↑','Back to the atlas ↗')
  .replace('The story, family entries and bibliography remain readable without JavaScript. Image links open the original photographs; interactive comparison and zoom controls require JavaScript.', 'The complete story, photographs and sources remain available without JavaScript. Image links open the original photographs; zoom controls require JavaScript.');
const journeyTemplate = (await read('src/one-owl.html'))
  .replace('{{JOURNEY_START}}',journeyStart).replace('{{JOURNEY_END}}',journeyEnd)
  .replace('{{JOURNEY_SOURCES}}',journeyData.sources.map((source,index) => journey.sourceIds.includes(source.id) ? sourceEntry(source,index) : '').join('\n'));
const journeyHtml = `${renderPage(journeyTemplate,journeyData).trimEnd()}\n`;
await mkdir(path.join(root,'one-owl'),{recursive:true});
await writeFile(path.join(root,'one-owl/index.html'),journeyHtml);
await mkdir(path.join(root,'research'),{recursive:true});
await writeFile(path.join(root,'research/sources.json'),JSON.stringify(data.sources,null,2));
await writeFile(path.join(root,'research/images-manifest.json'),JSON.stringify(Object.values(data.images),null,2));
await writeFile(path.join(root,'research/specimens.json'),JSON.stringify(Object.values(data.specimens),null,2));
await writeFile(path.join(root,'research/market-sales.json'),JSON.stringify({asOf:data.market.asOf,records:data.market.records},null,2));
await writeFile(path.join(root,'research/market-sales.csv'),marketCsv(data.market));
await writeFile(path.join(root,'research/one-owl-manifest.json'),JSON.stringify(journey,null,2));
console.log(`Built index.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB) and pricing/index.html (${Math.round(Buffer.byteLength(pricingHtml) / 1024)} KiB); ${data.sources.length} sources, ${Object.keys(data.images).length} image records. ${useLocalImages ? 'Local images enabled.' : 'Remote images; internet required for photography.'}`);
console.log(`Built one-owl/index.html (${Math.round(Buffer.byteLength(journeyHtml) / 1024)} KiB); ${journey.sourceIds.length} references and ${Object.keys(journey.images).length} owner-supplied photographs.`);
