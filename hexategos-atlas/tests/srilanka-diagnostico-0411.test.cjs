'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const home=path.resolve(__dirname,'../../hexategos-pruebas/game/data');
function decode(s,T){const packed=s[0]==='~',b=Buffer.from(packed?s.slice(1):s,'base64');return new T(new Uint8Array(packed?zlib.inflateSync(b):b).buffer)}
test('Sri Lanka y Palk: diagnóstico de la malla L8 real', {timeout:150000},()=>{
 const st={window:{},console:{info(){},warn(){}}},ctx=vm.createContext(st);
 function load(file){vm.runInContext(fs.readFileSync(path.join(home,file),'utf8'),ctx,{filename:file,timeout:35000})}
 load('bootstrap.js');load('mesh-8-init.js');
 for(const name of fs.readdirSync(home).filter(x=>/^mesh-8-(?:centers|land|offsets|edgeNbr)-\d+\.js$/.test(x)).sort())load(name);
 const raw=st.DATA['8'],L={n:raw.n};
 for(const [name,T] of Object.entries({centers:Int16Array,land:Int16Array,offsets:Uint32Array,edgeNbr:Int32Array}))
  L[name]=decode(raw[name],T);
 const rad=Math.PI/180,spots=[
 ['Palk Norte',79.7,9.52],['Palk central',79.70,9.27],['Palk sur',79.77,9.05],
 ['Puente de Adán',79.54,9.10],['Pamban / Rameswaram',79.35,9.29],
 ['Talaimannar',79.72,9.09],['Mannar',79.87,8.98],['Jaffna',80.02,9.68],
 ['Isla Delft',79.72,9.49],['Kachchatheevu',79.52,9.39],
 ['Golfo Mannar',79.44,8.51],['Bahía de Palk',80.17,9.31],
 ['Sri Lanka norte',80.28,9.24],['Sri Lanka media',80.62,7.35],
 ['Colombo',79.86,6.90],['Kandy',80.63,7.30],['Matara',80.54,5.95],
 ['Península India',78.99,9.26],['Isla India SE',79.13,9.05],
 ['Puttalam',79.83,8.05],['Laguna Jaffna',80.13,9.57]];
 const results=spots.map(([name,lon,lat])=>{
  let id=-1,km=Infinity;const c=Math.cos(lat*rad);
  for(let i=0;i<L.n;i++){
   const k=i*3,y=L.centers[k+1]/32767;
   const pLat=Math.asin(Math.max(-1,Math.min(1,y)))/rad;
   if(Math.abs(pLat-lat)>1.6)continue;
   const pLon=Math.atan2(L.centers[k],L.centers[k+2])/rad;
   const d=Math.hypot((pLat-lat)*111.2,(pLon-lon)*111.2*c);
   if(d<km){km=d;id=i}
  }
  return {name,id,km:+km.toFixed(1),land:id>=0?L.land[id]:null};
 });
 const ids=Object.fromEntries(results.map(x=>[x.name,x.id]));
 // Chequeo de continuidad exclusivamente por vecinos nativos de tierra.
 const bfs=(a,b)=>{
  const src=ids[a],dst=ids[b],seen=new Set([src]),todo=[src];
  let reads=0;
  for(let at=0;at<todo.length&&reads<12000;at++){
   const i=todo[at];reads++;
   if(i===dst)return {connected:true,visited:reads};
   for(let e=L.offsets[i];e<L.offsets[i+1];e++){
    const j=L.edgeNbr[e];if(j<0||L.land[j]<0||seen.has(j))continue;
    seen.add(j);todo.push(j);
   }
  }
  return {connected:false,visited:reads,limit:reads>=12000};
 };
 const continuity=(L.land[ids['Península India']]>=0&&L.land[ids['Sri Lanka norte']]>=0)?
 bfs('Península India','Sri Lanka norte'):null;
 console.log('SRILANKA_L8_DIAG_0411',JSON.stringify({points:results,continuity,meshCells:L.n}));
 assert.ok(results.some(x=>x.name==='Kandy'&&x.land>=0));
});