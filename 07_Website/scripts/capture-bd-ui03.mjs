import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = process.env.BD_UI03_SCREENSHOT_DIR
  ?? 'K:\\Be Deutsch\\outputs\\BD-UI-03\\visual-comparison\\implementation';
const browserEndpoint = process.env.BD_UI03_CDP_ENDPOINT ?? 'http://127.0.0.1:9224';
const siteEndpoint = process.env.BD_UI03_SITE_ENDPOINT ?? 'http://127.0.0.1:4322';

const pages = [
  ['a1-vocabulary', '/vocabulary/lesson-01/'],
  ['a1-grammar', '/grammar/lesson-01/'],
  ['a1-listening', '/listening/ht01/'],
  ['a1-podcast', '/podcasts/ein-morgen/'],
  ['a2-vocabulary', '/a2/unit-1/vocabulary/v01/'],
  ['a2-grammar', '/a2/unit-1/grammar/g01/'],
  ['a2-listening', '/a2/unit-1/listening/l01/'],
  ['a2-podcast', '/a2/unit-1/podcast/'],
  ['homepage', '/'],
  ['course-overview', '/a2/unit-1/'],
];

await mkdir(outputDirectory, { recursive: true });

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
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
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

async function capture(filename, route, width, height, mobile) {
  await cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await cdp('Page.navigate', { url: `${siteEndpoint}${route}` });
  await new Promise((resolve) => setTimeout(resolve, 850));
  await cdp('Runtime.evaluate', {
    awaitPromise: true,
    expression: `Promise.race([
      Promise.all([
        document.fonts?.ready,
        ...Array.from(document.images)
          .filter((image) => { const box = image.getBoundingClientRect(); return box.bottom >= 0 && box.top <= innerHeight; })
          .map((image) => image.decode?.().catch(() => undefined))
      ]),
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]).then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))`,
  });
  const { data } = await cdp('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(path.join(outputDirectory, filename), Buffer.from(data, 'base64'));
}

await cdp('Page.enable');
for (const [name, route] of pages) {
  await capture(`${name}--desktop-1680x945.png`, route, 1680, 945, false);
  await capture(`${name}--mobile-390x844.png`, route, 390, 844, true);
}

socket.close();
console.log(`Captured ${pages.length * 2} BD-UI-03 screenshots at ${outputDirectory}`);
