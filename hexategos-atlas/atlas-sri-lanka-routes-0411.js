'use strict';
/* Sri Lanka 0.41.1: relieve sólo sobre ARISTAS interiores nativas L8. */
(function(){
 const data=window.HexategosSriLankaPhysical0411,
 graph=window.HexategosSriLankaGraph0411;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const base=drawTerrain3212,cache=new Map(),log=new Map();
 function route(item){
  if(cache.has(item.name))return cache.get(item.name);
  const r=graph.solve(item.points),p=r.path?r:null;
  cache.set(item.name,p);
  log.set(item.name,p?{name:item.name,ok:true,edges:p.path.length-1}:
   {name:item.name,ok:false,reason:r.reason});
  return p;
 }
 function visible(points,R,cx,cy){
  return points.some(([lon,lat])=>{
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   return p[2]>.025&&p[0]>-100&&p[0]<vw+100&&p[1]>-100&&p[1]<vh+100;
  });
 }
 function paint(plan,item,R,cx,cy){
  const F=plan.mesh.faceCenters,ids=plan.path;
  const width=Math.max(.62,Math.min(2.3,(.65+item.elevationM/3000)*
   (.84+.077*Math.log2(Math.max(1,zoom)))));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let k=1;k<ids.length;k++){
   const a=ids[k-1]*3,b=ids[k]*3,
    p=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(p[2]<=.025||q[2]<=.025)continue;
   ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
   ctx.lineWidth=width*1.65;ctx.strokeStyle='rgba(67,47,34,.79)';ctx.stroke();
   ctx.lineWidth=width;ctx.strokeStyle='rgba(216,180,131,.94)';ctx.stroke();
  }
 }
 drawTerrain3212=function atlasSriLankaTerrain0411(R,cx,cy){
  base(R,cx,cy);
  if(zoom<7.4||!$('mountains')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleSriLanka()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();
  try{
   for(const item of data.mountains){
    if(zoom<item.minZoom||!visible(item.points,R,cx,cy))continue;
    const p=route(item);if(p)paint(p,item,R,cx,cy);
   }
  }finally{ctx.restore()}
 };
 function inspect(name){
  const m=data.mountains.find(x=>x.name===name);
  return m?route(m)?.path.slice()||null:null;
 }
 window.HexategosSriLanka0411=Object.freeze({
  version:'0.41.1',inspect,
  validate:name=>graph.validate(inspect(name)),
  isDrawnFeature:name=>log.get(name)?.ok===true,
  diagnostics:()=>[...log.values()],
  graphBuilds:graph.builds,graphSize:graph.size,prepared:()=>cache.size
 });
})();