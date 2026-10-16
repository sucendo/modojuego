'use strict';
/* 0.41.4 · Mosaico fluvial terrestre L8, sin alteración de hidrografía jugable.
 * Los trazos de referencia se encajan EN ARISTAS (nunca segmento recto libre).
 * Se suprimen los bordes ya pintados por el río canónico, sin duplicaciones.
 */
(function(){
 const data=window.HexategosBengalHydro0414,
  graph=window.HexategosHimalayaGraph0406;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const previous=drawTerrain3212,rad=Math.PI/180;
 const plans=new Map(),reports=new Map(),hubs=new Map();
 let shore=null,native=null;
 const edge=(a,b)=>a<b?a+':'+b:b+':'+a;
 function distance(p,q){
  return Math.hypot((p.lon-q.lon)*111.2*
   Math.cos((p.lat+q.lat)*rad/2),(p.lat-q.lat)*111.2);
 }
 function closest(ids,p,G){
  const q={lon:p[0],lat:p[1]},cos=Math.cos(q.lat*rad);
  let value={id:-1,km:Infinity};
  for(const id of ids){
   const v=G.coords.get(id);if(!v)continue;
   const km=Math.hypot((v.lon-q.lon)*111.2*cos,(v.lat-q.lat)*111.2);
   if(km<value.km)value={id,km};
  }
  return value;
 }
 function nodeAt(point,max=46){
  const G=graph.prepare(),match=closest(G.vertices,point,G);
  return match.km<=max?match:null;
 }
 function confluence(name){
  if(hubs.has(name))return hubs.get(name);
  const point=data.confluences[name]?.at;
  if(!point)return null;
  const match=nodeAt(point,data.confluences[name].maxKm);
  if(!match)return null;
  hubs.set(name,match.id);
  return match.id;
 }
 function shoreNodes(){
  if(shore)return shore;
  const G=graph.prepare(),s=new Set();
  for(const x of G.coast){
   const [a,b]=x.split(':').map(Number);
   if(G.coords.has(a))s.add(a);
   if(G.coords.has(b))s.add(b);
  }
  shore=[...s];return shore;
 }
 function nativeEdges(){
  if(native)return native;
  native=new Set();
  if(typeof MAP_RIVERS3242!=='undefined'&&typeof physicalEdge3242==='function')
   for(const n of ['Ganges','Indo','Brahmaputra']){
    const river=MAP_RIVERS3242.find(r=>r.n===n);
    for(const id of river?.edges||[]){
     const e=physicalEdge3242(id);
     if(e?.u>=0&&e?.v>=0)native.add(edge(e.u,e.v));
    }
   }
  return native;
 }
 function resolve(name){
  if(plans.has(name))return plans.get(name);
  const item=data.routes.find(x=>x.name===name);
  if(!item)return null;
  const G=graph.prepare();let origin=null,destination=null;
  let reason='',parent=null;
  if(item.native){
   const n=window.HexategosSubcontinentRivers0407?.canonicalNodes(item.native)||[];
   origin=closest(n,item.source,G);
   if(origin.id<0||origin.km>95)reason='Sin vértice nativo inicial próximo';
  }else if(item.parent==='Brahmaputra'){
   const n=window.HexategosAssamCorridor0413?.nodes()||[];
   origin=closest(n,item.source,G);
   if(origin.id<0||origin.km>item.maxSnapKm)reason='Sin enlace con el Brahmaputra de Assam';
  }else if(item.parent){
   parent=resolve(item.parent);
   if(!parent)reason='Falta tramo padre '+item.parent;
   else origin={id:parent.path.at(-1),km:0};
  }else if(typeof item.source==='string'){
   const id=confluence(item.source);
   if(id==null)reason='Sin unión '+item.source;
   else origin={id,km:0};
  }else{
   origin=nodeAt(item.source,item.maxSnapKm);
   if(!origin)reason='Cabecera sin vértice próximo';
  }
  if(!reason){
   if(item.mouth){
    const nearest=closest(shoreNodes(),item.mouth,G);
    if(nearest.id<0||nearest.km>item.maxShoreKm)
     reason='No hay desembocadura sobre litoral L8';
    else destination=nearest.id;
   }else destination=confluence(item.terminal);
   if(destination==null)reason='Confluencia no representable en L8';
  }
  let result=null;
  if(!reason){
   const anchors=[origin.id,...item.points.map(x=>nodeAt(x,item.maxSnapKm)),
    destination];
   if(anchors.some(x=>x==null)){reason='Ancla fuera de la malla L8';}
   else{
    const ids=[];
    for(const id of anchors){
     const v=typeof id==='number'?id:id.id;
     if(v!==ids.at(-1))ids.push(v);
    }
    if(ids.length<2)reason='Tramo inferior a una arista L8';
    else{
     const points=ids.map(id=>{const p=G.coords.get(id);return [p.lon,p.lat]});
     result=graph.solve(points);
     if(!result.path)reason=result.reason||'Ruta L8 no resuelta';
     else if(result.path[0]!==origin.id||result.path.at(-1)!==destination)
      reason='La ruta no une los dos extremos previstos';
     else{
      const v=graph.validate(result.path);
      if(v.usesCoast||v.crossesVirtualWater)
       reason='Tramo atraviesa costa o lago';
      // Filtro de detours excesivos: evita bucles geográficos disimulados.
      const straight=ids.reduce((n,id,i)=>{
       return i?n+distance(G.coords.get(ids[i-1]),G.coords.get(id)):0;
      },0);
      if(!reason&&result.total>Math.max(80,straight*2.8))
       reason='Desvío L8 excesivo';
     }
    }
   }
  }
  const p=reason?null:{...result,name,origin:origin.id,target:destination,
   initialKm:origin.km};
  plans.set(name,p);
  reports.set(name,p?{name,ok:true,edges:p.path.length-1,
   sourceKm:+origin.km.toFixed(1),coastal:!!item.mouth,
   terminal:item.terminal||null}:{name,ok:false,reason});
  return p;
 }
 function nearestOn(name,point){
  const p=resolve(name),G=graph.prepare();
  return p?closest(p.path,point,G):{id:-1,km:Infinity};
 }
 function nodesForTributary(name){
  if(name==='Kosi')return resolve('Ganges medio y Padma')?.path.slice()||[];
  if(name==='Panjnad')return resolve('Indo cerca de Mithankot')?.path.slice()||[];
  return [];
 }
 function visible(item,R,cx,cy){
  const coords=[typeof item.source==='string'?data.confluences[item.source]?.at:item.source,
   ...item.points,item.terminal?data.confluences[item.terminal]?.at:item.mouth].filter(Boolean);
  return coords.some(([lon,lat])=>{
   const v=lonLatVec(lon,lat),p=projectVec(v[0],v[1],v[2],R,cx,cy);
   return p[2]>.025&&p[0]>-150&&p[0]<vw+150&&p[1]>-150&&p[1]<vh+150;
  });
 }
 function stroke(route,R,cx,cy){
  const G=graph.prepare(),F=route.mesh.faceCenters,protectedEdges=nativeEdges();
  let seen=0;
  const width=Math.max(.82,Math.min(2.5,1.00+.12*Math.log2(Math.max(1,zoom))));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let k=1;k<route.path.length;k++){
   const a=route.path[k-1],b=route.path[k];
   if(protectedEdges.has(edge(a,b)))continue;
   const i=a*3,j=b*3,
    P=projectVec(F[i]/32767,F[i+1]/32767,F[i+2]/32767,R,cx,cy),
    Q=projectVec(F[j]/32767,F[j+1]/32767,F[j+2]/32767,R,cx,cy);
   if(P[2]<=.025||Q[2]<=.025)continue;
   ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(Q[0],Q[1]);
   ctx.lineWidth=width*1.65;ctx.strokeStyle='rgba(4,34,47,.83)';ctx.stroke();
   ctx.lineWidth=width;ctx.strokeStyle='rgba(116,210,231,.95)';ctx.stroke();
   seen++;
  }
  return seen;
 }
 drawTerrain3212=function bengalContinuity0414(R,cx,cy){
  previous(R,cx,cy);
  if(zoom<7||!$('rivers')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleHimalaya()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();try{
   for(const item of data.routes){
    if(zoom<item.minZoom||!visible(item,R,cx,cy))continue;
    const p=resolve(item.name);if(p)stroke(p,R,cx,cy);
   }
  }finally{ctx.restore()}
 };
 window.HexategosBengalRoutes0414=Object.freeze({
  version:'0.41.4',inspect:name=>resolve(name)?.path.slice()||null,
  nodesForTributary,nearestOn,confluence,
  diagnostics:()=>data.routes.map(r=>reports.get(r.name)||
   {name:r.name,ok:false,reason:'Pendiente de dibujado'}),
  validate:name=>{
   const p=resolve(name);if(!p)return {ok:false,name,
    reason:reports.get(name)?.reason};
   const e=graph.validate(p.path),item=data.routes.find(x=>x.name===name);
   return {ok:true,name,edges:e.edges,usesCoast:e.usesCoast,
    crossesVirtualWater:e.crossesVirtualWater,
    nativeSource:item.native?window.HexategosSubcontinentRivers0407
     ?.canonicalNodes(item.native).includes(p.origin):null,
    startsAtParent:item.parent==='Brahmaputra'?
     (window.HexategosAssamCorridor0413?.nodes()||[]).includes(p.origin):
     item.parent?!!resolve(item.parent)?.path.includes(p.origin):null,
    endsAtConfluence:item.terminal?p.target===confluence(item.terminal):null,
    nativeShore:item.mouth?shoreNodes().includes(p.target):null,
    initialSnapKm:p.initialKm};
  },
  prepared:()=>plans.size,graphBuilds:graph.builds,
  nativeDedupEdges:()=>nativeEdges().size
 });
})();
