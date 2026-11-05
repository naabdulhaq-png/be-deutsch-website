import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const course = JSON.parse(readFileSync(join(root, 'src', 'a2', 'data', 'course.json'), 'utf8'));
const expectations = [
  ['vocabulary', 'Weekend Activities', 'A2-U01-V01'],
  ['grammar', 'Build the Perfekt with haben', 'A2-U01-G01'],
  ['listening', 'Weekend Update', 'A2-U01-L01'],
  ['podcast', 'Mein Wochenende in vier Stationen', 'A2-P01'],
];

for (const [route, title, id] of expectations) {
  const html = readFileSync(join(root, 'dist', 'phase1', route, 'index.html'), 'utf8');
  for (const required of [title, id, 'Course outline', 'Lesson progress', 'Example support']) {
    if (!html.includes(required)) throw new Error(`/phase1/${route}/ is missing ${required}`);
  }
}

if (course.meta.languages.join(',') !== 'en') throw new Error('Phase 1 assumes the published A2 support-language contract is English-only.');
if (course.vocabulary[0].id !== 'A2-U01-V01' || course.grammar[0].id !== 'A2-U01-G01') throw new Error('Representative lesson IDs changed.');
if (course.passages.filter((passage) => passage.lesson_id === 'A2-U01-L01').length !== 2) throw new Error('Listening L01 no longer has its two approved passages.');
if (course.podcast.chapters.length !== 5) throw new Error('Podcast chapter count changed.');

for (const asset of course.audio) {
  if (!['A2-U01-G01-A-DLG01', 'A2-U01-L01-P01-AUDIO', 'A2-U01-L01-P02-AUDIO', 'A2-P01-AUDIO'].includes(asset.id)) continue;
  const audioPath = join(root, 'public', ...asset.url.split('/').filter(Boolean));
  if (statSync(audioPath).size !== asset.bytes) throw new Error(`${asset.id} byte count differs from the approved manifest.`);
}

const script = readFileSync(join(root, 'src', 'scripts', 'phase1.ts'), 'utf8');
if (!script.includes("be-deutsch:phase1:a2:v1")) throw new Error('Phase 1 A2 progress storage key is missing.');
if (script.includes('be-deutsch:grammar') || script.includes('be-deutsch:vocabulary-progress')) throw new Error('Phase 1 must not write existing A1 progress keys.');

console.log('Phase 1 integrity PASS: 4 routes, authoritative A2 content, approved audio bytes and isolated progress key.');

