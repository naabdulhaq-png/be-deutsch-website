const STORAGE_KEY = 'be-deutsch:phase1:a2:v1';

type PageState = {
  reviewed: boolean;
  listened: boolean;
  questions: string[];
  words: string[];
  notes: Record<string, string>;
  audioPositions: Record<string, number>;
  translationMode: 'en' | 'de';
};

type PhaseState = { version: 1; pages: Record<string, PageState> };

const body = document.body;
const pageId = body.dataset.phase1Page ?? 'phase1';
const progressTotal = Number(body.dataset.progressTotal ?? 6);
let persistenceAvailable = true;

const blankPage = (): PageState => ({
  reviewed: false,
  listened: false,
  questions: [],
  words: [],
  notes: {},
  audioPositions: {},
  translationMode: 'en',
});

const loadState = (): PhaseState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, pages: {} };
    const parsed = JSON.parse(raw) as PhaseState;
    return parsed?.version === 1 && parsed.pages ? parsed : { version: 1, pages: {} };
  } catch {
    persistenceAvailable = false;
    return { version: 1, pages: {} };
  }
};

let state = loadState();
state.pages[pageId] = { ...blankPage(), ...(state.pages[pageId] ?? {}) };
let page = state.pages[pageId];

const save = () => {
  if (!persistenceAvailable) return;
  try {
    state.pages[pageId] = page;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    persistenceAvailable = false;
    const status = document.querySelector<HTMLElement>('[data-storage-status]');
    if (status) status.textContent = 'Browser storage is unavailable. Learning still works in this tab, but progress may be lost.';
  }
};

const toast = (message: string) => {
  const element = document.querySelector<HTMLElement>('[data-toast]');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  window.setTimeout(() => { element.hidden = true; }, 2600);
};

const storageStatus = document.querySelector<HTMLElement>('[data-storage-status]');
if (storageStatus && !persistenceAvailable) storageStatus.textContent = 'Browser storage is unavailable. Learning still works in this tab, but progress may be lost.';

const updateProgress = () => {
  const completedQuestions = page.questions.length;
  const completed = Math.min(progressTotal, completedQuestions + Number(page.listened) + Number(page.reviewed));
  const bar = document.querySelector<HTMLProgressElement>('[data-progress-bar]');
  const fraction = document.querySelector<HTMLElement>('[data-progress-fraction]');
  if (bar) bar.value = completed;
  if (fraction) fraction.textContent = `${completed} / ${progressTotal}`;
  const steps: Record<string, boolean> = {
    explore: true,
    listen: page.listened,
    practice: page.questions.length >= Math.max(1, progressTotal - 2),
    review: page.reviewed,
  };
  Object.entries(steps).forEach(([key, complete]) => document.querySelector(`[data-progress-step="${key}"]`)?.classList.toggle('is-complete', complete));
  const reviewButton = document.querySelector<HTMLButtonElement>('[data-mark-reviewed]');
  if (reviewButton) {
    reviewButton.textContent = page.reviewed ? 'Lesson reviewed ✓' : 'Mark lesson reviewed';
    reviewButton.setAttribute('aria-pressed', String(page.reviewed));
  }
};

document.querySelector<HTMLButtonElement>('[data-mark-reviewed]')?.addEventListener('click', () => {
  page.reviewed = !page.reviewed;
  save();
  updateProgress();
  toast(page.reviewed ? 'Lesson marked reviewed.' : 'Reviewed state removed.');
});

// Mobile course drawer
const drawer = document.querySelector<HTMLElement>('#course-drawer');
const drawerButton = document.querySelector<HTMLButtonElement>('[data-drawer-open]');
const backdrop = document.querySelector<HTMLElement>('.ds-drawer-backdrop');
const setDrawer = (open: boolean) => {
  drawer?.classList.toggle('is-open', open);
  drawerButton?.setAttribute('aria-expanded', String(open));
  if (backdrop) backdrop.hidden = !open;
  if (open) document.querySelector<HTMLButtonElement>('[data-drawer-close]')?.focus();
};
drawerButton?.addEventListener('click', () => setDrawer(true));
document.querySelectorAll<HTMLElement>('[data-drawer-close]').forEach((element) => element.addEventListener('click', () => setDrawer(false)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setDrawer(false);
    closeSearch();
  }
});

document.querySelector<HTMLSelectElement>('[data-course-switch]')?.addEventListener('change', (event) => {
  const target = event.currentTarget as HTMLSelectElement;
  window.location.assign(target.value);
});

// Search over real course metadata
const searchInput = document.querySelector<HTMLInputElement>('#course-search');
const searchResults = document.querySelector<HTMLElement>('#search-results');
type SearchItem = { title: string; subtitle: string; href: string; type: string };
let searchIndex: SearchItem[] = [];
try { searchIndex = JSON.parse(body.dataset.searchIndex ?? '[]') as SearchItem[]; } catch { searchIndex = []; }

function closeSearch() {
  if (searchResults) searchResults.hidden = true;
  searchInput?.setAttribute('aria-expanded', 'false');
}

const renderSearch = (query: string) => {
  if (!searchResults || !searchInput) return;
  const normalized = query.trim().toLocaleLowerCase('de');
  if (!normalized) return closeSearch();
  const matches = searchIndex.filter((item) => `${item.title} ${item.subtitle} ${item.type}`.toLocaleLowerCase('de').includes(normalized)).slice(0, 8);
  searchResults.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'ds-search-empty';
    empty.textContent = `No approved lesson or word matches “${query.trim()}”.`;
    searchResults.append(empty);
  } else {
    matches.forEach((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.setAttribute('role', 'option');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const subtitle = document.createElement('small');
      subtitle.textContent = item.subtitle;
      const type = document.createElement('span');
      type.textContent = item.type;
      link.append(title, subtitle, type);
      searchResults.append(link);
    });
  }
  searchResults.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
};
searchInput?.addEventListener('input', () => renderSearch(searchInput.value));
searchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    searchResults?.querySelector<HTMLAnchorElement>('a')?.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!(event.target as Element).closest('.ds-search')) closeSearch();
});

// Translation support uses only verified English text and German-only hiding.
const translationSelect = document.querySelector<HTMLSelectElement>('[data-translation-mode]');
const applyTranslationMode = (mode: 'en' | 'de') => {
  document.querySelectorAll<HTMLElement>('[data-language="en"]').forEach((element) => { element.hidden = mode === 'de'; });
  if (translationSelect) translationSelect.value = mode;
  page.translationMode = mode;
  save();
};
translationSelect?.addEventListener('change', () => applyTranslationMode(translationSelect.value as 'en' | 'de'));
applyTranslationMode(page.translationMode);

// Quick pronunciation and sentence audio.
const quickAudio = new Audio();
let quickAudioButton: HTMLButtonElement | null = null;
document.querySelectorAll<HTMLButtonElement>('[data-quick-audio]').forEach((button) => {
  button.addEventListener('click', () => {
    if (quickAudioButton === button && !quickAudio.paused) {
      quickAudio.pause();
      button.setAttribute('aria-pressed', 'false');
      return;
    }
    if (quickAudioButton) quickAudioButton.setAttribute('aria-pressed', 'false');
    quickAudioButton = button;
    button.setAttribute('aria-pressed', 'true');
    quickAudio.src = button.dataset.quickAudio ?? '';
    quickAudio.play().then(() => {
      page.listened = true;
      save();
      updateProgress();
      toast(`Playing ${button.dataset.audioLabel ?? 'audio'}.`);
    }).catch(() => toast('Audio could not start. Use the native player or try again.'));
  });
});
quickAudio.addEventListener('ended', () => quickAudioButton?.setAttribute('aria-pressed', 'false'));
quickAudio.addEventListener('error', () => toast('This approved audio file could not be loaded. Check the local server and retry.'));

// Full audio panels: custom helpers complement native controls.
document.querySelectorAll<HTMLElement>('[data-audio-panel]').forEach((panel) => {
  const audio = panel.querySelector<HTMLAudioElement>('audio');
  const status = panel.querySelector<HTMLElement>('[data-audio-status]');
  const resume = panel.querySelector<HTMLButtonElement>('[data-resume-audio]');
  const retry = panel.querySelector<HTMLButtonElement>('[data-retry-audio]');
  const assetId = panel.dataset.audioId ?? '';
  if (!audio) return;
  const savedPosition = page.audioPositions[assetId] ?? 0;
  if (resume && savedPosition > 2 && savedPosition < audio.duration - 1) {
    resume.hidden = false;
    resume.textContent = `Resume at ${Math.floor(savedPosition / 60)}:${Math.floor(savedPosition % 60).toString().padStart(2, '0')}`;
  }
  resume?.addEventListener('click', () => {
    audio.currentTime = savedPosition;
    audio.play().catch(() => undefined);
  });
  panel.querySelector<HTMLButtonElement>('[data-primary-play]')?.addEventListener('click', () => audio.paused ? audio.play().catch(() => undefined) : audio.pause());
  panel.querySelectorAll<HTMLButtonElement>('[data-skip]').forEach((button) => button.addEventListener('click', () => {
    audio.currentTime = Math.max(0, Math.min(audio.duration || Number.MAX_VALUE, audio.currentTime + Number(button.dataset.skip)));
  }));
  panel.querySelector<HTMLSelectElement>('[data-playback-speed]')?.addEventListener('change', (event) => {
    audio.playbackRate = Number((event.currentTarget as HTMLSelectElement).value);
  });
  audio.addEventListener('loadstart', () => { if (status) status.textContent = 'Loading approved audio…'; });
  audio.addEventListener('canplay', () => { if (status) status.textContent = 'Ready to play. Your position stays in this browser.'; if (retry) retry.hidden = true; });
  audio.addEventListener('play', () => {
    panel.classList.add('is-playing');
    page.listened = true;
    save();
    updateProgress();
    if (status) status.textContent = 'Playing';
  });
  audio.addEventListener('pause', () => { panel.classList.remove('is-playing'); if (status && !audio.ended) status.textContent = 'Paused'; });
  audio.addEventListener('ended', () => { panel.classList.remove('is-playing'); if (status) status.textContent = 'Audio complete'; });
  let lastSavedSecond = -1;
  audio.addEventListener('timeupdate', () => {
    const second = Math.floor(audio.currentTime);
    if (second !== lastSavedSecond && second % 2 === 0) {
      lastSavedSecond = second;
      page.audioPositions[assetId] = audio.currentTime;
      save();
    }
  });
  audio.addEventListener('error', () => {
    panel.classList.remove('is-playing');
    if (status) status.textContent = 'Audio did not load. Check that the local preview server is running, then retry.';
    if (retry) retry.hidden = false;
  });
  retry?.addEventListener('click', () => { retry.hidden = true; audio.load(); });
});

// Vocabulary filters, layouts and studied states.
const vocabularyGrid = document.querySelector<HTMLElement>('[data-vocabulary-grid]');
const vocabularyCards = [...document.querySelectorAll<HTMLElement>('[data-vocab-status]')];
const filterStatus = document.querySelector<HTMLElement>('[data-filter-status]');
const vocabularyEmpty = document.querySelector<HTMLElement>('[data-vocab-empty]');
document.querySelectorAll<HTMLButtonElement>('[data-vocab-filter]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll<HTMLButtonElement>('[data-vocab-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  const filter = button.dataset.vocabFilter ?? 'all';
  let visible = 0;
  vocabularyCards.forEach((card) => {
    const show = filter === 'all' || card.dataset.vocabStatus === filter;
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (filterStatus) filterStatus.textContent = `Showing ${visible} ${filter === 'all' ? 'approved records' : `${filter} records`}.`;
  if (vocabularyEmpty) vocabularyEmpty.hidden = visible > 0;
}));
document.querySelectorAll<HTMLButtonElement>('[data-vocab-view]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll<HTMLButtonElement>('[data-vocab-view]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  vocabularyGrid?.classList.toggle('is-list', button.dataset.vocabView === 'list');
}));
document.querySelectorAll<HTMLButtonElement>('[data-study-word]').forEach((button) => {
  const id = button.dataset.studyWord ?? '';
  const refresh = () => {
    const studied = page.words.includes(id);
    button.setAttribute('aria-pressed', String(studied));
    button.textContent = studied ? '★' : '☆';
    button.setAttribute('aria-label', `${studied ? 'Remove studied state from' : 'Mark'} ${id}`);
  };
  refresh();
  button.addEventListener('click', () => {
    page.words = page.words.includes(id) ? page.words.filter((word) => word !== id) : [...page.words, id];
    save();
    refresh();
    toast(page.words.includes(id) ? 'Word marked studied.' : 'Studied state removed.');
  });
});

// Notes stay in the same A2-only local key.
document.querySelectorAll<HTMLTextAreaElement>('[data-local-note]').forEach((note) => {
  const id = note.dataset.localNote ?? '';
  note.value = page.notes[id] ?? '';
  note.addEventListener('input', () => { page.notes[id] = note.value; save(); });
});

// Accessible listening passage tabs.
const activatePassage = (index: string) => {
  document.querySelectorAll<HTMLButtonElement>('[data-passage-tab]').forEach((tab) => {
    const active = tab.dataset.passageTab === index;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll<HTMLElement>('[data-passage-panel]').forEach((panel) => { panel.hidden = panel.dataset.passagePanel !== index; });
};
document.querySelectorAll<HTMLButtonElement>('[data-passage-tab]').forEach((tab) => {
  tab.addEventListener('click', () => activatePassage(tab.dataset.passageTab ?? '0'));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-passage-tab]')];
    const current = tabs.indexOf(tab);
    const nextIndex = event.key === 'ArrowRight' ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
    tabs[nextIndex].click();
    tabs[nextIndex].focus();
  });
});

document.querySelectorAll<HTMLInputElement>('[data-transcript-support]').forEach((toggle) => toggle.addEventListener('change', () => {
  document.querySelectorAll<HTMLDetailsElement>('[data-transcript]').forEach((details) => { details.open = toggle.checked; });
  toast(toggle.checked ? 'Study transcripts revealed.' : 'Study transcripts returned to manual control.');
}));

// Podcast chapter seeking uses the untouched approved episode bytes.
document.querySelectorAll<HTMLButtonElement>('[data-chapter-start]').forEach((button) => button.addEventListener('click', () => {
  const audio = document.querySelector<HTMLAudioElement>('[data-audio-id="A2-P01-AUDIO"] audio');
  if (!audio) return;
  audio.currentTime = Number(button.dataset.chapterStart ?? 0);
  audio.play().catch(() => toast('Use the main player to start audio, then select the chapter again.'));
}));

// Assessment interaction for the actual approved question types used on these pages.
const normalize = (value: string) => value.trim().toLocaleLowerCase('de').replace(/[.!?]/g, '').replace(/\s+/g, ' ');
const recordQuestion = (card: HTMLElement, correct: boolean) => {
  const id = card.dataset.questionId ?? '';
  const feedback = card.querySelector<HTMLElement>('[data-question-feedback]');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = `ds-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
    feedback.textContent = correct ? `Correct. ${card.dataset.correctFeedback ?? ''}` : `Try again. ${card.dataset.incorrectFeedback ?? ''}`;
  }
  if (correct && !page.questions.includes(id)) {
    page.questions.push(id);
    save();
    updateProgress();
  }
};

document.querySelectorAll<HTMLElement>('[data-question-card]').forEach((card) => {
  const id = card.dataset.questionId ?? '';
  if (page.questions.includes(id)) {
    const feedback = card.querySelector<HTMLElement>('[data-question-feedback]');
    if (feedback) { feedback.hidden = false; feedback.className = 'ds-feedback is-correct'; feedback.textContent = 'Completed correctly in this browser.'; }
  }
  card.querySelectorAll<HTMLButtonElement>('[data-answer-id]').forEach((answer) => answer.addEventListener('click', () => {
    const solution = JSON.parse(card.dataset.solution ?? '""') as string;
    const correct = answer.dataset.answerId === solution;
    card.querySelectorAll<HTMLButtonElement>('[data-answer-id]').forEach((option) => {
      option.setAttribute('aria-pressed', String(option === answer));
      option.classList.remove('is-correct', 'is-incorrect');
    });
    answer.classList.add(correct ? 'is-correct' : 'is-incorrect');
    recordQuestion(card, correct);
  }));
  card.querySelector<HTMLButtonElement>('[data-check-entry]')?.addEventListener('click', () => {
    const input = card.querySelector<HTMLInputElement>('[data-entry-answer]');
    const accepted = [card.dataset.canonical ?? '', ...(JSON.parse(card.dataset.accepted ?? '[]') as string[])].map(normalize);
    recordQuestion(card, !!input && accepted.includes(normalize(input.value)));
  });
  const order: string[] = [];
  const refreshOrder = () => {
    const output = card.querySelector<HTMLElement>('[data-order-output]');
    const labels = order.map((chosen) => card.querySelector<HTMLButtonElement>(`[data-order-id="${CSS.escape(chosen)}"]`)?.textContent?.trim() ?? chosen);
    if (output) output.textContent = labels.length ? labels.join(' → ') : 'Choose items in order.';
  };
  card.querySelectorAll<HTMLButtonElement>('[data-order-id]').forEach((token) => token.addEventListener('click', () => {
    const tokenId = token.dataset.orderId ?? '';
    if (!order.includes(tokenId)) order.push(tokenId);
    token.disabled = true;
    refreshOrder();
  }));
  card.querySelector<HTMLButtonElement>('[data-reset-order]')?.addEventListener('click', () => {
    order.splice(0);
    card.querySelectorAll<HTMLButtonElement>('[data-order-id]').forEach((token) => { token.disabled = false; });
    refreshOrder();
  });
  card.querySelector<HTMLButtonElement>('[data-check-order]')?.addEventListener('click', () => {
    const solution = JSON.parse(card.dataset.solution ?? '[]') as string | string[];
    const correct = Array.isArray(solution)
      ? order.length === solution.length && order.every((item, index) => item === solution[index])
      : normalize(order.map((chosen) => card.querySelector<HTMLButtonElement>(`[data-order-id="${CSS.escape(chosen)}"]`)?.textContent?.trim() ?? '').join(' ')) === normalize(card.dataset.canonical ?? '');
    recordQuestion(card, correct);
  });
  card.querySelector<HTMLButtonElement>('[data-check-matching]')?.addEventListener('click', () => {
    const solution = JSON.parse(card.dataset.solution ?? '{}') as Record<string, string>;
    const selections = [...card.querySelectorAll<HTMLSelectElement>('[data-match-person]')];
    recordQuestion(card, selections.length > 0 && selections.every((selection) => solution[selection.dataset.matchPerson ?? ''] === selection.value));
  });
});

updateProgress();

