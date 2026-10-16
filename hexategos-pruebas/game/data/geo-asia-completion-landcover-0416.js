'use strict';
/* Asia 0.41.6 · cubierta continua, visual e independiente de la geología.
 * Gradientes eco-geográficos por influencia suave: tundra, taiga,
 * estepas/desiertos mongoles, agricultura china, bosque templado
 * japonés/coreano, selvas ecuatoriales y relieve volcánico insular.
 * No muta clasificación del terreno ni producción.
 */
(function(){
 const data=window.HexategosAsiaCompletion0416;if(!data)return;
 const cache=new Map(),rad=Math.PI/180;
 const clamp=v=>Math.max(0,Math.min(1,v)),
  smooth=v=>{v=clamp(v);return v*v*(3-2*v)},
  gauss=(x,y,a,b,u,v)=>Math.exp(-.5*(((x-a)/u)**2+((y-b)/v)**2)),
  mix=(a,b,w)=>a.map((v,i)=>Math.round(v*(1-clamp(w))+b[i]*clamp(w)));
 const colors=Object.freeze({tundra:[143,147,129],taiga:[49,99,74],
  evergreen:[39,111,75],steppe:[158,151,99],desert:[194,171,113],
  loess:[185,166,117],agriculture:[117,155,92],forest:[53,126,81],
  rice:[86,151,89],mountain:[125,129,113],rainforest:[32,113,72],
  wetlands:[58,122,102],volcanic:[115,126,93],snow:[188,201,195]});
 function evaluate(lat,lon){
  // El corte entre zonas antiguas y nuevas es ponderado; fuera de Asia
  // restante no se modifica el RGB del mapa que ya funciona.
  if(lon<57||lon>181||lat< -13||lat>79)return null;
  const sw=gauss(lon,lat,80,62,24,12),
   siberia=gauss(lon,lat,122,64,40,17),
   tundra=gauss(lon,lat,120,72,48,8.5),
   kamchatka=gauss(lon,lat,159,56,8,8),
   gobi=gauss(lon,lat,105,43,10,5),
   mongolia=gauss(lon,lat,110,47.5,17,6),
   manchuria=gauss(lon,lat,125,46,8,7),
   loess=gauss(lon,lat,109,36.5,5.8,3.7),
   plain=gauss(lon,lat,115.5,33.0,9,6.6),
   yangtze=gauss(lon,lat,115,29.5,7.5,4.2),
   southChina=gauss(lon,lat,116,24.9,9.0,5.6),
   korea=gauss(lon,lat,127.4,38.7,4,6),
   japan=gauss(lon,lat,139,37.5,7.2,8.5),
   malaysia=gauss(lon,lat,102.5,3.5,4,8),
   sumatra=gauss(lon,lat,101.3,-2.0,6,5.3),
   java=gauss(lon,lat,111,-7.0,5.7,1.7),
   borneo=gauss(lon,lat,114.5,0.0,6,6),
   sulawesi=gauss(lon,lat,121.5,-2.2,4.4,4.9),
   philippines=gauss(lon,lat,122.8,12.9,5.5,7.3),
   papua=gauss(lon,lat,137,-3.1,6.8,4.8);
  const maritime=Math.max(malaysia*.88,sumatra,java,borneo,sulawesi,
   philippines,papua);
  const north=Math.max(sw,siberia,kamchatka*.82);
  const china=Math.max(gobi,mongolia*.93,manchuria,loess,plain,yangtze,
   southChina,korea*.65,japan*.8);
  const weight=clamp(Math.max(north,china,maritime,korea,japan)*.95);
  if(weight<.015)return null;
  const boreal=clamp(north*(1-smooth((lat-69)/11)*.32)),
   arctic=clamp(Math.max(sw,siberia)*smooth((lat-66)/11)),
   arid=clamp(Math.max(gobi*.95,mongolia*.57,loess*.44)),
   cultivated=clamp(Math.max(plain*.82,yangtze*.96,southChina*.61,
    japan*.49,korea*.47,java*.92,philippines*.25)),
   tropic=clamp(maritime);
  const ridge=clamp(Math.max(kamchatka*.5,japan*.42,papua*.73,
    sumatra*.48,java*.38,borneo*.29,sulawesi*.38));
  let rgb=mix(colors.forest,colors.taiga,boreal*.95);
  rgb=mix(rgb,colors.tundra,arctic*.91);
  rgb=mix(rgb,colors.steppe,Math.max(mongolia*.68,arid*.35));
  rgb=mix(rgb,colors.desert,Math.max(gobi*.77,arid*.39));
  rgb=mix(rgb,colors.loess,loess*.58);
  rgb=mix(rgb,colors.agriculture,cultivated*.66);
  rgb=mix(rgb,colors.evergreen,Math.max(manchuria*.31,korea*.51,japan*.57));
  rgb=mix(rgb,colors.rainforest,tropic*.93);
  rgb=mix(rgb,colors.rice,Math.max(java*.51,yangtze*.35,plain*.25));
  rgb=mix(rgb,colors.wetlands,Math.max(borneo*.18,papua*.16,sumatra*.19));
  rgb=mix(rgb,colors.mountain,ridge*.32);
  rgb=mix(rgb,colors.snow,smooth((lat-60)/14)*kamchatka*.30);
  return {weight,color:rgb,arid,tropic,arctic,boreal,cultivated,ridge};
 }
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const j=i*3,y=L.centers[j+1]/32767;
  if(y<Math.sin(-13*rad)||y>Math.sin(79*rad))return base;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<57||lon>181)return base;
  const lat=Math.asin(Math.max(-1,Math.min(1,y)))/rad;
  let entry=cache.get(key);
  if(!entry||entry.mesh!==L){entry={mesh:L,cells:new Map()};cache.set(key,entry)}
  let v=entry.cells.get(i);
  if(v===undefined){v=evaluate(lat,lon)||null;entry.cells.set(i,v)}
  return v?mix(base,v.color,v.weight*.83):base;
 }
 window.HexategosAsiaCompletionLandcover0416=Object.freeze({
  version:'0.41.6',evaluate,rgbForCell,colors,
  cachedCells:()=>[...cache.values()].reduce((n,v)=>n+v.cells.size,0)
 });
})();
