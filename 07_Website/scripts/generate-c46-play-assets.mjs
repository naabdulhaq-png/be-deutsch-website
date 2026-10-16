import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = path.resolve(websiteRoot, '..');
const outputRoot = path.join(projectRoot, '06_Reviews', 'C46_google_play_assets');
const appIconDirectory = path.join(outputRoot, 'app_icon');
const featureDirectory = path.join(outputRoot, 'feature_graphic');
const screenshotDirectory = path.join(outputRoot, 'screenshots');
const masterDirectory = path.join(outputRoot, 'masters');

await Promise.all([
  mkdir(appIconDirectory, { recursive: true }),
  mkdir(featureDirectory, { recursive: true }),
  mkdir(screenshotDirectory, { recursive: true }),
  mkdir(masterDirectory, { recursive: true }),
]);

const androidBrandDirectory = path.join(projectRoot, '05_App', 'be_deutsch', 'assets', 'branding');
const appIconMaster = path.join(androidBrandDirectory, 'be_deutsch_icon_master.svg');
const logoMaster = path.join(androidBrandDirectory, 'be_deutsch_logo.svg');
const markMaster = path.join(androidBrandDirectory, 'android_adaptive_foreground.svg');

await Promise.all([
  copyFile(appIconMaster, path.join(masterDirectory, 'google_play_app_icon_master.svg')),
  copyFile(logoMaster, path.join(masterDirectory, 'be_deutsch_logo_source.svg')),
  copyFile(markMaster, path.join(masterDirectory, 'be_deutsch_mark_source.svg')),
]);

await sharp(appIconMaster)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(appIconDirectory, 'be_deutsch_google_play_icon_512.png'));

const featureMaster = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="#FFF6F1"/>
  <circle cx="980" cy="-25" r="290" fill="#FF6A2A"/>
  <path d="M0 410C210 345 370 390 555 342C748 292 892 316 1024 270V500H0Z" fill="#FFE4D7"/>
  <rect x="68" y="330" width="346" height="66" rx="33" fill="#FF6A2A"/>
  <text x="241" y="372" text-anchor="middle" fill="#000000" font-family="Arial, 'Segoe UI', sans-serif" font-size="22" font-weight="800" letter-spacing="0.7">COMPLETE A1 COURSE</text>
  <text x="70" y="286" fill="#000000" font-family="Arial, 'Segoe UI', sans-serif" font-size="43" font-weight="800">Dein klarer Weg zu Deutsch</text>
</svg>`);
await writeFile(path.join(masterDirectory, 'feature_graphic_master.svg'), featureMaster);

const logo = await sharp(logoMaster).resize({ width: 520 }).png().toBuffer();
await sharp(featureMaster)
  .composite([{ input: logo, left: 64, top: 68 }])
  .flatten({ background: '#FFF6F1' })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(path.join(featureDirectory, 'be_deutsch_feature_graphic_1024x500.png'));

const captures = [
  ['01_home.png', 'Learn German step by step', 'C45_final_visual_corrections/03_home_continue_quiz.png'],
  ['02_course.png', 'Explore all 12 A1 units', 'C44_final_brand_lock_screenshots/04_unit_list.png'],
  ['03_vocabulary.png', 'Build everyday vocabulary', 'C44_final_brand_lock_screenshots/07_vocabulary.png'],
  ['04_listening.png', 'Practice listening offline', 'C44_final_brand_lock_screenshots/09_listening.png'],
  ['05_reading.png', 'Read practical German', 'C44_final_brand_lock_screenshots/08_reading.png'],
  ['06_writing.png', 'Write with guided support', 'C44_final_brand_lock_screenshots/10_writing.png'],
  ['07_speaking.png', 'Practice pronunciation', 'C44_final_brand_lock_screenshots/11_speaking.png'],
  ['08_progress.png', 'Track progress and review', 'C44_final_brand_lock_screenshots/18_progress.png'],
];

const mark = await sharp(markMaster).resize(92, 92).png().toBuffer();
const screenMask = Buffer.from('<svg width="700" height="1556"><rect width="700" height="1556" rx="52" fill="white"/></svg>');

for (const [filename, headline, captureRelative] of captures) {
  const capturePath = path.join(projectRoot, '06_Reviews', captureRelative);
  const screen = await sharp(capturePath)
    .resize(700, 1556, { fit: 'fill' })
    .composite([{ input: screenMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const background = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect width="1080" height="1920" fill="#FFF8F4"/>
    <circle cx="1030" cy="-40" r="260" fill="#FF6A2A"/>
    <circle cx="12" cy="1845" r="230" fill="#FFE3D5"/>
    <text x="174" y="112" fill="#000000" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700">Be Deutsch</text>
    <text x="540" y="250" text-anchor="middle" fill="#000000" font-family="Arial, 'Segoe UI', sans-serif" font-size="55" font-weight="800">${headline}</text>
    <rect x="176" y="300" width="728" height="1584" rx="68" fill="#000000" opacity="0.12"/>
    <rect x="182" y="294" width="716" height="1572" rx="62" fill="#000000"/>
  </svg>`);

  await sharp(background)
    .composite([
      { input: mark, left: 66, top: 44 },
      { input: screen, left: 190, top: 302 },
    ])
    .flatten({ background: '#FFF8F4' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(screenshotDirectory, filename));
}

const manifest = `# C46 Google Play visual export manifest

Generated: 2026-10-16  
Upload status: **NOT UPLOADED**

## Current Play requirements used

- Store icon: 512 × 512 px, 32-bit PNG, maximum 1 MB.
- Feature graphic: 1024 × 500 px, PNG without alpha.
- Phone screenshots: 2–8 images, JPEG or PNG without alpha, 320–3840 px; this set uses eight 1080 × 1920 portrait images (9:16).
- Official source: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en (verified 2026-10-16).

## Source of truth

- Exact Android logo geometry: \`05_App/be_deutsch/assets/branding/be_deutsch_logo.svg\`
- Exact installed-icon master: \`05_App/be_deutsch/assets/branding/be_deutsch_icon_master.svg\`
- Exact mark source: \`05_App/be_deutsch/assets/branding/android_adaptive_foreground.svg\`
- Runtime captures: \`06_Reviews/C44_final_brand_lock_screenshots\` and \`06_Reviews/C45_final_visual_corrections\`

## Exports

- App icon: \`app_icon/be_deutsch_google_play_icon_512.png\` — 512 × 512.
- Feature graphic: \`feature_graphic/be_deutsch_feature_graphic_1024x500.png\` — 1024 × 500.
- Phone screenshots: eight files in \`screenshots/\` — 1080 × 1920 each.

## Screenshot sequence and captions

1. Learn German step by step — alt: Be Deutsch home screen with a continue-quiz card and progress through 60 A1 lessons.
2. Explore all 12 A1 units — alt: Be Deutsch Learn screen showing the ordered A1 unit list.
3. Build everyday vocabulary — alt: Vocabulary activity showing a German word, English meaning, and pronunciation control.
4. Practice listening offline — alt: Listening activity with offline playback controls and a gated transcript.
5. Read practical German — alt: Reading activity with an A1 text and supported question flow.
6. Write with guided support — alt: Guided writing activity with visible sentence support.
7. Practice pronunciation — alt: Pronunciation activity with model audio and learner self-confirmation.
8. Track progress and review — alt: Progress screen summarizing lessons, units, checkpoints, and review activity.

Feature graphic alt: Be Deutsch logo, the tagline Dein klarer Weg zu Deutsch, and Complete A1 Course.

All app interiors are real runtime captures. No screen, feature, score, or A2 content was fabricated. No certification, AI, account, cloud-sync, or microphone claim is present.
`;
await writeFile(path.join(outputRoot, 'export_manifest.md'), manifest, 'utf8');

console.log(`Generated C46 Play package at ${outputRoot}`);
