'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Los módulos esenciales del Atlas conservan sintaxis válida',()=>{
 for(const name of ['atlas-core.js','atlas-ui.js','atlas-geography.js',
   'atlas-label-style-0399.js','atlas-macro-0396.js',
   'atlas-regions-0390.js','atlas-europe-straits-0397.js',
   'atlas-europe-secondary-0396.js','atlas-europe-lakes-0396.js',
   'atlas-iberia-edges-v2.js']){
  new vm.Script(read(name),{filename:name});
 }
});

test('Las costas siguen las aristas hexagonales; no hay litoral vectorial superpuesto',()=>{
 const html=read('index.html'),core=read('atlas-core.js');
 assert.ok(!html.includes('atlas-coast-0399.js'));
 assert.ok(!html.includes('atlas-coast-data-0399.js'));
 assert.ok(!core.includes('HexategosAtlasCoast0399'));
 assert.ok(!fs.existsSync(path.join(root,'atlas-coast-0399.js')));
 assert.ok(!fs.existsSync(path.join(root,'atlas-coast-data-0399.js')));
 assert.ok(core.includes('const coast=(geoA<0)!=(geoB<0)'));
 assert.ok(core.includes('drawTerrain3212(R,cx,cy);'));
});

test('Paleta uniforme: aguas azul, montañas marrón y tierras blanco cálido',()=>{
 const sandbox={window:{}};
 vm.runInNewContext(read('atlas-label-style-0399.js'),vm.createContext(sandbox));
 const api=sandbox.window.HexategosAtlasLabelStyle0399;
 const examples=[
  ['Mar Mediterráneo','natural','water'],['Golfo de Vizcaya','water','water'],
  ['Ría de Vigo','natural','water'],['Fiordo de Oslo','natural','water'],
  ['Lago de Sanabria','lake','water'],['Río Tajo','river','water'],
  ['Øresund','strait','water'],['Pirineos','natural','mountain'],
  ['Sierra Morena','natural','mountain'],['Macizo Central','natural','mountain'],
  ['Montes Escandinavos','natural','mountain'],['Selva Negra','natural','mountain'],
  ['Península Ibérica','land','land'],['Europa Oriental','region','land'],
  ['Submeseta Norte','natural','land'],['Selandia','island','land']
 ];
 for(const [name,kind,expected] of examples)
  assert.equal(api.category({name,kind}),expected,name);
 assert.notEqual(api.color({kind:'water'}),api.color({kind:'mountain'}));
 assert.notEqual(api.color({kind:'mountain'}),api.color({kind:'land'}));
 assert.match(api.color({kind:'land'}),/^rgba\(246,245,237,/);
});

test('Los dos renderizadores usan una misma paleta y no pierden los halos',()=>{
 const macro=read('atlas-macro-0396.js'),regions=read('atlas-regions-0390.js');
 for(const src of [macro,regions]){
  assert.ok(src.includes('HexategosAtlasLabelStyle0399'));
  assert.ok(src.includes('labelStyle.color('));
  assert.ok(src.includes('ctx.strokeText('));
  assert.ok(src.includes('ctx.fillText('));
 }
});

test('Persiste el relevo entre macrotopónimos y nombres regionales',()=>{
 const macro=read('atlas-macro-0396.js'),regions=read('atlas-regions-0390.js'),html=read('index.html');
 assert.ok(macro.includes('handoffZoom=5.55'));
 assert.ok(macro.includes("toLocaleUpperCase('es-ES')"));
 assert.ok(regions.includes('zoom<handoffZoom'));
 assert.ok(regions.includes('lastBoxes.some('));
 assert.ok(html.indexOf('atlas-label-style-0399.js')<html.indexOf('atlas-macro-0396.js'));
 assert.ok(html.indexOf('atlas-label-style-0399.js')<html.indexOf('atlas-regions-0390.js'));
});

test('Las etiquetas de islas y estrechos se validan contra L8; sin costas externas',()=>{
 const s=read('atlas-europe-straits-0397.js');
 assert.ok(s.includes("loadLevel('8')"));
 assert.ok(s.includes('nearestDetailed('));
 assert.ok(s.includes("feature.kind==='strait'?land<0:land>=0"));
 assert.ok(!s.includes('HexategosAtlasCoast0399'));
});

test('Se mantienen ríos, desembocaduras, montañas y lagos con la malla previa',()=>{
 const html=read('index.html'),core=read('atlas-core.js');
 for(const name of ['atlas-iberia-edges-v2.js','atlas-europe-hydro-0395.js',
   'atlas-europe-mountains-0396.js','atlas-europe-secondary-0396.js',
   'atlas-europe-lakes-0396.js'])assert.ok(html.includes(name));
 assert.ok(read('atlas-europe-lakes-0396.js').includes('lakeRoute'));
 assert.ok(read('atlas-iberia-edges-v2.js').includes('riverMouthDiagnostics'));
 assert.ok(core.includes('HexategosEuropeLakes0396?.draw'));
});


test('La pintura efectiva del canvas respeta los tres colores de macrotopónimos y regiones',()=>{
 function mockContext(zoom){
  const painted=[];
  const canvas={fillStyle:'',strokeStyle:'',lineWidth:0,
   save(){},restore(){},strokeText(){},measureText(s){return {width:s.length*6}},
   fillText(label){painted.push({label,color:this.fillStyle,stroke:this.strokeStyle})}};
  const world={
   window:{HexategosAtlasLabelStyle0399:null},
   zoom,vw:13000,vh:6500,ctx:canvas,
   $:()=>({checked:true,value:'natural'}),
   lonLatVec:(lon,lat)=>[lon,lat,1],
   projectVec:(lon,lat)=>[lon*80+4000,lat*55,1],
   loadLevel:()=>({faceCenters:new Int16Array(0)}),
   MAP_RIVERS3242:[],MOUNTAIN_NETWORKS3242:[],
   escapeHTML:s=>s,console
  };
  const context=vm.createContext(world);
  const run=name=>vm.runInContext(read(name),context,{filename:name,timeout:10000});
  run('atlas-label-style-0399.js');
  return {world,painted,run};
 }
 const macro=mockContext(4.65);
 macro.run('atlas-macro-0396.js');
 macro.world.window.HexategosAtlasMacro0396.draw(1000,4000,2500);
 const find=(out,label)=>out.find(x=>x.label===label);
 const iberia=find(macro.painted,'PENÍNSULA IBÉRICA');
 const alpes=find(macro.painted,'ALPES');
 const baltico=find(macro.painted,'Mar Báltico');
 for(const [entry,color] of [
  [iberia,'rgba(246,245,237,'],[alpes,'rgba(231,165,105,'],
  [baltico,'rgba(137,215,238,']]){
  assert.ok(entry,'No se ha dibujado el macrotopónimo esperado');
  assert.ok(entry.color.startsWith(color),entry.label+' => '+entry.color);
  assert.ok(entry.stroke.startsWith('rgba(7,18,28,'));
 }
 const regional=mockContext(8);
 regional.world.window.HexategosGeoRegions0390={
  politicalRegions:[],
  physicalRegions:[
   {name:'Submeseta Norte',center:[-5,42],priority:70,minZoom:5},
   {name:'Sistema Central',center:[-4,40],priority:80,minZoom:5},
   {name:'Mar de Irlanda',center:[-5.65,53.9],priority:85,minZoom:5}
  ],
  regionsAt:()=>({natural:[],historical:null})
 };
 regional.world.window.HexategosAtlasMacro0396={
  occupied:()=>[],handoffZoom:5.55
 };
 regional.run('atlas-regions-0390.js');
 regional.world.window.HexategosAtlasRegions0390.draw(1000,4000,2500);
 for(const [name,color] of [
  ['Submeseta Norte','rgba(246,245,237,'],
  ['Sistema Central','rgba(231,165,105,'],
  ['Mar de Irlanda','rgba(137,215,238,']]){
  const entry=find(regional.painted,name);
  assert.ok(entry,'No se ha dibujado la región '+name);
  assert.ok(entry.color.startsWith(color),name+' => '+entry.color);
  assert.equal(entry.stroke,'rgba(7,18,28,.88)');
 }
});


test('Atlas físico compartido de Hexategos Pruebas: entrada real y alternativa',()=>{
 const gameRoot=path.resolve(root,'../hexategos-pruebas');
 const dataRoot=path.join(gameRoot,'game/data');
 for(const file of ['iberia-physical-atlas-v1.js','geo-europe-regions-0395.js',
  'geo-europe-detail-0396.js','geo-landcover-0391.js',
  'geo-europe-landcover-0395.js','geo-europe-secondary-0396.js'])
  assert.ok(fs.existsSync(path.join(dataRoot,file)),'Falta dato común '+file);
 const modules=[
  'atlas-iberia-edges-v2.js','atlas-europe-hydro-0395.js',
  'atlas-europe-mountains-0396.js','atlas-europe-secondary-0396.js',
  'atlas-europe-lakes-0396.js','atlas-label-style-0399.js',
  'atlas-macro-0396.js','atlas-europe-straits-0397.js','atlas-regions-0390.js'
 ];
 for(const dir of ['game','toponimos-game']){
  const folder=path.join(gameRoot,dir),html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
  const pre=fs.readFileSync(path.join(folder,'js/atlas-bridge-0400.js'),'utf8');
  const post=fs.readFileSync(path.join(folder,'js/atlas-integration-0400.js'),'utf8');
  new vm.Script(pre);new vm.Script(post);
  const a=html.indexOf('js/atlas-bridge-0400.js'),b=html.indexOf('js/atlas-integration-0400.js');
  assert.ok(a>html.indexOf('js/game.js')&&b>a,'Puente debe seguir al motor');
  for(const name of modules){
   const where=html.indexOf('../../hexategos-atlas/'+name);
   assert.ok(where>a&&where<b,'Módulo compartido fuera de orden: '+name);
  }
  assert.ok(html.includes('id="landingAtlasPhysical0400"'));
  assert.ok(pre.includes('window.__atlasOriginalTerrain0400=drawTerrain3212'));
  assert.ok(post.includes('drawGeographicLabels3243=function'));
  assert.ok(post.includes("mapMode3252!=='terrain'&&mapMode3252!=='political'"));
  assert.ok(!post.includes('owner6='));
  assert.ok(!post.includes('L.land[i]='));
  assert.ok(!post.includes('setInterval('));
  assert.ok(!html.includes('atlas-coast-0399.js'));
 }
});


test('Puente jugable: compatibilidad de dibujo, apagado y suministro',()=>{
 const folder=path.resolve(root,'../hexategos-pruebas/game/js');
 const readGame=name=>fs.readFileSync(path.join(folder,name),'utf8');
 const calls={base:0,enriched:0,oldLabels:0,macro:0,regions:0};
 const element={checked:true,addEventListener(){}};
 const L={
  n:1,land:new Int16Array([1]),
  centers:new Int16Array([Math.round(Math.sin(10*Math.PI/180)*Math.cos(55*Math.PI/180)*32767),
    Math.round(Math.sin(55*Math.PI/180)*32767),
    Math.round(Math.cos(55*Math.PI/180)*Math.cos(10*Math.PI/180)*32767)])
 };
 const w={
  window:{
   HexategosAtlasMacro0396:{draw(){calls.macro++}},
   HexategosAtlasRegions0390:{draw(){calls.regions++}},
   HexategosLandCover0391:{types:[{color:[38,120,67]}],classify:()=>0}
  },
  localStorage:{getItem(){return null},setItem(){}},
  document:{getElementById:()=>element},
  drawTerrain3212(){calls.base++},
  drawGeographicLabels3243(){calls.oldLabels++},
  terrainStrategicFill3247(){return 'rgb(60,70,80)'},
  terrainType3247(){return 'forest'},
  shadedRGB3247:(rgb)=>'rgb('+rgb.join(',')+')',
  MAX_GAME_LEVEL3233:'8',mountainTier3212:new Uint8Array(1),
  zoom:6,yaw:-10*Math.PI/180,pitch:55*Math.PI/180,
  showLabels:true,mapMode3252:'political',needsRender:false,console
 };
 const context=vm.createContext(w);
 vm.runInContext(readGame('atlas-bridge-0400.js'),context);
 const originalTerrain=w.window.__atlasOriginalTerrain0400;
 assert.equal(typeof originalTerrain,'function');
 w.drawTerrain3212=()=>{calls.enriched++};
 vm.runInContext(readGame('atlas-integration-0400.js'),context);
 w.drawTerrain3212(1000,500,500);
 assert.equal(calls.enriched,1);
 w.drawGeographicLabels3243(1000,500,500);
 assert.equal(calls.macro,1);assert.equal(calls.regions,1);
 assert.notEqual(w.terrainStrategicFill3247('8',0,L,1,1),'rgb(60,70,80)');
 w.mapMode3252='supply';
 assert.equal(w.terrainStrategicFill3247('8',0,L,1,1),'rgb(60,70,80)');
 w.mapMode3252='political';
 w.window.HexategosGameAtlasBridge0400.setEnabled(false);
 w.drawTerrain3212(1000,500,500);
 assert.equal(calls.base,1);
 w.drawGeographicLabels3243(1000,500,500);
 assert.equal(calls.oldLabels,1);
 assert.equal(w.terrainStrategicFill3247('8',0,L,1,1),'rgb(60,70,80)');
 w.window.HexategosGameAtlasBridge0400.setEnabled(true);
 w.yaw=125*Math.PI/180; // cámara sobre América: no activar rótulos asiáticos
 w.drawTerrain3212(1000,500,500);
 assert.equal(calls.base,2);
 w.drawGeographicLabels3243(1000,500,500);
 assert.equal(calls.oldLabels,2);
});


test('Atlas Asia 0.40.1: regiones compartidas, colores, zoom y puente jugable',()=>{
 const dataPath=path.resolve(root,'../hexategos-pruebas/game/data/geo-asia-regions-0401.js');
 const code=fs.readFileSync(dataPath,'utf8');
 new vm.Script(code,{filename:'geo-asia-regions-0401.js'});
 const box={window:{}};
 vm.runInNewContext(code,box);
 const asia=box.window.HexategosAsiaRegions0401;
 assert.equal(asia.macro.length,52);
 assert.equal(asia.naturalRegions.length,78);
 assert.ok(asia.macro.some(r=>r.name==='Himalaya'&&r.kind==='mountain'));
 assert.ok(asia.macro.some(r=>r.name==='Mar de Japón'&&r.kind==='water'));
 assert.ok(asia.naturalAt(28.8,83).some(r=>r.name==='Himalaya Central'));
 assert.ok(asia.naturalAt(36.4,116).some(r=>r.name==='Llanura del Norte de China'));
 assert.equal(asia.naturalAt(40,-4).length,0);
 const labels={window:{}};
 vm.runInNewContext(read('atlas-label-style-0399.js'),labels);
 const classify=labels.window.HexategosAtlasLabelStyle0399.category;
 assert.equal(classify({kind:'mountain',name:'Himalaya'}),'mountain');
 assert.equal(classify({kind:'land',name:'Meseta del Tíbet'}),'land');
 assert.equal(classify({kind:'water',name:'Mar de Japón'}),'water');
 const macro=read('atlas-macro-0396.js'),region=read('atlas-regions-0390.js');
 assert.ok(macro.includes('HexategosAsiaRegions0401?.macro'));
 assert.ok(region.includes('asia?.naturalRegions'));
 assert.ok(region.includes('asia?.naturalAt(lat,lon)'));
 const html=read('index.html');
 assert.ok(html.indexOf('geo-asia-regions-0401.js')<html.indexOf('atlas-macro-0396.js'));
 for(const dir of ['game','toponimos-game']){
  const folder=path.resolve(root,'../hexategos-pruebas/'+dir);
  const gameHtml=fs.readFileSync(path.join(folder,'index.html'),'utf8');
  const bridge=fs.readFileSync(path.join(folder,'js/atlas-bridge-0400.js'),'utf8');
  const game=fs.readFileSync(path.join(folder,'js/atlas-integration-0400.js'),'utf8');
  new vm.Script(bridge);new vm.Script(game);
  assert.ok(gameHtml.includes('geo-asia-regions-0401.js'));
  assert.ok(gameHtml.indexOf('geo-asia-regions-0401.js')<gameHtml.indexOf('atlas-macro-0396.js'));
  assert.ok(bridge.includes('visibleAsia'));
  assert.ok(game.includes('bridge.visibleAsia()'));
  assert.ok(!game.includes('L.land[i]='));
  assert.ok(!game.includes('owner6='));
 }
});


test('Ecotonos 0.40.2: se suavizan los cortes rectangulares sin alterar L8',()=>{
 const shared=path.resolve(root,'../hexategos-pruebas/game/data/geo-landcover-transitions-0402.js');
 const code=fs.readFileSync(shared,'utf8');
 new vm.Script(code,{filename:'geo-landcover-transitions-0402.js'});
 const untouched=[1,3,5,7];
 let classifications=0;
 const ctx={
  window:{HexategosLandCover0391:{
   types:[{color:[20,100,40]},{color:[215,178,108]}],
   classify(lat,lon,biome){
    classifications++;
    return biome==='forest'?0:1;
   }
  }},
  terrainClimateCode3247:(lat)=>lat>=40?5:3,
  TERRAIN_CODES3247:['plain','ice','tundra','desert','rainforest','forest'],
  COUNTRY_ISO:['ESP','CHN'],
  MAX_GAME_LEVEL3233:'8',
  mountainTier3212:new Uint8Array(4),
  console
 };
 vm.runInNewContext(code,ctx);
 const api=ctx.window.HexategosLandCoverTransitions0402;
 assert.ok(api);
 const at=(lat,lon)=>api.preview(lat,lon,'CHN',0);
 const south=at(35,65),north=at(45,65);
 assert.ok(south[0]>north[0]);
 // La franja de transición no es un corte de 195 unidades entre
 // dos casillas vecinas: se calculan colores intermedios reproducibles.
 const samples=[];
 for(let i=0;i<=100;i++)samples.push(at(37+i*.06,66));
 assert.ok(samples.some(c=>c[0]>20&&c[0]<215),'Falta mezcla en el ecotono');
 let maxDiff=0;
 for(let i=1;i<samples.length;i++)
  maxDiff=Math.max(maxDiff,Math.abs(samples[i][0]-samples[i-1][0]));
 assert.ok(maxDiff<150,'Salto excesivo entre celdas próximas: '+maxDiff);
 assert.deepEqual(at(40,66),at(40,66),'Determinismo cromático');
 // No hay mutación de ninguna matriz del juego.
 const scale=32767,rad=Math.PI/180,make=(lat,lon)=>[
  Math.round(Math.cos(lat*rad)*Math.sin(lon*rad)*scale),
  Math.round(Math.sin(lat*rad)*scale),
  Math.round(Math.cos(lat*rad)*Math.cos(lon*rad)*scale)
 ];
 const L={n:4,land:new Int16Array(untouched),centers:new Int16Array([
  ...make(39.5,65),...make(40,65),...make(40.5,65),...make(41,65)
 ])};
 const snapshot=[...L.land],centers=[...L.centers];
 for(let i=0;i<4;i++)assert.ok(api.color('8',i,L)?.length===3);
 const calls=classifications;
 for(let i=0;i<4;i++)api.color('8',i,L);
 assert.equal(classifications,calls,'La misma celda no debe reclasificarse');
 assert.deepEqual([...L.land],snapshot);
 assert.deepEqual([...L.centers],centers);
 assert.equal(api.cacheBytes(),L.n*4);
});

test('Atlas y los dos juegos activan el suavizado sin mezclar capas estratégicas',()=>{
 const html=read('index.html');
 assert.ok(html.includes('geo-landcover-transitions-0402.js'));
 assert.ok(html.indexOf('geo-landcover-transitions-0402.js')<html.indexOf('atlas-landcover-0391.js'));
 assert.ok(read('atlas-landcover-0391.js').includes('ecotone?.color(key,i,L)'));
 for(const dir of ['game','toponimos-game']){
  const folder=path.resolve(root,'../hexategos-pruebas/'+dir);
  const h=fs.readFileSync(path.join(folder,'index.html'),'utf8');
  const src=fs.readFileSync(path.join(folder,'js/atlas-integration-0400.js'),'utf8');
  assert.ok(h.includes('geo-landcover-transitions-0402.js'));
  assert.ok(h.indexOf('geo-landcover-transitions-0402.js')<h.indexOf('atlas-integration-0400.js'));
  assert.ok(src.includes('regionWeight('));
  assert.ok(src.includes('ecotones?.color(key,i,L)'));
  assert.ok(src.includes("mapMode3252!=='terrain'&&mapMode3252!=='political'"));
  assert.ok(!src.includes('owner6='));
  assert.ok(!src.includes('L.land[i]='));
 }
});
