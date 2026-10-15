'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'..');
const read=p=>fs.readFileSync(path.join(repo,p),'utf8');
const dataPath='hexategos-pruebas/game/data/geo-himalaya-physical-0406.js';
function data(){
 const context={window:{}};vm.runInNewContext(read(dataPath),context);
 return context.window.HexategosHimalayaPhysical0406;
}
test('0.40.6: unidades, cabeceras y lagos únicos',()=>{
 const d=data();
 assert.equal(d.version,'0.40.6');
 for(const [items,count] of [[d.mountains,13],[d.waterBodies,6],
  [d.headwaters,7],[d.reliefRegions,12]])assert.equal(items.length,count);
 for(const items of [d.mountains,d.waterBodies,d.headwaters,d.reliefRegions])
  assert.equal(new Set(items.map(x=>x.name.toLowerCase())).size,items.length);
 assert.ok(d.headwaters.filter(x=>x.canonical).some(x=>x.river==='Indo'));
 assert.ok(d.headwaters.some(x=>x.river==='Brahmaputra'));
 assert.ok(d.mountains.filter(x=>x.canonicalParent).length>=5);
 assert.equal(d.bodyAt(78.65,33.75)?.name,'Pangong Tso');
 assert.equal(d.bodyAt(90.65,30.72)?.name,'Namtso');
 assert.equal(d.bodyAt(80,25),null);
 assert.ok(d.regionsNear(85.4,31.4).length>0);
});
test('0.40.6: Atlas y las dos entradas usan las mismas fuentes',()=>{
 const scripts=['geo-himalaya-physical-0406.js','geo-himalaya-landcover-0406.js',
  'atlas-himalaya-graph-0406.js','atlas-himalaya-routes-0406.js',
  'atlas-himalaya-water-0406.js'];
 const pages=['hexategos-atlas/index.html',
  'hexategos-pruebas/game/index.html',
  'hexategos-pruebas/toponimos-game/index.html'];
 for(const page of pages){
  const html=read(page);
  for(const name of scripts)assert.ok(html.includes(name),page+': '+name);
  const pos=name=>html.indexOf(name);
  assert.ok(pos(scripts[0])<pos(scripts[1]));
  assert.ok(pos(scripts[2])<pos(scripts[3]));
  assert.ok(pos(scripts[4])>pos('atlas-central-asia-water-0404.js'));
  assert.ok(pos(scripts[0])<pos('atlas-regions-0390.js'));
 }
 const painter=read('hexategos-atlas/atlas-landcover-0391.js');
 assert.ok(painter.includes('himalaya.rgbForCell'));
 const regions=read('hexategos-atlas/atlas-regions-0390.js');
 assert.ok(regions.includes('himalayaData.reliefRegions')||
  regions.includes('himalayaData?.reliefRegions'));
 assert.ok(regions.includes('himalayaBody'));
 assert.ok(read('hexategos-atlas/atlas-macro-0396.js').includes('HimalayaPhysical0406'));
 for(const dir of ['game','toponimos-game']){
  const prefix='hexategos-pruebas/'+dir+'/js/';
  assert.ok(read(prefix+'atlas-bridge-0400.js').includes('visibleHimalaya'));
  assert.ok(read(prefix+'atlas-integration-0400.js').includes('himalayaEco.rgbForCell'));
 }
});
test('0.40.6: no cambia la simulación, guardados, suelo ni propietarios',()=>{
 const paths=[
  'hexategos-pruebas/game/data/geo-himalaya-physical-0406.js',
  'hexategos-pruebas/game/data/geo-himalaya-landcover-0406.js',
  'hexategos-atlas/atlas-himalaya-graph-0406.js',
  'hexategos-atlas/atlas-himalaya-routes-0406.js',
  'hexategos-atlas/atlas-himalaya-water-0406.js'
 ];
 for(const p of paths){
  const s=read(p);new vm.Script(s,{filename:p});
  assert.ok(!/setInterval\s*\(/.test(s),p);
  assert.ok(!/\b(?:owner6|L\.land)\s*\[[^\]]+\]\s*=(?!=)/.test(s),p);
  assert.ok(!/localStorage\.setItem|indexedDB\.open|saveGame\s*\(/.test(s),p);
 }
 const testScript=read('hexategos-atlas/atlas-himalaya-water-0406.js');
 assert.ok(testScript.includes("mode!=='political'"));
 assert.ok(testScript.includes("L.land[i]<0"));
});
