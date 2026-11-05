import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.env.BD_UI07_ROOT ?? 'K:\\Be Deutsch\\outputs\\BD-UI-07_MULTILINGUAL_DESIGN_AND_HINTS';
const browserEndpoint = process.env.BD_UI07_CDP_ENDPOINT ?? 'http://127.0.0.1:9247';
const beforeEndpoint = process.env.BD_UI07_BEFORE_ENDPOINT ?? 'http://127.0.0.1:4356';
const afterEndpoint = process.env.BD_UI07_AFTER_ENDPOINT ?? 'http://127.0.0.1:4357';
const output = path.join(root, 'before-after');

const cases = [
  { name: 'sidebar', route: '/a2/unit-1/grammar/g01/' },
  { name: 'grammar-explanation', route: '/a2/unit-1/grammar/g01/', selector: '.topic-overview', offset: 92 },
  { name: 'sentence-structure', route: '/a2/unit-1/grammar/g01/', selector: '.structure-panel', offset: 90 },
  { name: 'guided-hint', route: '/a2/unit-1/grammar/g01/', selector: '.practice', offset: 90, prepareAfter: `document.querySelector('.practice .bd07-hint__button')?.click()` },
  { name: 'vocabulary-card', route: '/a2/unit-1/vocabulary/v01/', selector: '.vocab-card', offset: 145, prepareAfter: `document.querySelector('[data-support-language="ar"]')?.click()` },
  { name: 'listening-transcript', route: '/a2/unit-1/listening/l01/', selector: '.compact-listening', offset: 90, prepareAfter: `const s=document.querySelector('.study-support');if(s&&!s.checked)s.click();document.querySelector('[data-open-transcript]')?.click()` },
  { name: 'podcast-featured-list', route: '/a2/unit-1/podcast/', selector: '.podcast-feature', offset: 92 },
  { name: 'revision-stages', route: '/a2/unit-1/revision/', selector: '.revision-stage-grid', offset: 90 },
];

await mkdir(path.join(output, 'before'), { recursive: true });
await mkdir(path.join(output, 'after', 'desktop'), { recursive: true });
await mkdir(path.join(output, 'after', 'mobile'), { recursive: true });

const target = await fetch(`${browserEndpoint}/json/new?about:blank`, { method: 'PUT' }).then(async (response) => {
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
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push({ page: currentPage, type: 'exception', text: message.params.exceptionDetails.text });
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') browserErrors.push({ page: currentPage, type: 'error', text: message.params.entry.text });
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
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  return result.result.value;
}
async function navigate(endpoint, spec, width = 1680, height = 945, mobile = false) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
  await cdp('Page.navigate', { url: `${endpoint}${spec.route}` });
  await delay(800);
  await evaluate(`Promise.race([document.fonts?.ready,new Promise(r=>setTimeout(r,1800))]).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`);
}
async function capture(endpoint, spec, folder, after = false, width = 1680, height = 945, mobile = false) {
  currentPage = `${folder}/${spec.name}`;
  await navigate(endpoint, spec, width, height, mobile);
  if (after && spec.prepareAfter) {
    await evaluate(spec.prepareAfter);
    await delay(250);
  }
  if (spec.selector) await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(spec.selector)});if(n)scrollTo(0,Math.max(0,n.getBoundingClientRect().top+scrollY-${spec.offset ?? 90}));})()`);
  else await evaluate('scrollTo(0,0)');
  await delay(250);
  const metrics = await evaluate(`(()=>({
    title: document.querySelector('h1')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth>document.documentElement.clientWidth,
    categories: document.querySelectorAll('.bd-ui07__category').length,
    supportLanguages: new Set(Array.from(document.querySelectorAll('[data-support-language]')).map(n=>n.dataset.supportLanguage)).size,
    hintOpen: !!document.querySelector('.bd07-hint__panel:not([hidden])'),
    transcriptOpen: !!document.querySelector('.gated-transcript[open]'),
    transcriptTurns: document.querySelector('.gated-transcript[open]')?.querySelectorAll('[lang="de"]').length??0,
    duplicatePlayLabel: document.body.innerText.includes('Play Play '),
    rawIds: /Reinforcement:|A2-U01-[GVL]\\d{2}/.test(document.body.innerText)
  }))()`);
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(path.join(output, folder, `${spec.name}.png`), Buffer.from(data, 'base64'));
  return { name: spec.name, route: spec.route, viewport: `${width}x${height}`, ...metrics };
}

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Log.enable');
const results = [];
for (const spec of cases) results.push({ phase: 'before', ...(await capture(beforeEndpoint, spec, 'before')) });
for (const spec of cases) results.push({ phase: 'after', ...(await capture(afterEndpoint, spec, path.join('after', 'desktop'), true)) });

const mobileCases = [
  { name: 'grammar-mobile', route: '/a2/unit-1/grammar/g01/' },
  { name: 'vocabulary-mobile', route: '/a2/unit-1/vocabulary/v01/' },
  { name: 'listening-mobile', route: '/a2/unit-1/listening/l01/' },
  { name: 'podcast-mobile', route: '/a2/unit-1/podcast/' },
  { name: 'revision-mobile', route: '/a2/unit-1/revision/' },
];
for (const spec of mobileCases) results.push({ phase: 'after-mobile', ...(await capture(afterEndpoint, spec, path.join('after', 'mobile'), true, 390, 844, true)) });

await navigate(afterEndpoint, { route: '/a2/unit-1/grammar/g01/' }, 1280, 800, false);
const languageBefore = await evaluate(`(()=>{document.querySelector('[data-support-language="ar"]')?.click();return {selected:localStorage.getItem('be-deutsch:support-language:v1'),dir:document.querySelector('[data-support-values]')?.dir,text:document.querySelector('[data-support-values]')?.textContent}})()`);
await cdp('Page.reload');
await delay(700);
const languageAfterReload = await evaluate(`(()=>({selected:document.body.dataset.supportLanguage,pressed:document.querySelector('[data-support-language="ar"]')?.getAttribute('aria-pressed')}))()`);
await navigate(afterEndpoint, { route: '/a2/unit-1/listening/l01/' }, 1280, 800, false);
const transcriptDemo = await evaluate(`(()=>{const s=document.querySelector('.study-support');if(s&&!s.checked)s.click();document.querySelector('[data-open-transcript]')?.click();const d=document.querySelector('.gated-transcript[open]');return {open:!!d,turns:d?.querySelectorAll('[lang="de"]').length??0,passages:document.querySelectorAll('[data-passage-tab]').length}})()`);
await navigate(afterEndpoint, { route: '/a2/unit-1/podcast/' }, 1280, 800, false);
const podcastDemo = await evaluate(`(()=>{document.querySelector('[data-chapter-tab="3"]')?.click();return {chapters:document.querySelectorAll('[data-chapter-tab]').length,visiblePanels:Array.from(document.querySelectorAll('[data-chapter-panel]')).filter(n=>!n.hidden).length,selected:document.querySelector('[data-chapter-tab][aria-pressed="true"]')?.dataset.chapterTab}})()`);
await navigate(afterEndpoint, { route: '/a2/unit-1/vocabulary/v01/' }, 1280, 800, false);
const vocabularyDemo = await evaluate(`(()=>{const q=document.querySelector('#vocab-search');q.value='Ausflug';q.dispatchEvent(new Event('input',{bubbles:true}));return {cards:document.querySelectorAll('[data-vocab-card]').length,visible:Array.from(document.querySelectorAll('[data-vocab-card]')).filter(n=>!n.hidden).length,languages:new Set(Array.from(document.querySelectorAll('[data-support-language]')).map(n=>n.dataset.supportLanguage)).size}})()`);

await writeFile(path.join(root, 'browser-qa.json'), `${JSON.stringify({ capturedAt: new Date().toISOString(), results, interactions: { languageBefore, languageAfterReload, transcriptDemo, podcastDemo, vocabularyDemo }, browserErrors }, null, 2)}\n`);
socket.close();
console.log(`Captured ${results.length} screenshots; browser errors: ${browserErrors.length}`);
