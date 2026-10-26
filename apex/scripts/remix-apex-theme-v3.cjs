#!/usr/bin/env node
/* APEX 26 · RACE REMIX V3 — reconstrucción audible del arreglo para comparar.
 * Offline solamente: nunca en la interfaz ni en el motor de simulación.
 * Fuente musical y tempo leídos directamente del SoundBox original del usuario.
 * Genera un stem con batería, bajo, arpegios y transiciones, después remezcla
 * el tema original con ese stem. No modifica apex-theme.mp3 ni main.
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

const root=path.resolve(__dirname,'..');
const dir=path.join(root,'assets/music');
const src=path.join(dir,'apex-theme.mp3');
const dst=path.join(dir,'apex-theme-v3-race-remix.mp3');
const songFile=path.join(root,'assets/soundbox/apex-song01.js');
const context=vm.createContext(Object.create(null));
vm.runInContext(fs.readFileSync(songFile,'utf8'),context,{timeout:5000});
const song=context.song;
if(!song||song.numChannels!==42||song.patternLen!==32||song.endPattern!==71)
 throw Error('Composition changed: refuse to render against unexpected structure');

const RATE=44100;
const ROW_TIME=song.rowLen/RATE;
const BEAT=ROW_TIME*4; // 137.01 BPM; music synchronized to SoundBox row grid.
const PATTERN=ROW_TIME*song.patternLen;
const DURATION=PATTERN*(song.endPattern+1);
const N=Math.ceil(RATE*DURATION);
const L=new Float32Array(N), R=new Float32Array(N);
let seed=0x26F01A;
function rand(){seed ^=seed<<13; seed ^=seed>>>17;seed ^=seed<<5;return (seed>>>0)/4294967296*2-1;}
function add(i,l,r){if(i>=0&&i<N){L[i]+=l;R[i]+=r;}}
function freq(n){return 174.614115 * Math.pow(2,(n-128)/12);}
function notesFor(channel,pattern,row){
 const ch=song.songData[channel], column=ch.p[pattern];
 if(!column||!ch.c[column-1])return [];
 const ns=ch.c[column-1].n;const out=[];
 for(let voice=0;voice<4;voice++){const v=ns[row+voice*32];if(v)out.push(v);}
 return out;
}
function section(p){
 if(p<4)return 0.18;          // Engine starting / tense intro
 if(p<8)return 0.40;          // Anticipation
 if(p<16)return 0.68;         // First impact
 if(p<32)return 0.89;         // Main race beat
 if(p<40)return 0.33;         // Half-time breakdown
 if(p<48)return 0.48;         // Build
 if(p<64)return 1.0;          // Full-throttle chorus
 if(p<68)return 0.85;
 return 0.72;                 // Return towards the menu loop
}
function kick(t,amount){
 const start=Math.round(t*RATE), len=Math.round(.43*RATE);
 let phase=0;
 for(let i=0;i<len;i++){
  const x=i/RATE;
  phase+=2*Math.PI*(46+128*Math.exp(-x*27))/RATE;
  const env=Math.exp(-x*12.7);
  const click=Math.exp(-x*85)*.25*rand();
  const v=(Math.sin(phase)*env+click)*amount;
  add(start+i,v,v*.995);
 }
}
function snare(t,amount){
 const start=Math.round(t*RATE), len=Math.round(.27*RATE);
 let lp=0;
 for(let i=0;i<len;i++){
  const x=i/RATE, white=rand();
  lp=.9*lp+.1*white;
  const bright=(white-lp)*Math.exp(-x*20);
  const body=Math.sin(2*Math.PI*181*x)*Math.exp(-x*24);
  const v=amount*(.67*bright+.28*body);
  add(start+i,v*(1-.045*Math.sin(x*11)),v*(1+.045*Math.sin(x*11)));
 }
}
function hat(t,amount,open=false){
 const start=Math.round(t*RATE), len=Math.round((open?.23:.075)*RATE);
 let lp1=0,lp2=0;
 for(let i=0;i<len;i++){
  const x=i/RATE,n1=rand(),n2=rand();
  lp1=.95*lp1+.05*n1;lp2=.96*lp2+.04*n2;
  const decay=open?13:48;
  const env=Math.exp(-x*decay);
  add(start+i,(n1-lp1)*amount*env,(n2-lp2)*amount*env);
 }
}
function bass(t,note,amount,duration){
 const start=Math.round(t*RATE),len=Math.round(duration*RATE);
 const f=freq(note-12); // + audible upper harmonics, compatible with phone speakers.
 let phase=0;
 for(let i=0;i<len;i++){
  const x=i/RATE;
  const e=Math.min(1,x/.019)*Math.exp(-Math.max(0,x-.09)*4.7);
  phase+=f/RATE;
  const sine=Math.sin(phase*2*Math.PI);
  const harmonic=Math.sin(phase*4*Math.PI);
  const softSaw=(2*(phase%1)-1)*.19;
  const v=amount*e*(.72*sine+.25*harmonic+softSaw);
  add(start+i,v,v);
 }
}
function lead(t,note,amount,duration){
 const start=Math.round(t*RATE),len=Math.round(duration*RATE);
 const f=freq(note);
 let phase=0,phase2=0;
 for(let i=0;i<len;i++){
  const x=i/RATE;
  const env=Math.min(1,x/.025)*
   Math.min(1,(duration-x)/.085)*Math.exp(-Math.max(0,x-.12)*.86);
  phase+=f/RATE;phase2+=f*1.0039/RATE;
  const saw=2*(phase%1)-1, detuned=2*(phase2%1)-1;
  const shimmer=Math.sin(phase*Math.PI*4)*.14;
  const v=amount*Math.max(0,env);
  add(start+i,v*(.47*saw+.32*detuned+shimmer),
     v*(.30*saw+.47*detuned+shimmer));
 }
}
function impact(t,amount){
 const start=Math.round(t*RATE), len=Math.round(1.15*RATE);
 let phase=0,lp=0;
 for(let i=0;i<len;i++){
  const x=i/RATE;
  phase+=2*Math.PI*(38+90*Math.exp(-x*20))/RATE;
  const white=rand();lp=.86*lp+.14*white;
  const sub=Math.sin(phase)*Math.exp(-x*5.4)*amount*.75;
  const hiss=(white-lp)*Math.exp(-x*3.0)*amount*.36;
  add(start+i,sub+hiss,sub-hiss*.72);
 }
}
function riser(t,amount){
 const len=Math.round(2.5*RATE),end=Math.round(t*RATE);
 let lp1=0,lp2=0;
 for(let i=0;i<len;i++){
  const u=i/len,j=end-len+i;
  if(j<0||j>=N)continue;
  const left=rand(),right=rand();
  const a=.04+.3*u;
  lp1=lp1*(1-a)+left*a;lp2=lp2*(1-a)+right*a;
  const env=Math.pow(u,1.7)*Math.min(1,(1-u)*100)*amount;
  add(j,(left-lp1)*env,(right-lp2)*env);
 }
}
// Scene-specific, audible new rhythmic arrangement. 
for(let p=0;p<=song.endPattern;p++){
 const intensity=section(p),base=p*PATTERN;
 for(let b=0;b<8;b++){
  const t=base+b*BEAT;
  const normal=(p>=8&&p<32)||(p>=48);
  const breakdown=p>=32&&p<48;
  const shouldKick=normal || (breakdown?b%4===0:b%2===0);
  if(shouldKick)kick(t,(normal?.49:.27)*intensity+.025);
  if(b%4===1||b%4===3){
   if(normal||b%4===3)snare(t+.002,(normal?.34:.16)*intensity);
  }
  if(p>=4){
   // Fast eighth-note hats; chorus includes an additional open hi-hat offbeat.
   hat(t,intensity*.090);
   hat(t+BEAT*.5,intensity*(normal?.108:.061),normal&&(p>=48)&&b%2===1);
  }else if(b%2===0){
   hat(t+BEAT*.5,intensity*.105);
  }
  if(p>=16 && p<32 || p>=48&&p<68){
   // Uptempo sixteenth accents on every second beat
   if(b%2===1)hat(t+BEAT*.75,intensity*.078);
  }
 }
 // Sub bassline extracted from actual SoundBox bass-pattern notes, not a
 // fabricated chord progression. Predominantly present in full race sections.
 if((p>=8&&p<32)||(p>=48)){
  for(let row=0;row<32;row++){
   const ns=notesFor(9,p,row).filter(n=>n>=110&&n<=124);
   if(!ns.length)continue;
   // Emphasize syncopated source notes; quieter in half-time sections.
   for(const n of ns.slice(0,1))bass(base+row*ROW_TIME,n,
    intensity*(row%4===1?.25:.15),Math.min(.28,ROW_TIME*2.4));
  }
 }
 // Clear, deliberately different lead synth line derived from the source
 // melody's actual notes, never guessed harmonies.
 if(p>=8&&p<32 || p>=48){
  for(let row=0;row<32;row++){
   const ns=notesFor(22,p,row).filter(n=>n>=130&&n<=165);
   // 16th-note melodic hook in the chorus, syncopated in first verse.
   if(!ns.length||((p<48)&&(row%2!==0)))continue;
   lead(base+row*ROW_TIME,ns[0],intensity*(p>=48?.16:.095), 
     p>=48?.185:.24);
  }
 }
 // Rarely occurring sustained chord hits from the original song.
 if((p>=24&&p<32)||(p>=48&&p<64)){
  for(const row of [0,16]){
   const chord=notesFor(23,p,row).filter(n=>n>=128&&n<=163);
   for(const n of chord.slice(0,3)){
    lead(base+row*ROW_TIME,n,(p>=48?.11:.06),.72);
   }
  }
 }
}
for(const p of [0,8,16,24,32,40,48,56,64]){
 impact(p*PATTERN,p===48?.40:.27);
 if(p>0)riser(p*PATTERN,p===48?.12:.07);
}
const raw=Buffer.alloc(44+N*4);
raw.write('RIFF',0);raw.writeUInt32LE(36+N*4,4);raw.write('WAVE',8);
raw.write('fmt ',12);raw.writeUInt32LE(16,16);
raw.writeUInt16LE(1,20);raw.writeUInt16LE(2,22);
raw.writeUInt32LE(RATE,24);raw.writeUInt32LE(RATE*4,28);
raw.writeUInt16LE(4,32);raw.writeUInt16LE(16,34);
raw.write('data',36);raw.writeUInt32LE(N*4,40);
let peak=0,energy=0;
for(let i=0;i<N;i++){
 // Saturate only out-of-range event sums; limiter processes final MP3 mix.
 const a=Math.max(-1,Math.min(1,L[i])),b=Math.max(-1,Math.min(1,R[i]));
 raw.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(a*32767))),44+i*4);
 raw.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(b*32767))),46+i*4);
 peak=Math.max(peak,Math.abs(a),Math.abs(b));
 energy+=a*a+b*b;
}
const tmp=path.join(os.tmpdir(),'apex-race-remix-v3-stem.wav');
fs.writeFileSync(tmp,raw);
console.log('Race remix stem generated:',N,'frames',DURATION.toFixed(3)+'s',
 'peak',peak.toFixed(3),'RMS',Math.sqrt(energy/(N*2)).toFixed(4));
function run(cmd,args){
 const r=spawnSync(cmd,args,{encoding:'utf8',timeout:10*60*1000});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error(cmd+' exited '+r.status+' '+(r.stderr||'').slice(-2500));
 if(r.stdout)console.log(r.stdout.slice(-2500));
}
try{
 // The old track becomes a backing track; significant new drums and
 // synthesizer notes distinguish this from the barely altered V2.
 const chain='[0:a]volume=0.79[original];[1:a]volume=1.00[stems];'+
  '[original][stems]amix=inputs=2:duration=first:normalize=0,'+
  'acompressor=threshold=0.50:ratio=2:attack=9:release=170,'+
  'alimiter=limit=0.91:attack=5:release=100,'+
  'loudnorm=I=-14:TP=-1.5:LRA=9[out]';
 run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',src,'-i',tmp,
  '-filter_complex',chain,'-map','[out]',
  '-ar','44100','-ac','2','-codec:a','libmp3lame','-b:a','160k',
  '-metadata','title=APEX 26 - Race Remix V3',
  '-metadata','comment=Arrangement based on the original SoundBox composition',
  dst]);
 const stat=fs.statSync(dst);
 if(stat.size<2_000_000)throw Error('Rendered remix is unexpectedly small');
 run('ffprobe',['-v','error','-show_entries','format=duration,size','-of',
  'default=noprint_wrappers=1',dst]);
 console.log('Completed APEX V3 MP3',stat.size,'bytes; original left unchanged');
}finally{fs.rmSync(tmp,{force:true});}
