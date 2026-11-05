export {};

const draftProgressKey = 'be-deutsch:a2-draft-progress:v1';

function readProgress(): Record<string, { completed: boolean; attempts: number }> {
  try { return JSON.parse(localStorage.getItem(draftProgressKey) ?? '{}'); } catch { return {}; }
}

function saveProgress(id: string, completed: boolean) {
  try {
    const progress = readProgress();
    const previous = progress[id] ?? { completed: false, attempts: 0 };
    progress[id] = { completed: previous.completed || completed, attempts: previous.attempts + 1 };
    localStorage.setItem(draftProgressKey, JSON.stringify(progress));
  } catch { /* Learning remains usable without storage. */ }
}

function normalizeAnswer(value: string) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').replace(/[.!?]+$/u, '');
}

function localized(value: unknown) {
  if (!value || typeof value === 'string') return String(value ?? '');
  const language = document.body.dataset.supportLanguage ?? 'en';
  const values = value as Record<string, string>;
  return values[language] ?? values.en ?? '';
}

function valueFor(card: HTMLElement) {
  const selected = card.querySelector<HTMLInputElement>('input[type="radio"]:checked');
  const input = card.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-exercise-input]');
  return selected?.value ?? input?.value ?? '';
}

document.addEventListener('click', event => {
  const target = event.target as HTMLElement;
  const hintButton = target.closest<HTMLButtonElement>('[data-exercise-hint]');
  if (hintButton) {
    const card = hintButton.closest<HTMLElement>('[data-draft-exercise]')!;
    const panel = card.querySelector<HTMLElement>('[data-hint-panel]')!;
    panel.hidden = !panel.hidden;
    hintButton.setAttribute('aria-expanded', String(!panel.hidden));
    return;
  }

  const token = target.closest<HTMLButtonElement>('[data-token]');
  if (token) {
    const card = token.closest<HTMLElement>('[data-draft-exercise]')!;
    const input = card.querySelector<HTMLInputElement>('[data-exercise-input]');
    if (input) {
      input.value = `${input.value}${input.value ? ' ' : ''}${token.dataset.token}`;
      input.focus();
    }
    return;
  }

  const secondHint = target.closest<HTMLButtonElement>('[data-second-hint]');
  if (secondHint) {
    const panel = secondHint.parentElement?.querySelector<HTMLElement>('[data-second-hint-panel]');
    if (panel) {
      panel.hidden = !panel.hidden;
      secondHint.setAttribute('aria-expanded', String(!panel.hidden));
    }
    return;
  }

  const check = target.closest<HTMLButtonElement>('[data-check-exercise]');
  if (check) {
    const card = check.closest<HTMLElement>('[data-draft-exercise]')!;
    const data = JSON.parse(card.dataset.answer ?? '{}');
    const feedback = card.querySelector<HTMLElement>('[data-exercise-feedback]')!;
    if (data.production) {
      const model = card.querySelector<HTMLElement>('[data-model-answer]');
      if (model) model.hidden = false;
      feedback.textContent = 'Use the three-point self-check. Open responses are not auto-scored.';
      feedback.dataset.state = 'review';
      saveProgress(card.id, false);
      return;
    }
    const response = normalizeAnswer(valueFor(card));
    const accepted = [data.correct, ...(data.accepted ?? [])].filter(Boolean).map((x: string) => normalizeAnswer(x));
    const correct = response.length > 0 && accepted.includes(response);
    feedback.textContent = localized(correct ? data.feedbackCorrect : data.feedbackIncorrect);
    feedback.dataset.state = correct ? 'correct' : 'incorrect';
    saveProgress(card.id, correct);
    return;
  }

  const reset = target.closest<HTMLButtonElement>('[data-reset-exercise]');
  if (reset) {
    const card = reset.closest<HTMLElement>('[data-draft-exercise]')!;
    card.querySelectorAll<HTMLInputElement>('input').forEach(input => { if (input.type === 'radio') input.checked = false; else input.value = ''; });
    card.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(input => { input.value = ''; });
    const feedback = card.querySelector<HTMLElement>('[data-exercise-feedback]');
    if (feedback) { feedback.textContent = ''; delete feedback.dataset.state; }
    const model = card.querySelector<HTMLElement>('[data-model-answer]');
    if (model) model.hidden = true;
    return;
  }

  const passageButton = target.closest<HTMLButtonElement>('[data-passage-select]');
  if (passageButton) {
    const container = passageButton.closest<HTMLElement>('[data-listening-review]')!;
    const id = passageButton.dataset.passageSelect;
    container.querySelectorAll<HTMLElement>('[data-passage-panel]').forEach(panel => { panel.hidden = panel.dataset.passagePanel !== id; });
    container.querySelectorAll<HTMLButtonElement>('[data-passage-select]').forEach(button => button.setAttribute('aria-pressed', String(button === passageButton)));
    document.getElementById(id ?? '')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const chapterButton = target.closest<HTMLButtonElement>('[data-chapter-select]');
  if (chapterButton) {
    const container = chapterButton.closest<HTMLElement>('[data-podcast-review]')!;
    const id = chapterButton.dataset.chapterSelect;
    document.querySelectorAll<HTMLElement>('[data-chapter-panel]').forEach(panel => { panel.hidden = panel.dataset.chapterPanel !== id; });
    container.querySelectorAll<HTMLButtonElement>('[data-chapter-select]').forEach(button => button.setAttribute('aria-pressed', String(button === chapterButton)));
    document.querySelector<HTMLElement>(`[data-chapter-panel="${CSS.escape(id ?? '')}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
});

function setupVocabularyBrowser(browser: HTMLElement) {
  const cards = [...browser.querySelectorAll<HTMLElement>('[data-vocab-card]')];
  const search = browser.querySelector<HTMLInputElement>('[data-vocab-search]');
  const filter = browser.querySelector<HTMLSelectElement>('[data-vocab-filter]');
  const status = browser.querySelector<HTMLElement>('[data-vocab-status]');
  const prev = browser.querySelector<HTMLButtonElement>('[data-vocab-prev]');
  const next = browser.querySelector<HTMLButtonElement>('[data-vocab-next]');
  let page = 0;
  const pageSize = 9;
  const render = () => {
    const q = (search?.value ?? '').trim().toLocaleLowerCase('de');
    const part = filter?.value ?? 'all';
    const filtered = cards.filter(card => (!q || (card.dataset.search ?? '').includes(q)) && (part === 'all' || card.dataset.part === part));
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages - 1);
    cards.forEach(card => card.hidden = true);
    filtered.slice(page * pageSize, page * pageSize + pageSize).forEach(card => card.hidden = false);
    if (status) status.textContent = `${filtered.length} records · page ${page + 1} of ${pages}`;
    if (prev) prev.disabled = page === 0;
    if (next) next.disabled = page >= pages - 1;
  };
  search?.addEventListener('input', () => { page = 0; render(); });
  filter?.addEventListener('change', () => { page = 0; render(); });
  prev?.addEventListener('click', () => { page--; render(); browser.scrollIntoView({ behavior: 'smooth' }); });
  next?.addEventListener('click', () => { page++; render(); browser.scrollIntoView({ behavior: 'smooth' }); });
  render();
}

document.querySelectorAll<HTMLElement>('[data-vocabulary-browser]').forEach(setupVocabularyBrowser);

function showLanguagePanels(language: string) {
  document.querySelectorAll<HTMLElement>('[data-language-panel]').forEach(panel => {
    panel.hidden = panel.dataset.languagePanel !== language;
  });
}
document.addEventListener('be-deutsch:support-language', (event: Event) => {
  const language = (event as CustomEvent).detail?.language ?? 'en';
  showLanguagePanels(language);
});
showLanguagePanels(document.body.dataset.supportLanguage ?? 'en');

const progress = readProgress();
document.querySelectorAll<HTMLElement>('[data-draft-exercise]').forEach(card => {
  if (progress[card.id]?.completed) card.dataset.completed = 'true';
});
