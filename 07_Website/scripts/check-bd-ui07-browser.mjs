import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const endpoint = process.env.BD_UI07_CDP_ENDPOINT ?? 'http://127.0.0.1:9247';
const site = process.env.BD_UI07_AFTER_ENDPOINT ?? 'http://127.0.0.1:4357';
const target = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let id = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const entry = pending.get(message.id);
  pending.delete(message.id);
  message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
});
function cdp(method, params = {}) {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  return result.result.value;
}

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
await cdp('Page.navigate', { url: `${site}/a2/unit-1/grammar/g01/` });
await delay(900);

const drawerOpen = await evaluate(`(()=>{const button=document.querySelector('[data-bd-drawer-open]');button.click();return {open:document.querySelector('#bd-course-drawer').classList.contains('is-open'),expanded:button.getAttribute('aria-expanded'),focus:document.activeElement?.getAttribute('aria-label')}})()`);
assert.deepEqual(drawerOpen, { open: true, expanded: 'true', focus: 'Close course outline' });
await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
await delay(80);
const drawerClosed = await evaluate(`(()=>{const button=document.querySelector('[data-bd-drawer-open]');return {open:document.querySelector('#bd-course-drawer').classList.contains('is-open'),expanded:button.getAttribute('aria-expanded'),focus:document.activeElement===button}})()`);
assert.deepEqual(drawerClosed, { open: false, expanded: 'false', focus: true });

const search = await evaluate(`(()=>{const q=document.querySelector('#bd-course-search');q.value='irregular';q.dispatchEvent(new Event('input',{bubbles:true}));const r=document.querySelector('#bd-search-results');return {expanded:q.getAttribute('aria-expanded'),hidden:r.hidden,count:r.querySelectorAll('[role="option"]').length,first:r.querySelector('[role="option"] strong')?.textContent}})()`);
assert.equal(search.expanded, 'true');
assert.equal(search.hidden, false);
assert.ok(search.count >= 1);

const hintKeyboard = await evaluate(`(()=>{const button=document.querySelector('.practice .bd07-hint__button');button.focus();button.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));button.click();return {buttonFocused:document.activeElement===button,open:!button.closest('[data-hint]').querySelector('.bd07-hint__panel').hidden,expanded:button.getAttribute('aria-expanded')}})()`);
assert.equal(hintKeyboard.open, true);
assert.equal(hintKeyboard.expanded, 'true');

const result = {
  checkedAt: new Date().toISOString(),
  viewport: '390x844 Chrome emulation',
  drawerOpen,
  drawerClosed,
  search,
  hintKeyboard,
  status: 'pass',
  note: 'Browser emulation and keyboard event checks; not a physical-device or screen-reader test.',
};
await writeFile(new URL('../../browser-interactions.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
socket.close();
console.log('BD-UI-07 browser interaction checks passed: mobile drawer focus/escape, course search and keyboard-operable hint.');
