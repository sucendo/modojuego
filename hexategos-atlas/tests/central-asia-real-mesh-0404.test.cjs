'use strict';
/* Integración real L5/L8, no sólo un grafo de prueba.
 * Se cargan únicamente las geometrías originales necesarias; sin red.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const zlib=require('node:zlib');
const game=path.resolve(__dirname,'../../hexategos-pruebas/game');
const atlas=path.resolve(__dirname,'..');

test('Caspio y Aral: rutas y lagos sobre la malla REAL L8', {timeout:150000},()=>{
 const home=path.join(game,'data');
 const sandbox={window:{},console:{info(){},warn(){}},zoom:9,vw:1200,vh:900,
  $:()=>({checked:true}),drawTerrain3212(){},
  ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}
 };
 const context=vm.createContext(sandbox);
 function load(name){
  vm.runInContext(fs.readFileSync(path.join(home,name),'utf8'),context,
   {filename:name,timeout:30000});
 }
 load('bootstrap.js');
 load('mesh-5.js');
 load('mesh-8-init.js');
 const chunks=fs.readdirSync(home).filter(n=>
  /^mesh-8-(?:centers|faceCenters|offsets|adj|edgeNbr|land)-\d+\.js$/.test(n)).sort();
 assert.ok(chunks.length>=10,'Faltan piezas de malla L8');
 for(const name of chunks)load(name);
 load('groups-5.js');
 function decode(str,Type){
  const zipped=str.charAt(0)==='~';
  const bytes=Buffer.from(zipped?str.slice(1):str,'base64');
  const bin=zipped?zlib.inflateSync(bytes):bytes;
  // Evitar problemas de alineación de la memoria de Buffer.
  const raw=new Uint8Array(bin).buffer;
  return new Type(raw);
 }
 const meshes=new Map();
 sandbox.loadLevel=(key)=>{
  if(meshes.has(key))return meshes.get(key);
  const src=sandbox.DATA[key],l={n:src.n};
  const types={centers:Int16Array,faceCenters:Int16Array,offsets:Uint32Array,
   adj:Uint32Array,edgeNbr:Int32Array,land:Int16Array};
  for(const [field,Type] of Object.entries(types)){
   if(key==='5'&&field!=='centers')continue;
   l[field]=decode(src[field],Type);
  }
  meshes.set(key,l);return l;
 };
 sandbox.loadGroups=(key)=>{
  assert.equal(key,'5');
  const src=sandbox.GROUPS[key];
  return {offsets:decode(src.offsets,Uint32Array),ids:decode(src.ids,Uint32Array)};
 };
 sandbox.lonLatVec=(lon,lat)=>{
  const a=lon*Math.PI/180,b=lat*Math.PI/180;
  return [Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)];
 };
 sandbox.projectVec=()=>[500,400,1];
 const geo=fs.readFileSync(path.join(home,'geo-central-asia-physical-0404.js'),'utf8');
 vm.runInContext(geo,context,{filename:'geo-central-asia-physical-0404.js'});
 vm.runInContext(fs.readFileSync(path.join(atlas,'atlas-central-asia-routes-0404.js'),'utf8'),context,
  {filename:'atlas-central-asia-routes-0404.js'});
 const api=sandbox.window.HexategosCentralAsia0404;
 assert.equal(api.graphBuilds(),0);
 const west=sandbox.window.HexategosCentralAsiaPhysical0404;
 const candidates=[...west.rivers,...west.mountains].map(x=>x.name);
 const resolved=[];
 for(const name of candidates){
  const route=api.inspect(name);
  if(route?.length>=2)resolved.push(name);
 }
 const diagnostics=api.diagnostics();
 console.log('Atlas Asia Central L8',JSON.stringify({
  vertices:api.graphSize(),builds:api.graphBuilds(),
  resolved,omitted:diagnostics.filter(d=>!d.ok)
 }));
 assert.ok(api.graphSize()>1000,'Grafo regional vacío');
 assert.equal(api.graphBuilds(),1,'Se calculó L8 más de una vez');
 assert.ok(resolved.length>=12,'La mayoría de cauces y cadenas debe resolverse');
 const basinMouths=west.rivers.filter(x=>x.mouthBody).map(x=>x.name);
 const joined=basinMouths.filter(x=>api.validate(x)?.matchesShore);
 console.log('CENTRAL_ASIA_L8_MOUTHS',JSON.stringify({basinMouths,joined,
  diagnostics:basinMouths.map(name=>api.validate(name))}));
 assert.ok(joined.length>=2,'No se resuelven las desembocaduras en lagos interiores');
 for(const d of diagnostics.filter(x=>x.ok)){
  assert.equal(d.usesCoastalEdges,false,d.name);
  const geometry=api.validate(d.name);
  assert.equal(geometry.usesCoast,false,d.name);
  assert.equal(geometry.crossesVirtualWater,false,d.name);
 }
 // Hexágonos de agua existentes jamás se reclasifican como tierra.
 sandbox.terrainStrategicFill3247=()=> 'rgb(180,140,110)';
 sandbox.mapMode3252='terrain';
 vm.runInContext(fs.readFileSync(path.join(atlas,'atlas-central-asia-water-0404.js'),'utf8'),context);
 const water=sandbox.window.HexategosCentralAsiaWater0404;
 assert.ok(water);
 const L=sandbox.loadLevel('8');
 const originalLand=Buffer.from(L.land.buffer).toString('base64');
 const counts=Object.fromEntries(west.waterBodies.map(b=>[b.name,0]));
 for(let i=0;i<L.n;i++){
  const type=water.isWater('8',i,L);
  if(type)counts[type.name]++;
 }
 console.log('CENTRAL_ASIA_L8_WATER_CELLS',JSON.stringify(counts));
 assert.ok(counts['Aral septentrional']>0);
 assert.ok(counts['Balkhash']>0);
 assert.ok(counts['Issyk-Kul']>0);
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),originalLand);
 assert.ok(water.diagnostics().nativeCaspianPreserved);

});
