import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const socialDirectory = path.join(websiteRoot, 'public', 'social');
const iconDirectory = path.join(websiteRoot, 'public', 'icons');
await Promise.all([
  mkdir(socialDirectory, { recursive: true }),
  mkdir(iconDirectory, { recursive: true }),
]);

const socialCard = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFF8F4"/>
  <circle cx="1100" cy="-30" r="350" fill="#FF6A2A"/>
  <path d="M0 510C250 420 470 490 694 420C908 353 1062 386 1200 330V630H0Z" fill="#FFE7DB"/>
  <g transform="translate(70 72) scale(1.8)">
    <path fill="#000000" d="M25 20H58C76 20 88 29 88 42 88 49 84 55 78 59L62 50C66 48 68 45 68 41 68 35 64 32 57 31L25 28Z"/>
    <path fill="#DD0000" d="M23 33C23 30 25 29 28 31L67 52C71 54 71 57 67 59L28 80C25 82 23 81 23 78Z"/>
    <path fill="#FFCC00" d="M31 82 62 64 77 72C85 76 89 83 88 90 86 100 77 104 62 104H30C26 104 24 102 24 98V88C24 85 27 83 31 82Z"/>
  </g>
  <text x="276" y="214" fill="#000000" font-family="Georgia, 'Times New Roman', serif" font-size="80" font-weight="700" letter-spacing="-2">Be Deutsch</text>
  <text x="82" y="350" fill="#000000" font-family="Arial, 'Segoe UI', sans-serif" font-size="44" font-weight="800">German, step by step.</text>
  <text x="82" y="408" fill="#57514D" font-family="Arial, 'Segoe UI', sans-serif" font-size="29">A complete A1 course for English-speaking beginners.</text>
  <rect x="82" y="462" width="272" height="68" rx="34" fill="#FF6A2A"/>
  <text x="218" y="505" text-anchor="middle" fill="#000000" font-family="Arial, 'Segoe UI', sans-serif" font-size="23" font-weight="800" letter-spacing="1.2">LEARN OFFLINE</text>
</svg>`);

await sharp(socialCard)
  .png({ compressionLevel: 9 })
  .toFile(path.join(socialDirectory, 'be-deutsch-social-card.png'));

const faviconSurface = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
  <rect width="108" height="108" rx="24" fill="#FFFFFF"/>
  <g transform="translate(15 15) scale(.72)">
    <path fill="#000000" d="M25 20H58C76 20 88 29 88 42 88 49 84 55 78 59L62 50C66 48 68 45 68 41 68 35 64 32 57 31L25 28Z"/>
    <path fill="#DD0000" d="M23 33C23 30 25 29 28 31L67 52C71 54 71 57 67 59L28 80C25 82 23 81 23 78Z"/>
    <path fill="#FFCC00" d="M31 82 62 64 77 72C85 76 89 83 88 90 86 100 77 104 62 104H30C26 104 24 102 24 98V88C24 85 27 83 31 82Z"/>
  </g>
</svg>`);

const iconOutputs = [
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192x192.png', 192],
  ['icon-512x512.png', 512],
];

await Promise.all(
  iconOutputs.map(([filename, size]) =>
    sharp(faviconSurface)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(iconDirectory, filename)),
  ),
);

console.log('Generated C46 social card and four exact-brand web icon sizes.');
