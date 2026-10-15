'use strict';
/* 0.41.2 · regresión sobre la malla comprimida L5/L8 REAL. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),
 zlib=require('node:zlib');
const home=path.resolve(__dirname,'../../hexategos-pruebas/game/data'),
 atlas=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(f,'utf8');
function decode(s,Type){
 const compressed=s[0]==='~',
  b=Buffer.from(compressed?s.slice(1):s,'base64');
 return new Type(new Uint8Array(compressed?zlib.inflateSync(b):b).buffer);
}
test('Myanmar 0.41.2 · Irrawaddy, Sittaung, Kaladan, Chindwin, delta y montes reales L8',
 {timeout:180000},()=>{
 const st={window:{},console:{info(){},warn(){}},zoom:11,
  vw:1200,vh:900,mapMode3252:'terrain',
  drawTerrain3212(){},$:()=>({checked:true}),
  ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}};
 const context=vm.createContext(st);
 function load(file,base=home){
  vm.runInContext(read(path.join(base,file)),context,
   {filename:file,timeout:40000});
 }
 load('bootstrap.js');load('mesh-5.js');load('mesh-8-init.js');
 for(const n of fs.readdirSync(home).filter(name=>
  /^mesh-8-(?:centers|faceCenters|offsets|adj|edgeNbr|land)-\d+\.js$/.test(name)).sort())load(n);
 load('groups-5.js');
 const meshes=new Map();
 st.loadLevel=key=>{
  if(meshes.has(key))return meshes.get(key);
  const raw=st.DATA[key],L={n:raw.n},
   types={centers:Int16Array,faceCenters:Int16Array,land:Int16Array,
    offsets:Uint32Array,adj:Uint32Array,edgeNbr:Int32Array};
  for(const [field,T] of Object.entries(types)){
   if(key==='5'&&field!=='centers')continue;
   L[field]=decode(raw[field],T);
  }
  meshes.set(key,L);return L;
 };
 st.loadGroups=key=>{
  const raw=st.GROUPS[key];
  return {offsets:decode(raw.offsets,Uint32Array),ids:decode(raw.ids,Uint32Array)};
 };
 const rad=Math.PI/180;
 st.lonLatVec=(lon,lat)=>[Math.cos(lat*rad)*Math.sin(lon*rad),
  Math.sin(lat*rad),Math.cos(lat*rad)*Math.cos(lon*rad)];
 st.projectVec=()=>[500,400,1];
 load('geo-myanmar-physical-0412.js');
 const d=st.window.HexategosMyanmarPhysical0412;
 st.MOUNTAIN_NETWORKS3242=[{n:'Arakan Yoma'}];
 st.MAP_RIVERS3242=[{n:'Mekong'},{n:'Salween'}];
 load('atlas-myanmar-graph-0412.js',atlas);
 load('atlas-myanmar-routes-0412.js',atlas);
 const api=st.window.HexategosMyanmarRender0412,
   graph=st.window.HexategosMyanmarGraph0412;
 assert.ok(api&&graph);
 assert.equal(api.graphBuilds(),0,'Grafo no perezoso');
 const L=st.loadLevel('8'),
  old=Buffer.from(L.land.buffer).toString('base64');
 const canonical=api.validate('Arakan Yoma');
 assert.ok(canonical.ok&&canonical.notDuplicated);
 assert.equal(api.inspect('Arakan Yoma'),null,'Arakan Yoma dibujado dos veces');
 const report={};
 for(const [key,items] of [['rivers',d.rivers],
  ['tributaries',d.tributaries],['distributaries',d.distributaries],
  ['mountains',d.mountains.filter(x=>!x.canonical)]]){
  const all=[],failed=[];
  for(const item of items){
   const x=api.validate(item.name);
   if(!x?.ok){failed.push({name:item.name,reason:x?.reason});continue}
   all.push({name:item.name,edges:x.edges,
    joinKm:x.joinKm??null,mouthKm:x.mouthKm??null});
   assert.equal(x.usesCoast,false,item.name+' recorre costa');
   assert.equal(x.crossesVirtualWater,false,item.name+' cruza agua');
   assert.equal(x.parentConnected,true,item.name+' no conecta al padre');
   assert.equal(x.exactJoin,true,item.name+' no empalma por vértice');
   assert.equal(x.nativeMouth,true,item.name+' termina fuera de la costa');
   assert.ok(x.edges>0,item.name);
  }
  report[key]={ok:all.length,total:items.length,all,failed};
 }
 console.log('MYANMAR_REAL_L8_0412',JSON.stringify({
  vertices:api.graphSize(),graphBuilds:api.graphBuilds(),
  shoreVertices:api.shoreCount(),report
 }));
 assert.equal(api.graphBuilds(),1,'grafo reconstruido');
 assert.ok(api.graphSize()>1000,'grafo L8 vacío');
 assert.equal(report.rivers.ok,3,'Fallo en río principal: '+JSON.stringify(report.rivers.failed));
 assert.ok(report.tributaries.ok>=6,'Faltan afluentes: '+JSON.stringify(report.tributaries.failed));
 assert.ok(report.distributaries.ok>=2,'Faltan brazos de delta: '+JSON.stringify(report.distributaries.failed));
 assert.ok(report.mountains.ok>=8,'Faltan sistemas montañosos: '+JSON.stringify(report.mountains.failed));
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),old,'Mutación de superficie L8');
});
