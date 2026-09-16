/** Archive source-linked image files only. No scraping, upscaling, or rights changes.
 * Usage: node scripts/vendor-images.mjs [--force] [--include-review-pending]
 * Node 20+, network access required. Existing verified files are reused.
 */
import {readFile, writeFile, mkdir, rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8'));
const destination = path.join(root, 'public/images');
const manifestPath = path.join(destination, 'local-manifest.json');
const force = process.argv.includes('--force');
const includeReviewPending = process.argv.includes('--include-review-pending');
const maxBytes = 32 * 1024 * 1024;
await mkdir(destination, {recursive: true});
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const failures = [];

async function archive(id, image) {
  if (image.reuseStatus === 'review-pending' && !includeReviewPending) {
    throw new Error('Reuse review pending. Resolve publication rights first; --include-review-pending allows a deliberate research download only and does not change reuse status.');
  }
  const existing = manifest[id];
  if (!force && existing?.sourceUrl === image.url) {
    try {
      const bytes = await readFile(path.join(root, existing.path));
      if (digest(bytes) === existing.sha256) {
        console.log(`Reuse ${id} (${Math.round(bytes.length / 1024)} KiB)`);
        return;
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  console.log(`Fetch ${id}`);
  const response = await fetch(image.url, {
    signal: AbortSignal.timeout(30_000),
    headers: {'User-Agent': process.env.OWL_IMAGE_USER_AGENT || 'OwlAtlasImageArchive/0.1 (user-initiated archival download)'},
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const mime = response.headers.get('content-type')?.split(';')[0].trim();
  const extension = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[mime];
  if (!extension) throw new Error(`Unexpected content type: ${mime || 'missing'}`);
  const declaredSize = Number(response.headers.get('content-length'));
  if (declaredSize > maxBytes) throw new Error('The image exceeds the 32 MiB safety limit.');
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > maxBytes) throw new Error('The image exceeds the 32 MiB safety limit.');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.length < 512) throw new Error('The response is unexpectedly small for a coin photograph.');
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (!(jpeg || png || webp)) throw new Error('The file signature is not a supported photograph.');
  const relativePath = `public/images/${id}.${extension}`;
  const filePath = path.join(root, relativePath);
  await writeFile(`${filePath}.tmp`, bytes);
  await rename(`${filePath}.tmp`, filePath);
  manifest[id] = {path: relativePath, sourceUrl: image.url, sha256: digest(bytes), bytes: bytes.length,
    retrievedAt: new Date().toISOString(), license: image.license, licenseUrl: image.licenseUrl, credit: image.credit,
    reuseStatus: image.reuseStatus || 'see-source-record', rightsNote: image.rightsNote || null,
    rightsPolicyUrl: image.rightsPolicyUrl || null, objectUrl: image.objectUrl || null};
  await writeFile(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + '\n');
  await rename(`${manifestPath}.tmp`, manifestPath);
  console.log(`Saved ${id} (${Math.round(bytes.length / 1024)} KiB). Attribution retained.`);
}

// Sequential requests avoid hammering museum and community image servers.
for (const [id, image] of Object.entries(data.images)) {
  try { await archive(id, image); }
  catch (error) { failures.push({id, error: error.message}); console.error(`FAILED ${id}: ${error.message}`); }
}
if (failures.length) {
  console.error(`${failures.length} image(s) could not be archived. Nothing has been replaced with a substitute.\nFix the network/source problem and rerun. The existing remote-image build is unchanged.`);
  process.exitCode = 1;
} else console.log('All requested images are local. Reuse statuses are unchanged. Run: npm run build:local');
