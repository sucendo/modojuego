'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const game=path.resolve(__dirname,'../../hexategos-pruebas/game/data');
const atlas=path.resolve(__dirname,'..');
function decode(s,Type){
 const packed=s.charAt(0)==='~',b=Buffer.from(packed?s.slice(1):s,'base64');
 const out=packed?zlib.inflateSync(b):b;
 return new Type(new Uint8Array(out).buffer);
}
test('Himalaya: aristas reales L8 y lagos hexagonales no navegables', {timeout:150000},()=>{
 const sandbox={window:{},console:{info(){},warn(){}},
  zoom:10,vw:1200,vh:900,drawTerrain3212(){},
  terrainStrategicFill3247:()=> 'rgb(150,140,110)',
  $:()=>({checked:true}),mapMode3252:'terrain',
  ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}
 };
 const context=vm.createContext(sandbox);
 function load(file,base=game){
  vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context,
   {filename:file,timeout:30000});
 }
 load('bootstrap.js');load('mesh-5.js');load('mesh-8-init.js');
 for(const name of fs.readdirSync(game).filter(x=>
  /^mesh-8-(?:centers|faceCenters|offsets|adj|edgeNbr|land)-\d+\.js$/.test(x)).sort())
  load(name);
 load('groups-5.js');
 const levels=new Map();
 sandbox.loadLevel=key=>{
  if(levels.has(key))return levels.get(key);
  const raw=sandbox.DATA[key],mesh={n:raw.n};
  const types={centers:Int16Array,faceCenters:Int16Array,
   land:Int16Array,offsets:Uint32Array,adj:Uint32Array,edgeNbr:Int32Array};
  for(const [field,Type] of Object.entries(types)){
   if(key==='5'&&field!=='centers')continue;
   mesh[field]=decode(raw[field],Type);
  }
  levels.set(key,mesh);return mesh;
 };
 sandbox.loadGroups=key=>{
  const raw=sandbox.GROUPS[key];return {
   offsets:decode(raw.offsets,Uint32Array),
   ids:decode(raw.ids,Uint32Array)};
 };
 sandbox.lonLatVec=(lon,lat)=>{
  const a=lon*Math.PI/180,b=lat*Math.PI/180;
  return [Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)];
 };
 sandbox.projectVec=()=>[500,400,1];
 load('geo-himalaya-physical-0406.js');
 const d=sandbox.window.HexategosHimalayaPhysical0406;
 sandbox.MOUNTAIN_NETWORKS3242=d.canonical.mountains.map(n=>({n}));
 load('atlas-himalaya-graph-0406.js',atlas);
 load('atlas-himalaya-routes-0406.js',atlas);
 load('atlas-himalaya-water-0406.js',atlas);
 const api=sandbox.window.HexategosHimalaya0406,
  water=sandbox.window.HexategosHimalayaWater0406;
 assert.equal(api.graphBuilds(),0,'Grafo no debe calcularse al cargar');
 assert.equal(api.inspect('Karakórum'),null,'No duplicar cordillera canónica');
 const names=d.mountains.filter(x=>!x.canonicalParent).map(x=>x.name);
 const resolved=[];
 for(const name of names){
  const ids=api.inspect(name);if(ids?.length>1)resolved.push(name);
 }
 const L=sandbox.loadLevel('8'),landCopy=Buffer.from(L.land.buffer).toString('base64');
 console.log('HIMALAYA_L8_ROUTES',JSON.stringify({
  builds:api.graphBuilds(),vertices:api.graphSize(),
  resolved,diagnostics:api.diagnostics()
 }));
 assert.equal(api.graphBuilds(),1,'Grafo construido más de una vez');
 assert.ok(api.graphSize()>1000,'Grafo L8 vacío');
 assert.ok(resolved.length>=3,'Menos de tres cordilleras secundarias resueltas');
 for(const name of resolved){
  const x=api.validate(name);
  assert.ok(x.edges>0);
  assert.equal(x.usesCoast,false,'Arista costera: '+name);
  assert.equal(x.crossesVirtualWater,false,'Cruce de lago: '+name);
 }
 const members=new Map(d.waterBodies.map(x=>[x.name,new Set()]));
 for(let i=0;i<L.n;i++){
  const body=water.isWater('8',i,L);
  if(body)members.get(body.name).add(i);
 }
 const counts={},parts={};
 for(const [name,ids] of members){
  counts[name]=ids.size;
  const todo=new Set(ids);let n=0;
  while(todo.size){
   n++;const seed=todo.values().next().value,stack=[seed];todo.delete(seed);
   while(stack.length){
    const i=stack.pop();
    for(let e=L.offsets[i];e<L.offsets[i+1];e++){
     const next=L.edgeNbr[e];
     if(todo.delete(next))stack.push(next);
    }
   }
  }
  parts[name]=n;
 }
 console.log('HIMALAYA_L8_LAKES',JSON.stringify({counts,parts}));
 assert.equal(Object.values(counts).filter(n=>n>0).length,6,
  'Los seis lagos del Himalaya deben estar representados en L8');
 for(const [lake,count] of Object.entries(counts))
  assert.ok(count>0,'El lago '+lake+' carece de hexágonos L8');
 for(const [name,n] of Object.entries(parts))
  assert.ok(n<=1,name+' no es conexo en L8');
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),landCopy);
 assert.equal(water.isWater('6',0,L),null);
 assert.ok(water.diagnostics().virtualOnly);
 // Verificar también que el inspector solo ofrece rótulos de aguas
 // realmente dibujables y respeta el interruptor de la capa.
 for(const name of members.keys())
  assert.equal(water.isBodyDrawn(name),true,'Rótulo no disponible: '+name);
 sandbox.$=name=>({checked:name==='lakes'?false:true});
 for(const name of members.keys())
  assert.equal(water.isBodyDrawn(name),false,'Rótulo activo con lagos ocultos: '+name);
 sandbox.$=()=>({checked:true});
 sandbox.mapMode3252='supply';
 const testCell=[...members.values()].find(ids=>ids.size)?.values().next().value;
 assert.equal(sandbox.terrainStrategicFill3247('8',testCell,L,1,1),
  'rgb(150,140,110)','El modo suministro debe ignorar el agua decorativa');
 sandbox.mapMode3252='terrain';
});
