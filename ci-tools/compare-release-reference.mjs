import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactRoot = path.join(repositoryRoot, 'release-dist');
const referenceFile = path.join(repositoryRoot, 'ci-reference', 'RELEASE_DIST_CHECKSUMS.sha256');
const outputDirectory = path.join(repositoryRoot, 'ci-output');
const outputFile = path.join(outputDirectory, 'CI_VS_LOCAL_ARTIFACT.json');

const sha256 = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const walk = async (root, relative = '') => {
  const result = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const item = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await walk(root, item));
    else if (entry.isFile()) result.push(item.replaceAll('\\', '/'));
  }
  return result;
};

if (!(await stat(artifactRoot)).isDirectory()) throw new Error(`Missing generated release artifact: ${artifactRoot}`);
const referenceText = await readFile(referenceFile, 'utf8');
const reference = new Map();
for (const line of referenceText.split(/\r?\n/)) {
  if (!line.trim()) continue;
  const match = line.match(/^([0-9a-fA-F]{64})\s{2}(.+)$/);
  if (!match) throw new Error(`Invalid reference checksum line: ${line}`);
  reference.set(match[2].replaceAll('\\', '/'), match[1].toLowerCase());
}

const currentFiles = (await walk(artifactRoot)).sort();
const current = new Map();
for (const relative of currentFiles) current.set(relative, await sha256(path.join(artifactRoot, ...relative.split('/'))));

const missing = [...reference.keys()].filter(item => !current.has(item)).sort();
const extra = [...current.keys()].filter(item => !reference.has(item)).sort();
const hashMismatches = [...reference.keys()]
  .filter(item => current.has(item) && current.get(item) !== reference.get(item))
  .sort()
  .map(item => ({ path: item, expected: reference.get(item), actual: current.get(item) }));
const matched = [...reference.keys()].filter(item => current.get(item) === reference.get(item)).length;
const htmlFiles = currentFiles.filter(item => item.endsWith('.html'));
const audioFiles = currentFiles.filter(item => item.startsWith('a2-expanded-audio/') && item.toLowerCase().endsWith('.mp3'));
const sitemap = await readFile(path.join(artifactRoot, 'sitemap-0.xml'), 'utf8');
const sitemapEntries = [...sitemap.matchAll(/<loc>[^<]+<\/loc>/g)].length;
const category = item => item.endsWith('.html') ? 'html' : item.toLowerCase().endsWith('.mp3') ? 'audio' : item.startsWith('_astro/') ? 'generated-static' : 'other';
const mismatchCategories = {};
for (const item of [...missing, ...extra, ...hashMismatches.map(entry => entry.path)]) {
  const key = category(item);
  mismatchCategories[key] = (mismatchCategories[key] ?? 0) + 1;
}

const exactMatch = missing.length === 0 && extra.length === 0 && hashMismatches.length === 0;
const report = {
  status: exactMatch ? 'PASS' : 'FAIL',
  generatedAt: new Date().toISOString(),
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  artifactRoot,
  referenceFile,
  expected: { files: reference.size, htmlPages: 240, sitemapEntries: 238, audioAssets: 59 },
  actual: { files: current.size, htmlPages: htmlFiles.length, sitemapEntries, audioAssets: audioFiles.length },
  exactMatch,
  matched,
  missing,
  extra,
  hashMismatches,
  mismatchCategories,
};
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  status: report.status,
  expected: report.expected,
  actual: report.actual,
  exactMatch,
  matched,
  missing,
  extra,
  hashMismatchPaths: hashMismatches.map(entry => entry.path),
  mismatchCategories,
}, null, 2));
if (!exactMatch) process.exitCode = 1;

