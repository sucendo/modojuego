'use strict';
/* Ejecutar desde la raíz del repositorio:
 * node --test hexategos-atlas/tests/cartography-0399.test.cjs
 * No necesita navegador, red ni modificar partidas.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(ROOT,name),'utf8');
const sandbox={window:{},console,performance:{now:()=>1},DEG:180/Math.PI,
 zoom:12,currentKey:'8',vw:1200,vh:800,drawn:[[0],[1]]};
const RAD=Math.PI/180;
const vec=(lon,lat)=>[Math.cos(lat*RAD)*Math.sin(lon*RAD),
 Math.sin(lat*RAD),Math.cos(lat*RAD)*Math.cos(lon*RAD)];
const approx=(lon,lat)=>vec(lon,lat).map(n=>Math.round(n*32767));
const land=new Int16Array([4,-1]);
const L={land,centers:new Int16Array([...approx(12.68,55.88),...approx(11.93,55.60)]),
 faceCenters:new Int16Array([...approx(12.4,55.9),...approx(12.7,55.9),...approx(12.7,55.7)]),
 offsets:new Uint32Array([0,3,6]),adj:new Uint32Array([0,1,2,0,1,2])};
let fillCount=0,strokeCount=0,clipCount=0;
sandbox.ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},
 closePath(){},fill(){fillCount++},clip(){clipCount++},stroke(){strokeCount++}};
sandbox.lonLatVec=vec;
sandbox.projectVec=(x,y,z,R,cx,cy)=>[cx+R*x,cy-R*y,z];
sandbox.loadLevel=()=>L;
sandbox.nearestDetailed=()=>0;
const context=vm.createContext(sandbox);
const run=name=>vm.runInContext(read(name),context,{filename:name,timeout:10000});

test('Módulos del Atlas compilan sin errores de sintaxis',()=>{
 for(const name of ['atlas-core.js','atlas-ui.js','atlas-geography.js',
  'atlas-label-style-0399.js','atlas-coast-data-0399.js','atlas-coast-0399.js',
  'atlas-macro-0396.js','atlas-regions-0390.js','atlas-europe-straits-0397.js']){
  new vm.Script(read(name),{filename:name});
 }
});
run('atlas-coast-data-0399.js');
run('atlas-label-style-0399.js');
run('atlas-coast-0399.js');
run('atlas-europe-straits-0397.js');

test('Teselas vectoriales acotadas y sin alteración de la malla L8',()=>{
 const data=sandbox.window.HexategosAtlasCoastData0399;
 assert.equal(data.tiles.length,99);
 for(const [x,y,rings] of data.tiles)for(const ring of rings){
  assert.ok(ring.length>=3);
  for(const [lon,lat] of ring){
   assert.ok(lon>=x-.00011&&lon<=x+5.00011);
   assert.ok(lat>=y-.00011&&lat<=y+5.00011);
  }
 }
 assert.equal(read('atlas-coast-0399.js').includes('L.land[i]='),false);
 assert.equal(read('atlas-coast-0399.js').includes('setInterval('),false);
});

test('Agua azul, montañas marrones y regiones blancas',()=>{
 const labels=sandbox.window.HexategosAtlasLabelStyle0399;
 const samples=[
  ['Mar Mediterráneo','natural','water'],
  ['Ría de Vigo','natural','water'],
  ['Fiordo de Oslo','marine','water'],
  ['Pirineos','natural','mountain'],
  ['Montes Escandinavos','natural','mountain'],
  ['Selva Negra','natural','mountain'],
  ['Península Ibérica','land','land'],
  ['Submeseta Norte','natural','land']];
 for(const [name,kind,category] of samples)assert.equal(labels.category({name,kind}),category);
 for(const type of ['water','mountain','land'])assert.equal(labels.palette[type].length,3);
});

test('Øresund y golfos son mar, Selandia sigue siendo tierra',()=>{
 const coast=sandbox.window.HexategosAtlasCoast0399;
 const samples=[
  [12.68,55.88,false],[11.93,55.60,true],[13.1,55.8,true],
  [22.65,38.26,false],[21.52,38.23,false],[22.98,37.95,true],
  [-8.81,42.24,false],[-8.89,42.58,false],[10.58,59.6,false]];
 for(const [lon,lat,expected]of samples)
  assert.equal(coast.landAt(lon,lat),expected,'lon '+lon+', lat '+lat);
 assert.equal(coast.landAt(-74,40),null,'No cubre zonas fuera de Europa');
});

test('Se dibujan ambas máscaras sin modificar clasificaciones ni guardados',()=>{
 const before=Array.from(L.land);
 sandbox.window.HexategosAtlasCoast0399.draw(500,600,400);
 assert.ok(fillCount>0&&strokeCount>0&&clipCount===2);
 assert.deepEqual(Array.from(L.land),before);
 assert.equal(sandbox.window.HexategosAtlasCoast0399.diagnostics().enabled,true);
});

test('Los golfos y estrechos siguen conectados sin abrir el istmo de Corinto',()=>{
 const coast=sandbox.window.HexategosAtlasCoast0399;
 function waterPath(a,b,[west,south,east,north],step){
  const nx=Math.round((east-west)/step)+1,ny=Math.round((north-south)/step)+1;
  const wet=new Uint8Array(nx*ny),seen=new Uint8Array(nx*ny);
  const index=p=>Math.round((p[1]-south)/step)*nx+Math.round((p[0]-west)/step);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)
   wet[y*nx+x]=coast.landAt(west+x*step,south+y*step)===false?1:0;
  const start=index(a),goal=index(b);
  assert.ok(wet[start]&&wet[goal],'Las dos referencias deben ser mar real');
  const q=new Int32Array(nx*ny);let head=0,tail=1;q[0]=start;seen[start]=1;
  while(head<tail){
   const k=q[head++],x=k%nx,y=Math.floor(k/nx);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;
    const j=Y*nx+X;
    if(wet[j]&&!seen[j]){seen[j]=1;q[tail++]=j}
   }
  }
  return !!seen[goal];
 }
 assert.equal(waterPath([21.58,38.22],[22.68,38.23],
  [21.0,37.94,23.2,38.8],.024),true,'Corinto–Patras');
 assert.equal(waterPath([12.55,56.12],[12.65,55.53],
  [11.85,55.2,13.3,56.45],.015),true,'Øresund norte–sur');
 assert.equal(waterPath([-8.80,42.24],[-9.17,42.13],
  [-9.3,41.95,-8.45,42.45],.01),true,'Ría de Vigo–Atlántico');
 assert.equal(waterPath([-8.89,42.58],[-9.25,42.59],
  [-9.5,42.30,-8.60,42.88],.01),true,'Ría de Arousa–Atlántico');
 assert.equal(waterPath([22.85,38.05],[23.15,37.90],
  [22.7,37.75,23.25,38.2],.01),false,'El istmo NO puede abrirse');
});

test('Se omiten los topónimos marítimos que la escala 50m no resuelve',()=>{
 const atlas=sandbox.window.HexategosAtlasStraits0397;
 const byName=name=>atlas.features.find(f=>f.name===name);
 for(const name of ['Øresund','Golfo de Corinto','Ría de Vigo'])
  assert.equal(atlas.valid(byName(name)),true,name);
 assert.equal(atlas.valid(byName('Ría de Ferrol')),false);
 assert.equal(atlas.valid(byName('Selandia')),true);
});

test('Relevo de zoom y capas hidrográficas previas conservadas',()=>{
 const html=read('index.html'),macro=read('atlas-macro-0396.js'),
  regions=read('atlas-regions-0390.js'),core=read('atlas-core.js');
 const at=s=>html.indexOf(s);
 assert.ok(at('atlas-label-style-0399.js')<at('atlas-macro-0396.js'));
 assert.ok(at('atlas-coast-0399.js')<at('atlas-europe-straits-0397.js'));
 assert.ok(core.indexOf('HexategosAtlasCoast0399?.draw')<core.indexOf('drawTerrain3212(R,cx,cy);',core.indexOf('function render(')));
 assert.ok(macro.includes('handoffZoom=5.55'));
 assert.ok(regions.includes('zoom<handoffZoom'));
 assert.ok(read('atlas-europe-lakes-0396.js').includes('lakeRoute'));
 assert.ok(read('atlas-iberia-edges-v2.js').includes('riverMouthDiagnostics'));
 assert.ok(read('atlas-europe-hydro-0395.js').includes('skipsCoastalEdge'));
});
