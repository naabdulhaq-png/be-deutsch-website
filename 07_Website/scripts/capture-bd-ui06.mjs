import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.env.BD_UI06_ROOT
  ?? 'K:\\Be Deutsch\\outputs\\BD-UI-06_A2_LEARNER_EXPERIENCE_REPAIR';
const outputDirectory = path.join(root, 'before-after', 'after');
const browserEndpoint = process.env.BD_UI06_CDP_ENDPOINT ?? 'http://127.0.0.1:9236';
const siteEndpoint = process.env.BD_UI06_SITE_ENDPOINT ?? 'http://127.0.0.1:4346';

const desktop = [
  { name: 'vocabulary-organized', route: '/a2/unit-1/vocabulary/v01/', selector: '#A2-U01-V01-X04', offset: 230 },
  { name: 'grammar-haben-organized', route: '/a2/unit-1/grammar/g01/' },
  { name: 'listening-weekend-update', route: '/a2/unit-1/listening/l01/', selector: '.passage-card' },
  { name: 'listening-experience-story', route: '/a2/unit-1/listening/l02/', selector: '.passage-card' },
  { name: 'podcast-landing', route: '/a2/unit-1/podcast/' },
  {
    name: 'podcast-chapter-controls',
    route: '/a2/unit-1/podcast/',
    selector: '.chapter-workspace',
    prepare: `
      document.querySelector('[data-chapter-tab="3"]')?.click();
      const support = document.querySelector('.study-support');
      if (support && !support.checked) support.click();
      document.querySelector('#chapter-3 .gated-transcript summary')?.click();
    `,
  },
];

const mobile = [
  { name: 'vocabulary-mobile', route: '/a2/unit-1/vocabulary/v01/' },
  { name: 'grammar-mobile', route: '/a2/unit-1/grammar/g01/' },
  { name: 'listening-mobile', route: '/a2/unit-1/listening/l01/' },
  { name: 'podcast-mobile', route: '/a2/unit-1/podcast/' },
];

await mkdir(path.join(outputDirectory, 'desktop'), { recursive: true });
await mkdir(path.join(outputDirectory, 'mobile'), { recursive: true });

const target = await fetch(`${browserEndpoint}/json/new?about:blank`, { method: 'PUT' })
  .then((response) => {
    if (!response.ok) throw new Error(`CDP target creation failed: ${response.status}`);
    return response.json();
  });
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 0;
let currentPage = 'startup';
const pending = new Map();
const browserErrors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    browserErrors.push({ page: currentPage, type: 'exception', text: message.params.exceptionDetails.text });
  }
  if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
    browserErrors.push({ page: currentPage, type: message.params.entry.level, text: message.params.entry.text });
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function cdp(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function capture(spec, width, height, mobileMode, folder) {
  currentPage = spec.name;
  await cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: mobileMode,
    screenWidth: width,
    screenHeight: height,
  });
  await cdp('Page.navigate', { url: `${siteEndpoint}${spec.route}` });
  await delay(1000);
  await cdp('Runtime.evaluate', {
    awaitPromise: true,
    expression: `Promise.race([
      Promise.all([document.fonts?.ready, ...Array.from(document.images).map((image) => image.decode?.().catch(() => undefined))]),
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]).then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))`,
  });
  if (spec.prepare) await cdp('Runtime.evaluate', { expression: spec.prepare });
  await cdp('Runtime.evaluate', {
    expression: spec.selector
      ? `(() => { const node = document.querySelector(${JSON.stringify(spec.selector)}); if (node) window.scrollTo(0, Math.max(0, node.getBoundingClientRect().top + scrollY - ${spec.offset ?? 96})); })()`
      : 'window.scrollTo(0, 0)',
  });
  await delay(350);
  const metrics = await cdp('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => ({
      title: document.querySelector('h1')?.textContent?.trim(),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      rawReinforcement: document.body.innerText.includes('Reinforcement:'),
      repeatedGating: document.body.innerText.includes('available after the check or with study support'),
      visibleTechnicalIds: (document.body.innerText.match(/A2-U01-[GVL]\\d{2}/g) || []).length,
      passageCards: document.querySelectorAll('.passage-card').length,
      chapterTabs: document.querySelectorAll('[data-chapter-tab]').length,
      visibleChapterPanels: Array.from(document.querySelectorAll('[data-chapter-panel]')).filter((node) => !node.hidden).length
    }))()`,
  });
  const { data } = await cdp('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const filename = path.join(outputDirectory, folder, `${spec.name}.png`);
  await writeFile(filename, Buffer.from(data, 'base64'));
  return { name: spec.name, route: spec.route, viewport: `${width}x${height}`, ...metrics.result.value };
}

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Log.enable');
const results = [];
for (const spec of desktop) results.push(await capture(spec, 1680, 945, false, 'desktop'));
for (const spec of mobile) results.push(await capture(spec, 390, 844, true, 'mobile'));

await writeFile(path.join(root, 'browser-qa.json'), `${JSON.stringify({ capturedAt: new Date().toISOString(), results, browserErrors }, null, 2)}\n`);
socket.close();
console.log(`Captured ${results.length} screenshots; browser errors: ${browserErrors.length}`);
