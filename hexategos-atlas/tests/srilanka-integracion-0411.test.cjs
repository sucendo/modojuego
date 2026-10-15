'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data='hexategos-pruebas/game/data/geo-sri-lanka-physical-0411.js',
 landcover='hexategos-pruebas/game/data/geo-sri-lanka-landcover-0411.js',
 water='hexategos-atlas/atlas-sri-lanka-shallows-0411.js';
function dataset(){const ctx={window:{}};vm.runInNewContext(read(data),ctx);return ctx.window.HexategosSriLankaPhysical0411}
test('0.41.1 · relieve, regiones, archipiélagos y estrechos sin crear tierra',()=>{
 const d=dataset();
 assert.equal(d.version,'0.41.1');
 assert.equal(d.mountains.length,6);
 assert.equal(d.regions.length,9);
 assert.equal(d.peaks.length,2);
 assert.equal(d.marine.length,5);
 assert.equal(d.islands.length,5);
 assert.equal(d.shoals.length,3);
 const all=[...d.mountains,...d.regions,...d.peaks,...d.marine,...d.islands];
 assert.equal(new Set(all.map(x=>x.name.toLocaleLowerCase('es-ES'))).size,all.length);
 assert.ok(d.regionsNear(80.67,7.07).some(x=>x.name.includes('Tierras Altas')));
 assert.equal(d.bodyAt(79.54,9.1),null);
 assert.ok(d.marine.some(x=>x.name.includes('Palk')));
});
test('0.41.1 · tintado marino exclusivamente en celdas de agua y cobertura sin cambio de L.land',()=>{
 const ctx={window:{HexategosSriLankaPhysical0411:dataset()},
  terrainStrategicFill3247:()=> 'rgb(65,109,157)',mapMode3252:'terrain'};
 vm.runInNewContext(read(landcover),ctx);
 vm.runInNewContext(read(water),ctx);
 const wet=ctx.window.HexategosSriLankaLandcover0411,
  sea=ctx.window.HexategosSriLankaShallows0411;
 assert.ok(wet.evaluate(6.70,80.25).moist>wet.evaluate(8.7,80.85).moist);
 assert.ok(wet.evaluate(7.1,80.7)?.weight>.2);
 assert.equal(wet.evaluate(25,80),null);
 assert.ok(sea.evaluate(9.1,79.54)?.weight>.1);
 assert.equal(sea.evaluate(7.2,83.5),null);
 const centers=[9.1,79.54,7.1,80.7].reduce((a,_,j,all)=>{
  if(j%2)return a;
  const lat=all[j]*Math.PI/180,lon=all[j+1]*Math.PI/180;
  return a.concat([Math.round(Math.cos(lat)*Math.sin(lon)*32767),
   Math.round(Math.sin(lat)*32767),
   Math.round(Math.cos(lat)*Math.cos(lon)*32767)]);
 },[]);
 const L={n:2,land:new Int16Array([-1,1]),centers:new Int16Array(centers)};
 const original=Array.from(L.land);
 assert.notEqual(sea.tint('8',0,L,'rgb(65,109,157)'),'rgb(65,109,157)');
 assert.equal(sea.tint('8',1,L,'rgb(65,109,157)'),'rgb(65,109,157)');
 assert.deepEqual(Array.from(L.land),original);
 assert.ok(wet.cachedCells()===0);
});
test('0.41.1 · orden correcto de scripts y disponibilidad en las tres vistas',()=>{
 const pages=['hexategos-atlas/index.html','hexategos-pruebas/game/index.html','hexategos-pruebas/toponimos-game/index.html'];
 for(const file of pages){
  const s=read(file);
  for(const name of ['geo-sri-lanka-physical-0411.js','geo-sri-lanka-landcover-0411.js',
   'atlas-sri-lanka-graph-0411.js','atlas-sri-lanka-routes-0411.js',
   'atlas-sri-lanka-placement-0411.js','atlas-sri-lanka-shallows-0411.js'])
   assert.ok(s.includes(name),file+' missing '+name);
  assert.ok(s.indexOf('geo-sri-lanka-physical-0411.js')<
   s.indexOf('atlas-sri-lanka-graph-0411.js'));
  assert.ok(s.indexOf('atlas-sri-lanka-graph-0411.js')<
   s.indexOf('atlas-sri-lanka-routes-0411.js'));
  assert.ok(s.indexOf('atlas-sri-lanka-placement-0411.js')<
   s.indexOf('atlas-regions-0390.js'));
  assert.ok(s.indexOf('atlas-sri-lanka-shallows-0411.js')>
   s.indexOf('atlas-himalaya-water-0406.js'));
 }
 for(const mode of ['game','toponimos-game']){
  const dir='hexategos-pruebas/'+mode+'/js/';
  assert.ok(read(dir+'atlas-bridge-0400.js').includes('visibleSriLanka,setEnabled'));
  assert.ok(read(dir+'atlas-integration-0400.js').includes('sriEco.rgbForCell'));
 }
 const regions=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(regions.includes('sriRelief?.isDrawnFeature'));
 assert.ok(regions.includes('sriPlacement?.valid'));
 assert.ok(regions.includes('sri?.regionsNear'));
 assert.ok(read('hexategos-atlas/atlas-macro-0396.js').includes('HexategosSriLankaPhysical0411?.macro'));
});
test('0.41.1 · no crea islas, puentes terrestres, rutas jugables ni intervalos',()=>{
 for(const file of [data,landcover,water,
  'hexategos-atlas/atlas-sri-lanka-graph-0411.js',
  'hexategos-atlas/atlas-sri-lanka-routes-0411.js',
  'hexategos-atlas/atlas-sri-lanka-placement-0411.js']){
  const s=read(file);new vm.Script(s,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(s));
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(s));
  assert.ok(!/saveGame\s*\(|localStorage\.setItem|indexedDB/.test(s));
 }
 assert.ok(read(water).includes("L.land[i]>=0"));
});
