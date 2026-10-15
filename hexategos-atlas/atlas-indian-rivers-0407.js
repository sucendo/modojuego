'use strict';
/* Atlas 0.40.7: afluentes conectados por VERTICES L8 compartidos.
 * El cauce canónico siempre prevalece; no duplica Indo, Ganges,
 * Brahmaputra ni Yamuna. Caché por nombre y grafo 0.40.6 reutilizado.
 */
(function(){
 const data=window.HexategosSubcontinentHydro0407,
  graph=window.HexategosHimalayaGraph0406;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const base=drawTerrain3212,cache=new Map(),reports=new Map();
 const rad=Math.PI/180,MAX_JOIN_KM=185;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function havKm(a,b){
  const c=Math.cos((a.lat+b.lat)*rad/2);
  return Math.hypot((a.lon-b.lon)*111.2*c,(a.lat-b.lat)*111.2);
 }
 function canonicalNodes(name,G){
  if(typeof MAP_RIVERS3242==='undefined'||typeof physicalEdge3242!=='function')
   return [];
  const sys=MAP_RIVERS3242.find(s=>s.n===name);
  if(!sys)return [];
  const result=new Set();
  for(const e of sys.edges){
   const x=physicalEdge3242(e);
   if(x?.u>=0&&G.coords.has(x.u))result.add(x.u);
   if(x?.v>=0&&G.coords.has(x.v))result.add(x.v);
  }
  return [...result];
 }
 function closest(nodes,point,G){
  let id=-1,d=Infinity;
  const near={lon:point[0],lat:point[1]};
  for(const candidate of nodes){
   const p=G.coords.get(candidate);if(!p)continue;
   const km=havKm(p,near);
   if(km<d){d=km;id=candidate}
  }
  return {id,km:d};
 }
 function solve(item,visiting){
  if(cache.has(item.name))return cache.get(item.name);
  if(visiting.has(item.name))throw Error('Confluencia cíclica: '+item.name);
  visiting.add(item.name);
  const G=graph.prepare();
  let parentPath=null,nodes=null,parentType='canonical';
  const internal=data.rivers.find(r=>r.name===item.parent);
  if(internal){
   const parent=solve(internal,visiting);
   parentPath=parent?.path||null;nodes=parentPath;parentType='secondary';
  }else nodes=canonicalNodes(item.parent,G);
  visiting.delete(item.name);
  const snap=closest(nodes||[],item.join,G);
  const maxKm=item.maxJoinKm||MAX_JOIN_KM;
  let failure='';
  if(snap.id<0)failure='Sin río receptor representado en L8';
  else if(snap.km>maxKm)failure='Confluencia demasiado alejada: '+Math.round(snap.km)+' km';
  let plan=null;
  if(!failure){
   const point=G.coords.get(snap.id);
   // El último ancla se obtiene DEL vértice del cauce receptor:
   // confluencia topológica, no sólo proximidad visual de dos líneas.
   const anchors=item.points.slice(0,-1).concat([[point.lon,point.lat]]);
   const candidate=graph.solve(anchors);
   if(!candidate.path)failure=candidate.reason||'Ruta sin solución';
   else if(candidate.path.at(-1)!==snap.id)
    failure='La ruta no termina en el vértice del receptor';
   else{
    const test=graph.validate(candidate.path);
    if(test.usesCoast||test.crossesVirtualWater)
     failure='Cruce por costa o lago virtual';
    else plan={...candidate,
     name:item.name,basin:item.basin,parent:item.parent,
     junction:snap.id,joinDistanceKm:snap.km,parentType};
   }
  }
  cache.set(item.name,plan);
  reports.set(item.name,plan?{
   name:item.name,ok:true,edges:plan.path.length-1,parent:item.parent,
   parentType,joinDistanceKm:Math.round(snap.km*10)/10,
   sameVertex:true,usesCoast:false,crossesVirtualWater:false
  }:{name:item.name,ok:false,parent:item.parent,reason:failure});
  return plan;
 }
 function visible(item,R,cx,cy){
  return item.points.some(([lon,lat])=>{
   const p=lonLatVec(lon,lat),q=projectVec(p[0],p[1],p[2],R,cx,cy);
   return q[2]>.025&&q[0]>-130&&q[0]<vw+130&&q[1]>-130&&q[1]<vh+130;
  });
 }
 function paint(item,plan,R,cx,cy){
  const F=plan.mesh.faceCenters,ids=plan.path,km=plan.total,
   zf=Math.min(1.23,.91+.081*Math.log2(Math.max(1,zoom)));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=1;i<ids.length;i++){
   const a=ids[i-1]*3,b=ids[i]*3;
   const p=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(p[2]<=.025||q[2]<=.025)continue;
   // De las cabeceras estrechas a la confluencia; sin rutas cartesianas.
   const t=(plan.cum[i-1]+plan.cum[i])/(2*km);
   const width=Math.max(.54,Math.min(2.3,
    (.37+.14*Math.sqrt((item.maxWidth||90)*(.2+.8*t)))*zf));
   ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
   ctx.lineWidth=width*1.64;ctx.strokeStyle='rgba(2,32,45,.80)';ctx.stroke();
   ctx.lineWidth=width;ctx.strokeStyle='rgba(107,207,230,.96)';ctx.stroke();
  }
 }
 drawTerrain3212=function atlasSubcontinentHydrology0407(R,cx,cy){
  base(R,cx,cy);
  if(zoom<7||!$('rivers')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleHimalaya()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();
  try{
   for(const item of data.rivers){
    if(zoom<item.minZoom||!visible(item,R,cx,cy))continue;
    const p=solve(item,new Set());if(p)paint(item,p,R,cx,cy);
   }
  }finally{ctx.restore()}
 };
 function inspect(name){
  const item=data.rivers.find(x=>x.name===name);
  return item?solve(item,new Set())?.path.slice()||null:null;
 }
 function validate(name){
  const item=data.rivers.find(x=>x.name===name);
  if(!item)return null;
  const p=solve(item,new Set());
  if(!p)return {name,ok:false,reason:reports.get(name)?.reason};
  const G=graph.prepare(),parent=data.rivers.find(x=>x.name===item.parent);
  const nodes=parent?solve(parent,new Set())?.path:
   canonicalNodes(item.parent,G);
  const geometric=graph.validate(p.path);
  return {name,ok:true,edges:geometric.edges,
   parent:item.parent,sameVertex:!!nodes?.includes(p.junction),
   usesCoast:geometric.usesCoast,
   crossesVirtualWater:geometric.crossesVirtualWater,
   joinDistanceKm:p.joinDistanceKm};
 }
 window.HexategosSubcontinentRivers0407=Object.freeze({
  version:'0.40.7',inspect,validate,
  isDrawnFeature:name=>reports.get(name)?.ok===true,
  diagnostics:()=>[...reports.values()],
  graphBuilds:graph.builds,graphSize:graph.size,
  prepared:()=>cache.size,canonicalNodes:name=>canonicalNodes(name,graph.prepare())
 });
})();