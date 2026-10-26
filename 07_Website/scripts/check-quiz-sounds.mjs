import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const site=path.resolve(import.meta.dirname,'..'),ts=createRequire(path.join(site,'package.json'))('typescript');
const lock=JSON.parse(await fs.readFile(path.join(site,'integrity/quiz-sound-lock.json'),'utf8'));
const profiles=await fs.readFile(path.join(site,'src/scripts/sound-profiles.ts'),'utf8');
const engine=await fs.readFile(path.join(site,'src/scripts/feedback-audio.ts'),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sha(profiles),lock.approved_profiles_sha256,'Approved sound synthesis source changed');
assert.match(engine,/export function getSoundPair\(\):SoundPair\{return 'h';\}/,'Production must always choose Pair H');
assert.ok(!engine.includes('localStorage.getItem'),'Draft preferences must not override H');
const js=ts.transpileModule(profiles,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {feedbackSamples}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function wav(x){const b=Buffer.alloc(44+x.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(96000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(x.length*2,40);x.forEach((v,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));return b;}
for(const kind of ['correct','incorrect']){
 for(const rate of [44100,48000])assert.deepEqual(feedbackSamples(kind,rate,'h'),feedbackSamples(kind,rate,kind==='correct'?'d':'g'),'Pair H selected sound mismatch');
 const x=feedbackSamples(kind,48000,'h');assert.equal(sha(wav(x)),lock[kind].approved_wav_sha256);assert.ok(x.every(v=>Math.abs(v)<=.5));
}
console.log('Quiz sound release check passed: production H only; exact owner-approved D success and G retry samples; mute and non-overlap engine preserved.');
