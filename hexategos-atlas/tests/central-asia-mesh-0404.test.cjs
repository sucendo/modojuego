'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'../../hexategos-pruebas/game/data');
test('Diagnóstico geográfico de agua interior de Asia Central en malla L8',()=>{
 const context=vm.createContext({window:{}});
 const load=n=>vm.runInContext(fs.readFileSync(path.join(root,n),'utf8'),context,{filename:n,timeout:20000});
 load('bootstrap.js');load('mesh-5.js');load('mesh-8-init.js');
 for(const n of fs.readdirSync(root).filter(n=>/^mesh-8-(?:centers|faceCenters|offsets|adj|edgeNbr|land)-\d+\.js$/.test(n)).sort())load(n);
 function decode(str,Type){
  const b=Buffer.from(str.startsWith('~')?str.slice(1):str,'base64');
  const raw=str.startsWith('~')?zlib.inflateSync(b):b;
  return new Type(new Uint8Array(raw).buffer);
 }
 const src=context.DATA['8'],L={n:src.n,centers:decode(src.centers,Int16Array),land:decode(src.land,Int16Array)};
 assert.equal(L.land.length,L.n);
 const samples=[
 ['Caspio centro',50.5,41.5],['Caspio norte',48.7,46.7],['Caspio sur',51.6,37.6],
 ['Caspio este',53.4,40.3],['Caspio oeste',47.8,42.7],
 ['Aral norte',60.5,46.1],['Aral sur',59.9,44.0],['Aral centro',60.4,45.0],
 ['Balkhash este',76.5,46.3],['Balkhash oeste',73.8,46.2],['Issyk-Kul',77.25,42.45],
 ['delta Amu Daria',59.1,43.8],['delta Sir Daria',61.0,46.0],
 ['desembocadura Ural',51.8,47.0],['desembocadura Kura',48.9,40.3],
 ['desembocadura Ili',75.1,45.3],['Terek delta',46.75,43.6]
 ];
 const out=[];
 for(const [name,lon,lat] of samples){
  let best=Infinity,near=-1,water=0,waterKm=Infinity;
  for(let i=0;i<L.n;i++){
   const j=i*3,la=Math.asin(Math.max(-1,Math.min(1,L.centers[j+1]/32767)))*180/Math.PI;
   if(Math.abs(la-lat)>2)continue;
   const lo=Math.atan2(L.centers[j],L.centers[j+2])*180/Math.PI;
   const km=Math.hypot((lo-lon)*111.2*Math.cos(lat*Math.PI/180),(la-lat)*111.2);
   if(km<best){best=km;near=i;}
   if(L.land[i]<0&&km<waterKm){waterKm=km;water=i}
  }
  out.push({name,nearestKm:+best.toFixed(1),land:L.land[near]>=0?'land':'water',waterKm:+waterKm.toFixed(1)});
 }
 console.log('CENTRAL_ASIA_WATER_L8',JSON.stringify(out));
});
