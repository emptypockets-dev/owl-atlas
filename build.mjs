import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {escapeHtml, sourceRefs, photoMarkup, comparisonMarkup, familyFacesMarkup, anatomyMarkup, geographyMarkup, marketFamilyMarkup, marketCurrentMarkup, marketHistoryMarkup, marketFamiliesMarkup, marketLedgerMarkup, marketCsv} from './src/render.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => readFile(path.join(root, relative), 'utf8');
const data = JSON.parse(await read('src/content.json'));
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
const replacements = {
  MARKET_CURRENT: marketCurrentMarkup(data),
  MARKET_HISTORY: marketHistoryMarkup(data),
  MARKET_FAMILIES: marketFamiliesMarkup(data),
  MARKET_LEDGER: marketLedgerMarkup(data),
  GEOGRAPHY: geographyMarkup(data, geography),
  SOURCE_COUNT: data.sources.length,
  IMAGE_COUNT: Object.keys(data.images).length,
  ANATOMY: anatomyMarkup(data),
  COMPARE_LEFT: options('classical'),
  COMPARE_RIGHT: options('new'),
  COMPARE_PANEL_LEFT: comparisonMarkup('classical','reverse',data),
  COMPARE_PANEL_RIGHT: comparisonMarkup('new','reverse',data),
  FAMILY_CARDS: data.families.map(familyCard).join('\n'),
  GLOSSARY: data.glossary.map(([term,definition,refs]) => `<details><summary>${escapeHtml(term)}</summary><p>${escapeHtml(definition)} ${refs.length ? sourceRefs(refs,data) : ''}</p></details>`).join('\n'),
  SOURCES: data.sources.map(sourceEntry).join('\n'),
  IMAGE_REGISTER: Object.values(data.images).map(imageRecord).join('\n'),
};
let html = await read('src/page.html');
html = html.replace(/\{\{PHOTO:([^:}]+):([^}]+)\}\}/g, (_,id,className) => {
  const crop = className === 'archaic-photo' ? 'top' : className === 'eye-profile' ? 'left' : undefined;
  return photoMarkup(id,data,className,crop,className === 'hero-photo');
});
html = html.replace(/\{\{CITE:([^}]+)\}\}/g, (_,ids) => sourceRefs(ids.split(','),data));
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (_,key) => {
  if (!(key in replacements)) throw new Error(`Unknown template token: ${key}`);
  return replacements[key];
});
const shared = (await read('src/render.mjs')).replace(/^export /gm,'');
const app = (await read('src/app.js')).replace(/^import .*from '\.\/render\.mjs';\s*/m,'');
const script = `(() => {\n'use strict';\n${shared}\n${app}\n})();`;
html = html.replace('/* INLINE_STYLES */', await read('src/styles.css'))
  .replace('/* INLINE_DATA */', JSON.stringify(data).replace(/</g,'\\u003c'))
  .replace('/* INLINE_SCRIPT */', script.replace(/<\/script/gi,'<\\/script'));
if (/\{\{[A-Z_]+|__\w+_URL__/.test(html)) throw new Error('An unresolved build token remains.');
await writeFile(path.join(root,'index.html'),html);
await mkdir(path.join(root,'research'),{recursive:true});
await writeFile(path.join(root,'research/sources.json'),JSON.stringify(data.sources,null,2));
await writeFile(path.join(root,'research/images-manifest.json'),JSON.stringify(Object.values(data.images),null,2));
await writeFile(path.join(root,'research/specimens.json'),JSON.stringify(Object.values(data.specimens),null,2));
await writeFile(path.join(root,'research/market-sales.json'),JSON.stringify({asOf:data.market.asOf,records:data.market.records},null,2));
await writeFile(path.join(root,'research/market-sales.csv'),marketCsv(data.market));
console.log(`Built index.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB); ${data.sources.length} sources, ${Object.keys(data.images).length} image records. ${useLocalImages ? 'Local images enabled.' : 'Remote images; internet required for photography.'}`);
