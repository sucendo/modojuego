'use strict';
/* Oriente Próximo 0.40.3: relieve e hidrografía por aristas L8.
 * Referencias aproximadas, no GIS métrico. Malla/owner/guardado intocables.
 * Construye un grafo REGIONAL una sola vez y solo al ser visible.
 */
(function(){
 const data=window.HexategosWestAsiaPhysical0403;
 if(!data||typeof drawTerrain3212!=='function'||typeof loadLevel!=='function')return;
 const baseDraw=drawTerrain3212,rad=Math.PI/180;
 const riverRoutes=new Map(),mountainRoutes=new Map(),lakeRoutes=new Map();
 const diagnostics=new Map(),visibleLakes=new Set(),MAX_EXPAND=12000;
 let graph=null,builds=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const greatCircle=(a,b)=>Math.hypot((a.lon-b.lon)*111.2*Math.cos((a.lat+b.lat)*.5*rad),
   (a.lat-b.lat)*111.2);
 function geo(v){const i=v*3,f=graph.L.faceCenters;const x=f[i]/32767,y=f[i+1]/32767,z=f[i+2]/32767;
  const lat=Math.asin(clamp(y,-1,1))/rad;return {lat,lon:Math.atan2(x,z)/rad}}
 function makeGraph(){
  if(graph)return graph;
  const L=loadLevel('8'),P=loadLevel('5'),G=loadGroups('5'),B=data.bounds,
   adj=L.adj,offs=L.offsets,nbr=L.edgeNbr,vertexMap=new Map(),
   neighbors=new Map(),coastEdges=new Set(),coastalNodes=new Set();
  graph={L,vertexMap,neighbors,coastEdges,coastalNodes,vertices:[],bounds:B};
  const seen=new Set(),yc=Math.sin((B.south-2)*rad)*32767,yn=Math.sin((B.north+2)*rad)*32767;
  function register(id){let a=vertexMap.get(id);if(!a){
    a=geo(id);vertexMap.set(id,a);graph.vertices.push(id);
   }return a}
  function link(a,b){let one=neighbors.get(a),two=neighbors.get(b);
   if(!one){one=new Set();neighbors.set(a,one)}
   if(!two){two=new Set();neighbors.set(b,two)}
   one.add(b);two.add(a);
  }
  // Grupos L5 => candidatos L8; evita recorrer toda la malla L8 y
  // no calcula rutas ni escanea el mundo una vez por fotograma.
  for(let p=0;p<P.n;p++){
   const j=p*3,y=P.centers[j+1];if(y<yc||y>yn)continue;
   const lon=Math.atan2(P.centers[j],P.centers[j+2])/rad;
   if(lon<B.west-4||lon>B.east+4)continue;
   for(let k=G.offsets[p],end=G.offsets[p+1];k<end;k++){
    const i=G.ids[k];if(seen.has(i))continue;seen.add(i);
    if(L.land[i]<0)continue;
    const u=i*3,lat=Math.asin(clamp(L.centers[u+1]/32767,-1,1))/rad;
    const lng=Math.atan2(L.centers[u],L.centers[u+2])/rad;
    if(lat<B.south-2||lat>B.north+2||lng<B.west-2||lng>B.east+2)continue;
    for(let e=offs[i],stop=offs[i+1];e<stop;e++){
     const a=adj[e],b=adj[e+1<stop?e+1:offs[i]];
     if(a===b)continue;
     register(a);register(b);link(a,b);
     const other=nbr[e];
     if(other>=0&&L.land[other]<0){
      coastEdges.add(key(a,b));coastalNodes.add(a);coastalNodes.add(b);
     }
    }
   }
  }
  builds++;
  console.info('[Atlas] Oriente Próximo L8:',graph.vertices.length,'vértices; grafo creado una vez');
  return graph;
 }
 function closest(point,G,limit=85){
  const lon=point[0],lat=point[1],cx=Math.cos(lat*rad);
  let best=-1,dist=Infinity;
  for(const id of G.vertices){
   const v=G.vertexMap.get(id),d=Math.hypot((v.lon-lon)*111.2*cx,(v.lat-lat)*111.2);
   if(d<dist){dist=d;best=id}
  }
  return dist<=limit?best:-1;
 }
 function push(h,x){h.push(x);let i=h.length-1;while(i){
  const p=(i-1)>>1;if(h[p][0]<=x[0])break;h[i]=h[p];i=p
 }h[i]=x}
 function pop(h){const a=h[0],last=h.pop();if(h.length){
  let i=0;while(true){const l=i*2+1;if(l>=h.length)break;
   const r=l+1,j=r<h.length&&h[r][0]<h[l][0]?r:l;
   if(h[j][0]>=last[0])break;h[i]=h[j];i=j
  }h[i]=last
 }return a}
 function deviation(p,a,b){
  const cos=Math.cos((a.lat+b.lat)*.5*rad),
   dx=(b.lon-a.lon)*cos,dy=b.lat-a.lat,
   px=(p.lon-a.lon)*cos,py=p.lat-a.lat;
  const sum=dx*dx+dy*dy,t=sum?clamp((px*dx+py*dy)/sum,0,1):0;
  return Math.hypot((px-t*dx)*111.2,(py-t*dy)*111.2);
 }
 function pathBetween(start,end,G,river){
  if(start===end)return [start];
  const target=G.vertexMap.get(end),origin=G.vertexMap.get(start);
  if(!target||!origin)return null;
  const dist=greatCircle(origin,target),heap=[],best=new Map([[start,0]]),prev=new Map();
  push(heap,[dist,0,start]);let expanded=0;
  const cap=Math.min(MAX_EXPAND,Math.max(400,Math.ceil(dist*19)));
  while(heap.length&&expanded++<cap){
   const [,cost,id]=pop(heap);
   if(cost>(best.get(id)??Infinity)+1e-8)continue;
   if(id===end){
    const route=[end];
    for(let u=end;u!==start;){u=prev.get(u);if(u==null)return null;route.push(u)}
    return route.reverse();
   }
   const v=G.vertexMap.get(id);
   for(const u of G.neighbors.get(id)||[]){
    if(river&&G.coastEdges.has(key(id,u)))continue;
    const p=G.vertexMap.get(u),length=greatCircle(v,p);
    const dev=deviation({lat:(p.lat+v.lat)/2,lon:(p.lon+v.lon)/2},origin,target);
    const next=cost+length*(1+.010*Math.min(130,dev));
    if(next+1e-8<(best.get(u)??Infinity)){
     best.set(u,next);prev.set(u,id);push(heap,[next+greatCircle(p,target),next,u]);
    }
   }
  }
  return null;
 }
 function extend(all,part){
  if(!part?.length)return false;
  for(const v of part){
   if(v===all[all.length-1])continue;
   if(all.length>=2&&v===all[all.length-2])all.pop();else all.push(v);
  }
  return true;
 }
 function route(item,kind){
  const cache=kind==='river'?riverRoutes:kind==='lake'?lakeRoutes:mountainRoutes;
  if(cache.has(item.name))return cache.get(item.name);
  const G=makeGraph(),points=kind==='lake'?item.axis:item.points,
   river=kind!=='mountain',anchors=kind==='river'&&item.mouth?points.slice(0,-1):points;
  const all=[],limit=kind==='mountain'?100:kind==='lake'?Math.max(22,Math.min(65,item.widthKm*1.6+15)):75;
  let reason='';
  for(const point of anchors){
   const id=closest(point,G,limit);if(id<0){reason='ancla fuera de tierra L8';break}
   if(!all.length){all.push(id);continue}
   const direct=greatCircle(G.vertexMap.get(all[all.length-1]),G.vertexMap.get(id));
   const part=pathBetween(all[all.length-1],id,G,river);
   if(!part){reason='ruta sin conexión';break}
   let length=0;for(let i=1;i<part.length;i++)length+=greatCircle(G.vertexMap.get(part[i-1]),G.vertexMap.get(part[i]));
   if(length>Math.max(50,direct*(kind==='mountain'?2.9:2.3))){reason='desvío excesivo';break}
   extend(all,part);
  }
  if(!reason&&kind==='river'&&item.mouth){
   const mouth=points[points.length-1],lat=mouth[1],cx=Math.cos(lat*rad);
   let candidates=[];
   for(const id of G.coastalNodes){
    const p=G.vertexMap.get(id),d=Math.hypot((p.lon-mouth[0])*111.2*cx,(p.lat-lat)*111.2);
    if(d<90)candidates.push({id,d});
   }
   candidates.sort((a,b)=>a.d-b.d);
   let reached=false;
   for(const {id} of candidates.slice(0,20)){
    const part=pathBetween(all[all.length-1],id,G,true);
    if(!part||part.length<2)continue;
    if(part.length>=2&&G.coastEdges.has(key(part[part.length-2],id)))continue;
    // Sólo desembocar en un vértice litoral, nunca pintar la costa.
    extend(all,part);reached=true;break;
   }
   if(!reached)reason='desembocadura sin vértice costero seguro';
  }
  if(!reason&&all.length<2)reason='accidente menor que arista L8';
  if(!reason){
   for(let i=1;i<all.length;i++){
    if(!G.neighbors.get(all[i-1])?.has(all[i])||(river&&G.coastEdges.has(key(all[i-1],all[i])))){
     reason='arista no válida';break;
    }
   }
  }
  if(reason){
   diagnostics.set(item.name,{name:item.name,kind,ok:false,reason});
   cache.set(item.name,null);return null;
  }
  const cum=new Float64Array(all.length);
  for(let i=1;i<all.length;i++)
   cum[i]=cum[i-1]+greatCircle(G.vertexMap.get(all[i-1]),G.vertexMap.get(all[i]));
  const plan={path:all,cum,total:cum[cum.length-1]||1,mesh:G.L};
  diagnostics.set(item.name,{
   name:item.name,kind,ok:true,edges:all.length-1,
   mouthVertex:item.mouth?all[all.length-1]:null,
   connected:true,usesCoastalEdges:false
  });
  cache.set(item.name,plan);
  return plan;
 }
 function onscreen(points,R,cx,cy){
  for(const [lon,lat] of points){
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   if(p[2]>.025&&p[0]>-100&&p[0]<vw+100&&p[1]>-100&&p[1]<vh+100)return true;
  }
  return false;
 }
 function drawLine(item,plan,R,cx,cy,kind){
  const F=plan.mesh.faceCenters,points=plan.path;
  const zf=Math.min(1.24,.93+.075*Math.log2(Math.max(1,zoom)));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=1;i<points.length;i++){
   const a=points[i-1]*3,b=points[i]*3,
    p=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(p[2]<=.025||q[2]<=.025)continue;
   const t=(plan.cum[i]+plan.cum[i-1])/(2*plan.total);
   const width=kind==='river'?Math.max(.53,Math.min(2.2,(.38+Math.sqrt(4+(item.maxWidth||80)*t)/8)*zf)):
    Math.max(.65,Math.min(2.8,(.70+(item.elevationM||2000)/3900)*zf));
   ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
   ctx.strokeStyle=kind==='river'?'rgba(2,22,34,.73)':'rgba(71,53,39,.76)';
   ctx.lineWidth=width*1.65;ctx.stroke();
   ctx.strokeStyle=kind==='river'?'rgba(112,209,230,.94)':'rgba(216,185,141,.90)';
   ctx.lineWidth=width;ctx.stroke();
  }
 }
 // Los dos grandes ríos y las cuatro cordilleras principales ya existen
 // en los datos CANÓNICOS. Sólo se ajusta su estilo, nunca su recorrido.
 if(typeof riverStroke3297==='function'){
  const original=riverStroke3297;
  riverStroke3297=function westAsiaMainRiver0403(sys,zf){
   const value=original(sys,zf),profile=data.canonical.rivers[sys.n];
   if(!profile)return value;
   return {...value,ow:Math.min(5,value.ow*1.11),iw:Math.min(3.25,value.iw*1.10)};
  };
 }
 if(typeof mountainStroke3297==='function'){
  const original=mountainStroke3297;
  mountainStroke3297=function westAsiaMainRelief0403(sys,zf){
   const value=original(sys,zf),meta=data.canonical.mountains[sys.n];
   if(!meta)return value;
   const amp=Math.min(1.19,1.04+meta.elevationM/50000);
   return {...value,ow:value.ow*amp,iw:value.iw*amp};
  };
 }
 drawTerrain3212=function westAsiaPhysical0403(R,cx,cy){
  baseDraw(R,cx,cy);
  if(zoom<6.8)return;
  const rivers=$('rivers')?.checked?data.rivers:[],
   mountains=$('mountains')?.checked?data.mountains:[];
  if(!rivers.length&&!mountains.length)return;
  ctx.save();
  try{
   for(const item of rivers)if(zoom>=item.minZoom&&onscreen(item.points,R,cx,cy)){
    const p=route(item,'river');if(p)drawLine(item,p,R,cx,cy,'river');
   }
   for(const item of mountains)if(zoom>=item.minZoom&&onscreen(item.points,R,cx,cy)){
    const p=route(item,'mountain');if(p)drawLine(item,p,R,cx,cy,'mountain');
   }
  }finally{ctx.restore()}
 };
 function drawLakes(R,cx,cy){
  visibleLakes.clear();
  if(zoom<5.8||!($('lakes')?.checked??true))return 0;
  let count=0;
  ctx.save();
  try{
   ctx.lineCap='round';ctx.lineJoin='round';
   for(const lake of data.lakes){
    if(zoom<lake.minZoom||!onscreen(lake.axis,R,cx,cy))continue;
    const p=route(lake,'lake');if(!p)continue;
    const F=p.mesh.faceCenters,width=Math.max(1.2,Math.min(22,lake.widthKm*R/6371*1.12));
    let painted=0;
    for(let i=1;i<p.path.length;i++){
     const a=p.path[i-1]*3,b=p.path[i]*3,
      u=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
      v=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
     if(u[2]<=.025||v[2]<=.025)continue;
     ctx.beginPath();ctx.moveTo(u[0],u[1]);ctx.lineTo(v[0],v[1]);
     ctx.strokeStyle='rgba(4,34,47,.84)';ctx.lineWidth=width+2.0;ctx.stroke();
     ctx.strokeStyle='rgba(50,145,178,.94)';ctx.lineWidth=width;ctx.stroke();
     painted++;
    }
    if(painted){count++;visibleLakes.add(lake.name)}
   }
  }finally{ctx.restore()}
  return count;
 }
 function nearby(lat,lon){
  return data.lakes.filter(lake=>lake.axis.some(([x,y])=>
   Math.hypot((x-lon)*Math.cos(lat*rad),y-lat)<Math.max(.06,lake.widthKm/180))).map(x=>x.name);
 }
 window.HexategosWestAsia0403=Object.freeze({
  version:'0.40.3',drawLakes,nearby,isDrawn:name=>visibleLakes.has(name),
  isDrawnFeature:name=>diagnostics.get(name)?.ok===true,
  diagnostics:()=>[...diagnostics.values()],
  graphSize:()=>graph?.vertices.length||0,graphBuilds:()=>builds,
  prepared:()=>riverRoutes.size+mountainRoutes.size+lakeRoutes.size,
  // Útil para probar exactamente la secuencia resultante en L8.
  inspect:(name)=>{
   const item=data.rivers.find(x=>x.name===name)||
    data.mountains.find(x=>x.name===name)||data.lakes.find(x=>x.name===name);
   if(!item)return null;
   const kind=data.rivers.includes(item)?'river':data.mountains.includes(item)?'mountain':'lake';
   return route(item,kind)?.path.slice()||null;
  }
 });
})();
