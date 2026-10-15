'use strict';
/* HEXATEGOS 0.40.2 · transiciones cromáticas orgánicas, solo dibujo.
 * El clima original tiene cajas de lon/lat de bordes rectos. Para la
 * capa visual se deforma suavemente la coordenada y se promedian colores
 * SOLO cerca de cortes bruscos. El mapa real, recursos, propiedad, la
 * geología y los datos usados por la IA NO cambian.
 */
(function(){
 const cover=window.HexategosLandCover0391;
 if(!cover||typeof terrainClimateCode3247!=='function')return;
 const cache=new Map(),rad=Math.PI/180;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function hash(x,y,salt){
  let t=(Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^salt)>>>0;
  t=Math.imul(t^(t>>>13),1274126177);
  return ((t^(t>>>16))>>>0)/4294967295;
 }
 function noise(x,y,salt){
  const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j;
  const a=u*u*(3-2*u),b=v*v*(3-2*v);
  const w=hash(i,j,salt),e=hash(i+1,j,salt);
  const sw=hash(i,j+1,salt),se=hash(i+1,j+1,salt);
  return (w+(e-w)*a)*(1-b)+(sw+(se-sw)*a)*b;
 }
 function warped(lat,lon){
  // Variación continua multi-escala: rompe los meridianos y paralelos
  // artificiales sin dibujar una costa nueva ni introducir aleatoriedad.
  const x=lon*Math.max(.22,Math.cos(lat*rad));
  return [
   lat+(noise(x*.24,lat*.20,0x1402)-.5)*3.0+(noise(x*.76,lat*.68,0x781)-.5)*.75,
   lon+(noise(x*.22,lat*.24,0x528)-.5)*3.0+(noise(x*.68,lat*.71,0x842)-.5)*.75
  ];
 }
 function biome(lat,lon,iso,tier){
  if(tier>=3)return 'highmountain';
  if(tier>0)return 'mountain';
  return TERRAIN_CODES3247[terrainClimateCode3247(lat,lon,iso)]||'plain';
 }
 function rgbAt(lat,lon,iso,tier){
  const code=cover.classify(lat,lon,biome(lat,lon,iso,tier),tier);
  return cover.types[code]?.color||null;
 }
 function nearRegionEdge(lat,lon){
  // El refinamiento europeo termina en un rectángulo geográfico, y la
  // calibración ibérica tiene otro. Evitar cortes de color en ambos.
  const european=Math.min(Math.abs(lat-35.4),Math.abs(lat-72.3),
    Math.abs(lon+25.3),Math.abs(lon-61));
  const iberian=Math.min(Math.abs(lat-35.5),Math.abs(lat-44.3),
    Math.abs(lon+10.2),Math.abs(lon-4.5));
  return european<1.9||iberian<1.9;
 }
 function compute(lat,lon,iso,tier){
  const [y,x]=warped(lat,lon);
  const mid=rgbAt(y,x,iso,tier);
  if(!mid)return null;
  const d=.95;
  const points=[[y-d,x],[y+d,x],[y,x-d],[y,x+d]];
  const mainBiome=biome(y,x,iso,tier);
  // Solo las proximidades de discontinuidades requieren antialias
  // cromático. Interior de grandes regiones = una muestra por hexágono.
  if(!nearRegionEdge(lat,lon)&&points.every(([a,b])=>biome(a,b,iso,tier)===mainBiome))
   return mid;
  const colors=points.map(([a,b])=>rgbAt(a,b,iso,tier)||mid);
  return mid.map((v,i)=>Math.round((v*4+colors.reduce((sum,c)=>sum+c[i],0))/8));
 }
 function entry(key,L){
  let e=cache.get(key);
  if(!e||e.mesh!==L){
   e={mesh:L,ready:new Uint8Array(L.n),rgb:new Uint8Array(L.n*3)};
   cache.set(key,e);
  }
  return e;
 }
 function color(key,i,L){
  if(!Number.isInteger(i)||i<0||i>=L.n||L.land[i]<0)return null;
  const e=entry(key,L),k=i*3;
  if(!e.ready[i]){
   const y=clamp(L.centers[k+1]/32767,-1,1);
   const lat=Math.asin(y)/rad,lon=Math.atan2(L.centers[k],L.centers[k+2])/rad;
   const tier=key===MAX_GAME_LEVEL3233?(mountainTier3212[i]||0):0;
   const iso=COUNTRY_ISO[L.land[i]]||'';
   const rgb=compute(lat,lon,iso,tier);
   if(rgb)e.rgb.set(rgb,k);
   e.ready[i]=rgb?1:2;
  }
  if(e.ready[i]!==1)return null;
  return [e.rgb[k],e.rgb[k+1],e.rgb[k+2]];
 }
 window.HexategosLandCoverTransitions0402=Object.freeze({
  version:'0.40.2',color,
  preview:(lat,lon,iso='',tier=0)=>compute(lat,lon,iso,tier),
  cacheBytes:()=>[...cache.values()].reduce((n,e)=>n+e.ready.byteLength+e.rgb.byteLength,0)
 });
})();