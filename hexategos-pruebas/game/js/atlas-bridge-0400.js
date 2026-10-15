'use strict';
/* Hexategos Pruebas ↔ Atlas: adaptador de controles visuales, 0.40.0.
 * Únicamente renderizado. No cambia la malla, simulación ni guardados.
 */
(function(){
 const KEY='hexategos.atlas.physical.enabled.0400';
 let enabled=true;
 try{enabled=localStorage.getItem(KEY)!=='false'}catch(_){}
 const flag=Object.create(null);
 for(const id of ['rivers','mountains','lakes','regions'])
  flag[id]={get checked(){return enabled}};
 flag.regionMode={value:'natural'};
 const oldDollar=typeof window.$==='function'?window.$:null;
 window.$=function atlasGameControl0400(id){
  if(Object.prototype.hasOwnProperty.call(flag,id))return flag[id];
  return oldDollar?oldDollar(id):document.getElementById(id);
 };
 // Capturar el renderizador del juego ANTES de que Atlas encadene capas.
 window.__atlasOriginalTerrain0400=drawTerrain3212;
 function visibleEurope(){
  if(zoom<1.15)return false;
  const lon=(((-yaw*180/Math.PI+180)%360+360)%360)-180;
  const lat=pitch*180/Math.PI;
  const margin=zoom<3?42:zoom<6?22:zoom<10?10:4;
  return lat>34-margin&&lat<73+margin&&lon>-26-margin&&lon<62+margin;
 }
 function visibleAsia(){
  if(zoom<1.15)return false;
  const lon=(((-yaw*180/Math.PI+180)%360+360)%360)-180;
  const lat=pitch*180/Math.PI;
  const margin=zoom<3?42:zoom<6?22:zoom<10?10:4;
  return lat> -9-margin&&lat<77+margin&&lon>25-margin&&lon<180;
 }
 function visibleWestAsia(){
  if(zoom<1.15)return false;
  const lon=(((-yaw*180/Math.PI+180)%360+360)%360)-180;
  const lat=pitch*180/Math.PI;
  const margin=zoom<5?17:zoom<9?9:5;
  return lon>=25-margin&&lon<=67+margin&&lat>=12-margin&&lat<=49+margin;
 }
 function setEnabled(value){
  enabled=!!value;
  try{localStorage.setItem(KEY,String(enabled))}catch(_){}
  if(typeof needsRender!=='undefined')needsRender=true;
 }
 const control=document.getElementById('landingAtlasPhysical0400');
 if(control){
  control.checked=enabled;
  control.addEventListener('change',()=>setEnabled(control.checked));
 }
 window.HexategosGameAtlasBridge0400=Object.freeze({
  version:'0.40.0',enabled:()=>enabled,visibleEurope,visibleAsia,visibleWestAsia,setEnabled,
  diagnostics:()=>({
   enabled,europe:visibleEurope(),asia:visibleAsia(),westAsia:visibleWestAsia(),
   lakeRoutes:window.HexategosEuropeLakes0396?.diagnostics?.()||null,
   secondaryGraph:window.HexategosEuropeSecondaryRender0396?.graphSize?.()||0
  })
 });
})();