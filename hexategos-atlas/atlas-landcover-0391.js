'use strict';
/* HEXATEGOS ATLAS 0.39.3 · cubierta del suelo hexágono a hexágono.
 * Capa visual no destructiva. Compatibilidad: sin modificar terrainType3247,
 * mountainTier3212, geología, guardados ni los datos físicos de Hexategos.
 */
(function(){
 const data=window.HexategosLandCover0391;
 if(!data||typeof terrainStrategicFill3247!=='function')return;
 const baseFill=terrainStrategicFill3247,cache=new Map();
 const ecotone=window.HexategosLandCoverTransitions0402;
 const central=window.HexategosCentralAsiaLandcover0405;
 const himalaya=window.HexategosHimalayaLandcover0406;
 const peninsularIndia=window.HexategosPeninsularIndiaLandcover0409;
 const sriEco=window.HexategosSriLankaLandcover0411;
 const myanmarEco=window.HexategosMyanmarLandcover0412;
 const indochinaEco=window.HexategosIndochinaLandcover0415;
 const remainingEco=window.HexategosAsiaCompletionLandcover0416;
 const australiaEco=window.HexategosAustraliaLandcover0420;
 const deltas=window.HexategosIndianDeltaLandcover0408;
 let showCover=true;
 function codes(key,L){
  let result=cache.get(key);
  if(!result||result.length!==L.n){
   result=new Uint8Array(L.n);result.fill(255);cache.set(key,result);
  }
  return result;
 }
 function coverCode(key,i,L){
  if(i<0||i>=L.n||L.land[i]<0)return -1;
  const values=codes(key,L);
  if(values[i]!==255)return values[i];
  const j=i*3;
  const lat=Math.asin(clamp(L.centers[j+1]/32767,-1,1))*DEG;
  const lon=Math.atan2(L.centers[j]/32767,L.centers[j+2]/32767)*DEG;
  const biome=terrainType3247(key,i,L);
  const tier=key===MAX_GAME_LEVEL3233?(mountainTier3212[i]||0):0;
  const type=data.classify(lat,lon,biome,tier);
  values[i]=type>=0?type:254;
  return type;
 }
 terrainStrategicFill3247=function(key,i,L,own,z){
  if(!showCover||L.land[i]<0)return baseFill(key,i,L,own,z);
  const code=coverCode(key,i,L),raw=ecotone?.color(key,i,L)||data.types[code]?.color;
  const centralColor=raw&&central?central.rgbForCell(key,i,L,raw):raw;
  const mountainColor=centralColor&&himalaya?himalaya.rgbForCell(key,i,L,centralColor):centralColor;
  const peninsulaColor=mountainColor&&peninsularIndia?peninsularIndia.rgbForCell(key,i,L,mountainColor):mountainColor;
  const wetIsland=peninsulaColor&&sriEco?sriEco.rgbForCell(key,i,L,peninsulaColor):peninsulaColor;
  const mainland=wetIsland&&myanmarEco?myanmarEco.rgbForCell(key,i,L,wetIsland):wetIsland;
  const deltaColor=mainland&&deltas?deltas.rgbForCell(key,i,L,mainland):mainland;
  const peninsular=deltaColor&&indochinaEco?indochinaEco.rgbForCell(key,i,L,deltaColor):deltaColor;
  const base=peninsular&&remainingEco?remainingEco.rgbForCell(key,i,L,peninsular):peninsular;
  const oceania=base&&australiaEco?australiaEco.rgbForCell(key,i,L,base):base;
  if(!oceania)return baseFill(key,i,L,own,z);
  // Atlas no tiene propietarios. Si se reutiliza el renderizador con países,
  // preservamos de todas formas el tinte político original.
  const rgb=own<0?oceania:mixRGB3247(oceania,hexRGB3247((FACTIONS3230[own]||FACTIONS3230[0]).color),.3);
  return shadedRGB3247(rgb,z);
 };
 function cellInfo(i){
  const L=loadLevel('8');
  if(!Number.isInteger(i)||i<0||i>=L.n||L.land[i]<0)return '';
  const code=coverCode('8',i,L),type=data.types[code];
  if(!type)return '';
  const [r,g,b]=type.color;
  return '<div class="atlasCover0391">'+
    '<span class="atlasCoverChip0391" style="background:rgb('+r+','+g+','+b+')"></span>'+
    '<span><b>Cobertura estimada:</b> '+escapeHTML(type.name)+
    '<small>Modelo geográfico orientativo · no es un inventario forestal ni un dato satelital verificado.</small></span></div>';
 }
 function renderLegend(){
  const host=$('coverLegendList');
  if(!host)return;
  host.replaceChildren();
  for(const type of data.types){
   const item=document.createElement('div');item.className='atlasCoverLegendItem0391';
   const chip=document.createElement('i');chip.style.background='rgb('+type.color.join(',')+')';
   const label=document.createElement('span');label.textContent=type.name;
   item.append(chip,label);host.append(item);
  }
 }
 function enabled(value){
  showCover=!!value;
  const legend=$('coverLegend');if(legend)legend.hidden=!showCover;
  if(typeof invalidate==='function')invalidate();
 }
 renderLegend();
 const control=$('cover');if(control){showCover=control.checked;control.addEventListener('change',()=>enabled(control.checked))}
 window.HexategosAtlasLandCover0391=Object.freeze({
  version:'0.39.3',cellInfo,coverCode,enabled:()=>showCover,
  cacheSize:()=>[...cache.values()].reduce((n,v)=>n+v.length,0),
  types:data.types
 });
})();