export {};

const vocabularyCards = Array.from(document.querySelectorAll<HTMLElement>('[data-vocab-card]'));
const vocabularySearch = document.querySelector<HTMLInputElement>('#vocab-search');
const vocabularyStatus = document.querySelector<HTMLSelectElement>('#vocab-status');
const vocabularyType = document.querySelector<HTMLSelectElement>('#vocab-type');

function filterVocabulary() {
  if (!vocabularyCards.length) return;
  const query = vocabularySearch?.value.trim().toLocaleLowerCase('de') ?? '';
  const status = vocabularyStatus?.value ?? 'all';
  const type = vocabularyType?.value ?? 'all';
  let visible = 0;
  vocabularyCards.forEach((card) => {
    const matchesQuery = !query || (card.dataset.search ?? '').includes(query);
    const matchesStatus = status === 'all' || card.dataset.status === status;
    const matchesType = type === 'all' || card.dataset.type === type;
    card.hidden = !(matchesQuery && matchesStatus && matchesType);
    if (!card.hidden) visible += 1;
  });
  const statusText = document.querySelector<HTMLElement>('#vocab-filter-status');
  if (statusText) statusText.textContent = `Showing ${visible} of ${vocabularyCards.length} records`;
  const empty = document.querySelector<HTMLElement>('#vocab-empty');
  if (empty) empty.hidden = visible !== 0;
}

[vocabularySearch, vocabularyStatus, vocabularyType].forEach((control) => {
  control?.addEventListener(control instanceof HTMLInputElement ? 'input' : 'change', filterVocabulary);
});

const chapterTabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-chapter-tab]'));
const chapterPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter-panel]'));

function selectChapter(number: string, focusPanel = false) {
  chapterTabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.chapterTab === number)));
  chapterPanels.forEach((panel) => {
    panel.hidden = panel.dataset.chapterPanel !== number;
  });
  const activePanel = chapterPanels.find((panel) => panel.dataset.chapterPanel === number);
  if (focusPanel) activePanel?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
  const status = document.querySelector<HTMLElement>('#chapter-status');
  const activeTab = chapterTabs.find((tab) => tab.dataset.chapterTab === number);
  if (status && activeTab) status.textContent = `${activeTab.textContent?.trim()} selected. Playback starts at the approved chapter timestamp.`;
}

chapterTabs.forEach((tab) => tab.addEventListener('click', () => selectChapter(tab.dataset.chapterTab ?? '1')));

const chapterFromHash = location.hash.match(/^#chapter-(\d)$/)?.[1];
if (chapterFromHash) selectChapter(chapterFromHash);

document.querySelectorAll<HTMLButtonElement>('[data-chapter-select]').forEach((button) => {
  button.addEventListener('click', () => {
    const chapter = button.dataset.chapterSelect ?? '1';
    selectChapter(chapter, true);
    document.querySelector<HTMLButtonElement>(`[data-chapter-tab="${chapter}"]`)?.click();
  });
});

const passageTabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-passage-tab]'));
const passagePanels = Array.from(document.querySelectorAll<HTMLElement>('[data-passage-panel]'));
function selectPassage(id: string, focus = false) {
  passageTabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.passageTab === id)));
  passagePanels.forEach((panel) => { panel.hidden = panel.dataset.passagePanel !== id; });
  const panel = passagePanels.find((item) => item.dataset.passagePanel === id);
  if (focus) {
    panel?.querySelector<HTMLElement>('h2')?.setAttribute('tabindex', '-1');
    panel?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
}
passageTabs.forEach((tab) => tab.addEventListener('click', () => selectPassage(tab.dataset.passageTab ?? '')));
document.querySelectorAll<HTMLButtonElement>('[data-passage-select]').forEach((button) => button.addEventListener('click', () => selectPassage(button.dataset.passageSelect ?? '', true)));

document.querySelectorAll<HTMLButtonElement>('[data-open-transcript]').forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.openTranscript;
    const transcript = document.querySelector<HTMLDetailsElement>(`[data-transcript-id="${id}"]`);
    if (!transcript) return;
    if (transcript.dataset.permitted === 'true') {
      transcript.open = true;
      transcript.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true });
    } else {
      const status = document.querySelector<HTMLElement>('#storage-status');
      if (status) {
        status.textContent = 'Enable transcript study support or submit the comprehension check first. The complete German transcript will then open here.';
        status.focus({ preventScroll: true });
      }
    }
  });
});
