'use strict';
/* Tonlé Sap 0.41.5 · cobertura acuática visual por celdas L8 originales.
 * Nunca modifica L.land, owner6, rutas marítimas, el guardado ni IA.
 */
(function(){
 const data=window.HexategosIndochinaPhysical0415;
 if(!data||typeof terrainStrategicFill3247!=='function')return;
 const base=terrainStrategicFill3247,rad=Math.PI/180;
 const clamp=x=>Math.max(-1,Math.min(1,x));
 function isWater(key,i,L){
  if(key!=='8'||i<0||i>=L.n||L.land[i]<0)return null;
  const j=i*3,y=L.centers[j+1];
  if(y<Math.sin(11.9*rad)*32767||y>Math.sin(13.5*rad)*32767)return null;
  const lat=Math.asin(clamp(y/32767))/rad;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<103.0||lon>105.1)return null;
  return data.bodyAt(lon,lat);
 }
 function available(){
  if(!($('lakes')?.checked??true))return false;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleIndochina()))return false;
  return typeof mapMode3252==='undefined'||
   mapMode3252==='terrain'||mapMode3252==='political';
 }
 terrainStrategicFill3247=function indochinaLakeColor0415(key,i,L,own,z){
  const original=base(key,i,L,own,z);
  if(window.HexategosAsianLakes0417?.enabled)return original;
  if(!available())return original;
  const lake=isWater(key,i,L);if(!lake)return original;
  const tint=[39,135,167],shaded=tint.map(v=>Math.round(v*(.75+.25*Math.max(0,z))));
  if(typeof mapMode3252==='undefined'||mapMode3252==='terrain')
   return 'rgb('+shaded.join(',')+')';
  const parent=original.match(/\d+/g);
  if(!parent||parent.length<3)return original;
  return 'rgb('+shaded.map((v,k)=>Math.round(v*.80+Number(parent[k])*.20)).join(',')+')';
 };
 window.HexategosIndochinaWater0415=Object.freeze({
  version:'0.41.5',isWater,isBodyDrawn:name=>available()&&
   data.lakes.some(x=>x.name===name),
  nearby:(lat,lon)=>data.lakes.filter(x=>
   Math.hypot((x.center[0]-lon)*Math.cos(lat*rad),x.center[1]-lat)<1.3).map(x=>x.name),
  diagnostics:()=>({visualOnly:true,navigable:false,landMutated:false})
 });
})();
