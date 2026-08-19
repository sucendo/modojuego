(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{},G=4*Math.PI*Math.PI;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(a[0],a[1],a[2]),unit=a=>{const n=norm(a)||1;return[a[0]/n,a[1]/n,a[2]/n]};
const seeded=(k,s=1)=>{const x=Math.sin((k+1)*12.9898+s*78.233)*43758.5453;return x-Math.floor(x)};
function tangentialUnit(r,k){
  let axis=[0,1,0],ru=unit(r);if(Math.abs(ru[1])>.9)axis=[1,0,0];
  let t=unit(cross(axis,ru)),tw=(seeded(k,9)-.5)*Math.PI*2,c=Math.cos(tw),sn=Math.sin(tw),u=unit(cross(ru,t));
  return [t[0]*c+u[0]*sn,t[1]*c+u[1]*sn,t[2]*c+u[2]*sn];
}
function create({count,structure,host,timeYears=0}){
  const n=Math.max(32,Math.min(10000,Math.round(count||500))),pos=new Float64Array(n*3),vel=new Float64Array(n*3),initialEnergy=new Float64Array(n);
  const inner=Math.max(1e-6,structure.innerAU||1),outer=Math.max(inner*1.001,structure.outerAU||inner*2),mu=G*Math.max(1e-16,host.massSolar);
  for(let k=0;k<n;k++){
    const f=seeded(k,1),g=seeded(k,2),h=seeded(k,3);let rel;
    if(structure.structureType==="shell"){
      const r=inner+(outer-inner)*Math.cbrt(f),u=g*2-1,th=h*Math.PI*2,q=Math.sqrt(Math.max(0,1-u*u));rel=[r*q*Math.cos(th),r*u,r*q*Math.sin(th)];
    }else{
      const r=inner+(outer-inner)*Math.sqrt(f),th=g*Math.PI*2,z=Math.tan((structure.thicknessDeg||8)*Math.PI/360)*r*(h*2-1);rel=[r*Math.cos(th),z,-r*Math.sin(th)];
    }
    const r=norm(rel),t=tangentialUnit(rel,k),speed=Math.sqrt(mu/r)*(structure.structureType==="shell"?(0.72+.24*seeded(k,8)):1),j=k*3;
    pos[j]=host.pos[0]+rel[0];pos[j+1]=host.pos[1]+rel[1];pos[j+2]=host.pos[2]+rel[2];
    vel[j]=host.vel[0]+t[0]*speed;vel[j+1]=host.vel[1]+t[1]*speed;vel[j+2]=host.vel[2]+t[2]*speed;
    initialEnergy[k]=.5*speed*speed-mu/r;
  }
  return {count:n,pos,vel,initialEnergy,lastTimeYears:timeYears,resolutionCapped:false,stats:null};
}
function accelerations(state,perturbers){
  const a=new Float64Array(state.count*3);
  for(let k=0;k<state.count;k++){
    const j=k*3,px=state.pos[j],py=state.pos[j+1],pz=state.pos[j+2];let ax=0,ay=0,az=0;
    for(const p of perturbers){
      const dx=p.pos[0]-px,dy=p.pos[1]-py,dz=p.pos[2]-pz,r2=dx*dx+dy*dy+dz*dz+1e-12,r=Math.sqrt(r2),f=G*p.massSolar/(r2*r);
      ax+=dx*f;ay+=dy*f;az+=dz*f;
    }
    a[j]=ax;a[j+1]=ay;a[j+2]=az;
  }
  return a;
}
function step(state,perturbers,dt){
  const a0=accelerations(state,perturbers),h=.5*dt*dt;
  for(let k=0;k<state.pos.length;k++)state.pos[k]+=state.vel[k]*dt+a0[k]*h;
  const a1=accelerations(state,perturbers);
  for(let k=0;k<state.vel.length;k++)state.vel[k]+=.5*(a0[k]+a1[k])*dt;
}
function classify(state,host,visitor,innerThresholdAU){
  const muH=G*host.massSolar,muV=visitor?G*visitor.massSolar:0;let stable=0,perturbed=0,injected=0,expelled=0,captured=0;
  for(let k=0;k<state.count;k++){
    const j=k*3,rx=state.pos[j]-host.pos[0],ry=state.pos[j+1]-host.pos[1],rz=state.pos[j+2]-host.pos[2],
      vx=state.vel[j]-host.vel[0],vy=state.vel[j+1]-host.vel[1],vz=state.vel[j+2]-host.vel[2],
      r=Math.hypot(rx,ry,rz),v2=vx*vx+vy*vy+vz*vz,E=.5*v2-muH/r;
    let isCaptured=false;
    if(visitor){
      const vrx=state.pos[j]-visitor.pos[0],vry=state.pos[j+1]-visitor.pos[1],vrz=state.pos[j+2]-visitor.pos[2],
        vvx=state.vel[j]-visitor.vel[0],vvy=state.vel[j+1]-visitor.vel[1],vvz=state.vel[j+2]-visitor.vel[2],
        Er=.5*(vvx*vvx+vvy*vvy+vvz*vvz)-muV/Math.hypot(vrx,vry,vrz);
      isCaptured=E>0&&Er<0;
    }
    if(isCaptured){captured++;continue}
    if(E>=0){expelled++;continue}
    const hx=ry*vz-rz*vy,hy=rz*vx-rx*vz,hz=rx*vy-ry*vx,h2=hx*hx+hy*hy+hz*hz,e=Math.sqrt(Math.max(0,1+2*E*h2/(muH*muH))),a=-muH/(2*E),q=Math.max(0,a*(1-e));
    if(q<innerThresholdAU){injected++;continue}
    const change=Math.abs((E-state.initialEnergy[k])/(Math.abs(state.initialEnergy[k])+1e-16));
    if(change>.20)perturbed++;else stable++;
  }
  return {total:state.count,stable,perturbed,injected,expelled,captured,innerThresholdAU};
}
core.TracerIntegrator={create,step,classify};
})();