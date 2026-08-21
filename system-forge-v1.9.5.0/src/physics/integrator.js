(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};

  class NBodyIntegrator{
    constructor({THREE,state,G,AU_KM,massSolar,radiusKm,structurePhysics,recordCriticalEvent,invalidateRenderState,sampleTemporalSelected}={}){
      this.THREE=THREE;this.state=state;this.G=G;this.AU_KM=AU_KM;this.massSolar=massSolar;this.radiusKm=radiusKm;this.structurePhysics=structurePhysics;this.recordCriticalEvent=recordCriticalEvent;this.invalidateRenderState=invalidateRenderState;this.sampleTemporalSelected=sampleTemporalSelected;
    }
    accelerations(){
      const state=this.state,acc=state.bodies.map(()=>new this.THREE.Vector3());
      for(let i=0;i<state.bodies.length;i++)for(let j=i+1;j<state.bodies.length;j++){
        const bi=state.bodies[i],bj=state.bodies[j];if(bi.kind==="structure"||bj.kind==="structure")continue;
        const d=new this.THREE.Vector3().subVectors(bj.pos,bi.pos),r2=d.lengthSq()+1e-12,r=Math.sqrt(r2),f=this.G/(r2*r);
        acc[i].addScaledVector(d,f*this.massSolar(bj));acc[j].addScaledVector(d,-f*this.massSolar(bi));
        if(bi.kind!=="star"&&bj.kind!=="star"){
          state.minSep=Math.min(state.minSep,r);const collAU=(this.radiusKm(bi)+this.radiusKm(bj))/this.AU_KM;
          if(r<Math.max(collAU*1.15,1e-8)){state.unstable=true;this.recordCriticalEvent?.(bi,bj,r)}
        }
      }
      this.structurePhysics?.applyGravity(acc);return acc;
    }
    step(dt){
      const state=this.state;this.structurePhysics?.syncToParents();const a0=this.accelerations();
      for(let i=0;i<state.bodies.length;i++){if(state.bodies[i].kind==="structure")continue;state.bodies[i].pos.addScaledVector(state.bodies[i].vel,dt).addScaledVector(a0[i],.5*dt*dt)}
      this.structurePhysics?.syncToParents();const a1=this.accelerations();
      for(let i=0;i<state.bodies.length;i++){if(state.bodies[i].kind==="structure")continue;state.bodies[i].vel.addScaledVector(a0[i],.5*dt).addScaledVector(a1[i],.5*dt)}
      this.structurePhysics?.syncToParents();state.t+=dt;this.invalidateRenderState?.();this.sampleTemporalSelected?.();
    }
    energy(){
      const state=this.state,bs=state.bodies.filter(b=>b.kind!=="structure");let E=0;
      for(const b of bs)E+=.5*this.massSolar(b)*b.vel.lengthSq();
      for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const r=bs[i].pos.distanceTo(bs[j].pos);if(r)E-=this.G*this.massSolar(bs[i])*this.massSolar(bs[j])/r}
      for(const s of state.bodies.filter(b=>b.kind==="structure"&&b.gravityEnabled&&this.massSolar(b)>0))for(const b of bs)if(b.id!==s.parent)E+=this.massSolar(b)*(this.structurePhysics?.potentialAt(b,s)||0);
      return E;
    }
    angularMomentum(){
      const L=new this.THREE.Vector3();
      for(const b of this.state.bodies){if(b.kind==="structure")continue;const m=this.massSolar(b),h=b.pos.clone().cross(b.vel);L.addScaledVector(h,m)}
      return L;
    }
  }
  ns.NBodyIntegrator=NBodyIntegrator;
})(window);
