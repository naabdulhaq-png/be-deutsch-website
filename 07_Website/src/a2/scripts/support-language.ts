import { supportLanguages, sharedCopy, type SupportLanguage } from '../i18n/support';

const preferenceKey = 'be-deutsch:support-language:v1';
const a1VocabularyKey = 'be-deutsch:a1-vocabulary:v2';
const valid = new Set<SupportLanguage>(['en', 'ps', 'fa', 'ar', 'uk']);

function readPreference(): SupportLanguage {
  try {
    const explicit = localStorage.getItem(preferenceKey);
    if (explicit && valid.has(explicit as SupportLanguage)) return explicit as SupportLanguage;
    const legacy = JSON.parse(localStorage.getItem(a1VocabularyKey) ?? 'null');
    if (legacy && valid.has(legacy.language)) return legacy.language;
  } catch {
    // The interface remains usable with English support when storage is unavailable.
  }
  return 'en';
}

function savePreference(language: SupportLanguage) {
  try {
    localStorage.setItem(preferenceKey, language);
    const raw = localStorage.getItem(a1VocabularyKey);
    if (raw) {
      const progress = JSON.parse(raw);
      if (progress && typeof progress === 'object') {
        progress.language = language;
        localStorage.setItem(a1VocabularyKey, JSON.stringify(progress));
      }
    }
  } catch {
    // Do not block learning when storage is unavailable.
  }
}

function valuesFor(element: HTMLElement) {
  try {
    return JSON.parse(element.dataset.supportValues ?? '{}') as Partial<Record<SupportLanguage, string>>;
  } catch {
    return {};
  }
}

function applyLanguage(language: SupportLanguage, announce = false) {
  const meta = supportLanguages[language];
  document.body.dataset.supportLanguage = language;
  document.body.dataset.supportDirection = meta.dir;
  document.documentElement.dataset.supportLanguage = language;

  document.querySelectorAll<HTMLButtonElement>('[data-support-language]').forEach((button) => {
    const selected = button.dataset.supportLanguage === language;
    button.setAttribute('aria-pressed', String(selected));
  });

  document.querySelectorAll<HTMLElement>('[data-support-values]').forEach((element) => {
    const values = valuesFor(element);
    const translated = values[language];
    const fallback = values.en ?? element.textContent ?? '';
    element.textContent = translated || fallback;
    element.lang = translated ? language : 'en';
    element.dir = translated ? meta.dir : 'ltr';
    element.dataset.translationFallback = String(!translated && language !== 'en');
  });

  document.querySelectorAll<HTMLElement>('[data-support-fallback]').forEach((element) => {
    element.hidden = language === 'en';
    element.textContent = sharedCopy.englishFallback[language];
    element.lang = language;
    element.dir = meta.dir;
  });

  const status = document.querySelector<HTMLElement>('[data-support-status]');
  if (status) {
    const statusCopy: Record<SupportLanguage, string> = {
      en: 'English support is selected.',
      ps: 'پښتو د مرستې ژبه ټاکل شوې؛ که ژباړه نه وي، انګلیسي متن ښودل کېږي.',
      fa: 'فارسی به‌عنوان زبان پشتیبان انتخاب شده است؛ اگر ترجمه‌ای موجود نباشد، متن انگلیسی نمایش داده می‌شود.',
      ar: 'تم اختيار العربية كلغة دعم؛ وعند عدم توفر ترجمة، يُعرض النص الإنجليزي.',
      uk: 'Українську вибрано як мову підтримки; якщо переклад відсутній, відображається англійський текст.',
    };
    status.textContent = statusCopy[language];
    status.lang = language === 'en' ? 'en' : language;
    status.dir = language === 'en' ? 'ltr' : meta.dir;
  }

  savePreference(language);
  document.dispatchEvent(new CustomEvent('be-deutsch:support-language', { detail: { language } }));
  if (announce) status?.focus({ preventScroll: true });
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const languageButton = target.closest<HTMLButtonElement>('[data-support-language]');
  if (languageButton) {
    const language = languageButton.dataset.supportLanguage as SupportLanguage;
    if (valid.has(language)) applyLanguage(language, true);
  }
});

applyLanguage(readPreference());

