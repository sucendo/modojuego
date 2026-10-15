'use strict';
/* Cubierta Himalaya 0.40.6: campos suaves y caché por celda,
 * exclusivamente visual; no altera producción, suelo ni geología.
 */
(function(){
 const old=window.HexategosLandCover0391;
 if(!old||!window.HexategosHimalayaPhysical0406)return;
 const cache=new Map(),C=old.code,rad=Math.PI/180;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
 const g=(x,y,a,b,u,v)=>Math.exp(-.5*(((x-a)/u)**2+((y-b)/v)**2));
 const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-clamp(t))+b[i]*clamp(t)));
 const palette=Object.freeze({
  sand:[203,160,105],grass:[127,156,103],field:[85,140,84],
  forest:[43,109,77],tibet:[157,145,123],rock:[141,133,129],
  snow:[217,222,223],pine:[48,106,91]
 });
 function envelope(lat,lon){
  return clamp(Math.max(g(lon,lat,84,31.3,11.9,5.8),
   g(lon,lat,73,29.6,6.6,5.7),g(lon,lat,94,28.3,6,5.2)));
 }
 function evaluate(lat,lon,biome='plain',tier=0){
  if(biome==='sea')return null;
  const weight=envelope(lat,lon);if(weight<.003)return null;
  const thar=g(lon,lat,71.7,26.4,3.5,2.75);
  const plains=Math.max(g(lon,lat,82.3,26.3,8,2.15),
    g(lon,lat,74,30,3.2,1.7),g(lon,lat,93.4,26.4,3.5,1.3));
  const tibet=g(lon,lat,86.5,33.8,11,3.4);
  const forest=Math.max(g(lon,lat,92.7,28.3,4.9,2.6),
    .55*g(lon,lat,84,27.8,8,1.0));
  const ridge=Math.max(g(lon,lat,76.1,33.2,4.4,1.05),
   g(lon,lat,83.5,29.4,5.5,1.0),g(lon,lat,91.4,28,4.3,1.1),
   g(lon,lat,76.5,35.7,3.2,1.1),g(lon,lat,88.2,36.5,8,1.2));
  const relief=clamp(.96*ridge+Math.max(0,tier-1)*.11);
  const aridity=clamp(.13+.88*thar+.37*tibet-.32*plains-.16*forest);
  const fields=clamp(.88*plains-.55*thar-.35*ridge);
  const frost=clamp(smooth((ridge-.49)/.48)*.84+
   (tier>=3?.15:0));
  let color=mix(palette.grass,palette.tibet,.74*tibet);
  color=mix(color,palette.sand,smooth((thar-.20)/.7)*.89);
  color=mix(color,palette.field,fields*.85);
  color=mix(color,palette.forest,forest*.72);
  color=mix(color,palette.pine,relief*forest*.20);
  color=mix(color,palette.rock,relief*.78);
  color=mix(color,palette.snow,frost*.89);
  let code=aridity>.68?C.desert:tibet>.60?C.tundra:
   fields>.54?C.irrigated:forest>.62?C.conifers:C.grass;
  if(relief>.66)code=frost>.65?C.ice:C.rock;
  return {weight,color,code,aridity,relief,fields,forest,frost};
 }
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const j=i*3,y=L.centers[j+1];
  if(y<10800||y>22800)return base;
  const lat=Math.asin(Math.max(-1,Math.min(1,y/32767)))/rad;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
  if(lon<61||lon>107)return base;
  let entry=cache.get(key);
  if(!entry||entry.mesh!==L){
   entry={mesh:L,bytes:new Uint8Array(L.n*4)};cache.set(key,entry);
  }
  const p=i*4,b=entry.bytes;
  if(!b[p+3]){
   const tier=key===MAX_GAME_LEVEL3233?(mountainTier3212[i]||0):0;
   const value=evaluate(lat,lon,terrainType3247(key,i,L),tier);
   const v=value?mix(base,value.color,value.weight):base;
   b[p]=v[0];b[p+1]=v[1];b[p+2]=v[2];b[p+3]=1;
  }
  return [b[p],b[p+1],b[p+2]];
 }
 window.HexategosLandCover0391=Object.freeze({...old,version:'0.40.6',
  classify:(lat,lon,biome='plain',tier=0)=>{
   const v=evaluate(lat,lon,biome,tier);
   return v&&v.weight>.62?v.code:old.classify(lat,lon,biome,tier);
  }
 });
 window.HexategosHimalayaLandcover0406=Object.freeze({
  version:'0.40.6',evaluate,envelope,rgbForCell,palette,
  cacheBytes:()=>[...cache.values()].reduce((n,v)=>n+v.bytes.length,0)
 });
})();