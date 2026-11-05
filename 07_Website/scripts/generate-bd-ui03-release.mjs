import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const releaseId = 'BD-UI-03-RC1-2026-10-31';
const outputRoot = 'K:\\Be Deutsch\\outputs\\BD-UI-03';
const sourceRoot = path.resolve(import.meta.dirname, '..');
const siteRoot = process.argv[2] ? path.resolve(process.argv[2]) : path.join(sourceRoot, 'dist');
const manifestRoot = process.argv[3] ? path.resolve(process.argv[3]) : outputRoot;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function sha256(file) {
  const hash = createHash('sha256');
  hash.update(await readFile(file));
  return hash.digest('hex');
}

function routeFromHtml(relative) {
  const posix = relative.split(path.sep).join('/');
  if (posix === 'index.html') return '/';
  if (posix.endsWith('/index.html')) return `/${posix.slice(0, -'index.html'.length)}`;
  return `/${posix}`;
}

function classify(route) {
  if (route.startsWith('/phase1/')) return 'internal_prototype';
  if (route === '/grammar/a1/') return 'legacy_compatibility';
  if (route.startsWith('/a2/unit-1/')) return 'approved_a2_learning';
  if (/^\/(grammar|vocabulary|listening|podcasts)\//.test(route)) return 'approved_a1_learning';
  if (route === '/404.html') return 'system_error';
  return 'supporting_public';
}

const files = await walk(siteRoot);
const fileRecords = [];
let totalBytes = 0;
for (const file of files.sort()) {
  const relative = path.relative(siteRoot, file).split(path.sep).join('/');
  const size = (await stat(file)).size;
  const digest = await sha256(file);
  totalBytes += size;
  fileRecords.push({ path: relative, bytes: size, sha256: digest });
}

const htmlRoutes = fileRecords
  .filter((file) => file.path.endsWith('.html'))
  .map((file) => ({ route: routeFromHtml(file.path), classification: classify(routeFromHtml(file.path)) }))
  .sort((a, b) => a.route.localeCompare(b.route));
const countsByClassification = Object.fromEntries(
  [...new Set(htmlRoutes.map((item) => item.classification))]
    .map((classification) => [classification, htmlRoutes.filter((item) => item.classification === classification).length]),
);
const phase1Routes = htmlRoutes.filter((item) => item.classification === 'internal_prototype');
if (phase1Routes.length) throw new Error(`Internal Phase 1 routes were emitted: ${phase1Routes.map((item) => item.route).join(', ')}`);

const a2Release = JSON.parse(await readFile(path.join(sourceRoot, 'public', 'a2-release.json'), 'utf8'));
const locks = [];
for (const name of ['vocabulary-asset-lock.json', 'quiz-sound-lock.json', 'listening-asset-lock.json', 'a2-release-lock.json']) {
  const file = path.join(sourceRoot, 'integrity', name);
  locks.push({ path: `integrity/${name}`, sha256: await sha256(file) });
}
const a2Audio = fileRecords.filter((file) => file.path.startsWith('a2-audio/') && file.path.endsWith('.mp3'));
const allAudio = fileRecords.filter((file) => file.path.endsWith('.mp3'));
const treeHash = createHash('sha256');
for (const file of fileRecords) treeHash.update(`${file.path}\0${file.sha256}\n`);

const routeInventory = {
  schema: 'be-deutsch-route-inventory/v1',
  releaseId,
  generatedAt: new Date().toISOString(),
  totalRoutes: htmlRoutes.length,
  countsByClassification,
  routes: htmlRoutes,
  excluded: {
    internalPrototypes: ['/phase1/vocabulary/', '/phase1/grammar/', '/phase1/listening/', '/phase1/podcast/'],
    futureUnavailable: ['A2 units 2 and later'],
  },
};

const manifest = {
  schema: 'be-deutsch-release-candidate/v1',
  releaseId,
  generatedAt: new Date().toISOString(),
  build: {
    framework: 'Astro 7.3.5',
    mode: 'static',
    routeCount: htmlRoutes.length,
    fileCount: fileRecords.length,
    bytes: totalBytes,
    treeSha256: treeHash.digest('hex'),
  },
  source: {
    isolatedSource: sourceRoot,
    authoritativeWebsiteRepository: 'K:\\Be Deutsch\\C48_live_website_repo',
    authoritativeBaselineSha: typeof a2Release.a1Baseline === 'string' ? a2Release.a1Baseline : (a2Release.a1Baseline?.sha ?? null),
    a2ReleaseId: a2Release.releaseId,
    contentVersion: a2Release.contentVersion ?? a2Release.content?.version ?? null,
    contentSha256: a2Release.contentSha256 ?? a2Release.content?.sha256 ?? null,
    approvedBuildRuntime: a2Release.buildRuntime ?? null,
    approvedRollbackBaseline: a2Release.approvedBaseline ?? null,
    approvedRollbackZipSha256: a2Release.approvedBaselineZipSha256 ?? null,
    g015Included: false,
  },
  educationalIntegrity: {
    a2AudioExpected: 178,
    a2AudioActual: a2Audio.length,
    allAudioFiles: allAudio.length,
    integrityReferences: locks,
  },
  routeInventory: 'route-inventory.json',
  files: fileRecords,
};
if (a2Audio.length !== 178) throw new Error(`Expected 178 A2 MP3 files, found ${a2Audio.length}`);

await writeFile(path.join(manifestRoot, 'route-inventory.json'), `${JSON.stringify(routeInventory, null, 2)}\n`);
await writeFile(path.join(manifestRoot, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote BD-UI-03 manifest for ${htmlRoutes.length} routes and ${fileRecords.length} files.`);
