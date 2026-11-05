import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const library = JSON.parse(readFileSync(join(root, 'src', 'a2', 'data', 'audio-library.generated.json'), 'utf8'));
const assets = [
  ...library.listening.map(item => ({ ...item, category: 'listening', route: item.route })),
  ...library.podcasts.flatMap(episode => [
    { ...episode, category: 'podcast_episode', route: episode.route },
    ...episode.chapters.map(chapter => ({ ...chapter, contentId: `${episode.contentId}::${chapter.chapterId}`, category: 'podcast_chapter', route: episode.route })),
  ]),
];
const fail = message => { throw new Error(message); };
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const routeFile = route => join(root, 'dist', ...route.split('#')[0].split('/').filter(Boolean), 'index.html');

if (library.listening.length !== 24) fail(`Expected 24 Listening assets, found ${library.listening.length}`);
if (library.podcasts.length !== 5) fail(`Expected 5 Podcast episodes, found ${library.podcasts.length}`);
if (library.podcasts.reduce((n, item) => n + item.chapters.length, 0) !== 30) fail('Expected 30 Podcast chapters');
if (assets.length !== 59) fail(`Expected 59 total assets, found ${assets.length}`);
if (new Set(assets.map(item => item.url)).size !== 59) fail('Duplicate media URL');

const routeCache = new Map();
for (const asset of assets) {
  const publicFile = join(root, 'public', ...asset.url.split('/').filter(Boolean));
  const builtFile = join(root, 'dist', ...asset.url.split('/').filter(Boolean));
  if (!existsSync(publicFile)) fail(`Missing public asset: ${asset.url}`);
  if (!existsSync(builtFile)) fail(`Missing built asset: ${asset.url}`);
  if (sha256(publicFile) !== asset.sha256) fail(`Public hash mismatch: ${asset.contentId}`);
  if (sha256(builtFile) !== asset.sha256) fail(`Built hash mismatch: ${asset.contentId}`);
  const pageFile = routeFile(asset.route);
  if (!existsSync(pageFile)) fail(`Missing referencing route: ${asset.route}`);
  const html = routeCache.get(pageFile) ?? readFileSync(pageFile, 'utf8');
  routeCache.set(pageFile, html);
  const occurrences = html.split(asset.url).length - 1;
  if (occurrences !== 1) fail(`Expected exactly one reference to ${asset.url} on ${asset.route}, found ${occurrences}`);
  if (html.includes('K:\\Be Deutsch')) fail(`Absolute Windows path leaked into ${asset.route}`);
}

for (const [pageFile, html] of routeCache) {
  if (html.includes('Audio recording pending') || html.includes('No playable file yet')) fail(`Stale pending-audio copy in ${pageFile}`);
}
const audioTagCount = [...routeCache.values()].reduce((n, html) => n + (html.match(/<audio\b/g) ?? []).length, 0);
if (audioTagCount !== 59) fail(`Expected 59 audio controls across mapped pages, found ${audioTagCount}`);
const htmlPageCount = (() => {
  const walk = dir => readdirSync(dir, { withFileTypes: true }).reduce((n, entry) => n + (entry.isDirectory() ? walk(join(dir, entry.name)) : entry.name.endsWith('.html') ? 1 : 0), 0);
  return walk(join(root, 'dist'));
})();

console.log(JSON.stringify({
  status: 'PASS',
  assets: assets.length,
  listening: library.listening.length,
  podcastChapters: 30,
  podcastEpisodes: library.podcasts.length,
  mappedRoutes: routeCache.size,
  audioControls: audioTagCount,
  htmlPages: htmlPageCount,
}, null, 2));
