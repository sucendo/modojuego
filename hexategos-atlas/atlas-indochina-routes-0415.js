'use strict';
/* Atlas 0.41.5 · relieve e hidrografía de Indochina sobre ARISTAS L8.
 * Mekong canónico nunca se redibuja. Sólo render cartográfico no jugable.
 */
(function(){
 const data=window.HexategosIndochinaPhysical0415,
  graph=window.HexategosIndochinaGraph0415;
 if(!data||!graph||typeof drawTerrain3212!=='function')return;
 const original=drawTerrain3212,plans=new Map(),reports=new Map(),rad=Math.PI/180;
 const kinds=[['river',data.rivers],['tributary',data.tributaries],
  ['distributary',data.distributaries],['mountain',data.mountains]];
 const features=new Map(kinds.flatMap(([kind,items])=>items.map(x=>[x.name,{...x,kind}])));
 let coastal=null,canonicalCache=null;
 function km(p,q){return Math.hypot((p.lon-q.lon)*111.2*
  Math.cos((p.lat+q.lat)*rad/2),(p.lat-q.lat)*111.2)}
 function position(G,id){const p=G.coords.get(id);return [p.lon,p.lat]}
 function nearest(G,ids,point,max=Infinity){
  const target={lon:point[0],lat:point[1]},result={id:-1,km:max};
  for(const id of ids){
   const p=G.coords.get(id);if(!p)continue;
   const d=km(p,target);
   if(d<result.km){result.id=id;result.km=d}
  }
  return result;
 }
 function nativeNodes(name,G){
  const all=new Set();
  if(typeof MAP_RIVERS3242==='undefined'||typeof physicalEdge3242!=='function')return [];
  for(const sys of MAP_RIVERS3242){
   if(sys.n!==name)continue;
   for(const id of sys.edges||[]){
    const e=physicalEdge3242(id);
    if(e?.u>=0&&G.coords.has(e.u))all.add(e.u);
    if(e?.v>=0&&G.coords.has(e.v))all.add(e.v);
   }
  }
  return [...all];
 }
 function oldEdges(){
  if(canonicalCache)return canonicalCache;
  canonicalCache=new Set();
  if(typeof MAP_RIVERS3242!=='undefined'&&typeof physicalEdge3242==='function')
   for(const sys of MAP_RIVERS3242){
    if(!data.canonical.rivers.includes(sys.n))continue;
    for(const id of sys.edges||[]){
     const p=physicalEdge3242(id);
     if(p?.u>=0&&p?.v>=0)canonicalCache.add(graph.edge(p.u,p.v));
    }
   }
  return canonicalCache;
 }
 function shoreline(G){
  if(coastal)return coastal;
  const all=new Set();
  for(const id of G.coast){
   for(const n of id.split(':'))if(G.coords.has(+n))all.add(+n);
  }
  coastal=[...all];return coastal;
 }
 function coastOptions(G,point,max=100){
  const target={lon:point[0],lat:point[1]};
  return shoreline(G).map(id=>({id,km:km(G.coords.get(id),target)}))
   .filter(x=>x.km<=max).sort((a,b)=>a.km-b.km).slice(0,30);
 }
 function pathToShore(item,G,orig,anchors){
  if(!item.mouth)return {reason:'Desembocadura sin coordenadas'};
  const nearby=coastOptions(G,item.mouth,item.maxMouthKm||105);
  if(!nearby.length)return {reason:'Sin litoral hexagonal próximo'};
  for(const s of nearby){
   const p=graph.solve([...anchors,position(G,s.id)]);
   if(!p.path||p.path.length<2||p.path.at(-1)!==s.id)continue;
   if(orig!=null&&p.path[0]!==orig)continue;
   if(G.coast.has(graph.edge(p.path.at(-2),s.id)))continue;
   const val=graph.validate(p.path);
   if(val.usesCoast||val.crossesVirtualWater)continue;
   return {...p,mouth:s.id,mouthKm:s.km};
  }
  return {reason:'Desembocadura sin camino terrestre hasta la costa L8'};
 }
 function resolve(name,visiting=new Set()){
  if(plans.has(name))return plans.get(name);
  const item=features.get(name);if(!item)return null;
  if(visiting.has(name))throw Error('Ciclo hidrográfico en '+name);
  visiting.add(name);
  let result=null;
  try{
   const G=graph.prepare();
   if(item.kind==='mountain')result=graph.solve(item.points);
   else if(item.kind==='river'&&item.nativeParent){
    // El Mekong ya existe en la malla; completar sólo su tramo
    // inferior faltante desde un VÉRTICE NATIVO, sin redibujar bordes.
    const n=nativeNodes(item.nativeParent,G);
    const origin=nearest(G,n,item.source,64);
    if(origin.id<0)result={reason:'Sin punto inicial nativo para '+item.name};
    else{
     result=graph.solve([position(G,origin.id),...item.points]);
     if(result.path&&result.path[0]===origin.id)
      result={...result,parent:item.nativeParent,parentType:'canonical',
       junction:origin.id,joinKm:origin.km};
     else result={reason:result.reason||'Sin continuidad con Mekong nativo'};
    }
   }
   else if(item.kind==='river')
    result=pathToShore(item,G,null,item.points);
   else{
    const internal=features.get(item.parent);
    const parent=internal?resolve(internal.name,visiting):null;
    const receptors=parent?.path||nativeNodes(item.parent,G);
    if(!receptors?.length)result={reason:'Receptor no disponible en malla L8: '+item.parent};
    else{
     const target=nearest(G,receptors,item.join,
      item.kind==='distributary'?100:110);
     if(target.id<0)result={reason:'Confluencia a más de 110 km del receptor: '+item.parent};
     else{
      // El primer/último punto de un afluente lo determina el VÉRTICE del padre.
      const last=position(G,target.id);
      let p;
      if(item.kind==='distributary'){
       const middle=item.points.filter(x=>km({lon:x[0],lat:x[1]},
        {lon:last[0],lat:last[1]})>2);
       p=pathToShore(item,G,target.id,[last,...middle]);
       if(p.path&&p.path[0]!==target.id)p={reason:'Brazo sin vértice origen compartido'};
      }else{
       p=graph.solve([...item.points.slice(0,-1),last]);
       if(p.path&&p.path.at(-1)!==target.id)p={reason:'Afluente sin confluencia compartida'};
      }
      result=p.path?{...p,kind:item.kind,parent:item.parent,
       parentType:parent?'regional':'canonical',junction:target.id,joinKm:target.km}:p;
     }
    }
   }
   if(result?.path){
    const val=graph.validate(result.path);
    if(val?.usesCoast||val?.crossesVirtualWater)
     result={reason:'Ruta invalida: costa o lago'};
   }
  }finally{visiting.delete(name)}
  const plan=result?.path?result:null;
  plans.set(name,plan);
  reports.set(name,plan?{name,kind:item.kind,ok:true,edges:plan.path.length-1,
   parent:plan.parent||null,parentType:plan.parentType||null,
   joinKm:plan.joinKm??null,mouthKm:plan.mouthKm??null
  }:{name,kind:item.kind,ok:false,reason:result?.reason||'No resuelto'});
  return plan;
 }
 function inView(item,R,cx,cy){
  return [...item.points,...(item.mouth?[item.mouth]:[])].some(([lon,lat])=>{
   const q=lonLatVec(lon,lat),p=projectVec(q[0],q[1],q[2],R,cx,cy);
   return p[2]>.025&&p[0]>-150&&p[0]<vw+150&&p[1]>-150&&p[1]<vh+150;
  });
 }
 function drawRoute(item,p,R,cx,cy){
  const F=p.mesh.faceCenters,total=p.total||1,protectedEdges=oldEdges();
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let k=1;k<p.path.length;k++){
   const a=p.path[k-1],b=p.path[k],va=a*3,vb=b*3;
   if(protectedEdges.has(graph.edge(a,b)))continue;
   const U=projectVec(F[va]/32767,F[va+1]/32767,F[va+2]/32767,R,cx,cy),
    V=projectVec(F[vb]/32767,F[vb+1]/32767,F[vb+2]/32767,R,cx,cy);
   if(U[2]<=.025||V[2]<=.025)continue;
   const t=(p.cum[k-1]+p.cum[k])/(2*total),
    mountain=item.kind==='mountain',
    weight=mountain?.86+(item.elevationM||1250)/3100:
     item.kind==='river'?.64+.98*Math.sqrt(t):.59+.55*Math.sqrt(t),
    width=Math.max(.54,Math.min(2.85,weight*(.88+.08*Math.log2(Math.max(1,zoom)))));
   ctx.beginPath();ctx.moveTo(U[0],U[1]);ctx.lineTo(V[0],V[1]);
   ctx.lineWidth=width*1.60;ctx.strokeStyle=mountain?'rgba(62,45,31,.78)':'rgba(2,37,51,.84)';ctx.stroke();
   ctx.lineWidth=width;ctx.strokeStyle=mountain?'rgba(218,183,139,.94)':'rgba(107,208,230,.97)';ctx.stroke();
  }
 }
 drawTerrain3212=function indochinaTerrain0415(R,cx,cy){
  original(R,cx,cy);
  if(zoom<6)return;
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleIndochina()))return;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return;
  ctx.save();try{
   for(const [kind,items] of kinds){
    if(!$(kind==='mountain'?'mountains':'rivers')?.checked)continue;
    for(const item of items){
     if(zoom<item.minZoom||!inView(item,R,cx,cy))continue;
     const p=resolve(item.name);if(p)drawRoute(item,p,R,cx,cy);
    }
   }
  }finally{ctx.restore()}
 };
 function validate(name){
  const item=features.get(name);if(!item)return null;
  const p=resolve(name),G=graph.prepare();
  if(!p)return {name,ok:false,reason:reports.get(name)?.reason};
  const test=graph.validate(p.path),parent=item.parent?
   features.get(item.parent)?resolve(item.parent)?.path:
    nativeNodes(item.parent,G):null;
  const child=item.kind==='distributary';
  return {name,ok:true,kind:item.kind,edges:test.edges,
   usesCoast:test.usesCoast,crossesVirtualWater:test.crossesVirtualWater,
   parent:item.parent||null,joinKm:p.joinKm??null,
   parentConnected:!item.parent||!!parent?.includes(p.junction),
   exactJoin:!item.parent||
    (child?p.path[0]===p.junction:p.path.at(-1)===p.junction),
   nativeMouth:!item.mouth||shoreline(G).includes(p.mouth),
   mouthKm:p.mouthKm??null,
   nativeDedup:true
  };
 }
 window.HexategosIndochinaRender0415=Object.freeze({
  version:'0.41.5',inspect:name=>resolve(name)?.path.slice()||null,
  validate,isDrawnFeature:name=>reports.get(name)?.ok===true,
  diagnostics:()=>[...reports.values()],
  prepareAll:()=>[...features.keys()].map(name=>validate(name)),
  graphBuilds:graph.builds,graphSize:graph.size,
  prepared:()=>plans.size,
  canonicalCovered:()=>data.canonical.rivers.map(name=>({
   name,vertices:nativeNodes(name,graph.prepare()).length}))
 });
})();
