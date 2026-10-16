'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const physics='hexategos-pruebas/game/data/geo-indochina-physical-0415.js',
 cover='hexategos-pruebas/game/data/geo-indochina-landcover-0415.js',
 lake='hexategos-atlas/atlas-indochina-water-0415.js',
 graph='hexategos-atlas/atlas-indochina-graph-0415.js',
 painter='hexategos-atlas/atlas-indochina-routes-0415.js';
function physical(){const st={window:{}};vm.runInNewContext(read(physics),st);return st.window.HexategosIndochinaPhysical0415}
test('Indochina 0.41.5: relieve, cuencas y cauces, sin duplicar Mekong canónico',()=>{
 const d=physical();
 assert.equal(d.version,'0.41.5');
 assert.equal(d.mountains.length,8);
 assert.equal(d.rivers.length,5);
 assert.equal(d.tributaries.length,10);
 assert.equal(d.distributaries.length,4);
 assert.ok(d.regions.length>=18);
 assert.deepEqual([...d.canonical.rivers],['Mekong','Salween']);
 const all=[...d.mountains,...d.rivers,...d.tributaries,...d.distributaries];
 assert.equal(new Set(all.map(x=>x.name.toLocaleLowerCase('es-ES'))).size,all.length);
 assert.ok(!all.some(x=>x.name==='Mekong'),'Duplicación del río principal');
 assert.equal(d.rivers.find(x=>x.nativeParent)?.nativeParent,'Mekong');
 assert.ok(d.regionsNear(103.2,16.2).some(x=>x.name==='Meseta de Khorat'));
 assert.ok(d.regionsNear(105.95,10.45).some(x=>x.name==='Delta del Mekong'));
 assert.equal(d.bodyAt(104.02,12.67)?.name,'Tonlé Sap');
 assert.equal(d.bodyAt(102.7,18.0),null);
 for(const x of [...d.rivers,...d.distributaries])
  assert.ok(Array.isArray(x.points)&&x.points.length>=1);
});
test('Indochina 0.41.5: biomas monzónicos suaves, caché pequeña y suelo inmutable',()=>{
 const st={window:{HexategosIndochinaPhysical0415:physical()}};
 vm.runInNewContext(read(cover),st);
 const e=st.window.HexategosIndochinaLandcover0415;
 const chao=e.evaluate(15.15,100.3),khorat=e.evaluate(16.3,103.15),
  delta=e.evaluate(10.65,106.02),annam=e.evaluate(17.4,106.5);
 assert.ok(chao.farm>khorat.farm);
 assert.ok(delta.wet>khorat.wet);
 assert.ok(khorat.dry>chao.dry);
 assert.ok(annam.mountain>chao.mountain);
 assert.equal(e.evaluate(48,101),null);
 for(const [lat,lon] of [[13.2,104],[16.2,103],[20.7,106],[10.5,106.1]]){
  const x=e.evaluate(lat,lon),y=e.evaluate(lat,lon+.12);
  assert.ok(x&&y);
  assert.ok(Math.max(...x.color.map((v,i)=>Math.abs(v-y.color[i])))<38);
 }
 const toVec=(lat,lon)=>{
  const a=lat*Math.PI/180,b=lon*Math.PI/180;
  return [Math.round(Math.cos(a)*Math.sin(b)*32767),
   Math.round(Math.sin(a)*32767),
   Math.round(Math.cos(a)*Math.cos(b)*32767)];
 };
 const L={n:4,land:new Int16Array([1,1,-1,1]),centers:new Int16Array(
  [[15,100],[16.3,103.1],[12.67,104],[20.7,106.0]].flatMap(x=>toVec(...x)))};
 const old=[...L.land];
 for(let i=0;i<L.n;i++)
  assert.deepEqual(e.rgbForCell('8',i,L,[127,139,98]),
    e.rgbForCell('8',i,L,[127,139,98]));
 assert.deepEqual([...L.land],old);
 assert.ok(e.cachedCells()<=3);
});
test('Indochina 0.41.5: lago Tonlé Sap solo visual, navegabilidad preservada',()=>{
 const d=physical(),st={window:{HexategosIndochinaPhysical0415:d},
  terrainStrategicFill3247:()=> 'rgb(153,143,118)',
  mapMode3252:'terrain',$:()=>({checked:true})};
 vm.runInNewContext(read(lake),st);
 const api=st.window.HexategosIndochinaWater0415;
 const vec=(lat,lon)=>{const a=lat*Math.PI/180,b=lon*Math.PI/180;
  return [Math.round(Math.cos(a)*Math.sin(b)*32767),
   Math.round(Math.sin(a)*32767),
   Math.round(Math.cos(a)*Math.cos(b)*32767)]};
 const L={n:2,land:new Int16Array([1,-1]),
  centers:new Int16Array([...vec(12.67,104.02),...vec(12.68,104.02)])};
 assert.equal(api.isWater('8',0,L)?.name,'Tonlé Sap');
 assert.equal(api.isWater('8',1,L),null);
 assert.equal(api.isWater('5',0,L),null);
 assert.notEqual(st.terrainStrategicFill3247('8',0,L,0,1),'rgb(153,143,118)');
 st.mapMode3252='supply';
 assert.equal(st.terrainStrategicFill3247('8',0,L,0,1),'rgb(153,143,118)');
 assert.deepEqual([...L.land],[1,-1]);
 assert.equal(api.diagnostics().navigable,false);
});
test('Atlas y ambos juegos usan los mismos módulos de Indochina en orden',()=>{
 const modules=['geo-indochina-physical-0415.js','geo-indochina-landcover-0415.js',
  'atlas-indochina-graph-0415.js','atlas-indochina-routes-0415.js',
  'atlas-indochina-water-0415.js'];
 for(const htmlPath of ['hexategos-atlas/index.html','hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html']){
  const html=read(htmlPath);
  for(const name of modules)assert.ok(html.includes(name),htmlPath+' '+name);
  assert.ok(html.indexOf(modules[0])<html.indexOf(modules[2]));
  assert.ok(html.indexOf(modules[2])<html.indexOf(modules[3]));
  assert.ok(html.indexOf(modules[3])<html.indexOf('atlas-regions-0390.js'));
  assert.ok(html.indexOf(modules[4])>html.indexOf('atlas-landcover-0391.js')||
   html.indexOf(modules[4])>html.indexOf('atlas-integration-0400.js'));
 }
 for(const pathName of ['game','toponimos-game']){
  const stem='hexategos-pruebas/'+pathName+'/js/';
  assert.ok(read(stem+'atlas-bridge-0400.js').includes('visibleIndochina'));
  assert.ok(read(stem+'atlas-integration-0400.js').includes('indochinaEco.rgbForCell'));
 }
 assert.ok(read('hexategos-atlas/atlas-regions-0390.js').includes('indochinaRender?.isDrawnFeature'));
 assert.ok(read('hexategos-atlas/atlas-landcover-0391.js').includes('indochinaEco.rgbForCell'));
 for(const file of [physics,cover,lake,graph,painter]){
  const source=read(file);
  new vm.Script(source,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(source),file);
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(source),file);
  assert.ok(!/saveGame\s*\(|localStorage\.setItem|indexedDB/.test(source),file);
 }
});
