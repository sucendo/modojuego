'use strict';
/* Atlas 0.41.0: seis cauces, afluentes y deltas sobre ARISTAS L8.
 * Geometría de malla real; las referencias [lon,lat] son sólo anclas.
 * No cambia L.land, coste, ríos jugables, navegación o partidas.
 */
(function(){
 const data=window.HexategosPeninsularHydro0410,
  graph=window.HexategosPeninsularIndiaGraph0409;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const base=drawTerrain3212,cache=new Map(),reports=new Map(),
  rad=Math.PI/180;
 const mainByName=new Map(data.main.map(x=>[x.name,x])),
  tributaryByName=new Map(data.tributaries.map(x=>[x.name,x])),
  deltaByName=new Map(data.deltas.map(x=>[x.name,x]));
 let shore=null;
 function geoKm(a,b){
  return Math.hypot((a.lon-b.lon)*111.2*Math.cos((a.lat+b.lat)*rad/2),
   (a.lat-b.lat)*111.2);
 }
 function nearest(nodes,coord,G,limit=Infinity){
  const goal={lon:coord[0],lat:coord[1]};let best=-1,km=limit;
  for(const id of nodes){
   const p=G.coords.get(id);if(!p)continue;
   const dist=geoKm(p,goal);
   if(dist<km){best=id;km=dist}
  }
  return {id:best,km};
 }
 function shoreNodes(G){
  if(shore)return shore;
  const result=new Set();
  for(const key of G.coast){
   const [a,b]=key.split(':').map(Number);
   if(G.coords.has(a))result.add(a);
   if(G.coords.has(b))result.add(b);
  }
  shore=[...result];return shore;
 }
 function coastalCandidates(G,lonlat,radius=115){
  const goal={lon:lonlat[0],lat:lonlat[1]},found=[];
  for(const id of shoreNodes(G)){
   const p=G.coords.get(id),dist=geoKm(goal,p);
   if(dist<=radius)found.push({id,km:dist});
  }
  return found.sort((a,b)=>a.km-b.km).slice(0,25);
 }
 function geo(id,G){const p=G.coords.get(id);return [p.lon,p.lat]}
 function resolveMain(item){
  const G=graph.prepare();
  const native=typeof MAP_RIVERS3242!=='undefined'&&
   MAP_RIVERS3242.some(x=>x.n===item.name);
  if(native)return {reason:'El río ya existe en la red canónica; sin duplicado'};
  const candidates=coastalCandidates(G,item.mouth,item.maxMouthKm||115);
  if(!candidates.length)return {reason:'Sin costa L8 cercana'};
  for(const c of candidates){
   const anchors=item.points.concat([geo(c.id,G)]);
   const plan=graph.solve(anchors);
   if(!plan.path||plan.path.at(-1)!==c.id)continue;
   if(plan.path.length<3)continue;
   if(G.coast.has(graph.edge(plan.path.at(-2),c.id)))continue;
   const validation=graph.validate(plan.path);
   if(validation.usesCoast||validation.crossesVirtualWater)continue;
   return {...plan,name:item.name,kind:'main',source:plan.path[0],
    mouth:c.id,mouthKm:c.km,parent:null};
  }
  return {reason:'No hay ruta costera segura en L8'};
 }
 function resolveChild(item,kind,visiting){
  const G=graph.prepare(),parent=solve(item.parent,visiting);
  if(!parent?.path)return {reason:'Río receptor sin ruta L8'};
  const join=nearest(parent.path,item.join,G,kind==='delta'?110:100);
  if(join.id<0)return {reason:'Confluencia sin cauce receptor cercano'};
  let path=null,plan=null,coastKm=null;
  if(kind==='tributary'){
   plan=graph.solve(item.points.slice(0,-1).concat([geo(join.id,G)]));
   if(!plan.path||plan.path.at(-1)!==join.id)return {reason:plan.reason||'No empalma en receptor'};
   path=plan.path;
  }else{
   const candidates=coastalCandidates(G,item.mouth,item.maxMouthKm||90);
   for(const c of candidates){
    plan=graph.solve([geo(join.id,G),...item.points,geo(c.id,G)]);
    if(!plan.path||plan.path[0]!==join.id||
      plan.path.at(-1)!==c.id||plan.path.length<3)continue;
    if(G.coast.has(graph.edge(plan.path.at(-2),c.id)))continue;
    const valid=graph.validate(plan.path);
    if(valid.usesCoast||valid.crossesVirtualWater)continue;
    path=plan.path;coastKm=c.km;break;
   }
   if(!path)return {reason:'Difluencia sin salida costera L8'};
  }
  const check=graph.validate(path);
  if(!check||check.usesCoast||check.crossesVirtualWater)
   return {reason:'Ruta usa arista costera o lago virtual'};
  return {...plan,name:item.name,kind,parent:item.parent,
   join:join.id,joinKm:join.km,
   mouth:kind==='delta'?path.at(-1):null,mouthKm:coastKm};
 }
 function solve(name,visiting=new Set()){
  if(cache.has(name))return cache.get(name);
  if(visiting.has(name))throw Error('Ciclo de afluentes: '+name);
  const item=mainByName.get(name)||tributaryByName.get(name)||deltaByName.get(name);
  if(!item)return null;
  visiting.add(name);
  const kind=mainByName.has(name)?'main':tributaryByName.has(name)?'tributary':'delta';
  let candidate;
  try{candidate=kind==='main'?resolveMain(item):resolveChild(item,kind,visiting)}
  finally{visiting.delete(name)}
  const plan=candidate?.path?candidate:null;
  cache.set(name,plan);
  reports.set(name,plan?{
   name,kind,parent:plan.parent,ok:true,edges:plan.path.length-1,
   mouthKm:plan.mouthKm,joinKm:plan.joinKm,atCoast:!!plan.mouth,
   connected:true
  }:{name,kind,ok:false,reason:candidate?.reason||'Sin aristas L8'});
  return plan;
 }
 function visible(item,R,cx,cy){
  const points=item.points||[];
  return [...points,...(item.mouth?[item.mouth]:[])].some(([lon,lat])=>{
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   return p[2]>.02&&p[0]>-110&&p[0]<vw+110&&p[1]>-110&&p[1]<vh+110;
  });
 }
 function paint(item,plan,R,cx,cy){
  const F=plan.mesh.faceCenters,path=plan.path,
   zoomScale=Math.min(1.24,.91+.079*Math.log2(Math.max(1,zoom))),
   length=plan.total||1;
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=1;i<path.length;i++){
   const a=path[i-1]*3,b=path[i]*3,
    x=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    y=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(x[2]<=.02||y[2]<=.02)continue;
   const t=(plan.cum[i]+plan.cum[i-1])/(2*length),
    baseWidth=plan.kind==='main'?(.70+1.13*Math.sqrt(t)):
     plan.kind==='tributary'?(.54+.68*Math.sqrt(t)):.75;
   const width=Math.max(.5,Math.min(2.6,baseWidth*zoomScale));
   ctx.beginPath();ctx.moveTo(x[0],x[1]);ctx.lineTo(y[0],y[1]);
   ctx.lineWidth=width*1.65;ctx.strokeStyle='rgba(3,40,53,.80)';ctx.stroke();
   ctx.lineWidth=width;ctx.strokeStyle='rgba(111,206,230,.94)';ctx.stroke();
  }
 }
 drawTerrain3212=function atlasPeninsularHydro0410(R,cx,cy){
  base(R,cx,cy);
  if(zoom<6.2||!$('rivers')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visiblePeninsularIndia()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();
  try{
   for(const [items,kind] of [[data.main,'main'],
    [data.tributaries,'tributary'],[data.deltas,'delta']]){
    for(const item of items){
     if(zoom<item.minZoom||!visible(item,R,cx,cy))continue;
     const plan=solve(item.name);
     if(plan)paint(item,plan,R,cx,cy);
    }
   }
  }finally{ctx.restore()}
 };
 function validate(name){
  const plan=solve(name);
  if(!plan)return {name,ok:false,reason:reports.get(name)?.reason};
  const G=graph.prepare(),valid=graph.validate(plan.path);
  const parent=plan.parent&&solve(plan.parent);
  return {name,ok:true,kind:plan.kind,edges:valid.edges,
   usesCoast:valid.usesCoast,crossesVirtualWater:valid.crossesVirtualWater,
   connected:!plan.join||!!parent?.path.includes(plan.join),
   joinsExactVertex:!plan.join||plan.kind==='tributary'?
    (!plan.join||plan.path.at(-1)===plan.join):
    plan.path[0]===plan.join,
   nativeMouth:!plan.mouth||shoreNodes(G).includes(plan.mouth),
   mouthKm:plan.mouthKm,joinKm:plan.joinKm,
   source:plan.source,shore:plan.mouth};
 }
 window.HexategosPeninsularHydroRender0410=Object.freeze({
  version:'0.41.0',inspect:name=>solve(name)?.path.slice()||null,
  validate,isDrawnFeature:name=>reports.get(name)?.ok===true,
  diagnostics:()=>[...reports.values()],
  prepareAll:()=>{
   for(const name of [...mainByName.keys(),...tributaryByName.keys(),...deltaByName.keys()])
    solve(name);
   return [...reports.values()];
  },
  graphBuilds:graph.builds,graphSize:graph.size,
  prepared:()=>cache.size,shoreCount:()=>shoreNodes(graph.prepare()).length
 });
})();