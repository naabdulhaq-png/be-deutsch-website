import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareRouteSets, requiredPublicRoutes, requiredSitemapRoutes, reviewOnlyRoutes } from './release-route-contract.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifact = path.resolve(sourceRoot, '..', 'release-dist');
const manifestRoot = path.resolve(sourceRoot, '..', 'manifests');
const fail = message => { throw new Error(message); };
const walk = root => {
  const files = [];
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  };
  visit(root);
  return files;
};
const routeOf = file => { const rel = path.relative(artifact, file).replaceAll('\\', '/'); return rel === 'index.html' ? '/' : rel === '404.html' ? '/404' : `/${rel.replace(/\/index\.html$/, '/')}`; };
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const files = walk(artifact), htmlFiles = files.filter(file => file.endsWith('.html'));
const routes = new Set(htmlFiles.map(routeOf));
const comparison = compareRouteSets(routes);
assert.deepEqual(comparison, { missing: [], unexpected: [], forbidden: [] });
assert.equal(routes.size, 240, 'Expected the reconciled 240 public HTML routes');

const sitemap = readFileSync(path.join(artifact, 'sitemap-0.xml'), 'utf8');
const sitemapRoutes = new Set([...sitemap.matchAll(/<loc>https:\/\/www\.bedeutsch\.de([^<]*)<\/loc>/g)].map(match => match[1] || '/'));
assert.deepEqual([...requiredSitemapRoutes].filter(route => !sitemapRoutes.has(route)), [], 'Sitemap is missing required routes');
assert.deepEqual([...sitemapRoutes].filter(route => !requiredSitemapRoutes.has(route)), [], 'Sitemap contains unexpected routes');
assert.equal(sitemapRoutes.size, 238, 'Expected 238 sitemap routes');

for (const route of reviewOnlyRoutes) {
  assert(!routes.has(route), `Review-only route leaked into release artifact: ${route}`);
  assert(!sitemapRoutes.has(route), `Review-only route leaked into sitemap: ${route}`);
}

for (const file of htmlFiles) {
  const route = routeOf(file), html = readFileSync(file, 'utf8');
  if (route !== '/404') {
    assert(!/noindex,nofollow/.test(html), `${route}: public page is noindex`);
    assert(!/Local A2 audio integration candidate|Local review candidate|review drafts|Reviewer inspection index|Local-only owner review candidate/i.test(html), `${route}: local-review wording remains`);
  }
  for (const reviewRoute of reviewOnlyRoutes) assert(!html.includes(`href="${reviewRoute}"`), `${route}: links to excluded ${reviewRoute}`);
  assert(!/localhost|127\.0\.0\.1|file:\/\/|\b[A-Z]:\\|xi-api-key|ELEVENLABS_API_KEY/i.test(html), `${route}: local path, URL or credential marker`);
}

const audio = JSON.parse(readFileSync(path.join(sourceRoot, 'src', 'a2', 'data', 'audio-library.generated.json'), 'utf8'));
const assets = [...audio.listening.map(x => ({ ...x, route: x.route })), ...audio.podcasts.flatMap(e => [{ ...e, route: e.route }, ...e.chapters.map(c => ({ ...c, contentId: `${e.contentId}::${c.chapterId}`, route: e.route }))])];
assert.equal(audio.listening.length, 24); assert.equal(audio.podcasts.length, 5); assert.equal(audio.podcasts.reduce((n, x) => n + x.chapters.length, 0), 30); assert.equal(assets.length, 59);
for (const asset of assets) {
  const file = path.join(artifact, ...asset.url.split('/').filter(Boolean));
  if (!existsSync(file)) fail(`Missing audio: ${asset.contentId}`);
  assert.equal(hash(file), asset.sha256, `Audio hash mismatch: ${asset.contentId}`);
  const page = path.join(artifact, ...asset.route.split('#')[0].split('/').filter(Boolean), 'index.html');
  const html = readFileSync(page, 'utf8');
  assert.equal(html.split(asset.url).length - 1, 1, `Expected one reference for ${asset.contentId}`);
}

for (const file of files) assert(!/\.(?:zip|xlsx|map|pem|key|pfx|p12|env|log)$/i.test(file), `Forbidden artifact file: ${file}`);
const release = JSON.parse(readFileSync(path.join(artifact, 'a2-release.json'), 'utf8'));
assert.equal(release.releaseId, 'BD-A2-FULL-WEB-RC1-2026-11-05');
assert.equal(release.publicationAuthorized, release.deploymentAuthorized, 'Publication and deployment authorization must agree');
if (release.publicationAuthorized) assert.ok(release.authorizationReference, 'Authorized publication requires an owner authorization reference');
else assert.equal(release.authorizationReference, null, 'Unauthorized release candidate must not contain an authorization reference');

const report = { status: 'PASS', artifact, htmlPages: routes.size, sitemapEntries: sitemapRoutes.size, requiredRoutes: [...requiredPublicRoutes].sort(), sitemapRoutes: [...sitemapRoutes].sort(), excludedReviewRoutes: [...reviewOnlyRoutes].sort(), audio: { total: 59, listening: 24, podcastChapters: 30, podcastMasters: 5 } };
writeFileSync(path.join(manifestRoot, 'PUBLIC_ROUTE_MANIFEST.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, htmlPages: report.htmlPages, sitemapEntries: report.sitemapEntries, audio: report.audio }, null, 2));
