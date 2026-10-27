import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  grammarLanguages,
  grammarLessons,
  grammarUi,
  grammarUnits,
  getFinalAssessmentExercises,
  getUnitLessons,
  getUnitReviewExercises,
} from '../src/data/grammar-course.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const languageCodes = Object.keys(grammarLanguages);
const exerciseIds = new Set();
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const protectedTranslations = grammarLessons.map((lesson) => ({
  id: lesson.id,
  objective: { uk: lesson.objective.uk, ar: lesson.objective.ar, fa: lesson.objective.fa, ps: lesson.objective.ps },
  explanation: { uk: lesson.explanation.uk, ar: lesson.explanation.ar, fa: lesson.explanation.fa, ps: lesson.explanation.ps },
  feedback: { uk: lesson.feedback.uk, ar: lesson.feedback.ar, fa: lesson.feedback.fa, ps: lesson.feedback.ps },
  examples: lesson.examples.map((example) => ({ meaning: { uk: example.meaning.uk, ar: example.meaning.ar, fa: example.meaning.fa, ps: example.meaning.ps } })),
}));
const protectedExercises = grammarLessons.map((lesson) => ({ id: lesson.id, guided: lesson.guided, independent: lesson.independent }));
const protectedNonEnglishUi = { uk: grammarUi.uk, ar: grammarUi.ar, fa: grammarUi.fa, ps: grammarUi.ps };

// Authorized G01.2 final-closure exception: the first G01 example now introduces Samira before using sie.
// Previous baseline: b0da8523d22ecdf467d6b306ce1372374bfd974a16864ccdb778a60c96c16c04
assert.equal(hash(protectedTranslations), 'b8156666c222f8a268c467dbc1b9c422ad4eda0fa898598ef1ef80d4fbb91335', 'Protected translations changed outside the authorized G01 example correction');
// Authorized G01.2 final-QA exception: G09-3 prompt clarified that the definite article is required.
// Previous baseline: 050719062ea009fc89c241f117b7d7172d480a67b6634f7972ae094c201615bb
assert.equal(hash(protectedExercises), '4f82a911468ddbd4fac4defadd28c7852f311829b42150e4276255b3ccff9a70', 'Approved exercises changed outside the authorized G09-3 wording correction');
assert.equal(hash(protectedNonEnglishUi), 'c15ad78339ef0fd30cbe0ed58caf672dacb4cc6f026dd6615c90a29d7b18daa1', 'Non-English interface copy changed');
assert.equal(hash(grammarLessons.map((lesson) => lesson.id)), '9c6d6529000d3f01757b314f35548354af4a7aeb7bd78f0689ba39e5de98f8df', 'Lesson IDs changed');

assert.equal(grammarUnits.length, 7, 'Expected seven grammar units');
assert.equal(grammarLessons.length, 28, 'Expected 28 grammar lessons');
assert.deepEqual(languageCodes, ['en', 'uk', 'ar', 'fa', 'ps']);
assert.equal(grammarLanguages.ar.direction, 'rtl');
assert.equal(grammarLanguages.fa.direction, 'rtl');
assert.equal(grammarLanguages.ps.direction, 'rtl');
assert.match(grammarUi.ar.draft, /مراجعة بشرية/);
assert.match(grammarUi.fa.draft, /بازبینی/);
assert.match(grammarUi.ps.draft, /بیاکتنې/);

for (const unit of grammarUnits) {
  const lessons = getUnitLessons(unit.number);
  assert.equal(lessons.length, 4, `Unit ${unit.number} must contain four lessons`);
  const review = getUnitReviewExercises(unit.number);
  assert.equal(review.length, 6, `Unit ${unit.number} review must contain six exercises`);
  const covered = new Set(review.map((exercise) => grammarLessons.find((lesson) => [...lesson.guided, ...lesson.independent].some((candidate) => candidate.id === exercise.id))?.id));
  assert.equal(covered.size, 4, `Unit ${unit.number} review must revisit all four lessons`);
}

for (const [index, lesson] of grammarLessons.entries()) {
  assert.equal(lesson.number, index + 1, 'Lesson numbers must be sequential');
  assert.equal(lesson.id, `G${String(index + 1).padStart(2, '0')}`);
  assert.equal(lesson.guided.length, 2, `${lesson.id} must have two guided exercises`);
  assert.equal(lesson.independent.length, 2, `${lesson.id} must have two independent exercises`);
  assert.equal(lesson.examples.length, 2, `${lesson.id} must have two examples`);
  assert.ok(lesson.englishGuide, `${lesson.id} is missing its reviewed English guide`);
  assert.ok(lesson.englishGuide.titleDescription.trim() && lesson.englishGuide.sectionHeading.trim() && lesson.englishGuide.intro.trim(), `${lesson.id} English guide headings are incomplete`);
  assert.ok(lesson.englishGuide.useCases.length >= 2, `${lesson.id} needs meaningful everyday use cases`);
  assert.ok(lesson.englishGuide.steps.length >= 2, `${lesson.id} needs step-by-step guidance`);
  assert.ok(lesson.englishGuide.analyses.length >= 2, `${lesson.id} needs sentence analysis`);
  assert.equal(lesson.englishGuide.exampleHighlights.length, lesson.examples.length, `${lesson.id} must identify the focus in both examples`);
  lesson.examples.forEach((example, exampleIndex) => assert.ok(example.de.includes(lesson.englishGuide.exampleHighlights[exampleIndex]), `${lesson.id} example highlight is not present in the German sentence`));
  for (const localized of [lesson.objective, lesson.explanation, lesson.feedback, ...lesson.examples.map((example) => example.meaning)]) {
    for (const code of languageCodes) assert.ok(localized[code]?.trim(), `${lesson.id} is missing ${code} learner support`);
  }
  for (const exercise of [...lesson.guided, ...lesson.independent]) {
    assert.ok(!exerciseIds.has(exercise.id), `Duplicate exercise ID ${exercise.id}`);
    exerciseIds.add(exercise.id);
    assert.ok(exercise.prompt.trim() && exercise.answer.trim(), `${exercise.id} is incomplete`);
    if (exercise.kind === 'choice') assert.ok(exercise.options?.includes(exercise.answer), `${exercise.id} answer is not an option`);
    if (exercise.kind === 'fill') assert.ok(exercise.accepted?.includes(exercise.answer), `${exercise.id} answer is not accepted`);
    if (exercise.kind === 'order') {
      const expected = [...exercise.answer.replace(/\s+/g, '')].sort().join('');
      const available = [...(exercise.tokens ?? []).join('').replace(/\s+/g, '')].sort().join('');
      assert.equal(available, expected, `${exercise.id} tokens do not build the answer`);
    }
  }
  const route = path.join(root, 'dist', 'grammar', `lesson-${String(lesson.number).padStart(2, '0')}`, 'index.html');
  await access(route);
  const html = await readFile(route, 'utf8');
  assert.match(html, new RegExp(`<h1[^>]*>${lesson.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
  assert.equal((html.match(/class="grammar-exercise/g) ?? []).length, 4, `${lesson.id} built exercise count`);
  assert.match(html, /id="lesson-unit-select"/, `${lesson.id} is missing unit navigation`);
  assert.match(html, /id="lesson-select"/, `${lesson.id} is missing lesson navigation`);
  assert.match(html, /id="lesson-search"/, `${lesson.id} is missing topic search`);
  assert.doesNotMatch(html, /class="translation-draft"/, `${lesson.id} exposes an internal draft-review notice`);
}

assert.equal(grammarLessons.find((lesson) => lesson.id === 'G24')?.englishGuide?.sectionHeading, 'When do we use dative pronouns?');

const clarifiedPronounExample = grammarLessons.find((lesson) => lesson.id === 'G01')?.examples[0];
assert.deepEqual(clarifiedPronounExample, {
  de: 'Das ist Samira. Sie kommt aus Syrien.',
  meaning: {
    en: 'This is Samira. She comes from Syria.',
    uk: 'Це Саміра. Вона із Сирії.',
    ar: 'هذه سميرة. هي من سوريا.',
    fa: 'این سمیرا است. او از سوریه می‌آید.',
    ps: 'دا سمیرا ده. هغه له سوریې راځي.',
  },
});
assert.equal(grammarLessons.find((lesson) => lesson.id === 'G01')?.englishGuide?.exampleHighlights[0], 'Sie');

const clarifiedArticleExercise = grammarLessons.find((lesson) => lesson.id === 'G09')?.independent.find((exercise) => exercise.id === 'G09-3');
assert.deepEqual(clarifiedArticleExercise, {
  id: 'G09-3',
  kind: 'fill',
  prompt: 'Add the definite article: ___ Bus kommt um acht.',
  answer: 'Der',
  accepted: ['Der'],
});

const kinds = new Set(grammarLessons.flatMap((lesson) => [...lesson.guided, ...lesson.independent]).map((exercise) => exercise.kind));
assert.deepEqual([...kinds].sort(), ['choice', 'fill', 'order']);
assert.equal(exerciseIds.size, 112, 'Expected 112 unique lesson exercises');
assert.equal(Array.from({ length: 7 }, (_, index) => getUnitReviewExercises(index + 1).length).reduce((sum, count) => sum + count, 0), 42, 'Expected 42 unit-review placements');
assert.equal(getFinalAssessmentExercises().length, 28, 'Final assessment must contain one exercise per lesson');
assert.equal(new Set(getFinalAssessmentExercises().map((exercise) => exercise.id)).size, 28, 'Final questions must be unique');

for (let unit = 1; unit <= 7; unit += 1) await access(path.join(root, 'dist', 'grammar', `unit-${String(unit).padStart(2, '0')}-review`, 'index.html'));
await access(path.join(root, 'dist', 'grammar', 'final-assessment', 'index.html'));
const alias = await readFile(path.join(root, 'dist', 'grammar', 'a1', 'index.html'), 'utf8');
assert.match(alias, /<link rel="canonical" href="https:\/\/www\.bedeutsch\.de\/grammar\/"/);

const progressSource = await readFile(path.join(root, 'src', 'scripts', 'grammar-progress.ts'), 'utf8');
assert.match(progressSource, /be-deutsch:a1-grammar:v1/);
assert.ok(!progressSource.includes('be-deutsch:a1-vocabulary:v2'));
assert.ok(!progressSource.includes('be-deutsch:l01:listening:v1'));

const grammarScript = await readFile(path.join(root, 'src', 'scripts', 'grammar.ts'), 'utf8');
const grammarStyles = await readFile(path.join(root, 'src', 'styles', 'grammar.css'), 'utf8');
const exerciseComponent = await readFile(path.join(root, 'src', 'components', 'GrammarExercise.astro'), 'utf8');
assert.match(grammarScript, /dataset\.answerFeedback = result/);
assert.match(grammarScript, /textContent = correct \? '✓' : '✕'/);
assert.equal((grammarScript.match(/playFeedback\(/g) ?? []).length, 1, 'Answer submission must trigger one feedback-sound call');
for (const token of ['#16a34a', '#15803d', '#f0fdf4', '#dc2626', '#b91c1c', '#fef2f2', 'content: "✓"', 'content: "✕"']) assert.ok(grammarStyles.includes(token), `Missing visual feedback token ${token}`);
assert.ok(exerciseComponent.includes('id={`${exercise.id}-feedback`}'), 'Exercise feedback needs a stable accessible ID');

const header = await readFile(path.join(root, 'src', 'components', 'SiteHeader.astro'), 'utf8');
for (const category of ['Vocabulary', 'Listening', 'Grammar', 'Podcasts']) assert.match(header, new RegExp(`>${category}<|label: '${category}'`));
for (const route of ['/vocabulary/', '/listening/', '/grammar/', '/podcasts/']) assert.ok(header.includes(route), `Navigation is missing ${route}`);

console.log(`Grammar checks passed: ${grammarUnits.length} units, ${grammarLessons.length} lessons, ${exerciseIds.size} unique lesson exercises, 42 unit-review placements, 28 final-assessment placements (182 total rendered placements), five draft support languages and isolated progress storage.`);
