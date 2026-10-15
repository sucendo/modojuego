'use strict';
/* HEXATEGOS Atlas 0.40.9: relieves secundarios, rutas L8 REALES.
 * Los Ghats principales ya son canónicos: se nombran, NO se repintan.
 */
(function(){
 const data=window.HexategosPeninsularIndiaPhysical0409,
  graph=window.HexategosPeninsularIndiaGraph0409;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const base=drawTerrain3212,cache=new Map(),diagnostics=new Map();
 function native(item){
  return !!(item.canonicalParent&&typeof MOUNTAIN_NETWORKS3242!=='undefined'&&
   MOUNTAIN_NETWORKS3242.some(r=>r.n===item.canonicalParent));
 }
 function resolve(item){
  if(native(item))return null;
  if(cache.has(item.name))return cache.get(item.name);
  const p=graph.solve(item.points),plan=p.path?p:null;
  diagnostics.set(item.name,plan?{
   name:item.name,ok:true,edges:plan.path.length-1,
   usesCoast:false,crossesVirtualWater:false
  }:{name:item.name,ok:false,reason:p.reason});
  cache.set(item.name,plan);return plan;
 }
 function onscreen(points,R,cx,cy){
  return points.some(([lon,lat])=>{
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   return p[2]>.02&&p[0]>-140&&p[0]<vw+140&&p[1]>-140&&p[1]<vh+140;
  });
 }
 function paint(item,plan,R,cx,cy){
  const F=plan.mesh.faceCenters,pts=plan.path;
  const width=Math.max(.70,Math.min(2.5,
   (.76+item.elevationM/3600)*(.91+.068*Math.log2(Math.max(1,zoom)))));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let k=1;k<pts.length;k++){
   const a=pts[k-1]*3,b=pts[k]*3,
    p=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(p[2]<=.025||q[2]<=.025)continue;
   ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
   ctx.lineWidth=width*1.55;ctx.strokeStyle='rgba(61,45,32,.78)';ctx.stroke();
   ctx.strokeStyle='rgba(218,186,142,.94)';ctx.lineWidth=width;ctx.stroke();
  }
 }
 drawTerrain3212=function atlasPeninsularIndiaTerrain0409(R,cx,cy){
  base(R,cx,cy);
  if(zoom<7.3||!$('mountains')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visiblePeninsularIndia()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();
  try{
   for(const item of data.mountains){
    if(native(item)||zoom<item.minZoom||!onscreen(item.points,R,cx,cy))continue;
    const plan=resolve(item);if(plan)paint(item,plan,R,cx,cy);
   }
  }finally{ctx.restore()}
 };
 function inspect(name){
  const item=data.mountains.find(x=>x.name===name);
  return item&&!native(item)?resolve(item)?.path.slice()||null:null;
 }
 window.HexategosPeninsularIndia0409=Object.freeze({
  version:'0.40.9',inspect,
  isDrawnFeature:name=>{
   const item=data.mountains.find(x=>x.name===name);
   return !!(item&&(native(item)||diagnostics.get(name)?.ok));
  },
  diagnostics:()=>[...diagnostics.values()],
  graphBuilds:graph.builds,graphSize:graph.size,prepared:()=>cache.size,
  validate:name=>graph.validate(inspect(name))
 });
})();