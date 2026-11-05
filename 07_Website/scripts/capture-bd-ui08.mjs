import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const browserEndpoint = process.env.BD_UI08_CDP_ENDPOINT ?? 'http://127.0.0.1:9248';
const siteEndpoint = process.env.BD_UI08_SITE_ENDPOINT ?? 'http://127.0.0.1:4328';
const output = path.join(root, 'screenshots');

const desktop = [
  { name: '01-a2-course-overview', route: '/a2/' },
  { name: '02-unit-1-preserved-listening', route: '/a2/unit-1/listening/l01/', selector: '.compact-listening', offset: 88 },
  { name: '03-unit-2-vocabulary-arabic', route: '/a2/unit-2/vocabulary/v01/', selector: '.bd08-vocab-browser', offset: 92, prepare: `document.querySelector('[data-support-language="ar"]')?.click()` },
  { name: '04-unit-2-grammar-table', route: '/a2/unit-2/grammar/g01/', selector: '.bd08-structure', offset: 92 },
  { name: '05-unit-2-grammar-hint', route: '/a2/unit-2/grammar/g01/', selector: '.bd08-practice-section', offset: 92, prepare: `document.querySelector('[data-exercise-hint]')?.click()` },
  { name: '06-new-listening-pending-transcript', route: '/a2/unit-2/listening/l01/', selector: '.bd08-listening', offset: 92, prepare: `document.querySelectorAll('[data-passage-select]')[1]?.click();document.querySelector('[data-passage-panel]:not([hidden]) details summary')?.click()` },
  { name: '07-new-podcast-chapters', route: '/a2/unit-2/podcast/a2-p02/', selector: '.bd08-podcast', offset: 92, prepare: `document.querySelectorAll('[data-chapter-select]')[3]?.click()` },
  { name: '08-unit-2-revision', route: '/a2/unit-2/revision/', selector: '.bd08-practice-section', offset: 92 },
  { name: '09-reviewer-inspection-index', route: '/a2/review-index/', selector: '.bd08-review-tools', offset: 36 }
];

await mkdir(output, { recursive: true });
const target = await fetch(`${browserEndpoint}/json/new?about:blank`, { method: 'PUT' }).then(async response => {
  if (!response.ok) throw new Error(`CDP target creation failed: ${response.status}`);
  return response.json();
});
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let id = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push({ type: 'exception', text: message.params.exceptionDetails.text });
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push({ type: 'console', text: message.params.entry.text });
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
});
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  pending.set(requestId, { resolve, reject });
  socket.send(JSON.stringify({ id: requestId, method, params }));
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const evaluate = async expression => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
async function navigate(route, width, height, mobile = false) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
  await cdp('Page.navigate', { url: `${siteEndpoint}${route}` });
  await wait(700);
  await evaluate(`Promise.race([document.fonts?.ready,new Promise(resolve=>setTimeout(resolve,1600))]).then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))`);
}
async function capture(spec, width = 1440, height = 960, mobile = false) {
  const errorStart = errors.length;
  await navigate(spec.route, width, height, mobile);
  if (spec.prepare) {
    await evaluate(spec.prepare);
    await wait(250);
  }
  if (spec.selector) await evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(spec.selector)});if(node)scrollTo(0,Math.max(0,node.getBoundingClientRect().top+scrollY-${spec.offset ?? 80}));})()`);
  else await evaluate('scrollTo(0,0)');
  await wait(200);
  const metrics = await evaluate(`(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    audioSources: Array.from(document.querySelectorAll('audio')).map(node => node.getAttribute('src')),
    pendingAudio: document.body.innerText.includes('Audio recording pending') || document.body.innerText.includes('No playable file yet'),
    supportLanguage: document.body.dataset.supportLanguage ?? null,
    supportDirection: document.body.dataset.supportDirection ?? null,
    visibleChapter: document.querySelector('[data-chapter-panel]:not([hidden])')?.getAttribute('data-chapter-panel') ?? null,
    drawerVisible: (() => { const drawer=document.querySelector('#bd-course-drawer'); return drawer ? getComputedStyle(drawer).transform === 'matrix(1, 0, 0, 1, 0, 0)' : null; })()
  }))()`);
  const image = await cdp('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(path.join(output, `${spec.name}.png`), Buffer.from(image.data, 'base64'));
  return { name: spec.name, route: spec.route, viewport: `${width}x${height}`, ...metrics, consoleErrors: errors.slice(errorStart) };
}

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Log.enable');
const results = [];
for (const spec of desktop) results.push(await capture(spec));
results.push(await capture({ name: '10-mobile-sidebar-navigation', route: '/a2/unit-2/grammar/g01/', prepare: `document.querySelector('[data-bd-drawer-open]')?.click()` }, 390, 844, true));
await writeFile(path.join(output, 'BROWSER_QA_RESULTS.json'), JSON.stringify({ generated: new Date().toISOString(), results, totalConsoleErrors: errors.length }, null, 2) + '\n');
socket.close();
console.log(JSON.stringify({ screenshots: results.length, overflowFailures: results.filter(item => item.overflow).length, consoleErrors: errors.length }, null, 2));

