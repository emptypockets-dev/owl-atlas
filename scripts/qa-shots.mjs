/** Reproducible review screenshots with the cached headless Chromium, no dependencies.
 *
 * Usage:
 *   node scripts/qa-shots.mjs --url http://localhost:8000/ --width 1440 --height 900 \
 *     --wheel 0,1000,-200 --out research/screenshots/review-desktop
 *
 * Each --wheel step dispatches real mouse-wheel events (positive = down) and then
 * captures <out>-<index>.png. --mobile enables touch/mobile emulation, --dpr sets the
 * device scale factor, --eval runs JavaScript before every capture, --wait sets the
 * settle delay in milliseconds. Prints a JSON summary. Review tooling only.
 */
import {spawn} from 'node:child_process';
import {mkdir, writeFile, readdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((list, item, index, all) => {
  if (item.startsWith('--')) list.push([item.slice(2), all[index + 1]?.startsWith('--') || all[index + 1] === undefined ? 'true' : all[index + 1]]);
  return list;
}, []));
const url = args.url || 'http://localhost:8000/';
const width = Number(args.width || 1440), height = Number(args.height || 900);
const dpr = Number(args.dpr || 1);
const mobile = args.mobile === 'true';
const wheel = String(args.wheel ?? '0').split(',').map(Number);
const settle = Number(args.wait || 900);
const out = args.out || 'research/screenshots/review';
const evaluate = args.eval;

async function findShell() {
  const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
  const entries = (await readdir(cache)).filter(name => name.startsWith('chromium_headless_shell-')).sort().reverse();
  for (const entry of entries) {
    const dir = path.join(cache, entry);
    for (const inner of await readdir(dir)) {
      if (inner.startsWith('chrome-headless-shell-mac')) return path.join(dir, inner, 'chrome-headless-shell');
    }
  }
  throw new Error('No cached chrome-headless-shell found under ~/Library/Caches/ms-playwright');
}

const shell = await findShell();
const child = spawn(shell, ['--headless', '--remote-debugging-port=0', '--hide-scrollbars', '--disable-gpu', '--no-first-run', `--window-size=${width},${height}`, 'about:blank'], {stdio: ['ignore', 'ignore', 'pipe']});
const endpoint = await new Promise((resolve, reject) => {
  let text = '';
  child.stderr.on('data', chunk => { text += chunk; const match = text.match(/DevTools listening on (ws:\/\/\S+)/); if (match) resolve(match[1]); });
  child.on('exit', code => reject(new Error(`headless shell exited with ${code}`)));
  setTimeout(() => reject(new Error('Timed out waiting for DevTools endpoint')), 15000);
});

const socket = new WebSocket(endpoint);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const pending = new Map();
const listeners = [];
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) { const {resolve, reject} = pending.get(message.id); pending.delete(message.id); message.error ? reject(new Error(message.error.message)) : resolve(message.result); }
  else if (message.method) listeners.forEach(listener => listener(message));
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const messageId = ++id; pending.set(messageId, {resolve, reject}); socket.send(JSON.stringify({id: messageId, method, params, sessionId})); });
const waitFor = (method, sessionId) => new Promise(resolve => { const listener = (message) => { if (message.method === method && message.sessionId === sessionId) { listeners.splice(listeners.indexOf(listener), 1); resolve(message.params); } }; listeners.push(listener); });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const {targetId} = await send('Target.createTarget', {url: 'about:blank'});
const {sessionId} = await send('Target.attachToTarget', {targetId, flatten: true});
await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: dpr, mobile}, sessionId);
if (mobile) await send('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5}, sessionId);
const loaded = waitFor('Page.loadEventFired', sessionId);
await send('Page.navigate', {url}, sessionId);
await loaded;
await sleep(settle);
await mkdir(path.dirname(out), {recursive: true});
const summary = [];
for (const [index, delta] of wheel.entries()) {
  if (delta) {
    const steps = Math.ceil(Math.abs(delta) / 120);
    for (let step = 0; step < steps; step++) {
      const remaining = delta - Math.sign(delta) * step * 120;
      const deltaY = Math.abs(remaining) < 120 ? remaining : Math.sign(delta) * 120;
      await send('Input.dispatchMouseEvent', {type: 'mouseWheel', x: Math.round(width / 2), y: Math.round(height / 2), deltaX: 0, deltaY}, sessionId);
      await sleep(16);
    }
  }
  await sleep(settle);
  // The custom expression may be async and may throw; both are reported, never fatal.
  const state = await send('Runtime.evaluate', {expression: `(async () => { let custom = null; ${evaluate ? `try { custom = await (async () => { ${evaluate} })(); } catch (error) { custom = {evalError: String(error && error.stack || error)}; }` : ''} const header = document.querySelector('.site-header'); const bar = document.querySelector('.chapter-bar, .chrome-utility'); return JSON.stringify({scrollY: Math.round(scrollY), html: document.documentElement.className, headerTop: header ? Math.round(header.getBoundingClientRect().top) : null, barTop: bar ? Math.round(bar.getBoundingClientRect().top) : null, custom}); })()`, awaitPromise: true, returnByValue: true}, sessionId);
  const {data} = await send('Page.captureScreenshot', {format: 'png'}, sessionId);
  const file = `${out}-${String(index + 1).padStart(2, '0')}.png`;
  await writeFile(file, Buffer.from(data, 'base64'));
  let parsed;
  try { parsed = JSON.parse(state.result.value); } catch { parsed = {unparsed: state.result, exception: state.exceptionDetails?.text}; }
  summary.push({file, delta, state: parsed});
}
console.log(JSON.stringify(summary, null, 1));
socket.close();
child.kill();
