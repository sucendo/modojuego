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
test('Asia 0.41.6 · Siberia, China, Corea/Japón y archipiélagos sobre la malla L8',
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
 load('geo-asia-completion-0416.js');
 const data=st.window.HexategosAsiaCompletion0416;
 load('atlas-asia-completion-graph-0416.js',atlas);
 load('atlas-asia-completion-routes-0416.js',atlas);
 const api=st.window.HexategosAsiaCompletionRender0416,
  graph=st.window.HexategosAsiaCompletionGraph0416;
 assert.ok(api&&graph);
 assert.equal(graph.builds(),0,'El grafo debería crearse bajo demanda');
 const L=st.loadLevel('8'),original=Buffer.from(L.land.buffer).toString('base64');
 const result=api.prepareAll();
 const succeeded=result.filter(x=>x.ok),failed=result.filter(x=>!x.ok);
 const byZone=Object.fromEntries(data.zones.map(z=>[z.id,{
  routes:result.filter(x=>x.region===z.id).length,
  valid:result.filter(x=>x.region===z.id&&x.ok).length,
  vertices:graph.size(z.id),builds:graph.builds(z.id)
 }]));
 console.log('ASIA_COMPLETION_REAL_L8_0416',JSON.stringify({
  total:result.length,valid:succeeded.length,failed,byZone
 }));
 assert.equal(result.length,data.features.length);
 assert.equal(graph.builds(),data.zones.length);
 assert.ok(succeeded.length>=35,'Faltan demasiados trazados sobre L8');
 for(const item of succeeded){
  const v=api.validate(item.name);
  assert.equal(v.usesCoast,false,item.name);
  assert.equal(v.crossesVirtualWater,false,item.name);
  assert.equal(v.allAdjacent,true,item.name);
  assert.equal(v.nativeMouth,true,item.name);
 }
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),original);
});
