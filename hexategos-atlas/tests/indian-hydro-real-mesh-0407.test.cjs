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
 load('geo-assam-confluences-0413.js');
 load('geo-bengal-confluences-0414.js');
 load('geo-indus-ganges-brahmaputra-0407.js');
 load('geo-indian-deltas-0408.js');
 load('atlas-himalaya-graph-0406.js',atlas);
 load('atlas-indian-rivers-0407.js',atlas);
 load('atlas-assam-corridor-0413.js',atlas);
 load('atlas-indian-deltas-0408.js',atlas);
 load('atlas-bengal-continuity-0414.js',atlas);
 const api=st.window.HexategosSubcontinentRivers0407,
  data=st.window.HexategosSubcontinentHydro0407;
 assert.ok(api);assert.equal(api.graphBuilds(),0);
 const corrected=st.window.HexategosAssamCorridor0413;
 const corridorReport=corrected.diagnostics();
 console.log('ASSAM_BRAHMAPUTRA_CORRIDOR_0413',JSON.stringify(corridorReport));
 assert.equal(corridorReport.ok,true,corridorReport.reason);
 assert.equal(corridorReport.usesCoast,false);
 assert.equal(corridorReport.crossesVirtualWater,false);
 assert.ok(corridorReport.supplementalEdges>0);
 for(const name of ['Subansiri','Manas','Teesta']){
  const check=api.validate(name),point=data.rivers.find(x=>x.name===name).join;
  const geographic=corrected.nearest(point);
  console.log('ASSAM_CONFLUENCE_0413',JSON.stringify({name,check,geographic}));
  assert.ok(check?.ok,name+' sin ruta L8');
  assert.equal(check.regionalCorridor,true,name);
  assert.ok(check.sameVertex,name+' termina fuera del corredor');
  assert.equal(check.usesCoast,false,name);
  assert.equal(check.crossesVirtualWater,false,name);
  assert.ok(check.joinDistanceKm<=38,
   name+' desplazamiento de '+check.joinDistanceKm+' km');
  assert.ok(geographic.km<=38,name+' confluencia demasiado lejos del corredor');
 }
 const bengal=st.window.HexategosBengalRoutes0414;
 const summary=st.window.HexategosBengalHydro0414.routes.map(x=>
  bengal.validate(x.name));
 console.log('BENGAL_FULL_L8_0414',JSON.stringify(summary));
 for(const name of ['Kosi','Panjnad']){
  console.log('PARENT_REPAIR_0414',JSON.stringify({name,repair:bengal.nodesForTributary(name).length,
   report:api.validate(name)}));
 }
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
 const points=st.window.HexategosHimalayaGraph0406.prepare().coords;
 const far=data.rivers.map(item=>{
  const report=api.validate(item.name);if(!report?.ok||report.joinDistanceKm<80)return null;
  const ids=api.inspect(item.name),actual=points.get(ids.at(-1));
  return {name:item.name,declared:item.join,snapped:[+actual.lon.toFixed(3),+actual.lat.toFixed(3)],
   km:+report.joinDistanceKm.toFixed(1)};
 }).filter(Boolean);
 console.log('INDIAN_RIVERS_FAR_JOINS',JSON.stringify(far));
 const targets={
  subansiri:[93.91,26.88],manas:[90.82,26.25],teesta:[89.66,25.49],
  dhubri:[89.95,26.06],goalpara:[90.62,26.17],guwahati:[91.73,26.15],
  jorhat:[94.20,26.88]
 };
 const nearParent=[];
 for(const [name,[lon,lat]] of Object.entries(targets)){
  const p={lon,lat};let dist=Infinity,point=null,id=null;
  const graphCoords=st.window.HexategosHimalayaGraph0406.prepare().coords;
  for(const node of api.canonicalNodes('Brahmaputra')){
   const q=graphCoords.get(node);if(!q)continue;
   const km=Math.hypot((q.lon-lon)*111.2*Math.cos(lat*Math.PI/180),(q.lat-lat)*111.2);
   if(km<dist){dist=km;point=q;id=node}
  }
  nearParent.push({name,km:+dist.toFixed(1),node:id,nearest:point&&
    [+point.lon.toFixed(3),+point.lat.toFixed(3)]});
 }
 console.log('ASSAM_CANONICAL_AUDIT',JSON.stringify(nearParent));
 const spot=(river,[lon,lat])=>{
  const near={lon,lat};let km=Infinity,position=null;
  for(const id of api.canonicalNodes(river)){
   const p=points.get(id),c=Math.cos((p.lat+lat)*Math.PI/360);
   const d=Math.hypot((p.lon-lon)*111.2*c,(p.lat-lat)*111.2);
   if(d<km){km=d;position=p}
  }
  return {km:+km.toFixed(1),nearest:position&&
   [+position.lon.toFixed(2),+position.lat.toFixed(2)]};
 };
 console.log('INDIAN_RIVERS_CANONICAL_COVERAGE',JSON.stringify({
  IndusSource:spot('Indo',[81.0,31.2]),
  GangesSource:spot('Ganges',[78.9,30.8]),
  YamunaSource:spot('Yamuna',[78.5,31.0]),
  YarlungSource:spot('Brahmaputra',[82.3,30.6]),
  YarlungMiddle:spot('Brahmaputra',[88.5,29.3]),
  YarlungBend:spot('Brahmaputra',[94.7,29.4]),
  GangesKosi:spot('Ganges',[87.26,25.42]),
  BrahmaputraTeesta:spot('Brahmaputra',[89.66,25.49])
 }));
 const targeted=[
  ['Panjnad nativo','Indo',[70.70,29.11]],
  ['Kosi nativo','Ganges',[87.26,25.41]],
  ['Goalundo Brahmaputra','Brahmaputra',[89.744,23.806]],
  ['Goalundo Ganges','Ganges',[89.744,23.806]],
  ['Chandpur Ganges','Ganges',[90.63,23.22]],
  ['Chandpur Brahmaputra','Brahmaputra',[90.63,23.22]],
  ['Ganges en Bangladesh','Ganges',[88.50,24.10]],
  ['Meghna alto','Brahmaputra',[90.4,23.75]],
  ['Mithankot Norte','Indo',[70.60,29.55]]
 ].map(([label,river,coordinate])=>({label,river,...spot(river,coordinate)}));
 console.log('BENGAL_PARENT_DIAG_0414',JSON.stringify(targeted));
 const g=st.window.HexategosHimalayaGraph0406.prepare();
 function sampleNodes(label,lon,lat,radius,set){
  const near={lon,lat},list=[];
  for(const id of set){
   const p=g.coords.get(id);if(!p)continue;
   const km=Math.hypot((p.lon-lon)*111.2*Math.cos(lat*Math.PI/180),(p.lat-lat)*111.2);
   if(km<radius)list.push({id,km:+km.toFixed(1),lon:+p.lon.toFixed(2),lat:+p.lat.toFixed(2)});
  }
  list.sort((a,b)=>a.km-b.km);return {label,total:list.length,nearest:list.slice(0,4)};
 }
 const shore=new Set();
 for(const pair of g.coast){const ids=pair.split(':').map(Number);
  for(const id of ids)shore.add(id);}
 const picks=[
  ['Indo delta',67.75,24.08,'Indo'],['Indo NW',67.2,24.3,'Indo'],
  ['Ganges delta',89.2,22.4,'Ganges'],
  ['Hooghly',88.2,22.0,'Ganges'],['Meghna',90.7,22.6,'Brahmaputra'],
  ['Pusur',89.55,22.02,'Ganges'],['Padma',89.7,23.7,'Ganges']
 ];
 console.log('INDIAN_DELTA_MESH_0408',JSON.stringify(picks.map(([label,lon,lat,river])=>({
  label,coast:sampleNodes(label,lon,lat,240,shore),
  parent:sampleNodes(label,lon,lat,350,api.canonicalNodes(river))
 }))));
 console.log('INDIAN_RIVERS_0407',JSON.stringify({
  graphBuilds:api.graphBuilds(),vertices:api.graphSize(),
  resolved:ok.length,total:data.rivers.length,ok,failed
 }));
 assert.equal(api.graphBuilds(),1);
 assert.ok(api.graphSize()>1000);
 assert.equal(ok.length,data.rivers.length,'Rutas sin resolver: '+JSON.stringify(failed));
 const corr=st.window.HexategosIndianDeltas0408.corrections;
 for(const name of Object.keys(corr)){
  const c=api.validate(name);
  assert.ok(c?.ok&&c.correctedHub,name+' sin corrección');
  assert.ok(c.hubOnPath,name+' sin vértice de confluencia');
  assert.ok(c.geographicJoinKm<=corr[name].maxErrorKm,name+' error geográfico');
  assert.ok(c.sameVertex,name+' no empalma con cauce canónico');
  assert.equal(c.usesCoast,false,name);
  assert.equal(c.crossesVirtualWater,false,name);
 }
 const delta=st.window.HexategosIndianDeltaRoutes0408;
 assert.ok(delta);
 const groups={Indo:0,Brahmaputra:0,Ganges:0},validDeltas=[],failedDeltas=[];
 for(const channel of st.window.HexategosIndianDeltas0408.channels){
  const d=delta.validate(channel.name);
  if(!d?.ok){failedDeltas.push({name:channel.name,reason:d?.reason});continue}
  validDeltas.push({name:channel.name,edges:d.edges,shoreKm:+d.mouthKm.toFixed(1)});
  assert.equal(d.nativeShore,true,channel.name);
  assert.equal(d.endsAtShore,true,channel.name);
  assert.equal(d.startsAtParent,true,channel.name);
  assert.equal(d.usesCoast,false,channel.name);
  assert.equal(d.crossesVirtualWater,false,channel.name);
  groups[channel.basin]++;
 }
 console.log('INDIAN_DELTAS_0408',JSON.stringify({groups,validDeltas,failedDeltas,
  graphBuilds:delta.graphBuilds(),prepared:delta.prepared()}));
 assert.ok(validDeltas.length>=5,'Demasiados brazos sin ruta '+JSON.stringify(failedDeltas));
 assert.ok(groups.Indo>=2&&groups.Ganges>=1&&groups.Brahmaputra>=1,
  'Falta salida de alguna cuenca');
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),old);
});
