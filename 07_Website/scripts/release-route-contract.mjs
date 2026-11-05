import course from '../src/a2/data/integrated-course.json' with { type: 'json' };

const legacy = new Set([
  '/', '/404', '/app/', '/testing/', '/about/', '/partners/', '/support/', '/privacy/', '/impressum/',
  '/grammar/', '/grammar/a1/', '/grammar/final-assessment/', '/listening/', '/podcasts/', '/podcasts/ein-morgen/', '/vocabulary/',
]);
for (let n = 1; n <= 28; n++) legacy.add(`/grammar/lesson-${String(n).padStart(2, '0')}/`);
for (let n = 1; n <= 7; n++) legacy.add(`/grammar/unit-${String(n).padStart(2, '0')}-review/`);
for (let n = 1; n <= 20; n++) legacy.add(`/listening/ht${String(n).padStart(2, '0')}/`);
for (let n = 1; n <= 40; n++) legacy.add(`/vocabulary/lesson-${String(n).padStart(2, '0')}/`);

const a2 = new Set(['/a2/']);
for (const unit of course.units) {
  const root = `/a2/unit-${unit.unit}`;
  a2.add(`${root}/`);
  for (const lesson of unit.vocabulary_lessons) a2.add(`${root}/vocabulary/${lesson.id.slice(-3).toLowerCase()}/`);
  for (const lesson of unit.grammar_lessons) a2.add(`${root}/grammar/${lesson.id.slice(-3).toLowerCase()}/`);
  for (const lesson of unit.listening_lessons) a2.add(`${root}/listening/${lesson.id.slice(-3).toLowerCase()}/`);
  for (const episode of unit.podcast_episodes) a2.add(`${root}/podcast/${episode.blueprint_ref.toLowerCase()}/`);
  a2.add(`${root}/revision/`);
}
for (const route of ['/a2/unit-1/grammar-review/', '/a2/unit-1/review/']) a2.add(route);
// Preserve the three approved Unit 1 deep links that predate the expanded
// machine-readable course inventory.
for (const route of ['/a2/unit-1/listening/l01/', '/a2/unit-1/listening/l02/', '/a2/unit-1/podcast/']) a2.add(route);

export const reviewOnlyRoutes = new Set(['/a2/audio-review/', '/a2/review-index/']);
export const requiredPublicRoutes = new Set([...legacy, ...a2]);
export const nonSitemapRoutes = new Set(['/404', '/grammar/a1/']);
export const requiredSitemapRoutes = new Set([...requiredPublicRoutes].filter(route => !nonSitemapRoutes.has(route)));

export const compareRouteSets = (actual, required = requiredPublicRoutes, forbidden = reviewOnlyRoutes) => ({
  missing: [...required].filter(route => !actual.has(route)).sort(),
  unexpected: [...actual].filter(route => !required.has(route)).sort(),
  forbidden: [...forbidden].filter(route => actual.has(route)).sort(),
});
