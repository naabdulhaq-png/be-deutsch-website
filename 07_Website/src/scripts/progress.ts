import catalog from '../data/vocabulary-catalog.json' with {type:'json'};
export type Score = {best:number;last:number;attempts:number};
export type Progress = {version:2;language:string;all:boolean;sound:boolean;lesson:number;positions:number[];viewed:string[];studied:string[];scores:Record<string,Score>};
export const progressKey='be-deutsch:a1-vocabulary:v2';
export const freshProgress=():Progress=>({version:2,language:'en',all:false,sound:true,lesson:0,positions:Array(40).fill(0),viewed:[],studied:[],scores:{}});
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
export function loadProgress(ids:string[],lessonIds:string[],provided?:StoragePort):Progress {
 const out=freshProgress();
 try {
  const store=provided??localStorage;
  const raw=store.getItem(progressKey)||store.getItem('be-deutsch:w02-vocabulary-pilot:v1');
  if(!raw||raw.length>65536)return out;const p=JSON.parse(raw);if(!p||typeof p!=='object'||(p.version!==1&&p.version!==2))return out;
  if(['en','uk','ar','fa','ps'].includes(p.language))out.language=p.language;
  out.all=p.all===true;out.sound=p.sound!==false;out.lesson=Number.isInteger(p.lesson)?Math.max(0,Math.min(39,p.lesson)):0;
  out.positions=out.positions.map((_,i)=>Number.isInteger(p.positions?.[i])?Math.max(0,Math.min(9,p.positions[i])):0);
  for(const field of ['viewed','studied'] as const)out[field]=Array.isArray(p[field])?[...new Set<string>(p[field].slice(0,ids.length*2).filter((id:unknown)=>typeof id==='string'&&ids.includes(id)))]:[];
  for(const id of lessonIds){const s=p.scores?.[id];if(s&&Number.isInteger(s.best)&&s.best>=0&&s.best<=10&&Number.isInteger(s.last)&&s.last>=0&&s.last<=10)out.scores[id]={best:Math.max(s.best,s.last),last:s.last,attempts:Math.max(1,Math.min(100000,Math.floor(Number(s.attempts)||1)))};}
 }catch{/* Learning remains available with session-only progress. */}
 return out;
}
export function saveProgress(value:Progress,options:{replaceAll?:boolean;storage?:StoragePort}={}){
 try{
  const store=options.storage??localStorage;
  if(!options.replaceAll){
   const latest=loadProgress(catalog.lessons.flatMap(l=>l.vocabulary_ids),catalog.lessons.map(l=>l.lesson_id),store);
   const lesson=catalog.lessons[value.lesson];
   // A stale tab may update its own lesson without erasing another lesson's newer progress.
   value.viewed=[...new Set([...latest.viewed,...value.viewed])];
   value.studied=[...latest.studied.filter(id=>!lesson.vocabulary_ids.includes(id)),...value.studied.filter(id=>lesson.vocabulary_ids.includes(id))];
   value.positions=latest.positions.map((position,i)=>i===value.lesson?value.positions[i]:position);
   const current=value.scores[lesson.lesson_id],previous=latest.scores[lesson.lesson_id];value.scores={...latest.scores};if(current)value.scores[lesson.lesson_id]={...current,best:Math.max(current.best,previous?.best??0),attempts:Math.max(current.attempts,previous?.attempts??0)};
  }
  store.setItem(progressKey,JSON.stringify(value));return true;
 }catch{return false;}
}
