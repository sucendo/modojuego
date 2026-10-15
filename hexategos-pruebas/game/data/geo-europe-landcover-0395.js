'use strict';
/* HEXATEGOS ATLAS · Vegetación europea 0.39.5.
 * Datos deterministas por coordenadas; no satélite ni cartografía parcelaria.
 * Reutiliza el clasificador compartido sin cambiar la simulación.
 */
(function(){
 const previous=window.HexategosLandCover0391;
 if(!previous)return;
 const C=previous.code,pi=Math.PI;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const patch=(x,y,x0,y0,rx,ry)=>Math.exp(-.5*((x-x0)/rx)**2-.5*((y-y0)/ry)**2);
 function hash(a,b,salt){
  let v=(Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^salt)>>>0;
  v=Math.imul(v^(v>>>13),1274126177);
  return ((v^(v>>>16))>>>0)/4294967295;
 }
 const smooth=t=>t*t*(3-2*t);
 function noise(x,y,salt){
  const i=Math.floor(x),j=Math.floor(y),a=smooth(x-i),b=smooth(y-j);
  const w=hash(i,j,salt),e=hash(i+1,j,salt),sw=hash(i,j+1,salt),se=hash(i+1,j+1,salt);
  return (w*(1-a)+e*a)*(1-b)+(sw*(1-a)+se*a)*b;
 }
 function patches(lon,lat,salt){
  const x=lon*Math.cos(lat*pi/180);
  return noise(x/1.3,lat/1.3,salt)*.46+
    noise(x/.38,lat/.38,salt^0x721a)*.36+
    noise(x/.13,lat/.13,salt^0xa31b)*.18;
 }
 function classify(lat,lon,biome='plain',tier=0){
  if(!Number.isFinite(lat)||!Number.isFinite(lon))return -1;
  // Iberia está calibrada por separado y permanece EXACTAMENTE como estaba.
  if(!(lat>=35.4&&lat<72.3&&lon>=-25.3&&lon<=61)||
      lat>35.5&&lat<44.3&&lon>-10.2&&lon<4.5)
   return previous.classify(lat,lon,biome,tier);
  if(biome==='sea'||biome==='ice'||biome==='desert'||biome==='highmountain'||tier>=3)
   return previous.classify(lat,lon,biome,tier);
  const wood=patches(lon,lat,0x4711),clear=patches(lon,lat,0x5833);
  const alpine=Math.max(patch(lon,lat,9.5,46.4,3.2,.85),
    patch(lon,lat,23.2,47.4,5.3,.80),
    patch(lon,lat,15.4,63.3,3.9,5.5),
    patch(lon,lat,43,43.5,3.9,1));
  const wetWest=Math.max(patch(lon,lat,-5,54.0,6.0,4.0),
    patch(lon,lat,1.8,49.8,6.5,3.6),
    patch(lon,lat,18,59.0,12.0,7.0));
  const eastDry=patch(lon,lat,33.7,47.4,10.0,3.4);
  const southDry=patch(lon,lat,19.8,39.9,11.5,3.4);
  const cropbelt=Math.max(patch(lon,lat,9.8,52.1,12.5,3.4),
    patch(lon,lat,25,50.3,12.5,3.2),
    patch(lon,lat,10.1,45.0,3.0,.55),
    patch(lon,lat,19.2,46.9,3.6,1.1),
    patch(lon,lat,.4,52.3,3.6,1.25));
  const water=Math.max(patch(lon,lat,4.8,52.0,1.15,.82),
    patch(lon,lat,26.6,51.7,2.0,.75),
    patch(lon,lat,24.4,62.9,5.0,2.0));
  const wet=clamp(.51+.24*wetWest-.25*eastDry-.20*southDry+
    (wood-.5)*.37+.12*(lat>56));
  const mediterranean=lat<45&&wet<.51||biome==='mediterranean';
  if(water>.73&&wood>.56)return C.wetland;
  if(tier===2||alpine>.72&&tier>0){
   if(wet>.44&&wood>.30)return C.conifers;
   return wood>.51?C.shrub:C.rock;
  }
  if(tier===1){
   if(wet>.51&&wood>.42)return lat>=53?C.conifers:C.deciduous;
   return wood>.51?C.evergreen:C.grass;
  }
  if(lat>=67.6)return wood>.56?C.conifers:C.tundra;
  if(lat>=59){
   if(wood>.34)return C.conifers;
   if(wet>.65&&clear>.52)return C.wetland;
   return C.meadow;
  }
  if(eastDry>.54&&wet<.35)return wood>.60?C.shrub:C.steppe;
  if(mediterranean){
   if(alpine>.46&&wood>.53)return C.conifers;
   if(wood>.64)return C.evergreen;
   if(wood>.43)return C.shrub;
   return clear>.43?C.crops:C.grass;
  }
  if(cropbelt>.40&&clear>.45&&wood<.68)return C.crops;
  if(wet>.54&&wood>.57)return C.deciduous;
  if(wet>.44&&wood>.64)return C.deciduous;
  if(alpine>.42&&wood>.51)return C.conifers;
  if(wet>.53)return wood>.43?C.meadow:C.grass;
  if(cropbelt>.35||clear>.56)return C.crops;
  return wood>.49?C.deciduous:C.grass;
 }
 window.HexategosLandCover0391=Object.freeze({...previous,version:'0.39.5',
  classify,originalClassify:previous.classify});
})();