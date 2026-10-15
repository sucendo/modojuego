'use strict';
/* 0.41.1: grafo Sri Lanka L8 regional, nunca une áreas por agua.
 * A* sobre vértices nativos, caché perezosa y bloqueo de aristas costeras.
 */
(function(){
 const data=window.HexategosSriLankaPhysical0411;if(!data)return;
 let graph=null,builds=0;
 const rad=Math.PI/180,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),
  edge=(a,b)=>a<b?a+':'+b:b+':'+a;
 const distance=(a,b)=>Math.hypot((a.lon-b.lon)*111.2*
  Math.cos((a.lat+b.lat)*rad/2),(a.lat-b.lat)*111.2);
 function prepare(){
  if(graph)return graph;
  const L=loadLevel('8'),P=loadLevel('5'),G=loadGroups('5'),b=data.bounds,
   coords=new Map(),adjacent=new Map(),coast=new Set(),lake=new Set(),
   vertices=[],seen=new Set(),y0=Math.sin((b.south-2)*rad)*32767,
   y1=Math.sin((b.north+2)*rad)*32767;
  function vertex(id){
   if(coords.has(id))return coords.get(id);
   const j=id*3,F=L.faceCenters;
   const p={lat:Math.asin(clamp(F[j+1]/32767,-1,1))/rad,
    lon:Math.atan2(F[j],F[j+2])/rad};
   coords.set(id,p);vertices.push(id);return p;
  }
  function link(a,b){
   if(!adjacent.has(a))adjacent.set(a,new Set());
   if(!adjacent.has(b))adjacent.set(b,new Set());
   adjacent.get(a).add(b);adjacent.get(b).add(a);
  }
  for(let p=0;p<P.n;p++){
   const j=p*3;
   if(P.centers[j+1]<y0||P.centers[j+1]>y1)continue;
   const lon=Math.atan2(P.centers[j],P.centers[j+2])/rad;
   if(lon<b.west-4||lon>b.east+4)continue;
   for(let g=G.offsets[p];g<G.offsets[p+1];g++){
    const i=G.ids[g];if(seen.has(i))continue;seen.add(i);
    if(L.land[i]<0)continue;
    const k=i*3,lat=Math.asin(clamp(L.centers[k+1]/32767,-1,1))/rad,
     x=Math.atan2(L.centers[k],L.centers[k+2])/rad;
    if(lat<b.south-2||lat>b.north+2||x<b.west-2||x>b.east+2)continue;
    const body=data.bodyAt(x,lat);
    for(let e=L.offsets[i],end=L.offsets[i+1];e<end;e++){
     const a=L.adj[e],z=L.adj[e+1<end?e+1:L.offsets[i]];
     if(a===z)continue;
     vertex(a);vertex(z);link(a,z);
     const other=L.edgeNbr[e],id=edge(a,z);
     if(other>=0&&L.land[other]<0){coast.add(id);continue}
     if(body){lake.add(id);continue}
     if(other>=0&&L.land[other]>=0){
      const o=other*3,
       y=Math.asin(clamp(L.centers[o+1]/32767,-1,1))/rad,
       lon=Math.atan2(L.centers[o],L.centers[o+2])/rad;
      if(data.bodyAt(lon,y))lake.add(id);
     }
    }
   }
  }
  graph={L,coords,adjacent,coast,lake,vertices};
  builds++;
  return graph;
 }
 function anchor(G,[lon,lat]){
  const cx=Math.cos(lat*rad);let best=-1,km=Infinity;
  for(const id of G.vertices){
   const p=G.coords.get(id),d=Math.hypot((p.lon-lon)*111.2*cx,(p.lat-lat)*111.2);
   if(d<km){km=d;best=id}
  }
  return km<110?best:-1;
 }
 function push(h,v){
  let i=h.length;h.push(v);
  while(i){const p=(i-1)>>1;if(h[p][0]<=v[0])break;h[i]=h[p];i=p}
  h[i]=v;
 }
 function pop(h){
  const a=h[0],v=h.pop();
  if(h.length){
   let i=0;while(true){
    const l=i*2+1;if(l>=h.length)break;
    const r=l+1,k=r<h.length&&h[r][0]<h[l][0]?r:l;
    if(h[k][0]>=v[0])break;h[i]=h[k];i=k;
   }h[i]=v;
  }
  return a;
 }
 function segment(G,start,end){
  if(start===end)return [start];
  const A=G.coords.get(start),B=G.coords.get(end),d=distance(A,B),
   heap=[],best=new Map([[start,0]]),prev=new Map();
  push(heap,[d,0,start]);
  let expanded=0;const cap=Math.min(20000,Math.max(800,Math.ceil(d*24)));
  while(heap.length&&expanded++<cap){
   const [,cost,id]=pop(heap);
   if(cost>(best.get(id)??Infinity)+1e-8)continue;
   if(id===end){
    const out=[id];let at=id;
    while(at!==start){at=prev.get(at);if(at==null)return null;out.push(at)}
    return out.reverse();
   }
   const p=G.coords.get(id);
   for(const next of G.adjacent.get(id)||[]){
    if(G.coast.has(edge(id,next))||G.lake.has(edge(id,next)))continue;
    const q=G.coords.get(next);
    const c=Math.cos((A.lat+B.lat)*rad/2),
     dx=(B.lon-A.lon)*c,dy=B.lat-A.lat,
     px=(q.lon-A.lon)*c,py=q.lat-A.lat,
     den=dx*dx+dy*dy,
     t=den?clamp((px*dx+py*dy)/den,0,1):0,
     off=Math.hypot(px-t*dx,py-t*dy)*111.2;
    const score=cost+distance(p,q)*(1+.008*Math.min(100,off));
    if(score+1e-8<(best.get(next)??Infinity)){
     best.set(next,score);prev.set(next,id);
     push(heap,[score+distance(q,B),score,next]);
    }
   }
  }
  return null;
 }
 function solve(points){
  const G=prepare(),anchors=points.map(p=>anchor(G,p)),all=[];
  if(anchors.some(x=>x<0))return {reason:'Ancla sin tierra L8'};
  for(let k=1;k<anchors.length;k++){
   const part=segment(G,anchors[k-1],anchors[k]);
   if(!part)return {reason:'Ruta topológica no resuelta'};
   const direct=distance(G.coords.get(anchors[k-1]),G.coords.get(anchors[k]));
   let km=0;for(let j=1;j<part.length;j++)
    km+=distance(G.coords.get(part[j-1]),G.coords.get(part[j]));
   if(km>Math.max(75,direct*3.1))return {reason:'Desvío excesivo'};
   if(!all.length)all.push(part[0]);
   all.push(...part.slice(1));
  }
  if(all.length<2)return {reason:'Sin aristas L8'};
  const cum=new Float64Array(all.length);
  for(let k=1;k<all.length;k++){
   const id=edge(all[k-1],all[k]);
   if(!G.adjacent.get(all[k-1])?.has(all[k])||
    G.coast.has(id)||G.lake.has(id))return {reason:'Arista no válida'};
   cum[k]=cum[k-1]+distance(G.coords.get(all[k-1]),G.coords.get(all[k]));
  }
  return {path:all,cum,total:cum[all.length-1]||1,mesh:G.L};
 }
 window.HexategosSriLankaGraph0411=Object.freeze({
  solve,prepare,edge,builds:()=>builds,size:()=>graph?.vertices.length||0,
  validate:path=>{
   if(!graph||!path)return null;
   return {edges:path.length-1,
    usesCoast:path.some((id,k)=>k>0&&graph.coast.has(edge(path[k-1],id))),
    crossesVirtualWater:path.some((id,k)=>k>0&&graph.lake.has(edge(path[k-1],id)))};
  }
 });
})();