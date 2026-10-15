'use strict';
/* HEXATEGOS 0.41.1 · aguas someras Palk/Mannar SOLO SOBRE AGUA L8.
 * Nunca modifica L.land, costa, rutas marítimas o tierra/islas.
 */
(function(){
 const data=window.HexategosSriLankaPhysical0411;
 if(!data||typeof terrainStrategicFill3247!=='function')return;
 const base=terrainStrategicFill3247,cache=new Map(),rad=Math.PI/180;
 const clamp=x=>Math.max(0,Math.min(1,x));
 function evaluate(lat,lon){
  if(lon<78.4||lon>81.2||lat<7.4||lat>10.1)return null;
  let weight=0,tone=[62,146,165];
  for(const s of data.shoals){
   const x=(lon-s.center[0])/s.radii[0],
    y=(lat-s.center[1])/s.radii[1],
    t=s.strength*Math.exp(-.5*(x*x+y*y));
   if(t>weight){weight=t;tone=s.tone}
  }
  return weight>.018?{weight,tone}:null;
 }
 function tint(key,i,L,baseColor){
  if(key!=='8'||L.land[i]>=0)return baseColor;
  const j=i*3,y=L.centers[j+1]/32767;
  if(y<Math.sin(7.4*rad)||y>Math.sin(10.1*rad))return baseColor;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<78.4||lon>81.2)return baseColor;
  let m=cache.get(key);
  if(!m||m.mesh!==L){m={mesh:L,values:new Map()};cache.set(key,m)}
  let entry=m.values.get(i);
  if(entry===undefined){
   const lat=Math.asin(Math.max(-1,Math.min(1,y)))/rad;
   entry=evaluate(lat,lon)||null;m.values.set(i,entry);
  }
  if(!entry)return baseColor;
  const rgb=String(baseColor).match(/\d+(?:\.\d+)?/g);
  if(!rgb||rgb.length<3)return baseColor;
  const next=entry.tone.map((v,k)=>Math.round(Number(rgb[k])*(1-entry.weight)+v*entry.weight));
  return 'rgb('+next.join(',')+')';
 }
 terrainStrategicFill3247=function atlasSriLankaShallows0411(key,i,L,own,z){
  const original=base(key,i,L,own,z);
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleSriLanka()))return original;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return original;
  return tint(key,i,L,original);
 };
 window.HexategosSriLankaShallows0411=Object.freeze({
  version:'0.41.1',evaluate,tint,
  virtualOnly:true,changesGameplayLand:false,
  cachedCells:()=>[...cache.values()].reduce((n,v)=>n+v.values.size,0)
 });
})();