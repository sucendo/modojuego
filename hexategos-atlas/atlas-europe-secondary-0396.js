'use strict';
/* HEXATEGOS ATLAS 0.39.6 · Red secundaria europea por aristas L8.
 * No modifica la malla ni las líneas canónicas. Calcula rutas bajo demanda,
 * sólo para sistemas visibles con zoom suficiente, con caché por sistema.
 * Los puntos de control son aproximados, NO cartografía hidrográfica oficial.
 */
(function(){
 const data=window.HexategosEuropeSecondary0396;
 if(!data||typeof drawTerrain3212!=='function')return;
 const baseDraw=drawTerrain3212,rad=Math.PI/180;
 const riverCache=new Map(),mountainCache=new Map(),status=new Map();
 let graph=null;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const key=(a,b)=>a<b?a+','+b:b+','+a;
 function makeGraph(){
  if(graph)return graph;
  const L=loadLevel('8'),C=L.centers,F=L.faceCenters,offs=L.offsets,adj=L.adj;
  const neighbors=new Map(),position=new Map(),coastEdges=new Set(),coastalNodes=new Set();
  const south=Math.sin(33.9*rad)*32767,north=Math.sin(72.5*rad)*32767;
  function coord(id){
   let p=position.get(id);if(p)return p;
   const j=id*3,x=F[j]/32767,y=F[j+1]/32767,z=F[j+2]/32767;
   const lat=Math.asin(clamp(y,-1,1))/rad,lon=Math.atan2(x,z)/rad;
   p={id,x:lon*111.2*Math.cos(lat*rad),y:lat*111.2,lon,lat};
   position.set(id,p);return p;
  }
  for(let i=0;i<L.n;i++){
   if(L.land[i]<0)continue;
   const q=3*i,latCode=C[q+1];
   if(latCode<south||latCode>north)continue;
   const lon=Math.atan2(C[q],C[q+2])/rad;
   if(lon<-26||lon>62)continue;
   for(let k=offs[i],e=offs[i+1];k<e;k++){
    const u=adj[k],v=adj[k+1<e?k+1:offs[i]],other=L.edgeNbr[k];
    if(u===v)continue;
    if(!neighbors.has(u))neighbors.set(u,new Set());
    if(!neighbors.has(v))neighbors.set(v,new Set());
    neighbors.get(u).add(v);neighbors.get(v).add(u);
    coord(u);coord(v);
    if(other>=0&&L.land[other]<0){
     coastEdges.add(key(u,v));coastalNodes.add(u);coastalNodes.add(v);
    }
   }
  }
  const verts=[...position.values()];
  graph={L,neighbors,position,verts,coastEdges,coastalNodes};
  console.info('[Atlas] Grafo secundario europeo L8:',verts.length,'vértices');
  return graph;
 }
 // Distancia métrica aproximada en km para caminos de latitudes medias.
 function km(a,b){
  const dx=(a.lon-b.lon)*111.2*Math.cos((a.lat+b.lat)*.5*rad);
  const dy=(a.lat-b.lat)*111.2;return Math.hypot(dx,dy);
 }
 function closest(ref,G){
  const lat=ref[1],lon=ref[0],lonK=111.2*Math.cos(lat*rad),y=lat*111.2;
  let pick=-1,best=Infinity;
  for(const p of G.verts){
   const d=(p.lon-lon)*lonK,dy=p.y-y,ds=d*d+dy*dy;
   if(ds<best){best=ds;pick=p.id}
  }
  return pick;
 }
 function segmentDistance(p,a,b){
  const cos=Math.cos((a.lat+b.lat)*.5*rad);
  const ax=a.lon*111.2*cos,ay=a.y,bx=b.lon*111.2*cos,by=b.y;
  const px=p.lon*111.2*cos,py=p.y,dx=bx-ax,dy=by-ay;
  const d=dx*dx+dy*dy,t=d?clamp(((px-ax)*dx+(py-ay)*dy)/d,0,1):0;
  return Math.hypot(px-ax-t*dx,py-ay-t*dy);
 }
 function push(heap,item){
  heap.push(item);let i=heap.length-1;
  while(i){let parent=(i-1)>>1;if(heap[parent][0]<=item[0])break;
   heap[i]=heap[parent];i=parent}heap[i]=item;
 }
 function pop(heap){
  const first=heap[0],last=heap.pop();
  if(heap.length){let i=0;while(true){
   const a=i*2+1;if(a>=heap.length)break;
   const b=a+1,j=b<heap.length&&heap[b][0]<heap[a][0]?b:a;
   if(heap[j][0]>=last[0])break;heap[i]=heap[j];i=j;
  }heap[i]=last}return first;
 }
 function findPath(from,to,G,isRiver){
  if(from===to)return [from];
  const a=G.position.get(from),b=G.position.get(to);
  if(!a||!b)return null;
  const distance=km(a,b),best=new Map([[from,0]]),prev=new Map(),heap=[];
  push(heap,[distance,0,from]);
  let expanded=0;
  const limit=Math.max(250,Math.min(10000,500+Math.ceil(distance)*15));
  while(heap.length&&expanded++<limit){
   const [,cost,id]=pop(heap);
   if(cost>(best.get(id)??Infinity)+1e-8)continue;
   if(id===to){
    const out=[id];while(out[out.length-1]!==from){
     const last=prev.get(out[out.length-1]);if(last==null)return null;
     out.push(last);
    }
    return out.reverse();
   }
   const p=G.position.get(id);
   for(const other of G.neighbors.get(id)||[]){
    if(isRiver&&G.coastEdges.has(key(id,other)))continue;
    const v=G.position.get(other),d=km(p,v);
    const deviation=segmentDistance({lon:(p.lon+v.lon)/2,y:(p.y+v.y)/2},a,b);
    const ncost=cost+d*(1+.012*Math.min(180,deviation));
    if(ncost<(best.get(other)??Infinity)-1e-8){
     best.set(other,ncost);prev.set(other,id);
     push(heap,[ncost+km(v,b),ncost,other]);
    }
   }
  }
  return null;
 }
 function join(path,part){
  if(!part?.length)return false;
  for(const id of part){
   if(path[path.length-1]===id)continue;
   if(path.length>=2&&path[path.length-2]===id)path.pop();
   else path.push(id);
  }
  return true;
 }
 function route(item,river){
  const cache=river?riverCache:mountainCache;
  if(cache.has(item.name))return cache.get(item.name);
  const G=makeGraph(),waypoints=item.points.map(p=>closest(p,G)),path=[];
  let error=null;
  if(waypoints.some(n=>n<0)){error='missing_waypoint'}
  else{
   path.push(waypoints[0]);
   for(let i=1;i<waypoints.length;i++){
    const part=findPath(path[path.length-1],waypoints[i],G,river);
    if(!join(path,part)){error='disconnected_waypoints';break}
   }
  }
  if(!error&&river&&item.mouth){
   const ref=item.points[item.points.length-1],lat=ref[1],lon=ref[0];
   const possibilities=[...G.coastalNodes].map(id=>{
    const p=G.position.get(id);
    return {id,d:Math.hypot((p.lon-lon)*111.2*Math.cos(lat*rad),(p.lat-lat)*111.2)};
   }).filter(x=>x.d<135).sort((a,b)=>a.d-b.d).slice(0,14);
   let chosen=null;
   for(const c of possibilities){
    const part=findPath(path[path.length-1],c.id,G,true);
    if(!part)continue;
    const alternative=path.slice();join(alternative,part);
    const prev=alternative[alternative.length-2],end=alternative[alternative.length-1];
    if(end===c.id&&prev!==undefined&&!G.coastEdges.has(key(prev,end))&&
       !G.coastalNodes.has(prev)){chosen=alternative;break}
   }
   if(chosen){path.splice(0,path.length,...chosen)}
   else error='coastal_intersection_unavailable';
  }
  if(!error&&(path.length<2||path.some((id,i)=>i>0&&
     (!G.neighbors.get(path[i-1])?.has(id)||
       river&&G.coastEdges.has(key(path[i-1],id))))))error='invalid_edges';
  if(error){
   status.set(item.name,{name:item.name,kind:river?'river':'mountain',ok:false,reason:error});
   cache.set(item.name,null);return null;
  }
  const cum=new Float64Array(path.length);
  for(let i=1;i<path.length;i++)cum[i]=cum[i-1]+km(G.position.get(path[i-1]),G.position.get(path[i]));
  const plan={path,cum,total:Math.max(.1,cum[cum.length-1])};
  status.set(item.name,{name:item.name,kind:river?'river':'mountain',ok:true,
    edges:path.length-1,coastal:river&&item.mouth});
  cache.set(item.name,plan);return plan;
 }
 function visible(item,R,cx,cy){
  const points=item.points;
  for(const [lon,lat] of points){
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   if(p[2]>.03&&p[0]>-110&&p[0]<vw+110&&p[1]>-110&&p[1]<vh+110)return true;
  }
  return false;
 }
 function widthAt(item,fraction){
  const p=item.channelMeters;
  if(!p)return 20;
  const f=clamp(fraction,0,1);
  for(let i=1;i<p.length;i++)if(f<=p[i][0]){
   const t=(f-p[i-1][0])/Math.max(1e-9,p[i][0]-p[i-1][0]);
   return p[i-1][1]*(1-t)+p[i][1]*t;
  }
  return p[p.length-1][1];
 }
 function strokeSegments(item,plan,R,cx,cy,river){
  const G=makeGraph(),F=G.L.faceCenters,path=plan.path,groups=[];
  const zf=Math.min(1.28,.91+Math.log2(Math.max(1,zoom))*.082);
  const h=(item.elevationM||900)/5000,r=item.ruggedness||.55,a=item.accessibility||.5;
  const mountainWidth=(.65+1.25*h+.58*(r+1-a)/2)*zf;
  let current=null;
  function flush(){if(current?.coords.length>1)groups.push(current);current=null}
  for(let i=1;i<path.length;i++){
   const u=path[i-1]*3,v=path[i]*3;
   const P=projectVec(F[u]/32767,F[u+1]/32767,F[u+2]/32767,R,cx,cy);
   const Q=projectVec(F[v]/32767,F[v+1]/32767,F[v+2]/32767,R,cx,cy);
   if(P[2]<=.015||Q[2]<=.015){flush();continue}
   const width=river?Math.round(Math.max(.45,Math.min(2.6,
     (.30+Math.sqrt(widthAt(item,(plan.cum[i]+plan.cum[i-1])/(2*plan.total)))/7)*zf))*5)/5:
     Math.round(mountainWidth*5)/5;
   if(!current||current.width!==width){flush();current={width,coords:[P]}}
   current.coords.push(Q);
  }
  flush();
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const group of groups){
   ctx.beginPath();
   for(let i=0;i<group.coords.length;i++){
    const p=group.coords[i];
    if(i===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
   }
   ctx.lineWidth=river?group.width*1.6:group.width*1.85;
   ctx.strokeStyle=river?'rgba(2,22,34,.76)':'rgba(71,53,39,.74)';ctx.stroke();
   ctx.lineWidth=group.width;
   ctx.strokeStyle=river?'rgba(112,209,230,.94)':'rgba(216,185,141,.88)';ctx.stroke();
  }
 }
 drawTerrain3212=function europeSecondaryLayers0396(R,cx,cy){
  baseDraw(R,cx,cy);
  if(zoom<7.2)return;
  const rivers=$('rivers')?.checked?data.rivers.filter(x=>zoom>=x.minZoom&&visible(x,R,cx,cy)):[];
  const mountains=$('mountains')?.checked?data.mountains.filter(x=>zoom>=x.minZoom&&visible(x,R,cx,cy)):[];
  if(!rivers.length&&!mountains.length)return;
  ctx.save();
  try{
   for(const item of rivers){const plan=route(item,true);if(plan)strokeSegments(item,plan,R,cx,cy,true)}
   for(const item of mountains){const plan=route(item,false);if(plan)strokeSegments(item,plan,R,cx,cy,false)}
  }finally{ctx.restore()}
 };
 window.HexategosEuropeSecondaryRender0396=Object.freeze({
  version:'0.39.6',diagnostics:()=>[...status.values()],graphSize:()=>graph?.verts.length||0
 });
})();
