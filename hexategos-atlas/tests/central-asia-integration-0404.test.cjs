'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const atlas=path.resolve(__dirname,'..'),game=path.resolve(atlas,'../hexategos-pruebas');
const read=(p)=>fs.readFileSync(p,'utf8');
test('Asia Central: los dos juegos y Atlas cargan idéntica geografía sin tocar los guardados',()=>{
 const mods=['geo-central-asia-physical-0404.js','atlas-central-asia-routes-0404.js',
  'atlas-central-asia-water-0404.js'];
 const atlasPage=read(path.join(atlas,'index.html'));
 for(const n of mods)assert.ok(atlasPage.includes(n),'No cargado en Atlas: '+n);
 assert.ok(atlasPage.indexOf(mods[0])<atlasPage.indexOf(mods[1]));
 assert.ok(atlasPage.indexOf(mods[1])<atlasPage.indexOf('atlas-regions-0390.js'));
 assert.ok(atlasPage.indexOf(mods[2])>atlasPage.indexOf('atlas-landcover-0391.js'));
 for(const dir of ['game','toponimos-game']){
  const p=path.join(game,dir),html=read(path.join(p,'index.html'));
  for(const n of mods)assert.ok(html.includes(n),dir+' '+n);
  assert.ok(html.indexOf(mods[0])<html.indexOf(mods[1]));
  assert.ok(html.indexOf(mods[2])>html.indexOf('atlas-integration-0400.js'));
  const bridge=read(path.join(p,'js/atlas-bridge-0400.js'));
  const integration=read(path.join(p,'js/atlas-integration-0400.js'));
  assert.ok(bridge.includes('visibleCentralAsia'));
  assert.ok(integration.includes('bridge.visibleCentralAsia()'));
  assert.ok(!integration.includes('L.land[i]='));
  assert.ok(!integration.includes('owner6='));
 }
 for(const f of ['atlas-central-asia-routes-0404.js','atlas-central-asia-water-0404.js']){
  const text=read(path.join(atlas,f));
  new vm.Script(text,{filename:f});
  assert.ok(!text.includes('setInterval('));
  assert.ok(!text.includes('L.land[i]='));
  assert.ok(!text.includes('owner6='));
 }
 const geo=read(path.join(game,'game/data/geo-central-asia-physical-0404.js'));
 const context={window:{}};
 vm.runInNewContext(geo,context);
 const d=context.window.HexategosCentralAsiaPhysical0404;
 assert.equal(d.waterBodies.length,6);
 assert.equal(d.rivers.length,11);
 assert.equal(d.mountains.length,12);
 assert.ok(!d.rivers.some(x=>['Volga','Ural','Irtish'].includes(x.name)));
 assert.equal(d.bodyAt(60.73,46.21)?.name,'Aral septentrional');
 assert.equal(d.bodyAt(50.5,41.5),null,'El Caspio no se debe rasterizar de nuevo');
});
test('Asia Central: el filtro de aguas interiores respeta terreno, suministro y malla nativa',()=>{
 const body={name:'Lago de control'};
 const sandbox={
  window:{
   HexategosCentralAsiaPhysical0404:{
    waterBodies:[body],bodyAt:(lon,lat)=>lat>40&&lat<48&&lon>56&&lon<83?body:null
   },
   HexategosGameAtlasBridge0400:{enabled:()=>true,visibleCentralAsia:()=>true}
  },
  terrainStrategicFill3247:()=> 'rgb(190,170,150)',
  mapMode3252:'supply',
  $:()=>({checked:true})
 };
 const rad=Math.PI/180,point=(lat,lon)=>[
  Math.round(32767*Math.cos(lat*rad)*Math.sin(lon*rad)),
  Math.round(32767*Math.sin(lat*rad)),
  Math.round(32767*Math.cos(lat*rad)*Math.cos(lon*rad))
 ];
 const L={n:2,centers:new Int16Array([...point(45,60),...point(45,60.1)]),
  land:new Int16Array([1,-1])};
 const old=[...L.land],before=[...L.centers];
 vm.runInNewContext(read(path.join(atlas,'atlas-central-asia-water-0404.js')),sandbox);
 assert.equal(sandbox.terrainStrategicFill3247('8',0,L,1,1),'rgb(190,170,150)');
 sandbox.mapMode3252='terrain';
 assert.notEqual(sandbox.terrainStrategicFill3247('8',0,L,1,1),'rgb(190,170,150)');
 assert.equal(sandbox.terrainStrategicFill3247('8',1,L,-1,1),'rgb(190,170,150)');
 assert.equal(sandbox.terrainStrategicFill3247('6',0,L,1,1),'rgb(190,170,150)');
 assert.deepEqual([...L.land],old);assert.deepEqual([...L.centers],before);
});
