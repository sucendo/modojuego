'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const data='hexategos-pruebas/game/data/geo-myanmar-physical-0412.js',
 cover='hexategos-pruebas/game/data/geo-myanmar-landcover-0412.js',
 render='hexategos-atlas/atlas-myanmar-routes-0412.js';
function dataset(){
 const st={window:{}};vm.runInNewContext(read(data),st);
 return st.window.HexategosMyanmarPhysical0412;
}
test('0.41.2 · Myanmar físico, redes canónicas y afluentes sin ciclos',()=>{
 const d=dataset();
 assert.equal(d.version,'0.41.2');
 assert.equal(d.mountains.length,11);
 assert.equal(d.regions.length,15);
 assert.equal(d.rivers.length,3);
 assert.equal(d.tributaries.length,8);
 assert.equal(d.distributaries.length,4);
 assert.ok(d.canonical.rivers.includes('Salween')&&d.canonical.rivers.includes('Mekong'));
 assert.ok(d.canonical.mountains.includes('Arakan Yoma'));
 assert.equal(d.mountains.filter(m=>m.canonical).length,1);
 const all=[...d.rivers,...d.tributaries,...d.distributaries,...d.mountains];
 assert.equal(new Set(all.map(x=>x.name.toLocaleLowerCase('es-ES'))).size,all.length);
 const lookup=new Map([...d.rivers,...d.tributaries].map(x=>[x.name,x]));
 for(const c of [...d.tributaries,...d.distributaries]){
  assert.ok(lookup.has(c.parent),c.name+' sin receptor');
  const seen=new Set([c.name]);let parent=c.parent;
  while(lookup.has(parent)){
   assert.ok(!seen.has(parent),'ciclo: '+c.name);
   seen.add(parent);
   parent=lookup.get(parent).parent;
  }
 }
 assert.ok(d.regionsNear(97.82,21.34).some(x=>x.name==='Meseta de Shan'));
 assert.equal(d.bodyAt(95,16),null);
});
test('0.41.2 · clima visual de Myanmar sin mutar celdas L8',()=>{
 const st={window:{HexategosMyanmarPhysical0412:dataset()}};
 vm.runInNewContext(read(cover),st);
 const a=st.window.HexategosMyanmarLandcover0412;
 assert.ok(a.evaluate(21.2,95.35).dryZone>a.evaluate(17,95).dryZone);
 assert.ok(a.evaluate(16.8,95.38).delta>a.evaluate(26,95).delta);
 assert.equal(a.evaluate(46,95),null);
 for(const [lat,lon] of [[16.7,95.5],[21,97],[23,93.8],[18.4,99.1]]){
  const x=a.evaluate(lat,lon),y=a.evaluate(lat,lon+.1);
  assert.ok(x&&y,'fuera de ámbito: '+lat+','+lon);
  assert.ok(Math.max(...x.color.map((v,i)=>Math.abs(v-y.color[i])))<35,'borde cromático');
 }
 const at=[[16.7,95.5],[21,97],[18,95.5],[27,96]].flatMap(([lat,lon])=>{
  const a=lat*Math.PI/180,b=lon*Math.PI/180;
  return [Math.round(Math.cos(a)*Math.sin(b)*32767),
   Math.round(Math.sin(a)*32767),
   Math.round(Math.cos(a)*Math.cos(b)*32767)];
 });
 const L={n:4,land:new Int16Array([1,1,-1,1]),centers:new Int16Array(at)};
 const before=[...L.land],base=[143,148,121];
 for(let i=0;i<4;i++)
  assert.deepEqual(a.rgbForCell('8',i,L,base),a.rgbForCell('8',i,L,base));
 assert.deepEqual([...L.land],before);
 assert.ok(a.cachedCells()<=3,'caché demasiado grande');
});
test('0.41.2 · Atlas, Pruebas y Topónimos comparten fuentes y orden',()=>{
 for(const file of ['hexategos-atlas/index.html',
  'hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html']){
  const html=read(file);
  for(const name of ['geo-myanmar-physical-0412.js','geo-myanmar-landcover-0412.js',
   'atlas-myanmar-graph-0412.js','atlas-myanmar-routes-0412.js'])
   assert.ok(html.includes(name),file+' sin '+name);
  assert.ok(html.indexOf('geo-myanmar-physical-0412.js')<
   html.indexOf('atlas-myanmar-graph-0412.js'));
  assert.ok(html.indexOf('atlas-myanmar-graph-0412.js')<
   html.indexOf('atlas-myanmar-routes-0412.js'));
  assert.ok(html.indexOf('atlas-myanmar-routes-0412.js')<
   html.indexOf('atlas-regions-0390.js'));
 }
 for(const mode of ['game','toponimos-game']){
  const dir='hexategos-pruebas/'+mode+'/js/';
  assert.ok(read(dir+'atlas-bridge-0400.js').includes('visibleMyanmar,setEnabled'));
  assert.ok(read(dir+'atlas-integration-0400.js').includes('myanmarEco.rgbForCell'));
 }
 const regions=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(regions.includes('myanmarRender?.isDrawnFeature'));
 assert.ok(regions.includes('myanmar?.regionsNear'));
 assert.ok(read('hexategos-atlas/atlas-landcover-0391.js').includes('myanmarEco.rgbForCell'));
 assert.ok(read('hexategos-atlas/atlas-macro-0396.js').includes('HexategosMyanmarPhysical0412?.macro'));
});
test('0.41.2 · sólo cartografía, sin intervalos ni escritura de partidas',()=>{
 for(const file of [data,cover,render,'hexategos-atlas/atlas-myanmar-graph-0412.js']){
  const s=read(file);new vm.Script(s,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(s),file);
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(s),file);
  assert.ok(!/saveGame\s*\(|localStorage\.setItem|indexedDB/.test(s),file);
 }
 assert.ok(read(render).includes('graph.validate'));
 assert.ok(read(render).includes('coastCandidates'));
});
