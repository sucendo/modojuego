'use strict';
/* Sri Lanka 0.41.1 · etiquetas verificadas con L8, no islas inventadas.
 * Rótulos marinos solo sobre centros de celdas de AGUA nativa; rótulos
 * terrestres sólo donde ya existe una celda de tierra nativa.
 */
(function(){
 const data=window.HexategosSriLankaPhysical0411;if(!data)return;
 const cache=new Map(),rad=Math.PI/180;
 function cellCenter(i,L){
  const j=i*3,y=L.centers[j+1]/32767;
  return [Math.atan2(L.centers[j],L.centers[j+2])/rad,
   Math.asin(Math.max(-1,Math.min(1,y)))/rad];
 }
 function km(a,b){
  return Math.hypot((a[0]-b[0])*111.2*Math.cos((a[1]+b[1])*rad/2),
   (a[1]-b[1])*111.2);
 }
 function resolve(feature){
  const key=feature.name;
  if(cache.has(key))return cache.get(key);
  if(typeof nearestDetailed!=='function'||typeof loadLevel!=='function')return null;
  const v=lonLatVec(feature.center[0],feature.center[1]);
  const start=nearestDetailed({x:v[0],y:v[1],z:v[2]}),L=loadLevel('8');
  if(!Number.isInteger(start)||start<0||start>=L.n)return null;
  const kind=feature.sriKind||feature.kind,
   landRequired=kind==='island'||kind==='peak',
   maxKm=landRequired?20:55,scan=[start],seen=new Set([start]);
  // Una isla pequeña cuya celda nativa está en el mar NO se etiqueta
  // sobre tierra continental vecina. Los montes requieren tierra propia.
  if(landRequired&&L.land[start]<0){cache.set(key,null);return null}
  let best=null;
  // Buscar vecinos locales. Nunca materializar nuevas celdas/islas.
  for(let at=0;at<scan.length&&at<110;at++){
   const id=scan[at],p=cellCenter(id,L),d=km(p,feature.center),
    good=landRequired?L.land[id]>=0:L.land[id]<0;
   if(good&&d<=maxKm&&(!best||d<best.km))
    best={id,center:p,km:d,land:L.land[id]>=0};
   if(d>85||at>=85)continue;
   for(let e=L.offsets[id];e<L.offsets[id+1];e++){
    const j=L.edgeNbr[e];
    if(j>=0&&!seen.has(j)){seen.add(j);scan.push(j)}
   }
  }
  const result=best?{...best,name:key,kind}:null;
  cache.set(key,result);return result;
 }
 window.HexategosSriLankaPlacement0411=Object.freeze({
  version:'0.41.1',
  valid:feature=>!!resolve(feature),
  centerFor:feature=>resolve(feature)?.center||null,
  diagnostics:()=>[...cache].map(([name,result])=>({
   name,valid:!!result,id:result?.id??null,
   land:result?.land??null,distanceKm:result?.km??null
  }))
 });
})();