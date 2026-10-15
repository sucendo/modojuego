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
  if(!bridge.enabled()||!bridge.visibleEurope()||zoom<5.15)
   return original(R,cx,cy);
  return enriched(R,cx,cy);
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
 // La cobertura del Atlas se aplica a la capa cromática de la tierra.
 // En modo político se mezcla con el color nacional original, y en
 // suministro se conserva sin cambios el indicador estratégico.
 const cover=window.HexategosLandCover0391;
 if(cover&&typeof terrainStrategicFill3247==='function'){
  const baseFill=terrainStrategicFill3247,cached=new Map();
  function codes(key,L){
   let arr=cached.get(key);
   if(!arr||arr.length!==L.n){
    arr=new Uint8Array(L.n);arr.fill(255);cached.set(key,arr);
   }
   return arr;
  }
  terrainStrategicFill3247=function gameAtlasLandcover0400(key,i,L,own,z){
   if(!bridge.enabled()||L.land[i]<0||mapMode3252==='supply')
    return baseFill(key,i,L,own,z);
   const j=i*3,cy=L.centers[j+1]/32767;
   // El clasificador europeo de Atlas solo se aplica donde fue calibrado.
   if(cy<.55||cy>.96)return baseFill(key,i,L,own,z);
   const lon=Math.atan2(L.centers[j],L.centers[j+2])*180/Math.PI;
   if(lon< -27||lon>63)return baseFill(key,i,L,own,z);
   const values=codes(key,L);
   let code=values[i];
   if(code===255){
    const lat=Math.asin(Math.max(-1,Math.min(1,cy)))*180/Math.PI;
    const tier=key===MAX_GAME_LEVEL3233?(mountainTier3212[i]||0):0;
    const result=cover.classify(lat,lon,terrainType3247(key,i,L),tier);
    code=result>=0&&result<254?result:254;
    values[i]=code;
   }
   const rgb=cover.types[code]?.color;
   if(!rgb)return baseFill(key,i,L,own,z);
   if(mapMode3252==='terrain'||own<0)return shadedRGB3247(rgb,z);
   const national=baseFill(key,i,L,own,z);
   const matches=national.match(/\d+/g);
   if(!matches||matches.length<3)return national;
   const physical=rgb.map(c=>Math.round(c*(.72+.28*Math.max(0,z))));
   const result=physical.map((v,k)=>Math.round(v*.55+Number(matches[k])*.45));
   return 'rgb('+result.join(',')+')';
  };
 }
 window.HexategosGameAtlasIntegrated0400=Object.freeze({
  version:'0.40.0',sharedMesh:true,usesGameplaySave:false,
  diagnostics:()=>bridge.diagnostics()
 });
 console.info('[Hexategos Pruebas] Geografía física de Atlas compartida y hexagonal.');
})();