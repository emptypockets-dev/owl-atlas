/**
 * Reproducible 1200x630 social cards for the four pages.
 *
 * Node built-ins only; no npm dependency is added to the site. Source
 * photographs are downloaded into the gitignored `.cache/originals/` cache and
 * are never committed; only the four rendered PNGs under `public/social/` are.
 *
 * Rights: only CC0, public-domain, CC BY / CC BY-SA photographs and the owner's
 * own photographs may be composited here. The six BnF records carrying
 * `reuseStatus: "review-pending"` are refused outright (see AGENTS.md), and
 * every card that shows a photograph prints its institution and licence in the
 * corner. Headlines, prices and dates are derived from `src/content.json` and
 * `src/one-owl.json` so the cards cannot drift away from the pages.
 *
 * Renderers, in order of preference:
 *   1. Playwright's cached Chromium headless shell (`--screenshot`).
 *   2. `/opt/homebrew/bin/rsvg-convert`.
 * Both rasterise the same SVG template, so the fallback is not a second design.
 *
 * NOTE: the display face here is the current Georgia stack. When the site's
 * display font is swapped, re-run `node scripts/render-social.mjs` and commit
 * the re-rendered PNGs; nothing else needs to change.
 *
 * Usage: node scripts/render-social.mjs [--renderer=chromium|rsvg]
 */
import {readFile, writeFile, mkdir, stat, access} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {marketMoney, marketStats} from '../src/render.mjs';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.cache/originals');
const workDir = path.join(root, '.cache/social');
const outDir = path.join(root, 'public/social');
const MAX_BYTES = 600 * 1024;
const USER_AGENT = 'TheOwlAtlas-social-render/1.0 (https://theowlatlas.com; build-time social card renderer)';

const data = JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8'));
const journey = JSON.parse(await readFile(path.join(root, 'src/one-owl.json'), 'utf8'));

/* ---------------------------------------------------------------- palette */

const C = {
  forest: '#191e1c',
  forestDeep: '#111714',
  paper: '#f0ede4',
  gold: '#c5b88b',
  ring: '#9eaa93',
  well: '#333b34',
  serif: "Georgia,'Times New Roman',serif",
  mono: "'SFMono-Regular',Menlo,Consolas,monospace",
};
const muted = (alpha) => `fill="${C.paper}" fill-opacity="${alpha}"`;

/* --------------------------------------------------------- image sourcing */

/**
 * Coin discs measured once against a calibration grid, in source pixels. A
 * circular mask keeps each photograph's own framing: nothing is retouched,
 * upscaled or reconstructed, only masked and scaled for the card.
 */
const DISCS = {
  'classic-owl': {cx: 1304, cy: 1395, r: 1255},
  // The archaic plate pairs both faces; this is the lower, owl half.
  archaic: {cx: 383, cy: 1158, r: 296},
  'early-owl': {cx: 1120, cy: 1140, r: 985},
  'met-owl': {cx: 566, cy: 604, r: 548},
  'new-owl': {cx: 657, cy: 670, r: 637},
  'owner-owl': {cx: 446, cy: 730, r: 442},
};

function record(id) {
  const image = data.images[id] ?? journey.images[id];
  if (!image) throw new Error(`Unknown image record: ${id}`);
  if (image.reuseStatus === 'review-pending') {
    throw new Error(`${id} is flagged reuse review-pending and must not be composited into a shared asset.`);
  }
  return image;
}

/** Owner photographs are already in the repository; museum originals are cached. */
async function original(id) {
  const image = record(id);
  if (image.localUrl) {
    const local = path.join(root, image.localUrl);
    await access(local);
    return {buffer: await readFile(local), from: image.localUrl, cached: true};
  }
  await mkdir(cacheDir, {recursive: true});
  const file = path.join(cacheDir, `${id}${path.extname(new URL(image.url).pathname) || '.jpg'}`);
  try {
    await access(file);
    return {buffer: await readFile(file), from: image.url, cached: true};
  } catch {}
  const response = await fetch(image.url, {headers: {'User-Agent': USER_AGENT, Accept: 'image/*'}});
  if (!response.ok) throw new Error(`Download failed for ${id}: HTTP ${response.status} ${image.url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(file, buffer);
  return {buffer, from: image.url, cached: false};
}

/** Pixel dimensions straight from the bytes, so a disc can never be measured against the wrong frame. */
function imageSize(buffer) {
  if (buffer.subarray(0, 8).toString('latin1') === '\x89PNG\r\n\x1a\n') {
    return {type: 'image/png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20)};
  }
  if (buffer.readUInt16BE(0) !== 0xffd8) throw new Error('Unsupported original: expected JPEG or PNG');
  for (let offset = 2; offset + 9 < buffer.length;) {
    if (buffer[offset] !== 0xff) { offset++; continue; }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    // Any SOFn but the arithmetic/huffman-table markers carries the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {type: 'image/jpeg', height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7)};
    }
    offset += 2 + length;
  }
  throw new Error('Could not read JPEG frame size');
}

async function disc(id) {
  const image = record(id);
  const measured = DISCS[id];
  if (!measured) throw new Error(`No measured coin disc for ${id}`);
  const {buffer, from, cached} = await original(id);
  const {type, width, height} = imageSize(buffer);
  return {
    id,
    href: `data:${type};base64,${buffer.toString('base64')}`,
    width,
    height,
    ...measured,
    credit: `${image.credit} · ${image.license}`,
    // Institution and licence only, for cards that carry several photographs.
    shortCredit: `${image.credit.split(' · ')[0]} · ${image.license}`,
    from,
    cached,
  };
}

/* ------------------------------------------------------------- SVG pieces */

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function text(value, {x, y, size, font = C.serif, fill = C.paper, opacity = 1, italic = false, tracking = 0, anchor = 'start'}) {
  return `<text x="${x}" y="${y}" font-family="${esc(font)}" font-size="${size}" fill="${fill}"` +
    `${opacity === 1 ? '' : ` fill-opacity="${opacity}"`}${italic ? ' font-style="italic"' : ''}` +
    `${tracking ? ` letter-spacing="${tracking}"` : ''}${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}>${esc(value)}</text>`;
}

const eyebrow = (value, o) => text(value.toUpperCase(), {size: 14, font: C.mono, fill: C.gold, tracking: 1.9, ...o});
const caption = (value, o) => text(value, {size: 13, font: C.mono, fill: C.paper, opacity: 0.5, tracking: 0.9, ...o});
const rule = (x1, x2, y, opacity = 0.18) => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${C.paper}" stroke-opacity="${opacity}"/>`;

/** The wordmark from the site header: ΑΘΕ with the coin's dotted theta, then THE OWL / ATLAS. */
function wordmark(x, baseline) {
  const centre = baseline - 14;
  return `<g>` +
    text('Α', {x, y: baseline, size: 40}) +
    `<circle cx="${x + 45}" cy="${centre}" r="14.2" fill="none" stroke="${C.paper}" stroke-width="1.9"/>` +
    `<circle cx="${x + 45}" cy="${centre}" r="2.6" fill="${C.paper}"/>` +
    text('Ε', {x: x + 64, size: 40, y: baseline}) +
    `<line x1="${x + 108}" x2="${x + 108}" y1="${baseline - 30}" y2="${baseline + 6}" stroke="${C.paper}" stroke-opacity="0.24"/>` +
    text('THE OWL', {x: x + 126, y: baseline - 13, size: 13, font: C.mono, tracking: 1.6}) +
    text('ATLAS', {x: x + 126, y: baseline + 4, size: 13, font: C.mono, tracking: 1.6}) +
    `</g>`;
}

/**
 * Masks one photograph to its coin disc. `cover` (0–1) is how much of the
 * drawn circle the coin itself fills, leaving a little dark air around it.
 */
function coin(image, {cx, cy, r, cover = 0.98, ring = true}) {
  const scale = (r * cover) / image.r;
  const clip = `clip-${image.id}-${Math.round(cx)}-${Math.round(cy)}`;
  const ringRadius = Math.round(r * 1.19);
  return `<g>` +
    (ring ? `<circle cx="${cx}" cy="${cy}" r="${ringRadius}" fill="none" stroke="${C.ring}" stroke-opacity="0.44"/>` : '') +
    `<clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.well}"/>` +
    `<image href="${image.href}" clip-path="url(#${clip})" preserveAspectRatio="none"` +
    ` x="${(cx - image.cx * scale).toFixed(2)}" y="${(cy - image.cy * scale).toFixed(2)}"` +
    ` width="${(image.width * scale).toFixed(2)}" height="${(image.height * scale).toFixed(2)}"/>` +
    `</g>`;
}

/**
 * Credits stay attached to the photographs, so the footer wraps rather than
 * truncating. Two lines is the hard budget; a longer credit is a build error,
 * not a silently clipped attribution.
 */
// 12px monospace across the 1072px content column, leaving room for the address.
const CREDIT_COLUMNS = 126;
function creditLines(credit) {
  const parts = credit.split(' · ');
  const lines = [];
  for (const part of parts) {
    const last = lines.at(-1);
    if (last && `${last} · ${part}`.length <= CREDIT_COLUMNS) lines[lines.length - 1] = `${last} · ${part}`;
    else lines.push(part);
  }
  if (lines.length > 2 || lines.some(line => line.length > CREDIT_COLUMNS)) {
    throw new Error(`Credit line does not fit the card in two lines: ${credit}`);
  }
  return lines;
}

/** Shared chrome: frame, wordmark, edition, footer credit and the site address. */
function card({body, credit}) {
  const edition = `${data.edition} / ${data.reviewed.slice(0, 4)}`;
  const lines = creditLines(credit);
  const baselines = lines.length > 1 ? [574, 592] : [584];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
    `<rect width="1200" height="630" fill="${C.forest}"/>` +
    `<rect x="0" y="0" width="1200" height="630" fill="none" stroke="${C.gold}" stroke-opacity="0.22" stroke-width="2"/>` +
    wordmark(64, 92) +
    caption(edition, {x: 1136, y: 88, anchor: 'end', opacity: 0.45}) +
    rule(64, 1136, 122) +
    body +
    rule(64, 1136, 548) +
    lines.map((line, index) => caption(line, {x: 64, y: baselines[index], size: 12, opacity: 0.46})).join('') +
    text('theowlatlas.com', {x: 1136, y: baselines.at(-1), size: 12, font: C.mono, fill: C.gold, opacity: 0.8, tracking: 0.9, anchor: 'end'}) +
    `</svg>`;
}

/* ----------------------------------------------------------- the four cards */

async function homeCard() {
  const owl = await disc('classic-owl');
  const body =
    eyebrow('A field guide to Athenian coinage', {x: 64, y: 196}) +
    text('A small owl.', {x: 64, y: 300, size: 68}) +
    text('An ancient world.', {x: 64, y: 378, size: 68, italic: true}) +
    text('Museum photographs, plain language, and every source', {x: 64, y: 434, size: 20, opacity: 0.66}) +
    text('linked so you can check it yourself.', {x: 64, y: 464, size: 20, opacity: 0.66}) +
    coin(owl, {cx: 936, cy: 332, r: 168, cover: 1.03});
  return {
    svg: card({body, credit: `Owl reverse, Cleveland 1941.296.b · ${owl.credit}`}),
    alt: data.social.home.alt,
    sources: [owl],
  };
}

async function atlasCard() {
  const faces = [
    {image: await disc('archaic'), label: 'Archaic'},
    {image: await disc('early-owl'), label: 'Early classical'},
    {image: await disc('met-owl'), label: 'Classical'},
    {image: await disc('new-owl'), label: 'New Style'},
  ];
  const diameter = 144;
  const gap = 40;
  const startX = 64 + diameter / 2;
  const row = faces.map((face, index) => {
    const cx = startX + index * (diameter + gap);
    return coin(face.image, {cx, cy: 410, r: diameter / 2, ring: false}) +
      caption(face.label.toUpperCase(), {x: cx, y: 512, size: 11, tracking: 1.3, anchor: 'middle', opacity: 0.6});
  }).join('');
  const body =
    eyebrow(`The reference atlas · ${data.families.length} coin families`, {x: 64, y: 180}) +
    text('See the differences.', {x: 64, y: 244, size: 52}) +
    text('Keep the nuance.', {x: 64, y: 302, size: 52, italic: true}) +
    row +
    text('Both faces, side by side.', {x: 1136, y: 380, size: 18, opacity: 0.66, anchor: 'end'}) +
    text('Dates kept as approximate as', {x: 1136, y: 408, size: 18, opacity: 0.66, anchor: 'end'}) +
    text('the evidence actually is.', {x: 1136, y: 436, size: 18, opacity: 0.66, anchor: 'end'});
  // One corner credit per institution, in the order the coins appear. The full
  // donor and modification records stay in the page's image register.
  const credit = faces.map(face => face.image.shortCredit).join(' · ');
  return {
    svg: card({body, credit}),
    alt: data.social.atlas.alt,
    sources: faces.map(face => face.image),
  };
}

async function pricingCard() {
  const low = data.market.records.find(r => r.id === 'CNG-612-89');
  const high = data.market.records.find(r => r.id === 'Heritage-3130-36022');
  const classical = marketStats(data.market.records.filter(r => r.cohort === 'current consecutive lots' && r.grade === 'Choice XF'));
  const columns = [
    ['Pi style', marketMoney(low.buyer_price_before_tax_shipping), 'Good VF · one auction result'],
    ['Classical mass issues', `${marketMoney(classical.min)}–${marketMoney(classical.max)}`, `${classical.n} sales · median ${marketMoney(classical.median)}`],
    ['Archaic', marketMoney(high.buyer_price_before_tax_shipping), 'VF, flan flaw · one auction result'],
  ];
  const width = 330;
  const blocks = columns.map(([label, amount, note], index) => {
    const x = 64 + index * (width + 41);
    return rule(x, x + width, 374, 0.26) +
      eyebrow(label, {x, y: 404, size: 12, tracking: 1.6}) +
      text(amount, {x, y: 462, size: 44}) +
      text(note, {x, y: 494, size: 15, opacity: 0.6});
  }).join('');
  const snapshot = new Date(`${data.market.asOf}T00:00:00Z`).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
  const body =
    eyebrow(`Auction results · ${data.market.records.length} source-linked observations`, {x: 64, y: 186}) +
    text('One owl.', {x: 64, y: 258, size: 58}) +
    text('Many prices.', {x: 64, y: 322, size: 58, italic: true}) +
    blocks;
  return {
    svg: card({body, credit: `USD including buyer premium, before tax and shipping · Research snapshot ${snapshot}`}),
    alt: data.social.pricing.alt,
    sources: [],
  };
}

async function oneOwlCard() {
  const owl = await disc('owner-owl');
  const body =
    eyebrow('One owl’s survival', {x: 64, y: 196}) +
    text('2,400 years.', {x: 64, y: 300, size: 68}) +
    text('Still here.', {x: 64, y: 378, size: 68, italic: true}) +
    text('One coin, still graded Mint State.', {x: 64, y: 436, size: 21, opacity: 0.66}) +
    coin(owl, {cx: 936, cy: 332, r: 168});
  return {
    svg: card({body, credit: `${owl.credit} · photographed in its holder`}),
    alt: data.social['one-owl'].alt,
    sources: [owl],
  };
}

/* -------------------------------------------------------------- renderers */

function chromiumBinary() {
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  return [
    'chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    'chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chromium_headless_shell-1228/chrome-headless-shell-linux/chrome-headless-shell',
  ].map(relative => path.join(base, relative));
}

async function firstExisting(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  return null;
}

async function pickRenderer(requested) {
  if (requested !== 'rsvg') {
    const binary = await firstExisting(chromiumBinary());
    if (binary) return {name: 'chromium', binary};
    if (requested === 'chromium') throw new Error('No cached Playwright Chromium found.');
  }
  const rsvg = await firstExisting(['/opt/homebrew/bin/rsvg-convert', '/usr/local/bin/rsvg-convert']);
  if (rsvg) return {name: 'rsvg-convert', binary: rsvg};
  throw new Error('No renderer available: install Playwright Chromium or librsvg.');
}

async function rasterise(renderer, name, svg, destination) {
  const svgFile = path.join(workDir, `${name}.svg`);
  await writeFile(svgFile, svg);
  if (renderer.name === 'rsvg-convert') {
    await run(renderer.binary, ['--width=1200', '--height=630', '--format=png', '--output', destination, svgFile]);
    return;
  }
  // Chromium rasterises the same SVG, inlined so the screenshot needs no second request.
  const htmlFile = path.join(workDir, `${name}.html`);
  await writeFile(htmlFile, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${C.forest}}svg{display:block}</style></head><body>${svg}</body></html>`);
  await run(renderer.binary, [
    '--headless', `--screenshot=${destination}`, '--window-size=1200,630', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--virtual-time-budget=4000', '--no-sandbox',
    `file://${htmlFile}`,
  ]);
}

/** PNG IHDR: bytes 16–23 hold width and height, big-endian. */
async function pngSize(file) {
  const header = (await readFile(file)).subarray(0, 24);
  if (header.subarray(0, 8).toString('latin1') !== '\x89PNG\r\n\x1a\n') throw new Error(`${file} is not a PNG`);
  return {width: header.readUInt32BE(16), height: header.readUInt32BE(20)};
}

/** Only if a card exceeds the share-card budget; sips ships with macOS. */
async function shrink(file) {
  const before = (await stat(file)).size;
  if (before <= MAX_BYTES) return {before, after: before, optimised: false};
  await run('/usr/bin/sips', ['-s', 'format', 'png', '-s', 'formatOptions', 'best', file, '--out', file]);
  return {before, after: (await stat(file)).size, optimised: true};
}

/* ------------------------------------------------------------------- main */

const requested = (process.argv.find(argument => argument.startsWith('--renderer=')) ?? '').split('=')[1];
const renderer = await pickRenderer(requested);
await mkdir(workDir, {recursive: true});
await mkdir(outDir, {recursive: true});

const cards = {home: await homeCard(), atlas: await atlasCard(), pricing: await pricingCard(), 'one-owl': await oneOwlCard()};
for (const name of Object.keys(cards)) {
  if (!data.social[name]) throw new Error(`src/content.json has no social record for ${name}`);
}
console.log(`Renderer: ${renderer.name} (${renderer.binary})`);
for (const [name, cardData] of Object.entries(cards)) {
  const destination = path.join(outDir, data.social[name].file);
  await rasterise(renderer, name, cardData.svg, destination);
  const {width, height} = await pngSize(destination);
  if (width !== 1200 || height !== 630) throw new Error(`${name}.png rendered at ${width}x${height}, expected 1200x630`);
  const size = await shrink(destination);
  console.log(`\npublic/social/${data.social[name].file} — ${width}x${height}, ${(size.after / 1024).toFixed(0)} KiB${size.optimised ? ` (optimised from ${(size.before / 1024).toFixed(0)} KiB)` : ''}`);
  console.log(`  alt: ${cardData.alt}`);
  if (!cardData.sources.length) console.log('  photographs: none (typographic card)');
  for (const source of cardData.sources) {
    console.log(`  photograph ${source.id}: ${source.from} ${source.cached ? '(cached)' : '(downloaded)'}`);
    console.log(`    credit: ${source.credit}`);
  }
}
console.log(`\nDone. ${Object.keys(cards).length} cards, each ≤ ${MAX_BYTES / 1024} KiB. Originals stay in .cache/originals/ and are not committed.`);
