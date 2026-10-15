'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const game=path.resolve(root,'../hexategos-pruebas/game');
const filename=path.join(game,'data/geo-central-asia-landcover-0405.js');
const script=fs.readFileSync(filename,'utf8');
const C=Object.fromEntries(['crops','irrigated','meadow','grass','deciduous','evergreen',
 'conifers','dehesa','shrub','steppe','rock','wetland','desert','savanna',
 'rainforest','tundra','ice'].map((s,i)=>[s,i]));
const types=Object.entries(C).map(([id])=>({id,name:id,color:[80,120,90]}));
function setup(){
 const st={window:{HexategosLandCover0391:{code:C,types,
  classify:()=>C.grass}},MAX_GAME_LEVEL3233:'8',
  mountainTier3212:new Uint8Array(4),
  terrainType3247:()=>'plain'};
 const context=vm.createContext(st);
 vm.runInContext(script,context,{filename});
 return {st,model:st.window.HexategosCentralAsiaLandcover0405};
}
test('Asia Central: 5 regiones climáticas diferentes y transición sin cortes rectangulares',()=>{
 new vm.Script(script,{filename});
 const {model}=setup();
 const points=[
  ['Karakum',39.0,59.5],['Kyzylkum',42.7,64.5],
  ['Kazakhstan',50.7,68.0],['Fergana',40.5,71.3],
  ['Tarim',38.8,83.4],['Junggar',46.1,85.6],
  ['Tian Shan',42,80.1],['Altai',49,89.0],
  ['Ili',43.65,77.4]
 ];
 for(const [name,lat,lon] of points){
  const a=model.evaluate(lat,lon,'plain',0),b=model.evaluate(lat,lon,'plain',0);
  assert.ok(a&&a.weight>.60,name+' has no local layer');
  assert.equal(a.color.length,3,name);
  assert.ok(a.color.every(x=>x>=0&&x<=255),name);
  assert.deepEqual(a,b,'Non-deterministic '+name);
 }
 const sample=Object.fromEntries(points.map(([name,lat,lon])=>[name,model.evaluate(lat,lon,'plain',0)]));
 console.log('CENTRAL_ASIA_CLIMATE_0405',JSON.stringify(
  Object.fromEntries(Object.entries(sample).map(([n,s])=>[n,{
   dry:+s.dry.toFixed(2),wet:+s.wet.toFixed(2),irrig:+s.irrig.toFixed(2),
   relief:+s.relief.toFixed(2),rgb:s.color
  }]))));
 assert.ok(sample.Karakum.dry>sample.Kazakhstan.dry,'Karakum should be drier than Kazakh steppe');
 assert.ok(sample.Tarim.dry>sample.Kazakhstan.dry,'Tarim should be a desert');
 assert.ok(sample.Fergana.irrig>sample.Karakum.irrig,'Fergana must contain irrigation');
 assert.ok(sample['Tian Shan'].relief>sample.Kyzylkum.relief,'Mountain band missing');
 assert.ok(model.envelope(40,-4)<.001,'Outside target region');
 assert.ok(model.envelope(40,80)>.80,'Inside target region');
 // Transition smooth along the Europe/Central-Asia handover
 for(const lat of [38.5,43.0,48.0]){
  for(const baseLon of [44.0,58.5,61.0,96.0,100.0]){
   let prev=model.evaluate(lat,baseLon-.5,'plain',0);
   for(let j=0;j<=10;j++){
    const cur=model.evaluate(lat,baseLon-.5+j*.1,'plain',0);
    if(prev&&cur){
     const delta=Math.max(...cur.color.map((x,k)=>Math.abs(x-prev.color[k])));
     assert.ok(delta<62,'Harsh chromatic seam at '+lat+','+baseLon+': '+delta);
    }
    prev=cur;
   }
  }
 }
});
test('Asia Central: shared ecological classifier is visual-only and cell RGB is cached',()=>{
 const {st,model}=setup();
 assert.equal(st.window.HexategosLandCover0391.version,'0.40.5');
 const toCartesian=(lat,lon)=>[
  Math.round(Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180)*32767),
  Math.round(Math.sin(lat*Math.PI/180)*32767),
  Math.round(Math.cos(lat*Math.PI/180)*Math.cos(lon*Math.PI/180)*32767)
 ];
 const L={n:4,land:new Int16Array([1,2,-1,1]),centers:new Int16Array([
  ...toCartesian(42,64),...toCartesian(40.5,71.3),...toCartesian(45,80),
  ...toCartesian(39,83)
 ])};
 const before=[...L.land],centers=[...L.centers],base=[130,148,101];
 for(let i=0;i<4;i++){
  const a=model.rgbForCell('8',i,L,base);
  assert.ok(a?.length===3);
  const b=model.rgbForCell('8',i,L,base);
  assert.deepEqual(a,b);
 }
 assert.deepEqual([...L.land],before);
 assert.deepEqual([...L.centers],centers);
 assert.equal(model.cacheBytes(),4*L.n);
 assert.ok(st.window.HexategosLandCover0391.classify(39,83,'plain',0)!==C.grass,
  'Tarim must classify distinct from plain grass');
});
test('Atlas + Pruebas import the exact same 0.40.5 module before painting',()=>{
 const atlas=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const moduleName='geo-central-asia-landcover-0405.js';
 assert.ok(atlas.includes(moduleName));
 assert.ok(atlas.indexOf(moduleName)<atlas.indexOf('atlas-landcover-0391.js'));
 const atlasPainter=fs.readFileSync(path.join(root,'atlas-landcover-0391.js'),'utf8');
 assert.ok(atlasPainter.includes('central.rgbForCell(key,i,L,raw)'));
 for(const dir of ['game','toponimos-game']){
  const html=fs.readFileSync(path.join(game,'../'+dir,'index.html'),'utf8');
  const adapter=fs.readFileSync(path.join(game,'../'+dir,'js/atlas-integration-0400.js'),'utf8');
  assert.ok(html.includes(moduleName),dir);
  assert.ok(html.indexOf(moduleName)<html.indexOf('atlas-integration-0400.js'));
  assert.ok(adapter.includes('centralEco.rgbForCell(key,i,L,rgb)'));
  assert.ok(!script.includes('owner6='));
  assert.ok(!script.includes('setInterval('));
 }
});
