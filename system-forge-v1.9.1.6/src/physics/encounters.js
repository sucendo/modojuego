(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const AU_KM=149597870.7,YEAR_S=365.25*86400,KMS_TO_AUYR=YEAR_S/AU_KM,D2R=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function rotatePerifocal(x,y,iDeg,OmegaDeg,omegaDeg){
  const i=iDeg*D2R,O=OmegaDeg*D2R,w=omegaDeg*D2R;
  const cO=Math.cos(O),sO=Math.sin(O),ci=Math.cos(i),si=Math.sin(i),cw=Math.cos(w),sw=Math.sin(w);
  const X=(cO*cw-sO*sw*ci)*x+(-cO*sw-sO*cw*ci)*y;
  const Y=(sO*cw+cO*sw*ci)*x+(-sO*sw+cO*cw*ci)*y;
  const Z=(sw*si)*x+(cw*si)*y;
  return [X,Z,-Y];
}
function conicState(mu,p,e,nu,iDeg=0,OmegaDeg=0,omegaDeg=0){
  const r=p/(1+e*Math.cos(nu)),q=Math.sqrt(mu/p);
  const pos=rotatePerifocal(r*Math.cos(nu),r*Math.sin(nu),iDeg,OmegaDeg,omegaDeg);
  const vel=rotatePerifocal(-q*Math.sin(nu),q*(e+Math.cos(nu)),iDeg,OmegaDeg,omegaDeg);
  return {posAU:pos,velAUyr:vel,rAU:r};
}
function stateFromFlyby(spec,mu){
  const rp=Math.max(1e-8,Number(spec.rpAU)||1),vInfKms=Math.max(0,Number(spec.vInfKms)||0);
  const vInf=vInfKms*KMS_TO_AUYR,start=Math.max(rp*1.001,Number(spec.startDistanceAU)||rp*6);
  let e,p,aAU=null,kind;
  if(vInf<1e-9){e=1;p=2*rp;kind="parabolic"}
  else{const aAbs=mu/(vInf*vInf);e=1+rp/aAbs;p=rp*(1+e);aAU=-aAbs;kind="hyperbolic"}
  const cosNu=clamp((p/start-1)/e,-1,1),nu=Math.acos(cosNu)*(spec.inbound===false?1:-1);
  const s=conicState(mu,p,e,nu,Number(spec.iDeg)||0,Number(spec.OmegaDeg)||0,Number(spec.omegaDeg)||0);
  return {...s,e,pAU:p,aAU,trueAnomalyRad:nu,kind,vInfKms,rpAU:rp};
}
function conicPoints(spec,mu,segments=320){
  const s=stateFromFlyby(spec,mu),e=s.e,p=s.pAU;
  const maxNu=e>1?Math.acos(-1/e)-0.015:Math.PI-0.035,pts=[];
  for(let k=0;k<=segments;k++){
    const nu=-maxNu+(2*maxNu*k/segments),st=conicState(mu,p,e,nu,Number(spec.iDeg)||0,Number(spec.OmegaDeg)||0,Number(spec.omegaDeg)||0);
    if(Number.isFinite(st.rAU)&&st.rAU<Math.max((spec.startDistanceAU||1)*1.35,s.rpAU*100))pts.push(st.posAU);
  }
  return pts;
}
core.EncounterPhysics={KMS_TO_AUYR,stateFromFlyby,conicState,conicPoints};
})();