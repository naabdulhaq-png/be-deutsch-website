import {feedbackSamples,type FeedbackKind,type SoundPair} from './sound-profiles';
export {feedbackSamples} from './sound-profiles';
export const soundPairKey='be-deutsch:quiz-sound-pair:v2';
// Production is locked to the owner's final H combination, including returning browsers.
// Comparison-page selections are deliberately not read on the public website.
export function getSoundPair():SoundPair{return 'h';}
export function setSoundPair(_pair:SoundPair){return false;}
let context:AudioContext|undefined;
let active:{source:AudioBufferSourceNode;gain:GainNode}|undefined;
let generation=0;
const buffers=new Map<string,AudioBuffer>();
export function stopFeedback(){
 generation++;const previous=active;active=undefined;
 if(previous&&context){const now=context.currentTime;try{previous.gain.gain.cancelScheduledValues(now);previous.gain.gain.setValueAtTime(previous.gain.gain.value,now);previous.gain.gain.linearRampToValueAtTime(0,now+.008);previous.source.stop(now+.010);}catch{}}
 const output=document.getElementById('feedback-audio-status');if(output&&['playing','loading'].includes(output.dataset.state||''))output.dataset.state='stopped';
}
export async function playFeedback(kind:FeedbackKind,enabled:boolean,pair:SoundPair=getSoundPair()){
 stopFeedback();const token=generation,output=document.getElementById('feedback-audio-status');
 if(output){output.textContent='';output.dataset.kind=kind;output.dataset.pair=pair;output.dataset.state=enabled?'loading':'muted';}
 if(!enabled)return;
 try{
  context??=new AudioContext();await context.resume();if(generation!==token)return;
  if(context.state!=='running')throw Error('Sound unavailable');
  const key=pair+':'+kind+':'+context.sampleRate;let buffer=buffers.get(key);
  if(!buffer){const values=feedbackSamples(kind,context.sampleRate,pair);buffer=context.createBuffer(1,values.length,context.sampleRate);buffer.copyToChannel(new Float32Array(values),0);buffers.set(key,buffer);}
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.connect(gain);gain.connect(context.destination);active={source,gain};
  source.onended=()=>{source.disconnect();gain.disconnect();if(generation!==token)return;active=undefined;if(output){output.dataset.state='ended';output.textContent=(kind==='correct'?'Correct':'Try again')+' sound played.';}};
  // The prior cue stops after 10ms; this cue starts after 12ms. No stacked cues.
  source.start(context.currentTime+.012);if(output)output.dataset.state='playing';
 }catch{if(output){output.dataset.state='unavailable';output.textContent='Sound is unavailable. Visual answer feedback remains available.';}}
}
