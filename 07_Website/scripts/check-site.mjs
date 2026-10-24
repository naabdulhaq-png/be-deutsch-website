import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = path.join(websiteRoot, 'dist');
const origin = 'https://www.bedeutsch.de';
const pages = new Map([
  ['index.html', '/'],
  ['app/index.html', '/app/'],
  ['testing/index.html', '/testing/'],
  ['about/index.html', '/about/'],
  ['partners/index.html', '/partners/'],
  ['support/index.html', '/support/'],
  ['privacy/index.html', '/privacy/'],
  ['impressum/index.html', '/impressum/'],
  ['404.html', '/404.html'],
]);

const failures = [];
const titles = new Map();
const descriptions = new Map();
const pageHtml = new Map();
const checkedTargets = new Set();

const attributes = (tag) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));

const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);

const metadata = (html, key, value) => {
  for (const tag of tags(html, 'meta')) {
    const attrs = attributes(tag);
    if (attrs[key] === value) return attrs.content;
  }
  return undefined;
};

const links = (html) => tags(html, 'link').map(attributes);

const expectedFile = (urlPath) => {
  if (urlPath === '/') return path.join(distRoot, 'index.html');
  if (urlPath.endsWith('/')) return path.join(distRoot, urlPath.slice(1), 'index.html');
  return path.join(distRoot, urlPath.slice(1));
};

const exists = async (target) => {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
};

for (const [relativeFile, route] of pages) {
  const file = path.join(distRoot, relativeFile);
  if (!(await exists(file))) {
    failures.push(`Missing built page: ${relativeFile}`);
    continue;
  }

  const html = await readFile(file, 'utf8');
  pageHtml.set(route, html);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const description = metadata(html, 'name', 'description');
  const canonical = links(html).find((link) => link.rel === 'canonical')?.href;
  const expectedCanonical = new URL(route, `${origin}/`).href;
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));

  if (!title) failures.push(`${route}: missing title`);
  if (!description) failures.push(`${route}: missing meta description`);
  if (title) titles.set(title, [...(titles.get(title) ?? []), route]);
  if (description) descriptions.set(description, [...(descriptions.get(description) ?? []), route]);
  if (canonical !== expectedCanonical) failures.push(`${route}: canonical is ${canonical ?? 'missing'}`);
  if (h1Count !== 1) failures.push(`${route}: expected one H1, found ${h1Count}`);
  if (!/<html\s+lang="en"\s+dir="ltr">/i.test(html)) failures.push(`${route}: missing English LTR document language`);
  if (route === '/404.html' && metadata(html, 'name', 'robots') !== 'noindex,follow') {
    failures.push('/404.html: missing noindex directive');
  }

  for (let index = 1; index < headingLevels.length; index += 1) {
    if (headingLevels[index] - headingLevels[index - 1] > 1) {
      failures.push(`${route}: heading level jumps from H${headingLevels[index - 1]} to H${headingLevels[index]}`);
    }
  }

  for (const [key, value] of [
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['property', 'og:url'],
    ['property', 'og:image'],
    ['name', 'twitter:card'],
    ['name', 'twitter:title'],
    ['name', 'twitter:description'],
    ['name', 'twitter:image'],
  ]) {
    if (!metadata(html, key, value)) failures.push(`${route}: missing ${value}`);
  }

  for (const image of tags(html, 'img')) {
    if (!Object.hasOwn(attributes(image), 'alt')) failures.push(`${route}: image without alt attribute`);
  }

  for (const tag of [...tags(html, 'a'), ...tags(html, 'link'), ...tags(html, 'script'), ...tags(html, 'img'), ...tags(html, 'source')]) {
    const attrs = attributes(tag);
    if (attrs.target === '_blank' && !/\bnoopener\b/.test(attrs.rel ?? '')) {
      failures.push(`${route}: new-tab link missing noopener`);
    }
    const references = [attrs.href, attrs.src, ...(attrs.srcset?.split(',').map((item) => item.trim().split(/\s+/)[0]) ?? [])];
    for (const reference of references) {
      if (!reference || /^(mailto:|tel:|data:)/i.test(reference)) continue;
      const url = new URL(reference.replaceAll('&amp;', '&'), `${origin}${route}`);
      if (url.origin !== origin) continue;
      checkedTargets.add(`${url.pathname}${url.hash}`);
      const target = expectedFile(url.pathname);
      if (!(await exists(target))) {
        failures.push(`${route}: missing internal target ${reference}`);
      } else if (url.hash) {
        const targetHtml = await readFile(target, 'utf8');
        if (!targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) {
          failures.push(`${route}: missing fragment target ${reference}`);
        }
      }
    }
  }

  const forbidden = [
    ['localhost', /localhost|127\.0\.0\.1/i],
    ['preview route', /preview-option-a/i],
    ['disabled locale', /href="\/fa\//i],
    ['webmaster address', /webmaster@bedeutsch\.de/i],
    ['private filesystem path', /[A-Z]:\\/i],
    ['unsupported schema claim', /aggregateRating|reviewCount|downloadCount/i],
  ];
  for (const [label, pattern] of forbidden) {
    if (pattern.test(html)) failures.push(`${route}: contains ${label}`);
  }
}

for (const [title, routes] of titles) {
  if (routes.length > 1) failures.push(`Duplicate title on ${routes.join(', ')}: ${title}`);
}
for (const [description, routes] of descriptions) {
  if (routes.length > 1) failures.push(`Duplicate description on ${routes.join(', ')}: ${description}`);
}

const robots = await readFile(path.join(distRoot, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://www.bedeutsch.de/sitemap-index.xml')) failures.push('robots.txt has an invalid sitemap URL');
if (/Disallow:\s*\//i.test(robots)) failures.push('robots.txt blocks the production site');

const cname = (await readFile(path.join(distRoot, 'CNAME'), 'utf8')).trim();
if (cname !== 'www.bedeutsch.de') failures.push(`CNAME is ${cname || 'empty'}`);

const sitemapFiles = (await readdir(distRoot)).filter((file) => file.startsWith('sitemap') && file.endsWith('.xml'));
if (!sitemapFiles.includes('sitemap-index.xml')) failures.push('Missing sitemap-index.xml');
const sitemap = (await Promise.all(sitemapFiles.map((file) => readFile(path.join(distRoot, file), 'utf8')))).join('\n');
if (!sitemap.includes('https://www.bedeutsch.de/')) failures.push('Sitemap does not use the www canonical host');
for (const route of pages.values()) {
  if (route !== '/404.html' && !sitemap.includes(`<loc>${origin}${route}</loc>`)) {
    failures.push(`Sitemap is missing ${route}`);
  }
}
if (/localhost|preview-option-a|\/fa\/|\/404(?:\.html)?</i.test(sitemap)) failures.push('Sitemap contains a non-public URL');

const assertLink = (route, label, href) => {
  const anchors = [...(pageHtml.get(route) ?? '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  if (!anchors.some((match) => attributes(match[1]).href === href && match[2].replace(/<[^>]+>/g, '').trim().startsWith(label))) {
    failures.push(`${route}: missing ${label} link to ${href}`);
  }
};

for (const route of ['/', '/app/', '/partners/', '/support/']) {
  assertLink(route, 'Become a Beta Tester', '/testing/');
  if (/Coming soon on Google Play|Release candidate complete locally|Verification and public release pending|Prelaunch stage/i.test(pageHtml.get(route) ?? '')) {
    failures.push(`${route}: outdated availability wording`);
  }
}
assertLink('/', 'Explore the App', '/app/');
assertLink('/testing/', 'Join the Tester Group', 'https://groups.google.com/g/be-deutsch-testers');
assertLink('/testing/', 'Open Google Play Testing', 'https://play.google.com/apps/testing/com.bedeutsch.app');
assertLink('/testing/', 'Send Tester Feedback', 'mailto:support@bedeutsch.de?subject=Be%20Deutsch%20beta%20feedback');
const testingHtml = pageHtml.get('/testing/') ?? '';
if (/<form\b/i.test(testingHtml)) failures.push('/testing/: unexpected registration form');
for (const [route, html] of pageHtml) {
  if (/href="https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.bedeutsch\.app/i.test(html)) {
    failures.push(`${route}: unconditional store link before public release`);
  }
}

if (failures.length > 0) {
  console.error('Site validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Site validation passed for ${pages.size} routes and ${checkedTargets.size} internal destinations/fragments, with unique metadata, valid tester CTAs and production-safe URLs.`);
