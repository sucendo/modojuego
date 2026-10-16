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
 const km=(a,b)=>Math.hypot((a.lon-b.lon)*111.2*
   Math.cos((a.lat+b.lat)*Math.PI/360),(a.lat-b.lat)*111.2);
 const failureDiagnostics=failed.map(f=>{
  const item=data.features.find(x=>x.name===f.name),G=graph.prepare(item.region);
  const pts=item.points,parts=pts.slice(1).map((pt,i)=>({
   from:pts[i],to:pt,solved:!!graph.solve([pts[i],pt],item.region).path
  }));
  let shore=[];
  if(item.mouth){
   const point={lon:item.mouth[0],lat:item.mouth[1]};
   const nodes=new Set();
   for(const x of G.coast)for(const id of x.split(':'))nodes.add(+id);
   shore=[...nodes].filter(id=>G.coords.has(id))
    .map(id=>({id,km:km(point,G.coords.get(id)),coordinate:G.coords.get(id)}))
    .sort((a,b)=>a.km-b.km).slice(0,3)
    .map(x=>({id:x.id,km:+x.km.toFixed(1),
      location:[+x.coordinate.lon.toFixed(2),+x.coordinate.lat.toFixed(2)]}));
  }
  return {name:f.name,parts,shore};
 });
 console.log('ASIA_FAILURE_DIAG_0416',JSON.stringify(failureDiagnostics));
 assert.equal(result.length,data.features.length);
 assert.equal(graph.builds(),data.zones.length);
 assert.ok(succeeded.length>=58,'Regresión en los 58 trazados regionales L8 ya validados');
 for(const item of succeeded){
  const v=api.validate(item.name);
  assert.equal(v.usesCoast,false,item.name);
  assert.equal(v.crossesVirtualWater,false,item.name);
  assert.equal(v.allAdjacent,true,item.name);
  assert.equal(v.nativeMouth,true,item.name);
 }
 st.terrainStrategicFill3247=()=> 'rgb(142,146,130)';
 load('atlas-asia-completion-water-0416.js',atlas);
 const water=st.window.HexategosAsiaCompletionWater0416;
 const cells=new Map(data.lakes.map(x=>[x.name,new Set()]));
 for(let i=0;i<L.n;i++){
  const name=water.isWater('8',i,L)?.name;
  if(name)cells.get(name)?.add(i);
 }
 const stats={};
 for(const [name,ids] of cells){
  let parts=0;
  const rem=new Set(ids);
  while(rem.size){
   parts++;
   const [first]=rem,stack=[first];rem.delete(first);
   while(stack.length){
    const k=stack.pop();
    for(let e=L.offsets[k];e<L.offsets[k+1];e++){
     const other=L.edgeNbr[e];
     if(rem.delete(other))stack.push(other);
    }
   }
  }
  stats[name]={cells:ids.size,components:parts};
 }
 console.log('ASIA_COMPLETION_LAKES_L8_0416',JSON.stringify(stats));
 assert.ok(stats['Lago Baikal'].cells>0,'Baikal debe estar visible');
 assert.equal(Object.values(stats).filter(x=>x.cells>0).length,6,
  'Los seis lagos deben ocupar celdas L8');
 for(const [lake,x] of Object.entries(stats)){
  assert.ok(x.cells>=1,lake+' no ocupa celdas');
  assert.equal(x.components,1,lake+' deja islas visuales de agua sin conectar');
 }
 assert.equal(water.diagnostics().changesLand,false);
 load('atlas-asian-lakes-0417.js',atlas);
 const thin=st.window.HexategosAsianLakes0417;
 assert.ok(thin&&thin.enabled);
 const lakeRoutes=thin.inspectAll();
 console.log('ASIAN_LAKES_EUROPEAN_STYLE_L8_0417',JSON.stringify(lakeRoutes));
 assert.equal(lakeRoutes.length,19);
 for(const item of lakeRoutes){
  const v=thin.validate(item.name);
  assert.equal(v.crossesCoast,false,item.name+' pintaría una costa oceánica');
  assert.equal(v.contiguous,true,item.name+' tiene recorrido no conectado');
  assert.ok(['edge','point'].includes(v.kind),item.name+' no representado');
 }
 // Ejercitar el propio dibujado, no solamente la construcción de rutas.
 // Así se comprueba también la capa sobre el canvas y el paso de nombres.
 st.ctx.arc=()=>{};st.ctx.fill=()=>{};
 const rendered=thin.draw(2400,600,450);
 assert.equal(rendered,19,'Deben dibujarse los 19 lagos y símbolos subhexagonales');
 assert.equal(thin.isDrawn('Lago Baikal'),true);
 assert.equal(thin.isDrawn('Lago Balkhash'),true);
 assert.equal(thin.isDrawn('Manasarovar'),true);
 assert.equal(thin.isDrawn('Mar de Aral'),true);
 // Las cuatro tintas anteriores ahora deben devolver la superficie
 // original: ni un hexágono completo se colorea como lago asiático.
 const firstLake=[...cells.get('Lago Baikal')][0];
 assert.ok(Number.isInteger(firstLake));
 assert.equal(st.terrainStrategicFill3247('8',firstLake,L,1,1),
  'rgb(142,146,130)','Se mantiene el tinte azul de hexágono entero');
 assert.equal(Buffer.from(L.land.buffer).toString('base64'),original);
});
