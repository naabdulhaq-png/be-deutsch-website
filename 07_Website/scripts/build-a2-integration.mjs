import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(site, '..', '..', '..');
const content = path.join(root, 'outputs', 'BD-A2-CONTENT-01');
const qa = path.join(root, 'outputs', 'BD-A2-QA-01');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write = (p, value) => {
  const target = path.join(site, p);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n', 'utf8');
};

const blueprintPath = path.join(content, 'baseline', 'ten_unit_curriculum_baseline.json');
const vocabularyPath = path.join(content, 'vocabulary', 'a2_vocabulary_inventory.json');
const grammarPath = path.join(content, 'grammar', 'a2_grammar_curriculum.json');
const exercisesPath = path.join(content, 'exercises', 'a2_combined_exercise_bank.json');
const listeningPath = path.join(qa, 'listening', 'corrected_listening_passages.json');
const podcastPath = path.join(qa, 'podcasts', 'corrected_podcast_episodes.json');
const localizationPath = path.join(qa, 'localization', 'five_language_learning_support_complete.json');
const unit1Path = path.join(site, 'src', 'a2', 'data', 'course.json');

const blueprint = read(blueprintPath);
const vocabulary = read(vocabularyPath).records;
const grammarSource = read(grammarPath);
const exercisesSource = read(exercisesPath);
const listening = read(listeningPath).passages;
const podcasts = read(podcastPath).episodes;
const localizationDoc = read(localizationPath);
const unit1 = read(unit1Path);

const approvedGrammar = grammarSource.approved_existing.map(item => {
  const full = unit1.grammar.find(x => x.id === item.id);
  return {
    id: item.id,
    unit: 1,
    title: item.title,
    source_status: item.source_status,
    preserved_route: `/a2/unit-1/grammar/${item.id.slice(-3).toLowerCase()}/`,
    full_source_preserved_in_unit1_course: Boolean(full)
  };
});
const grammar = [...approvedGrammar, ...grammarSource.new_draft_lessons];
const exercises = [...exercisesSource.vocabulary, ...exercisesSource.grammar];
const localization = localizationDoc.items;

const byUnit = (items, unit) => items.filter(item => item.unit === unit);
const lessonGroups = records => [...new Map(records.map(record => [record.lesson_id, {
  id: record.lesson_id,
  topic: record.topic,
  records: records.filter(x => x.lesson_id === record.lesson_id)
}])).values()];
const listeningGroups = records => [...new Map(records.map(record => [record.lesson_id, {
  id: record.lesson_id,
  title_de: record.lesson_title_de,
  passages: records.filter(x => x.lesson_id === record.lesson_id)
}])).values()];

const units = blueprint.units.map(unit => {
  const unitVocabulary = byUnit(vocabulary, unit.unit);
  const unitGrammar = byUnit(grammar, unit.unit);
  const unitListening = byUnit(listening, unit.unit);
  const unitPodcasts = podcasts.filter(p => p.unit_placement.includes(unit.unit));
  return {
    ...unit,
    id: `A2-U${String(unit.unit).padStart(2, '0')}`,
    slug: `unit-${unit.unit}`,
    vocabulary_lessons: lessonGroups(unitVocabulary).map(x => ({ id: x.id, topic: x.topic, record_count: x.records.length })),
    grammar_lessons: unitGrammar.map(x => ({ id: x.id, title: x.title, source_status: x.source_status })),
    listening_lessons: listeningGroups(unitListening).map(x => ({ id: x.id, title_de: x.title_de, passage_count: x.passages.length })),
    podcast_episodes: unitPodcasts.map(x => ({ id: x.id, blueprint_ref: x.blueprint_ref, title_de: x.title_de, chapter_count: x.chapters.length })),
    revision_route: `/a2/unit-${unit.unit}/revision/`,
    assessment_available: unit.unit === 1
  };
});

const integrated = {
  metadata: {
    package_id: 'BD-UI-08',
    generated: '2026-11-02',
    source_status: 'MIXED_APPROVED_UNIT1_AND_AI_DRAFT_UNITS2_TO10',
    publication_authorized: false,
    human_approved_new_content: false,
    audio_policy: 'Existing approved Unit 1 assets only; all new Listening and Podcast audio pending',
    support_languages: {
      en: { label: 'English', dir: 'ltr' },
      ps: { label: 'پښتو', dir: 'rtl' },
      fa: { label: 'فارسی', dir: 'rtl' },
      ar: { label: 'العربية', dir: 'rtl' },
      uk: { label: 'Українська', dir: 'ltr' }
    },
    source_checksums: {
      blueprint: sha(blueprintPath),
      vocabulary: sha(vocabularyPath),
      grammar: sha(grammarPath),
      exercises: sha(exercisesPath),
      listening: sha(listeningPath),
      podcasts: sha(podcastPath),
      localization: sha(localizationPath),
      approved_unit1_course: sha(unit1Path)
    }
  },
  units,
  vocabulary,
  grammar,
  exercises,
  listening,
  podcasts,
  localization
};

const reviewerItems = [
  ...vocabulary.map(item => ({
    id: item.id, type: 'vocabulary', unit: item.unit, title: item.german.display,
    status: item.source_status, route: item.unit === 1 ? `/a2/unit-1/vocabulary/${item.lesson_id.slice(-3).toLowerCase()}/#${item.id}` : `/a2/unit-${item.unit}/vocabulary/${item.lesson_id.slice(-3).toLowerCase()}/#${item.id}`
  })),
  ...grammar.map(item => ({
    id: item.id, type: 'grammar', unit: item.unit ?? 1, title: item.title,
    status: item.source_status, route: `/a2/unit-${item.unit ?? 1}/grammar/${item.id.slice(-3).toLowerCase()}/`
  })),
  ...listening.map(item => ({
    id: item.id, type: 'listening', unit: item.unit, title: item.title_de,
    status: item.source_status, audio_status: item.audio.status, route: `/a2/unit-${item.unit}/listening/${item.lesson_id.slice(-3).toLowerCase()}/#${item.id}`
  })),
  ...podcasts.map(item => ({
    id: item.id, type: 'podcast', unit: item.unit_placement[0], title: item.title_de,
    status: item.source_status, audio_status: item.audio.status, route: `/a2/unit-${item.unit_placement[0]}/podcast/${item.blueprint_ref.toLowerCase()}/`
  })),
  ...exercises.map(item => {
    const exerciseUnit = item.unit ?? Number(item.id.match(/^A2-U(\d{2})-/)?.[1]);
    return {
      id: item.id, type: 'exercise', unit: exerciseUnit, title: item.prompt_de,
      status: item.source_status, route: item.parent_lesson_id ? `/a2/unit-${exerciseUnit}/grammar/${item.parent_lesson_id.slice(-3).toLowerCase()}/#${item.id}` : `/a2/unit-${exerciseUnit}/vocabulary/${item.parent_lexical_id.slice(7, 10).toLowerCase()}/#${item.id}`
    };
  })
];

const inventory = {
  metadata: integrated.metadata,
  counts: {
    units: units.length,
    vocabulary: vocabulary.length,
    vocabulary_approved_unit1: vocabulary.filter(x => x.unit === 1).length,
    vocabulary_draft: vocabulary.filter(x => x.source_status === 'NEW_DRAFT_MATERIAL').length,
    grammar: grammar.length,
    grammar_approved_unit1: approvedGrammar.length,
    grammar_draft: grammarSource.new_draft_lessons.length,
    exercises: exercises.length,
    listening_new: listening.length,
    podcasts_new: podcasts.length,
    podcast_chapters_new: podcasts.reduce((n, x) => n + x.chapters.length, 0),
    localization_items: localization.length,
    existing_unit1_assessment_questions: ['integrated:grammar', 'integrated:vocabulary', 'integrated:listening', 'integrated:podcast']
      .reduce((count, context) => count + (unit1.assessments[context]?.questions?.length ?? 0), 0),
    existing_unit1_audio_assets: unit1.audio.length
  },
  units: units.map(u => ({ id: u.id, title: u.title, routes: {
    overview: `/a2/${u.slug}/`,
    vocabulary: u.vocabulary_lessons.map(x => `/a2/${u.slug}/vocabulary/${x.id.slice(-3).toLowerCase()}/`),
    grammar: u.grammar_lessons.map(x => `/a2/${u.slug}/grammar/${x.id.slice(-3).toLowerCase()}/`),
    listening: u.listening_lessons.map(x => `/a2/${u.slug}/listening/${x.id.slice(-3).toLowerCase()}/`),
    podcasts: u.podcast_episodes.map(x => `/a2/${u.slug}/podcast/${x.blueprint_ref.toLowerCase()}/`),
    revision: u.revision_route,
    assessment: u.assessment_available ? `/a2/${u.slug}/review/` : null
  }})),
  reviewer_items: reviewerItems
};

write('src/a2/data/integrated-course.json', integrated);
write('src/a2/data/integrated-review-index.json', inventory);
write('public/a2/integrated-review-index.json', inventory);
console.log(JSON.stringify(inventory.counts, null, 2));
