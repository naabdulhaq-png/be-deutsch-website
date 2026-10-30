import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
import{grade,score,orderText}from'../src/a2/lib/scoring.ts';
import{parseProgress,freshProgress,updateProgress,loadProgress,storageKey,blankDraft,scheduleRevision}from'../src/a2/lib/progress.ts';
import{forbiddenBuildPath}from'../scripts/release-paths.mjs';
const app=path.resolve(import.meta.dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(app,'src/a2/data/course.json'),'utf8')),q=data.questions;
test('learner review route is not a private Review directory',()=>{assert(!forbiddenBuildPath('a2/unit-1/review/index.html'));for(const name of ['Review/answers.xlsx','a2/unit-1/review/private.json','Screenshots/private.png','src/private.ts','node_modules/file.js','.env','nested/.env.local','secret.key'])assert(forbiddenBuildPath(name),name);});
function* permute(a:string[]):Generator<string[]>{if(!a.length){yield[];return;}for(let i=0;i<a.length;i++)for(const p of permute(a.filter((_,j)=>j!==i)))yield[a[i],...p];}
function answer(x:any){if(['choice','matching','sequence'].includes(x.mode))return structuredClone(x.solution);if(x.mode==='entry')return x.canonical;return[...permute(x.tokens.map((t:any)=>t.id))].find(ids=>grade(x,ids));}
for(const x of Object.values(q)as any[])test('integrated fixed scoring '+x.id,()=>{assert(grade(x,answer(x)));assert(!grade(x,undefined));if(x.mode==='choice')for(const o of x.options)assert.equal(grade(x,o.id),o.id===x.solution);if(x.mode==='entry')for(const a of x.accepted)assert(grade(x,a));if(x.mode==='order'){assert.equal(orderText(x,'corrupt' as any),'');assert(!grade(x,'corrupt'));}if(x.mode==='matching')assert(!grade(x,{}));});
test('complete unchanged content inventory and 48 selected records',()=>{
 assert.equal(data.grammar.length,4);assert.equal(data.vocabulary.length,4);assert.equal(data.lexical.length,60);assert.equal(data.lexical.filter((x:any)=>x.status==='Productive').length,48);assert.equal(data.lexical.filter((x:any)=>x.status==='Receptive').length,12);assert.equal(data.passages.length,4);assert.equal(data.podcast.chapters.length,5);assert.equal(Object.keys(q).length,202);
 const ids=['grammar','vocabulary','listening','podcast'];assert.deepEqual(ids.map(s=>data.assessments['integrated:'+s].questions.length),[16,20,6,6]);
 for(const a of Object.values(data.assessments)as any[]){assert.equal(new Set(a.questions).size,a.questions.length);const r=Object.fromEntries(a.questions.map((id:string)=>[id,answer(q[id])]));assert.equal(score(a.questions,q,r).correct,a.questions.length);assert.equal(score(a.questions,q,{}).unanswered,a.questions.length);}
 assert.equal(data.assessments['A2-P01'].questions.length,8);assert.equal(data.assessments['optional:A2-P01'].questions.length,6);
});
test('matching maps, capitalization and literal alternatives survive integration',()=>{
 const ms=Object.values(q).filter((x:any)=>x.mode==='matching')as any[];assert.equal(ms.length,5);assert.equal(new Set(ms.map(x=>x.displayAlias)).size,5);
 for(const x of ms){assert(grade(x,x.solution));assert(!grade(x,'1-B; 2-C; 3-A'));for(const[i,p]of x.people.entries()){const o=x.options.find((o:any)=>o.id===x.solution[p.id]);assert(x.canonical.split(/\s*;\s*|\s*\|\s*/)[i]===`${p.label} → ${o.label}`);}}
 assert(grade(q['A2-U01-V02-Q08'],'prüfung'));assert(!grade(q['A2-U01-G02-Q02'],'Gespielt'));
});
test('new route resume, legacy A2 resume and history preservation',()=>{
 const p=freshProgress();assert.equal(p.resume,'/a2/unit-1/');p.resume='/preview-a2/grammar/g02/';p.reviewed['A2-U01-G01']=true;p.positions['A2-P01-AUDIO']=140.485;p.drafts['A2-U01-G01']={...blankDraft(),index:3};
 const r=parseProgress(JSON.stringify(p));assert.equal(r.resume,'/a2/unit-1/grammar/g02/');assert(r.reviewed['A2-U01-G01']);assert.equal(r.positions['A2-P01-AUDIO'],140.485);assert.equal(r.drafts['A2-U01-G01'].index,3);
 p.resume='/a2/unit-1/review/';assert.equal(parseProgress(JSON.stringify(p)).resume,p.resume);p.resume='/a2/unit-1/../../privacy/';assert.equal(parseProgress(JSON.stringify(p)).resume,'/a2/unit-1/');assert.equal(parseProgress('{bad').resume,'/a2/unit-1/');assert.equal(storageKey,'be-deutsch:a2-unit1:BD-A2-W01.1:v1');
});
test('all actual A1 storage namespaces remain untouched',()=>{
 const values=new Map<string,string>(),port={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
 const a1=['be-deutsch:a1-grammar:v1','be-deutsch:a1-vocabulary:v2','be-deutsch:l01:listening:v1'];a1.forEach(k=>values.set(k,k));updateProgress(s=>s.reviewed['A2-U01-G01']=true,port);updateProgress(s=>s.reviewed['A2-U01-V01']=true,port);assert(loadProgress(port).reviewed['A2-U01-G01']);a1.forEach(k=>assert.equal(values.get(k),k));
});
test('revision intervals and damaged state recover without global clearing',()=>{
 const s=freshProgress(),n=1000000000;scheduleRevision(s,'word',true,n);assert.equal(s.revision.word.due,n+86400000);scheduleRevision(s,'word',true,n+86400000);assert.equal(s.revision.word.due,n+3*86400000);scheduleRevision(s,'word',false,n+4*86400000);assert.equal(s.revision.word.due,n+5*86400000);assert.deepEqual(parseProgress('null'),freshProgress());
});
test('all 178 static recordings and chapter offsets are preserved',()=>{
 assert.equal(data.audio.length,178);for(const a of data.audio){const p=path.join(app,'public',a.url);const bytes=fs.readFileSync(p);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(a.sampleRate,44100);assert.equal(a.channels,1);assert.equal(a.bitrate,a.provenance==='REUSE_A1'?192000:128000);}
 assert.deepEqual(data.podcast.chapters.map((c:any)=>c.start),[0,64.942,140.485,212.591,286.694]);assert.equal(data.podcast.chapters.at(-1).end,349.326);
});
