import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const library = JSON.parse(readFileSync(join(root, 'src', 'a2', 'data', 'audio-library.generated.json'), 'utf8'));
const assets = [
  ...library.listening,
  ...library.podcasts.flatMap((episode: any) => [episode, ...episode.chapters]),
];
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

test('audio inventory has the exact authorized 24 + 30 + 5 coverage', () => {
  assert.equal(library.listening.length, 24);
  assert.equal(library.podcasts.length, 5);
  assert.equal(library.podcasts.reduce((n: number, item: any) => n + item.chapters.length, 0), 30);
  assert.equal(assets.length, 59);
  assert.equal(new Set(assets.map((item: any) => item.url)).size, 59);
});

test('all site-local public assets exist and match their accepted source hashes', () => {
  for (const asset of assets) {
    const path = join(root, 'public', ...asset.url.split('/').filter(Boolean));
    assert.equal(existsSync(path), true, asset.url);
    assert.equal(sha256(path), asset.sha256, asset.url);
  }
});

test('all generated audio URLs are same-origin and URL-safe', () => {
  for (const asset of assets) {
    assert.match(asset.url, /^\/a2-expanded-audio\/[a-z0-9/_-]+\.mp3$/);
    assert.equal(asset.url.includes('\\'), false);
    assert.equal(asset.url.includes(' '), false);
  }
});
