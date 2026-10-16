'use strict';
/* Asia 0.41.6 · agua interior VISUAL sobre hexágonos L8 originales.
 * Ni modifica tierra/mar, ni rutas comerciales, puertos o guardados.
 * Los lagos de pocos hexágonos son esquemáticos, no costa geodésica.
 */
(function(){
 const data=window.HexategosAsiaCompletion0416;
 if(!data||typeof terrainStrategicFill3247!=='function')return;
 const previous=terrainStrategicFill3247,rad=Math.PI/180;
 const clamp=x=>Math.max(-1,Math.min(1,x));
 function isWater(key,i,L){
  if(key!=='8'||i<0||i>=L.n||L.land[i]<0)return null;
  const j=i*3,y=L.centers[j+1];
  if(y<Math.sin(-11*rad)*32767||y>Math.sin(57*rad)*32767)return null;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<97||lon>144)return null;
  const lat=Math.asin(clamp(y/32767))/rad;
  return data.bodyAt(lon,lat);
 }
 function enabled(){
  if($('lakes')?.checked===false)return false;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleAsiaRemaining()))return false;
  return typeof mapMode3252==='undefined'||
   mapMode3252==='terrain'||mapMode3252==='political';
 }
 terrainStrategicFill3247=function remainingAsiaWater0416(key,i,L,own,z){
  const base=previous(key,i,L,own,z);
  if(!enabled())return base;
  const lake=isWater(key,i,L);if(!lake)return base;
  const shade=.76+.24*Math.max(0,z),water=[36,132,168].map(v=>Math.round(v*shade));
  if(typeof mapMode3252==='undefined'||mapMode3252==='terrain')
   return 'rgb('+water.join(',')+')';
  const rgb=base.match(/\d+/g);
  if(!rgb||rgb.length<3)return base;
  return 'rgb('+water.map((v,k)=>Math.round(.77*v+.23*Number(rgb[k]))).join(',')+')';
 };
 window.HexategosAsiaCompletionWater0416=Object.freeze({
  version:'0.41.6',isWater,
  isBodyDrawn:name=>enabled()&&data.lakes.some(l=>l.name===name),
  nearby:(lat,lon)=>data.lakes.filter(l=>Math.hypot(
   (lon-l.center[0])*Math.cos(lat*rad),lat-l.center[1])<
    Math.max(...l.radii)*1.2).map(l=>l.name).slice(0,3),
  diagnostics:()=>({decorativeOnly:true,changesLand:false,navigable:false,
   lakes:data.lakes.map(l=>l.name)})
 });
})();
