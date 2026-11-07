import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));
const siteRoot = resolve(args.site ?? 'release-dist');
const inventoryPath = resolve(args.inventory ?? 'ci-tools/a2-reachability-inventory.json');
const outputPath = args.output ? resolve(args.output) : null;
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));

const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const cleanRoute = (value) => {
  const pathname = value.split('#')[0].split('?')[0] || '/';
  if (pathname === '/' || /\.[a-z0-9]+$/i.test(pathname)) return pathname;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
};
const routeFromHtml = (path) => {
  const rel = relative(siteRoot, path).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
};
const htmlFiles = walk(siteRoot).filter((path) => path.endsWith('.html'));
const htmlByRoute = new Map(htmlFiles.map((path) => [routeFromHtml(path), readFileSync(path, 'utf8')]));
const routeSet = new Set(htmlByRoute.keys());
const graph = new Map();
for (const [route, html] of htmlByRoute) {
  const values = [
    ...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi),
    ...html.matchAll(/<option\b[^>]*\bvalue=["']([^"']+)["']/gi)
  ].map((match) => match[1]).filter((value) => value.startsWith('/') && !value.startsWith('//')).map(cleanRoute).filter((value) => routeSet.has(value));
  graph.set(route, [...new Set(values)]);
}

const reachable = new Set(inventory.entryRoutes.map(cleanRoute));
const queue = [...reachable];
while (queue.length) {
  const route = queue.shift();
  for (const target of graph.get(route) ?? []) {
    if (!reachable.has(target)) { reachable.add(target); queue.push(target); }
  }
}

const duplicates = inventory.records.map((record) => record.id).filter((id, index, all) => all.indexOf(id) !== index);
const failures = [];
const byType = {};
for (const record of inventory.records) {
  byType[record.type] = (byType[record.type] ?? 0) + 1;
  const route = cleanRoute(record.route);
  const html = htmlByRoute.get(route);
  if (!html) {
    failures.push({ id: record.id, route, reason: 'missing_route' });
    continue;
  }
  if (!reachable.has(route)) failures.push({ id: record.id, route, reason: 'unreachable_route' });
  const learnerMarkup = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<!--([\s\S]*?)-->/g, '');
  const missingTokens = record.presentationTokens.filter((token) => !learnerMarkup.includes(token));
  if (missingTokens.length) failures.push({ id: record.id, route, reason: 'not_presented_in_learner_markup', missingTokens });
  const fragment = record.route.includes('#') ? decodeURIComponent(record.route.split('#')[1]) : null;
  if (fragment) {
    const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`(?:id|name)=["']${escaped}["']`).test(learnerMarkup)) failures.push({ id: record.id, route, reason: 'missing_target_fragment', fragment });
  }
}

for (const [type, expected] of Object.entries(inventory.expectedCounts)) {
  if (byType[type] !== expected) failures.push({ type, reason: 'count_mismatch', expected, actual: byType[type] ?? 0 });
}
for (let unit = 1; unit <= 10; unit += 1) {
  const route = `/a2/unit-${unit}/`;
  if (!reachable.has(route)) failures.push({ id: `A2-UNIT-${unit}`, route, reason: 'unit_unreachable' });
}
for (const phrase of inventory.forbiddenAvailabilityPhrases) {
  for (const [route, html] of htmlByRoute) {
    if (html.includes(phrase)) failures.push({ route, reason: 'false_availability_restriction', phrase });
  }
}
if (duplicates.length) failures.push({ reason: 'duplicate_inventory_ids', ids: [...new Set(duplicates)] });
if (inventory.records.length !== inventory.expectedRecords) failures.push({ reason: 'inventory_total_mismatch', expected: inventory.expectedRecords, actual: inventory.records.length });

const unreachable = failures.filter((failure) => ['missing_route', 'unreachable_route', 'unit_unreachable'].includes(failure.reason));
const result = {
  schemaVersion: '1.0.0',
  status: failures.length ? 'FAIL' : 'PASS',
  sourceInventorySha256: inventory.sourceInventorySha256,
  expectedRecords: inventory.expectedRecords,
  presentedRecords: inventory.expectedRecords - new Set(failures.filter((failure) => failure.id && failure.reason === 'not_presented_in_learner_markup').map((failure) => failure.id)).size,
  reachableRecords: inventory.expectedRecords - new Set(unreachable.filter((failure) => failure.id && !failure.id.startsWith('A2-UNIT-')).map((failure) => failure.id)).size,
  reachableRoutes: reachable.size,
  publicHtmlPages: htmlFiles.length,
  unitsReachable: Array.from({ length: 10 }, (_, index) => `/a2/unit-${index + 1}/`).filter((route) => reachable.has(route)).length,
  counts: byType,
  failures
};
if (outputPath) writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
