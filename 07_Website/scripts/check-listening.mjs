import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const read=p=>readFile(path.join(root,p));
const digest=b=>createHash('sha256').update(b).digest('hex');
const lock=JSON.parse(await read('integrity/listening-asset-lock.json'));
const raw=await read('src/data/listening-course.json'),data=JSON.parse(raw);
const fail=[];const assert=(yes,message)=>{if(!yes)fail.push(message);};
assert(digest(raw)===lock.approved_data_sha256,'Approved content bytes changed');
assert(data.lessons.length===20&&new Set(data.lessons.map(l=>l.id)).size===20,'Expected 20 unique lessons');
assert(data.recordings.length===61&&new Set(data.recordings.map(r=>r.id)).size===61,'Expected 61 active recordings');
assert(data.recordings.reduce((n,r)=>n+r.questions.length,0)===215,'Expected 215 questions');
const episodes=JSON.parse(await read('src/data/podcasts.json'));assert(episodes.length===1&&episodes[0].id==='P01-v2','Only the corrected approved podcast may ship');
const routes=['/listening/','/podcasts/',...episodes.map(e=>`/podcasts/${e.slug}/`),...data.lessons.map(l=>`/listening/${l.id.toLowerCase()}/`)];
const sitemap=(await Promise.all((await readdir(dist)).filter(f=>/^sitemap.*\.xml$/.test(f)).map(f=>readFile(path.join(dist,f),'utf8')))).join('');
const audioFiles=await readdir(path.join(root,'public/listening-assets/audio'));
assert(audioFiles.length===61,'Duplicate, missing or backup audio in deployment');
for(const l of data.lessons)assert(l.recordings.length===3&&l.recordings.every(id=>data.recordings.some(r=>r.id===id)),`${l.id}: invalid passage mapping`);
for(const r of data.recordings){
 const asset=lock.recordings[r.id];assert(Boolean(asset),`${r.id}: missing lock`);if(!asset)continue;
 const bytes=await read('public'+asset.path),built=await readFile(path.join(dist,asset.path.slice(1)));
 assert(digest(bytes)===asset.sha256&&digest(built)===asset.sha256,`${r.id}: approved audio checksum mismatch`);
 assert(asset.duration_seconds===r.duration,`${r.id}: duration association mismatch`);
 assert(r.id.startsWith('HT')?r.duration>=30&&r.duration<=180:r.duration>=300&&r.duration<=1800,`${r.id}: duration outside requirement`);
 for(const q of r.questions)assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length&&Boolean(q.evidence),`${r.id}: invalid answer key`);
 for(const word of r.glossary_words){const glossary=data.glossary[word];assert(glossary&&['en','uk','ar','fa','ps'].every(code=>glossary[code]?.text),`${r.id}: incomplete word translations`);}
 for(const t of r.turns)assert(data.voices[t.role]?.id,`${r.id}: invalid speaker`);
}
for(const route of routes){
 const html=await readFile(path.join(dist,route.slice(1),'index.html'),'utf8');
 assert(html.includes(`rel="canonical" href="https://www.bedeutsch.de${route}"`),`${route}: canonical mismatch`);
 assert(sitemap.includes(`<loc>https://www.bedeutsch.de${route}</loc>`),`${route}: missing sitemap entry`);
 assert((html.match(/<h1\b/g)||[]).length===1,`${route}: expected one H1`);
 assert(!/noindex|localhost|127\.0\.0\.1|preview-listening|preview-podcasts|Noch nicht veröffentlicht|Lokale A1-Vorschau/.test(html),`${route}: preview or private release text`);
 assert(html.includes('Content-Security-Policy'),`${route}: missing shared security policy`);
 for(const audio of html.matchAll(/<audio\b[^>]*>/g))assert(audio[0].includes('preload="none"'),`${route}: eager audio preload`);
}
async function walk(dir){let out=[];for(const name of await readdir(dir)){const f=path.join(dir,name);out.push(...((await stat(f)).isDirectory()?await walk(f):[f]));}return out;}
const all=await walk(dist);let checked=0;
for(const file of all.filter(f=>f.endsWith('.html'))){const html=await readFile(file,'utf8');for(const m of html.matchAll(/(?:href|src)="(\/[^"#]*)/g)){const url=m[1].split('#')[0].split('?')[0];if(url.startsWith('//'))continue;const f=path.join(dist,url.slice(1),url.endsWith('/')?'index.html':'');try{await stat(f);checked++;}catch{fail.push(`Broken local reference ${url} in ${path.relative(dist,file)}`);}}}
assert(!all.some(f=>/preview-|\.env$|\.git(?:\/|\\)|\.zip$|\/backup\//.test(path.relative(dist,f))),'Review or private files found in output');
if(fail.length){console.error(fail.join('\n'));process.exit(1);}
console.log(`Listening checks passed: 20 lessons, 60 passages + 1 podcast, 215 questions, 61 exact audio hashes, ${routes.length} public routes, ${checked} local references.`);
