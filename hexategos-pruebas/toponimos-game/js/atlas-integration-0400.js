'use strict';
/* Capas cartográficas compartidas. No escribe owner6, L.land ni saves. */
(function(){
 const bridge=window.HexategosGameAtlasBridge0400;
 if(!bridge||typeof drawTerrain3212!=='function'||typeof drawGeographicLabels3243!=='function'){
  console.warn('[Hexategos Pruebas] Atlas físico no conectado');return;
 }
 const original=window.__atlasOriginalTerrain0400;
 const enriched=drawTerrain3212;
 const baseNames=drawGeographicLabels3243;
 // Un solo canal físico. Todos los módulos de Atlas son renderizadores
 // de aristas L8 y reutilizan cachés, nunca reconstruyen celdas del juego.
 drawTerrain3212=function gameAtlasTerrain0400(R,cx,cy){
  if(!bridge.enabled()||!(bridge.visibleEurope()||bridge.visibleWestAsia()||bridge.visibleCentralAsia()||bridge.visibleHimalaya())||zoom<5.15)
   return original(R,cx,cy);
  enriched(R,cx,cy);
  // En el juego drawTerrain3212 es el único pase físico: incluir los
  // lagos aquí, mientras que Atlas los añade desde su renderizador.
  if(bridge.visibleEurope())window.HexategosEuropeLakes0396?.draw(R,cx,cy);
  if(bridge.visibleWestAsia())window.HexategosWestAsia0403?.drawLakes(R,cx,cy);
 };
 drawGeographicLabels3243=function gameAtlasLabels0400(R,cx,cy){
  if(!showLabels)return;
  if(!bridge.enabled()||!(bridge.visibleEurope()||bridge.visibleAsia())||zoom<1.5)
   return baseNames(R,cx,cy);
  const macro=window.HexategosAtlasMacro0396,regions=window.HexategosAtlasRegions0390;
  // Evitar duplicar la toponimia europea y asiática del juego. Las demás zonas
  // mantienen las macroetiquetas y regiones originales de Hexategos.
  if(macro&&regions){macro.draw(R,cx,cy);regions.draw(R,cx,cy)}
  else baseNames(R,cx,cy);
 };
 // Los colores físicos se calculan una sola vez por hexágono visible.
 // Los bordes rectangulares de cobertura se funden progresivamente, sin
 // tocar las categorías usadas por la IA, las fronteras ni los guardados.
 const cover=window.HexategosLandCover0391;
 const ecotones=window.HexategosLandCoverTransitions0402;
 const centralEco=window.HexategosCentralAsiaLandcover0405;
 const himalayaEco=window.HexategosHimalayaLandcover0406;
 const deltaEco=window.HexategosIndianDeltaLandcover0408;
 if(cover&&typeof terrainStrategicFill3247==='function'){
  const baseFill=terrainStrategicFill3247,cache=new Map();
  function codes(key,L){
   let arr=cache.get(key);
   if(!arr||arr.length!==L.n){arr=new Uint8Array(L.n);arr.fill(255);cache.set(key,arr)}
   return arr;
  }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function regionWeight(lat,lon,w,e,s,n){
   // Cuatro grados de transición a ambos lados del límite de cobertura.
   const d=Math.min(lon-w,e-lon,lat-s,n-lat);
   const t=clamp((d+2.5)/5,0,1);
   return t*t*(3-2*t);
  }
  terrainStrategicFill3247=function gameAtlasLandcover0402(key,i,L,own,z){
   if(!bridge.enabled()||L.land[i]<0||
      (mapMode3252!=='terrain'&&mapMode3252!=='political'))
    return baseFill(key,i,L,own,z);
   const j=i*3,lat=Math.asin(clamp(L.centers[j+1]/32767,-1,1))*180/Math.PI;
   const lon=Math.atan2(L.centers[j],L.centers[j+2])*180/Math.PI;
   const weight=Math.max(
    regionWeight(lat,lon,-25.3,61,35.4,72.3),
    regionWeight(lat,lon,25,179.9,-9,77)
   );
   if(weight<=0)return baseFill(key,i,L,own,z);
   let rgb=ecotones?.color(key,i,L);
   if(!rgb){
    const arr=codes(key,L),v=arr[i];
    let code=v;
    if(code===255){
     const tier=key===MAX_GAME_LEVEL3233?(mountainTier3212[i]||0):0;
     code=cover.classify(lat,lon,terrainType3247(key,i,L),tier);
     arr[i]=code>=0&&code<254?code:254;
    }
    rgb=cover.types[arr[i]]?.color;
   }
   if(rgb&&centralEco)rgb=centralEco.rgbForCell(key,i,L,rgb);
   if(rgb&&himalayaEco)rgb=himalayaEco.rgbForCell(key,i,L,rgb);
   if(rgb&&deltaEco)rgb=deltaEco.rgbForCell(key,i,L,rgb);
   if(!rgb)return baseFill(key,i,L,own,z);
   const base=baseFill(key,i,L,own,z);
   const vals=base.match(/\d+/g);
   if(!vals||vals.length<3)return base;
   const shaded=rgb.map(c=>Math.round(c*(.72+.28*Math.max(0,z))));
   // En político prevalece el país y el terreno actúa como textura.
   const intensity=(mapMode3252==='terrain'?1:.50)*weight;
   return 'rgb('+shaded.map((c,k)=>
    Math.round(c*intensity+Number(vals[k])*(1-intensity))).join(',')+')';
  };
 }
 window.HexategosGameAtlasIntegrated0400=Object.freeze({
  version:'0.40.0',sharedMesh:true,usesGameplaySave:false,
  diagnostics:()=>bridge.diagnostics()
 });
 console.info('[Hexategos Pruebas] Geografía física de Atlas compartida y hexagonal.');
})();