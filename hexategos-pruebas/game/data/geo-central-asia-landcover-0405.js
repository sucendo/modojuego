'use strict';
/* HEXATEGOS Asia Central 0.40.5 — cubierta física CONTINUA y determinista.
 * Modelo visual aproximado; no infiere recursos ni altera terreno jugable.
 * Sin límites rectangulares: influencia por cuencas con campos gaussianos,
 * ruido continuo y transición de 3–4 grados en el perímetro.
 */
(function(){
 const previous=window.HexategosLandCover0391;
 if(!previous)return;
 const C=previous.code,types=previous.types;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
 const gauss=(lon,lat,x,y,sx,sy)=>{
  const dx=(lon-x)/sx,dy=(lat-y)/sy;
  return Math.exp(-.5*(dx*dx+dy*dy));
 };
 function hash(x,y,salt){
  let v=(Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^salt)>>>0;
  v=Math.imul(v^(v>>>13),1274126177);
  return ((v^(v>>>16))>>>0)/4294967295;
 }
 function noise(x,y,salt){
  const i=Math.floor(x),j=Math.floor(y),u=smooth(x-i),v=smooth(y-j);
  const a=hash(i,j,salt),b=hash(i+1,j,salt),c=hash(i,j+1,salt),d=hash(i+1,j+1,salt);
  return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
 }
 function field(lon,lat){
  const x=lon*Math.cos(lat*Math.PI/180);
  return noise(x*.42,lat*.43,0x51e3)*.60+
    noise(x*1.12,lat*1.12,0x373b)*.28+
    noise(x*2.1,lat*2.1,0x44c9)*.12;
 }
 function envelope(lat,lon){
  // Norte de Kazajistán, Turán, Pamir, Tarim y cuenca de Zungaria.
  return smooth((lon-43)/4)*smooth((100-lon)/4)*
    smooth((lat-33)/3.4)*smooth((58-lat)/4);
 }
 const interpolate=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
 const RGB=Object.freeze({
  sand:[194,156,104],salt:[172,162,143],steppe:[163,150,103],
  grass:[130,150,100],meadow:[105,145,91],irrigated:[97,143,83],
  wetland:[75,129,119],forest:[38,112,75],pine:[33,99,78],
  rock:[145,132,121],alpine:[128,132,127],snow:[196,206,205]
 });
 function evaluate(lat,lon,biome='plain',tier=0){
  const weight=envelope(lat,lon);
  if(weight<=0||biome==='sea')return null;
  const grain=field(lon,lat),gr=(grain-.5);
  const karakum=gauss(lon,lat,59.9,39.3,4.6,2.9),
   kyzylkum=gauss(lon,lat,64.8,42.4,4.3,2.35),
   ustyurt=gauss(lon,lat,57.6,44.2,3.0,1.9),
   betpak=gauss(lon,lat,69.6,45.4,5.3,2.6),
   tarim=gauss(lon,lat,83.6,39.0,6.7,2.15),
   junggar=gauss(lon,lat,86.5,45.5,5.6,2.3),
   qaidam=gauss(lon,lat,94.2,37.2,3.7,1.7);
  const aral=gauss(lon,lat,60.4,45.1,2.6,1.85);
  const dry=Math.max(karakum*.95,kyzylkum*.93,ustyurt*.62,betpak*.72,
    tarim*1.08,junggar*.70,qaidam*.88,aral*.50);
  const pamir=gauss(lon,lat,73.1,38.8,2.7,1.35),
   tian=gauss(lon,lat,79.9,42.0,7.6,1.25),
   altai=gauss(lon,lat,88.7,49.0,5.8,1.4),
   kunlun=gauss(lon,lat,84.5,36.5,7.5,1.2),
   alay=gauss(lon,lat,73.7,39.7,2.7,.8),
   kopet=gauss(lon,lat,58.3,37.9,3.4,.55);
  const mountain=Math.max(pamir*.95,tian*.89,altai*.81,kunlun*.83,
    alay*.67,kopet*.59,tier>=3?1:tier===2?.75:tier===1?.42:0);
  const fergana=gauss(lon,lat,71.3,40.5,2.25,.62),
    ili=gauss(lon,lat,77.5,43.6,2.6,.63),
    amu=gauss(lon,lat,64.9,39.1,3.0,.58),
    sir=gauss(lon,lat,68.3,42.1,4.3,.70),
    chu=gauss(lon,lat,73.7,42.65,2.25,.45),
    oases=gauss(lon,lat,81.2,40.8,3.7,.52)*.55;
  const irrig=Math.max(fergana*.98,ili*.88,amu*.72,sir*.70,chu*.57,oases*.55);
  const north=smooth((lat-44.1)/10.6);
  const humid=clamp(.39+.32*north+.45*irrig-.47*dry+
     .16*gauss(lon,lat,88.4,49.1,5,1.5)+gr*.15);
  const aridity=clamp(dry*.87+.12-.17*irrig-.19*north-gr*.19);
  const wooded=clamp(.12+.51*gauss(lon,lat,88.6,49.0,5.8,1.7)+
    .28*gauss(lon,lat,81,43.0,4.5,1.3)+.24*north-
    .38*aridity+gr*.14);
  const valley=clamp(irrig*(.77+grain*.3)*(1-.55*mountain));
  const relief=smooth((mountain-.30)/.55);
  // Campos RGB suaves: ni meridianos de corte ni píxeles aleatorios.
  let rgb=interpolate(RGB.grass,RGB.steppe,clamp(.30+aridity*.65));
  rgb=interpolate(rgb,RGB.sand,smooth((aridity-.34)/.59)*(.67+.17*grain));
  rgb=interpolate(rgb,RGB.salt,aral*.23+ustyurt*.13);
  rgb=interpolate(rgb,RGB.meadow,humid*.30*(1-aridity));
  rgb=interpolate(rgb,RGB.pine,wooded*.63*(1-.5*relief));
  rgb=interpolate(rgb,RGB.irrigated,valley*.82);
  rgb=interpolate(rgb,RGB.wetland,clamp(valley*.34*gauss(lon,lat,71,40.5,3,.9)));
  rgb=interpolate(rgb,RGB.rock,relief*(.67+.16*(1-humid)));
  if(mountain>.65&&humid>.37)
   rgb=interpolate(rgb,RGB.alpine,smooth((mountain-.60)/.40)*.36);
  if((tier>=3||mountain>.96&&lat<44)&&biome!=='desert')
   rgb=interpolate(rgb,RGB.snow,clamp((mountain-.85)*4+(tier>=3?.30:0))*.72);
  // El clasificador discreto sólo alimenta la leyenda/inspector;
  // el relleno real emplea el RGB continuo calculado arriba.
  let code=aridity>.77?C.desert:aridity>.49?C.steppe:
   valley>.64?C.irrigated:wooded>.48?C.conifers:
   humid>.60?C.meadow:C.grass;
  if(valley>.64)code=C.irrigated;
  if(relief>.65)code=mountain>.89&&tier>=3?C.ice:C.rock;
  return {weight,code,color:rgb,dry:aridity,wet:humid,relief,irrig:valley};
 }
 const cache=new Map();
 function rgbForCell(key,i,L,base){
  if(L.land[i]<0)return base;
  const j=i*3,y=L.centers[j+1];
  if(y<16800||y>27800)return base;
  const lat=Math.asin(clamp(y/32767,-1,1))*180/Math.PI;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])*180/Math.PI;
  if(lon<43||lon>100)return base;
  let entry=cache.get(key);
  if(!entry||entry.mesh!==L){
   entry={mesh:L,bytes:new Uint8Array(L.n*4)};
   cache.set(key,entry);
  }
  const p=i*4,b=entry.bytes;
  if(b[p+3]===0){
   const tier=key===MAX_GAME_LEVEL3233?(mountainTier3212[i]||0):0;
   const sample=evaluate(lat,lon,terrainType3247(key,i,L),tier);
   const val=sample?.color||base;
   const weight=sample?.weight||0;
   // La transición se mezcla con el modelo europeo o genérico original.
   const out=interpolate(base,val,weight);
   b[p]=out[0];b[p+1]=out[1];b[p+2]=out[2];
   b[p+3]=1;
  }
  return [b[p],b[p+1],b[p+2]];
 }
 function classify(lat,lon,biome='plain',tier=0){
  const v=evaluate(lat,lon,biome,tier);
  if(!v||v.weight<.57)return previous.classify(lat,lon,biome,tier);
  return v.code;
 }
 window.HexategosLandCover0391=Object.freeze({...previous,version:'0.40.5',
  classify});
 window.HexategosCentralAsiaLandcover0405=Object.freeze({
  version:'0.40.5',evaluate,rgbForCell,envelope,
  cacheBytes:()=>[...cache.values()].reduce((n,v)=>n+v.bytes.byteLength,0),
  palette:RGB
 });
})();
