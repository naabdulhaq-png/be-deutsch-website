import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../src/a2/data/course.json', import.meta.url), 'utf8'));
const compact = (value) => JSON.stringify(value, null, 2);

console.log(compact({
  grammar: data.grammar.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    objectiveCount: lesson.objectives.length,
    steps: lesson.steps,
    structure: lesson.structure,
    examples: lesson.examples,
    mistakes: lesson.mistakes,
    links: lesson.links,
  })),
  vocabulary: data.vocabulary.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    lexicalCount: data.lexical.filter((item) => item.lesson_id === lesson.id).length,
    phrases: lesson.phrases,
  })),
  lexicalFields: Object.keys(data.lexical[0]),
  lexicalSamples: data.lexical.filter((item) =>
    item.part_of_speech.includes('verb') || item.headword === 'haben'
  ).slice(0, 8),
  listening: [...new Set(data.passages.map((passage) => passage.lesson_id))].map((lessonId) => ({
    lessonId,
    passages: data.passages.filter((passage) => passage.lesson_id === lessonId).map((passage) => ({
      id: passage.id,
      title: passage.title,
      objective: passage.objective,
      grammar_refs: passage.grammar_refs,
      vocabulary_refs: passage.vocabulary_refs,
      audio: data.audio.find((asset) => asset.id === `${passage.id}-AUDIO`)?.url,
      duration: data.audio.find((asset) => asset.id === `${passage.id}-AUDIO`)?.duration,
    })),
  })),
  podcast: {
    title: data.podcast.title,
    objective: data.podcast.objective,
    summary: data.podcast.summary_en,
    chapters: data.podcast.chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      start: chapter.start,
      end: chapter.end,
      keys: Object.keys(chapter),
      turnCount: chapter.turns.length,
    })),
    audio: data.audio.find((asset) => asset.id === 'A2-P01-AUDIO'),
  },
}));
