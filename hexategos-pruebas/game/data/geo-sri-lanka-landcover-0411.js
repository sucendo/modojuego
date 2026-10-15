'use strict';
/* 0.41.1 · clima visual de Sri Lanka: húmedo SW, tierras altas,
 * zona seca norte/este. Solo RGB en celdas TERRESTRES nativas L8.
 */
(function(){
 const data=window.HexategosSriLankaPhysical0411;
 if(!data)return;
 const cache=new Map(),rad=Math.PI/180;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const g=(x,y,a,b,sx,sy)=>{
  const u=(x-a)/sx,v=(y-b)/sy;return Math.exp(-.5*(u*u+v*v));
 };
 const mix=(a,b,t)=>a.map((x,i)=>Math.round(x*(1-clamp(t))+b[i]*clamp(t)));
 const palette=Object.freeze({
  dry:[164,158,108],grass:[122,156,93],
  wet:[67,141,91],rainforest:[41,114,81],
  highland:[94,137,106],rock:[145,133,113],shore:[116,164,116]
 });
 function evaluate(lat,lon){
  if(lat<5.1||lat>10.4||lon<78.8||lon>82.35)return null;
  const mask=Math.max(g(lon,lat,80.65,7.68,1.19,1.81),
   g(lon,lat,79.96,8.98,.77,.91));
  if(mask<.025)return null;
  const moist=g(lon,lat,80.25,6.55,.84,1.05);
  const dry=Math.max(g(lon,lat,80.70,8.67,.98,1.12),
   .68*g(lon,lat,81.50,7.36,.62,1.30));
  const ridge=g(lon,lat,80.72,7.12,.46,.71);
  const coast=Math.max(g(lon,lat,79.96,7.50,.35,1.7),
    g(lon,lat,81.45,7.6,.33,1.5));
  const taper=clamp(Math.min((lon-78.8)/.5,(82.35-lon)/.5,
    (lat-5.1)/.6,(10.4-lat)/.6));
  const weight=clamp(mask*.9*taper);
  let color=mix(palette.grass,palette.dry,dry*.74);
  color=mix(color,palette.wet,moist*.62);
  color=mix(color,palette.rainforest,moist*.53);
  color=mix(color,palette.highland,ridge*.69);
  color=mix(color,palette.rock,ridge*.13);
  color=mix(color,palette.shore,coast*.29);
  return {weight,color,moist,dry,ridge};
 }
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const j=i*3,y=L.centers[j+1]/32767;
  if(y<Math.sin(5.1*rad)||y>Math.sin(10.4*rad))return base;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<78.8||lon>82.35)return base;
  const lat=Math.asin(Math.max(-1,Math.min(1,y)))/rad;
  let m=cache.get(key);
  if(!m||m.mesh!==L){m={mesh:L,values:new Map()};cache.set(key,m)}
  let v=m.values.get(i);
  if(v===undefined){v=evaluate(lat,lon)||null;m.values.set(i,v)}
  return v?mix(base,v.color,v.weight*.82):base;
 }
 window.HexategosSriLankaLandcover0411=Object.freeze({
  version:'0.41.1',evaluate,rgbForCell,palette,
  cachedCells:()=>[...cache.values()].reduce((n,v)=>n+v.values.size,0)
 });
})();