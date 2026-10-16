'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data='hexategos-pruebas/game/data/geo-asia-completion-0416.js',
 color='hexategos-pruebas/game/data/geo-asia-completion-landcover-0416.js',
 graph='hexategos-atlas/atlas-asia-completion-graph-0416.js',
 painter='hexategos-atlas/atlas-asia-completion-routes-0416.js',
 water='hexategos-atlas/atlas-asia-completion-water-0416.js';
function dataset(){
 const st={window:{}};vm.runInNewContext(read(data),st);
 return st.window.HexategosAsiaCompletion0416;
}
test('0.41.6: seis regiones, relieve, ríos, lagos y referencias sin duplicados canónicos',()=>{
 const d=dataset();
 assert.equal(d.version,'0.41.6');
 assert.equal(d.zones.length,6);
 assert.equal(d.features.length,60);
 assert.equal(d.features.filter(x=>x.kind==='river').length,27);
 assert.equal(d.features.filter(x=>x.kind==='mountain').length,33);
 assert.equal(d.regions.length,49);
 assert.equal(d.lakes.length,6);
 assert.equal(new Set(d.features.map(x=>x.name)).size,d.features.length);
 for(const f of d.features){
  assert.ok(d.zones.some(z=>z.id===f.region),f.name);
  assert.ok(f.points.length>=2,f.name);
  assert.ok(!d.protectedNames.rivers.includes(f.name),f.name);
  assert.ok(!d.protectedNames.mountains.includes(f.name),f.name);
 }
 for(const [lon,lat,name] of [[107.1,53.45,'Lago Baikal'],
  [100.15,36.9,'Lago Qinghai'],[136.1,35.2,'Lago Biwa'],
  [98.9,2.63,'Lago Toba']]){
  assert.equal(d.bodyAt(lon,lat)?.name,name);
 }
 assert.ok(d.regionsNear(109.5,36).some(x=>x.name==='Meseta de Loess'));
 assert.ok(d.regionsNear(114.6,1.2).some(x=>x.name==='Tierras altas de Borneo'));
});
test('0.41.6: continuidad visual de taiga, Gobi, arrozales y selva ecuatorial',()=>{
 const d=dataset(),st={window:{HexategosAsiaCompletion0416:d}};
 vm.runInNewContext(read(color),st);
 const m=st.window.HexategosAsiaCompletionLandcover0416;
 const siberia=m.evaluate(64,106),gobi=m.evaluate(43,105),
  yangtze=m.evaluate(29.5,115),borneo=m.evaluate(0,114.5),
  malay=m.evaluate(3.5,102.5);
 assert.ok(siberia?.boreal>.35);
 assert.ok(gobi.arid>.65);
 assert.ok(yangtze.cultivated>.65);
 assert.ok(borneo.tropic>.7);
 assert.ok(malay.tropic>.5);
 assert.equal(m.evaluate(42,-4),null);
 for(const [lat,lon] of [[44,115],[36,112],[60,114],
  [42.5,139],[-2,114.5],[13.3,121.9]]){
  const a=m.evaluate(lat,lon),b=m.evaluate(lat,lon+.11);
  assert.ok(a&&b);
  assert.ok(Math.max(...a.color.map((x,i)=>Math.abs(x-b.color[i])))<42);
 }
 const v=(lat,lon)=>{
  const a=lat*Math.PI/180,b=lon*Math.PI/180;
  return [Math.round(Math.cos(a)*Math.sin(b)*32767),
   Math.round(Math.sin(a)*32767),
   Math.round(Math.cos(a)*Math.cos(b)*32767)];
 };
 const L={n:3,centers:new Int16Array([...v(60,120),...v(12,123),...v(36,105)]),
  land:new Int16Array([1,-1,1])};
 const old=[...L.land];
 for(let i=0;i<L.n;i++){
  const a=m.rgbForCell('8',i,L,[142,141,120]),b=m.rgbForCell('8',i,L,[142,141,120]);
  assert.deepEqual(a,b);
 }
 assert.deepEqual([...L.land],old);
 assert.ok(m.cachedCells()<=2);
});
test('0.41.6: Atlas y dos juegos importan los mismos módulos y mantienen malla/guardados',()=>{
 const files=['geo-asia-completion-0416.js','geo-asia-completion-landcover-0416.js',
 'atlas-asia-completion-graph-0416.js','atlas-asia-completion-routes-0416.js',
 'atlas-asia-completion-water-0416.js'];
 for(const file of ['hexategos-atlas/index.html','hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html']){
  const html=read(file);
  for(const module of files)assert.ok(html.includes(module),file+' '+module);
  assert.ok(html.indexOf(files[0])<html.indexOf(files[2]));
  assert.ok(html.indexOf(files[2])<html.indexOf(files[3]));
  assert.ok(html.indexOf(files[3])<html.indexOf('atlas-regions-0390.js'));
  assert.ok(html.indexOf(files[4])>html.indexOf('atlas-regions-0390.js'));
 }
 for(const dir of ['game','toponimos-game']){
  const bridge=read('hexategos-pruebas/'+dir+'/js/atlas-bridge-0400.js');
  const integ=read('hexategos-pruebas/'+dir+'/js/atlas-integration-0400.js');
  assert.ok(bridge.includes('visibleAsiaRemaining'));
  assert.ok(integ.includes('remainingEco.rgbForCell'));
 }
 const atlas=read('hexategos-atlas/atlas-landcover-0391.js'),
  region=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(atlas.includes('remainingEco.rgbForCell'));
 assert.ok(region.includes('otherAsiaRender?.isDrawnFeature'));
 assert.ok(region.includes('otherAsiaLake'));
 for(const file of [data,color,graph,painter,water]){
  const s=read(file);new vm.Script(s,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(s),file);
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(s),file);
  assert.ok(!/localStorage\.setItem|indexedDB|saveGame\s*\(/.test(s),file);
 }
});
