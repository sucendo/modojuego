'use strict';
/* 0.41.6 · cartografía secundaria de Siberia, China/Mongolia, Corea/
 * Japón, península malaya y archipiélagos. Solo segmentos sobre aristas
 * tierra-tierra REALES L8; las redes canónicas nunca se redibujan.
 */
(function(){
 const data=window.HexategosAsiaCompletion0416,
  graph=window.HexategosAsiaCompletionGraph0416;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const prior=drawTerrain3212,rad=Math.PI/180,
  cache=new Map(),reports=new Map(),coasts=new Map();
 const distances=(a,b)=>Math.hypot((a.lon-b.lon)*111.2*
  Math.cos((a.lat+b.lat)*rad/2),(a.lat-b.lat)*111.2);
 function pAt(G,id){const p=G.coords.get(id);return [p.lon,p.lat]}
 function coastline(zoneId,G){
  if(coasts.has(zoneId))return coasts.get(zoneId);
  const points=new Set();
  for(const e of G.coast){
   const [a,b]=e.split(':').map(Number);
   if(G.coords.has(a))points.add(a);
   if(G.coords.has(b))points.add(b);
  }
  const ids=[...points];coasts.set(zoneId,ids);return ids;
 }
 function shoreCandidates(item,G){
  if(!item.mouth)return [];
  const target={lon:item.mouth[0],lat:item.mouth[1]};
  const bound=item.maxMouthKm||110;
  return coastline(item.region,G).map(id=>({id,km:distances(G.coords.get(id),target)}))
   .filter(x=>x.km<=bound).sort((a,b)=>a.km-b.km).slice(0,14);
 }
 function solve(item){
  if(cache.has(item.name))return cache.get(item.name);
  const G=graph.prepare(item.region);
  let result=null,reason='';
  if(item.kind==='mountain'){
   const p=graph.solve(item.points,item.region);
   if(!p.path)reason=p.reason||'Sin recorrido L8';
   else result=p;
  }else{
   const candidates=shoreCandidates(item,G);
   if(!candidates.length)reason='No hay desembocadura costera L8';
   else for(const target of candidates){
    const p=graph.solve([...item.points,pAt(G,target.id)],item.region);
    if(!p.path||p.path.at(-1)!==target.id)continue;
    if(G.coast.has(graph.edge(p.path.at(-2),target.id)))continue;
    const check=graph.validate(p.path,item.region);
    if(check?.usesCoast||check?.crossesVirtualWater||!check?.allAdjacent)continue;
    result={...p,mouthVertex:target.id,mouthKm:target.km};break;
   }
   if(!result&&!reason)reason='No se encontró ruta terrestre hasta la costa L8';
  }
  if(result){
   const check=graph.validate(result.path,item.region);
   if(!check||check.usesCoast||check.crossesVirtualWater||!check.allAdjacent)
    {reason='Recorrido no válido sobre aristas L8';result=null}
  }
  cache.set(item.name,result);
  reports.set(item.name,result?{name:item.name,region:item.region,kind:item.kind,
   ok:true,edges:result.path.length-1,mouthKm:result.mouthKm??null}:{
   name:item.name,region:item.region,kind:item.kind,ok:false,reason
  });
  return result;
 }
 function onScreen(item,R,cx,cy){
  return item.points.some(([lon,lat])=>{
   const u=lonLatVec(lon,lat),p=projectVec(u[0],u[1],u[2],R,cx,cy);
   return p[2]>.025&&p[0]>-190&&p[0]<vw+190&&p[1]>-160&&p[1]<vh+160;
  });
 }
 function drawRoute(item,plan,R,cx,cy){
  const F=plan.mesh.faceCenters,ids=plan.path,total=plan.total||1;
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let j=1;j<ids.length;j++){
   const a=ids[j-1]*3,b=ids[j]*3,
    p=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(p[2]<=.025||q[2]<=.025)continue;
   const mountain=item.kind==='mountain',
    frac=(plan.cum[j]+plan.cum[j-1])/(2*total),
    size=(mountain?.93:.65+.66*Math.sqrt(frac))*
     Math.min(1.3,.85+.095*Math.log2(Math.max(1,zoom)));
   ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
   ctx.lineWidth=size*1.55;
   ctx.strokeStyle=mountain?'rgba(70,51,34,.79)':'rgba(3,36,51,.84)';
   ctx.stroke();
   ctx.lineWidth=size;
   ctx.strokeStyle=mountain?'rgba(219,183,137,.96)':'rgba(107,207,230,.96)';
   ctx.stroke();
  }
 }
 drawTerrain3212=function asianCompletionTerrain0416(R,cx,cy){
  prior(R,cx,cy);
  if(zoom<6.2)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleAsiaRemaining()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  const kinds=[['river','rivers'],['mountain','mountains']];
  ctx.save();try{
   for(const [kind,control] of kinds){
    if(!$(control)?.checked)continue;
    for(const item of data.features){
     if(item.kind!==kind||zoom<(item.minZoom||8)||!onScreen(item,R,cx,cy))continue;
     const plan=solve(item);if(plan)drawRoute(item,plan,R,cx,cy);
    }
   }
  }finally{ctx.restore()}
 };
 function validate(name){
  const item=data.features.find(x=>x.name===name);
  if(!item)return null;
  const plan=solve(item),report=reports.get(name);
  if(!plan)return {...report,valid:false};
  const G=graph.prepare(item.region),g=graph.validate(plan.path,item.region);
  return {...report,valid:true,usesCoast:g.usesCoast,
   crossesVirtualWater:g.crossesVirtualWater,allAdjacent:g.allAdjacent,
   nativeMouth:!item.mouth||coastline(item.region,G).includes(plan.mouthVertex)};
 }
 window.HexategosAsiaCompletionRender0416=Object.freeze({
  version:'0.41.6',inspect:name=>{
   const x=data.features.find(y=>y.name===name);
   return x?solve(x)?.path.slice()||null:null;
  },validate,
  isDrawnFeature:name=>reports.get(name)?.ok===true,
  prepareAll:()=>data.features.map(x=>validate(x.name)),
  diagnostics:()=>[...reports.values()],
  graphBuilds:graph.builds,graphSize:graph.size,builtZones:graph.builtZones,
  prepared:()=>cache.size
 });
})();
