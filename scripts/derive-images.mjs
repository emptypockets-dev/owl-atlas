/** Build self-hosted, resized display copies of the source-linked photographs.
 *
 * No scraping, no upscaling, no retouching and no rights changes. Only the
 * pixel dimensions and the JPEG encoding differ from the linked original, and
 * every derivative records the checksum of the original it was resized from.
 * Reuse-review-pending photographs are never downloaded or derived here.
 *
 * Usage: node scripts/derive-images.mjs [--force] [--only=id,id]
 * Node 20+, macOS `sips`, network access on the first run. Cached originals in
 * .cache/originals/ and verified derivatives are reused, so reruns are offline.
 */
import {readFile, writeFile, mkdir, rename, readdir, rm, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const run = promisify(execFile);
const SIPS = '/usr/bin/sips';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const only = process.argv.find((argument) => argument.startsWith('--only='))?.slice(7).split(',').filter(Boolean);

/** Display widths. A width larger than the source is skipped: never enlarge. */
const WIDTHS = [800, 1600];
/** The two Anatomy of an Owl faces also drive a full-stage camera. */
const EXTRA_WIDTHS = {'classic-athena': [2400], 'classic-owl': [2400]};
/** Blurred loading placeholders: the hero disc and both Anatomy stage faces. */
const PLACEHOLDER_IDS = ['classic-owl', 'classic-athena'];
const QUALITY = 82;
const PLACEHOLDER_WIDTH = 24;
const PLACEHOLDER_QUALITY = 40;
const MAX_BYTES = 32 * 1024 * 1024;
const MAX_PLACEHOLDER_BYTES = 1400;

const derivedDirectory = path.join(root, 'public/images/derived');
const manifestPath = path.join(derivedDirectory, 'manifest.json');
const cacheDirectory = path.join(root, '.cache/originals');
const cacheIndexPath = path.join(cacheDirectory, 'index.json');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (file, fallback) => {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
};
const writeJsonAtomic = async (file, value) => {
  await writeFile(`${file}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  await rename(`${file}.tmp`, file);
};

const data = JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8'));
await mkdir(derivedDirectory, {recursive: true});
await mkdir(cacheDirectory, {recursive: true});
const previous = await readJson(manifestPath, null);
const cacheIndex = await readJson(cacheIndexPath, {});
const sipsVersion = (await run(SIPS, ['--version'])).stdout.trim();

/** Reuse the archival download safeguards: size ceiling, declared content type,
 *  magic-number verification, identifying User-Agent and a recorded checksum. */
async function fetchOriginal(id, url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {'User-Agent': process.env.OWL_IMAGE_USER_AGENT || 'OwlAtlasImageArchive/0.1 (user-initiated archival download)'},
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const mime = response.headers.get('content-type')?.split(';')[0].trim();
  const extension = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[mime];
  if (!extension) throw new Error(`Unexpected content type: ${mime || 'missing'}`);
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('The image exceeds the 32 MiB safety limit.');
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > MAX_BYTES) throw new Error('The image exceeds the 32 MiB safety limit.');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.length < 512) throw new Error('The response is unexpectedly small for a coin photograph.');
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!(jpeg || png || webp)) throw new Error('The file signature is not a supported photograph.');
  const relative = path.join('.cache/originals', `${id}.${extension}`);
  await writeFile(path.join(root, `${relative}.tmp`), bytes);
  await rename(path.join(root, `${relative}.tmp`), path.join(root, relative));
  cacheIndex[id] = {path: relative, sourceUrl: url, sha256: digest(bytes), bytes: bytes.length, retrievedAt: new Date().toISOString()};
  await writeJsonAtomic(cacheIndexPath, cacheIndex);
  return {file: path.join(root, relative), bytes};
}

async function original(id, url) {
  const cached = cacheIndex[id];
  if (!force && cached?.sourceUrl === url) {
    try {
      const bytes = await readFile(path.join(root, cached.path));
      if (digest(bytes) === cached.sha256) return {file: path.join(root, cached.path), bytes, cached: true};
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return {...await fetchOriginal(id, url), cached: false};
}

async function pixelSize(file) {
  const {stdout} = await run(SIPS, ['-g', 'pixelWidth', '-g', 'pixelHeight', file]);
  const width = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!(width > 0 && height > 0)) throw new Error(`Could not read the pixel size of ${file}`);
  return {width, height};
}

/** Drop APPn metadata blocks from the tiny inline placeholder only. Full-size
 *  derivatives keep the colour profile and metadata that sips carries over. */
function stripAppMarkers(bytes) {
  const parts = [bytes.subarray(0, 2)];
  let index = 2;
  while (index < bytes.length - 1 && bytes[index] === 0xff) {
    const marker = bytes[index + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { index += 2; continue; }
    const length = bytes.readUInt16BE(index + 2);
    if (marker === 0xda) { parts.push(bytes.subarray(index)); return Buffer.concat(parts); }
    if (!(marker >= 0xe0 && marker <= 0xef)) parts.push(bytes.subarray(index, index + 2 + length));
    index += 2 + length;
  }
  return bytes;
}

async function resample(source, width, quality, extra = []) {
  const scratch = path.join(derivedDirectory, `.derive-${process.pid}-${width}.tmp.jpg`);
  await rm(scratch, {force: true});
  await run(SIPS, ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality), '--resampleWidth', String(width), ...extra, source, '--out', scratch]);
  const bytes = await readFile(scratch);
  const size = await pixelSize(scratch);
  await rm(scratch, {force: true});
  return {bytes, ...size};
}

const summary = [];
const failures = [];
const images = Object.entries(data.images).filter(([id, image]) =>
  image.reuseStatus !== 'review-pending' && (!only || only.includes(id)));
const skipped = Object.entries(data.images).filter(([, image]) => image.reuseStatus === 'review-pending');
const manifest = {
  generatedAt: new Date().toISOString(),
  tool: `${SIPS} (${sipsVersion})`,
  settings: {
    format: 'jpeg', quality: QUALITY, widths: WIDTHS, extraWidths: EXTRA_WIDTHS,
    placeholderWidth: PLACEHOLDER_WIDTH, placeholderQuality: PLACEHOLDER_QUALITY,
    rule: 'A requested width larger than the source is skipped; nothing is ever enlarged.',
    excluded: 'Photographs whose reuseStatus is review-pending are not downloaded or derived.',
  },
  images: {},
};

// Sequential requests avoid hammering museum and community image servers.
for (const [id, image] of images) {
  try {
    const source = await original(id, image.url);
    const sourceSha = digest(source.bytes);
    const size = await pixelSize(source.file);
    const requested = [...new Set([...WIDTHS, ...(EXTRA_WIDTHS[id] || [])])].sort((a, b) => a - b);
    const widths = requested.filter((width) => width <= size.width);
    // A source narrower than the smallest display width still gets one
    // self-hosted copy, re-encoded at its own size. Never enlarged.
    if (!widths.length) widths.push(size.width);
    const settings = `format jpeg, formatOptions ${QUALITY}, --resampleWidth`;
    const reusable = !force && previous?.images[id];
    const unchanged = reusable && reusable.sourceSha256 === sourceSha && reusable.settings === settings
      && JSON.stringify(reusable.requestedWidths) === JSON.stringify(widths)
      && Boolean(reusable.placeholder) === PLACEHOLDER_IDS.includes(id)
      && (await Promise.all(reusable.derivatives.map(async (derivative) => {
        try { return (await stat(path.join(root, derivative.path))).size === derivative.bytes; }
        catch { return false; }
      }))).every(Boolean);

    if (unchanged) {
      manifest.images[id] = reusable;
      summary.push({id, source: source.bytes.length, derived: reusable.derivatives,
        state: reusable.derivatives.length ? 'reused' : 'hotlinked (no smaller copy)'});
      continue;
    }

    const candidates = [];
    for (const width of widths) {
      const output = await resample(source.file, width, QUALITY);
      candidates.push({width: output.width, height: output.height, bytes: output.bytes, sha256: digest(output.bytes)});
    }
    // A already-small source can re-encode larger than it started. Shipping that
    // would be a transformation without a benefit, so the photograph keeps its
    // existing display URL instead.
    const derivatives = [];
    for (const candidate of candidates.filter((entry) => entry.bytes.length < source.bytes.length)) {
      const relative = `public/images/derived/${id}-${candidate.width}-${candidate.sha256.slice(0, 8)}.jpg`;
      await writeFile(path.join(root, `${relative}.tmp`), candidate.bytes);
      await rename(path.join(root, `${relative}.tmp`), path.join(root, relative));
      derivatives.push({width: candidate.width, height: candidate.height, path: relative, bytes: candidate.bytes.length, sha256: candidate.sha256});
    }

    let placeholder = null;
    if (PLACEHOLDER_IDS.includes(id)) {
      const tiny = await resample(source.file, PLACEHOLDER_WIDTH, PLACEHOLDER_QUALITY, ['--deleteColorManagementProperties']);
      const trimmed = stripAppMarkers(tiny.bytes);
      const dataUri = `data:image/jpeg;base64,${trimmed.toString('base64')}`;
      if (dataUri.length > MAX_PLACEHOLDER_BYTES) throw new Error(`Placeholder is ${dataUri.length} bytes; the budget is ${MAX_PLACEHOLDER_BYTES}.`);
      placeholder = {width: tiny.width, height: tiny.height, bytes: trimmed.length, uriBytes: dataUri.length, dataUri};
    }

    manifest.images[id] = {
      id, sourceUrl: image.url, sourceBytes: source.bytes.length, sourceSha256: sourceSha,
      sourceWidth: size.width, sourceHeight: size.height, license: image.license, credit: image.credit,
      reuseStatus: image.reuseStatus || 'see-source-record',
      tool: `${SIPS} (${sipsVersion})`, settings, requestedWidths: widths,
      widths: derivatives.map((derivative) => derivative.width), derivatives, placeholder,
    };
    summary.push({id, source: source.bytes.length, derived: derivatives,
      state: derivatives.length ? 'built' : 'hotlinked (no smaller copy)'});
  } catch (error) {
    failures.push({id, error: error.message});
    console.error(`FAILED ${id}: ${error.message}`);
    if (previous?.images[id]) manifest.images[id] = previous.images[id];
  }
}

if (failures.length) {
  console.error(`${failures.length} photograph(s) could not be derived. No substitute or enhanced image was produced.`);
  console.error('Fix the network or source problem and rerun; existing derivatives are unchanged.');
  process.exitCode = 1;
}

// A rerun that changes nothing should also leave the manifest byte-identical.
const identical = previous && JSON.stringify(previous.settings) === JSON.stringify(manifest.settings)
  && JSON.stringify(previous.images) === JSON.stringify(manifest.images) && previous.tool === manifest.tool;
if (identical) manifest.generatedAt = previous.generatedAt;
await writeJsonAtomic(manifestPath, manifest);

// Remove superseded derivatives so the immutable-cache directory stays exact.
const referenced = new Set(Object.values(manifest.images).flatMap((record) => record.derivatives.map((d) => path.basename(d.path))));
let pruned = 0;
for (const entry of await readdir(derivedDirectory)) {
  if (entry === 'manifest.json' || referenced.has(entry)) continue;
  if (!/^[a-z0-9-]+-\d+-[0-9a-f]{8}\.jpg$/.test(entry) && !/\.tmp$|^\.derive-.*\.tmp\.jpg$/.test(entry)) continue;
  await rm(path.join(derivedDirectory, entry));
  pruned++;
}

const kib = (bytes) => `${(bytes / 1024).toFixed(0)} KiB`;
const rows = summary.map((row) => {
  const total = row.derived.reduce((sum, derivative) => sum + derivative.bytes, 0);
  const largest = row.derived.at(-1);
  return [
    row.id,
    `${row.source.toLocaleString('en-US')} B (${kib(row.source)})`,
    row.derived.map((d) => `${d.width}px ${kib(d.bytes)}`).join(', '),
    `${total.toLocaleString('en-US')} B`,
    largest ? `${(largest.bytes / row.source * 100).toFixed(1)}%` : '—',
    row.state,
  ];
});
const header = ['id', 'source original', 'derivatives', 'derived total', 'largest / source', 'state'];
const widths = header.map((label, column) => Math.max(label.length, ...rows.map((row) => row[column].length)));
const line = (cells) => cells.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd();
console.log(line(header));
console.log(widths.map((width) => '-'.repeat(width)).join('  '));
rows.forEach((row) => console.log(line(row)));
const sourceTotal = summary.reduce((sum, row) => sum + row.source, 0);
const derivedTotal = summary.reduce((sum, row) => sum + row.derived.reduce((inner, d) => inner + d.bytes, 0), 0);
console.log(`\n${summary.length} photograph(s) derived; originals ${kib(sourceTotal)} → derivatives ${kib(derivedTotal)} on disk.`);
console.log(`${skipped.length} reuse-review-pending photograph(s) skipped and still hotlinked: ${skipped.map(([id]) => id).join(', ')}.`);
if (pruned) console.log(`Removed ${pruned} superseded derivative file(s).`);
console.log('Credits, licenses and reuse statuses are unchanged. The linked full-resolution originals are untouched.');
