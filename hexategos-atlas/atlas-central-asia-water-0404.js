'use strict';
/* HEXATEGOS 0.40.4 · aguas interiores VISUALES de Asia Central.
 * Pintar únicamente hexágonos de la malla original, jamás polígonos
 * de costa, sin alterar land, propietarios, navegación, IA ni guardado.
 * El Caspio ya figura como agua nativa L8 y permanece intacto.
 */
(function(){
 const data=window.HexategosCentralAsiaPhysical0404;
 if(!data||typeof terrainStrategicFill3247!=='function')return;
 const base=terrainStrategicFill3247,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function visible(){
  const bridge=window.HexategosGameAtlasBridge0400;
  return !bridge||bridge.enabled();
 }
 function eligible(key){
  // Los cuerpos pequeños sólo pueden representarse con fidelidad en L8.
  return key==='8';
 }
 function isWater(key,i,L){
  if(!eligible(key)||i<0||i>=L.n||L.land[i]<0)return null;
  const j=i*3,y=L.centers[j+1];
  // Rechazo entero antes de trigonometría: >99% de las celdas L8 no
  // están en las latitudes de estas cuencas.
  if(y<21250||y>24150)return null;
  const lat=Math.asin(clamp(y/32767,-1,1))*180/Math.PI;
  if(lat<40.5||lat>47.4)return null;
  const lon=Math.atan2(L.centers[j],L.centers[j+2])*180/Math.PI;
  if(lon<56||lon>83)return null;
  return data.bodyAt(lon,lat);
 }
 function fill(key,i,L,own,z){
  const old=base(key,i,L,own,z);
  if(window.HexategosAsianLakes0417?.enabled)return old;
  if(!visible())return old;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&!bridge.visibleCentralAsia())return old;
  if(typeof $==='function'&&$('lakes')?.checked===false)return old;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return old;
  const body=isWater(key,i,L);
  if(!body)return old;
  // No son mares navegables de Hexategos: tinte político residual en
  // vista jugable. La visualización física utiliza azul pleno.
  const g=.72+.28*Math.max(0,z),water=[37,120,156].map(v=>Math.round(v*g));
  if(mode==='political'){
   const oldRGB=old.match(/\d+/g);
   if(oldRGB?.length>=3){
    return 'rgb('+water.map((v,k)=>Math.round(v*.78+Number(oldRGB[k])*.22)).join(',')+')';
   }
  }
  return 'rgb('+water.join(',')+')';
 }
 terrainStrategicFill3247=fill;
 window.HexategosCentralAsiaWater0404=Object.freeze({
  version:'0.40.4',isWater,diagnostics:()=>({bodies:data.waterBodies.map(b=>b.name),nativeCaspianPreserved:true,
   changesGameplayLand:false})
 });
})();
