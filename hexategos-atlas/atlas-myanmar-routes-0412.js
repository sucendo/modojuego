'use strict';
/* Atlas 0.41.2 · geografía Myanmar en VÉRTICES/ARISTAS reales L8.
 * No se superponen el Salween, Mekong ni Arakan Yoma canónicos.
 * Tierra, propietario, costes y ríos navegables permanecen intactos.
 */
(function(){
 const data=window.HexategosMyanmarPhysical0412,
  graph=window.HexategosMyanmarGraph0412;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const original=drawTerrain3212,cache=new Map(),reports=new Map(),rad=Math.PI/180;
 const groups=[['river',data.rivers],['tributary',data.tributaries],
  ['distributary',data.distributaries],['mountain',data.mountains]];
 const features=new Map(groups.flatMap(([kind,items])=>items.map(item=>[item.name,{...item,kind}])));
 let shoreline=null;
 function distance(a,b){
  return Math.hypot((a.lon-b.lon)*111.2*Math.cos((a.lat+b.lat)*rad/2),
   (a.lat-b.lat)*111.2);
 }
 function pos(G,id){
  const p=G.coords.get(id);return [p.lon,p.lat];
 }
 function nearest(G,ids,location,maximum=Infinity){
  const b={lon:location[0],lat:location[1]};
  let best=-1,km=maximum;
  for(const id of ids){
   const p=G.coords.get(id);
   if(!p)continue;
   const candidate=distance(p,b);
   if(candidate<km){best=id;km=candidate}
  }
  return {id:best,km};
 }
 function native(item){
  if(!item.canonical)return false;
  const names=item.kind==='mountain'?
   (typeof MOUNTAIN_NETWORKS3242!=='undefined'?MOUNTAIN_NETWORKS3242:[]):
   (typeof MAP_RIVERS3242!=='undefined'?MAP_RIVERS3242:[]);
  return names.some(x=>x.n===item.name);
 }
 function shore(G){
  if(shoreline)return shoreline;
  const set=new Set();
  for(const pair of G.coast){
   const [a,b]=pair.split(':').map(Number);
   if(G.coords.has(a))set.add(a);
   if(G.coords.has(b))set.add(b);
  }
  shoreline=[...set];return shoreline;
 }
 function coastCandidates(G,target,limit=110){
  const at={lon:target[0],lat:target[1]};
  return shore(G).map(id=>({id,km:distance(G.coords.get(id),at)}))
   .filter(x=>x.km<=limit).sort((a,b)=>a.km-b.km).slice(0,28);
 }
 function main(item,G){
  const coast=coastCandidates(G,item.mouth,item.maxMouthKm||115);
  if(!coast.length)return {reason:'Sin costa L8 próxima a desembocadura'};
  for(const candidate of coast){
   const plan=graph.solve([...item.points,pos(G,candidate.id)]);
   if(!plan.path||plan.path.at(-1)!==candidate.id||plan.path.length<3)continue;
   if(G.coast.has(graph.edge(plan.path.at(-2),candidate.id)))continue;
   const check=graph.validate(plan.path);
   if(check.usesCoast||check.crossesVirtualWater)continue;
   return {...plan,kind:item.kind,mouth:candidate.id,
    mouthKm:candidate.km,source:plan.path[0]};
  }
  return {reason:'Cauce no alcanza costa nativa L8'};
 }
 function riverChild(item,G,visiting){
  const parent=solve(item.parent,visiting);
  if(!parent?.path)return {reason:'Río receptor no resuelto'};
  const target=nearest(G,parent.path,item.join,
   item.kind==='tributary'?125:125);
  if(target.id<0)return {reason:'No existe confluencia L8 próxima'};
  if(item.kind==='tributary'){
   const plan=graph.solve([...item.points.slice(0,-1),pos(G,target.id)]);
   if(!plan.path||plan.path.at(-1)!==target.id)
    return {reason:plan.reason||'No empalma con el receptor'};
   const check=graph.validate(plan.path);
   if(check.usesCoast||check.crossesVirtualWater)
    return {reason:'Arista costera en afluente'};
   return {...plan,kind:item.kind,parent:item.parent,
    junction:target.id,joinKm:target.km};
  }
  const candidates=coastCandidates(G,item.mouth,item.maxMouthKm||105);
  for(const c of candidates){
   const plan=graph.solve([pos(G,target.id),...item.points,pos(G,c.id)]);
   if(!plan.path||plan.path[0]!==target.id||
    plan.path.at(-1)!==c.id||plan.path.length<2)continue;
   if(G.coast.has(graph.edge(plan.path.at(-2),c.id)))continue;
   const check=graph.validate(plan.path);
   if(check.usesCoast||check.crossesVirtualWater)continue;
   return {...plan,kind:item.kind,parent:item.parent,junction:target.id,
    joinKm:target.km,mouth:c.id,mouthKm:c.km};
  }
  return {reason:'Brazo sin salida válida a costa L8'};
 }
 function solve(name,visiting=new Set()){
  const item=features.get(name);if(!item)return null;
  if(native(item))return null; // nunca sobrepintar redes canónicas
  if(cache.has(name))return cache.get(name);
  if(visiting.has(name))throw Error('Ciclo en cuenca Myanmar: '+name);
  visiting.add(name);
  let result;
  try{
   const G=graph.prepare();
   result=item.kind==='mountain'?graph.solve(item.points):
    item.kind==='river'?main(item,G):riverChild(item,G,visiting);
  }finally{visiting.delete(name)}
  const plan=result?.path?result:null;
  cache.set(name,plan);
  reports.set(name,plan?{
   name,kind:item.kind,ok:true,edges:plan.path.length-1,
   parent:plan.parent||null,joinKm:plan.joinKm??null,
   mouthKm:plan.mouthKm??null
  }:{name,kind:item.kind,ok:false,reason:result?.reason||'Ruta sin solución'});
  return plan;
 }
 function onScreen(item,R,cx,cy){
  return [...item.points,...(item.mouth?[item.mouth]:[])].some(([lon,lat])=>{
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   return p[2]>.02&&p[0]>-140&&p[0]<vw+140&&p[1]>-140&&p[1]<vh+140;
  });
 }
 function paint(item,p,R,cx,cy){
  const F=p.mesh.faceCenters,ids=p.path,total=p.total||1;
  const zf=Math.min(1.28,.87+.085*Math.log2(Math.max(1,zoom)));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let k=1;k<ids.length;k++){
   const a=ids[k-1]*3,b=ids[k]*3,
    x=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    y=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(x[2]<=.02||y[2]<=.02)continue;
   const t=(p.cum[k]+p.cum[k-1])/(2*total);
   const mountain=item.kind==='mountain';
   const base=mountain?.75+(item.elevationM||1500)/3000:
    item.kind==='river'?.67+1.12*Math.sqrt(t):
    item.kind==='distributary'?.75:.5+.65*Math.sqrt(t);
   const width=Math.max(.53,Math.min(2.65,base*zf));
   ctx.beginPath();ctx.moveTo(x[0],x[1]);ctx.lineTo(y[0],y[1]);
   ctx.lineWidth=width*1.62;
   ctx.strokeStyle=mountain?'rgba(64,47,31,.79)':'rgba(3,42,57,.82)';ctx.stroke();
   ctx.lineWidth=width;
   ctx.strokeStyle=mountain?'rgba(221,186,136,.95)':'rgba(109,207,233,.96)';ctx.stroke();
  }
 }
 drawTerrain3212=function atlasMyanmarTerrain0412(R,cx,cy){
  original(R,cx,cy);
  if(zoom<5.9)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleMyanmar()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();
  try{
   for(const [kind,items] of groups){
    if(!$((kind==='mountain'?'mountains':'rivers'))?.checked)continue;
    for(const item of items){
     if(zoom<item.minZoom||native(item)||!onScreen(item,R,cx,cy))continue;
     const plan=solve(item.name);if(plan)paint(item,plan,R,cx,cy);
    }
   }
  }finally{ctx.restore()}
 };
 function validate(name){
  const item=features.get(name);if(!item)return null;
  if(native(item))return {name,ok:true,canonical:true,notDuplicated:true};
  const p=solve(name);
  if(!p)return {name,ok:false,reason:reports.get(name)?.reason};
  const G=graph.prepare(),test=graph.validate(p.path),
   parent=p.parent?solve(p.parent):null;
  return {name,ok:true,kind:item.kind,edges:test.edges,
   usesCoast:test.usesCoast,crossesVirtualWater:test.crossesVirtualWater,
   parentConnected:!p.junction||!!parent?.path.includes(p.junction),
   exactJoin:!p.junction||
    (item.kind==='tributary'?p.path.at(-1)===p.junction:p.path[0]===p.junction),
   nativeMouth:!p.mouth||shore(G).includes(p.mouth),
   joinKm:p.joinKm,mouthKm:p.mouthKm};
 }
 window.HexategosMyanmarRender0412=Object.freeze({
  version:'0.41.2',inspect:name=>solve(name)?.path.slice()||null,
  validate,
  isDrawnFeature:name=>{
   const item=features.get(name);
   return !!(item&&(native(item)||reports.get(name)?.ok));
  },
  diagnostics:()=>[...reports.values()],
  prepareAll:()=>{
   for(const name of features.keys())validate(name);
   return [...reports.values()];
  },
  graphBuilds:graph.builds,graphSize:graph.size,prepared:()=>cache.size,
  shoreCount:()=>shore(graph.prepare()).length
 });
})();