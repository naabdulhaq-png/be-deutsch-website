import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(sourceRoot, 'dist');
const output = path.resolve(sourceRoot, '..', 'release-dist');
const expectedParent = path.resolve(sourceRoot, '..');
if (path.dirname(output) !== expectedParent || path.basename(output) !== 'release-dist') throw new Error(`Unsafe release target: ${output}`);
if (!(await stat(input)).isDirectory()) throw new Error(`Missing build input: ${input}`);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const excluded = new Set(['a2/audio-review', 'a2/review-index']);
const forbiddenExtensions = /\.(?:env|pem|key|pfx|p12|map|zip|xlsx|log)$/i;
let copied = 0;
async function copyTree(from, to, relative = '') {
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if ([...excluded].some(prefix => rel === prefix || rel.startsWith(`${prefix}/`))) continue;
    if (forbiddenExtensions.test(entry.name)) throw new Error(`Forbidden release file: ${rel}`);
    const source = path.join(from, entry.name), destination = path.join(to, entry.name);
    if (entry.isDirectory()) { await mkdir(destination, { recursive: true }); await copyTree(source, destination, rel); }
    else if (entry.isFile()) { await cp(source, destination, { force: false }); copied++; }
  }
}
await copyTree(input, output);
console.log(JSON.stringify({ status: 'PASS', input, output, copied, excluded: [...excluded] }, null, 2));
