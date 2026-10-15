'use strict';
/* Diagnóstico REAL L5/L8 con redes madre nativas. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),
 zlib=require('node:zlib');
const home=path.resolve(__dirname,'../../hexategos-pruebas/game/data');
const atlas=path.resolve(__dirname,'..');
const txt=f=>fs.readFileSync(f,'utf8');
function decode(s,Type){
 const packed=s.charAt(0)==='~',buf=Buffer.from(packed?s.slice(1):s,'base64');
 return new Type(new Uint8Array(packed?zlib.inflateSync(buf):buf).buffer);
}
function geoLiteral(s,name){
 const prefix='const '+name+'=',start=s.indexOf(prefix);
 assert.ok(start>=0,name);
 const open=start+prefix.length,close=s.indexOf('];',open)+1;
 assert.ok(close>open);
 return JSON.parse(s.slice(open,close));
}
test('Indo, Ganges y Brahmaputra: afluentes conectados a cauces reales L8',
 {timeout:180000},()=>{
 const st={window:{},console:{info(){},warn(){}},zoom:10,
  vw:1200,vh:900,drawTerrain3212(){},
  $:()=>({checked:true}),ctx:{save(){},restore(){},
   beginPath(){},moveTo(){},lineTo(){},stroke(){}}};
 const context=vm.createContext(st);
 function load(file,base=home){
  vm.runInContext(txt(path.join(base,file)),context,
   {filename:file,timeout:35000});
 }
 load('bootstrap.js');load('mesh-5.js');load('mesh-8-init.js');
 for(const f of fs.readdirSync(home).filter(n=>
  /^mesh-8-(?:centers|faceCenters|offsets|adj|edgeNbr|land)-\d+\.js$/.test(n)).sort())
  load(f);
 load('groups-5.js');
 const maps=new Map();
 st.loadLevel=key=>{
  if(maps.has(key))return maps.get(key);
  const raw=st.DATA[key],L={n:raw.n};
  const typ={centers:Int16Array,faceCenters:Int16Array,land:Int16Array,
   offsets:Uint32Array,adj:Uint32Array,edgeNbr:Int32Array};
  for(const [name,Type] of Object.entries(typ)){
   if(key==='5'&&name!=='centers')continue;
   L[name]=decode(raw[name],Type);
  }
  maps.set(key,L);return L;
 };
 st.loadGroups=key=>{
  const raw=st.GROUPS[key];return {offsets:decode(raw.offsets,Uint32Array),
   ids:decode(raw.ids,Uint32Array)};
 };
 st.lonLatVec=(lon,lat)=>{
  const a=lon*Math.PI/180,b=lat*Math.PI/180;
  return [Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)];
 };
 st.projectVec=()=>[500,400,1];
 const src=txt(path.join(atlas,'atlas-geography.js')),
  network=geoLiteral(src,'MAP_RIVERS3242'),
  nodes=geoLiteral(src,'PHYS_EDGE_NODES3242');
 st.MAP_RIVERS3242=network;
 st.physicalEdge3242=id=>({u:nodes[id*2],v:nodes[id*2+1]});
 load('geo-himalaya-physical-0406.js');
 load('geo-indus-ganges-brahmaputra-0407.js');
 load('atlas-himalaya-graph-0406.js',atlas);
 load('atlas-indian-rivers-0407.js',atlas);
 const api=st.window.HexategosSubcontinentRivers0407,
  data=st.window.HexategosSubcontinentHydro0407;
 assert.ok(api);assert.equal(api.graphBuilds(),0);
 const L=st.loadLevel('8'),old=Buffer.from(L.land.buffer).toString('base64');
 const ok=[],failed=[];
 for(const item of data.rivers){
  const report=api.validate(item.name);
  if(report?.ok){
   ok.push({name:item.name,edges:report.edges,parent:report.parent,
    snapKm:+report.joinDistanceKm.toFixed(1)});
   assert.ok(report.sameVertex,item.name+' no empalma físicamente');
   assert.equal(report.usesCoast,false,item.name);
   assert.equal(report.crossesVirtualWater,false,item.name);
   assert.ok(report.edges>0,item.name);
  }else failed.push({name:item.name,reason:report?.reason||'Sin ruta'});
 }
 console.log('INDIAN_RIVERS_0407',JSON.stringify({
  graphBuilds:api.graphBuilds(),vertices:api.graphSize(),
  resolved:ok.length,total:data.rivers.length,ok,failed
 }));
 assert.equal(api.graphBuilds(),1);
 assert.ok(api.graphSize()>1000);
 assert.ok(ok.length>=13,'Demasiados afluentes sin resolver: '+JSON.stringify(failed));
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),old);
});
