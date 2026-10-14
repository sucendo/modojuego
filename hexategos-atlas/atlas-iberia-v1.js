/* HEXATEGOS ATLAS · Iberia physical rendering patch, 2026-10-14.
 * View-only adaptation of shared reference data; gameplay physical topology,
 * mountainTier3212 and all LOD mesh IDs are deliberately untouched.
 * Loaded after atlas-geography.js and before atlas-ui.js.
 */
'use strict';
(function installIberiaPhysicalAtlasPatch(){
 const geo=globalThis.HEXATEGOS_IBERIA_PHYSICAL_V1;
 if(!geo || typeof drawTerrain3212!=='function' ||
    typeof MAP_RIVERS3242==='undefined' || typeof MOUNTAIN_NETWORKS3242==='undefined'){
  console.warn('[Hexategos Atlas] No se pudo cargar la referencia física ibérica');
  return;
 }
 const riverNames=new Set(geo.rivers.map(x=>x.name));
 const originalMountainNames=new Set([
  'Pirineos','Cordillera Cantábrica','Sistema Central','Sistema Ibérico',
  'Sierra Morena','Cordilleras Béticas'
 ]);
 const skippedRivers=MAP_RIVERS3242.filter(x=>!x.branch&&riverNames.has(x.n));
 const skippedMountains=MOUNTAIN_NETWORKS3242.filter(x=>!x.branch&&originalMountainNames.has(x.n));
 const canonicalDraw=drawTerrain3212;

 // Smooth Catmull-Rom coordinate checkpoints, with deterministically bounded
 // subdivision. The drawing is projected through Atlas's existing 3D globe.
 function interp(p0,p1,p2,p3,t){
  const t2=t*t,t3=t2*t;
  const f=(i)=>.5*((2*p1[i])+(-p0[i]+p2[i])*t+
   (2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*t2+
   (-p0[i]+3*p1[i]-3*p2[i]+p3[i])*t3);
  return [f(0),f(1)];
 }
 function coursePath(points,R,cx,cy){
  let begun=false,prevVisible=false;
  ctx.beginPath();
  for(let i=0;i<points.length-1;i++){
   const p0=points[Math.max(0,i-1)],p1=points[i],
         p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
   const lat=(p1[1]+p2[1])*.5*Math.PI/180;
   const km=111.2*Math.hypot((p2[0]-p1[0])*Math.cos(lat),p2[1]-p1[1]);
   const steps=Math.max(2,Math.min(30,Math.ceil(km/15)));
   for(let k=i===0?0:1;k<=steps;k++){
    const ll=interp(p0,p1,p2,p3,k/steps),v=lonLatVec(ll[0],ll[1]),
          p=projectVec(v[0],v[1],v[2],R,cx,cy);
    const visible=p[2]>.015;
    if(visible){
     if(!prevVisible)ctx.moveTo(p[0],p[1]);
     else ctx.lineTo(p[0],p[1]);
     begun=true;
    }
    prevVisible=visible;
   }
  }
  return begun;
 }
 function paintMountain(sys,R,cx,cy){
  if(!coursePath(sys.points,R,cx,cy))return;
  const high=sys.rank>=3,mid=sys.rank===2;
  const w=2*sys.halfWidthKm*R/6371; // physical envelope, full width in pixels
  const zf=Math.min(1.2,.86+Math.log2(Math.max(1,zoom))*.075);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=Math.max(.7,w*1.9);ctx.strokeStyle=high?'rgba(88,73,61,.18)':mid?'rgba(89,78,62,.15)':'rgba(84,75,61,.12)';ctx.stroke();
  ctx.lineWidth=Math.max(.6,w*1.14);ctx.strokeStyle=high?'rgba(106,91,76,.27)':mid?'rgba(104,91,73,.23)':'rgba(99,88,71,.19)';ctx.stroke();
  ctx.lineWidth=Math.max(.5,w*.59);ctx.strokeStyle=high?'rgba(166,148,124,.39)':mid?'rgba(148,134,112,.33)':'rgba(137,126,106,.27)';ctx.stroke();
  ctx.lineWidth=Math.max(.45,Math.min(4.0,w*.13*zf));
  ctx.strokeStyle=high?'rgba(233,218,187,.80)':mid?'rgba(213,193,157,.66)':'rgba(185,172,144,.55)';ctx.stroke();
 }
 function paintRiver(sys,R,cx,cy){
  if(!coursePath(sys.points,R,cx,cy))return;
  const high=sys.rank>=3;
  const zf=Math.min(1.30,.91+Math.log2(Math.max(1,zoom))*.083);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=(high?3.05:2.35)*zf;
  ctx.strokeStyle='rgba(2,22,34,.72)';ctx.stroke();
  ctx.lineWidth=(high?1.74:1.22)*zf;
  ctx.strokeStyle=high?'rgba(111,208,227,.97)':'rgba(100,194,215,.94)';ctx.stroke();
 }
 drawTerrain3212=function drawTerrainIberiaAtlasV1(R,cx,cy){
  // Restrict suppression to this one view pass: arrays, game data and saves
  // remain intact. This removes the old distorted Iberian strokes only.
  const previous=[];
  for(const sys of skippedRivers){previous.push([sys,sys.edges]);sys.edges=[];}
  for(const sys of skippedMountains){previous.push([sys,sys.edges]);sys.edges=[];}
  try { canonicalDraw(R,cx,cy); }
  finally {for(const [sys,edges] of previous)sys.edges=edges;}
  if(zoom<.82)return;
  ctx.save();
  try{
   if($('mountains').checked){
    for(const sys of geo.mountains)paintMountain(sys,R,cx,cy);
   }
   if($('rivers').checked){
    for(const sys of geo.rivers)paintRiver(sys,R,cx,cy);
   }
  } finally {ctx.restore();}
 };
 console.info('[Hexategos Atlas] Geografía física ibérica v1 activa:',
  geo.rivers.length,'ríos,',geo.mountains.length,'unidades de relieve');
})();