'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(repo,p),'utf8');
const dataFile='hexategos-pruebas/game/data/geo-indian-deltas-0408.js';
const coverFile='hexategos-pruebas/game/data/geo-indian-delta-landcover-0408.js';
const painter='hexategos-atlas/atlas-indian-deltas-0408.js';
function context(){
 const box={window:{}};vm.runInNewContext(read(dataFile),box);
 return box.window.HexategosIndianDeltas0408;
}
test('0.40.8 · cuatro confluencias y dos deltas sin duplicados',()=>{
 const d=context();
 assert.equal(d.version,'0.40.8');
 assert.equal(Object.keys(d.corrections).length,4);
 assert.equal(d.channels.length,8);
 assert.equal(d.areas.length,5);
 assert.equal(new Set(d.channels.map(x=>x.name)).size,8);
 assert.ok(d.channels.every(x=>['Indo','Ganges','Brahmaputra'].includes(x.parent)));
 assert.ok(d.channels.every(x=>x.join.length===2&&x.mouth.length===2));
 assert.ok(d.regionsNear(67.8,24.1).some(x=>x.name==='Delta del Indo'));
 assert.ok(d.regionsNear(89.3,22.05).some(x=>x.name==='Sundarbans'));
});
test('0.40.8 · color húmedo continuo y caché dispersa de L8',()=>{
 const ctx={window:{HexategosIndianDeltas0408:context()}};
 vm.runInNewContext(read(coverFile),ctx);
 const landcover=ctx.window.HexategosIndianDeltaLandcover0408;
 assert.ok(landcover.evaluate(24,67.7)?.weight>.5);
 assert.ok(landcover.evaluate(22.2,89.3)?.weight>.5);
 assert.equal(landcover.evaluate(43,70),null);
 const points=[[24,67.7],[22.2,89.3],[21.9,89.3],[35,75]];
 const centers=points.flatMap(([lat,lon])=>{
  const x=lon*Math.PI/180,y=lat*Math.PI/180;
  return [Math.round(Math.cos(y)*Math.sin(x)*32767),
   Math.round(Math.sin(y)*32767),
   Math.round(Math.cos(y)*Math.cos(x)*32767)];
 });
 const L={n:4,land:new Int16Array([1,1,-1,1]),
  centers:new Int16Array(centers)};
 const old=Array.from(L.land),base=[133,147,116];
 for(let i=0;i<4;i++){
  const a=landcover.rgbForCell('8',i,L,base),
   b=landcover.rgbForCell('8',i,L,base);
  assert.deepEqual(a,b);
 }
 assert.deepEqual(Array.from(L.land),old);
 assert.ok(landcover.cachedCells()<=2,'Caché innecesariamente global');
 for(const [lat,lon] of [[23.9,67.7],[24.5,68.5],[22.4,89.5],[23.8,90.4]]){
  const a=landcover.evaluate(lat,lon),b=landcover.evaluate(lat,lon+.10);
  if(!a||!b)continue;
  assert.ok(Math.max(...a.color.map((v,i)=>Math.abs(v-b.color[i])))<36);
 }
});
test('0.40.8 · carga idéntica en Atlas y las dos versiones jugables',()=>{
 const pages=['hexategos-atlas/index.html',
  'hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html'];
 const scripts=['geo-indian-deltas-0408.js','geo-indian-delta-landcover-0408.js',
  'atlas-indian-deltas-0408.js'];
 for(const file of pages){
  const html=read(file);
  for(const m of scripts)assert.ok(html.includes(m),file+' sin '+m);
  assert.ok(html.indexOf(scripts[0])<html.indexOf('atlas-indian-rivers-0407.js'));
  assert.ok(html.indexOf(scripts[1])<html.indexOf('atlas-landcover-0391.js')||
   !file.startsWith('hexategos-atlas/')&&
   html.indexOf(scripts[1])<html.indexOf('atlas-integration-0400.js'));
  assert.ok(html.indexOf('atlas-indian-rivers-0407.js')<html.indexOf(scripts[2]));
  assert.ok(html.indexOf(scripts[2])<html.indexOf('atlas-regions-0390.js'));
 }
 assert.ok(read('hexategos-atlas/atlas-landcover-0391.js').includes('deltas.rgbForCell'));
 for(const n of ['game','toponimos-game']){
  const file='hexategos-pruebas/'+n+'/js/atlas-integration-0400.js';
  assert.ok(read(file).includes('deltaEco.rgbForCell'));
 }
 const regions=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(regions.includes('deltaRoutes?.isDrawnFeature'));
 assert.ok(regions.includes('deltas?.regionsNear'));
});
test('0.40.8 · sin cambio de costas, recursos, propietarios ni guardados',()=>{
 for(const file of [dataFile,coverFile,painter,'hexategos-atlas/atlas-indian-rivers-0407.js']){
  const code=read(file);new vm.Script(code,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(code));
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(code));
  assert.ok(!/localStorage\.setItem|indexedDB|saveGame\s*\(/.test(code));
 }
 assert.ok(read(painter).includes('coastalNodes'));
 assert.ok(read(painter).includes('graph.validate'));
});
