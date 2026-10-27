import {playFeedback,stopFeedback} from './feedback-audio';
const key='be-deutsch:l01:listening:v1';
type State={answers:Record<string,Record<string,number>>,positions:Record<string,number>,finished:Record<string,boolean>,completed:Record<string,boolean>,sound:boolean,lastActivity?:string};
let state:State={answers:{},positions:{},finished:{},completed:{},sound:true};
let canSave=true;const touched=new Set<string>();let soundTouched=false;
try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old&&typeof old==='object')state={...state,...old};}catch{canSave=false;}
function save(id?:string,remember=true){
 if(id){touched.add(id);if(remember)state.lastActivity=id;}
 try{
  const latest=JSON.parse(localStorage.getItem(key)||'null')||{};
  const next={...latest,...state,answers:{...latest.answers},positions:{...latest.positions},finished:{...latest.finished},completed:{...latest.completed}};
  for(const rid of touched){for(const field of ['answers','positions','finished','completed'] as const){if(state[field][rid]!==undefined)(next[field] as Record<string,unknown>)[rid]=state[field][rid];}}
  if(!soundTouched&&typeof latest.sound==='boolean')next.sound=latest.sound;
  localStorage.setItem(key,JSON.stringify(next));state=next;
 }catch{canSave=false;}
}
const sounds=document.querySelector<HTMLButtonElement>('.sound-toggle')!;
function soundLabel(){sounds.textContent=`Quiztöne: ${state.sound?'an':'aus'}`;sounds.setAttribute('aria-pressed',String(state.sound));}
soundLabel();sounds.addEventListener('click',()=>{state.sound=!state.sound;soundTouched=true;stopFeedback();soundLabel();save();});
const audios=Array.from(document.querySelectorAll<HTMLAudioElement>('audio'));
const time=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
document.querySelectorAll<HTMLElement>('.activity').forEach(activity=>{
 const id=activity.dataset.recording!,player=activity.querySelector<HTMLElement>('.player')!,audio=player.querySelector<HTMLAudioElement>('audio')!;
 const play=player.querySelector<HTMLButtonElement>('.play')!,seek=player.querySelector<HTMLInputElement>('.seek')!,status=player.querySelector<HTMLElement>('.play-status')!,resume=player.querySelector<HTMLButtonElement>('.resume')!;
 audio.preservesPitch=true;let pending:number|null=null,lastSaved=0;
 const update=()=>{seek.value=String(audio.currentTime);player.querySelector('.time')!.textContent=`${time(audio.currentTime)} / ${time(Number.isFinite(audio.duration)?audio.duration:Number(seek.max))}`;};
 function position(n:number){if(audio.readyState>=1){audio.currentTime=Math.max(0,Math.min(n,audio.duration));update();}else{pending=n;audio.load();}}
 const start=async()=>{stopFeedback();try{await audio.play();}catch{status.textContent='Bitte Abspielen erneut drücken.';}};
 audio.addEventListener('loadedmetadata',()=>{seek.max=String(audio.duration);if(pending!==null){audio.currentTime=Math.min(pending,audio.duration);pending=null;}update();});
 audio.addEventListener('timeupdate',()=>{update();if(Math.abs(audio.currentTime-lastSaved)>2){state.positions[id]=audio.currentTime;lastSaved=audio.currentTime;save(id,false);}});
 audio.addEventListener('play',()=>{stopFeedback();audios.forEach(a=>{if(a!==audio)a.pause();});player.dataset.playing='true';play.textContent='Ⅱ Pause';play.setAttribute('aria-label',`${audio.getAttribute('aria-label')} pausieren`);status.textContent='Du hörst gerade …';resume.hidden=true;save(id);});
 audio.addEventListener('pause',()=>{player.dataset.playing='false';play.textContent='▶ Weiterhören';play.setAttribute('aria-label',`${audio.getAttribute('aria-label')} abspielen`);status.textContent='Pausiert';state.positions[id]=audio.currentTime;save(id,false);});
 audio.addEventListener('waiting',()=>status.textContent='Audio lädt …');
 audio.addEventListener('playing',()=>status.textContent='Du hörst gerade …');
 audio.addEventListener('error',()=>{status.textContent='Audio konnte nicht geladen werden. Bitte erneut versuchen.';play.textContent='▶ Erneut versuchen';});
 audio.addEventListener('ended',()=>{player.dataset.playing='false';play.textContent='▶ Noch einmal';play.setAttribute('aria-label',`${audio.getAttribute('aria-label')} abspielen`);status.textContent='Fertig gehört';state.finished[id]=true;state.positions[id]=0;save(id);});
 play.addEventListener('click',()=>{if(!audio.paused){audio.pause();return;}if(audio.error)audio.load();if(audio.ended)audio.currentTime=0;void start();});
 player.querySelector('.replay')!.addEventListener('click',()=>{position(0);void start();});
 player.querySelector('.rewind')!.addEventListener('click',()=>position(audio.currentTime-10));
 player.querySelector('.forward')!.addEventListener('click',()=>position(audio.currentTime+10));
 seek.addEventListener('input',()=>position(Number(seek.value)));
 player.querySelector<HTMLSelectElement>('.speed')!.addEventListener('change',e=>{audio.preservesPitch=true;audio.playbackRate=Number((e.target as HTMLSelectElement).value);});
 player.querySelectorAll<HTMLButtonElement>('.chapter').forEach(b=>b.addEventListener('click',()=>{position(Number(b.dataset.start));void start();}));
 if((state.positions[id]||0)>3){resume.hidden=false;resume.textContent=`Bei ${time(state.positions[id])} fortsetzen`;}
 resume.addEventListener('click',()=>{position(state.positions[id]);void start();});
 window.addEventListener('pagehide',()=>{if(!audio.ended&&audio.currentTime>0){state.positions[id]=audio.currentTime;save(id,false);}});
 const questions=Array.from(activity.querySelectorAll<HTMLElement>('.question'));
 function score(changed=false){
  const count=questions.filter(q=>state.answers[id]?.[q.dataset.question!]===Number(q.dataset.answer)).length;
  const done=questions.every(q=>typeof state.answers[id]?.[q.dataset.question!]==='number');
  if(changed){state.completed[id]=done;save(id);}
  activity.querySelector('.score')!.textContent=`${count} / ${questions.length} richtig`;
  activity.querySelector('.progress-status')!.textContent=canSave?(done?'✓ Hörtext bearbeitet. Dein Ergebnis ist gespeichert.':'Fortschritt wird auf diesem Gerät gespeichert.'):'Speichern ist in diesem Browser nicht verfügbar. Du kannst weiter üben.';
 }
 function render(q:HTMLElement,choice:number){const correct=choice===Number(q.dataset.answer);q.querySelectorAll<HTMLButtonElement>('.answer').forEach(b=>{const selected=Number(b.dataset.option)===choice;b.setAttribute('aria-pressed',String(selected));delete b.dataset.result;if(selected)b.dataset.result=correct?'correct':'incorrect';});const feedback=q.querySelector<HTMLElement>('.feedback')!;feedback.hidden=false;feedback.textContent=`${correct?'Richtig.':'Hör noch einmal. Du kannst deine Antwort ändern.'} ${feedback.dataset.evidence}`;}
 questions.forEach(q=>{const old=state.answers[id]?.[q.dataset.question!];if(typeof old==='number')render(q,old);q.querySelectorAll<HTMLButtonElement>('.answer').forEach(b=>b.addEventListener('click',()=>{const answer=Number(b.dataset.option);state.answers[id]??={};state.answers[id][q.dataset.question!]=answer;render(q,answer);score(true);audios.forEach(a=>a.pause());stopFeedback();if(state.sound)void playFeedback(answer===Number(q.dataset.answer)?'correct':'incorrect',true);}));});
 score();activity.querySelector('.reset-questions')!.addEventListener('click',()=>{state.answers[id]={};state.completed[id]=false;save(id);questions.forEach(q=>{q.querySelector<HTMLElement>('.feedback')!.hidden=true;q.querySelectorAll<HTMLButtonElement>('.answer').forEach(b=>{b.setAttribute('aria-pressed','false');delete b.dataset.result;});});score();});
 activity.querySelector<HTMLSelectElement>('.glossary-language')!.addEventListener('change',e=>activity.querySelectorAll<HTMLElement>('.word-translation').forEach(s=>s.hidden=s.dataset.lang!==(e.target as HTMLSelectElement).value));
});
document.querySelectorAll<HTMLElement>('.lesson-progress').forEach(el=>{
 const ids=[1,2,3].map(n=>`${el.dataset.lesson}-${String(n).padStart(2,'0')}`);
 const required:number[]=JSON.parse(el.dataset.questionCounts||'[0,0,0]');
 const completed=ids.filter((id,i)=>state.completed[id]||(required[i]>0&&Object.keys(state.answers[id]||{}).length===required[i])).length,started=ids.filter(id=>Object.keys(state.answers[id]||{}).length>0||state.positions[id]>3||state.finished[id]).length;
 el.textContent=completed===3?'✓ Lektion bearbeitet':completed?`${completed} von 3 Hörtexten bearbeitet`:started?`${started} von 3 Hörtexten begonnen`:'Noch nicht begonnen';el.classList.toggle('lesson-complete',completed===3);
});
const continueLink=document.querySelector<HTMLAnchorElement>('.continue-learning');
if(continueLink&&state.lastActivity){const id=state.lastActivity;if(Object.keys(state.answers[id]||{}).length||state.positions[id]>3||state.finished[id]){continueLink.hidden=false;continueLink.href=id.startsWith('HT')?`/listening/${id.slice(0,4).toLowerCase()}/#${id}`:'/podcasts/ein-morgen/';continueLink.textContent=`Weiterlernen · ${id} ↗`;}}
document.querySelector<HTMLSelectElement>('.review-filter')?.addEventListener('change',e=>{audios.forEach(a=>a.pause());stopFeedback();const value=(e.target as HTMLSelectElement).value;document.querySelectorAll<HTMLElement>('.activity').forEach(a=>a.hidden=value!=='all'&&a.dataset.lesson!==value);});
document.querySelector<HTMLSelectElement>('.lesson-select')?.addEventListener('change',e=>{window.location.href=(e.target as HTMLSelectElement).value;});
