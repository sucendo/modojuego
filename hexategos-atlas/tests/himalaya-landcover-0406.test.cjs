'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const home=path.resolve(__dirname,'../../hexategos-pruebas/game/data');
const names=['crops','irrigated','meadow','grass','deciduous','evergreen',
 'conifers','dehesa','shrub','steppe','rock','wetland','desert','savanna',
 'rainforest','tundra','ice'];
const C=Object.fromEntries(names.map((x,i)=>[x,i]));
function setup(){
 const ctx=vm.createContext({window:{HexategosLandCover0391:{
  code:C,types:names.map(name=>({name,color:[110,120,95]})),
  classify:()=>C.grass}},MAX_GAME_LEVEL3233:'8',
  mountainTier3212:new Uint8Array(6),terrainType3247:()=>'plain'});
 for(const f of ['geo-himalaya-physical-0406.js','geo-himalaya-landcover-0406.js'])
  vm.runInContext(fs.readFileSync(path.join(home,f),'utf8'),ctx,{filename:f});
 return {ctx,m:ctx.window.HexategosHimalayaLandcover0406};
}
test('Paletas Himalaya: Thar, Ganges, pie de monte, Tíbet y nieves',()=>{
 const {m}=setup();
 const p={
  thar:m.evaluate(26.4,71.7),ganges:m.evaluate(26.3,82.3),
  piedemonte:m.evaluate(28,82),tibet:m.evaluate(33.9,86.5),
  himalaya:m.evaluate(29.3,83.5),assam:m.evaluate(26.4,93.4),
  easternForest:m.evaluate(28.3,92.7)
 };
 for(const [key,v] of Object.entries(p)){
  assert.ok(v?.weight>.4,key);
  assert.ok(v.color.every(c=>Number.isFinite(c)&&c>=0&&c<=255),key);
  assert.deepEqual(v,m.evaluate(
   ({thar:26.4,ganges:26.3,piedemonte:28,tibet:33.9,himalaya:29.3,
    assam:26.4,easternForest:28.3})[key],
   ({thar:71.7,ganges:82.3,piedemonte:82,tibet:86.5,himalaya:83.5,
    assam:93.4,easternForest:92.7})[key]));
 }
 assert.ok(p.thar.aridity>p.ganges.aridity,'Thar must be arid');
 assert.ok(p.ganges.fields>p.thar.fields,'Ganges must be cultivated');
 assert.ok(p.himalaya.relief>p.ganges.relief,'Himalaya ridge missing');
 assert.ok(p.easternForest.forest>p.thar.forest,'Eastern forest missing');
 assert.ok(p.tibet.aridity>p.ganges.aridity,'Cold Tibetan plateau missing');
 assert.ok(m.envelope(51,40)<.005,'Color field outside Asia');
 for(const lat of [26.5,29.3,33.0,36.4])for(const lon of [68,74,81,88,94,100]){
  const a=m.evaluate(lat,lon)?.color,b=m.evaluate(lat,lon+.1)?.color;
  if(!a||!b)continue;
  assert.ok(Math.max(...a.map((v,i)=>Math.abs(v-b[i])))<35,
   'Artificial color seam at '+lon+','+lat);
 }
});
test('Caché L8 sin mutar suelo ni datos de partida',()=>{
 const {ctx,m}=setup(),rad=Math.PI/180;
 const xyz=(lat,lon)=>[
  Math.round(Math.cos(lat*rad)*Math.sin(lon*rad)*32767),
  Math.round(Math.sin(lat*rad)*32767),
  Math.round(Math.cos(lat*rad)*Math.cos(lon*rad)*32767)
 ];
 const L={n:6,centers:new Int16Array([
  ...xyz(26.4,71.7),...xyz(26.3,82.3),...xyz(33.9,86.5),
  ...xyz(29.3,83.5),...xyz(30.72,90.65),...xyz(26.4,93.4)]),
  land:new Int16Array([1,1,1,1,-1,1])};
 const original=[...L.land],base=[120,125,100];
 for(let i=0;i<L.n;i++){
  const a=m.rgbForCell('8',i,L,base);
  const b=m.rgbForCell('8',i,L,base);
  assert.deepEqual(a,b);
 }
 assert.deepEqual([...L.land],original);
 assert.equal(m.cacheBytes(),L.n*4);
 assert.notEqual(ctx.window.HexategosLandCover0391.classify(26.4,71.7),C.grass);
});
