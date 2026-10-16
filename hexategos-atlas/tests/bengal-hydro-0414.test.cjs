'use strict';
/* Asegura estabilidad de cartografía regional 0.41.4 */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
const dataName='hexategos-pruebas/game/data/geo-bengal-confluences-0414.js',
 renderName='hexategos-atlas/atlas-bengal-continuity-0414.js';
test('0.41.4 · confluencias correctas y sin sistemas duplicados',()=>{
 const ctx={window:{}};
 vm.runInNewContext(read(dataName),ctx);
 const d=ctx.window.HexategosBengalHydro0414;
 assert.equal(d.routes.length,6);
 assert.equal(d.labels.length,5);
 assert.equal(new Set(d.routes.map(x=>x.name)).size,d.routes.length);
 assert.equal(d.routes.find(x=>x.name==='Jamuna').parent,'Brahmaputra');
 assert.equal(d.routes.find(x=>x.name==='Padma').terminal,'Chandpur');
 assert.equal(d.routes.find(x=>x.name==='Meghna inferior').source,'Chandpur');
 assert.equal(d.routes.find(x=>x.name==='Meghna inferior').kind,'estuary');
 assert.equal(d.routes.find(x=>x.name==='Ganges medio y Padma').terminal,'Goalundo');
 for(const name of ['Kosi','Panjnad']){
  assert.equal(d.confluences[name].maxKm,28);
  assert.ok(d.routes.some(x=>x.name===d.confluences[name].repair));
 }
 assert.ok(Math.abs(d.confluences.Goalundo.at[0]-89.744)<.001);
 assert.ok(Math.abs(d.confluences.Chandpur.at[1]-23.2198)<.001);
});
test('0.41.4 · Atlas y las dos versiones jugables reciben datos idénticos',()=>{
 const targets=['hexategos-atlas/index.html',
  'hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html'];
 for(const file of targets){
  const html=read(file);
  assert.ok(html.includes('geo-bengal-confluences-0414.js'),file);
  assert.ok(html.includes('atlas-bengal-continuity-0414.js'),file);
  assert.ok(html.indexOf('geo-bengal-confluences-0414.js')<
   html.indexOf('geo-indus-ganges-brahmaputra-0407.js'),file);
  assert.ok(html.indexOf('atlas-indian-rivers-0407.js')<
   html.indexOf('atlas-bengal-continuity-0414.js'),file);
  assert.ok(html.indexOf('atlas-bengal-continuity-0414.js')<
   html.indexOf('atlas-regions-0390.js'),file);
 }
 const region=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(region.includes('item.bengalCourse&&!bengalRivers?.validate'));
 const tributary=read('hexategos-atlas/atlas-indian-rivers-0407.js');
 assert.ok(tributary.includes('nodesForTributary(item.name)'));
 assert.ok(tributary.includes("p.parentType==='regionalRepair'"));
});
test('0.41.4 · conserva suelo jugable, propietarios, rutas y guardados',()=>{
 for(const file of [dataName,renderName,
  'hexategos-atlas/atlas-indian-rivers-0407.js']){
  const code=read(file);new vm.Script(code,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(code),file);
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(code),file);
  assert.ok(!/localStorage\.setItem|indexedDB|saveGame\s*\(/.test(code),file);
 }
 const drawer=read(renderName);
 assert.ok(drawer.includes('nativeEdges'));
 assert.ok(drawer.includes('protectedEdges.has(edge(a,b))'));
 assert.ok(drawer.includes('graph.validate'));
 assert.ok(drawer.includes('graph.solve'));
});
