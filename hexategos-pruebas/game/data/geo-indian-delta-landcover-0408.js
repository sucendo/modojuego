'use strict';
/* 0.40.8: vegetación húmeda, llanuras mareales y Sundarbans.
 * Color CONTINUO, cartográfico: sin clasificar suelos de juego, sin
 * transformar L.land, sin alterar potencial natural ni navegación.
 * Caché dispersa: sólo asigna entradas a hexágonos del delta.
 */
(function(){
 const data=window.HexategosIndianDeltas0408;
 if(!data)return;
 const rad=Math.PI/180,cache=new Map();
 const clamp=t=>Math.max(0,Math.min(1,t));
 const gauss=(lon,lat,x,y,sx,sy)=>{
  const a=(lon-x)/sx,b=(lat-y)/sy;return Math.exp(-.5*(a*a+b*b));
 };
 const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-clamp(t))+b[i]*clamp(t)));
 const palette=Object.freeze({
  mud:[137,145,116],wet:[69,129,110],forest:[44,119,84],
  farm:[97,151,104],estuary:[75,138,130],sand:[166,157,119]
 });
 function evaluate(lat,lon){
  const indus=gauss(lon,lat,67.7,24.22,1.65,.90),
   indusMarsh=gauss(lon,lat,67.7,23.9,1.2,.54),
   bengal=gauss(lon,lat,89.5,23.12,3.1,1.75),
   mangrove=gauss(lon,lat,89.3,22.0,1.9,.72),
   meghna=gauss(lon,lat,90.65,22.6,1.0,.91);
  const weight=Math.max(indus,bengal);
  if(weight<.025)return null;
  let color=mix(palette.farm,palette.mud,indus*.65);
  color=mix(color,palette.sand,indusMarsh*.17);
  color=mix(color,palette.wet,Math.max(indusMarsh*.62,bengal*.54));
  color=mix(color,palette.forest,mangrove*.79);
  color=mix(color,palette.estuary,meghna*.46);
  return {weight:clamp(weight),color,mangrove,indus,bengal};
 }
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const k=i*3,latY=L.centers[k+1];
  if(latY<Math.sin(20*rad)*32767||latY>Math.sin(29*rad)*32767)return base;
  const lon=Math.atan2(L.centers[k],L.centers[k+2])/rad;
  if((lon<64||lon>72)&&(lon<85||lon>94))return base;
  const lat=Math.asin(Math.max(-1,Math.min(1,latY/32767)))/rad;
  let memo=cache.get(key);
  if(!memo||memo.mesh!==L){
   memo={mesh:L,colors:new Map()};cache.set(key,memo);
  }
  const hit=memo.colors.get(i);if(hit)return hit.slice();
  const sample=evaluate(lat,lon);
  if(!sample)return base;
  const color=mix(base,sample.color,sample.weight*.76);
  memo.colors.set(i,color);return color.slice();
 }
 window.HexategosIndianDeltaLandcover0408=Object.freeze({
  version:'0.40.8',evaluate,rgbForCell,palette,
  cachedCells:()=>[...cache.values()].reduce((n,v)=>n+v.colors.size,0)
 });
})();