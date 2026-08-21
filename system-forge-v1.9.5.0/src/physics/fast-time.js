(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  const TIME_PRESETS=[
    ["1 s",1/(365.25*86400)],["10 s",10/(365.25*86400)],["30 s",30/(365.25*86400)],
    ["1 min",60/(365.25*86400)],["5 min",300/(365.25*86400)],["15 min",900/(365.25*86400)],["30 min",1800/(365.25*86400)],
    ["1 h",3600/(365.25*86400)],["6 h",21600/(365.25*86400)],["12 h",43200/(365.25*86400)],
    ["1 día",1/365.25],["2 días",2/365.25],["5 días",5/365.25],["10 días",10/365.25],["30 días",30/365.25],
    ["1 mes",1/12],["3 meses",3/12],["6 meses",6/12],["1 año",1],["2 años",2],["5 años",5],["10 años",10],["25 años",25],["50 años",50],["100 años",100],["250 años",250],["500 años",500],["1.000 años",1000]
  ];

  class FastTimeController{
    constructor({THREE,state,G,AU_KM,massSolar,radiusKm,parentOf,period,isMobileUI,perfMonitor,getElement,dynamicArchitectureReport,orbitalReferenceAt,orbitalReference,orbitState,referenceById,orbitalDynamics,structurePhysics,recordCriticalEvent,sampleRealTrails,invalidateRenderState,sampleTemporalSelected,recenterBarycenter,energy,clearTrails}={}){
      Object.assign(this,{THREE,state,G,AU_KM,massSolar,radiusKm,parentOf,period,isMobileUI,perfMonitor,getElement,dynamicArchitectureReport,orbitalReferenceAt,orbitalReference,orbitState,referenceById,orbitalDynamics,structurePhysics,recordCriticalEvent,sampleRealTrails,invalidateRenderState,sampleTemporalSelected,recenterBarycenter,energy,clearTrails});
    }
    static get TIME_PRESETS(){return TIME_PRESETS}
    static chooseIntegrationMode({current="full",forceReduced=false,fullReq=0,reducedReq=0,fullBudget=1,reducedBudget=1}={}){
      if(current==="full")return fullReq>fullBudget*.82?"reduced":"full";
      if(current==="reduced"){if(fullReq<fullBudget*.50)return "full";if(!forceReduced&&reducedReq>reducedBudget*.90)return "kepler";return "reduced"}
      if(forceReduced)return "reduced";if(reducedReq<reducedBudget*.55)return "reduced";return "kepler";
    }
    currentTimePreset(){const i=Math.max(0,Math.min(TIME_PRESETS.length-1,Math.round(Number(this.getElement?.("speed")?.value)||0)));return {index:i,label:TIME_PRESETS[i][0],years:TIME_PRESETS[i][1]}}
    speedYearsPerSecond(){return this.currentTimePreset().years}
    formatTimeScale(yps){let best=TIME_PRESETS[0],score=Infinity;for(const p of TIME_PRESETS){const s=Math.abs(Math.log(Math.max(p[1],1e-30)/Math.max(yps,1e-30)));if(s<score){score=s;best=p}}return `1 s = ${best[0]} ⊕`}
    minOrbitalPeriodYears(){let min=Infinity;for(const b of this.state.bodies){const p=this.period(b);if(p&&p>0)min=Math.min(min,p)}return min}
    adaptiveMaxStep(){const p=this.minOrbitalPeriodYears();if(!Number.isFinite(p))return .02;return Math.min(.02,Math.max(1e-7,p/48))}
    integrationStepBudget(kind="full"){
      const mobile=this.isMobileUI(),snap=this.perfMonitor.snapshot(),cost=Math.max(.03,kind==="full"?this.state.fullStepCostMs:this.state.reducedStepCostMs),cpuMsPerSecond=mobile?260:420;
      let budget=cpuMsPerSecond/cost;if(snap.fps<42)budget*=.68;else if(snap.fps>55)budget*=1.06;
      return Math.max(mobile?(kind==="full"?220:400):(kind==="full"?350:650),Math.min(mobile?(kind==="full"?700:1600):(kind==="full"?1200:3200),budget));
    }
    fullRequiredStepsPerSecond(yps){return yps/Math.max(1e-12,this.adaptiveMaxStep())}
    reducedRequiredStepsPerSecond(yps){return yps/Math.max(1e-12,this.encounterFastMaxStep())}
    activeVisitors(){return this.state.bodies.filter(b=>["visitor","temporary-capture","captured","ejected"].includes(b.encounterRole)&&this.massSolar(b)>0)}
    encounterCoreBodies(){return this.state.bodies.filter(b=>b.kind==="star"||b.kind==="planet"||b.kind==="minor")}
    encounterFastMaxStep(){
      let h=.05;const visitors=this.activeVisitors();
      for(const v of visitors)for(const host of this.state.bodies){if(host.id===v.id||!(host.kind==="star"||host.kind==="planet"))continue;const d=v.pos.distanceTo(host.pos);if(d<.2)h=Math.min(h,.00001);else if(d<1)h=Math.min(h,.00005);else if(d<5)h=Math.min(h,.00015);else if(d<10)h=Math.min(h,.0003);else if(d<30)h=Math.min(h,.001);else if(d<100)h=Math.min(h,.005);else if(d<500)h=Math.min(h,.02)}
      const core=this.encounterCoreBodies();
      for(const b of core){const host=this.parentOf(b);if(!host||!core.includes(host))continue;const r=b.pos.distanceTo(host.pos),M=this.massSolar(b)+this.massSolar(host);if(r>0&&M>0){const pInst=Math.sqrt(r*r*r/M);h=Math.min(h,Math.max(1e-6,pInst/64))}}
      const stars=core.filter(b=>b.kind==="star");for(let i=0;i<stars.length;i++)for(let j=i+1;j<stars.length;j++){const r=stars[i].pos.distanceTo(stars[j].pos),M=this.massSolar(stars[i])+this.massSolar(stars[j]);if(r>0&&M>0)h=Math.min(h,Math.max(1e-6,Math.sqrt(r*r*r/M)/64))}
      return Math.max(1e-6,h);
    }
    requiresReducedFastMode(now=performance.now()){
      if(this.activeVisitors().length)return true;if(this.state.bodies.filter(b=>b.kind==="star"&&this.massSolar(b)>0).length>1)return true;if(this.state.unstable)return true;
      if(now-this.state.fastModeCheckAt>500){this.state.fastModeCheckAt=now;try{this.state.fastModeRequiresNBody=this.dynamicArchitectureReport().severe}catch{this.state.fastModeRequiresNBody=false}}
      return this.state.fastModeRequiresNBody;
    }
    encounterCoreAccelerations(core){
      const a=core.map(()=>new this.THREE.Vector3());for(let i=0;i<core.length;i++)for(let j=i+1;j<core.length;j++){
        const bi=core[i],bj=core[j],d=bj.pos.clone().sub(bi.pos),r2=d.lengthSq()+1e-12,r=Math.sqrt(r2),u=d.multiplyScalar(1/r),f=this.G/r2;a[i].addScaledVector(u,f*this.massSolar(bj));a[j].addScaledVector(u,-f*this.massSolar(bi));
      }return a;
    }
    buildReducedFollowerSpecs(){
      const specs=new Map();for(const b of this.state.bodies.filter(x=>x.kind==="moon"||x.kind==="spacecraft")){
        const ref=this.orbitalReferenceAt(b,null);if(!ref){specs.set(b.id,{mode:"absolute-linear",pos:b.pos.clone(),vel:b.vel.clone()});continue}
        const r=b.pos.clone().sub(ref.pos),v=b.vel.clone().sub(ref.vel),mu=this.G*(ref.mass+this.massSolar(b)),e=mu>0?this.orbitalDynamics.elementsFromState(r.toArray(),v.toArray(),mu):null;
        if(e&&Number.isFinite(e.aAU)&&e.aAU>0&&Number.isFinite(e.e)&&e.e<1&&Number.isFinite(e.meanAnomalyDeg))specs.set(b.id,{mode:"orbital",a:e.aAU,e:e.e,i:e.iDeg,Omega:e.OmegaDeg,omega:e.omegaDeg,M0:e.meanAnomalyDeg});else specs.set(b.id,{mode:"relative-linear",r:r.clone(),v:v.clone()});
      }return specs;
    }
    beginReducedFastMode(){if(this.state.reducedFollowerSpecs)return;this.state.reducedFollowerBaseT=this.state.t;this.state.reducedFollowerSpecs=this.buildReducedFollowerSpecs()}
    endReducedFastMode(){this.state.reducedFollowerSpecs=null;this.state.reducedFollowerBaseT=null}
    syncEncounterFollowers(){
      const specs=this.state.reducedFollowerSpecs||this.buildReducedFollowerSpecs(),dt=this.state.t-(this.state.reducedFollowerBaseT??this.state.t),followers=this.state.bodies.filter(b=>b.kind==="moon"||b.kind==="spacecraft"),done=new Set();
      for(let pass=0;pass<12;pass++)for(const b of followers){if(done.has(b.id))continue;const sp=specs.get(b.id);if(!sp)continue;const structuralParent=this.parentOf(b);if((structuralParent?.kind==="moon"||structuralParent?.kind==="spacecraft")&&!done.has(structuralParent.id))continue;const ref=this.orbitalReference(b);if(sp.mode==="absolute-linear"){b.pos.copy(sp.pos).addScaledVector(sp.vel,dt);b.vel.copy(sp.vel);done.add(b.id);continue}if(!ref)continue;if(sp.mode==="relative-linear"){b.pos.copy(ref.pos).add(sp.r).addScaledVector(sp.v,dt);b.vel.copy(ref.vel).add(sp.v);done.add(b.id);continue}if(sp.mode==="orbital"){const n=Math.sqrt(this.G*(ref.mass+this.massSolar(b))/(sp.a**3)),tmp={...b,a:sp.a,e:sp.e,i:sp.i,Omega:sp.Omega,omega:sp.omega,M0:(sp.M0+n*dt*180/Math.PI)%360},os=this.orbitState(tmp,ref.mass+this.massSolar(b));b.pos.copy(ref.pos).add(os.r);b.vel.copy(ref.vel).add(os.v);done.add(b.id)}}
      this.structurePhysics.syncToParents();
    }
    selectIntegrationMode(yps,now=performance.now()){
      return FastTimeController.chooseIntegrationMode({current:this.state.timeIntegrationMode||"full",forceReduced:this.requiresReducedFastMode(now),fullReq:this.fullRequiredStepsPerSecond(yps),reducedReq:this.reducedRequiredStepsPerSecond(yps),fullBudget:this.integrationStepBudget("full"),reducedBudget:this.integrationStepBudget("reduced")});
    }
    encounterFastAdvance(requestedYears){
      const core=this.encounterCoreBodies(),maxStep=this.encounterFastMaxStep(),maxSteps=320;let actual=Math.min(requestedYears,maxStep*maxSteps),n=Math.max(1,Math.ceil(actual/maxStep)),h=actual/n;this.state.encounterSpeedLimited=actual+1e-12<requestedYears;
      for(let q=0;q<n;q++){
        const a0=this.encounterCoreAccelerations(core);for(let i=0;i<core.length;i++)core[i].pos.addScaledVector(core[i].vel,h).addScaledVector(a0[i],.5*h*h);const a1=this.encounterCoreAccelerations(core);for(let i=0;i<core.length;i++)core[i].vel.addScaledVector(a0[i].clone().add(a1[i]),.5*h);this.state.t+=h;
        for(let i=0;i<core.length;i++)for(let j=i+1;j<core.length;j++){if(core[i].kind==="star"||core[j].kind==="star")continue;const d=core[i].pos.distanceTo(core[j].pos),coll=(this.radiusKm(core[i])+this.radiusKm(core[j]))/this.AU_KM;this.state.minSep=Math.min(this.state.minSep,d);if(d<Math.max(coll*1.15,1e-8)){this.state.unstable=true;this.recordCriticalEvent(core[i],core[j],d)}}
      }
      this.syncEncounterFollowers();this.sampleRealTrails();this.state.approximateAdvanceUsed=true;this.invalidateRenderState();this.sampleTemporalSelected();return {actualYears:actual,steps:n};
    }
    previewOrbitalReference(b,out){
      if(b.orbitReferenceId){const ref=this.referenceById(b.orbitReferenceId);if(ref){const members=(ref.memberIds||[]).map(id=>this.state.bodies.find(x=>x.id===id)).filter(Boolean);let M=0,pos=new this.THREE.Vector3(),vel=new this.THREE.Vector3();for(const x of members){const st=out.get(x.id);if(!st)return null;const m=this.massSolar(x);M+=m;pos.addScaledVector(st.pos,m);vel.addScaledVector(st.vel,m)}if(M){pos.multiplyScalar(1/M);vel.multiplyScalar(1/M)}return {pos,vel,mass:M}}}
      if(Array.isArray(b.orbitCenterIds)&&b.orbitCenterIds.length){const members=b.orbitCenterIds.map(id=>this.state.bodies.find(x=>x.id===id)).filter(Boolean);let M=0,pos=new this.THREE.Vector3(),vel=new this.THREE.Vector3();for(const x of members){const st=out.get(x.id);if(!st)return null;const m=this.massSolar(x);M+=m;pos.addScaledVector(st.pos,m);vel.addScaledVector(st.vel,m)}if(M){pos.multiplyScalar(1/M);vel.multiplyScalar(1/M)}return {pos,vel,mass:M}}
      const p=this.parentOf(b),st=p?out.get(p.id):null;return p&&st?{pos:st.pos,vel:st.vel,mass:this.massSolar(p)}:null;
    }
    buildKeplerPreviewSpecs(){
      const specs=new Map();for(const b of this.state.bodies){if(b.kind==="structure"){specs.set(b.id,{mode:"structure"});continue}const ref=this.orbitalReferenceAt(b,null);if(!ref||b.trajectoryMode==="cartesian"){specs.set(b.id,{mode:"linear",pos:b.pos.clone(),vel:b.vel.clone()});continue}const r=b.pos.clone().sub(ref.pos),v=b.vel.clone().sub(ref.vel),mu=this.G*(ref.mass+this.massSolar(b)),e=this.orbitalDynamics.elementsFromState(r.toArray(),v.toArray(),mu);if(e&&Number.isFinite(e.aAU)&&e.aAU>0&&Number.isFinite(e.e)&&e.e<1&&Number.isFinite(e.meanAnomalyDeg))specs.set(b.id,{mode:"orbital",a:e.aAU,e:e.e,i:e.iDeg,Omega:e.OmegaDeg,omega:e.omegaDeg,M0:e.meanAnomalyDeg});else specs.set(b.id,{mode:"linear",pos:b.pos.clone(),vel:b.vel.clone()})}return specs;
    }
    computeKeplerPreview(t){
      const out=new Map(),done=new Set(),dt=t-(this.state.previewBaseT??this.state.t),specs=this.state.previewSpecs||new Map();
      for(const b of this.state.bodies){const sp=specs.get(b.id);if(sp?.mode==="linear"&&!b.parent&&!b.orbitReferenceId&&!b.orbitCenterIds?.length){out.set(b.id,{pos:sp.pos.clone().addScaledVector(sp.vel,dt),vel:sp.vel.clone()});done.add(b.id)}}
      for(let pass=0;pass<16;pass++)for(const b of this.state.bodies){if(done.has(b.id))continue;const sp=specs.get(b.id);if(sp?.mode==="structure"||b.kind==="structure"){const p=this.parentOf(b),ps=p?out.get(p.id):null;if(ps){out.set(b.id,{pos:ps.pos.clone(),vel:ps.vel.clone()});done.add(b.id)}continue}if(sp?.mode==="linear"){out.set(b.id,{pos:sp.pos.clone().addScaledVector(sp.vel,dt),vel:sp.vel.clone()});done.add(b.id);continue}if(sp?.mode!=="orbital")continue;const ref=this.previewOrbitalReference(b,out);if(!ref)continue;const n=Math.sqrt(this.G*(ref.mass+this.massSolar(b))/(sp.a**3)),tmp={...b,a:sp.a,e:sp.e,i:sp.i,Omega:sp.Omega,omega:sp.omega,M0:(sp.M0+n*dt*180/Math.PI)%360},os=this.orbitState(tmp,ref.mass+this.massSolar(b));out.set(b.id,{pos:ref.pos.clone().add(os.r),vel:ref.vel.clone().add(os.v)});done.add(b.id)}
      return out;
    }
    beginKeplerPreview(){if(this.state.previewState)return;this.state.previewBaseT=this.state.t;this.state.previewT=this.state.t;this.state.previewSpecs=this.buildKeplerPreviewSpecs();this.state.previewState=this.computeKeplerPreview(this.state.previewT)}
    updateKeplerPreview(dtYears){if(!this.state.previewState)this.beginKeplerPreview();this.state.previewT+=dtYears;this.state.previewState=this.computeKeplerPreview(this.state.previewT);this.invalidateRenderState()}
    commitKeplerPreview(){
      if(!this.state.previewState)return;for(const b of this.state.bodies){const s=this.state.previewState.get(b.id);if(s){b.pos.copy(s.pos);b.vel.copy(s.vel)}}this.state.t=this.state.previewT;this.recenterBarycenter();this.structurePhysics.syncToParents();this.state.previewState=null;this.state.previewT=null;this.state.previewSpecs=null;this.state.previewBaseT=null;this.state.approximateAdvanceUsed=true;this.invalidateRenderState();for(const b of this.state.bodies){b.trail=[];b._trailLastT=null}this.state.trailRevision++;this.clearTrails();this.state.lastEnergy=this.energy();
    }
    displayedSimTime(){return this.state.previewState&&Number.isFinite(this.state.previewT)?this.state.previewT:this.state.t}
  }
  ns.FastTimeController=FastTimeController;
})(window);
