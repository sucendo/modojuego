'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),
 zlib=require('node:zlib');
const home=path.resolve(__dirname,'../../hexategos-pruebas/game/data'),
 atlas=path.resolve(__dirname,'..');
const text=f=>fs.readFileSync(f,'utf8');
function decode(s,Type){
 const packed=s.startsWith('~'),buffer=Buffer.from(packed?s.slice(1):s,'base64');
 const bytes=packed?zlib.inflateSync(buffer):buffer;
 return new Type(new Uint8Array(bytes).buffer);
}
test('India peninsular · cordilleras L8, Ghats canónicos y guardados inalterados',
 {timeout:180000},()=>{
 const st={window:{},console:{info(){},warn(){}},zoom:10,vw:1200,vh:900,
  drawTerrain3212(){},$:()=>({checked:true}),mapMode3252:'terrain',
  ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}};
 const ctx=vm.createContext(st);
 function load(file,dir=home){
  vm.runInContext(text(path.join(dir,file)),ctx,{filename:file,timeout:40000});
 }
 load('bootstrap.js');load('mesh-5.js');load('mesh-8-init.js');
 for(const name of fs.readdirSync(home).filter(n=>
  /^mesh-8-(?:centers|faceCenters|offsets|adj|edgeNbr|land)-\d+\.js$/.test(n)).sort())
  load(name);
 load('groups-5.js');
 const meshes=new Map();
 st.loadLevel=key=>{
  if(meshes.has(key))return meshes.get(key);
  const raw=st.DATA[key],L={n:raw.n};
  const ty={centers:Int16Array,faceCenters:Int16Array,land:Int16Array,
   offsets:Uint32Array,adj:Uint32Array,edgeNbr:Int32Array};
  for(const [name,Type] of Object.entries(ty)){
   if(key==='5'&&name!=='centers')continue;
   L[name]=decode(raw[name],Type);
  }
  meshes.set(key,L);return L;
 };
 st.loadGroups=key=>{
  const raw=st.GROUPS[key];
  return {offsets:decode(raw.offsets,Uint32Array),
   ids:decode(raw.ids,Uint32Array)};
 };
 st.lonLatVec=(lon,lat)=>{
  const a=lon*Math.PI/180,b=lat*Math.PI/180;
  return [Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)];
 };
 st.projectVec=()=>[500,400,1];
 load('geo-peninsular-india-physical-0409.js');
 const d=st.window.HexategosPeninsularIndiaPhysical0409;
 st.MOUNTAIN_NETWORKS3242=d.canonical.mountains.map(n=>({n}));
 load('atlas-peninsular-india-graph-0409.js',atlas);
 load('atlas-peninsular-india-routes-0409.js',atlas);
 const G=st.window.HexategosPeninsularIndiaGraph0409,
  api=st.window.HexategosPeninsularIndia0409;
 assert.ok(G&&api);
 assert.equal(api.graphBuilds(),0,'No grafo global durante carga');
 for(const x of d.mountains.filter(x=>x.canonicalParent)){
  assert.ok(api.isDrawnFeature(x.name),x.name+' no reconoce Ghats canónicos');
  assert.equal(api.inspect(x.name),null,'Ghats duplicados '+x.name);
 }
 const L=st.loadLevel('8'),old=Buffer.from(L.land.buffer).toString('base64');
 const results=[];
 for(const item of d.mountains.filter(x=>!x.canonicalParent)){
  const path=api.inspect(item.name),valid=api.validate(item.name);
  results.push({name:item.name,edges:valid?.edges||0,
   ok:!!path&&path.length>=2,reason:api.diagnostics().find(x=>x.name===item.name)?.reason||null});
  if(!valid)continue;
  assert.equal(valid.usesCoast,false,item.name+' usa costas');
  assert.equal(valid.crossesVirtualWater,false,item.name+' usa agua virtual');
 }
 const g=G.prepare();
 const south=[...g.coords.values()].some(x=>x.lat<11.6);
 const north=[...g.coords.values()].some(x=>x.lat>23.0);
 const solved=results.filter(x=>x.ok).length;
 console.log('PENINSULAR_L8_0409',JSON.stringify({
  graphBuilds:api.graphBuilds(),vertices:api.graphSize(),
  routeCount:results.length,solved,results,
  south,north,landIntact:Buffer.from(L.land.buffer).toString('base64')===old
 }));
 assert.equal(api.graphBuilds(),1);
 assert.ok(api.graphSize()>1000);
 assert.ok(south&&north,'grafo no cubre todo el Decán/India meridional');
 assert.ok(solved>=8,'muchas rutas sin resolver: '+JSON.stringify(results));
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),old);
});
