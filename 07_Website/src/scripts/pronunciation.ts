import {stopFeedback} from './feedback-audio';
type Recording={audio_id:string;path:string};
let player:HTMLAudioElement|null=null;
let playingButton:HTMLButtonElement|null=null;
let deadline:ReturnType<typeof setTimeout>|undefined;
function status(text:string){const output=document.getElementById('playback-status');if(output)output.textContent=text;}
function clearDeadline(){if(deadline!==undefined)clearTimeout(deadline);deadline=undefined;}
export function stopAudio(){
 clearDeadline();
 const old=player;player=null;
 if(old){old.pause();old.removeAttribute('src');old.load();}
 if(playingButton){playingButton.setAttribute('aria-pressed','false');playingButton.dataset.playback='stopped';playingButton.querySelector('.play-icon')!.textContent='▶';playingButton=null;}
 status('');
}
export function audioButton(record:Recording,label:string,compact=false){
 const b=document.createElement('button');b.className='vocab-button audio-button '+(compact?'compact':'primary');b.type='button';b.setAttribute('aria-label',label);b.setAttribute('aria-pressed','false');b.dataset.audioId=record.audio_id;b.dataset.audioPath=record.path;b.dataset.playback='idle';
 const icon=document.createElement('span');icon.className='play-icon';icon.textContent='▶';icon.setAttribute('aria-hidden','true');b.append(icon);
 if(!compact){const text=document.createElement('span');text.textContent='Listen';b.append(text);}
 b.addEventListener('click',()=>{
  stopFeedback();
  if(playingButton===b&&player&&!player.paused){stopAudio();return;}
  stopAudio();
  // No Audio object or media request is created before this explicit user gesture.
  const next=new Audio();next.preload='none';player=next;playingButton=b;b.dataset.playback='loading';
  const failed=()=>{
   if(player!==next)return;stopAudio();b.dataset.playback='error';status('Audio could not play. Check your connection and press Listen to try again.');
  };
  const waiting=()=>{
   if(player!==next)return;clearDeadline();b.dataset.playback='loading';status('Audio is loading. Please wait, or press Listen again to cancel.');deadline=setTimeout(failed,30000);
  };
  next.addEventListener('playing',()=>{if(player!==next)return;clearDeadline();status('');b.setAttribute('aria-pressed','true');b.dataset.playback='playing';icon.textContent='■';});
  next.addEventListener('waiting',waiting);next.addEventListener('stalled',waiting);
  next.addEventListener('ended',()=>{if(player!==next)return;clearDeadline();b.setAttribute('aria-pressed','false');b.dataset.playback='ended';icon.textContent='▶';playingButton=null;player=null;status('');});
  next.addEventListener('error',failed);next.src=record.path;deadline=setTimeout(failed,30000);
  void next.play().catch(error=>{if(error?.name!=='AbortError')failed();});
 });
 return b;
}
