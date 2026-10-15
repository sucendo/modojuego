'use strict';
/* HEXATEGOS ATLAS · ríos europeos 0.39.5.
 * Recorridos EXACTOS de MAP_RIVERS3242 (malla compartida L8).
 * Se omiten las aristas costeras: el cauce termina en el vértice
 * de intersección tierra-mar, sin dibujar el lado litoral.
 * Calibres por tramos: estimaciones ilustrativas, NO aforos medidos.
 * Sin cambios en Hexategos Pruebas, guardados o topología.
 */
(function(){
 if(typeof MAP_RIVERS3242==='undefined'||typeof physicalEdge3242!=='function'||
    typeof drawTerrain3212!=='function')return;
 const names=new Set(['Támesis','Sena','Rin','Danubio','Ródano','Loira','Garona',
   'Vístula','Óder','Dniéper','Volga','Tíber','Po','Elba','Don','Ural','Inn','Tisza','Saona']);
 const profiles={
  'Támesis':[5,11,26,70,130],Sena:[4,12,28,65,115],Rin:[8,36,75,125,270],
  Danubio:[6,28,95,165,260],Ródano:[5,23,64,120,180],
  Loira:[4,17,48,85,150],Garona:[5,19,50,90,185],
  Vístula:[5,19,49,92,165],'Óder':[4,17,36,72,120],
  'Dniéper':[5,20,85,210,420],Volga:[8,39,110,310,700],
  'Tíber':[3,11,29,52,82],Po:[5,22,62,105,178],
  Elba:[4,18,46,96,180],Don:[5,23,73,123,225],
  Ural:[4,20,62,91,155],Inn:[3,17,35,48,62],
  Tisza:[4,20,49,90,140],Saona:[3,12,28,39,54]
 };
 const systems=MAP_RIVERS3242.filter(sys=>names.has(sys.n));
 const baseDraw=drawTerrain3212,plans=new Map(),diagnostics=new Map();
 function coast(id){
  const e=physicalEdge3242(id);
  return e.coast||edgeTouchesSea3295(id);
 }
 function getPlan(sys){
  if(plans.has(sys.n))return plans.get(sys.n);
  const edges=sys.edges,nodes=edgePathNodes3242(sys);
  if(!edges.length||nodes.length!==edges.length+1||
      nodes.some(id=>id<0)){plans.set(sys.n,null);return null}
  let stop=edges.length,mouth=null;
  if(sys.mouthExpected&&!sys.branch){
   stop=edges.findIndex(coast);
   if(stop<=0){plans.set(sys.n,null);return null}
   mouth=nodes[stop];
   const prev=physicalEdge3242(edges[stop-1]);
   const coastal=physicalEdge3242(edges[stop]);
   if((prev.u!==mouth&&prev.v!==mouth)||
       (coastal.u!==mouth&&coastal.v!==mouth)||
       coast(edges[stop-1])){
    plans.set(sys.n,null);return null;
   }
  }
  const length=new Float64Array(stop+1),F=loadLevel('8').faceCenters;
  for(let i=1;i<=stop;i++){
   const a=nodes[i-1]*3,b=nodes[i]*3;
   const dot=(F[a]*F[b]+F[a+1]*F[b+1]+F[a+2]*F[b+2])/(32767*32767);
   length[i]=length[i-1]+6371*Math.acos(Math.max(-1,Math.min(1,dot)));
  }
  const plan={ids:edges.slice(0,stop),nodes:nodes.slice(0,stop+1),
   length,km:Math.max(length[stop],.001),mouth,firstSea:stop};
  plans.set(sys.n,plan);
  diagnostics.set(sys.n,{name:sys.n,sourceEdges:edges.length,drawnEdges:plan.ids.length,
   mouthVertex:mouth,skipsCoastalEdge:mouth!=null,hasVariableWidth:true});
  return plan;
 }
 function metresAt(sys,f){
  const values=profiles[sys.n],scaled=Math.max(0,Math.min(.999999,f))*4;
  const i=Math.min(3,Math.floor(scaled)),t=scaled-i;
  return values[i]*(1-t)+values[i+1]*t;
 }
 function innerWidth(m){
  const z=Math.min(1.27,.91+Math.log2(Math.max(1,zoom))*.082);
  return Math.max(.46,Math.min(3.4,(.34+Math.sqrt(Math.max(1,m))/6.5)*z));
 }
 function drawRiver(sys,plan,R,cx,cy){
  const F=loadLevel('8').faceCenters;
  let run=null;
  function flush(){
   if(!run||run.coords.length<2)return;
   ctx.beginPath();
   for(let k=0;k<run.coords.length;k++){
    const p=run.coords[k];
    if(k===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
   }
   ctx.lineCap='round';ctx.lineJoin='round';
   ctx.lineWidth=run.width*1.64;ctx.strokeStyle='rgba(2,22,34,.74)';ctx.stroke();
   ctx.lineWidth=run.width;ctx.strokeStyle='rgba(111,208,227,.96)';ctx.stroke();
  }
  for(let i=0;i<plan.ids.length;i++){
   const a=plan.nodes[i]*3,b=plan.nodes[i+1]*3;
   const from=projectVec(F[a]/32767,F[a+1]/32767,F[a+2]/32767,R,cx,cy);
   const to=projectVec(F[b]/32767,F[b+1]/32767,F[b+2]/32767,R,cx,cy);
   if(from[2]<=.015||to[2]<=.015){flush();run=null;continue}
   const fraction=(plan.length[i]+plan.length[i+1])/(2*plan.km);
   const width=Math.round(innerWidth(metresAt(sys,fraction))*5)/5;
   if(!run||run.width!==width){flush();run={width,coords:[from]}}
   run.coords.push(to);
  }
  flush();
 }
 drawTerrain3212=function drawEuropePhysical0395(R,cx,cy){
  if(zoom<.82){baseDraw(R,cx,cy);return}
  const available=$('rivers')?.checked?systems.filter(sys=>
    zoom>=riverMinZoom3297(sys)&&getPlan(sys)?.ids.length):[];
  // Conmutamos únicamente los ríos con trayectoria canónica comprobada.
  const swapped=[];
  for(const sys of available){swapped.push([sys,sys.edges]);sys.edges=[]}
  try{baseDraw(R,cx,cy)}
  finally{
   for(const [sys,edges] of swapped){sys.edges=edges;riverRenderCache3296.delete(sys.n)}
  }
  if(!available.length)return;
  ctx.save();
  try{for(const sys of available)drawRiver(sys,getPlan(sys),R,cx,cy)}
  finally{ctx.restore()}
 };
 window.HexategosEuropeHydro0395=Object.freeze({
  version:'0.39.5',names:[...names],
  diagnostics:()=>systems.map(sys=>diagnostics.get(sys.n)||{name:sys.n,prepared:false})
 });
 console.info('[Atlas] Hidrografía europea: cauces L8 y ancho físico estimado por tramos');
})();