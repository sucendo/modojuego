#!/usr/bin/env node
/* APEX 26 — Render OFFLINE de la composición SoundBox del usuario.
 * Player de SoundBox original (zlib/libpng); se conserva su aviso de licencia.
 * No ejecutar este generador durante el juego: sintetizar 252s / 42 pistas
 * puede saturar el hilo principal y los dispositivos móviles.
 */
'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const songPath=path.join(root,'assets/soundbox/apex-song01.js');
const playerPath=path.join(root,'vendor/soundbox-player-small.js');
const destination=path.resolve(process.argv[2]||path.join(os.tmpdir(),'apex-song01.wav'));
const dataCtx=vm.createContext(Object.create(null));
vm.runInContext(fs.readFileSync(songPath,'utf8'),dataCtx,{filename:songPath,timeout:5000});
const input=dataCtx.song;
assert.ok(input&&Array.isArray(input.songData),'SoundBox: archivo original sin songData');
assert.equal(input.numChannels,input.songData.length,'SoundBox: número de canales original');
assert.equal(input.rowLen,4828,'SoundBox: rowLen original');
assert.equal(input.patternLen,32,'SoundBox: patrón original');
assert.equal(input.endPattern,71,'SoundBox: final original');
const active=input.songData.filter(channel=>channel.p.some(
 pattern=>pattern>0&&channel.c[pattern-1]&&channel.c[pattern-1].n.some(Number)
));
assert.ok(active.length>=20,'No se pueden perder pistas de la composición');
const synthCtx=vm.createContext({Math,Int32Array,Uint8Array,Float32Array,Float64Array});
vm.runInContext(fs.readFileSync(playerPath,'utf8'),synthCtx,{filename:playerPath,timeout:5000});
assert.equal(typeof synthCtx.CPlayer,'function','SoundBox: sintetizador original');
const player=new synthCtx.CPlayer();
player.init({...input,songData:active,numChannels:active.length});
for(let i=0;i<active.length;i++){
 const progress=player.generate();
 process.stdout.write('SoundBox '+(i+1)+'/'+active.length+'\r');
 assert.ok(progress>0,'SoundBox: progreso de generación');
}
const wave=player.createWave();
assert.equal(String.fromCharCode(...wave.slice(0,4)),'RIFF');
assert.equal(String.fromCharCode(...wave.slice(8,12)),'WAVE');
const expectedLength=input.rowLen*input.patternLen*(input.endPattern+1)/44100;
assert.ok(expectedLength>250&&expectedLength<255,'Duración del original debe conservarse');
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,Buffer.from(wave.buffer,wave.byteOffset,wave.byteLength));
console.log('\nSoundBox render completo:',active.length,'pistas audibles de',input.numChannels,
 '· duración',expectedLength.toFixed(2),'s · salida',destination);
