/* HEXATEGOS ATLAS · Iberia v2 · ríos y crestas SOBRE ARISTAS REALES.
 * Solo dibujo: no modifica malla, geología, datos de juego ni guardados.
 * Se carga detrás de atlas-geography.js y delante de atlas-ui.js.
 */
'use strict';
(function installIberiaEdgeRoutes(){
 const geo=globalThis.HEXATEGOS_IBERIA_PHYSICAL_V1;
 if(!geo||typeof drawTerrain3212!=='function'||
 typeof MAP_RIVERS3242==='undefined'||typeof MOUNTAIN_NETWORKS3242==='undefined'){
  console.warn('[Hexategos Atlas] Referencia geográfica ibérica no disponible');return;
 }
 const baseDraw=drawTerrain3212,riverNames=new Set(geo.rivers.map(x=>x.name));
 const canonicalMountains=new Set(['Pirineos','Cordillera Cantábrica','Sistema Central',
 'Sistema Ibérico','Sierra Morena','Cordilleras Béticas']);
 const routeCache=new Map();let meshGraph=null;
 const rad=Math.PI/180;

 function makeGraph(){
  if(meshGraph)return meshGraph;
  const L=loadLevel('8'),adj=L.adj,off=L.offsets,C=L.centers,F=L.faceCenters;
  const neighbors=new Map(),position=new Map();
  const minY=Math.sin(34.8*rad)*32767,maxY=Math.sin(44.8*rad)*32767;
  function getPosition(id){
   let p=position.get(id);if(p)return p;
   const j=3*id,x=F[j]/32767,y=F[j+1]/32767,z=F[j+2]/32767;
   const lat=Math.asin(Math.max(-1,Math.min(1,y)))/rad,lon=Math.atan2(x,z)/rad;
   p={id,lon,lat,x:lon*85.2,y:lat*111.2};position.set(id,p);return p;
  }
  function link(a,b){
   if(a===b)return;
   let ns=neighbors.get(a);if(!ns){ns=new Set();neighbors.set(a,ns)}ns.add(b);
   ns=neighbors.get(b);if(!ns){ns=new Set();neighbors.set(b,ns)}ns.add(a);
   getPosition(a);getPosition(b);
  }
  // Solo celdas terrestres en el entorno ibérico. Las parejas adjacentes
  // de faceCenters son vértices CONSECUTIVOS de la arista del hexágono L8.
  for(let i=0;i<L.n;i++){
   if(L.land[i]<0)continue;
   const j=3*i,cy=C[j+1];if(cy<minY||cy>maxY)continue;
   const lon=Math.atan2(C[j],C[j+2])/rad;if(lon<-11||lon>5)continue;
   const s=off[i],e=off[i+1];
   for(let k=s;k<e;k++)link(adj[k],adj[k+1<e?k+1:s]);
  }
  // Excluir islas y masas desconectadas: componente terrestre mayor.
  const seen=new Set();let mainland=[];
  for(const id of neighbors.keys()){
   if(seen.has(id))continue;
   const group=[id];seen.add(id);
   for(let j=0;j<group.length;j++)for(const next of neighbors.get(group[j])){
    if(!seen.has(next)){seen.add(next);group.push(next)}
   }
   if(group.length>mainland.length)mainland=group;
  }
  const included=new Set(mainland);
  meshGraph={L,neighbors,position,included,verts:mainland.map(getPosition)};
  console.info('[Hexategos Atlas] Grafo ibérico:',mainland.length,'vértices L8');
  return meshGraph;
 }
 function nearest(lonlat,G){
  const x=lonlat[0]*85.2,y=lonlat[1]*111.2;let id=-1,d=Infinity;
  for(const v of G.verts){
   const dx=v.x-x,dy=v.y-y,dd=dx*dx+dy*dy;
   if(dd<d){id=v.id;d=dd}
  }
  return id;
 }
 function segmentDistance(x,y,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,dd=dx*dx+dy*dy;
  const t=dd?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/dd)):0;
  return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
 }
 function push(q,item){
  q.push(item);let i=q.length-1;
  while(i){const parent=(i-1)>>1;if(q[parent][0]<=item[0])break;
   q[i]=q[parent];i=parent}q[i]=item;
 }
 function pop(q){
  const first=q[0],last=q.pop();
  if(q.length){let i=0;while(true){
   const a=2*i+1;if(a>=q.length)break;
   const b=a+1,j=b<q.length&&q[b][0]<q[a][0]?b:a;
   if(q[j][0]>=last[0])break;q[i]=q[j];i=j;
  }q[i]=last}
  return first;
 }
 function findSection(from,to,G){
  if(from===to)return [from];
  const a=G.position.get(from),b=G.position.get(to);
  const best=new Map([[from,0]]),prev=new Map(),heap=[];
  push(heap,[Math.hypot(b.x-a.x,b.y-a.y),0,from]);
  let visited=0;
  while(heap.length&&visited++<14000){
   const [,g,id]=pop(heap);if(g>best.get(id)+1e-8)continue;
   if(id===to){
    const path=[id];let cur=id;
    while(cur!==from){cur=prev.get(cur);if(cur===undefined)return null;path.push(cur)}
    return path.reverse();
   }
   const p=G.position.get(id);
   for(const next of G.neighbors.get(id)||[]){
    if(!G.included.has(next))continue;
    const v=G.position.get(next),distance=Math.hypot(v.x-p.x,v.y-p.y);
    const deviation=segmentDistance((p.x+v.x)/2,(p.y+v.y)/2,a,b);
    const nextG=g+distance*(1+.020*Math.min(deviation,160));
    if(nextG<(best.get(next)??Infinity)-1e-8){
     best.set(next,nextG);prev.set(next,id);
     push(heap,[nextG+Math.hypot(b.x-v.x,b.y-v.y),nextG,next]);
    }
   }
  }
  return null;
 }
 function getRoute(type,sys){
  const key=type+':'+sys.name;if(routeCache.has(key))return routeCache.get(key);
  const G=makeGraph(),ids=sys.points.map(p=>nearest(p,G)),path=[];
  for(let i=1;i<ids.length;i++){
   const piece=findSection(ids[i-1],ids[i],G);
   if(!piece){routeCache.set(key,null);return null}
   for(const node of piece){
    if(node===path[path.length-1])continue;
    if(path.length>1&&node===path[path.length-2])path.pop();
    else path.push(node);
   }
  }
  if(path.length<2){routeCache.set(key,null);return null}
  for(let i=1;i<path.length;i++)
   if(!G.neighbors.get(path[i-1])?.has(path[i])){
    console.warn('[Hexategos Atlas] Arista desconectada:',key);
    routeCache.set(key,null);return null;
   }
  routeCache.set(key,path);return path;
 }
 function drawEdgePath(path,R,cx,cy){
  const F=makeGraph().L.faceCenters;ctx.beginPath();
  let previouslyVisible=false,any=false;
  for(const id of path){
   const i=id*3,p=projectVec(F[i]/32767,F[i+1]/32767,F[i+2]/32767,R,cx,cy);
   const visible=p[2]>.015;
   if(visible){if(previouslyVisible)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);any=true}
   previouslyVisible=visible;
  }
  return any;
 }
 function paintMountain(sys,path,R,cx,cy){
  if(!drawEdgePath(path,R,cx,cy))return;
  const hi=sys.rank>=3,mid=sys.rank===2;
  const w=2*sys.halfWidthKm*R/6371;
  const zf=Math.min(1.2,.86+Math.log2(Math.max(1,zoom))*.075);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=Math.max(.7,w*1.9);ctx.strokeStyle=hi?'rgba(88,73,61,.18)':mid?'rgba(89,78,62,.15)':'rgba(84,75,61,.12)';ctx.stroke();
  ctx.lineWidth=Math.max(.6,w*1.14);ctx.strokeStyle=hi?'rgba(106,91,76,.27)':mid?'rgba(104,91,73,.23)':'rgba(99,88,71,.19)';ctx.stroke();
  ctx.lineWidth=Math.max(.5,w*.59);ctx.strokeStyle=hi?'rgba(166,148,124,.39)':mid?'rgba(148,134,112,.33)':'rgba(137,126,106,.27)';ctx.stroke();
  ctx.lineWidth=Math.max(.45,Math.min(4,w*.13*zf));ctx.strokeStyle=hi?'rgba(233,218,187,.80)':mid?'rgba(213,193,157,.66)':'rgba(185,172,144,.55)';ctx.stroke();
 }
 function paintRiver(sys,path,R,cx,cy){
  if(!drawEdgePath(path,R,cx,cy))return;
  const zf=Math.min(1.30,.91+Math.log2(Math.max(1,zoom))*.083);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=(sys.rank>=3?3.05:2.35)*zf;ctx.strokeStyle='rgba(2,22,34,.72)';ctx.stroke();
  ctx.lineWidth=(sys.rank>=3?1.74:1.22)*zf;
  ctx.strokeStyle=sys.rank>=3?'rgba(111,208,227,.97)':'rgba(100,194,215,.94)';ctx.stroke();
 }
 drawTerrain3212=function drawIberiaEdges(R,cx,cy){
  if(zoom<.82){baseDraw(R,cx,cy);return}
  const showM=$('mountains').checked,showR=$('rivers').checked;
  const mPaths=showM?geo.mountains.map(s=>getRoute('m',s)):[];
  const rPaths=showR?geo.rivers.map(s=>getRoute('r',s)):[];
  const goodM=new Set(geo.mountains.filter((s,i)=>mPaths[i]?.length>1).map(s=>s.name));
  const goodR=new Set(geo.rivers.filter((s,i)=>rPaths[i]?.length>1).map(s=>s.name));
  const hidden=[];
  for(const sys of MAP_RIVERS3242){
   if(!sys.branch&&riverNames.has(sys.n)&&goodR.has(sys.n)){
    hidden.push([sys,sys.edges]);sys.edges=[];
   }
  }
  for(const sys of MOUNTAIN_NETWORKS3242){
   if(!sys.branch&&canonicalMountains.has(sys.n)&&goodM.has(sys.n)){
    hidden.push([sys,sys.edges]);sys.edges=[];
   }
  }
  // Los trazos originales se restauran siempre; no cambiamos datos físicos.
  try{baseDraw(R,cx,cy)}finally{for(const [sys,edges] of hidden)sys.edges=edges}
  ctx.save();
  try{
   if(showM)for(let i=0;i<geo.mountains.length;i++)if(mPaths[i])paintMountain(geo.mountains[i],mPaths[i],R,cx,cy);
   if(showR)for(let i=0;i<geo.rivers.length;i++)if(rPaths[i])paintRiver(geo.rivers[i],rPaths[i],R,cx,cy);
  }finally{ctx.restore()}
 };
 console.info('[Hexategos Atlas] Hidrografía y crestas ibéricas ajustadas a aristas L8');
})();