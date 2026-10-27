import type { GrammarLanguage } from '../data/grammar-course';

export const grammarProgressKey = 'be-deutsch:a1-grammar:v1';

export type LessonProgress = { correct: string[]; completed: boolean; updatedAt: string };
export type AssessmentProgress = {
  answers: Record<string, boolean>;
  complete: boolean;
  best: number;
  last: number;
  attempts: number;
  completedAt?: string;
};
export type GrammarProgress = {
  version: 1;
  language: GrammarLanguage;
  sound: boolean;
  resumePath: string;
  lessons: Record<string, LessonProgress>;
  reviews: Record<string, AssessmentProgress>;
  final: AssessmentProgress;
};

const blankAssessment = (): AssessmentProgress => ({ answers: {}, complete: false, best: 0, last: 0, attempts: 0 });
export const freshGrammarProgress = (): GrammarProgress => ({
  version: 1,
  language: 'en',
  sound: true,
  resumePath: '/grammar/lesson-01/',
  lessons: {},
  reviews: {},
  final: blankAssessment(),
});

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export function loadGrammarProgress(provided?: StoragePort): GrammarProgress {
  const fresh = freshGrammarProgress();
  try {
    const raw = (provided ?? localStorage).getItem(grammarProgressKey);
    if (!raw || raw.length > 100_000) return fresh;
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return fresh;
    if (['en', 'uk', 'ar', 'fa', 'ps'].includes(value.language)) fresh.language = value.language;
    fresh.sound = value.sound !== false;
    if (typeof value.resumePath === 'string' && /^\/grammar\/(?:lesson-\d{2}|unit-\d{2}-review|final-assessment)\/$/.test(value.resumePath)) fresh.resumePath = value.resumePath;
    if (value.lessons && typeof value.lessons === 'object') fresh.lessons = value.lessons;
    if (value.reviews && typeof value.reviews === 'object') fresh.reviews = value.reviews;
    if (value.final && typeof value.final === 'object') fresh.final = { ...blankAssessment(), ...value.final };
  } catch { /* The course remains usable if storage is blocked or malformed. */ }
  return fresh;
}
export function saveGrammarProgress(value: GrammarProgress, provided?: StoragePort) {
  try {
    (provided ?? localStorage).setItem(grammarProgressKey, JSON.stringify(value));
    return true;
  } catch { return false; }
}
