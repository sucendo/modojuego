'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data='hexategos-pruebas/game/data/geo-peninsular-india-physical-0409.js',
 cover='hexategos-pruebas/game/data/geo-peninsular-india-landcover-0409.js';
function dataset(){
 const ctx={window:{}};vm.runInNewContext(read(data),ctx);
 return ctx.window.HexategosPeninsularIndiaPhysical0409;
}
test('0.40.9 · relieve, regiones y seis cabeceras naturales',()=>{
 const d=dataset();
 assert.equal(d.version,'0.40.9');
 assert.equal(d.mountains.length,17);
 assert.equal(d.regions.length,19);
 assert.equal(d.headwaters.length,6);
 assert.equal(d.macro.length,2);
 const uniques=list=>assert.equal(new Set(list.map(x=>x.name.toLocaleLowerCase('es-ES'))).size,list.length);
 [d.mountains,d.regions,d.headwaters].forEach(uniques);
 assert.ok(d.mountains.filter(x=>x.canonicalParent).length===6);
 assert.ok(d.mountains.every(x=>x.points.length>=3));
 const names=['Narmada','Tapti','Godavari','Krishna','Kaveri','Mahanadi'];
 assert.deepEqual(Array.from(d.headwaters.map(x=>x.name)),names);
 assert.ok(d.headwaters.every(x=>x.source.length===2&&x.mouth.length===2));
 assert.ok(d.regionsNear(78.2,17.8).some(x=>x.name==='Meseta del Decán'));
 assert.ok(d.regionsNear(75.6,11.5).some(x=>x.name==='Costa de Malabar'));
 assert.equal(d.bodyAt(77.7,13.1),null,'no crear lagos artificiales');
});
test('0.40.9 · colores continuos y caché de celdas regional',()=>{
 const ctx={window:{HexategosPeninsularIndiaPhysical0409:dataset()}};
 vm.runInNewContext(read(cover),ctx);
 const x=ctx.window.HexategosPeninsularIndiaLandcover0409;
 for(const [lat,lon] of [[11.4,75.8],[17.8,78.2],[19.3,75.7],[12.2,80.0],[23.1,77.6]]){
  const sample=x.evaluate(lat,lon);
  assert.ok(sample&&sample.weight>0);
  assert.ok(sample.color.every(c=>Number.isInteger(c)&&c>=0&&c<=255));
  const nearby=x.evaluate(lat,lon+.10);
  assert.ok(Math.max(...sample.color.map((v,i)=>Math.abs(v-nearby.color[i])))<28,
   'color discontinuo en '+lat+','+lon);
 }
 assert.equal(x.evaluate(38,12),null);
 assert.ok(x.evaluate(11.4,75.8).moist>x.evaluate(17.8,78.2).moist,
  'Ghats/Malabar deben ser más húmedos que el Decán interior');
 const points=[[11.4,75.8],[17.8,78.2],[23,77.6],[13.1,74.6]];
 const c=points.flatMap(([lat,lon])=>[
  Math.round(Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180)*32767),
  Math.round(Math.sin(lat*Math.PI/180)*32767),
  Math.round(Math.cos(lat*Math.PI/180)*Math.cos(lon*Math.PI/180)*32767)
 ]);
 const L={n:4,land:new Int16Array([1,1,-1,1]),centers:new Int16Array(c)};
 const before=Array.from(L.land),rgb=[150,130,100];
 for(let i=0;i<4;i++){
  const a=x.rgbForCell('8',i,L,rgb),b=x.rgbForCell('8',i,L,rgb);
  assert.deepEqual(a,b);
 }
 assert.deepEqual(Array.from(L.land),before);
 assert.ok(x.cachedCells()<=3,'caché debe ser regional');
});
test('0.40.9 · mismas capas en Atlas y ambas versiones de Pruebas',()=>{
 const pages=['hexategos-atlas/index.html',
 'hexategos-pruebas/game/index.html',
 'hexategos-pruebas/toponimos-game/index.html'];
 for(const p of pages){
  const html=read(p);
  for(const file of ['geo-peninsular-india-physical-0409.js',
   'geo-peninsular-india-landcover-0409.js',
   'atlas-peninsular-india-graph-0409.js',
   'atlas-peninsular-india-routes-0409.js'])
   assert.ok(html.includes(file),p+' missing '+file);
  assert.ok(html.indexOf('atlas-peninsular-india-graph-0409.js')<
   html.indexOf('atlas-peninsular-india-routes-0409.js'));
  assert.ok(html.indexOf('atlas-peninsular-india-routes-0409.js')<
   html.indexOf('atlas-regions-0390.js'));
 }
 for(const mode of ['game','toponimos-game']){
  const dir='hexategos-pruebas/'+mode+'/js/';
  assert.ok(read(dir+'atlas-bridge-0400.js').includes('visiblePeninsularIndia,setEnabled'));
  assert.ok(read(dir+'atlas-integration-0400.js').includes('peninsulaEco.rgbForCell'));
  assert.ok(read(dir+'atlas-integration-0400.js').includes('bridge.visiblePeninsularIndia()'));
 }
 assert.ok(read('hexategos-atlas/atlas-landcover-0391.js').includes('peninsularIndia.rgbForCell'));
 assert.ok(read('hexategos-atlas/atlas-regions-0390.js').includes('peninsulaRoutes?.isDrawnFeature'));
 assert.ok(read('hexategos-atlas/atlas-macro-0396.js').includes('HexategosPeninsularIndiaPhysical0409?.macro'));
});
test('0.40.9 · no altera jugabilidad, malla, economía ni guardados',()=>{
 for(const file of [data,cover,
  'hexategos-atlas/atlas-peninsular-india-graph-0409.js',
  'hexategos-atlas/atlas-peninsular-india-routes-0409.js']){
  const source=read(file);
  new vm.Script(source,{filename:file});
  assert.ok(!/setInterval\s*\(/.test(source));
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(source));
  assert.ok(!/localStorage\.setItem|saveGame\s*\(|indexedDB/.test(source));
 }
});
