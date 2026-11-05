import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const output = path.resolve(root, '..', 'bd-ui06-experience-check.json');
const failures = [];
const checks = [];

async function page(route) {
  return readFile(path.join(dist, route, 'index.html'), 'utf8');
}

function check(name, condition, detail) {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) failures.push(`${name}: ${detail}`);
}

for (const lesson of ['v01', 'v02', 'v03', 'v04']) {
  const html = await page(path.join('a2', 'unit-1', 'vocabulary', lesson));
  const hasRequiredHierarchy = html.includes('Vocabulary filters') && html.includes('Example');
  const hasVerifiedForms = lesson === 'v04' || html.includes('Grammar and forms');
  check(`${lesson} structured vocabulary`, hasRequiredHierarchy && hasVerifiedForms, 'missing required hierarchy or a verified forms panel');
  check(`${lesson} vocabulary cards`, (html.match(/data-vocab-card/g) ?? []).length === 15, 'expected 15 approved records');
}

for (const lesson of ['g01', 'g02', 'g03', 'g04']) {
  const html = await page(path.join('a2', 'unit-1', 'grammar', lesson));
  check(`${lesson} topic hierarchy`, html.includes('One grammar topic, one clear path') && html.includes('Build the concept step by step'), 'missing topic-focused layout');
  check(`${lesson} real practice`, html.includes('Guided practice') && html.includes('Independent practice'), 'practice sections missing');
}

for (const lesson of ['l01', 'l02']) {
  const html = await page(path.join('a2', 'unit-1', 'listening', lesson));
  check(`${lesson} two passages`, (html.match(/class="passage-card"/g) ?? []).length === 2, 'expected two approved passage cards');
  check(`${lesson} readable support`, !html.includes('Reinforcement:'), 'raw reinforcement label remains');
}

const podcast = await page(path.join('a2', 'unit-1', 'podcast'));
check('podcast five chapters', (podcast.match(/data-chapter-tab=/g) ?? []).length === 5, 'expected five chapter controls');
check('podcast concise transcript controls', !podcast.includes('available after the check or with study support'), 'old repeated gating message remains');
check('podcast real duration', podcast.includes('data-duration="349.326"') && podcast.includes('5:49'), 'approved duration missing');

const report = {
  checkedAt: new Date().toISOString(),
  passed: failures.length === 0,
  checks,
  failures,
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`BD-UI-06 experience checks passed: ${checks.length}/${checks.length}.`);
