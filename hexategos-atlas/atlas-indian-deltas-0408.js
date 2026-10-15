'use strict';
/* HEXATEGOS Atlas 0.40.8 · brazos de delta sobre aristas interiores L8.
 * Una desembocadura es un VERTICE COSTERO NATIVO, nunca el segmento
 * de costa ni un polígono inventado. Capa visual no navegable.
 */
(function(){
 const data=window.HexategosIndianDeltas0408,
  graph=window.HexategosHimalayaGraph0406,
  rivers=window.HexategosSubcontinentRivers0407;
 if(!data||!graph||!rivers||typeof drawTerrain3212!=='function')return;
 const base=drawTerrain3212,cache=new Map(),diagnostics=new Map();
 const rad=Math.PI/180,usedMouths=new Set();
 let shore=null;
 const km=(a,b)=>Math.hypot((a.lon-b.lon)*111.2*
  Math.cos((a.lat+b.lat)*rad/2),(a.lat-b.lat)*111.2);
 function coastalNodes(G){
  if(shore)return shore;
  const ids=new Set();
  for(const edge of G.coast){
   const [a,b]=edge.split(':').map(Number);
   if(G.coords.has(a))ids.add(a);
   if(G.coords.has(b))ids.add(b);
  }
  shore=[...ids];return shore;
 }
 function canonical(name,G){
  const ids=rivers.canonicalNodes(name);
  return ids.filter(id=>G.coords.has(id));
 }
 function nearest(ids,coord,G){
  const target={lon:coord[0],lat:coord[1]},arr=[];
  for(const id of ids){
   const p=G.coords.get(id);if(!p)continue;
   arr.push({id,d:km(p,target)});
  }
  return arr.sort((a,b)=>a.d-b.d);
 }
 function resolve(item){
  if(cache.has(item.name))return cache.get(item.name);
  const G=graph.prepare(),sources=canonical(item.parent,G);
  let plan=null,reason='';
  const origin=nearest(sources,item.join,G)[0];
  if(!origin||origin.d>120)reason='Sin conexión con cauce principal L8';
  if(!reason){
   const start=G.coords.get(origin.id);
   const mouths=nearest(coastalNodes(G),item.mouth,G)
    .filter(x=>x.d<item.maxShoreKm).slice(0,24);
   if(!mouths.length)reason='No hay desembocadura sobre costa nativa';
   for(const outlet of mouths){
    if(usedMouths.has(outlet.id))continue;
    const end=G.coords.get(outlet.id),
     anchors=[[start.lon,start.lat],...item.waypoints,[end.lon,end.lat]];
    const result=graph.solve(anchors);
    if(!result.path||result.path[0]!==origin.id||
      result.path.at(-1)!==outlet.id||result.path.length<3)continue;
    const valid=graph.validate(result.path);
    if(valid.usesCoast||valid.crossesVirtualWater)continue;
    // Al menos el último vértice debe tocar una arista tierra-mar
    // que NO forme parte del propio cauce dibujado.
    if(!G.coast.has(graph.edge(outlet.id,
      result.path.at(-2))) &&
       G.coast.size>0){
      plan={...result,source:origin.id,shore:outlet.id,
       sourceKm:origin.d,mouthKm:outlet.d};
      usedMouths.add(outlet.id);break;
    }
   }
   if(!plan)reason='No existe ruta segura hasta el litoral L8';
  }
  cache.set(item.name,plan);
  diagnostics.set(item.name,plan?{
   name:item.name,ok:true,edges:plan.path.length-1,
   parent:item.parent,sourceKm:+plan.sourceKm.toFixed(1),
   mouthKm:+plan.mouthKm.toFixed(1),nativeShore:true,
   usesCoast:false,crossesVirtualWater:false
  }:{name:item.name,ok:false,reason});
  return plan;
 }
 function onscreen(item,R,cx,cy){
  return [item.join,...item.waypoints,item.mouth].some(([lon,lat])=>{
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   return p[2]>.02&&p[0]>-120&&p[0]<vw+120&&p[1]>-120&&p[1]<vh+120;
  });
 }
 function paint(plan,R,cx,cy){
  const F=plan.mesh.faceCenters;
  ctx.lineCap='round';ctx.lineJoin='round';
  const width=Math.max(.64,Math.min(1.7,.52+.115*Math.log2(Math.max(1,zoom))));
  for(let k=1;k<plan.path.length;k++){
   const a=plan.path[k-1]*3,b=plan.path[k]*3,
    p=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(p[2]<=.02||q[2]<=.02)continue;
   ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
   ctx.lineWidth=width*1.7;ctx.strokeStyle='rgba(5,40,53,.82)';ctx.stroke();
   ctx.lineWidth=width;ctx.strokeStyle='rgba(111,202,222,.92)';ctx.stroke();
  }
 }
 drawTerrain3212=function atlasIndianDeltaRoutes0408(R,cx,cy){
  base(R,cx,cy);
  if(zoom<8.5||!$('rivers')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleHimalaya()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();
  try{
   for(const item of data.channels){
    if(zoom<item.minZoom||!onscreen(item,R,cx,cy))continue;
    const plan=resolve(item);if(plan)paint(plan,R,cx,cy);
   }
  }finally{ctx.restore()}
 };
 window.HexategosIndianDeltaRoutes0408=Object.freeze({
  version:'0.40.8',inspect:name=>{
   const item=data.channels.find(x=>x.name===name);
   return item?resolve(item)?.path.slice()||null:null;
  },
  validate:name=>{
   const item=data.channels.find(x=>x.name===name);
   if(!item)return null;
   const p=resolve(item);if(!p)return {name,ok:false,
    reason:diagnostics.get(name)?.reason};
   const G=graph.prepare(),geom=graph.validate(p.path);
   return {name,ok:true,edges:geom.edges,
    nativeShore:coastalNodes(G).includes(p.shore),
    endsAtShore:p.path.at(-1)===p.shore,
    startsAtParent:canonical(item.parent,G).includes(p.source),
    mouthKm:p.mouthKm,usesCoast:geom.usesCoast,
    crossesVirtualWater:geom.crossesVirtualWater};
  },
  isDrawnFeature:name=>diagnostics.get(name)?.ok===true,
  diagnostics:()=>[...diagnostics.values()],
  prepared:()=>cache.size,graphBuilds:graph.builds,
  shoreCandidates:()=>coastalNodes(graph.prepare()).length
 });
})();