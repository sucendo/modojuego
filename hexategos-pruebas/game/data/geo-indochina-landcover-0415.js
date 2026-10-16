'use strict';
/* Indochina 0.41.5 · ecotonos visuales monzónicos, secos y deltaicos.
 * Fuente aproximada: no modifica la capa geológica ni recursos del juego.
 */
(function(){
 const data=window.HexategosIndochinaPhysical0415;if(!data)return;
 const cache=new Map(),rad=Math.PI/180;
 const clamp=v=>Math.max(0,Math.min(1,v)),
  smooth=x=>{x=clamp(x);return x*x*(3-2*x)},
  gauss=(x,y,u,v,a,b)=>Math.exp(-.5*(((x-u)/a)**2+((y-v)/b)**2)),
  mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-clamp(t))+b[i]*clamp(t)));
 const palette=Object.freeze({
  monsoon:[50,121,78],rainforest:[33,108,77],upland:[94,127,94],
  mountain:[139,136,118],rice:[105,157,96],dry:[161,148,103],
  plateau:[129,144,97],mangrove:[45,118,112],grass:[133,157,104],
  lake:[40,133,160]
 });
 function evaluate(lat,lon){
  if(lat<7||lat>27||lon<96||lon>112)return null;
  const chao=gauss(lon,lat,100.30,15.15,1.2,3.2),
   khorat=gauss(lon,lat,103.15,16.3,2.3,1.75),
   mekongDelta=gauss(lon,lat,106.02,10.65,2.3,1.45),
   redDelta=gauss(lon,lat,106.0,20.75,1.5,1.2),
   tonle=gauss(lon,lat,104.15,12.6,1.3,1.05),
   highLaos=gauss(lon,lat,102.9,20.3,2.1,3.3),
   annam=gauss(lon,lat,106.5,17.4,1.4,5.5),
   cardamom=gauss(lon,lat,103.3,11.6,1.4,1.2),
   centralVN=gauss(lon,lat,108.0,13.6,1.5,2.6),
   chinaBorder=gauss(lon,lat,104.4,22.5,2.2,1.4),
   cambodia=gauss(lon,lat,105.0,12.65,2.6,1.5);
  const mountain=Math.max(highLaos*.63,annam*.81,cardamom*.60,
   centralVN*.60,chinaBorder*.65);
  const farm=Math.max(chao*.84,mekongDelta*.94,redDelta*.87,tonle*.69);
  const dry=Math.max(khorat*.90,gauss(lon,lat,100.8,15.9,1.4,1.4)*.45);
  const wet=Math.max(mekongDelta*.93,redDelta*.72,tonle*.66,cambodia*.28);
  const influence=Math.max(chao,khorat,mekongDelta,redDelta,tonle,
   highLaos,annam,cardamom,centralVN,chinaBorder,cambodia);
  const edges=smooth((lon-96.2)/3)*smooth((111.8-lon)/2.9)*
    smooth((lat-7.7)/2.1)*smooth((26.8-lat)/2.6);
  const weight=clamp(influence*edges);
  if(weight<.02)return null;
  let color=mix(palette.grass,palette.monsoon,.56);
  color=mix(color,palette.rainforest,Math.max(annam*.59,highLaos*.50,cardamom*.76));
  color=mix(color,palette.plateau,khorat*.45);
  color=mix(color,palette.dry,dry*.66);
  color=mix(color,palette.rice,farm*.80);
  color=mix(color,palette.mangrove,wet*.41);
  color=mix(color,palette.upland,mountain*.51);
  color=mix(color,palette.mountain,smooth((mountain-.50)/.48)*.39);
  return {weight,color,dry,farm,mountain,wet};
 }
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const j=i*3,y=L.centers[j+1]/32767;
  if(y<Math.sin(7*rad)||y>Math.sin(27*rad))return base;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<96||lon>112)return base;
  const lat=Math.asin(Math.max(-1,Math.min(1,y)))/rad;
  let entry=cache.get(key);
  if(!entry||entry.mesh!==L){entry={mesh:L,cells:new Map()};cache.set(key,entry)}
  let value=entry.cells.get(i);
  if(value===undefined){value=evaluate(lat,lon)||null;entry.cells.set(i,value)}
  return value?mix(base,value.color,value.weight*.88):base;
 }
 window.HexategosIndochinaLandcover0415=Object.freeze({
  version:'0.41.5',palette,evaluate,rgbForCell,
  cachedCells:()=>[...cache.values()].reduce((n,v)=>n+v.cells.size,0)
 });
})();
