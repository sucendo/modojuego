'use strict';
/* HEXATEGOS 0.40.9 · ecozonas del Decán, Ghats y costas.
 * Solo RGB visual de celdas L8; nunca toca biome, suelo, IA ni geología.
 * Transición suave hacia Himalaya al norte y deltas al este.
 */
(function(){
 const physical=window.HexategosPeninsularIndiaPhysical0409;
 if(!physical)return;
 const PI=Math.PI,rad=PI/180,cache=new Map();
 const clamp=t=>Math.max(0,Math.min(1,t));
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
 const gauss=(x,y,a,b,u,v)=>{
  const p=(x-a)/u,q=(y-b)/v;return Math.exp(-.5*(p*p+q*q));
 };
 const mix=(a,b,t)=>a.map((v,k)=>Math.round(v*(1-clamp(t))+b[k]*clamp(t)));
 const palette=Object.freeze({
  basalt:[140,126,106],dry:[166,147,102],scrub:[151,154,106],
  farmland:[110,146,91],wet:[82,146,98],forest:[49,122,84],
  montane:[61,116,93],ridge:[134,127,110],coast:[99,159,109]
 });
 function evaluate(lat,lon){
  if(lat<5.9||lat>29||lon<66.5||lon>91)return null;
  const west=gauss(lon,lat,74.9,16.4,1.05,5.1),
   southWest=gauss(lon,lat,76.3,11.2,1.20,3.3),
   easternRidge=gauss(lon,lat,81.15,16.8,1.05,4.7),
   decan=gauss(lon,lat,78.1,17.6,5.45,5.6),
   maharashtra=gauss(lon,lat,75.4,19.5,3,2.55),
   karnataka=gauss(lon,lat,76.3,14,2.8,2.6),
   telangana=gauss(lon,lat,79.0,17.3,2.65,2.7),
   nilgiri=gauss(lon,lat,76.8,11.3,.9,1.1),
   moistCoast=Math.max(gauss(lon,lat,75.5,11.4,1.4,3),
    gauss(lon,lat,73.35,17.3,1,2.8)),
   eastCoast=gauss(lon,lat,81.25,15.1,1.5,4.1),
   odisha=gauss(lon,lat,85,20.4,1.6,2.3),
   satpura=gauss(lon,lat,78.0,22.4,4.3,.9);
  const area=Math.max(decan*.86,west,southWest,easternRidge,
   moistCoast,eastCoast,odisha,satpura);
  const taperX=smooth((lon-67.5)/2)*smooth((89.0-lon)/3);
  const taperY=smooth((lat-6.9)/2)*smooth((27.4-lat)/3.2);
  const weight=clamp(area*taperX*taperY);
  if(weight<.025)return null;
  let color=mix(palette.scrub,palette.basalt,.48*decan+.28*maharashtra);
  color=mix(color,palette.dry,Math.max(telangana*.58,karnataka*.55)*.76);
  color=mix(color,palette.farmland,Math.max(decan*.36,eastCoast*.47));
  color=mix(color,palette.forest,west*.67+southWest*.25);
  color=mix(color,palette.montane,nilgiri*.7+Math.max(west,easternRidge)*.18);
  color=mix(color,palette.ridge,satpura*.38+easternRidge*.43);
  color=mix(color,palette.wet,moistCoast*.46+odisha*.36);
  color=mix(color,palette.coast,eastCoast*.25);
  return {weight,color,moist:clamp(west+moistCoast+nilgiri),
   arid:clamp(telangana*.72+karnataka*.38),plateau:decan,
   ridge:Math.max(west,easternRidge,satpura,nilgiri)};
 }
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const j=i*3,y=L.centers[j+1];
  if(y<Math.sin(5.9*rad)*32767||y>Math.sin(29*rad)*32767)return base;
  const lat=Math.asin(Math.max(-1,Math.min(1,y/32767)))/rad,
   lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<66.5||lon>91)return base;
  let entry=cache.get(key);
  if(!entry||entry.mesh!==L){entry={mesh:L,colors:new Map()};cache.set(key,entry)}
  // El sombreado depende de base y del zoom: guardar la mezcla sólo
  // por celda y malla no permite reutilizarla cuando base cambie;
  // por eso cacheamos el factor físico, sin almacenar colores finales.
  let sample=entry.colors.get(i);
  if(sample===undefined){
   sample=evaluate(lat,lon)||null;
   entry.colors.set(i,sample);
  }
  return sample?mix(base,sample.color,sample.weight*.82):base;
 }
 window.HexategosPeninsularIndiaLandcover0409=Object.freeze({
  version:'0.40.9',palette,evaluate,rgbForCell,
  cachedCells:()=>[...cache.values()].reduce((n,v)=>n+v.colors.size,0)
 });
})();