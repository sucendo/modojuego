(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};

  class StructurePhysics{
    constructor({THREE,state,G,AU_KM,massSolar,parentOf}={}){
      this.THREE=THREE;this.state=state;this.G=G;this.AU_KM=AU_KM;this.massSolar=massSolar;this.parentOf=parentOf;
    }
    center(s){const p=this.parentOf(s);return p?.pos||s.pos}
    planePoint(s,r,theta,z=0){
      const v=new this.THREE.Vector3(r*Math.cos(theta),z,-r*Math.sin(theta));
      if(s.i)v.applyAxisAngle(new this.THREE.Vector3(1,0,0),s.i*Math.PI/180);
      if(s.Omega)v.applyAxisAngle(new this.THREE.Vector3(0,1,0),s.Omega*Math.PI/180);
      return v;
    }
    gravityRings(s){
      const inner=Math.max(1e-8,Math.min(s.innerAU,s.outerAU)),outer=Math.max(inner*1.0001,Math.max(s.innerAU,s.outerAU)),AU_KM=this.AU_KM;
      if(s.structureProfile==="saturnRings")return [
        {r:83000/AU_KM,w:.06},{r:104000/AU_KM,w:.62},{r:129000/AU_KM,w:.30},
        {r:139826/AU_KM,w:.015},{r:169500/AU_KM,w:.003},{r:238000/AU_KM,w:.002}
      ];
      if(s.structureProfile==="jupiterRings")return [{r:115000/AU_KM,w:.08},{r:126500/AU_KM,w:.55},{r:165000/AU_KM,w:.22},{r:210000/AU_KM,w:.15}];
      if(s.structureProfile==="uranusRings")return [
        {r:39600/AU_KM,w:.05},{r:44720/AU_KM,w:.08},{r:45670/AU_KM,w:.08},
        {r:47630/AU_KM,w:.08},{r:48290/AU_KM,w:.07},{r:50020/AU_KM,w:.08},
        {r:51140/AU_KM,w:.34},{r:67300/AU_KM,w:.10},{r:97700/AU_KM,w:.12}
      ];
      if(s.structureProfile==="neptuneRings")return [
        {r:41900/AU_KM,w:.16},{r:53200/AU_KM,w:.22},{r:55400/AU_KM,w:.15},
        {r:57600/AU_KM,w:.12},{r:62930/AU_KM,w:.35}
      ];
      if(s.structureProfile==="asteroidKirkwood")return [{r:2.20,w:.17},{r:2.38,w:.18},{r:2.67,w:.23},{r:2.90,w:.18},{r:3.10,w:.16},{r:3.32,w:.08}].filter(x=>x.r>=inner*.95&&x.r<=outer*1.05);
      if(s.structureProfile==="kuiperDynamic"){
        const n=this.state.bodies.find(b=>b.name==="Neptuno"&&b.kind==="planet"),aN=n?.a||30.061;
        return [
          {r:aN*Math.pow(4/3,2/3),w:.08},{r:aN*Math.pow(3/2,2/3),w:.18},
          {r:44,w:.44},{r:aN*Math.pow(2,2/3),w:.12},{r:90,w:.08},{r:250,w:.06},{r:600,w:.04}
        ].filter(x=>x.r>=inner*.8&&x.r<=outer*1.05);
      }
      const out=[];for(let i=0;i<3;i++)out.push({r:inner+(outer-inner)*(i+.5)/3,w:1/3});return out;
    }
    gravityCacheKey(s){return [s.structureProfile,s.innerAU,s.outerAU,s.i,s.Omega,s.structureSamples].join("|")}
    ensureGravitySamples(s){
      const key=this.gravityCacheKey(s);if(s._gravityCache?.key===key)return s._gravityCache.samples;
      const rings=this.gravityRings(s),angles=Math.max(6,Math.min(12,Math.round((s.structureSamples||20)*.65))),sumW=rings.reduce((a,x)=>a+x.w,0)||1,samples=[];
      for(const rr of rings)for(let k=0;k<angles;k++){
        const th=(k+.5)/angles*Math.PI*2,o=this.planePoint(s,rr.r,th);samples.push({x:o.x,y:o.y,z:o.z,w:(rr.w/sumW)/angles});
      }
      s._gravityCache={key,samples};return samples;
    }
    annulusGravityOn(target,s){
      if(!s.gravityEnabled||this.massSolar(s)<=0)return new this.THREE.Vector3();
      const c=this.center(s),samples=this.ensureGravitySamples(s),M=this.massSolar(s);let ax=0,ay=0,az=0;
      for(const q of samples){const dx=c.x+q.x-target.pos.x,dy=c.y+q.y-target.pos.y,dz=c.z+q.z-target.pos.z,r2=dx*dx+dy*dy+dz*dz+1e-10,r=Math.sqrt(r2),f=this.G*M*q.w/(r2*r);ax+=dx*f;ay+=dy*f;az+=dz*f}
      return new this.THREE.Vector3(ax,ay,az);
    }
    shellGravityOn(target,s){
      if(!s.gravityEnabled||this.massSolar(s)<=0)return new this.THREE.Vector3();
      const rv=target.pos.clone().sub(this.center(s)),r=rv.length(),inner=Math.max(1e-6,Math.min(s.innerAU,s.outerAU)),outer=Math.max(inner*1.0001,Math.max(s.innerAU,s.outerAU));
      if(r<inner||r<1e-12)return new this.THREE.Vector3();let frac=1;
      if(r<outer)frac=(r*r*r-inner*inner*inner)/(outer*outer*outer-inner*inner*inner);
      return rv.multiplyScalar(-this.G*this.massSolar(s)*Math.max(0,Math.min(1,frac))/(r*r*r));
    }
    applyGravity(acc){
      const ss=this.state.bodies.filter(b=>b.kind==="structure"&&b.gravityEnabled&&this.massSolar(b)>0);if(!ss.length)return;
      const index=new Map(this.state.bodies.map((b,i)=>[b.id,i]));
      for(let i=0;i<this.state.bodies.length;i++){
        const b=this.state.bodies[i];if(b.kind==="structure")continue;const mb=this.massSolar(b);
        for(const s of ss){
          const a=s.structureType==="shell"?this.shellGravityOn(b,s):this.annulusGravityOn(b,s);acc[i].add(a);
          const pi=index.get(s.parent),p=pi!=null?this.state.bodies[pi]:null;
          if(pi!=null&&pi!==i&&p)acc[pi].addScaledVector(a,-mb/Math.max(1e-16,this.massSolar(p)+this.massSolar(s)));
        }
      }
    }
    syncToParents(){for(const s of this.state.bodies.filter(b=>b.kind==="structure")){const p=this.parentOf(s);if(p){s.pos.copy(p.pos);s.vel.copy(p.vel)}}}
    potentialAt(b,s){
      const M=this.massSolar(s);if(!s.gravityEnabled||M<=0)return 0;const c=this.center(s);
      if(s.structureType==="shell"){
        const r=Math.hypot(b.pos.x-c.x,b.pos.y-c.y,b.pos.z-c.z),r1=Math.max(1e-8,Math.min(s.innerAU,s.outerAU)),r2=Math.max(r1*1.0001,Math.max(s.innerAU,s.outerAU)),D=r2**3-r1**3;
        if(r>=r2)return -this.G*M/r;if(r<=r1)return -(3*this.G*M/2)*(r2*r2-r1*r1)/D;
        return -this.G*M*(((r**3-r1**3)/(D*r))+(1.5*(r2*r2-r*r)/D));
      }
      let phi=0;for(const q of this.ensureGravitySamples(s)){const dx=c.x+q.x-b.pos.x,dy=c.y+q.y-b.pos.y,dz=c.z+q.z-b.pos.z;phi-=this.G*M*q.w/Math.sqrt(dx*dx+dy*dy+dz*dz+1e-10)}return phi;
    }
  }
  ns.StructurePhysics=StructurePhysics;
})(window);
