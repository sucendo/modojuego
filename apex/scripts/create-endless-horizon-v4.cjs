#!/usr/bin/env node
/* APEX Formula 26 — Endless Horizon V4, long seamless-loop soundtrack preview.
 * Original melody and soundbed: the user's SoundBox APEX song (unmodified).
 * New arrangement: original piano hook, warm pads, trance rhythm and bass.
 * This OFFLINE script never runs in the game/browser.
 */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const musicDir=path.join(root,'assets/music');
const source=path.join(musicDir,'apex-theme.mp3');
const destination=path.join(musicDir,'apex-theme-v4-endless-horizon.mp3');
const soundbox=path.join(root,'assets/soundbox/apex-song01.js');
const srcText=fs.readFileSync(soundbox,'utf8');
const rowLen=Number(srcText.match(/\browLen:\s*(\d+)/)?.[1]);
const patternLen=Number(srcText.match(/\bpatternLen:\s*(\d+)/)?.[1]);
const endPattern=Number(srcText.match(/\bendPattern:\s*(\d+)/)?.[1]);
if(rowLen!==4828||patternLen!==32||endPattern!==71)
 throw Error('Unexpected SoundBox structure: refusing out-of-sync mix');
const RATE=44100, FRAME=rowLen*patternLen;
const ORIGINAL=(endPattern+1)*FRAME;
const OVERLAP=2*FRAME; // 2 patterns = 16 beats, so the join stays on the beat.
const PERIOD=ORIGINAL-OVERLAP; // a seamless 70-pattern musical cycle
const CYCLES=2, FRAMES=PERIOD*CYCLES, TOTAL_PATTERNS=70*CYCLES;
const BEAT=4*rowLen/RATE, SEC_PER_PATTERN=FRAME/RATE;
const now=Date.now();
function run(command,args){
 const r=spawnSync(command,args,{encoding:'utf8',timeout:12*60*1000,maxBuffer:4*1024*1024});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error(command+' exited '+r.status+'\n'+String(r.stderr).slice(-2500));
 return r.stdout||'';
}
if(!fs.existsSync(source))throw Error('Missing official audio source: '+source);
const raw=path.join(os.tmpdir(),'apex-endless-source-'+process.pid+'.f32le');
const wav=path.join(os.tmpdir(),'apex-endless-master-'+process.pid+'.wav');
const a=new Float32Array(FRAMES),b=new Float32Array(FRAMES);
const TWO_PI=2*Math.PI;
const clamp=(v,low,hi)=>Math.min(hi,Math.max(low,v));
let rng=0x26f18ee;
function noise(){
 rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;
 return ((rng>>>0)/0x80000000)-1;
}
function midi(n){return 440*Math.pow(2,(n-69)/12);}
function add(frame,l,r){if(frame>=0&&frame<FRAMES){a[frame]+=l;b[frame]+=r;}}
function envelope(position,attack,release,end){
 return Math.min(1,position/attack)*Math.min(1,Math.max(0,end-position)/release);
}
function piano(t,n,level,length=.87,pan=0){
 const first=Math.round(t*RATE),count=Math.floor(length*RATE),f=midi(n);
 const phase=0.25+((n%5)*.11);
 let h1=phase,h2=phase*.7;
 for(let i=0;i<count;i++){
  const x=i/RATE;
  const e=Math.min(1,x/.012)*Math.pow(.5,x/1.25)*
     Math.min(1,(length-x)/.055);
  const fundamental=Math.sin(TWO_PI*f*x+h1);
  const overtone=.45*Math.sin(TWO_PI*f*2*x+h2)*Math.exp(-x*2.0)+
                 .19*Math.sin(TWO_PI*f*3*x)*Math.exp(-x*6.1)+
                 .08*Math.sin(TWO_PI*f*4*x)*Math.exp(-x*10);
  const mallet=.15*Math.sin(TWO_PI*f*5.02*x)*Math.exp(-x*21);
  const body=e*(.66*fundamental+overtone+mallet)*level;
  // Slightly different delayed detune in L/R, no excessive chorus.
  const stereo=.026*Math.sin(TWO_PI*f*1.004*x)*Math.exp(-x*3)*level*e;
  add(first+i,body*(1-.16*pan)+stereo,body*(1+.16*pan)-stereo);
 }
}
function pad(t,chord,level,length){
 const first=Math.round(t*RATE),count=Math.floor(length*RATE);
 chord.forEach((n,voice)=>{
  const f=midi(n),amp=level/(2.7+voice*.35);
  for(let i=0;i<count;i++){
   const x=i/RATE,e=envelope(x,.84,.74,length);
   const slow=1+.07*Math.sin(TWO_PI*(.11+voice*.021)*x);
   const v=amp*e*slow*(.70*Math.sin(TWO_PI*f*x)+
     .19*Math.sin(TWO_PI*2.004*f*x)+.11*Math.sin(TWO_PI*3.003*f*x));
   const pan=(voice%2?1:-1)*.09;
   add(first+i,v*(1+pan),v*(1-pan));
  }
 });
}
function kick(t,level){
 const first=Math.round(t*RATE),count=Math.floor(.36*RATE);
 let phi=0;
 for(let i=0;i<count;i++){
  const x=i/RATE;phi+=TWO_PI*(45+121*Math.exp(-x*25))/RATE;
  const v=level*(Math.sin(phi)*Math.exp(-x*15.5)+
    noise()*.11*Math.exp(-x*98));
  add(first+i,v,v);
 }
}
function snare(t,level){
 const first=Math.round(t*RATE),count=Math.floor(.18*RATE);
 let lo=0;
 for(let i=0;i<count;i++){
  const x=i/RATE,n=noise();lo=.8*lo+.2*n;
  const v=level*(.71*(n-lo)*Math.exp(-x*25)+
                 .18*Math.sin(TWO_PI*183*x)*Math.exp(-x*28));
  add(first+i,v*.94,v*1.06);
 }
}
function hat(t,level,open=false){
 const first=Math.round(t*RATE),count=Math.floor((open?.22:.065)*RATE);
 let lo=0;
 for(let i=0;i<count;i++){
  const x=i/RATE,n=noise();lo=.91*lo+.09*n;
  const v=level*(n-lo)*Math.exp(-x*(open?15:57));
  add(first+i,v*(1+.15*Math.sin(x*80)),v*(1-.15*Math.sin(x*80)));
 }
}
function bass(t,n,level,len=.31){
 const first=Math.round(t*RATE),count=Math.floor(len*RATE),f=midi(n);
 let ph=0;
 for(let i=0;i<count;i++){
  const x=i/RATE;ph+=TWO_PI*f/RATE;
  const e=Math.min(1,x/.015)*Math.exp(-Math.max(0,x-.08)*5.1);
  const v=level*e*(.68*Math.sin(ph)+.25*Math.sin(2*ph)+
                   .12*Math.sin(3*ph));
  add(first+i,v,v);
 }
}
function sweep(t,level,rise=true){
 const first=Math.round(t*RATE),len=Math.floor(1.5*RATE);
 let low=0;
 for(let i=0;i<len;i++){
  const x=i/RATE,u=x/1.5;
  const n=noise(),alpha=rise?.04+.36*u:.38-.33*u;
  low=low*(1-alpha)+n*alpha;
  const e=rise?Math.pow(u,1.6)*Math.min(1,(1-u)*24):
    (1-u)*(1-u);
  const v=level*(n-low)*e;
  add(first+i,v,-v*.77);
 }
}
// The piano theme is deliberately new; it is not Robert Miles' melody.
const chords=[
 {root:36,tones:[48,55,60,63,67],lead:[72,75,79,80,77,67]},   // Cm
 {root:32,tones:[44,51,56,60,63],lead:[68,72,75,79,77,63]},   // Ab
 {root:39,tones:[51,58,63,67,70],lead:[67,70,75,77,79,63]},   // Eb
 {root:34,tones:[46,53,58,62,65],lead:[70,74,77,75,72,65]}    // Bb
];
// Original, 16-beat call-and-answer piano line. Relative indexes into
// the current chord's six-note palette, with intentional rests.
const hook=[
 [0,0,1.45],[2,1,.72],[3.5,2,1.0],[5,1,.75],
 [6,3,1.68],[8,2,1.40],[10.5,4,.70],[12,1,1.1],
 [14,0,1.18],[15.4,5,.38]
];
const answer=[
 [0,2,1.35],[2,1,.88],[4,0,1.3],[6,4,.85],
 [7,3,.57],[8,2,1.2],[10,1,1.06],[12,5,.86],[14,0,1.48]
];
function gainForPhrase(p){
 const local=p%70,pass=Math.floor(p/70);
 let g;
 if(local<4)g=.27;
 else if(local<8)g=.48;
 else if(local<24)g=.77;
 else if(local<38)g=1.03;
 else if(local<48)g=.37; // Breakdown, piano and atmosphere.
 else if(local<64)g=1.15;
 else g=.69;
 // Begin and end of the entire 8-minute song have a gentle musical bridge.
 // The original synchronized SoundBox bed NEVER fades to silence.
 const seamFade=Math.min(1,p/2.6,(TOTAL_PATTERNS-p)/2.6);
 return Math.max(0,g*(pass?.98:1)*clamp(seamFade,0,1));
}
try{
 run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,
  '-map','0:a:0','-ar',String(RATE),'-ac','2',
  '-c:a','pcm_f32le','-f','f32le',raw]);
 const bytes=fs.readFileSync(raw);
 const decodedFrames=bytes.length/8;
 if(decodedFrames<ORIGINAL)throw Error(
   'Short MP3 decode ('+decodedFrames+' instead of '+ORIGINAL+')');
 const data=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
 // A 70-pattern circular waveform. The 2-pattern end of the original song
 // is blended into its 2-pattern beginning; beat position stays exact.
 // F(0)=source[PERIOD] and F(PERIOD-1)=source[PERIOD-1].
 // This guarantees sample-continuous source audio at EVERY repeat seam.
 for(let i=0;i<FRAMES;i++){
  const j=i%PERIOD,off=j*2;
  let l,r;
  if(j<OVERLAP){
   const theta=Math.PI*.5*j/OVERLAP;
   const tail=(PERIOD+j)*2;
   l=Math.cos(theta)*data[tail]+Math.sin(theta)*data[off];
   r=Math.cos(theta)*data[tail+1]+Math.sin(theta)*data[off+1];
  }else {l=data[off];r=data[off+1];}
  a[i]=l*.64;b[i]=r*.64;
 }
 console.log('Original synchronized bed:',decodedFrames,'source frames',
   '· seamless period', (PERIOD/RATE).toFixed(3),'s',
   '· final duration',(FRAMES/RATE).toFixed(3),'s');

 // New harmonic arrangement follows the APEX source's C-Eb-G-Ab arpeggio.
 // 2 patterns (16 beats) per new harmonic phrase.
 for(let p=0;p<TOTAL_PATTERNS;p+=2){
  const idx=Math.floor(p/2)%chords.length,c=chords[idx];
  const t=p*SEC_PER_PATTERN,level=gainForPhrase(p);
  pad(t,c.tones,level*.090,SEC_PER_PATTERN*2-.1);
  const firstPass=p<70;
  const phrase=firstPass
   ?(Math.floor(p/2)%2===0?hook:answer)
   :(Math.floor(p/2)%2===0?answer:hook);
  for(const [beat,note,duration] of phrase){
   if(level<.16 && beat>8)continue;
   const octaveLift=!firstPass&&p%8===4&&note===4?12:0;
   piano(t+beat*BEAT,c.lead[note]+octaveLift,
     level*(firstPass?.20:.23),duration*BEAT,((idx%2)*2-1)*.32);
  }
  // Wider, more emotional long notes behind the hook at section peaks.
  if(level>.80){
   piano(t+8*BEAT,c.tones[4]+12,level*.08,BEAT*4,.36);
  }
 }
 // Rhythmic drive, less aggressive than V3 and balanced for menu playback.
 for(let p=0;p<TOTAL_PATTERNS;p++){
  const idx=Math.floor(p/2)%chords.length,c=chords[idx];
  const loc=p%70,gain=gainForPhrase(p);
  const full=(loc>=8&&loc<38)||(loc>=48&&loc<66);
  const breakdown=(loc>=38&&loc<48);
  for(let beat=0;beat<8;beat++){
   const t=(p*8+beat)*BEAT;
   if(full || beat%2===0)kick(t,gain*(full?.24:.12));
   if(beat%4===1||beat%4===3){
    if(!breakdown||beat%4===3)snare(t+0.004,gain*(full?.15:.09));
   }
   if(loc>=4){
    hat(t,gain*.053);
    hat(t+BEAT*.5,gain*(full?.071:.038),full&&beat%4===3);
   }
   if(full && beat%2===0){
    bass(t,c.root,gain*.12,BEAT*.75);
    bass(t+BEAT*.75,c.root+12,gain*.047,BEAT*.25);
   }
   if(loc>=48&&loc<64&&beat%2===1){
    hat(t+BEAT*.75,gain*.043);
   }
  }
 }
 for(const point of [8,24,38,48,70,78,94,108,118,136]){
  sweep(point*SEC_PER_PATTERN-1.50,.041,true);
 }
 // Master: protective sample scaling before the final FFmpeg limiter.
 let peak=0;
 for(let i=0;i<FRAMES;i++)peak=Math.max(peak,Math.abs(a[i]),Math.abs(b[i]));
 const scale=peak>.92?.89/peak:1;
 const fd=fs.openSync(wav,'w');
 try{
  const h=Buffer.alloc(44),dataBytes=FRAMES*4;
  h.write('RIFF',0);h.writeUInt32LE(36+dataBytes,4);h.write('WAVE',8);
  h.write('fmt ',12);h.writeUInt32LE(16,16);
  h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);
  h.writeUInt32LE(RATE,24);h.writeUInt32LE(RATE*4,28);
  h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);
  h.write('data',36);h.writeUInt32LE(dataBytes,40);
  fs.writeSync(fd,h);
  const batch=16384,chunk=Buffer.allocUnsafe(batch*4);
  for(let start=0;start<FRAMES;start+=batch){
   const count=Math.min(batch,FRAMES-start);
   for(let j=0;j<count;j++){
    chunk.writeInt16LE(Math.round(clamp(a[start+j]*scale,-1,1)*32767),j*4);
    chunk.writeInt16LE(Math.round(clamp(b[start+j]*scale,-1,1)*32767),j*4+2);
   }
   fs.writeSync(fd,chunk,0,count*4);
  }
 }finally{fs.closeSync(fd);}
 const startDiff=Math.max(Math.abs(a[0]-a[FRAMES-1]),
                           Math.abs(b[0]-b[FRAMES-1]))*scale;
 console.log('Sample-boundary jump',startDiff.toFixed(7),'· peak',peak.toFixed(5));
 if(startDiff>.065)throw Error('Loop has an unexpected sample jump at boundary');
 // The MP3 encoder emits LAME/Xing gapless metadata. Browser decoders which
 // honor encoder delay/padding can replay this file without a silence gap.
 run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',wav,
  '-af','alimiter=limit=0.94:attack=5:release=90',
  '-c:a','libmp3lame','-q:a','3','-ar','44100','-ac','2',
  '-write_xing','1',
  '-metadata','title=APEX Formula 26 - Endless Horizon',
  '-metadata','comment=Original APEX SoundBox theme with new piano and loop-safe arrangement',
  destination]);
 const probe=JSON.parse(run('ffprobe',['-v','error','-show_format','-of',
  'json',destination]));
 const duration=Number(probe.format.duration);
 if(duration<489||duration>492 || fs.statSync(destination).size<4_000_000)
  throw Error('Unexpected remix length or size: '+duration);
 console.log('APEX V4 DONE',duration,'seconds; MP3 bytes',
    fs.statSync(destination).size,'· original production audio unchanged');
}finally{
 fs.rmSync(raw,{force:true});fs.rmSync(wav,{force:true});
}
