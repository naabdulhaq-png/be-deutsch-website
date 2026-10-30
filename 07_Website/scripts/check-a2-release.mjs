import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createHash}from'node:crypto';
const site=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(site,p)),sha=b=>createHash('sha256').update(b).digest('hex'),lock=JSON.parse(read('integrity/a2-release-lock.json')),d=JSON.parse(read('src/a2/data/course.json'));
for(const p of ['src/a2/data/course.json','public/a2/unit-1/content.json','dist/a2/unit-1/content.json'])assert.equal(sha(read(p)),lock.contentSha256,p);
for(const[p,h]of Object.entries(lock.a1SourceCanonicalLf))assert.equal(sha(Buffer.from(read(p).toString('utf8').replaceAll('\r\n','\n'))),h,p);
assert.equal(d.audio.length,178);for(const a of lock.audio)for(const prefix of ['public/','dist/'])assert.equal(sha(read(prefix+a.path)),a.sha256,a.id);
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]),files=walk(path.join(site,'dist')),html=files.filter(p=>p.endsWith('.html')),a2=html.filter(p=>p.includes(path.join('a2','unit-1')));
assert.equal(html.length,126);assert.equal(a2.length,15);for(const p of a2){const s=fs.readFileSync(p,'utf8');assert(s.includes('content="index,follow,max-image-preview:large"'));assert(!/Local full-site|Local preview only|unpublished candidate|Release Candidate/.test(s),p);}
assert.deepEqual(['grammar','vocabulary','listening','podcast'].map(s=>d.assessments['integrated:'+s].questions.length),[16,20,6,6]);
for(const p of files){assert(!/\.(zip|xlsx|map|pem|key)$/.test(p),p);if(/\.(html|js|css|json|xml|txt)$/.test(p)){const s=fs.readFileSync(p,'utf8');assert(!/\b[A-Za-z]:[\\/]|file:\/\/|xi-api-key|ELEVENLABS_API_KEY/.test(s),p);}}
const m=JSON.parse(read('dist/a2-release.json'));assert(m.publicationAuthorized);assert.equal(m.authorizationReference,'BD-A2-W07-PUBLIC-RELEASE-AUTHORIZATION');assert.equal(m.g015Included,false);
console.log('A2 public release checks passed: 126 pages, 15 public A2 routes, exact frozen content, 178 unchanged audio assets, 48 selected questions, A1 source/state contracts preserved.');
