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

test('Las rutas orientales se resuelven sobre los datos REALES L8', {timeout:150000},()=>{
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
 const geo=fs.readFileSync(path.join(home,'geo-west-asia-physical-0403.js'),'utf8');
 vm.runInContext(geo,context,{filename:'geo-west-asia-physical-0403.js'});
 vm.runInContext(fs.readFileSync(path.join(atlas,'atlas-west-asia-0403.js'),'utf8'),context,
  {filename:'atlas-west-asia-0403.js'});
 const api=sandbox.window.HexategosWestAsia0403;
 assert.equal(api.graphBuilds(),0);
 const west=sandbox.window.HexategosWestAsiaPhysical0403;
 const candidates=[...west.rivers,...west.mountains,...west.lakes].map(x=>x.name);
 const resolved=[];
 for(const name of candidates){
  const route=api.inspect(name);
  if(route?.length>=2)resolved.push(name);
 }
 const diagnostics=api.diagnostics();
 console.log('Atlas Oriente Próximo L8',JSON.stringify({
  vertices:api.graphSize(),builds:api.graphBuilds(),
  resolved,omitted:diagnostics.filter(d=>!d.ok)
 }));
 assert.ok(api.graphSize()>1000,'Grafo regional vacío');
 assert.equal(api.graphBuilds(),1,'Se calculó L8 más de una vez');
 assert.ok(resolved.some(x=>['Orontes (Asi)','Jordán','Karún','Gran Zab','Kura'].includes(x)),
  'Ningún río secundario se conectó');
 assert.ok(resolved.some(x=>['Montes Pónticos','Montes Al Hajar','Pequeño Cáucaso'].includes(x)),
  'Ninguna cordillera secundaria se conectó');
 assert.ok(resolved.some(x=>['Lago Urmia','Lago Tuz','Lago Seván'].includes(x)),
  'Ningún lago propuesto puede representarse con L8');
 for(const d of diagnostics.filter(x=>x.ok))assert.equal(d.usesCoastalEdges,false,d.name);
});
