import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const iconPath = path.join(websiteRoot, 'src', 'assets', 'branding', 'be_deutsch_icon.svg');
const socialDirectory = path.join(websiteRoot, 'public', 'social');
const iconDirectory = path.join(websiteRoot, 'public', 'icons');
const icon = await readFile(iconPath);
const socialIcon = await sharp(icon).resize(152, 152).png().toBuffer();

await Promise.all([
  mkdir(socialDirectory, { recursive: true }),
  mkdir(iconDirectory, { recursive: true }),
]);

const socialCard = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFFCF7"/>
  <path d="M720 0h480v630H570z" fill="#EEF7F5"/>
  <path d="M870 92h250v446H760z" fill="#DDEFEA" opacity="0.72"/>
  <path d="M760 170l302 72c38 9 58 31 58 62 0 25-14 45-39 59L760 263z" fill="#FFFCF7"/>
  <path d="M760 263l321 100-321 87z" fill="#2F8F83"/>
  <path d="M760 368l303 74c38 9 58 33 50 62-5 23-24 38-52 46l-301 60z" fill="#F2B84B"/>
  <path d="M760 170v440" stroke="#17324D" stroke-width="14" stroke-linecap="round"/>
  <rect x="76" y="68" width="152" height="152" rx="34" fill="#17324D"/>
  <text x="78" y="310" fill="#17324D" font-family="Arial, Segoe UI, sans-serif" font-size="76" font-weight="700" letter-spacing="-2">Be Deutsch</text>
  <text x="82" y="374" fill="#26756C" font-family="Arial, Segoe UI, sans-serif" font-size="34" font-weight="700">Dein klarer Weg zu Deutsch</text>
  <text x="82" y="438" fill="#596C79" font-family="Arial, Segoe UI, sans-serif" font-size="28">German foundations for beginners, step by step.</text>
  <rect x="82" y="486" width="246" height="62" rx="31" fill="#26756C"/>
  <text x="205" y="526" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Segoe UI, sans-serif" font-size="22" font-weight="700" letter-spacing="1">A1 FOUNDATIONS</text>
</svg>`);

await sharp(socialCard)
  .composite([{ input: socialIcon, left: 76, top: 68 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(socialDirectory, 'be-deutsch-social-card.png'));

const iconOutputs = [
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192x192.png', 192],
  ['icon-512x512.png', 512],
];

await Promise.all(
  iconOutputs.map(([filename, size]) =>
    sharp(icon)
      .resize(size, size)
      .png({ compressionLevel: 9, palette: true })
      .toFile(path.join(iconDirectory, filename)),
  ),
);

console.log('Generated the social card and four web icon sizes.');
