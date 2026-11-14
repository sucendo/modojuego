/* APEX 6A · isolated rival-wheel projection experiment.
 * Loaded ONLY from perf6a-preview.html. Does not modify the stable game.
 * Enable using ?perf6a=1. Omit or set 0 for an exact baseline.
 */
(function(){
 "use strict";
 const enabled=new URLSearchParams(window.location.search).get("perf6a")==="1";
 const apexPerf6aStats={wheels:0,reused:0,unique:0,byLod:[0,0,0]};
 let installed=false;
 window.apexPerf6aInfo=function(){
   return {phase:"6A",enabled,installed,
     drawnWheels:apexPerf6aStats.wheels,
     reusedProjections:apexPerf6aStats.reused,
     uniqueProjections:apexPerf6aStats.unique,
     byLod:apexPerf6aStats.byLod.slice(),
     note:"Projection counts only; FPS benefit must be measured by A/B telemetry comparison."};
 };
 if(!enabled)return;
 if(typeof window.webglPushRivalWheel3D!=="function"||
    typeof window.webglPushCamQuad!=="function")return;
function apexPerf6aWheel3D(b,cam,pitch,cx,cy,cz,halfW,radius,teamKey,spin=0,lod=1){
 const brand=teamBranding(teamKey)||{},stripe=b.tyreColor||brand.tyreColor||'#f0cf34',
  N=lod>=2?16:(lod===1?10:6),tau=Math.PI*2;
 const point=(side,r,ang,offset=0)=>webglRivalLocal(b,cx+side*(halfW+offset),cy+Math.sin(ang)*radius*r,cz+Math.cos(ang)*radius*r);
 // Reuse exactly identical camera vertices within each wheel.
 const projected=new Map();
 const WC=p=>{
   const key=p.x+','+p.y+','+p.z;
   const q=projected.get(key);
   if(q){apexPerf6aStats.reused++;return q;}
   const result=worldToCamera(p.x,p.y,p.z,cam);
   projected.set(key,result);apexPerf6aStats.unique++;return result;
 };
 const wheelWorldQuad=(cam,pitch,A,B,C,D,color,near,bias)=>
   webglPushCamQuad(WC(A),WC(B),WC(C),WC(D),pitch,color,near,bias);
 const outerL=[],outerR=[];
 for(let i=0;i<N;i++){
  const a=i*tau/N;outerL.push(point(-1,1,a,-0.002));outerR.push(point(1,1,a,-0.002));
 }
 let tris=0;
 // Banda de rodadura cilíndrica, con reflejos que no giran como polígonos enteros.
 for(let i=0;i<N;i++){
  const j=(i+1)%N,top=Math.sin((i+.5)*tau/N);
  const color=top>.55?'#1b2026':top<-.45?'#090c10':'#12171c';
  tris+=wheelWorldQuad(cam,pitch,outerL[i],outerR[i],outerR[j],outerL[j],color,.56,-.004);
 }
 // La cara exterior oculta no aporta pixels. Reducir esta mitad del trabajo
 // evita duplicar los círculos de llanta de 22 coches en móviles.
 const cl=worldToCamera(...[point(-1,0,0).x,point(-1,0,0).y,point(-1,0,0).z],cam),
       cr=worldToCamera(...[point(1,0,0).x,point(1,0,0).y,point(1,0,0).z],cam);
 const leftDist=cl.x*cl.x+cl.y*cl.y+cl.z*cl.z,rightDist=cr.x*cr.x+cr.y*cr.y+cr.z*cr.z;
 const visibleSide=leftDist<=rightDist?-1:1;
 for(const sg of [visibleSide]){
  const face=point(sg,0,0,.004);
  // El neumático ocupa toda la cara hasta el buje; ninguna región amarilla maciza.
  for(let i=0;i<N;i++){
   const a=i*tau/N,c=(i+1)*tau/N;
   tris+=webglPushCamPoly([WC(face),
      WC(point(sg,.985,a,.004)),
      WC(point(sg,.985,c,.004))],
      pitch,'#11151a',.56,-.006);
  }
  // Bandas de grosor radial: flanco sombreado, anillo fino del compuesto y llanta.
  const ring=(r0,r1,color,offset=.006)=>{
   for(let i=0;i<N;i++){
    const a=i*tau/N,c=(i+1)*tau/N;
    tris+=wheelWorldQuad(cam,pitch,point(sg,r0,a,offset),point(sg,r1,a,offset),
             point(sg,r1,c,offset),point(sg,r0,c,offset),color,.56,-.009);
   }
  };
  ring(.78,.86,lod>=2?'#242a31':'#191e23');
  if(lod>=1)ring(.896,.925,stripe,.009);
  else ring(.895,.911,shadeColor(stripe,-70),.009);
  ring(.71,.755,'#070a0e',.009);
  const center=point(sg,0,0,.012);
  // Llantas negras: resaltar sólo el canto, no pintar el disco como el neumático.
  for(let i=0;i<N;i++){
   const a=i*tau/N,c=(i+1)*tau/N;
   tris+=webglPushCamPoly([WC(center),
      WC(point(sg,.69,a,.012)),
      WC(point(sg,.69,c,.012))],
      pitch,lod>=2?'#252b33':'#20252c',.56,-.012);
  }
  ring(.56,.68,'#3c434c',.014);
  if(lod>=2){
   ring(.31,.36,'#090d13',.016);
   // Seis aspas discretas, separadas del aro de color.
   for(let k=0;k<6;k++){
    const a=k*tau/6+spin*.22;
    tris+=wheelWorldQuad(cam,pitch,
      point(sg,.34,a-.07,.020),point(sg,.57,a-.095,.020),
      point(sg,.57,a+.095,.020),point(sg,.34,a+.07,.020),
      k%2?'#121820':'#39434c',.56,-.013);
   }
  }
  const hub=point(sg,0,0,.023);
  for(let i=0;i<N;i++){
   const a=i*tau/N,c=(i+1)*tau/N;
   tris+=webglPushCamPoly([WC(hub),
     WC(point(sg,.115,a,.023)),
     WC(point(sg,.115,c,.023))],
     pitch,lod>=2?'#8c97a3':'#58636f',.56,-.015);
  }
 }
 return tris;
}

 window.webglPushRivalWheel3D=function(...args){
   apexPerf6aStats.wheels++;
   const lod=Math.max(0,Math.min(2,Number(args[10])|0));
   apexPerf6aStats.byLod[lod]++;
   return apexPerf6aWheel3D(...args);
 };
 installed=true;
})();