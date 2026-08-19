(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const D2R=Math.PI/180,R2D=180/Math.PI,TWOPI=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const normRad=x=>((x%TWOPI)+TWOPI)%TWOPI;
const normDeg=x=>((x%360)+360)%360;

function astro(v){
  // Three (X,Y,Z) -> astronomical right-handed (X,Y,Z), Z north.
  return [v[0],-v[2],v[1]];
}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function norm(a){return Math.hypot(a[0],a[1],a[2])}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function scale(a,s){return [a[0]*s,a[1]*s,a[2]*s]}

function elementsFromState(rThree,vThree,mu){
  if(!(mu>0))return null;
  const r=astro(rThree),v=astro(vThree),rmag=norm(r),vmag=norm(v);
  if(!(rmag>0))return null;
  const h=cross(r,v),hmag=norm(h);
  if(!(hmag>0))return null;
  const n=[-h[1],h[0],0],nmag=norm(n);
  const evec=sub(scale(cross(v,h),1/mu),scale(r,1/rmag)),e=norm(evec);
  const eps=.5*vmag*vmag-mu/rmag;
  const a=Math.abs(eps)>1e-15?-mu/(2*eps):Infinity;
  const i=Math.acos(clamp(h[2]/hmag,-1,1));
  let Omega=nmag>1e-14?normRad(Math.atan2(n[1],n[0])):0;
  let omega=0;
  if(e>1e-12){
    if(nmag>1e-14){
      omega=Math.acos(clamp(dot(n,evec)/(nmag*e),-1,1));
      if(evec[2]<0)omega=TWOPI-omega;
    }else omega=normRad(Math.atan2(evec[1],evec[0]));
  }
  let nu=0;
  if(e>1e-12){
    nu=Math.acos(clamp(dot(evec,r)/(e*rmag),-1,1));
    if(dot(r,v)<0)nu=TWOPI-nu;
  }else if(nmag>1e-14){
    nu=Math.acos(clamp(dot(n,r)/(nmag*rmag),-1,1));
    if(r[2]<0)nu=TWOPI-nu;
  }else nu=normRad(Math.atan2(r[1],r[0]));

  let M=nu;
  if(e<1-1e-10){
    const E=2*Math.atan2(Math.sqrt(1-e)*Math.sin(nu/2),Math.sqrt(1+e)*Math.cos(nu/2));
    M=normRad(E-e*Math.sin(E));
  }
  const varpi=normRad(Omega+omega),lambda=normRad(M+varpi);
  const period=(a>0&&Number.isFinite(a))?TWOPI*Math.sqrt(a*a*a/mu):null;
  return {
    aAU:a,e,iDeg:i*R2D,OmegaDeg:Omega*R2D,omegaDeg:omega*R2D,
    trueAnomalyDeg:nu*R2D,meanAnomalyDeg:M*R2D,varpiDeg:varpi*R2D,
    lambdaDeg:lambda*R2D,periodYears:period,pAU:(hmag*hmag/mu),periAU:(e<1&&a>0)?a*(1-e):(hmag*hmag/mu)/(1+e),
    apoAU:a>0&&e<1?a*(1+e):null,distanceAU:rmag
  };
}

function pointFromElements(el,nu){
  if(!el||!(el.aAU>0)||el.e>=1)return null;
  const a=el.aAU,e=el.e,i=el.iDeg*D2R,O=el.OmegaDeg*D2R,w=el.omegaDeg*D2R;
  const p=a*(1-e*e),r=p/(1+e*Math.cos(nu)),x=r*Math.cos(nu),y=r*Math.sin(nu);
  const cO=Math.cos(O),sO=Math.sin(O),ci=Math.cos(i),si=Math.sin(i),cw=Math.cos(w),sw=Math.sin(w);
  return [
    (cO*cw-sO*sw*ci)*x+(-cO*sw-sO*cw*ci)*y,
    (sO*cw+cO*sw*ci)*x+(-sO*sw+cO*cw*ci)*y,
    (sw*si)*x+(cw*si)*y
  ];
}
function dist2(a,b){const x=a[0]-b[0],y=a[1]-b[1],z=a[2]-b[2];return x*x+y*y+z*z}

function approximateMOID(a,b,opts={}){
  if(!a||!b||a.e>=1||b.e>=1||!(a.aAU>0)||!(b.aAU>0))return null;
  const samples=Math.max(48,Math.min(360,opts.samples||144));
  const pa=[],pb=[];
  let best={d2:Infinity,ia:0,ib:0,na:0,nb:0};
  for(let i=0;i<samples;i++){const nu=TWOPI*i/samples;pa.push(pointFromElements(a,nu))}
  for(let j=0;j<samples;j++){const nu=TWOPI*j/samples;pb.push(pointFromElements(b,nu))}
  for(let i=0;i<samples;i++)for(let j=0;j<samples;j++){
    const d=dist2(pa[i],pb[j]);if(d<best.d2)best={d2:d,ia:i,ib:j,na:TWOPI*i/samples,nb:TWOPI*j/samples};
  }
  let wa=TWOPI/samples,wb=TWOPI/samples;
  const refine=Math.max(0,Math.min(5,opts.refine??3)),grid=11;
  for(let level=0;level<refine;level++){
    const ca=best.na,cb=best.nb;let local=best;
    for(let i=0;i<grid;i++){
      const na=ca-wa+(2*wa*i/(grid-1)),A=pointFromElements(a,na);
      for(let j=0;j<grid;j++){
        const nb=cb-wb+(2*wb*j/(grid-1)),B=pointFromElements(b,nb),d=dist2(A,B);
        if(d<local.d2)local={d2:d,na:normRad(na),nb:normRad(nb)};
      }
    }
    best=local;wa*=.28;wb*=.28;
  }
  return {moidAU:Math.sqrt(best.d2),trueAnomalyADeg:normDeg(best.na*R2D),trueAnomalyBDeg:normDeg(best.nb*R2D),samples,refine};
}

function circularStats(values){
  if(!values?.length)return {arcWidthDeg:null,centerDeg:null,unwrappedRangeDeg:null,totalDriftDeg:null};
  const a=values.map(normDeg).sort((x,y)=>x-y);
  let maxGap=-1,gapStart=0;
  for(let i=0;i<a.length;i++){
    const next=i===a.length-1?a[0]+360:a[i+1],gap=next-a[i];
    if(gap>maxGap){maxGap=gap;gapStart=a[i]}
  }
  const width=360-maxGap,start=normDeg(gapStart+maxGap),center=normDeg(start+width/2);
  const un=[normDeg(values[0])];
  for(let i=1;i<values.length;i++){
    let x=normDeg(values[i]),prev=un[i-1],base=normDeg(prev),d=x-base;
    if(d>180)d-=360;if(d<-180)d+=360;un.push(prev+d);
  }
  return {
    arcWidthDeg:width,centerDeg:center,
    unwrappedRangeDeg:Math.max(...un)-Math.min(...un),
    totalDriftDeg:un[un.length-1]-un[0]
  };
}
function resonantAngles(innerEl,outerEl,p,q){
  if(!innerEl||!outerEl)return null;
  const k=p-q,base=p*outerEl.lambdaDeg-q*innerEl.lambdaDeg;
  return {
    outerDeg:normDeg(base-k*outerEl.varpiDeg),
    innerDeg:normDeg(base-k*innerEl.varpiDeg)
  };
}
function classifyResonance(seriesOuter,seriesInner){
  const a=circularStats(seriesOuter),b=circularStats(seriesInner);
  const chosen=(a.arcWidthDeg??999)<=(b.arcWidthDeg??999)?{branch:"outer",...a}:{branch:"inner",...b};
  let status="indeterminado",level="info";
  if((chosen.unwrappedRangeDeg??0)>540||(chosen.arcWidthDeg??0)>330){status="circulación";level="warn"}
  else if((chosen.arcWidthDeg??999)<220&&(chosen.unwrappedRangeDeg??999)<360){status="libración compatible";level="ok"}
  else if((chosen.arcWidthDeg??999)<300&&(chosen.unwrappedRangeDeg??999)<450){status="posible libración";level="info"}
  return {status,level,...chosen};
}
function secularSummary(samples){
  if(!samples?.length)return null;
  const vals=k=>samples.map(x=>x[k]).filter(Number.isFinite);
  const range=k=>{const v=vals(k);return v.length?{min:Math.min(...v),max:Math.max(...v),span:Math.max(...v)-Math.min(...v)}:null};
  return {a:range("aAU"),e:range("e"),i:range("iDeg"),varpi:circularStats(vals("varpiDeg")),samples:samples.length};
}
core.OrbitalDynamics={elementsFromState,pointFromElements,approximateMOID,circularStats,resonantAngles,classifyResonance,secularSummary,normDeg};
})();