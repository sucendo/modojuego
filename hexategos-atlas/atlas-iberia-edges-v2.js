/* HEXATEGOS ATLAS · Iberia v5 · ríos físicos con desembocadura en arista costera L8.
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
 const riverMouthDiagnostics=[];
 const rad=Math.PI/180;

 function makeGraph(){
  if(meshGraph)return meshGraph;
  const L=loadLevel('8'),adj=L.adj,off=L.offsets,C=L.centers,F=L.faceCenters;
  const neighbors=new Map(),position=new Map(),coastEdges=[];
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
   for(let k=s;k<e;k++){
    const u=adj[k],v=adj[k+1<e?k+1:s];
    link(u,v);
    const other=L.edgeNbr[k];
    if(other>=0&&L.land[other]<0)coastEdges.push([u,v]);
   }
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
  const seenCoast=new Set(),coastline=[];
  for(const [u,v] of coastEdges){
   if(!included.has(u)||!included.has(v))continue;
   const key=Math.min(u,v)+','+Math.max(u,v);
   if(seenCoast.has(key))continue;seenCoast.add(key);
   const a=getPosition(u),b=getPosition(v);
   coastline.push({u,v,x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  }
  meshGraph={L,neighbors,position,included,coastline,verts:mainland.map(getPosition)};
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
 // La desembocadura es un lado real compartido entre tierra y mar.
 // Nunca aproximar el final del río al centro de un hexágono costero.
 function coastalMouth(sys,G){
  const mouth=sys.points[sys.points.length-1],x=mouth[0]*85.2,y=mouth[1]*111.2;
  let chosen=null,best=Infinity;
  for(const edge of G.coastline){
   const d=Math.hypot(edge.x-x,edge.y-y);
   if(d<best){chosen=edge;best=d}
  }
  if(!chosen)return null;
  if(best>60)console.warn('[Hexategos Atlas] Desembocadura distante del punto de referencia:',sys.name,best.toFixed(0)+' km');
  return {edge:chosen,deviationKm:best};
 }
 function appendPiece(path,piece){
  if(!piece||!piece.length)return false;
  for(const id of piece){
   if(id===path[path.length-1])continue;
   if(path.length>1&&id===path[path.length-2])path.pop();
   else path.push(id);
  }
  return true;
 }
 function getRoute(type,sys){
  const key=type+':'+sys.name;
  if(routeCache.has(key))return routeCache.get(key);
  const G=makeGraph(),isRiver=type==='r';
  const mouth=isRiver?coastalMouth(sys,G):null;
  if(isRiver&&!mouth){routeCache.set(key,null);return null}
  const waypoints=(isRiver?sys.points.slice(0,-1):sys.points).map(p=>nearest(p,G));
  const path=[];
  if(!waypoints.length||waypoints.some(id=>id<0)){routeCache.set(key,null);return null}
  path.push(waypoints[0]);
  for(let i=1;i<waypoints.length;i++){
   if(!appendPiece(path,findSection(path[path.length-1],waypoints[i],G))){
    routeCache.set(key,null);return null;
   }
  }
  if(isRiver){
   const edge=mouth.edge,from=path[path.length-1];
   const a=G.position.get(edge.u),b=G.position.get(edge.v),p=G.position.get(from);
   const useU=Math.hypot(a.x-p.x,a.y-p.y)<=Math.hypot(b.x-p.x,b.y-p.y);
   let start=useU?edge.u:edge.v,finish=useU?edge.v:edge.u;
   let section=findSection(from,start,G);
   if(!section){
    [start,finish]=[finish,start];
    section=findSection(from,start,G);
   }
   if(!appendPiece(path,section)){routeCache.set(key,null);return null}
   if(path[path.length-1]!==start){routeCache.set(key,null);return null}
   // La última arista ES la costa. No se dibuja ningún segmento mar adentro.
   path.push(finish);
   riverMouthDiagnostics.push({name:sys.name,deviationKm:mouth.deviationKm,
     landCellEdge:[start,finish]});
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
 // Las crestas se dibujan SOLAMENTE sobre aristas L8: sin bandas
 // exteriores, halos ni curvas de nivel alrededor de la cordillera.
 function paintMountain(sys,path,R,cx,cy){
  if(!drawEdgePath(path,R,cx,cy))return;
  const hi=sys.rank>=3,mid=sys.rank===2;
  const zf=Math.min(1.2,.86+Math.log2(Math.max(1,zoom))*.075);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=(hi?2.8:mid?2.35:1.9)*zf;
  ctx.strokeStyle=hi?'rgba(80,59,42,.79)':mid?'rgba(77,57,41,.69)':'rgba(71,56,43,.59)';ctx.stroke();
  ctx.lineWidth=(hi?1.3:mid?1.05:.82)*zf;
  ctx.strokeStyle=hi?'rgba(233,218,187,.88)':mid?'rgba(213,193,157,.78)':'rgba(185,172,144,.67)';ctx.stroke();
 }
 // Calibre fluvial basado en el perfil de cauce aproximado por tramos,
 // NO en jerarquía/«importancia» del río. La anchura se amplifica para
 // mantener legibilidad en el globo, no representa una escala métrica 1:1.
 function physicalChannelMeters(sys,fraction){
  const profile=sys.channelMeters;
  if(!profile||!profile.length)return 20;
  const f=Math.max(0,Math.min(1,fraction));
  for(let i=1;i<profile.length;i++){
   const a=profile[i-1],b=profile[i];
   if(f<=b[0]){
    const t=(f-a[0])/Math.max(1e-9,b[0]-a[0]);
    return a[1]+(b[1]-a[1])*t;
   }
  }
  return profile[profile.length-1][1];
 }
 function riverWidthPixels(metres){
  const zf=Math.min(1.28,.91+Math.log2(Math.max(1,zoom))*.082);
  return Math.max(.46,Math.min(3.35,(.34+Math.sqrt(Math.max(1,metres))/.65e1)*zf));
 }
 function paintRiver(sys,path,R,cx,cy){
  if(path.length<2)return;
  const G=makeGraph(),F=G.L.faceCenters,n=path.length;
  const positions=new Array(n),lengths=new Float64Array(n);
  for(let i=0;i<n;i++){
   const id=path[i],v=G.position.get(id),k=id*3;
   positions[i]=projectVec(F[k]/32767,F[k+1]/32767,F[k+2]/32767,R,cx,cy);
   if(i){
    const prev=G.position.get(path[i-1]);
    lengths[i]=lengths[i-1]+Math.hypot(v.x-prev.x,v.y-prev.y);
   }
  }
  const total=Math.max(lengths[n-1],1),segments=[];
  let current=null;
  function flush(){
   if(current?.points.length>1)segments.push(current);
   current=null;
  }
  // Agrupación por décimas de píxel para evitar miles de llamadas a stroke
  // al desplazar el mapa: se mantiene el perfil por sección y su continuidad.
  for(let i=1;i<n;i++){
   const a=positions[i-1],b=positions[i];
   if(a[2]<=.015||b[2]<=.015){flush();continue}
   const metres=physicalChannelMeters(sys,(lengths[i-1]+lengths[i])/(2*total));
   const width=Math.round(riverWidthPixels(metres)*5)/5;
   if(!current||current.width!==width){
    flush();current={width,points:[a]};
   }
   current.points.push(b);
  }
  flush();
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const run of segments){
   ctx.beginPath();
   for(let i=0;i<run.points.length;i++){
    const p=run.points[i];
    if(!i)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
   }
   ctx.lineWidth=run.width*1.65;
   ctx.strokeStyle='rgba(2,22,34,.76)';ctx.stroke();
   ctx.lineWidth=run.width;
   ctx.strokeStyle='rgba(111,208,227,.97)';ctx.stroke();
  }
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
 window.HexategosIberiaRiverDiagnostics=Object.freeze({mouths:()=>riverMouthDiagnostics.map(x=>({...x}))});
 console.info('[Hexategos Atlas] Ríos de anchura variable y desembocaduras en arista costera L8');
})();