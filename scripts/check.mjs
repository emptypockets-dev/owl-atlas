/** Dependency-free content, reference, markup and JavaScript sanity checks. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {escapeHtml, sourceRefs, photoMarkup, comparisonMarkup, marketStats, marketCsv} from '../src/render.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8'));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const template = await readFile(path.join(root, 'src/page.html'), 'utf8');
const pricing = await readFile(path.join(root, 'pricing/index.html'), 'utf8');
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
for (const detail of data.anatomy) {
  check(Boolean(data.images[detail.image]), `Unknown anatomy image: ${detail.image}`);
  check(['obverse', 'reverse'].includes(detail.side), `Unknown anatomy side: ${detail.side}`);
  detail.refs.forEach(id => check(ids.has(id), `Unknown anatomy citation: ${id}`));
  check(detail.x >= 0 && detail.x <= 100 && detail.y >= 0 && detail.y <= 100, 'Invalid anatomy coordinate');
}
for (const side of ['obverse', 'reverse']) {
  const images = new Set(data.anatomy.filter(detail => detail.side === side).map(detail => detail.image));
  check(images.size === 1, `Anatomy ${side} must use one consistent specimen photograph`);
}
for (const [, , refs] of data.glossary) refs.forEach(id => check(ids.has(id), `Unknown glossary source: ${id}`));
for (const match of template.matchAll(/\{\{CITE:([^}]+)\}\}/g)) match[1].split(',').forEach(id => check(ids.has(id), `Unknown narrative citation: ${id}`));
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
const documents = new Map([['/',html],['/pricing/',pricing],['/one-owl/',journey]]);
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
  for (const [,attrs,script] of document.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) if (!attrs.includes('application/json')) { new vm.Script(script); tests++; }
  check(!/\{\{[A-Z]|INLINE_(STYLES|SCRIPT|DATA)/.test(document), `${pathname}: no unrendered template tokens`);
}
check(!/<tr\b[^>]*data-market-row/.test(markup) && !markup.includes('class="market-history-figure"'), 'Homepage has only the pricing summary');
check((pricing.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').match(/<tr\b[^>]*data-market-row/g)||[]).length === 66, 'Full page preserves all 66 observations');
const htmlIds = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
check(new Set(htmlIds).size === htmlIds.length, 'Duplicate DOM IDs');
for (const match of markup.matchAll(/href="#([^"]+)"/g)) check(htmlIds.includes(match[1]), `Broken internal link #${match[1]}`);
check(!/\{\{[A-Z]|INLINE_(STYLES|SCRIPT|DATA)|__\w+_URL__/.test(html), 'Unresolved template token');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
for (const [, attrs, script] of scripts) if (!attrs.includes('application/json')) { new vm.Script(script); tests++; }
check(escapeHtml('<img "x" onerror=\'x\'>&') === '&lt;img &quot;x&quot; onerror=&#39;x&#39;&gt;&amp;', 'HTML escaping regression');
assert.throws(() => sourceRefs(['not-real'], data)); tests++;
assert.throws(() => photoMarkup('not-real', data)); tests++;
assert.throws(() => comparisonMarkup('not-real', 'reverse', data)); tests++;
assert.throws(() => comparisonMarkup('pi', 'reverse', data, 'bnf-quadridigite-1478')); tests++;
assert.throws(() => comparisonMarkup('pi', 'edge', data)); tests++;
console.log(`PASS: ${tests} structural/rendering checks; ${data.sources.length} sources; ${Object.keys(data.images).length} images; ${data.families.length} family records.\nExternal network availability and historical claims require separate review.`);
