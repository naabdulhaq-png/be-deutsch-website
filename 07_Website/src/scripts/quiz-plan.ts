export type QuizKind='image'|'meaning'|'reverse'|'listening'|'article';
type QCard={vocabulary_id:string;german:string;part_of_speech:string;senses:{sense_role:string;translations:Record<string,{text:string}>}[];grammar:{noun:null|{singular?:string;singular_article?:string;teaching_headword_number?:string}}};
const id=(n:number)=>'BD-A1-V'+String(n).padStart(3,'0');
const families=[[1,2,3],[6,7],[13,388],[15,17],[21,22,23],[35,47],[43,44],[45,46],[149,141,142,143],[150,144,145,146,147,148],[237,238],[255,256],[257,258],[259,260],[343,344],[363,365],[366,367],[251,252],[395,397],[396,398],[281,283,284,285,286],[301,308]].map(g=>g.map(id));
export const norm=(s:string)=>s.toLocaleLowerCase().normalize('NFC').replace(/[.!?;,()[\]„“"']/g,'').replace(/\s+/g,' ').trim();
export const primaryMeaning=(v:QCard,code:string)=>(v.senses.find(s=>s.sense_role==='primary')||v.senses[0]).translations[code].text;
export function safeDistractor(a:QCard,b:QCard):boolean{
 if(a.vocabulary_id===b.vocabulary_id||norm(a.german)===norm(b.german))return false;
 if(families.some(g=>g.includes(a.vocabulary_id)&&g.includes(b.vocabulary_id)))return false;
 for(const code of ['en','uk','ar','fa','ps']){
  const aa=norm(primaryMeaning(a,code)),bb=norm(primaryMeaning(b,code));if(aa===bb)return false;
  // Exclude explicitly overlapping lexical alternatives as well as exact labels.
  const parts=(s:string)=>s.split(/\s*[/;]\s*/).map(norm).filter(x=>x.length>1);
  if(parts(aa).some(x=>parts(bb).includes(x)))return false;
 }
 return true;
}
function imageIsClear(v:QCard){
 const n=Number(v.vocabulary_id.slice(-3));
 return [1,6,11].includes(n)||(n>=121&&n<=147&&n!==123)||(n>=151&&n<=169&&n!==166)||(n>=181&&n<=189)||(n>=191&&n<=198)||(n>=201&&n<=210)||(n>=221&&n<=226)||(n>=231&&n<=235)||(n>=261&&n<=270)||(n>=301&&n<=306)||(n>=313&&n<=318);
}
export function planQuiz<T extends QCard>(cards:T[]){
 const pattern:QuizKind[]=['image','meaning','reverse','listening','article','image','reverse','listening','article','reverse'];
 return cards.map((card,index)=>{
  let kind=pattern[index];const noun=card.grammar.noun;
  if(kind==='article'&&(!noun?.singular||!['der','die','das'].includes(noun.singular_article||'')||noun.teaching_headword_number!=='singular'))kind='meaning';
  if(kind==='image'&&!imageIsClear(card))kind='meaning';
  const candidates=cards.filter(c=>safeDistractor(card,c));
  if(kind!=='article'&&candidates.length<3)throw Error('Insufficient unambiguous choices for '+card.vocabulary_id);
  return {card,kind,candidates};
 });
}
