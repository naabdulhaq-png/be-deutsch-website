import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const site=path.resolve(import.meta.dirname,'..');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const lock=await read(path.join(site,'integrity/vocabulary-asset-lock.json'));
const datasetBytes=await fs.readFile(path.join(site,'src/data/vocabulary-course.json'));
assert.equal(sha(datasetBytes),lock.approved_dataset_sha256,'Approved vocabulary dataset changed');
const data=JSON.parse(datasetBytes),ids=new Set(),audioIds=new Set(),imageIds=new Set();
assert.equal(data.lessons.length,40);assert.equal(data.vocabulary.length,400);
assert.deepEqual(Object.keys(data.languages).sort(),['ar','en','fa','ps','uk']);
let examples=0,readings=0;
for(const [index,lesson]of data.lessons.entries()){
 assert.equal(lesson.number,index+1);assert.equal(lesson.vocabulary_ids.length,10);
 const html=await fs.readFile(path.join(site,'dist/vocabulary/lesson-'+String(index+1).padStart(2,'0')+'/index.html'),'utf8');
 const payload=JSON.parse(html.match(/<script id="vocabulary-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
 assert.equal(payload.currentLessonIndex,index);assert.equal(payload.vocabulary.length,10);
 const expected=lesson.vocabulary_ids.map(id=>data.vocabulary.find(v=>v.vocabulary_id===id));assert.deepEqual(payload.vocabulary,expected);
 for(const [i,v]of expected.entries()){
  assert.ok(!ids.has(v.vocabulary_id));ids.add(v.vocabulary_id);assert.equal(v.lesson_id,lesson.lesson_id);assert.equal(v.order,i+1);
  assert.ok(!imageIds.has(v.image.image_id));imageIds.add(v.image.image_id);assert.equal(v.image.variants.length,2);
  assert.equal(v.examples.length,3);examples+=3;assert.ok(v.reading.text_de);readings++;
  for(const s of v.senses)for(const code of ['en','uk','ar','fa','ps']){assert.ok(s.translations[code].text.trim());assert.equal(s.translations[code].direction,['ar','fa','ps'].includes(code)?'rtl':'ltr');}
  for(const a of [v.word_audio,...v.examples.map(e=>e.audio)]){assert.ok(!audioIds.has(a.audio_id));audioIds.add(a.audio_id);assert.ok(lock.assets.some(x=>x.path===a.path&&x.sha256===a.sha256&&x.vocabulary_id===v.vocabulary_id));}
  for(const e of v.examples)assert.equal(e.text_de,e.audio.text_de);
  for(const im of v.image.variants)assert.ok(lock.assets.some(x=>x.path===im.path&&x.sha256===im.sha256&&x.image_id===v.image.image_id&&x.approved_source_sha256===v.image.approved_source_sha256));
 }
}
assert.equal(ids.size,400);assert.equal(imageIds.size,400);assert.equal(audioIds.size,1600);assert.equal(examples,1200);assert.equal(readings,400);
assert.equal(lock.final_v02_1_manifest_sha256,'bde827bab98e81d141433be54364dbe68bf7bb2cb3b3dddc631b493648350e0c');
assert.equal(lock.corrected_image_ids.length,25);assert.equal(lock.assets.length,2400);
assert.equal(data.vocabulary.find(v=>v.vocabulary_id==='BD-A1-V355').word_audio.sha256,'1f832019c3d09fb07cca488f242ecbe38bc1a89cf5418f57a553335ddfddf57e');
for(const a of lock.assets){for(const prefix of ['public','dist']){const p=path.resolve(site,prefix,'.'+a.path);assert.ok(p.startsWith(path.resolve(site,prefix,'vocabulary-assets')+path.sep));assert.equal(sha(await fs.readFile(p)),a.sha256,'Unapproved asset: '+a.path);}}
async function files(dir){return(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(async e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
for(const prefix of ['public','dist']){const actual=await files(path.join(site,prefix,'vocabulary-assets'));assert.deepEqual(actual.map(p=>'/'+path.relative(path.join(site,prefix),p).split(path.sep).join('/')).sort(),lock.assets.map(a=>a.path).sort(),'Unexpected vocabulary asset');}
const output=await files(path.join(site,'dist'));
assert.ok(!output.some(p=>/(?:^|[/\\])(?:preview-[^/\\]*|node_modules|src|Review|Screenshots|backups?|rejected)(?:[/\\]|$)|\.(?:zip|xlsx|map|pem|key)$|[/\\]\.env(?:\.|$)/i.test(p)),'Development/private file in build');
console.log('Vocabulary release check passed: 40 lessons, 400 words, 400 final illustration mappings, 1200 examples, 400 readings, 1600 unchanged approved recordings, 2400 exact media files.');
