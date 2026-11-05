import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(repositoryRoot, '07_Website');
const referencePath = path.join(repositoryRoot, 'ci-reference', 'UI08_BASELINE_REFERENCE.json');
const fixture = path.resolve(repositoryRoot, '..', 'BD-UI-07_MULTILINGUAL_DESIGN_AND_HINTS', 'site');
const expectedFixture = path.resolve(path.dirname(repositoryRoot), 'BD-UI-07_MULTILINGUAL_DESIGN_AND_HINTS', 'site');
if (fixture !== expectedFixture || path.basename(path.dirname(fixture)) !== 'BD-UI-07_MULTILINGUAL_DESIGN_AND_HINTS') {
  throw new Error(`Unsafe UI08 fixture target: ${fixture}`);
}

const reference = JSON.parse(await readFile(referencePath, 'utf8'));
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const sourceCourse = path.join(site, ...reference.course.path.split('/'));
if ((await stat(sourceCourse)).size !== reference.course.bytes || await hash(sourceCourse) !== reference.course.sha256) {
  throw new Error('Unit-1 course data differs from the authoritative BD-UI-07 reference');
}

const sourceAudioRoot = path.join(site, ...reference.audioRoot.split('/'));
const discoverMp3 = async (root, relative = '') => {
  const files = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const item = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await discoverMp3(root, item));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')) files.push(item.replaceAll('\\', '/'));
  }
  return files;
};
const actualPaths = (await discoverMp3(sourceAudioRoot)).sort();
const expectedPaths = reference.audio.map(item => item.path).sort();
if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) throw new Error('Unit-1 MP3 path set differs from the authoritative reference');
for (const item of reference.audio) {
  const file = path.join(sourceAudioRoot, ...item.path.split('/'));
  if ((await stat(file)).size !== item.bytes || await hash(file) !== item.sha256) throw new Error(`Unit-1 MP3 differs: ${item.path}`);
}

await rm(fixture, { recursive: true, force: true });
await mkdir(path.join(fixture, 'src', 'a2', 'data'), { recursive: true });
await mkdir(path.join(fixture, 'public'), { recursive: true });
await cp(sourceCourse, path.join(fixture, 'src', 'a2', 'data', 'course.json'));
await cp(sourceAudioRoot, path.join(fixture, 'public', 'a2-audio'), { recursive: true });
console.log(JSON.stringify({ status: 'PASS', reference: referencePath, verifiedCourse: reference.course.path, verifiedAudio: reference.audioCount, fixture }, null, 2));

