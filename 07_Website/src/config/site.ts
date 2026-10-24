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
    'Learn German step by step with a complete A1 course: vocabulary, reading, listening, writing, pronunciation, practice, review and offline lessons for English-speaking beginners.',
  socialImage: '/social/be-deutsch-social-card.png',
} as const;

export const publicContact = {
  providerName: legal.providerName,
  providerStatus: legal.providerStatus,
  supportEmail: legal.supportEmail,
  phoneDisplay: legal.phoneDisplay,
  phoneHref: legal.phoneHref,
} as const;

export type AppAvailability = 'prelaunch' | 'internal-testing' | 'closed-testing' | 'available';

export const appRelease: {
  availability: AppAvailability;
  label: string;
  description: string;
  version: string;
  versionCode: number;
  verifiedOn: string;
  testingPath: string;
  testerGroupUrl: string;
  testingOptInUrl: string;
  googlePlayUrl: string | null;
} = {
  availability: 'closed-testing',
  label: 'Android closed testing is active',
  description:
    'Be Deutsch 2.0.0 is available through Google Play closed testing for eligible testers. Join the tester group and opt in before installing. General public release is not available yet.',
  version: '2.0.0',
  versionCode: 4,
  verifiedOn: '2026-10-24',
  testingPath: '/testing/',
  // Verified in the closed track's Testers tab and Google Group settings.
  testerGroupUrl: 'https://groups.google.com/g/be-deutsch-testers',
  testingOptInUrl: 'https://play.google.com/apps/testing/com.bedeutsch.app',
  // Reserved for an approved public production release, not tester enrollment.
  googlePlayUrl: null,
};
