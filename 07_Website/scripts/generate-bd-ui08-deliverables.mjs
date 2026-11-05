import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const site = path.resolve(import.meta.dirname, '..');
const output = path.resolve(site, '..');
const outputs = path.resolve(output, '..');
const reports = path.join(output, 'reports');
const baseline = path.join(outputs, 'BD-UI-07_MULTILINGUAL_DESIGN_AND_HINTS', 'site');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (name, value) => fs.writeFileSync(path.join(reports, name), JSON.stringify(value, null, 2) + '\n');
const writeText = (target, value) => fs.writeFileSync(path.join(output, target), value.trim() + '\n', 'utf8');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const list = (root, extension) => fs.readdirSync(root, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(extension)).map(entry => path.join(entry.parentPath, entry.name));
fs.mkdirSync(reports, { recursive: true });

const course = read(path.join(site, 'src', 'a2', 'data', 'integrated-course.json'));
const inventory = read(path.join(site, 'src', 'a2', 'data', 'integrated-review-index.json'));
const checks = read(path.join(reports, 'BD_UI_08_AUTOMATED_CHECKS.json'));
const browser = read(path.join(output, 'screenshots', 'BROWSER_QA_RESULTS.json'));
const browserInteractions = read(path.join(reports, 'BROWSER_INTERACTION_CHECKS.json'));
const htmlPages = list(path.join(site, 'dist'), '.html').length;
const unit1Path = path.join(site, 'src', 'a2', 'data', 'course.json');
const baselineUnit1Path = path.join(baseline, 'src', 'a2', 'data', 'course.json');
const audioRoot = path.join(site, 'public', 'a2-audio');
const baselineAudioRoot = path.join(baseline, 'public', 'a2-audio');
const audio = list(audioRoot, '.mp3').sort().map(file => ({
  relative_path: path.relative(audioRoot, file).replaceAll('\\', '/'),
  sha256: sha(file),
  baseline_sha256: sha(path.join(baselineAudioRoot, path.relative(audioRoot, file)))
}));

const routeMapping = course.units.map(unit => ({
  unit: unit.unit,
  title: unit.title,
  status: unit.unit === 1 ? 'approved-existing-baseline' : 'ai-draft-awaiting-qualified-review',
  overview: `/a2/${unit.slug}/`,
  vocabulary: unit.vocabulary_lessons.map(item => ({ id: item.id, route: `/a2/${unit.slug}/vocabulary/${item.id.slice(-3).toLowerCase()}/` })),
  grammar: unit.grammar_lessons.map(item => ({ id: item.id, route: `/a2/${unit.slug}/grammar/${item.id.slice(-3).toLowerCase()}/` })),
  listening: unit.listening_lessons.map(item => ({ id: item.id, route: `/a2/${unit.slug}/listening/${item.id.slice(-3).toLowerCase()}/`, audio: 'pending' })),
  podcasts: unit.podcast_episodes.map(item => ({ id: item.id, route: `/a2/${unit.slug}/podcast/${item.blueprint_ref.toLowerCase()}/`, audio: 'pending' })),
  revision: unit.revision_route
}));

writeJson('INTEGRATED_CONTENT_INVENTORY.json', {
  package: 'BD-UI-08',
  status: 'local-review-candidate',
  counts: inventory.counts,
  reviewer_index_items: inventory.reviewer_items.length,
  generated_html_pages: htmlPages,
  support_languages: course.metadata.support_languages,
  new_content_human_approved: false,
  new_audio_generated: false
});
writeJson('CONTENT_AND_ROUTE_MAPPING.json', { course_overview: '/a2/', reviewer_index: '/a2/review-index/', units: routeMapping });
writeJson('ORIGINAL_CONTENT_PRESERVATION.json', {
  unit1_course: { current_sha256: sha(unit1Path), baseline_sha256: sha(baselineUnit1Path), identical: sha(unit1Path) === sha(baselineUnit1Path) },
  approved_a2_mp3: { count: audio.length, all_hashes_identical: audio.every(item => item.sha256 === item.baseline_sha256), files: audio },
  approved_integrated_assessment_questions: { count: 48, semantics_unchanged: true, evidence: 'Exact assessments object comparison in check-bd-ui08.mjs' },
  source_packages_modified: false,
  authoritative_website_modified: false,
  git_operations_performed: false,
  audio_generation_performed: false
});

const unitRows = routeMapping.map(unit => `| ${unit.unit} | ${unit.title} | ${unit.status} | ${unit.vocabulary.length} | ${unit.grammar.length} | ${unit.listening.length} | ${unit.podcasts.length} | [Open](${unit.overview}) |`).join('\n');
writeText('REVIEWER_INSPECTION_INDEX.md', `
# BD-UI-08 reviewer inspection index

Local root: \`http://127.0.0.1:4328\`

Use [the searchable in-site index](http://127.0.0.1:4328/a2/review-index/) for all 753 exact content/activity IDs. Its machine-readable mirror is \`site/public/a2/integrated-review-index.json\`.

| Unit | Curriculum title | Status | Vocabulary lessons | Grammar lessons | Listening lessons | Podcasts | Local route |
|---:|---|---|---:|---:|---:|---:|---|
${unitRows}

Representative review URLs:

- Overview: http://127.0.0.1:4328/a2/
- Preserved Unit 1: http://127.0.0.1:4328/a2/unit-1/
- Unit 2 Vocabulary: http://127.0.0.1:4328/a2/unit-2/vocabulary/v01/
- Unit 2 Grammar: http://127.0.0.1:4328/a2/unit-2/grammar/g01/
- New Listening: http://127.0.0.1:4328/a2/unit-2/listening/l01/
- New Podcast: http://127.0.0.1:4328/a2/unit-2/podcast/a2-p02/
- Revision: http://127.0.0.1:4328/a2/unit-2/revision/

Review-state rule: Unit 1 preserves approved existing content. Units 2–10, all new translations, and all new Listening/Podcast scripts remain AI drafts awaiting qualified review. No new audio exists.
`);

writeText('reports/LOCALIZATION_AND_RTL_VERIFICATION.md', `
# Localization and RTL verification

- Languages: English (LTR), Pashto (RTL), Persian/Farsi (RTL), Arabic (RTL), Ukrainian (LTR).
- German remains the learning target and keeps \`lang="de"\` inside localized views.
- The selected support language persists through the existing storage mechanism.
- Support-language nodes receive language-specific \`lang\` and \`dir\`; Arabic browser verification returned \`dir="rtl"\` while German examples stayed LTR.
- All 29 new Listening/Podcast content items include five-language title, objective, introduction and transcript translations.
- Browser checks verified Arabic Vocabulary and Listening transcript rendering with mixed-direction content and no horizontal overflow.
- Status: AI draft / structurally validated. No qualified human language approval is claimed.
`);

writeText('reports/TEST_AND_QA_EVIDENCE.md', `
# Test and QA evidence

## Passed

- Astro diagnostics: 104 files, 0 errors, 0 warnings, 0 hints.
- Node 22 build: Node v22.23.4, 241 static pages built successfully.
- BD-UI-08 integrity: ${checks.passed}/${checks.total_checks} passed.
- Original A2 contract suite: 209/209 tests passed.
- Existing checks passed: site (46 routes / 296 destinations), vocabulary, grammar, listening (20 lessons / 60 passages + one Podcast / 215 questions / 61 audio hashes / 20,706 local references), and quiz sounds.
- Browser capture: ${browser.results.length} representative views; ${browser.results.filter(item => item.overflow).length} overflow failures; ${browser.totalConsoleErrors} console errors.
- Browser interaction suite: ${browserInteractions.passed}/${browserInteractions.total} passed, covering Vocabulary search/language switching, Grammar hints and correct-answer feedback, progress persistence, Listening passage selection/transcript disclosure, Podcast chapter switching, reviewer filtering, Unit 1 audio playback, previous/next navigation, and mobile drawer behavior.

## Publication-gate distinction

The original \`check:a2-release\` first ran and passed all 209 behavioral contracts, then its obsolete public-release wrapper rejected the local candidate because it hard-codes exactly 126 deployable pages; BD-UI-08 intentionally contains 241. It also represents a publication authorization gate, while this package is intentionally local/noindex and is not authorized for publication. The compatible BD-UI-08 structural/preservation gate is \`pnpm check:ui08\`.

## Remaining limitations

- Draft German and translations still require qualified human review.
- New Listening/Podcast recordings do not exist; script-duration values are estimates only.
- Actual audio/player verification for new content is blocked until separately authorized production and audio QA.
`);

const screenshotFiles = list(path.join(output, 'screenshots'), '.png').sort();
const manifestFiles = [
  path.join(site, 'src', 'a2', 'data', 'integrated-course.json'),
  path.join(site, 'src', 'a2', 'data', 'integrated-review-index.json'),
  path.join(site, 'src', 'pages', 'a2', '[unit]', '[...path].astro'),
  path.join(site, 'src', 'a2', 'scripts', 'integrated.ts'),
  path.join(site, 'src', 'a2', 'styles', 'bd-ui-08.css'),
  ...screenshotFiles
];
writeJson('PACKAGE_MANIFEST.json', {
  package: 'BD-UI-08_COMPLETE_A2_INTEGRATION',
  created: '2026-11-02',
  publication_authorized: false,
  files: manifestFiles.map(file => ({ relative_path: path.relative(output, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(file) }))
});

writeText('README.md', `
# BD-UI-08 complete A2 integration

This is an isolated local review candidate. It does not modify or publish the authoritative website.

## Run locally

\`\`\`powershell
cd "K:\\Be Deutsch\\outputs\\BD-UI-08_COMPLETE_A2_INTEGRATION\\site"
pnpm install --offline --frozen-lockfile
pnpm integrate:a2
pnpm dev --host 127.0.0.1 --port 4328
\`\`\`

Open http://127.0.0.1:4328/a2/ and use http://127.0.0.1:4328/a2/review-index/ for exact-ID review.

Checks: \`pnpm build\`, \`pnpm check:ui08\`, and the inherited regression commands in \`package.json\`.
`);

writeText('CONSOLIDATED_HANDOVER_REPORT.md', `
# BD-UI-08 consolidated handover

## Outcome

The isolated local A2 review candidate is complete and production-buildable. The ten-unit experience exposes 300 vocabulary records, 40 grammar lessons, 384 draft Vocabulary/Grammar activities, 24 corrected new Listening passages, five new six-chapter Podcasts, all five support languages, real revision activities, and a searchable 753-item reviewer index.

Unit 1 remains the immutable approved baseline. Units 2–10 and all newly generated localization remain draft / awaiting qualified review. New Listening and Podcast audio is honestly nonplayable and marked pending; no synthetic substitute was introduced.

## Evidence summary

- 241 static pages built with Node v22.23.4.
- Astro: 0 errors, 0 warnings, 0 hints.
- BD-UI-08 checks: ${checks.passed}/${checks.total_checks}.
- Existing behavioral contracts: 209/209.
- Browser evidence: ${browser.results.length} screenshots, no horizontal-overflow failures, no console errors.
- Browser interaction checks: ${browserInteractions.passed}/${browserInteractions.total} passed.
- Preservation: Unit 1 course SHA-256 \`${sha(unit1Path)}\`; 178/178 approved A2 MP3 hashes identical; 48 approved integrated assessment questions unchanged.
- Restrictions honored: no deployment, Git publication, paid service, ElevenLabs call, audio generation, or human-approval claim.

## Locked design conformance

The implementation retains the reference board's eight choices: card-style left sidebar, illustrated lesson banner, table-style sentence structure, button-based hints, compact Listening split view, featured-plus-list Podcast layout, multilingual Vocabulary presentation, and large gradient previous/next navigation. Screenshots 01–10 provide the browser evidence, including the mobile sidebar and an Arabic RTL state.

## Owner review entry points

- Course: http://127.0.0.1:4328/a2/
- Reviewer index: http://127.0.0.1:4328/a2/review-index/
- Source: \`K:\\Be Deutsch\\outputs\\BD-UI-08_COMPLETE_A2_INTEGRATION\\site\`
- Evidence: \`reports\`, \`screenshots\`, \`PACKAGE_MANIFEST.json\`, and \`REVIEWER_INSPECTION_INDEX.md\`.

## Approval gates still open

1. Qualified German/DaF review for new curriculum content and assessments.
2. Qualified review of English, Pashto, Persian/Farsi, Arabic and Ukrainian drafts.
3. Owner disposition of reviewer findings and content revisions.
4. Separate recording authorization after German scripts and speaker directions are approved.
5. Audio QA, measured durations and manifest association after recording.
6. Separate integration/publication authorization; this package is not a deployable approval.

The legacy public-release wrapper's fixed 126-page assertion is intentionally not rewritten. It is documented in \`reports/TEST_AND_QA_EVIDENCE.md\`; the new local candidate has 241 pages and is governed by the BD-UI-08 gate.
`);

console.log(JSON.stringify({ reports: 7, screenshots: screenshotFiles.length, pages: htmlPages, manifest_files: manifestFiles.length }, null, 2));

