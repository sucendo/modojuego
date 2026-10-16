'use strict';
/* Lagos híbridos 0.41.8: SOLO tinta visual. Un hexágono L8 se
 * colorea completo cuando >= 5 de sus 7 muestras geométricas (centro +
 * vértices reales) caen dentro de la franja aproximada del lago.
 * Los restantes segmentos siguen siendo aristas L8 con sus renderizadores
 * europeos/asiáticos originales. No cambia L.land ni la navegabilidad.
 */
(function(){
 const eu=window.HexategosEuropeLakes0396?.lakes||[];
 const as=window.HexategosAsianLakes0417?.lakes||[];
 const rad=Math.PI/180,deg=180/Math.PI;
 const clamp=x=>Math.max(-1,Math.min(1,x));
 const sources=[...eu,...as].filter(l=>l.axis?.length>1&&l.widthKm>=8);
 const lakes=sources.map(l=>{
  const xs=l.axis.map(p=>p[0]),ys=l.axis.map(p=>p[1]);
  const margin=l.widthKm/110+0.12;
  return {name:l.name,axis:l.axis,width:l.widthKm,
   west:Math.min(...xs)-margin,east:Math.max(...xs)+margin,
   south:Math.min(...ys)-margin,north:Math.max(...ys)+margin};
 });
 const cache=new WeakMap(),covered=new WeakMap();
 function edgeKey(a,b){return a<b?a+':'+b:b+':'+a}
 function edgesFor(L){let map=covered.get(L);if(!map){map=new Map();covered.set(L,map)}return map}
 function coveredEdge(name,a,b,L){return edgesFor(L).get(edgeKey(a,b))?.has(name)===true}
 function registerCell(name,i,L){
  const map=edgesFor(L),start=L.offsets[i],end=L.offsets[i+1];
  for(let k=start;k<end;k++){
   const a=L.adj[k],b=L.adj[k+1<end?k+1:start],key=edgeKey(a,b);
   let names=map.get(key);if(!names){names=new Set();map.set(key,names)}names.add(name);
  }
 }
 function coords(A,k){
  const t=k*3;return [Math.atan2(A[t],A[t+2])*deg,
   Math.asin(clamp(A[t+1]/32767))*deg];
 }
 function distanceKm(lon,lat,axis){
  let best=Infinity;
  for(let j=1;j<axis.length;j++){
   const a=axis[j-1],b=axis[j];
   const cos=Math.cos(lat*rad);
   const dx=(b[0]-a[0])*cos,dy=b[1]-a[1];
   const px=(lon-a[0])*cos,py=lat-a[1];
   const t=clamp01((px*dx+py*dy)/(dx*dx+dy*dy||1));
   const d=Math.hypot(px-t*dx,py-t*dy)*111.195;
   if(d<best)best=d;
  }
  return best;
 }
 function clamp01(x){return Math.max(0,Math.min(1,x))}
 function fullCell(i,L,lake,center){
  let inside=distanceKm(center[0],center[1],lake.axis)<=lake.width*.5?1:0;
  const a=L.offsets[i],b=L.offsets[i+1],n=b-a;
  if(n<5||n>7)return false;
  for(let k=a;k<b;k++){
   const v=coords(L.faceCenters,L.adj[k]);
   if(distanceKm(v[0],v[1],lake.axis)<=lake.width*.5)inside++;
  }
  // 5/7 para hexágonos normales; umbral proporcional en pentágonos.
  return inside>=Math.ceil((n+1)*.70);
 }
 function classify(i,L){
  if(L.land[i]<0)return null;
  const center=coords(L.centers,i);
  for(const lake of lakes){
   if(center[0]<lake.west||center[0]>lake.east||
      center[1]<lake.south||center[1]>lake.north)continue;
   if(fullCell(i,L,lake,center))return lake.name;
  }
  return null;
 }
 function lakeFor(key,i,L){
  if(key!=='8'||!L||i<0||i>=L.n)return null;
  let memo=cache.get(L);
  if(!memo){memo=new Map();cache.set(L,memo)}
  if(memo.has(i))return memo.get(i);
  const name=classify(i,L);memo.set(i,name);
  if(name)registerCell(name,i,L);
  return name;
 }
 const previous=terrainStrategicFill3247;
 terrainStrategicFill3247=function hybridLakes0418(key,i,L,own,z){
  const base=previous(key,i,L,own,z);
  if(key!=='8'||typeof $==='function'&&$('lakes')?.checked===false)return base;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&!bridge.enabled())return base;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return base;
  if(!lakeFor(key,i,L))return base;
  const f=.78+.22*Math.max(0,z),water=[45,142,179].map(v=>Math.round(v*f));
  if(mode==='political'){
   const rgb=base.match(/\d+/g);
   if(rgb?.length>=3)return 'rgb('+water.map((v,j)=>Math.round(v*.86+Number(rgb[j])*.14)).join(',')+')';
  }
  return 'rgb('+water.join(',')+')';
 };
 window.HexategosHybridLakes0418=Object.freeze({
  version:'0.41.9',fullCell:lakeFor,coveredEdge,diagnostics:()=>({candidateLakes:lakes.length,
   principle:'L8 native vertices; 70% sample coverage; visual only'})
 });
})();
