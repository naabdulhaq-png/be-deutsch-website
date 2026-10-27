import { playFeedback, stopFeedback } from './feedback-audio';
import { grammarProgressKey, loadGrammarProgress, saveGrammarProgress, type AssessmentProgress } from './grammar-progress';
import type { GrammarLanguage, LocalizedText } from '../data/grammar-course';

type Payload = {
  view: 'course' | 'lesson' | 'review' | 'final';
  lesson?: { id: string; number: number; unit: number; objective: LocalizedText; explanation: LocalizedText; feedback: LocalizedText; examples: { meaning: LocalizedText }[]; englishGuide?: { titleDescription: string } };
  unit?: number;
  languages: Record<GrammarLanguage, { direction: 'ltr' | 'rtl' }>;
  ui: Record<GrammarLanguage, Record<string, string>>;
  totalLessons: number;
  courseMap: { number: number; title: string; lessons: { number: number; title: string; id: string; searchText: string }[] }[];
  exerciseIds: string[];
  feedbackByOwner: Record<string, LocalizedText>;
};

const script = document.getElementById('grammar-data');
if (!script?.textContent) throw new Error('Grammar course data is unavailable.');
const data = JSON.parse(script.textContent) as Payload;
const state = loadGrammarProgress();
const normalize = (value: string) => value.toLocaleLowerCase('de-DE').replace(/[.!?،؟]/g, '').replace(/\s+/g, ' ').trim();
const ui = (key: string) => data.ui[state.language][key] ?? data.ui.en[key] ?? key;
const save = () => saveGrammarProgress(state);

function setLanguage(language: GrammarLanguage, persist = true) {
  state.language = language;
  if (persist) save();
  const direction = data.languages[language].direction;
  document.querySelectorAll<HTMLElement>('.localized-panel,.exercise-feedback,.translation-draft').forEach((element) => {
    element.lang = language;
    element.dir = direction;
  });
  document.querySelectorAll<HTMLElement>('[data-ui]').forEach((element) => { element.textContent = ui(element.dataset.ui!); });
  document.querySelectorAll<HTMLElement>('[data-exercise-instruction]').forEach((element) => {
    const kind = element.closest<HTMLElement>('.grammar-exercise')?.dataset.kind;
    element.textContent = ui(kind === 'choice' ? 'choose' : kind === 'fill' ? 'fill' : 'order');
  });
  if (data.lesson) {
    document.getElementById('lesson-objective')!.textContent = data.lesson.objective[language];
    document.getElementById('lesson-explanation')!.textContent = data.lesson.explanation[language];
    document.getElementById('lesson-rule')!.textContent = data.lesson.feedback[language];
    const titleDescription = document.getElementById('lesson-title-description');
    if (titleDescription) {
      titleDescription.textContent = language === 'en' && data.lesson.englishGuide ? data.lesson.englishGuide.titleDescription : data.lesson.objective[language];
      titleDescription.lang = language;
      titleDescription.dir = direction;
    }
    document.querySelectorAll<HTMLElement>('.example-meaning').forEach((element) => {
      const index = Number(element.dataset.example);
      element.textContent = data.lesson!.examples[index].meaning[language];
      element.lang = language;
      element.dir = direction;
    });
  }
  document.querySelectorAll<HTMLElement>('[data-english-only]').forEach((element) => { element.hidden = language !== 'en'; });
  document.querySelectorAll<HTMLElement>('.grammar-exercise').forEach((element) => {
    const correct = element.classList.contains('is-correct');
    const incorrect = element.classList.contains('is-incorrect');
    if (!correct && !incorrect) return;
    const reason = lessonFeedbackFor(element.dataset.owner!);
    const feedback = element.querySelector<HTMLElement>('.exercise-feedback')!;
    feedback.textContent = `${correct ? ui('correct') : ui('incorrect')} ${reason?.[language] ?? ''}${correct ? '' : ` ${ui('answer')}: ${element.dataset.answer}. ${element.dataset.assessment === 'true' ? '' : ui('retry')}`}`;
  });
}

function updateCourse() {
  const completed = Object.values(state.lessons).filter((record) => record.completed).length;
  const progress = document.getElementById('grammar-progress') as HTMLProgressElement;
  if (progress) progress.value = completed;
  const label = document.getElementById('grammar-progress-label');
  if (label) label.textContent = `${completed} of ${data.totalLessons} lessons completed`;
  const title = document.getElementById('grammar-progress-title');
  if (title) title.textContent = completed === 0 ? 'Ready for your first sentence.' : completed === data.totalLessons ? 'All grammar lessons complete.' : 'Your next sentence is waiting.';
  document.querySelectorAll<HTMLElement>('[data-grammar-lesson]').forEach((card) => {
    const record = state.lessons[card.dataset.grammarLesson!];
    const status = card.querySelector<HTMLElement>('.lesson-card-status')!;
    card.classList.toggle('is-complete', record?.completed === true);
    status.textContent = record?.completed ? '✓ Completed' : record?.correct?.length ? `${record.correct.length}/4 correct · Resume` : 'Not started';
  });
  let reviewCount = 0;
  document.querySelectorAll<HTMLElement>('[data-review]').forEach((card) => {
    const record = state.reviews[card.dataset.review!];
    if (record?.complete) reviewCount += 1;
    card.querySelector<HTMLElement>('.review-score')!.textContent = record?.attempts ? `Best ${record.best}/6 · ${record.attempts} attempt${record.attempts === 1 ? '' : 's'}` : 'Not attempted';
  });
  const count = document.getElementById('review-count');
  if (count) count.textContent = String(reviewCount);
  const final = document.getElementById('final-score');
  if (final) final.textContent = state.final.attempts ? `${state.final.best}/28` : '—';
  const continueLink = document.getElementById('grammar-continue') as HTMLAnchorElement | null;
  if (continueLink) {
    continueLink.href = state.resumePath;
    continueLink.firstChild!.textContent = completed === 0 ? 'Start lesson 1 ' : 'Continue learning ';
  }
}

function exerciseAnswer(element: HTMLElement) {
  const kind = element.dataset.kind;
  if (kind === 'choice') return element.querySelector<HTMLElement>('.choice-option[aria-pressed="true"]')?.dataset.value ?? '';
  if (kind === 'fill') return (element.querySelector<HTMLInputElement>('input')?.value ?? '').trim();
  return [...element.querySelectorAll<HTMLElement>('.order-answer .word-token')].map((token) => token.dataset.token).join(' ');
}

function clearAnswerFeedback(element: HTMLElement) {
  if (element.dataset.locked === 'true') return;
  element.classList.remove('is-correct', 'is-incorrect');
  element.querySelector<HTMLElement>('.exercise-state')!.textContent = '○';
  const feedback = element.querySelector<HTMLElement>('.exercise-feedback')!;
  feedback.hidden = true;
  feedback.textContent = '';
  element.querySelectorAll<HTMLElement>('[data-answer-feedback]').forEach((target) => {
    delete target.dataset.answerFeedback;
    target.removeAttribute('aria-describedby');
    target.removeAttribute('aria-invalid');
  });
}

function showAnswerFeedback(element: HTMLElement, correct: boolean) {
  const result = correct ? 'correct' : 'incorrect';
  const feedbackId = `${element.dataset.exerciseId}-feedback`;
  const kind = element.dataset.kind;
  let target: HTMLElement | null = null;

  if (kind === 'choice') target = element.querySelector<HTMLElement>('.choice-option[aria-pressed="true"]');
  if (kind === 'fill') {
    target = element.querySelector<HTMLInputElement>('input');
    const label = target?.closest<HTMLElement>('label');
    if (label) label.dataset.answerFeedback = result;
    target?.setAttribute('aria-invalid', String(!correct));
  }
  if (kind === 'order') target = element.querySelector<HTMLElement>('.order-answer');

  if (target) {
    target.dataset.answerFeedback = result;
    target.setAttribute('aria-describedby', feedbackId);
  }
}

function resetOrder(element: HTMLElement) {
  clearAnswerFeedback(element);
  const bank = element.querySelector<HTMLElement>('.order-bank')!;
  [...element.querySelectorAll<HTMLElement>('.word-token')].sort((a, b) => Number(a.dataset.tokenIndex) - Number(b.dataset.tokenIndex)).forEach((token) => bank.append(token));
}

function lockExercise(element: HTMLElement, correct: boolean) {
  element.dataset.locked = 'true';
  element.classList.toggle('is-correct', correct);
  element.classList.toggle('is-incorrect', !correct);
  element.querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.disabled = true; });
  const input = element.querySelector<HTMLInputElement>('input');
  if (input) input.disabled = true;
}

function lessonFeedbackFor(owner: string): LocalizedText | undefined {
  if (data.lesson?.id === owner) return data.lesson.feedback;
  return data.feedbackByOwner[owner];
}

function assessmentRecord(): AssessmentProgress {
  if (data.view === 'final') return state.final;
  const key = `U${data.unit}`;
  state.reviews[key] ??= { answers: {}, complete: false, best: 0, last: 0, attempts: 0 };
  return state.reviews[key];
}

function refreshAssessment() {
  const record = assessmentRecord();
  const answered = Object.keys(record.answers).length;
  const total = data.exerciseIds.length;
  document.getElementById('assessment-progress')!.textContent = `${answered} of ${total} answered`;
  (document.getElementById('assessment-progress-bar') as HTMLProgressElement).value = answered;
  document.getElementById('assessment-best')!.textContent = record.attempts ? `Latest ${record.last}/${total} · Best ${record.best}/${total} · ${record.attempts} attempt${record.attempts === 1 ? '' : 's'}` : 'No saved result yet.';
  if (record.complete) {
    const result = document.getElementById('assessment-result')!;
    result.hidden = false;
    document.getElementById('assessment-result-copy')!.textContent = `You answered ${record.last} of ${total} correctly. Your best result is ${record.best} of ${total}.`;
  }
}

function markResult(element: HTMLElement, correct: boolean) {
  const id = element.dataset.exerciseId!;
  const answer = element.dataset.answer!;
  const assessment = element.dataset.assessment === 'true';
  const reason = lessonFeedbackFor(element.dataset.owner!);
  const feedback = element.querySelector<HTMLElement>('.exercise-feedback')!;
  feedback.hidden = false;
  feedback.textContent = `${correct ? ui('correct') : ui('incorrect')} ${reason?.[state.language] ?? ''}${correct ? '' : ` ${ui('answer')}: ${answer}. ${assessment ? '' : ui('retry')}`}`;
  feedback.lang = state.language;
  feedback.dir = data.languages[state.language].direction;
  element.classList.toggle('is-correct', correct);
  element.classList.toggle('is-incorrect', !correct);
  element.querySelector<HTMLElement>('.exercise-state')!.textContent = correct ? '✓' : '✕';
  showAnswerFeedback(element, correct);
  playFeedback(correct ? 'correct' : 'incorrect', state.sound);

  if (assessment) {
    const record = assessmentRecord();
    if (Object.hasOwn(record.answers, id)) return;
    record.answers[id] = correct;
    lockExercise(element, correct);
    if (Object.keys(record.answers).length === data.exerciseIds.length) {
      const score = Object.values(record.answers).filter(Boolean).length;
      record.last = score;
      record.best = Math.max(record.best, score);
      record.attempts += 1;
      record.complete = true;
      record.completedAt = new Date().toISOString();
      state.resumePath = '/grammar/lesson-01/';
    }
    save();
    refreshAssessment();
    return;
  }

  const lessonId = data.lesson!.id;
  const record = state.lessons[lessonId] ?? { correct: [], completed: false, updatedAt: '' };
  if (correct && !record.correct.includes(id)) record.correct.push(id);
  record.completed = data.exerciseIds.every((exerciseId) => record.correct.includes(exerciseId));
  record.updatedAt = new Date().toISOString();
  state.lessons[lessonId] = record;
  state.resumePath = record.completed
    ? data.lesson!.number % 4 === 0 ? `/grammar/unit-${String(Math.ceil(data.lesson!.number / 4)).padStart(2, '0')}-review/` : `/grammar/lesson-${String(data.lesson!.number + 1).padStart(2, '0')}/`
    : location.pathname;
  save();
  refreshLesson();
}

function submitExercise(element: HTMLElement) {
  if (element.dataset.locked === 'true') return;
  const response = exerciseAnswer(element);
  if (!response) return;
  const accepted = JSON.parse(element.dataset.accepted ?? '[]') as string[];
  markResult(element, accepted.some((answer) => normalize(answer) === normalize(response)));
}

function refreshLesson() {
  if (!data.lesson) return;
  const record = state.lessons[data.lesson.id] ?? { correct: [], completed: false };
  document.getElementById('lesson-correct')!.textContent = String(record.correct.length);
  document.querySelectorAll<HTMLElement>('.grammar-exercise').forEach((element) => {
    if (record.correct.includes(element.dataset.exerciseId!)) {
      element.classList.add('is-correct');
      element.querySelector<HTMLElement>('.exercise-state')!.textContent = '✓';
    }
  });
  const completion = document.getElementById('lesson-completion')!;
  completion.classList.toggle('is-complete', record.completed);
  completion.textContent = record.completed ? `✓ ${ui('completed')}` : `${record.correct.length} of ${data.exerciseIds.length} activities correct. Complete all four to finish this lesson.`;
}

document.querySelectorAll<HTMLElement>('.grammar-exercise').forEach((exercise) => {
  exercise.querySelectorAll<HTMLButtonElement>('.choice-option').forEach((button) => button.addEventListener('click', () => {
    if (exercise.dataset.locked === 'true') return;
    clearAnswerFeedback(exercise);
    exercise.querySelectorAll<HTMLButtonElement>('.choice-option').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
    submitExercise(exercise);
  }));
  exercise.querySelector<HTMLInputElement>('.fill-form input')?.addEventListener('input', () => clearAnswerFeedback(exercise));
  exercise.querySelector<HTMLFormElement>('.fill-form')?.addEventListener('submit', (event) => { event.preventDefault(); submitExercise(exercise); });
  exercise.querySelectorAll<HTMLButtonElement>('.word-token').forEach((token) => token.addEventListener('click', () => {
    if (exercise.dataset.locked === 'true') return;
    clearAnswerFeedback(exercise);
    const answer = exercise.querySelector<HTMLElement>('.order-answer')!;
    const bank = exercise.querySelector<HTMLElement>('.order-bank')!;
    (token.parentElement === answer ? bank : answer).append(token);
  }));
  exercise.querySelector<HTMLButtonElement>('.check-order')?.addEventListener('click', () => submitExercise(exercise));
  exercise.querySelector<HTMLButtonElement>('.clear-order')?.addEventListener('click', () => resetOrder(exercise));
});

const language = document.getElementById('grammar-language') as HTMLSelectElement | null;
if (language) {
  language.value = state.language;
  language.addEventListener('change', () => setLanguage(language.value as GrammarLanguage));
}
const sound = document.getElementById('grammar-sound') as HTMLButtonElement | null;
const updateSound = () => { if (sound) { sound.setAttribute('aria-pressed', String(state.sound)); sound.textContent = `Pair H feedback sound: ${state.sound ? 'on' : 'off'}`; } };
sound?.addEventListener('click', () => { stopFeedback(); state.sound = !state.sound; save(); updateSound(); });
updateSound();

const unitSelect = document.getElementById('lesson-unit-select') as HTMLSelectElement | null;
const lessonSelect = document.getElementById('lesson-select') as HTMLSelectElement | null;
const jumpForm = document.getElementById('lesson-jump-form') as HTMLFormElement | null;
const searchInput = document.getElementById('lesson-search') as HTMLInputElement | null;
const searchResults = document.getElementById('lesson-search-results') as HTMLElement | null;
const lessonPath = (number: number) => `/grammar/lesson-${String(number).padStart(2, '0')}/`;
const populateLessons = (unitNumber: number, selected?: number) => {
  if (!lessonSelect) return;
  const courseUnit = data.courseMap.find((item) => item.number === unitNumber);
  lessonSelect.replaceChildren(...(courseUnit?.lessons ?? []).map((item) => {
    const option = document.createElement('option');
    option.value = String(item.number);
    option.textContent = `${String(item.number).padStart(2, '0')} · ${item.title}${item.number === data.lesson?.number ? ' · Current' : ''}`;
    option.selected = item.number === selected;
    return option;
  }));
};
unitSelect?.addEventListener('change', () => {
  const unitNumber = Number(unitSelect.value);
  populateLessons(unitNumber, unitNumber === data.lesson?.unit ? data.lesson.number : undefined);
});
jumpForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const number = Number(lessonSelect?.value);
  if (Number.isInteger(number) && number >= 1 && number <= 28) location.href = lessonPath(number);
});
const matchesFor = (query: string) => data.courseMap.flatMap((item) => item.lessons).filter((item) => `${item.number} ${item.searchText}`.toLocaleLowerCase('en').includes(query.toLocaleLowerCase('en').trim())).slice(0, 6);
const openSearchMatch = (number: number) => { location.href = lessonPath(number); };
const closeSearch = () => {
  if (!searchResults || !searchInput) return;
  searchResults.hidden = true;
  searchInput.setAttribute('aria-expanded', 'false');
};
searchInput?.addEventListener('input', () => {
  if (!searchResults) return;
  const query = searchInput.value.trim();
  const matches = query.length >= 2 ? matchesFor(query) : [];
  searchResults.replaceChildren(...matches.map((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'option');
    button.id = `lesson-search-option-${item.number}`;
    button.textContent = `${String(item.number).padStart(2, '0')} · ${item.title}`;
    button.addEventListener('click', () => openSearchMatch(item.number));
    button.addEventListener('keydown', (event) => {
      const buttons = [...searchResults.querySelectorAll<HTMLButtonElement>('button')];
      const index = buttons.indexOf(button);
      if (event.key === 'ArrowDown') { event.preventDefault(); (buttons[index + 1] ?? buttons[0])?.focus(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); (buttons[index - 1] ?? searchInput)?.focus(); }
      if (event.key === 'Escape') { event.preventDefault(); closeSearch(); searchInput.focus(); }
    });
    return button;
  }));
  searchResults.hidden = matches.length === 0;
  searchInput.setAttribute('aria-expanded', String(matches.length > 0));
});
searchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { closeSearch(); return; }
  if (event.key === 'ArrowDown') {
    const firstButton = searchResults?.querySelector<HTMLButtonElement>('button');
    if (firstButton) { event.preventDefault(); firstButton.focus(); }
    return;
  }
  if (event.key !== 'Enter') return;
  const first = matchesFor(searchInput.value)[0];
  if (first) { event.preventDefault(); openSearchMatch(first.number); }
});
document.addEventListener('click', (event) => {
  if (!searchInput?.closest('.lesson-search')?.contains(event.target as Node)) closeSearch();
});

if (data.view === 'course') updateCourse();
if (data.view === 'lesson') {
  if (!state.lessons[data.lesson!.id]?.completed) state.resumePath = location.pathname;
  save();
  refreshLesson();
}
if (data.view === 'review' || data.view === 'final') {
  const record = assessmentRecord();
  if (!record.complete) state.resumePath = location.pathname;
  document.querySelectorAll<HTMLElement>('.grammar-exercise').forEach((element) => {
    const saved = record.answers[element.dataset.exerciseId!];
    if (typeof saved === 'boolean') {
      lockExercise(element, saved);
      const reason = lessonFeedbackFor(element.dataset.owner!);
      const feedback = element.querySelector<HTMLElement>('.exercise-feedback')!;
      feedback.hidden = false;
      feedback.textContent = `${saved ? ui('correct') : ui('incorrect')} ${reason?.[state.language] ?? ''}${saved ? '' : ` ${ui('answer')}: ${element.dataset.answer}.`}`;
      element.querySelector<HTMLElement>('.exercise-state')!.textContent = saved ? '✓' : '✕';
    }
  });
  save();
  refreshAssessment();
  document.getElementById('retake-assessment')?.addEventListener('click', () => {
    record.answers = {};
    record.complete = false;
    save();
    location.reload();
  });
}
setLanguage(state.language, false);
window.addEventListener('storage', (event) => { if (event.key === grammarProgressKey) location.reload(); });
