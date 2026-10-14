/* HEXATEGOS ATLAS · Iberia v3 · ríos, crestas y curvas de nivel SOBRE ARISTAS.
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
 // Curvas de nivel esquemáticas: el límite de cada banda se dibuja con
 // aristas auténticas de L8 entre una celda incluida y su vecina excluida.
 // Nunca trazamos perfiles libres ni contornos circulares en píxeles.
 let nearbyCells=null;
 const contoursCache=new Map();
 function iberianCells(){
  if(nearbyCells)return nearbyCells;
  const G=makeGraph(),L=G.L,C=L.centers,O=L.offsets,A=L.adj;
  const cells=[];
  for(let i=0;i<L.n;i++){
   if(L.land[i]<0||!G.included.has(A[O[i]]))continue;
   const j=i*3,lat=Math.asin(Math.max(-1,Math.min(1,C[j+1]/32767)))/rad;
   if(lat<34.8||lat>44.8)continue;
   const lon=Math.atan2(C[j],C[j+2])/rad;
   if(lon<-11||lon>5)continue;
   cells.push({id:i,x:lon*85.2,y:lat*111.2});
  }
  nearbyCells=cells;return cells;
 }
 function mountainContours(sys,path){
  if(contoursCache.has(sys.name))return contoursCache.get(sys.name);
  const G=makeGraph(),L=G.L,O=L.offsets,A=L.adj,N=L.edgeNbr;
  const points=path.map(id=>G.position.get(id));
  const outerRadius=Math.max(30,sys.halfWidthKm||28);
  const innerRadius=Math.min(outerRadius-11,Math.max(16,(sys.halfWidthKm||28)*.55));
  const outer=new Set(),inner=new Set();
  // Cálculo perezoso por cordillera; solo recorremos las celdas ibéricas.
  for(const cell of iberianCells()){
   let d=Infinity;
   for(let k=1;k<points.length;k++){
    const a=points[k-1],b=points[k];
    if(cell.x<Math.min(a.x,b.x)-outerRadius||cell.x>Math.max(a.x,b.x)+outerRadius||
       cell.y<Math.min(a.y,b.y)-outerRadius||cell.y>Math.max(a.y,b.y)+outerRadius)continue;
    d=Math.min(d,segmentDistance(cell.x,cell.y,a,b));
    if(d<=innerRadius)break;
   }
   if(d<=outerRadius)outer.add(cell.id);
   if(d<=innerRadius)inner.add(cell.id);
  }
  function boundary(set){
   const edges=[];
   for(const i of set){
    const st=O[i],end=O[i+1];
    for(let k=st;k<end;k++){
     const other=N[k];
     if(other>=0&&set.has(other))continue;
     const u=A[k],v=A[k+1<end?k+1:st];
     if(u!==v)edges.push([u,v]);
    }
   }
   return edges;
  }
  const result={outer:boundary(outer),inner:boundary(inner)};
  contoursCache.set(sys.name,result);return result;
 }
 function paintHexContour(edges,R,cx,cy,width,color){
  if(!edges.length)return;
  const F=makeGraph().L.faceCenters;
  ctx.beginPath();
  let count=0;
  for(const [u,v] of edges){
   const a=u*3,b=v*3;
   const p=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy);
   const q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(p[2]<=.015||q[2]<=.015)continue;
   ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);count++;
  }
  if(count){ctx.lineCap='butt';ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
 }
 function paintMountain(sys,path,R,cx,cy){
  const contours=mountainContours(sys,path),hi=sys.rank>=3,mid=sys.rank===2;
  // Dos curvas de nivel discretas, ambas exactamente sobre lados de hexágono.
  paintHexContour(contours.outer,R,cx,cy,.68,hi?'rgba(171,150,113,.42)':mid?'rgba(153,136,107,.34)':'rgba(139,126,104,.28)');
  paintHexContour(contours.inner,R,cx,cy,.86,hi?'rgba(208,185,143,.56)':mid?'rgba(191,167,128,.48)':'rgba(170,151,121,.38)');
  // Cresta original de aristas: se conserva su definición y posición.
  if(!drawEdgePath(path,R,cx,cy))return;
  const zf=Math.min(1.2,.86+Math.log2(Math.max(1,zoom))*.075);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=(hi?2.8:mid?2.35:1.9)*zf;
  ctx.strokeStyle=hi?'rgba(80,59,42,.79)':mid?'rgba(77,57,41,.69)':'rgba(71,56,43,.59)';ctx.stroke();
  ctx.lineWidth=(hi?1.3:mid?1.05:.82)*zf;
  ctx.strokeStyle=hi?'rgba(233,218,187,.88)':mid?'rgba(213,193,157,.78)':'rgba(185,172,144,.67)';ctx.stroke();
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
 console.info('[Hexategos Atlas] Ríos, crestas y contornos del relieve sobre aristas L8');
})();