export type FeedbackKind='correct'|'incorrect';
export type SoundPair='a'|'b'|'c'|'d'|'e'|'f'|'g'|'h';
export const soundPairs={
 a:{name:'Warm chime',description:'A rounded, rising three-note success chime with a gentle two-note settling response.',recommended:true},
 b:{name:'Soft keys',description:'A softer keyboard-like triad and a short, calm downward response.',recommended:false},
 c:{name:'Rounded bell',description:'A compact, lightly resonant bell pattern and a mellow downward response.',recommended:false},
 d:{name:'Velvet marimba',description:'Three crisp, warm wooden notes for success; two muted wooden taps for try again.',recommended:false},
 e:{name:'Glass bloom',description:'A soft, spreading glass-like chord for success; a brief, gentle chord for try again.',recommended:false},
 f:{name:'Playful pop',description:'Two rounded upward pops for success; one lower, soft pop for try again.',recommended:false},
 g:{name:'String pluck',description:'A warm, guitar-like three-note pluck for success; two short, damped plucks for try again.',recommended:false},
 h:{name:'Selected combination',description:'Your choice: D Velvet marimba for correct answers, G String pluck for try again.',recommended:true},
};
/** Original additive synthesis; no samples, service calls or third-party sound assets. */
export function feedbackSamples(kind:FeedbackKind,rate=48000,pair:SoundPair='h'):Float32Array{
 if(pair==='h')return feedbackSamples(kind,rate,kind==='correct'?'d':'g');
 if(pair==='d'||pair==='e'||pair==='f'||pair==='g')return additionalSamples(kind,rate,pair);
 const definitions={
  a:{correct:[523.251,659.255,783.991],incorrect:[659.255,587.330],step:.115,success:.62,retry:.40,note:.36,decay:7.5},
  b:{correct:[391.995,493.883,587.330],incorrect:[493.883,440],step:.105,success:.55,retry:.35,note:.32,decay:9},
  c:{correct:[349.228,440,523.251],incorrect:[391.995,349.228],step:.085,success:.52,retry:.36,note:.32,decay:8},
 };
 const d=definitions[pair],frequencies=d[kind],duration=kind==='correct'?d.success:d.retry;
 const samples=new Float32Array(Math.round(duration*rate));
 for(let i=0;i<samples.length;i++){
  const time=i/rate;
  for(let n=0;n<frequencies.length;n++){
   const t=time-n*d.step,remaining=duration-time;
   if(t<0||t>d.note)continue;
   const attack=Math.min(1,t/.014),release=Math.min(1,(d.note-t)/.055,remaining/.04);
   const envelope=attack*attack*(3-2*attack)*Math.exp(-t*d.decay)*Math.max(0,release);
   const phase=2*Math.PI*frequencies[n]*t;
   let tone=Math.sin(phase);
   if(pair==='a')tone+=.16*Math.exp(-t*13)*Math.sin(2*phase)+.04*Math.exp(-t*19)*Math.sin(3*phase)+.04*Math.sin(phase/2);
   else if(pair==='b')tone+=.10*Math.exp(-t*10)*Math.sin(2*phase)+.035*Math.exp(-t*18)*Math.sin(3*phase);
   else tone+=.10*Math.exp(-t*17)*Math.sin(2.76*phase)+.022*Math.exp(-t*24)*Math.sin(4.2*phase);
   samples[i]+=tone*envelope*(kind==='correct'?[.88,.96,1][n]:[1,.88][n]);
  }
 }
 const rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);
 const peak=samples.reduce((m,x)=>Math.max(m,Math.abs(x)),0);
 const gain=Math.min(Math.pow(10,-19.5/20)/rms,.5/peak);
 for(let i=0;i<samples.length;i++)samples[i]*=gain;
 return samples;
}

function additionalSamples(kind:FeedbackKind,rate:number,pair:'d'|'e'|'f'|'g'):Float32Array{
 const correct=kind==='correct';
 const duration=pair==='d'?(correct?.50:.30):pair==='e'?(correct?.64:.36):pair==='f'?(correct?.38:.24):(correct?.66:.38);
 const out=new Float32Array(Math.round(rate*duration));
 const smooth=(x:number)=>{const a=Math.max(0,Math.min(1,x));return a*a*(3-2*a);};
 if(pair==='g'){
  const notes=correct?[329.628,415.305,493.883]:[415.305,329.628];
  notes.forEach((frequency,n)=>{
   const delay=new Float64Array(Math.round(rate/frequency));let seed=1709+n*313+(correct?71:193);
   for(let i=0;i<delay.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;delay[i]=seed/2147483648-1;}
   let cursor=0,low=0;const start=Math.round(n*.09*rate),filter=1-Math.exp(-2*Math.PI*1800/rate);
   for(let i=start;i<out.length;i++){
    const t=(i-start)/rate;const value=delay[cursor];delay[cursor]=.994*.5*(value+delay[(cursor+1)%delay.length]);cursor=(cursor+1)%delay.length;
    low+=filter*(value-low);out[i]+=low*smooth(t/.008)*smooth((duration-i/rate)/.055)*(n===0?1:.85);
   }
  });
 }else{
  const notes=pair==='d'?(correct?[440,554.365,659.255]:[554.365,440]):pair==='e'?(correct?[523.251,659.255,783.991]:[391.995,523.251]):(correct?[520,760]:[380]);
  const step=pair==='d'?.085:pair==='e'?.025:.135;
  for(let i=0;i<out.length;i++){
   const time=i/rate;
   notes.forEach((frequency,n)=>{
    const t=time-n*step;if(t<0)return;
    let voice=0;
    if(pair==='d'){
     const phase=2*Math.PI*frequency*t;
     voice=smooth(t/.004)*Math.exp(-t*15)*(Math.sin(phase)+.23*Math.exp(-t*20)*Math.sin(3.9*phase)+.035*Math.exp(-t*30)*Math.sin(6.2*phase));
    }else if(pair==='e'){
     const phase=2*Math.PI*frequency*t;
     voice=smooth(t/.035)*Math.exp(-t*5.3)*(Math.sin(phase)+.16*Math.sin(phase*1.002)+.065*Math.exp(-t*8)*Math.sin(phase*2.4));
    }else{
     const tau=.028,start=frequency*(correct?.56:1.35),phase=2*Math.PI*(frequency*t+(start-frequency)*tau*(1-Math.exp(-t/tau)));
     voice=smooth(t/.006)*Math.exp(-t*24)*Math.sin(phase);
    }
    out[i]+=voice*smooth((duration-time)/.035)*(n===0?.88:1);
   });
  }
 }
 const rms=Math.sqrt(out.reduce((s,v)=>s+v*v,0)/out.length),peak=out.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
 const gain=Math.min(Math.pow(10,-19.5/20)/rms,.5/peak);
 for(let i=0;i<out.length;i++)out[i]*=gain;
 return out;
}
