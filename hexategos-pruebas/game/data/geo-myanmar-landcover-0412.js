'use strict';
/* Atlas Myanmar 0.41.2 · ecotonos montañosos y llanuras monzónicas.
 * SÓLO RGB; no altera bioma jugable, producción ni geología.
 */
(function(){
 const data=window.HexategosMyanmarPhysical0412;if(!data)return;
 const cache=new Map(),rad=Math.PI/180;
 const clamp=t=>Math.max(0,Math.min(1,t));
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
 const gauss=(x,y,a,b,u,v)=>{
  const p=(x-a)/u,q=(y-b)/v;return Math.exp(-.5*(p*p+q*q));
 };
 const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-clamp(t))+b[i]*clamp(t)));
 const palette=Object.freeze({
  forest:[45,118,76],rainforest:[42,113,78],
  hill:[92,127,96],upland:[124,133,102],
  dry:[170,148,99],rice:[90,151,102],
  mangrove:[46,119,105],plain:[135,154,102],
  ridge:[142,133,111]
 });
 function evaluate(lat,lon){
  if(lat<8||lat>32||lon<89||lon>108)return null;
  const delta=gauss(lon,lat,95.38,16.8,2.05,2.0),
   valley=gauss(lon,lat,95.6,20.15,1.75,5.2),
   chin=gauss(lon,lat,93.9,22.3,1.45,4.6),
   kachin=gauss(lon,lat,97.25,26.3,2.5,3.1),
   shan=gauss(lon,lat,98.2,21.0,2.95,4.3),
   tenasserim=gauss(lon,lat,98.75,13.9,1.5,4.2),
   monsoon=gauss(lon,lat,96.1,17.7,3.2,3.0),
   dryZone=gauss(lon,lat,95.3,21.2,1.8,1.58),
   east=gauss(lon,lat,102,19.4,4.0,4.9);
  const env=Math.max(valley,chin,kachin,shan,tenasserim,delta, east*.70);
  const tX=smooth((lon-89.6)/3)*smooth((107.4-lon)/3.1),
   tY=smooth((lat-8.5)/2.2)*smooth((31.0-lat)/3.1);
  const weight=clamp(env*tX*tY);
  if(weight<.018)return null;
  let color=mix(palette.plain,palette.rice,Math.max(delta*.73,valley*.48));
  color=mix(color,palette.dry,dryZone*.79);
  color=mix(color,palette.forest,Math.max(chin*.60,kachin*.70,tenasserim*.67));
  color=mix(color,palette.rainforest,monsoon*.36+tenasserim*.23);
  color=mix(color,palette.mangrove,delta*.48);
  color=mix(color,palette.upland,shan*.51);
  color=mix(color,palette.ridge,Math.max(shan*.28,kachin*.31));
  return {weight,color,delta,mountains:Math.max(chin,kachin,shan,tenasserim),dryZone};
 }
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const j=i*3,y=L.centers[j+1]/32767;
  if(y<Math.sin(8*rad)||y>Math.sin(32*rad))return base;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<89||lon>108)return base;
  const lat=Math.asin(Math.max(-1,Math.min(1,y)))/rad;
  let entry=cache.get(key);
  if(!entry||entry.mesh!==L){entry={mesh:L,cells:new Map()};cache.set(key,entry)}
  let result=entry.cells.get(i);
  if(result===undefined){result=evaluate(lat,lon)||null;entry.cells.set(i,result)}
  return result?mix(base,result.color,result.weight*.79):base;
 }
 window.HexategosMyanmarLandcover0412=Object.freeze({
  version:'0.41.2',palette,evaluate,rgbForCell,
  cachedCells:()=>[...cache.values()].reduce((n,v)=>n+v.cells.size,0)
 });
})();