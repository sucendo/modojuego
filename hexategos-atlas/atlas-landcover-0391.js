'use strict';
/* HEXATEGOS ATLAS 0.39.2 · cubierta del suelo hexágono a hexágono.
 * Capa visual no destructiva. Compatibilidad: sin modificar terrainType3247,
 * mountainTier3212, geología, guardados ni los datos físicos de Hexategos.
 */
(function(){
 const data=window.HexategosLandCover0391;
 if(!data||typeof terrainStrategicFill3247!=='function')return;
 const baseFill=terrainStrategicFill3247,cache=new Map();
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
  const code=coverCode(key,i,L),base=data.types[code]?.color;
  if(!base)return baseFill(key,i,L,own,z);
  // Atlas no tiene propietarios. Si se reutiliza el renderizador con países,
  // preservamos de todas formas el tinte político original.
  const rgb=own<0?base:mixRGB3247(base,hexRGB3247((FACTIONS3230[own]||FACTIONS3230[0]).color),.3);
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
 // Pequeñas copas de árboles dibujadas SOBRE los hexágonos forestales.
 // El verde permite reconocer los bosques a zoom bajo y estos símbolos,
 // reservados para zoom alto, los diferencian de prados y cultivos.
 // Solo se recorren celdas ya visibles; sin búsquedas globales ni timers.
 const forestCodes=new Set(['deciduous','evergreen','conifers','rainforest']
   .map(id=>data.code[id]));
 function drawForests(R,cx,cy){
  if(!showCover||zoom<9||currentKey!==MAX_GAME_LEVEL3233)return 0;
  const L=currentLevel;
  if(!L||!drawn.length)return 0;
  const size=Math.min(4.5,Math.max(1.9,R*.00135));
  const stride=Math.max(1,Math.floor(drawn.length/1700));
  const capped=zoom>=22?540:350;
  let shown=0;
  ctx.save();
  try{
   ctx.lineJoin='round';ctx.lineCap='round';
   for(let k=0;k<drawn.length&&shown<capped;k+=stride){
    const row=drawn[k],i=row[0];
    if(L.land[i]<0||row[3]<.10)continue;
    const code=coverCode(currentKey,i,L);
    if(!forestCodes.has(code))continue;
    const x=row[1],y=row[2];
    if(x<2||x>vw-2||y<2||y>vh-2)continue;
    const conifer=code===data.code.conifers;
    if(conifer){
     ctx.beginPath();
     ctx.moveTo(x,y-size*.91);
     ctx.lineTo(x-size*.72,y+size*.63);
     ctx.lineTo(x+size*.72,y+size*.63);
     ctx.closePath();
    }else{
     // Tres caras de copa forman un pequeño bosque estilizado, en lugar
     // de un icono repetido de un solo árbol sobre todas las casillas.
     ctx.beginPath();
     ctx.arc(x-size*.34,y+size*.04,size*.49,0,Math.PI*2);
     ctx.arc(x+size*.34,y+size*.04,size*.49,0,Math.PI*2);
     ctx.arc(x,y-size*.42,size*.55,0,Math.PI*2);
    }
    ctx.fillStyle='rgba(4,46,31,.68)';
    ctx.fill();
    ctx.beginPath();ctx.moveTo(x,y+size*.36);ctx.lineTo(x,y+size*.95);
    ctx.strokeStyle='rgba(10,39,25,.62)';ctx.lineWidth=Math.max(.5,size*.25);ctx.stroke();
    shown++;
   }
  }finally{ctx.restore()}
  return shown;
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
  version:'0.39.2',cellInfo,coverCode,drawForests,enabled:()=>showCover,
  cacheSize:()=>[...cache.values()].reduce((n,v)=>n+v.length,0),
  types:data.types
 });
})();