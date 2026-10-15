'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const home=path.resolve(__dirname,'../../hexategos-pruebas/game/data'),
 atlas=path.resolve(__dirname,'..');
function decode(s,Type){
 const packed=s.startsWith('~'),b=Buffer.from(packed?s.slice(1):s,'base64');
 return new Type(new Uint8Array(packed?zlib.inflateSync(b):b).buffer);
}
test('Sri Lanka 0.41.1 · topología L8, mar de Palk, cadenas montañosas y no alteración de juego',
 {timeout:180000},()=>{
 const st={window:{},console:{info(){},warn(){}},zoom:10,vw:1200,vh:900,
  drawTerrain3212(){},terrainStrategicFill3247:()=> 'rgb(65,109,157)',
  $:()=>({checked:true}),mapMode3252:'terrain',
  ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}};
 const ctx=vm.createContext(st);
 function load(file,dir=home){
  vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),ctx,
   {filename:file,timeout:40000});
 }
 load('bootstrap.js');load('mesh-5.js');load('mesh-8-init.js');
 for(const n of fs.readdirSync(home).filter(x=>
  /^mesh-8-(?:centers|faceCenters|offsets|adj|edgeNbr|land)-\d+\.js$/.test(x)).sort())load(n);
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
 const L=st.loadLevel('8'),landBefore=Buffer.from(L.land.buffer).toString('base64');
 function nearest(lon,lat){
  const cx=Math.cos(lat*rad);let best=-1,km=Infinity;
  for(let i=0;i<L.n;i++){
   const j=i*3,y=L.centers[j+1]/32767,
    qLat=Math.asin(Math.max(-1,Math.min(1,y)))/rad;
   if(Math.abs(qLat-lat)>1.2)continue;
   const qLon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
   const d=Math.hypot((lat-qLat)*111.2,(lon-qLon)*111.2*cx);
   if(d<km){km=d;best=i}
  }
  return {id:best,km};
 }
 const seaPoints=[[79.70,9.42],[79.54,9.10],[79.43,8.58]],
  landPoints=[[80.62,7.35],[80.28,9.24]];
 const sea=seaPoints.map(([lon,lat])=>{
  const n=nearest(lon,lat);return {...n,land:L.land[n.id]};
 });
 const land=landPoints.map(([lon,lat])=>{
  const n=nearest(lon,lat);return {...n,land:L.land[n.id]};
 });
 assert.ok(sea.every(x=>x.land<0),'Estrecho o golfo no es agua L8');
 assert.ok(land.every(x=>x.land>=0),'Sri Lanka central/norte carecen de tierra');
 load('geo-sri-lanka-physical-0411.js');
 load('atlas-sri-lanka-graph-0411.js',atlas);
 load('atlas-sri-lanka-routes-0411.js',atlas);
 load('atlas-sri-lanka-shallows-0411.js',atlas);
 const data=st.window.HexategosSriLankaPhysical0411,
  G=st.window.HexategosSriLankaGraph0411,
  render=st.window.HexategosSriLanka0411,
  water=st.window.HexategosSriLankaShallows0411;
 assert.equal(render.graphBuilds(),0);
 const routes=[];
 for(const m of data.mountains){
  const ids=render.inspect(m.name),v=render.validate(m.name);
  routes.push({name:m.name,ok:!!ids,edges:v?.edges||0,
   reason:render.diagnostics().find(x=>x.name===m.name)?.reason||null});
  if(!v)continue;
  assert.equal(v.usesCoast,false,m.name);
  assert.equal(v.crossesVirtualWater,false,m.name);
 }
 const prepared=G.prepare();
 const solved=routes.filter(x=>x.ok);
 assert.equal(render.graphBuilds(),1);
 assert.ok(render.graphSize()>100,'Grafo insular vacío');
 assert.ok(solved.length>=3,'Pocas cordilleras resueltas: '+JSON.stringify(routes));
 assert.notEqual(water.tint('8',sea[1].id,L,'rgb(65,109,157)'),
  'rgb(65,109,157)','No aparece zona marina visual');
 assert.equal(water.tint('8',land[0].id,L,'rgb(65,109,157)'),
  'rgb(65,109,157)','Se ha tintado tierra como mar');
 // Las coordenadas de islas ausentes siguen siendo mar:
 // queda PROHIBIDO crearlas mediante tinta cartográfica.
 for(const [lon,lat] of [[79.35,9.29],[79.86,8.98],[79.72,9.49]]){
  const at=nearest(lon,lat);assert.ok(L.land[at.id]<0,
   'La malla base cambió en una isla pequeña');
 }
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),landBefore);
 console.log('SRILANKA_L8_0411',JSON.stringify({
  builds:render.graphBuilds(),vertices:render.graphSize(),routes,
  sea,land,shoalTinted:true,landIntact:true
 }));
});