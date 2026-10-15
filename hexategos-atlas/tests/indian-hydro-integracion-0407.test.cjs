'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'..');
const read=f=>fs.readFileSync(path.join(repo,f),'utf8');
const file='hexategos-pruebas/game/data/geo-indus-ganges-brahmaputra-0407.js';
function getData(){
 const w={};vm.runInNewContext(read(file),{window:w});
 return w.HexategosSubcontinentHydro0407;
}
test('0.40.7: cuencas y afluentes sin duplicar los cauces madre',()=>{
 const D=getData();
 assert.equal(D.version,'0.40.7');
 assert.equal(D.trunk.length,4);
 assert.equal(D.rivers.length,20);
 assert.equal(D.rivers.find(x=>x.name==='Yarlung Tsangpo').kind,'upstreamContinuation');
 assert.equal(D.basins.length,9);
 const uniq=arr=>assert.equal(new Set(arr.map(x=>x.name)).size,arr.length);
 for(const arr of [D.rivers,D.trunk,D.basins])uniq(arr);
 assert.deepEqual(Array.from(D.trunk.map(x=>x.name)),
  ['Indo','Ganges','Brahmaputra','Yamuna']);
 assert.ok(D.rivers.every(x=>x.points.length>=3));
 assert.ok(D.rivers.every(x=>x.parent&&x.join&&x.basin));
 const known=new Set([...D.trunk.map(x=>x.name),...D.rivers.map(x=>x.name)]);
 for(const r of D.rivers){
  assert.ok(known.has(r.parent),r.name+' no tiene receptor');
  assert.ok(r.points.every(p=>p.length===2&&p.every(Number.isFinite)));
  assert.ok(!D.trunk.some(x=>x.name===r.name),'cauce madre duplicado');
  const seen=new Set();let at=r;
  while(at){
   assert.ok(!seen.has(at.name),'Confluencia cíclica: '+r.name);
   seen.add(at.name);at=D.rivers.find(x=>x.name===at.parent);
  }
 }
 const punjab=D.rivers.filter(x=>x.basin==='Indo');
 for(const name of ['Panjnad','Chenab','Sutlej','Jhelum','Ravi','Beas'])
  assert.ok(punjab.some(x=>x.name===name),name);
 assert.equal(D.rivers.find(x=>x.name==='Panjnad').parent,'Indo');
 assert.equal(D.rivers.find(x=>x.name==='Beas').parent,'Sutlej');
 assert.equal(D.rivers.find(x=>x.name==='Jhelum').parent,'Chenab');
 assert.ok(D.regionsNear(83.5,26.3).length>0);
});
test('0.40.7: integración consistente entre Atlas y ambas entradas',()=>{
 const modules=[file.split('/').at(-1),'atlas-indian-rivers-0407.js'];
 for(const page of ['hexategos-atlas/index.html',
  'hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html']){
  const html=read(page);
  for(const m of modules)assert.ok(html.includes(m),page+' '+m);
  assert.ok(html.indexOf(modules[0])<html.indexOf(modules[1]),page);
  assert.ok(html.indexOf(modules[1])<html.indexOf('atlas-regions-0390.js'),page);
  assert.ok(html.indexOf('atlas-himalaya-graph-0406.js')<
   html.indexOf(modules[1]),page);
 }
 const labels=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(labels.includes('indianHydro?.basins'), 'faltan topónimos');
 assert.ok(labels.includes('indianTributary'), 'faltan nombres de afluentes');
 assert.ok(labels.includes('indianRivers?.isDrawnFeature?'), 'no se valida la ruta');
});
test('0.40.7: sin navegación, suministro ni mutaciones de partida',()=>{
 for(const p of [file,'hexategos-atlas/atlas-indian-rivers-0407.js']){
  const s=read(p);
  new vm.Script(s,{filename:p});
  assert.ok(!/setInterval\s*\(/.test(s),p);
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(s),p);
  assert.ok(!/localStorage|indexedDB|saveGame|gameState/.test(s),p);
 }
 const painter=read('hexategos-atlas/atlas-indian-rivers-0407.js');
 assert.ok(painter.includes("mode!=='terrain'&&mode!=='political'"));
 assert.ok(painter.includes("physicalEdge3242"));
 assert.ok(painter.includes("graph.validate"));
});
