import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  g01Patterns,
  g01Support,
  hintLibrary,
  supportLanguages,
  vocabularyMeaningDrafts,
} from '../src/a2/i18n/support.ts';

const root = new URL('..', import.meta.url);
const dist = new URL('dist/', root);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    files.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return files;
}

const languageCodes = Object.keys(supportLanguages);
assert.deepEqual(languageCodes, ['en', 'ps', 'fa', 'ar', 'uk']);
assert.equal(g01Support.steps.length, 5);
assert.equal(g01Patterns.length, 3);
assert.equal(Object.keys(vocabularyMeaningDrafts).length, 60);

for (const [id, meanings] of Object.entries(vocabularyMeaningDrafts)) {
  assert.deepEqual(Object.keys(meanings), languageCodes, `${id} must expose all five support-language values`);
  for (const language of languageCodes) assert.ok(meanings[language]?.trim(), `${id}/${language} must not be empty`);
}

for (const key of ['grammarVerbParts', 'vocabulary', 'listening', 'podcast', 'revision']) {
  assert.ok(hintLibrary[key]?.first, `${key} needs a contextual hint`);
}

const chrome = await readFile(new URL('src/components/redesign/LearningChrome.astro', root), 'utf8');
for (const label of ['Vocabulary', 'Grammar', 'Listening', 'Podcast']) {
  assert.equal((chrome.match(new RegExp(`label: '${label}'`, 'g')) ?? []).length, 1, `${label} category must be declared once`);
}

const files = await walk(fileURLToPath(dist));
const htmlFiles = files.filter((file) => file.endsWith('.html'));
assert.equal(htmlFiles.length, 126, 'production output must contain the validated 126 HTML pages');

const allHtml = (await Promise.all(htmlFiles.map((file) => readFile(file, 'utf8')))).join('\n');
assert.ok(!allHtml.includes('/phase1/'), 'internal Phase 1 links must not be present');
assert.ok(!/Play\s+Play\s+/i.test(allHtml), 'duplicated audio labels must not be present');
assert.ok(!/Reinforcement:\s*A2-U01-/i.test(allHtml), 'raw reinforcement IDs must not be learner facing');

const grammarHtml = await readFile(new URL('dist/a2/unit-1/grammar/g01/index.html', root), 'utf8');
assert.equal((grammarHtml.match(/class="bd-ui07__category /g) ?? []).length, 4, 'A2 sidebar must render exactly four category cards');
assert.equal((grammarHtml.match(/data-support-language="/g) ?? []).length, 5, 'selector must render five support languages');
assert.ok(/Ich<\/span><span class="role-aux">habe<\/span><span class="role-middle">gestern<\/span><span class="role-participle">gelernt/.test(grammarHtml), 'sentence structure table must contain the approved supplementary example');

const listeningHtml = await readFile(new URL('dist/a2/unit-1/listening/l01/index.html', root), 'utf8');
assert.ok((listeningHtml.match(/<p lang="de">/g) ?? []).length >= 8, 'Listening L01 must contain its real transcript turns');

const podcastHtml = await readFile(new URL('dist/a2/unit-1/podcast/index.html', root), 'utf8');
assert.equal((podcastHtml.match(/data-chapter-tab=/g) ?? []).length, 5, 'Podcast must render all five approved chapters');

const result = {
  checkedAt: new Date().toISOString(),
  languages: languageCodes,
  localizedVocabularyRecords: Object.keys(vocabularyMeaningDrafts).length,
  grammarConceptSteps: g01Support.steps.length,
  sentencePatterns: g01Patterns.length,
  contextualHintKeys: Object.keys(hintLibrary).length,
  sidebarCategories: 4,
  productionHtmlPages: htmlFiles.length,
  phase1RoutesPresent: false,
  duplicateAudioLabelsPresent: false,
  rawReinforcementIdsPresent: false,
  listeningTranscriptTurnsMinimum: 8,
  podcastChapters: 5,
  status: 'pass',
};

await writeFile(new URL('../bd-ui07-check.json', root), `${JSON.stringify(result, null, 2)}\n`);
console.log(`BD-UI-07 checks passed: ${result.productionHtmlPages} pages, ${result.localizedVocabularyRecords} vocabulary records × 5 languages, 5 concept steps, 3 sentence patterns, 4 sidebar categories, real transcript, 5 podcast chapters.`);
