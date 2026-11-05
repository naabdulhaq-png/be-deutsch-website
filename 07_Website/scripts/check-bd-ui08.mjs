import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputs = path.resolve(site, '..', '..');
const baseline = path.join(outputs, 'BD-UI-07_MULTILINGUAL_DESIGN_AND_HINTS', 'site');
const integrated = JSON.parse(fs.readFileSync(path.join(site, 'src', 'a2', 'data', 'integrated-course.json'), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(site, 'src', 'a2', 'data', 'integrated-review-index.json'), 'utf8'));
const currentUnit1 = JSON.parse(fs.readFileSync(path.join(site, 'src', 'a2', 'data', 'course.json'), 'utf8'));
const baselineUnit1 = JSON.parse(fs.readFileSync(path.join(baseline, 'src', 'a2', 'data', 'course.json'), 'utf8'));
const checks = [];
const check = (name, condition, evidence) => {
  checks.push({ name, pass: Boolean(condition), evidence });
  if (!condition) process.exitCode = 1;
};
const unique = items => new Set(items.map(item => item.id)).size === items.length;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = (root, extension) => fs.readdirSync(root, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
  .map(entry => path.join(entry.parentPath, entry.name));

check('Ten units', integrated.units.length === 10, integrated.units.length);
check('300 vocabulary records', integrated.vocabulary.length === 300, integrated.vocabulary.length);
check('60 approved Unit 1 vocabulary records', integrated.vocabulary.filter(x => x.unit === 1).length === 60, integrated.vocabulary.filter(x => x.unit === 1).length);
check('240 draft vocabulary records', integrated.vocabulary.filter(x => x.source_status === 'NEW_DRAFT_MATERIAL').length === 240, integrated.vocabulary.filter(x => x.source_status === 'NEW_DRAFT_MATERIAL').length);
check('40 grammar lessons', integrated.grammar.length === 40, integrated.grammar.length);
check('Four preserved Unit 1 grammar lessons', integrated.grammar.filter(x => x.unit === 1).length === 4, integrated.grammar.filter(x => x.unit === 1).length);
check('36 draft grammar lessons', integrated.grammar.filter(x => x.source_status === 'NEW_DRAFT_MATERIAL').length === 36, integrated.grammar.filter(x => x.source_status === 'NEW_DRAFT_MATERIAL').length);
check('384 draft exercises', integrated.exercises.length === 384, integrated.exercises.length);
check('24 new Listening passages', integrated.listening.length === 24, integrated.listening.length);
check('Five new Podcasts', integrated.podcasts.length === 5, integrated.podcasts.length);
check('30 new Podcast chapters', integrated.podcasts.reduce((n, episode) => n + episode.chapters.length, 0) === 30, integrated.podcasts.reduce((n, episode) => n + episode.chapters.length, 0));
check('102 Listening/Podcast comprehension activities', integrated.listening.reduce((n, item) => n + item.questions.length, 0) + integrated.podcasts.reduce((n, item) => n + item.questions.length, 0) === 102, integrated.listening.reduce((n, item) => n + item.questions.length, 0) + integrated.podcasts.reduce((n, item) => n + item.questions.length, 0));
check('Five-language localization exists for every new Listening/Podcast item', integrated.localization.length === 29 && integrated.localization.every(item => ['title', 'learning_objective', 'short_introduction', 'transcript_translation'].every(field => ['en', 'ps', 'fa', 'ar', 'uk'].every(language => Boolean(item[field]?.[language])))), integrated.localization.length);
check('Vocabulary IDs unique', unique(integrated.vocabulary), integrated.vocabulary.length);
check('Grammar IDs unique', unique(integrated.grammar), integrated.grammar.length);
check('Exercise IDs unique', unique(integrated.exercises), integrated.exercises.length);
check('Listening IDs unique', unique(integrated.listening), integrated.listening.length);
check('Podcast IDs unique', unique(integrated.podcasts), integrated.podcasts.length);
check('New Listening audio is pending and nonplayable', integrated.listening.every(item => item.audio?.status === 'audio_pending' && item.audio.playable === false && item.audio.path === null), integrated.listening.length);
check('New Podcast audio is pending and nonplayable', integrated.podcasts.every(item => item.audio?.status === 'audio_pending' && item.audio.playable === false && item.audio.path === null && item.audio.actual_duration_seconds === null), integrated.podcasts.length);
check('RTL metadata for Pashto, Persian and Arabic', ['ps', 'fa', 'ar'].every(language => integrated.metadata.support_languages[language].dir === 'rtl'), integrated.metadata.support_languages);
check('Draft publication and human approval remain false', integrated.metadata.publication_authorized === false && integrated.metadata.human_approved_new_content === false, integrated.metadata.source_status);
check('Review index includes every integrated item', review.reviewer_items.length === 753, review.reviewer_items.length);
check('Unit 1 course data byte-identical', hash(path.join(site, 'src', 'a2', 'data', 'course.json')) === hash(path.join(baseline, 'src', 'a2', 'data', 'course.json')), hash(path.join(site, 'src', 'a2', 'data', 'course.json')));
const assessmentContexts = ['integrated:grammar', 'integrated:vocabulary', 'integrated:listening', 'integrated:podcast'];
const assessmentCount = assessmentContexts.reduce((n, context) => n + (currentUnit1.assessments[context]?.questions?.length ?? 0), 0);
check('48 approved Unit 1 integrated assessment questions preserved', assessmentCount === 48 && JSON.stringify(currentUnit1.assessments) === JSON.stringify(baselineUnit1.assessments), assessmentCount);
const audioRoot = path.join(site, 'public', 'a2-audio');
const baselineAudioRoot = path.join(baseline, 'public', 'a2-audio');
const audioFiles = files(audioRoot, '.mp3');
const baselineAudioFiles = files(baselineAudioRoot, '.mp3');
const audioHashesMatch = audioFiles.length === baselineAudioFiles.length && audioFiles.every(file => {
  const relative = path.relative(audioRoot, file);
  const source = path.join(baselineAudioRoot, relative);
  return fs.existsSync(source) && hash(file) === hash(source);
});
check('178 approved A2 MP3 files and hashes preserved', audioFiles.length === 178 && audioHashesMatch, audioFiles.length);
const routes = integrated.units.filter(unit => unit.unit > 1).flatMap(unit => [
  `/a2/${unit.slug}/`,
  ...unit.vocabulary_lessons.map(item => `/a2/${unit.slug}/vocabulary/${item.id.slice(-3).toLowerCase()}/`),
  ...unit.grammar_lessons.map(item => `/a2/${unit.slug}/grammar/${item.id.slice(-3).toLowerCase()}/`),
  ...unit.listening_lessons.map(item => `/a2/${unit.slug}/listening/${item.id.slice(-3).toLowerCase()}/`),
  ...unit.podcast_episodes.map(item => `/a2/${unit.slug}/podcast/${item.blueprint_ref.toLowerCase()}/`),
  unit.revision_route
]);
const routeFile = route => path.join(site, 'dist', route.replace(/^\//, ''), 'index.html');
check('All generated Units 2–10 routes exist', routes.every(route => fs.existsSync(routeFile(route))), routes.length);
check('Unit 1 preserved deep links exist', ['/a2/unit-1/', '/a2/unit-1/grammar/g01/', '/a2/unit-1/vocabulary/v01/', '/a2/unit-1/listening/l01/', '/a2/unit-1/podcast/'].every(route => fs.existsSync(routeFile(route))), 5);
const sourceText = fs.readFileSync(path.join(site, 'src', 'a2', 'scripts', 'integrated.ts'), 'utf8');
check('Draft progress uses a separate non-destructive key', sourceText.includes("be-deutsch:a2-draft-progress:v1"), 'be-deutsch:a2-draft-progress:v1');

const report = {
  package: 'BD-UI-08',
  generated: new Date().toISOString(),
  total_checks: checks.length,
  passed: checks.filter(item => item.pass).length,
  failed: checks.filter(item => !item.pass).length,
  checks
};
fs.mkdirSync(path.join(site, '..', 'reports'), { recursive: true });
fs.writeFileSync(path.join(site, '..', 'reports', 'BD_UI_08_AUTOMATED_CHECKS.json'), JSON.stringify(report, null, 2) + '\n');
for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}: ${typeof item.evidence === 'object' ? JSON.stringify(item.evidence) : item.evidence}`);
console.log(`\nBD-UI-08 checks: ${report.passed}/${report.total_checks} passed`);

