'use strict';
/* Himalaya 0.40.6: relieve secundario sobre aristas del grafo L8.
 * Las montañas principales canónicas jamás se duplican.
 */
(function(){
 const data=window.HexategosHimalayaPhysical0406,
  G=window.HexategosHimalayaGraph0406;
 if(!data||!G||typeof drawTerrain3212!=='function')return;
 const base=drawTerrain3212,cache=new Map(),log=new Map();
 function existing(item){
  return !!(item?.canonicalParent&&typeof MOUNTAIN_NETWORKS3242!=='undefined'&&
    MOUNTAIN_NETWORKS3242.some(m=>m.n===item.canonicalParent));
 }
 function plan(item){
  if(existing(item))return null;
  if(cache.has(item.name))return cache.get(item.name);
  const result=G.solve(item.points),p=result.path?result:null;
  log.set(item.name,p?{name:item.name,ok:true,edges:p.path.length-1}:
   {name:item.name,ok:false,reason:result.reason});
  cache.set(item.name,p);
  return p;
 }
 function onscreen(item,R,cx,cy){
  return item.points.some(([lon,lat])=>{
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   return p[2]>.025&&p[0]>-120&&p[0]<vw+120&&p[1]>-120&&p[1]<vh+120;
  });
 }
 function stroke(item,p,R,cx,cy){
  const F=p.mesh.faceCenters;
  ctx.lineJoin='round';ctx.lineCap='round';
  const width=Math.max(.7,Math.min(2.7,(.72+item.elevationM/4500)*
   (.88+.085*Math.log2(Math.max(1,zoom)))));
  for(let k=1;k<p.path.length;k++){
   const a=p.path[k-1]*3,b=p.path[k]*3,
    x=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    y=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(x[2]<=.025||y[2]<=.025)continue;
   ctx.beginPath();ctx.moveTo(x[0],x[1]);ctx.lineTo(y[0],y[1]);
   ctx.strokeStyle='rgba(69,50,35,.76)';ctx.lineWidth=width*1.64;ctx.stroke();
   ctx.strokeStyle='rgba(218,188,145,.91)';ctx.lineWidth=width;ctx.stroke();
  }
 }
 drawTerrain3212=function atlasHimalayaTerrain0406(R,cx,cy){
  base(R,cx,cy);
  if(zoom<7.4||!$('mountains')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleHimalaya()))return;
  ctx.save();
  try{
   for(const item of data.mountains){
    if(existing(item)||zoom<item.minZoom||!onscreen(item,R,cx,cy))continue;
    const p=plan(item);if(p)stroke(item,p,R,cx,cy);
   }
  }finally{ctx.restore()}
 };
 window.HexategosHimalaya0406=Object.freeze({
  version:'0.40.6',graphBuilds:G.builds,graphSize:G.size,
  prepared:()=>cache.size,diagnostics:()=>[...log.values()],
  isDrawnFeature:name=>{
   const m=data.mountains.find(v=>v.name===name);
   return !!(m&&(existing(m)||log.get(name)?.ok));
  },
  inspect:name=>{
   const m=data.mountains.find(v=>v.name===name);
   return m&&!existing(m)?plan(m)?.path.slice()||null:null;
  },
  validate:name=>G.validate(window.HexategosHimalaya0406.inspect(name))
 });
})();