import legal from './legal.json';

export const locales = {
  en: {
    code: 'en',
    label: 'English',
    path: '/',
    lang: 'en',
    dir: 'ltr',
    enabled: true,
  },
  fa: {
    code: 'fa',
    label: 'فارسی',
    path: '/fa/',
    lang: 'fa',
    dir: 'rtl',
    enabled: false,
  },
} as const;

export const defaultLocale = locales.en;

export const site = {
  name: 'Be Deutsch',
  domain: 'bedeutsch.de',
  url: 'https://www.bedeutsch.de',
  supportEmail: legal.supportEmail,
  tagline: 'Dein klarer Weg zu Deutsch',
  title: 'Be Deutsch — German for beginners, step by step',
  description:
    'Learn German foundations step by step with clear grammar, vocabulary, reading, guided practice, mistake review and offline lessons for English-speaking beginners.',
  socialImage: '/social/be-deutsch-social-card.png',
} as const;

export const publicContact = {
  providerName: legal.providerName,
  providerStatus: legal.providerStatus,
  supportEmail: legal.supportEmail,
  phoneDisplay: legal.phoneDisplay,
  phoneHref: legal.phoneHref,
} as const;

export type AppAvailability = 'prelaunch' | 'available';

export const appRelease: {
  availability: AppAvailability;
  label: string;
  googlePlayUrl: string | null;
} = {
  availability: 'prelaunch',
  label: 'Coming soon on Google Play',
  googlePlayUrl: null,
};
