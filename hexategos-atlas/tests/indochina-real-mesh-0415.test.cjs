'use strict';
/* 0.41.5 · regresión sobre la malla comprimida L5/L8 REAL. */
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
test('Indochina 0.41.5 · Chao Phraya, Río Rojo, afluentes, delta y montes reales L8',
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
 load('geo-indochina-physical-0415.js');
 const d=st.window.HexategosIndochinaPhysical0415;
 // El Mekong ya está en la malla global. Los afluentes deben
 // empalmar con sus VÉRTICES reales y no con referencias supuestas.
 const geography=read(path.join(atlas,'atlas-geography.js'));
 function literal(name){
  const a=geography.indexOf('const '+name+'='),begin=geography.indexOf('[',a);
  return JSON.parse(geography.slice(begin,geography.indexOf('];',begin)+1));
 }
 const rivers=literal('MAP_RIVERS3242'),nodes=literal('PHYS_EDGE_NODES3242');
 st.MAP_RIVERS3242=rivers;
 st.physicalEdge3242=i=>({u:nodes[i*2],v:nodes[i*2+1]});
 load('atlas-indochina-graph-0415.js',atlas);
 load('atlas-indochina-routes-0415.js',atlas);
 const api=st.window.HexategosIndochinaRender0415,
   graph=st.window.HexategosIndochinaGraph0415;
 assert.ok(api&&graph);
 assert.equal(api.graphBuilds(),0,'Grafo no perezoso');
 const L=st.loadLevel('8'),
  old=Buffer.from(L.land.buffer).toString('base64');
 const native=api.canonicalCovered();
 console.log('INDOCHINA_MEKONG_NATIVE_0415',JSON.stringify(native));
 const G=graph.prepare(),ids=(()=>{
  const all=new Set();
  for(const sys of st.MAP_RIVERS3242.filter(x=>x.n==='Mekong'))
   for(const e of sys.edges||[]){
    const v=st.physicalEdge3242(e);all.add(v.u);all.add(v.v);
   }
  return [...all].filter(id=>G.coords.has(id));
 })();
 const probes=[[105.14,15.32],[105.82,15.13],[105.90,14.6],
  [106.0,13.5],[106.0,12.5],[104.93,11.55],[105.25,11.2],
  [105.60,10.75]];
 const km=(a,b)=>Math.hypot((a.lon-b.lon)*111.2*
  Math.cos((a.lat+b.lat)*Math.PI/360),(a.lat-b.lat)*111.2);
 console.log('INDOCHINA_NATIVE_MEANDER_0415',JSON.stringify(probes.map(([lon,lat])=>{
  const p={lon,lat},list=ids.map(id=>({id,d:km(G.coords.get(id),p)}))
   .sort((a,b)=>a.d-b.d).slice(0,2);
  return {lon,lat,near:list.map(x=>({id:x.id,km:+x.d.toFixed(1),
   p:G.coords.get(x.id)}))};
 })));

 assert.ok(native.find(x=>x.name==='Mekong')?.vertices>0,
  'Mekong canónico ausente en malla Indochina');
 const report={};
 for(const [key,items] of [['rivers',d.rivers],
  ['tributaries',d.tributaries],['distributaries',d.distributaries],
  ['mountains',d.mountains]]){
  const ok=[],failed=[];
  for(const item of items){
   const x=api.validate(item.name);
   if(!x?.ok){failed.push({name:item.name,reason:x?.reason});continue;}
   ok.push({name:item.name,edges:x.edges,joinKm:x.joinKm??null,
    mouthKm:x.mouthKm??null,parentType:x.parentType??null});
   assert.equal(x.usesCoast,false,item.name+' cruza el litoral');
   assert.equal(x.crossesVirtualWater,false,item.name+' cruza Tonle Sap');
   assert.equal(x.parentConnected,true,item.name+' no llega al receptor');
   assert.equal(x.exactJoin,true,item.name+' sin vértice de confluencia');
   assert.equal(x.nativeMouth,true,item.name+' fuera de costa nativa');
  }
  report[key]={ok:ok.length,total:items.length,okRoutes:ok,failed};
 }
 console.log('INDOCHINA_L8_REPORT_0415',JSON.stringify({
  vertices:api.graphSize(),builds:api.graphBuilds(),report
 }));
 assert.ok(api.graphSize()>1200,'Grafo regional vacío');
 assert.equal(api.graphBuilds(),1,'Grafo reconstruido');
 assert.equal(report.rivers.ok,d.rivers.length,'Cauce principal incompleto');
 assert.equal(report.tributaries.ok,d.tributaries.length,'Afluentes incompletos');
 assert.equal(report.distributaries.ok,d.distributaries.length,'Brazos sin desembocadura');
 assert.equal(report.mountains.ok,d.mountains.length,'Sierras incompletas');
 for(const name of ['Chao Phraya','Río Rojo (Sông Hồng)','Mekong bajo (continuación)',
  'Mun','Nam Ou','Nam Ngum','Tonle Sap','Tiền (Mekong)','Hậu (Bassac)']){
  const check=api.validate(name);
  assert.ok(check.ok,name);
  assert.equal(check.usesCoast,false,name);
  assert.equal(check.crossesVirtualWater,false,name);
  if(check.parent)assert.ok(check.parentConnected&&check.exactJoin,name);
 }
 st.terrainStrategicFill3247=()=> 'rgb(154,143,116)';
 load('atlas-indochina-water-0415.js',atlas);
 const water=st.window.HexategosIndochinaWater0415;
 const wet=new Set();
 for(let i=0;i<L.n;i++)if(water.isWater('8',i,L))wet.add(i);
 console.log('INDOCHINA_TONLE_SAP_L8_CELLS',JSON.stringify({
  cells:wet.size,originalLand:[...wet].every(i=>L.land[i]>=0)}));
 assert.ok(wet.size>=2,'Tonlé Sap no se resuelve como lago de hexágonos');
 const remaining=new Set(wet),stack=[remaining.values().next().value];
 remaining.delete(stack[0]);
 while(stack.length){
  const i=stack.pop();
  for(let j=L.offsets[i];j<L.offsets[i+1];j++){
   const next=L.edgeNbr[j];
   if(remaining.delete(next))stack.push(next);
  }
 }
 assert.equal(remaining.size,0,'Tonlé Sap contiene islotes visuales desconectados');
 assert.equal(water.diagnostics().navigable,false);
 const after=Buffer.from(L.land.buffer).toString('base64');
 assert.equal(after,old,'Se han alterado las casillas jugables L8');
});
