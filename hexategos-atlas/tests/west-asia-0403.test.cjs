'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const game=path.resolve(root,'../hexategos-pruebas/game');
const data=fs.readFileSync(path.join(game,'data/geo-west-asia-physical-0403.js'),'utf8');
const moduleCode=fs.readFileSync(path.join(root,'atlas-west-asia-0403.js'),'utf8');

test('Oriente Próximo: datos físicos compartidos, sin duplicar los trazados originales',()=>{
 new vm.Script(data);
 new vm.Script(moduleCode);
 const x={window:{}};
 vm.runInNewContext(data,x);
 const d=x.window.HexategosWestAsiaPhysical0403;
 assert.equal(d.rivers.length,13);
 assert.equal(d.mountains.length,10);
 assert.equal(d.lakes.length,4);
 for(const r of [...d.rivers,...d.mountains]){
  assert.ok(r.points.length>=3,r.name);
  for(const p of r.points)assert.ok(p[0]>=25&&p[0]<=67&&p[1]>=12&&p[1]<=49,r.name);
 }
 for(const lake of d.lakes)assert.ok(lake.axis.length>=3);
 const canonicalR=new Set(Object.keys(d.canonical.rivers));
 const canonicalM=new Set(Object.keys(d.canonical.mountains));
 for(const r of d.rivers)assert.ok(!canonicalR.has(r.name),'Duplicado '+r.name);
 for(const m of d.mountains)assert.ok(!canonicalM.has(m.name),'Duplicado '+m.name);
 assert.ok(!d.lakes.some(x=>x.name==='Lago de Van'),'Van ya está en Europa');
 const geo=fs.readFileSync(path.join(root,'atlas-geography.js'),'utf8');
 for(const r of canonicalR)assert.ok(geo.includes('"n":"'+r+'"'),r);
 for(const m of canonicalM)assert.ok(geo.includes('"n":"'+m+'"'),m);
});

test('Oriente Próximo: resolución diferida sobre vértices y aristas terrestres L8',()=>{
 const rad=Math.PI/180;
 const point=(lat,lon)=>[
  Math.round(Math.cos(lat*rad)*Math.sin(lon*rad)*32767),
  Math.round(Math.sin(lat*rad)*32767),
  Math.round(Math.cos(lat*rad)*Math.cos(lon*rad)*32767)
 ];
 const face=new Int16Array([
  ...point(35,40),...point(35,40.25),...point(35,40.5),
  ...point(35,40.75),...point(35.2,40.3)
 ]);
 const L={
  n:4,faceCenters:face,
  centers:new Int16Array([...point(35.08,40.12),...point(35.08,40.32),...point(35.08,40.57),...point(35.08,40.75)]),
  land:new Int16Array([1,1,1,-1]),
  offsets:new Uint32Array([0,3,6,9,9]),
  adj:new Uint32Array([0,1,4,1,2,4,2,3,4]),
  edgeNbr:new Int32Array([-1,1,-1,0,2,-1,1,3,-1])
 };
 const P={n:1,centers:new Int16Array(point(35,40.3))};
 const groups={offsets:new Uint32Array([0,3]),ids:new Uint32Array([0,1,2])};
 const ownerBefore=[...L.land],facesBefore=[...L.faceCenters],centersBefore=[...L.centers];
 const input={
  rivers:[
   {name:'Río interior',points:[[40,35],[40.5,35]],mouth:false,minZoom:7,maxWidth:80},
   {name:'Río costero',points:[[40,35],[40.5,35],[40.75,35]],mouth:true,minZoom:7,maxWidth:80}
  ],
  mountains:[{name:'Montes de prueba',points:[[40,35],[40.25,35],[40.5,35]],minZoom:7,elevationM:2500}],
  lakes:[{name:'Lago de prueba',axis:[[40,35],[40.25,35],[40.5,35]],widthKm:25,minZoom:6}],
  bounds:{west:25,east:67,south:12,north:49},
  canonical:{rivers:{},mountains:{}}
 };
 let baseDraws=0,strokes=0,levelLoads=0;
 const host={
  window:{HexategosWestAsiaPhysical0403:input},
  drawTerrain3212(){baseDraws++},
  loadLevel(level){levelLoads++;return level==='8'?L:P},
  loadGroups(){return groups},
  zoom:1,vw:1000,vh:800,
  $:()=>({checked:true}),
  ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++}},
  lonLatVec:(lon,lat)=>point(lat,lon).map(v=>v/32767),
  projectVec:()=>[450,300,1],
  console:{info(){},warn(){}}
 };
 vm.runInNewContext(moduleCode,host);
 const api=host.window.HexategosWestAsia0403;
 assert.ok(api);
 assert.equal(api.graphBuilds(),0,'No crear grafo al cargar');
 host.drawTerrain3212(1000,500,400);
 assert.equal(baseDraws,1);
 assert.equal(levelLoads,0,'Sin trabajo L8 a zoom lejano');
 host.zoom=9;
 host.drawTerrain3212(1000,500,400);
 assert.equal(api.graphBuilds(),1);
 for(const name of ['Río interior','Río costero','Montes de prueba','Lago de prueba']){
  const route=api.inspect(name);
  assert.ok(route?.length>=2,'Ruta L8 omitida: '+name);
  for(const id of route)assert.ok(Number.isInteger(id)&&id>=0&&id<face.length/3);
  for(let j=1;j<route.length;j++){
   const a=route[j-1],b=route[j];
   const connected=new Set();
   for(let i=0;i<3;i++){
    for(let k=L.offsets[i],end=L.offsets[i+1];k<end;k++){
     const u=L.adj[k],v=L.adj[k+1<end?k+1:L.offsets[i]];
     connected.add([u,v].sort((a,b)=>a-b).join(':'));
    }
   }
   assert.ok(connected.has([a,b].sort((a,b)=>a-b).join(':')),'Arista inventada '+name);
   assert.ok(!([a,b].includes(2)&&[a,b].includes(3)),'Arista costera pintada '+name);
  }
 }
 const initialStrokes=strokes;
 const painted=api.drawLakes(1000,500,400);
 assert.equal(painted,1);assert.ok(strokes>initialStrokes);
 assert.ok(api.isDrawn('Lago de prueba'));
 assert.ok(api.isDrawnFeature('Río interior'));
 assert.equal(api.graphBuilds(),1,'Un solo grafo cacheado');
 assert.deepEqual([...L.land],ownerBefore);
 assert.deepEqual([...L.faceCenters],facesBefore);
 assert.deepEqual([...L.centers],centersBefore);
 assert.equal(api.drawLakes(1000,500,400),1);
 assert.equal(api.graphBuilds(),1);
});

test('Oriente Próximo: Atlas y Pruebas cargan una sola fuente y conservan el guardado',()=>{
 const read=(p)=>fs.readFileSync(p,'utf8');
 const atlas=read(path.join(root,'index.html')),core=read(path.join(root,'atlas-core.js'));
 const markers=['geo-west-asia-physical-0403.js','atlas-west-asia-0403.js'];
 for(const marker of markers)assert.ok(atlas.includes(marker),marker);
 assert.ok(atlas.indexOf(markers[0])<atlas.indexOf(markers[1]));
 assert.ok(atlas.indexOf(markers[1])<atlas.indexOf('atlas-regions-0390.js'));
 assert.ok(core.includes('HexategosWestAsia0403?.drawLakes'));
 const labels=read(path.join(root,'atlas-regions-0390.js'));
 assert.ok(labels.includes('westAsia?.isDrawnFeature'));
 assert.ok(labels.includes('westAsia?.isDrawn'));
 for(const dir of ['game','toponimos-game']){
  const dirroot=path.resolve(game,'../'+dir),html=read(path.join(dirroot,'index.html'));
  const bridge=read(path.join(dirroot,'js/atlas-bridge-0400.js'));
  const integration=read(path.join(dirroot,'js/atlas-integration-0400.js'));
  for(const marker of markers)assert.ok(html.includes(marker),dir+': '+marker);
  assert.ok(html.indexOf(markers[0])<html.indexOf(markers[1]));
  assert.ok(html.indexOf(markers[1])<html.indexOf('atlas-integration-0400.js'));
  assert.ok(bridge.includes('visibleWestAsia'));
  assert.ok(integration.includes('bridge.visibleWestAsia()'));
  assert.ok(integration.includes('HexategosWestAsia0403?.drawLakes'));
  assert.ok(integration.includes('HexategosEuropeLakes0396?.draw'));
  assert.ok(!moduleCode.includes('owner6='));
  assert.ok(!moduleCode.includes('L.land[i]='));
  assert.ok(!moduleCode.includes('setInterval('));
 }
});
