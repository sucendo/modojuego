'use strict';
/* 0.41.3 · tramo visual del Brahmaputra en Assam, malla L8 real.
 * Corrige su ausencia cerca de Manas y Teesta. Sin editar el trazado
 * canónico, sin repetir segmentos nativos, sin navegación/simulación.
 */
(function(){
 const source=window.HexategosAssamConfluences0413,
  graph=window.HexategosHimalayaGraph0406;
 if(!source||!graph||typeof drawTerrain3212!=='function')return;
 const oldDraw=drawTerrain3212,rad=Math.PI/180;
 let prepared=false,plan=null,reason='',nativeEdges=null;
 const edge=(a,b)=>a<b?a+':'+b:b+':'+a;
 function canonical(){
  if(nativeEdges)return nativeEdges;
  nativeEdges=new Set();
  if(typeof MAP_RIVERS3242==='undefined'||typeof physicalEdge3242!=='function')return nativeEdges;
  const b=MAP_RIVERS3242.find(x=>x.n==='Brahmaputra');
  for(const id of b?.edges||[]){
   const x=physicalEdge3242(id);
   if(x?.u>=0&&x?.v>=0)nativeEdges.add(edge(x.u,x.v));
  }
  return nativeEdges;
 }
 function prepare(){
  if(prepared)return plan;
  prepared=true;
  const candidate=graph.solve(source.corridor.points);
  if(!candidate.path){reason=candidate.reason||'Sin ruta regional L8';return null}
  const geometry=graph.validate(candidate.path);
  if(!geometry||geometry.usesCoast||geometry.crossesVirtualWater){
   reason='Cruza arista de costa o lago';return null;
  }
  // El corredor debe enlazar en AMBOS extremos con el Brahmaputra
  // canónico; una línea solo cercana visualmente no es confluencia.
  const nativeNodes=new Set();
  if(typeof MAP_RIVERS3242!=='undefined'&&typeof physicalEdge3242==='function'){
   const sys=MAP_RIVERS3242.find(x=>x.n==='Brahmaputra');
   for(const e of sys?.edges||[]){
    const x=physicalEdge3242(e);
    if(x){nativeNodes.add(x.u);nativeNodes.add(x.v)}
   }
  }
  if(!nativeNodes.has(candidate.path[0])||
     !nativeNodes.has(candidate.path.at(-1))){
   reason='El corredor no conecta con ambos extremos canónicos';return null;
  }
  plan=candidate;return plan;
 }
 function nodes(){return prepare()?.path.slice()||[]}
 function nearest([lon,lat]){
  const G=graph.prepare(),ids=nodes(),cos=Math.cos(lat*rad);
  let best={id:-1,km:Infinity};
  for(const id of ids){
   const p=G.coords.get(id);if(!p)continue;
   const km=Math.hypot((p.lon-lon)*111.2*cos,(p.lat-lat)*111.2);
   if(km<best.km)best={id,km};
  }
  return best;
 }
 function onscreen(R,cx,cy){
  return source.corridor.points.some(([lon,lat])=>{
   const u=lonLatVec(lon,lat),p=projectVec(u[0],u[1],u[2],R,cx,cy);
   return p[2]>.025&&p[0]>-140&&p[0]<vw+140&&p[1]>-140&&p[1]<vh+140;
  });
 }
 function paint(p,R,cx,cy){
  const native=canonical(),F=p.mesh.faceCenters;
  const width=Math.max(.84,Math.min(2.55,1.05+.11*Math.log2(Math.max(1,zoom))));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=1;i<p.path.length;i++){
   const u=p.path[i-1],v=p.path[i];
   if(native.has(edge(u,v)))continue;
   const a=u*3,b=v*3,
    P=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy),
    Q=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(P[2]<=.025||Q[2]<=.025)continue;
   ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(Q[0],Q[1]);
   ctx.strokeStyle='rgba(2,32,45,.8)';ctx.lineWidth=width*1.65;ctx.stroke();
   ctx.strokeStyle='rgba(107,207,230,.96)';ctx.lineWidth=width;ctx.stroke();
  }
 }
 drawTerrain3212=function assamTrunk0413(R,cx,cy){
  oldDraw(R,cx,cy);
  if(zoom<source.corridor.minZoom||!$('rivers')?.checked)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleHimalaya()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  if(!onscreen(R,cx,cy))return;
  const p=prepare();if(!p)return;
  ctx.save();try{paint(p,R,cx,cy)}finally{ctx.restore()}
 };
 window.HexategosAssamCorridor0413=Object.freeze({
  version:'0.41.3',nodes,nearest,prepare,
  diagnostics:()=>{
   const p=prepare(),native=canonical();
   return {ok:!!p,reason,edges:p?p.path.length-1:0,
    supplementalEdges:p?p.path.reduce((n,v,i)=>n+(i>0&&!native.has(edge(p.path[i-1],v))?1:0),0):0,
    usesCoast:p?graph.validate(p.path).usesCoast:null,
    crossesVirtualWater:p?graph.validate(p.path).crossesVirtualWater:null,
    anchored:p?[p.path[0],p.path.at(-1)]:null};
  }
 });
})();
