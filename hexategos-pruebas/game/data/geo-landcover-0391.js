'use strict';
/* HEXATEGOS · Cubierta del suelo 0.39.1.
 * Modelo visual DETERMINISTA por coordenadas (no por propietario ni por ID).
 * Refiere usos/coberturas plausibles, NO observaciones de Copernicus/CLC.
 * No implica recursos explotados ni altera geología, economía o partidas.
 * Dataset común disponible para Atlas; juego no lo usa en su simulación.
 */
(function(){
 const TYPES=Object.freeze([
  {id:'crops',name:'Cultivos de secano',color:[164,145,94]},
  {id:'irrigated',name:'Cultivos de regadío',color:[96,143,82]},
  {id:'meadow',name:'Prado y pastizal húmedo',color:[103,151,87]},
  {id:'grass',name:'Pastizal y herbazal',color:[140,151,93]},
  {id:'deciduous',name:'Bosque caducifolio',color:[54,101,73]},
  {id:'evergreen',name:'Bosque mediterráneo',color:[66,105,66]},
  {id:'conifers',name:'Coníferas y pinares',color:[50,91,76]},
  {id:'dehesa',name:'Dehesa y arbolado disperso',color:[116,137,83]},
  {id:'shrub',name:'Matorral',color:[132,130,88]},
  {id:'steppe',name:'Estepa y terreno semiárido',color:[164,148,99]},
  {id:'rock',name:'Roquedo y suelo desnudo',color:[133,122,110]},
  {id:'wetland',name:'Humedal',color:[74,121,116]},
  {id:'desert',name:'Desierto',color:[180,147,99]},
  {id:'savanna',name:'Sabana',color:[153,143,88]},
  {id:'rainforest',name:'Selva tropical',color:[41,102,69]},
  {id:'tundra',name:'Tundra',color:[121,131,114]},
  {id:'ice',name:'Hielo y nieve',color:[187,203,208]}
 ]);
 const C=Object.freeze(Object.fromEntries(TYPES.map((t,i)=>[t.id,i])));
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const ellipse=(lon,lat,x,y,w,h)=>Math.exp(-.5*((lon-x)/w)**2-.5*((lat-y)/h)**2);
 const smooth=t=>t*t*(3-2*t);
 function hash(x,y,salt){
  let v=(Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^salt)>>>0;
  v=Math.imul(v^(v>>>13),1274126177);
  return ((v^(v>>>16))>>>0)/4294967295;
 }
 function noise(x,y,salt){
  const ix=Math.floor(x),iy=Math.floor(y),sx=smooth(x-ix),sy=smooth(y-iy);
  const a=hash(ix,iy,salt),b=hash(ix+1,iy,salt);
  const c=hash(ix,iy+1,salt),d=hash(ix+1,iy+1,salt);
  return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
 }
 // Bosques, claros y praderas forman manchas continuas a varias escalas
 // sin depender del índice de celda (estable al cambiar el nivel de zoom).
 function sample(lon,lat,salt){
  const x=lon*Math.cos(lat*Math.PI/180);
  return (noise(x/1.18,lat/1.18,salt)*.42+
          noise(x/.31,lat/.31,salt^0x529a)*.39+
          noise(x/.105,lat/.105,salt^0xa734)*.19);
 }
 function iberia(lon,lat,biome,tier){
  const wetNorth=ellipse(lon,lat,-4.5,43.10,4.1,.75);
  const galicia=ellipse(lon,lat,-8.0,42.7,1.65,1.35);
  const portugalNorth=ellipse(lon,lat,-8.1,40.6,1.6,2.1);
  const pyrenees=ellipse(lon,lat,.38,42.62,2.4,.53);
  const southeast=ellipse(lon,lat,-1.8,37.6,1.85,1.20);
  const ebroDry=ellipse(lon,lat,-.35,41.67,1.45,.75);
  const centralDry=ellipse(lon,lat,-3.35,39.5,2.65,1.45);
  const northMoist=.40*wetNorth+.30*galicia+.15*portugalNorth+.18*pyrenees;
  const moist=clamp(.42+northMoist-.31*southeast-.19*ebroDry-.12*centralDry+
    (sample(lon,lat,0x19752)-.5)*.36);
  const rough=clamp(.32*pyrenees+.14*wetNorth+.19*ellipse(lon,lat,-4.1,40.9,2.8,.46)+
    .24*ellipse(lon,lat,-3.1,37.2,2.5,.5)+(sample(lon,lat,0xa137)-.5)*.20);
  const vegetation=sample(lon,lat,0x2731);
  const field=sample(lon,lat,0xb422);
  const dehesa=ellipse(lon,lat,-6.15,39.1,1.5,1.32)+
    .7*ellipse(lon,lat,-7.65,38.55,1.05,1.25);
  const fertile=clamp(.57*ellipse(lon,lat,-4.6,41.68,1.75,.78)+
    .43*ellipse(lon,lat,-.76,41.69,1.55,.58)+
    .40*ellipse(lon,lat,-5.28,37.76,1.63,.53)+
    .20*ellipse(lon,lat,-3.13,39.17,1.62,.90)+
    .23*ellipse(lon,lat,-7.50,38.25,1.25,.85));
  const irrigation=clamp(
    ellipse(lon,lat,-.36,39.37,.35,.28)*.65+
    ellipse(lon,lat,-1.16,38.09,.30,.24)*.82+
    ellipse(lon,lat,-.90,41.66,.48,.25)*.52+
    ellipse(lon,lat,-5.65,37.49,.70,.24)*.49+
    ellipse(lon,lat,.52,40.76,.29,.27)*.53);
  const marsh= Math.max(
    ellipse(lon,lat,-6.47,36.96,.18,.12),
    ellipse(lon,lat,.72,40.72,.11,.14),
    ellipse(lon,lat,-3.73,39.02,.11,.10));
  // Atajos topográficos: montañas altas conservan roquedo, sin nieve
  // permanente ficticia en Iberia; las de nivel II admiten pinares y prados.
  if(tier>=3) return C.rock;
  if(marsh>.72&&vegetation>.32)return C.wetland;
  if(tier===2){
   if(moist>.56&&vegetation>.35)return C.conifers;
   if(moist>.38&&vegetation>.42)return C.evergreen;
   return vegetation>.55?C.shrub:C.rock;
  }
  if(tier===1){
   if(moist>.60&&vegetation>.47)return C.deciduous;
   if(moist>.38&&vegetation>.39)return C.evergreen;
   return moist>.54?C.grass:C.shrub;
  }
  if(dehesa>.43&&field>.37&&moist>.28){
   return vegetation>.62?C.evergreen:C.dehesa;
  }
  if(southeast>.46&&moist<.32){
   return vegetation<.39?C.rock:vegetation>.63?C.steppe:C.shrub;
  }
  if(ebroDry>.50&&moist<.34&&field<.61)
   return vegetation>.54?C.shrub:C.steppe;
  if(irrigation>.53&&field>.30)return C.irrigated;
  if(moist>.69){
   if(vegetation>.52)return C.deciduous;
   if(vegetation>.28)return C.meadow;
   return C.grass;
  }
  if(moist>.55&&vegetation>.65)return C.evergreen;
  if(fertile+field*.26>.67&&vegetation<.73)return C.crops;
  if(moist>.55)return vegetation>.46?C.meadow:C.grass;
  if(vegetation>.78)return C.evergreen;
  if(vegetation>.59)return C.shrub;
  if(moist<.24)return vegetation<.40?C.steppe:C.shrub;
  if(field>.42)return C.crops;
  return moist>.42?C.grass:C.steppe;
 }
 function generic(lon,lat,biome,tier){
  const vegetation=sample(lon,lat,0x2731);
  const field=sample(lon,lat,0xb422);
  if(biome==='ice')return C.ice;
  if(biome==='sea')return -1;
  if(tier>=3||biome==='highmountain')return C.rock;
  if(biome==='desert')return vegetation>.78?C.steppe:C.desert;
  if(biome==='tundra')return vegetation>.65?C.grass:C.tundra;
  if(biome==='rainforest')return vegetation<.23?C.savanna:C.rainforest;
  if(biome==='forest')return vegetation>.52?C.deciduous:vegetation>.26?C.conifers:C.meadow;
  if(biome==='savanna')return vegetation>.76?C.evergreen:vegetation<.27?C.steppe:C.savanna;
  if(tier>0||biome==='mountain')return vegetation>.56?C.conifers:vegetation>.30?C.shrub:C.rock;
  if(biome==='steppe')return vegetation>.62?C.grass:vegetation<.24?C.rock:C.steppe;
  if(biome==='mediterranean')return vegetation>.74?C.evergreen:vegetation>.53?C.shrub:
    field>.52?C.crops:C.grass;
  return vegetation>.78?C.deciduous:vegetation>.54?C.meadow:field>.49?C.crops:C.grass;
 }
 function classify(lat,lon,biome='plain',tier=0){
  if(!Number.isFinite(lat)||!Number.isFinite(lon))return -1;
  if(biome==='sea')return -1;
  // La península recibe el refinamiento regional: se emplean coordenadas y
  // relieve, NO el país controlador o la nacionalidad del hexágono.
  if(lon>-10.2&&lon<4.5&&lat>35.5&&lat<44.3)
    return iberia(lon,lat,biome,tier|0);
  return generic(lon,lat,biome,tier|0);
 }
 window.HexategosLandCover0391=Object.freeze({version:'0.39.1',types:TYPES,code:C,classify,
   description:'Estimación visual de cubierta del suelo; no son observaciones satelitales.'});
})();