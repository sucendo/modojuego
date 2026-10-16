'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const repo=path.resolve(root,'..'),read=f=>fs.readFileSync(path.join(repo,f),'utf8');
const data='hexategos-pruebas/game/data/geo-assam-confluences-0413.js';
const flow='hexategos-pruebas/game/data/geo-indus-ganges-brahmaputra-0407.js';
const moduleFile='hexategos-atlas/atlas-assam-corridor-0413.js';
test('Assam 0.41.3: afluentes con confluencias compartidas en una única fuente',()=>{
 const context=vm.createContext({window:{}});
 vm.runInContext(read(data),context);
 vm.runInContext(read(flow),context);
 const a=context.window.HexategosAssamConfluences0413;
 const h=context.window.HexategosSubcontinentHydro0407;
 assert.equal(a.version,'0.41.3');
 assert.equal(a.corridor.points.length,13);
 for(const [name,detail] of Object.entries(a.mouths)){
  const river=h.rivers.find(r=>r.name===name);
  assert.ok(river,name+' no existe');
  assert.equal(river.parent,'Brahmaputra');
  assert.deepEqual([...river.join],[...detail.at]);
  assert.deepEqual([...river.points[river.points.length-1]],[...detail.at]);
  assert.equal(river.points,a.highCourses[name]);
 }
 assert.ok(a.highCourses.Subansiri.length>=7,'El Subansiri debe tener su meandro');
 assert.ok(a.highCourses.Manas.length>=5,'El Manas debe conservar tramo bhutanés');
 assert.ok(a.highCourses.Teesta.length>=6,'El Teesta necesita tramo bangladesí');
 assert.ok(Math.abs(a.mouths.Subansiri.at[1]-26.88)<.001);
 assert.ok(Math.abs(a.mouths.Manas.at[1]-26.25)<.001);
});
test('Assam: Atlas y juegos comparten corredor físico, sin alterar la simulación',()=>{
 const source=read(moduleFile);new vm.Script(source,{filename:moduleFile});
 for(const page of ['hexategos-atlas/index.html','hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html']){
  const html=read(page);
  for(const name of ['geo-assam-confluences-0413.js','atlas-assam-corridor-0413.js'])
   assert.ok(html.includes(name),page+' '+name);
  assert.ok(html.indexOf('geo-assam-confluences-0413.js')<
   html.indexOf('geo-indus-ganges-brahmaputra-0407.js'),page);
  assert.ok(html.indexOf('atlas-indian-rivers-0407.js')<
   html.indexOf('atlas-assam-corridor-0413.js'),page);
 }
 const render=read('hexategos-atlas/atlas-indian-rivers-0407.js');
 assert.ok(render.includes('regionalCorridor'));
 assert.ok(render.includes('HexategosAssamCorridor0413'));
 assert.ok(source.includes('native.has(edge(u,v)))continue'));
 for(const text of [source,read(data),render]){
  assert.ok(!/setInterval\s*\(/.test(text));
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(text));
  assert.ok(!/localStorage|indexedDB|saveGame\s*\(/.test(text));
 }
});
