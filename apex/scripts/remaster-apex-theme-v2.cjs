#!/usr/bin/env node
/* APEX Formula 26 · Edición de estudio V2 (SOLO OFFLINE).
 * Nunca se ejecuta desde el navegador ni altera la partitura de SoundBox.
 * Produce dos maquetas comparables: master y cinematic (master + acentos).
 */
'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'assets','music');
const source=path.join(dir,'apex-theme.mp3');
const master=path.join(dir,'apex-theme-v2-master.mp3');
const cinematic=path.join(dir,'apex-theme-v2-cinematic.mp3');
const fxPath=path.join(os.tmpdir(),'apex-v2-accent-stem.wav');
const SAMPLE_RATE=44100;
const ROW_LEN=4828;
const PATTERN_LENGTH=32;
const PATTERNS=72;
const barTime=ROW_LEN*PATTERN_LENGTH/SAMPLE_RATE;
const duration=barTime*PATTERNS;
const BITS=160;
if(!fs.existsSync(source))throw Error('Missing original APEX track: '+source);
function run(cmd,args){
 const r=spawnSync(cmd,args,{stdio:'inherit',maxBuffer:4*1024*1024,timeout:7*60*1000});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error(cmd+' failed with exit '+r.status);
}
const tone=[
 'highpass=f=32',
 'equalizer=f=230:t=q:w=1.0:g=-1.25',
 'equalizer=f=87:t=q:w=0.8:g=0.8',
 'equalizer=f=3350:t=q:w=0.85:g=1.20',
 'highshelf=f=8500:g=0.75',
 'acompressor=threshold=0.17:ratio=1.6:attack=16:release=210:makeup=1.10:knee=2.5'
].join(',');
const finish='alimiter=limit=0.92:attack=5:release=80,loudnorm=I=-15:TP=-1.5:LRA=10';
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,
 '-af',tone+','+finish,
 '-ar','44100','-ac','2','-c:a','libmp3lame','-b:a',BITS+'k',
 '-metadata','title=APEX 26 - Tema principal V2 Master',
 master]);

// Generate an unobtrusive 2-channel transition/impact stem in sample time.
// Musical placements derived from SoundBox's actual 137 BPM/32-row patterns.
// Keep this independent from instruments/notes and preserve the original theme.
const frames=Math.ceil(duration*SAMPLE_RATE);
const wavData=Buffer.alloc(frames*4); // PCM16 2-channel, quiet by default.
let rng=0x6a1c5e;
function noise(){
 rng ^= rng<<13;rng ^= rng>>>17;rng ^= rng<<5;
 return (rng>>>0)/2147483647.5-1;
}
function add(frame,left,right){
 if(frame<0||frame>=frames)return;
 const k=frame*4;
 let l=wavData.readInt16LE(k)+Math.round(left*32767);
 let r=wavData.readInt16LE(k+2)+Math.round(right*32767);
 wavData.writeInt16LE(Math.max(-32768,Math.min(32767,l)),k);
 wavData.writeInt16LE(Math.max(-32768,Math.min(32767,r)),k+2);
}
function hit(phrase, strength){
 const n=Math.round(phrase*barTime*SAMPLE_RATE);
 const len=Math.floor(0.82*SAMPLE_RATE);
 let phase=0,filtered=0;
 for(let j=0;j<len;j++){
  const t=j/SAMPLE_RATE;
  const f=39+76*Math.exp(-t*15);
  phase+=2*Math.PI*f/SAMPLE_RATE;
  const body=Math.sin(phase)*Math.exp(-t*7.2)*strength;
  const white=noise();
  filtered=filtered*0.82+white*0.18;
  const transient=(white-filtered)*Math.exp(-t*42)*strength*0.23;
  const shimmer=white*Math.exp(-t*6.5)*strength*0.06;
  add(n+j,body+transient+shimmer,body+transient-shimmer*0.9);
 }
}
function riser(phrase,strength){
 const end=Math.round(phrase*barTime*SAMPLE_RATE);
 const len=Math.floor(2.40*SAMPLE_RATE);
 let smoothL=0,smoothR=0,prevL=0,prevR=0;
 for(let j=0;j<len;j++){
  const pos=j/len, i=end-len+j;
  const fade=Math.pow(pos,1.55)*Math.min(1,(1-pos)*80);
  const low=0.94-0.78*pos;
  const whiteL=noise(),whiteR=noise();
  smoothL=low*smoothL+(1-low)*whiteL;
  smoothR=low*smoothR+(1-low)*whiteR;
  const airyL=(smoothL-prevL)*strength*fade*0.35;
  const airyR=(smoothR-prevR)*strength*fade*0.35;
  prevL=smoothL;prevR=smoothR;
  add(i,airyL,airyR);
 }
}
for(const [bar,amount] of [
 [8,0.075],[16,0.078],[24,0.062],[32,0.035],
 [48,0.092],[52,0.055],[56,0.045],[64,0.086]
]) {
 riser(bar,amount);
 hit(bar,amount);
}
const header=Buffer.alloc(44), bytes=frames*4;
header.write('RIFF',0);header.writeUInt32LE(bytes+36,4);header.write('WAVE',8);
header.write('fmt ',12);header.writeUInt32LE(16,16);
header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);
header.writeUInt32LE(SAMPLE_RATE,24);
header.writeUInt32LE(SAMPLE_RATE*4,28);
header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);
header.write('data',36);header.writeUInt32LE(bytes,40);
fs.writeFileSync(fxPath,Buffer.concat([header,wavData]));
try {
 const mix='[0:a]'+tone+'[bed];[1:a]volume=0.82[accent];'+
  '[bed][accent]amix=inputs=2:duration=first:normalize=0,'+finish+'[out]';
 run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,'-i',fxPath,
  '-filter_complex',mix,'-map','[out]',
  '-ar','44100','-ac','2','-c:a','libmp3lame','-b:a',BITS+'k',
  '-metadata','title=APEX 26 - Tema principal V2 Cinematic',
  cinematic]);
}finally{fs.rmSync(fxPath,{force:true});}
for(const file of [master,cinematic]){
 if(fs.statSync(file).size<1_000_000)throw Error('Unexpectedly small output '+file);
 run('ffprobe',['-v','error','-show_entries','format=duration,size',
  '-of','default=noprint_wrappers=1',file]);
}
console.log('APEX V2 produced two non-destructive preview files; original untouched.');
