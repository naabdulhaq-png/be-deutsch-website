import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  g01Patterns,
  g01Support,
  hintLibrary,
  sharedCopy,
  supportLanguages,
  vocabularyMeaningDrafts,
} from '../src/a2/i18n/support.ts';

const site = fileURLToPath(new URL('..', import.meta.url));
const output = fileURLToPath(new URL('../..', import.meta.url));
const languages = Object.keys(supportLanguages);
const rows = [];

function addRow(sourceKey, scope, language, availability, review, fallback, note = '') {
  rows.push({ source_key: sourceKey, scope, target_language: language, availability, review_status: review, fallback, note });
}
function addLocalized(sourceKey, scope, copy, englishReview = 'source-preserved') {
  for (const language of languages) {
    if (!copy[language]?.trim()) throw new Error(`Missing localized value for ${sourceKey}/${language}`);
    addRow(
      sourceKey,
      scope,
      language,
      'available',
      language === 'en' ? englishReview : 'ai-draft-qualified-review-required',
      'none',
      language === 'en' ? 'English source or implementation copy.' : 'AI-authored learner-support draft; not professionally reviewed.',
    );
  }
}

const a1 = JSON.parse(await readFile(join(site, 'src/data/vocabulary-course.json'), 'utf8'));
for (const item of a1.vocabulary) {
  for (const language of languages) {
    const available = item.senses?.some((sense) => sense.translations?.[language]?.text?.trim());
    addRow(
      `${item.vocabulary_id}.meaning`,
      'A1 vocabulary meaning',
      language,
      available ? 'available' : 'missing',
      'preserved-authoritative-package-status-unspecified',
      available ? 'none' : 'German source',
      'Unchanged from the authoritative A1 package; BD-UI-07 makes no new professional-review claim.',
    );
  }
}

for (const [id, copy] of Object.entries(vocabularyMeaningDrafts)) addLocalized(`${id}.meaning`, 'A2 vocabulary meaning', copy, 'approved-source');
for (const [key, copy] of Object.entries(sharedCopy)) addLocalized(`ui.${key}`, 'Shared learning UI', copy, 'implementation-copy');
addLocalized('A2.G01.situation', 'A2 G01 explanation', g01Support.situation, 'approved-source-adapted');
addLocalized('A2.G01.objective', 'A2 G01 explanation', g01Support.objective, 'approved-source-adapted');
g01Support.steps.forEach((step, index) => {
  addLocalized(`A2.G01.step.${index + 1}.heading`, 'A2 G01 concept steps', step.heading, 'implementation-copy-source-derived');
  addLocalized(`A2.G01.step.${index + 1}.body`, 'A2 G01 concept steps', step.body, 'implementation-copy-source-derived');
});
g01Patterns.forEach((pattern, index) => {
  addLocalized(`A2.G01.pattern.${index + 1}.function`, 'A2 G01 sentence structure', pattern.function, 'implementation-copy-source-derived');
  addLocalized(`A2.G01.pattern.${index + 1}.meaning`, 'A2 G01 sentence structure', pattern.meaning, 'supplementary-example-pending-content-review');
});
for (const [key, hints] of Object.entries(hintLibrary)) {
  addLocalized(`hint.${key}.first`, 'Practice hint', hints.first, 'implementation-copy-source-derived');
  if (hints.second) addLocalized(`hint.${key}.second`, 'Practice hint', hints.second, 'implementation-copy-source-derived');
}

for (const gap of [
  ['A2.G02-G04.long_explanations', 'A2 grammar extended prose'],
  ['A2.vocabulary.example_translations', 'A2 vocabulary example translations'],
  ['A2.listening.transcript_translations', 'A2 Listening transcripts'],
  ['A2.listening.extended_support', 'A2 Listening extended support'],
  ['A2.podcast.transcript_translations', 'A2 Podcast transcripts'],
  ['A2.podcast.extended_support', 'A2 Podcast extended support'],
  ['A2.revision.extended_guidance', 'A2 Revision extended guidance'],
]) {
  for (const language of languages) {
    addRow(
      gap[0],
      gap[1],
      language,
      language === 'en' ? 'available' : 'missing',
      language === 'en' ? 'source-preserved' : 'not-authored',
      language === 'en' ? 'none' : 'verified English source',
      language === 'en' ? 'Existing approved/source-aligned English remains available.' : 'UI declares the English fallback; it does not imply translated coverage.',
    );
  }
}

function csv(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
const headers = Object.keys(rows[0]);
const matrix = [headers.join(','), ...rows.map((row) => headers.map((header) => csv(row[header])).join(','))].join('\r\n');
await writeFile(join(output, 'TRANSLATION_COVERAGE_MATRIX.csv'), `${matrix}\r\n`);

async function walk(directory) {
  const values = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    values.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return values;
}
const distFiles = await walk(join(site, 'dist'));
const distManifest = [];
let distBytes = 0;
for (const path of distFiles) {
  const bytes = (await stat(path)).size;
  distBytes += bytes;
  distManifest.push({ path: relative(join(site, 'dist'), path).replaceAll('\\', '/'), bytes, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
}
await writeFile(join(output, 'PRODUCTION_FILE_MANIFEST.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), fileCount: distFiles.length, bytes: distBytes, files: distManifest }, null, 2)}\n`);

const changedFiles = [
  'scripts/capture-bd-ui07.mjs',
  'scripts/check-bd-ui07-browser.mjs',
  'scripts/check-bd-ui07.mjs',
  'scripts/generate-bd-ui07-deliverables.mjs',
  'src/a2/components/AudioPlayer.astro',
  'src/a2/components/Hint.astro',
  'src/a2/components/LocalizedText.astro',
  'src/a2/components/Practice.astro',
  'src/a2/components/SentenceStructureTable.astro',
  'src/a2/components/SupportLanguageSelector.astro',
  'src/a2/components/pages/GrammarPage.astro',
  'src/a2/components/pages/ListeningPage.astro',
  'src/a2/components/pages/PodcastPage.astro',
  'src/a2/components/pages/RevisionPage.astro',
  'src/a2/components/pages/VocabularyPage.astro',
  'src/a2/i18n/support.ts',
  'src/a2/scripts/app.ts',
  'src/a2/scripts/experience.ts',
  'src/a2/scripts/support-language.ts',
  'src/components/redesign/LearningChrome.astro',
  'src/pages/a2/unit-1/[...path].astro',
  'src/scripts/bd-ui-02.ts',
  'src/styles/bd-ui-07.css',
];
const summary = rows.reduce((result, row) => {
  result[row.availability] = (result[row.availability] ?? 0) + 1;
  return result;
}, {});
const implementation = {
  identifier: 'BD-UI-07-MULTILINGUAL-DESIGN-AND-HINTS-2026-11-01',
  generatedAt: new Date().toISOString(),
  baseline: 'BD-UI-06_A2_LEARNER_EXPERIENCE_REPAIR/site',
  runtime: { node: '22.23.4', packageManager: 'pnpm@11.25.0', astro: '7.3.5' },
  productionOutput: { htmlPages: distFiles.filter((path) => path.endsWith('.html')).length, fileCount: distFiles.length, bytes: distBytes },
  translationMatrix: { rows: rows.length, availability: summary, languages },
  preservedContracts: { a1VocabularyRecords: a1.vocabulary.length, a2VocabularyRecords: 60, a2AudioAssets: 178, integratedA2Questions: 48, listeningPassages: 4, podcastEpisodes: 1, podcastChapters: 5 },
  changedFiles,
};
await writeFile(join(output, 'IMPLEMENTATION_MANIFEST.json'), `${JSON.stringify(implementation, null, 2)}\n`);
console.log(`Generated BD-UI-07 deliverables: ${rows.length} translation coverage rows, ${distFiles.length} production files, ${distBytes} bytes.`);
