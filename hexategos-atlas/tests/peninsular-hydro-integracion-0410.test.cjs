'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data='hexategos-pruebas/game/data/geo-peninsular-india-hydro-0410.js',
 painter='hexategos-atlas/atlas-peninsular-india-hydro-0410.js';
function dataset(){
 const c={window:{}};vm.runInNewContext(read(data),c);
 return c.window.HexategosPeninsularHydro0410;
}
test('0.41.0 · ríos, afluentes y brazos del delta con receptores bien definidos',()=>{
 const d=dataset();assert.equal(d.version,'0.41.0');
 assert.equal(d.main.length,6);assert.equal(d.tributaries.length,18);
 assert.equal(d.deltas.length,8);assert.equal(d.regions.length,4);
 const unique=new Set();
 for(const item of [...d.main,...d.tributaries,...d.deltas]){
  assert.ok(!unique.has(item.name),'nombre repetido '+item.name);
  unique.add(item.name);
  assert.ok(item.points.length>=1&&item.points.every(p=>p.length===2&&p.every(Number.isFinite)));
  assert.ok(item.minZoom>=6);
  if(item.mouth)assert.ok(item.mouth.length===2);
 }
 assert.equal(new Set(d.main.map(x=>x.name)).size,6);
 assert.deepEqual(Array.from(d.main.map(x=>x.name)),
  ['Narmada','Tapti','Godavari','Krishna','Kaveri','Mahanadi']);
 const parentOf=new Map(d.tributaries.map(x=>[x.name,x.parent]));
 for(const r of [...d.tributaries,...d.deltas]){
  assert.ok(unique.has(r.parent),r.name+' sin receptor');
  let name=r.parent,seen=new Set([r.name]);
  while(parentOf.has(name)){
   assert.ok(!seen.has(name),'confluencia cíclica: '+r.name);
   seen.add(name);name=parentOf.get(name);
  }
  assert.ok(d.main.some(x=>x.name===name),r.name+' no pertenece a cuenca principal');
 }
 assert.ok(d.regionsNear(82.04,16.75).length>0);
});
test('0.41.0 · scripts cartográficos ordenados e integrados en los tres mapas',()=>{
 const pages=['hexategos-atlas/index.html','hexategos-pruebas/game/index.html',
   'hexategos-pruebas/toponimos-game/index.html'];
 for(const file of pages){
  const html=read(file);
  for(const item of [data.split('/').at(-1),painter.split('/').at(-1)]){
   assert.ok(html.includes(item),file+' sin '+item);
  }
  assert.ok(html.indexOf('geo-peninsular-india-hydro-0410.js')<
   html.indexOf('atlas-peninsular-india-hydro-0410.js'));
  assert.ok(html.indexOf('atlas-peninsular-india-graph-0409.js')<
   html.indexOf('atlas-peninsular-india-hydro-0410.js'));
  assert.ok(html.indexOf('atlas-peninsular-india-hydro-0410.js')<
   html.indexOf('atlas-regions-0390.js'));
 }
 const regions=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(regions.includes('indiaRivers?.isDrawnFeature'));
 assert.ok(regions.includes('indiaHydro?.regionsNear'));
});
test('0.41.0 · cauces representados sin alterar estado ni introducir temporizadores',()=>{
 for(const file of [data,painter]){
  const src=read(file);
  new vm.Script(src,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(src),file);
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(src),file);
  assert.ok(!/localStorage\.setItem|saveGame\s*\(|indexedDB/.test(src),file);
 }
 const src=read(painter);
 assert.ok(src.includes('graph.validate'));
 assert.ok(src.includes('shoreNodes'));
});
