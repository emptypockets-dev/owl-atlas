/** Stage only public website files. Does not deploy or download anything. */
import {readFile, writeFile, mkdir, mkdtemp, copyFile, rm, rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const match = html.match(/<script\b[^>]*\bid="atlas-data"[^>]*>([\s\S]*?)<\/script>/i);
if (!match) throw new Error('Built atlas-data is missing. Run npm run build first.');
const data = JSON.parse(match[1]);
const stage = await mkdtemp(path.join(root, '.deploy-stage-'));
let localCount = 0;
try {
  await writeFile(path.join(stage, 'index.html'), html);
  await mkdir(path.join(stage, 'pricing'));
  await copyFile(path.join(root, 'pricing/index.html'), path.join(stage, 'pricing/index.html'));
  await copyFile(path.join(root, 'LICENSE'), path.join(stage, 'LICENSE.txt'));
  await copyFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(stage, 'THIRD_PARTY_NOTICES.txt'));
  // Explicitly publish only the source-linked market observations, not research notes.
  await mkdir(path.join(stage, 'data'));
  for (const extension of ['json','csv']) {
    await copyFile(path.join(root, 'research', `market-sales.${extension}`), path.join(stage, 'data', `owl-sales.${extension}`));
  }
  for (const asset of ['favicon.svg', 'robots.txt', 'sitemap.xml']) {
    await copyFile(path.join(root, 'public', asset), path.join(stage, asset));
  }
  for (const [id, image] of Object.entries(data.images)) {
    if (!image.localUrl) continue;
    // Only copy the build's explicit image files, never arbitrary source paths.
    if (!/^public\/images\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(image.localUrl)) {
      throw new Error(`Unsafe or unsupported local image path for ${id}: ${image.localUrl}`);
    }
    const destination = path.join(stage, image.localUrl);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(path.join(root, image.localUrl), destination);
    localCount++;
  }
  const dist = path.join(root, 'dist');
  await rm(dist, {recursive: true, force: true});
  await rename(stage, dist);
  const imageCount = Object.keys(data.images).length;
  const pending = Object.values(data.images).filter(image => image.reuseStatus === 'review-pending').length;
  console.log(`Prepared dist/: ${localCount}/${imageCount} local image files. No deployment performed.`);
  if (localCount < imageCount) console.warn('Photographs still require external hosts. Verify live delivery before launch.');
  if (pending) console.warn(`${pending} image records retain unresolved reuse-review flags. Staging is not publication clearance.`);
} catch (error) {
  await rm(stage, {recursive: true, force: true});
  throw error;
}
