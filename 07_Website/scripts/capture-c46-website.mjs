import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = path.resolve(websiteRoot, '..');
const outputDirectory = path.join(projectRoot, '06_Reviews', 'C46_website_brand_alignment');
const browserEndpoint = process.env.C46_CDP_ENDPOINT ?? 'http://127.0.0.1:9223';
const siteEndpoint = process.env.C46_SITE_ENDPOINT ?? 'http://127.0.0.1:4322';

await mkdir(outputDirectory, { recursive: true });

const target = await fetch(`${browserEndpoint}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json());
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

async function capture(filename, route, width, height, mobile = false, scrollToBottom = false) {
  await cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await cdp('Page.navigate', { url: `${siteEndpoint}${route}` });
  await new Promise((resolve) => setTimeout(resolve, 700));
  let clip;
  if (scrollToBottom) {
    await cdp('Runtime.evaluate', {
      expression: 'window.scrollTo(0, document.documentElement.scrollHeight)',
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const metrics = await cdp('Page.getLayoutMetrics');
    const contentHeight = metrics.cssContentSize?.height ?? metrics.contentSize.height;
    clip = { x: 0, y: Math.max(0, contentHeight - height), width, height, scale: 1 };
  }
  const { data } = await cdp('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: Boolean(clip),
    ...(clip ? { clip } : {}),
  });
  await writeFile(path.join(outputDirectory, filename), Buffer.from(data, 'base64'));
}

await cdp('Page.enable');
await Promise.all([
  capture('01_desktop_home.png', '/', 1440, 1200),
].map((job) => job));
await capture('02_mobile_home.png', '/', 390, 1200, true);
await capture('03_app_page.png', '/app/', 1440, 1200);
await capture('04_about.png', '/about/', 1440, 1000);
await capture('05_partners.png', '/partners/', 1440, 1000);
await capture('06_support.png', '/support/', 1440, 1000);
await capture('07_privacy.png', '/privacy/', 1440, 1200);
await capture('08_impressum.png', '/impressum/', 1440, 1200);
await capture('09_footer_header.png', '/support/', 1440, 1000, false, true);
await capture('10_favicon_browser_representation.png', '/favicon.svg', 480, 480);
await capture('11_compact_320_home.png', '/', 320, 900, true);
await capture('12_tablet_768_app.png', '/app/', 768, 1024, true);
await capture('13_not_found_404.png', '/404.html', 1440, 1000);

socket.close();
console.log(`Captured C46 website evidence at ${outputDirectory}`);
