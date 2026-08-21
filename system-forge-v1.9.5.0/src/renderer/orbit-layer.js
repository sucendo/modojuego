(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  function createOrbitLayer(ctx={}){
    const {THREE,state,orbitGroup,overlayGroup,computeDisplayPositions,referenceById,referenceDisplayPosition,massSolar,parentOf,categoryVisible,sameOrbitFamily,referencePhysicalState,orbitalReferenceAt,G,orbitPointFromTrueAnomaly,osculatingElements,relativeVisualScale,colorFor,orbitReferenceKey,initialOrbitSpec,perfMonitor,barycenterDisplay}=ctx;
    function displayOrbitalReference(b,disp){
      if(b.binaryBarycenterId){const ref=referenceById(b.binaryBarycenterId);if(ref)return referenceDisplayPosition(ref)}
      if(b.orbitReferenceId){const ref=referenceById(b.orbitReferenceId);if(ref){let M=0,p=new THREE.Vector3();for(const id of ref.memberIds||[]){const x=state.bodies.find(q=>q.id===id),d=disp.get(id);if(!x||!d)continue;const mm=massSolar(x);M+=mm;p.addScaledVector(d,mm)}if(M)return p.multiplyScalar(1/M)}}
      if(Array.isArray(b.orbitCenterIds)&&b.orbitCenterIds.length){let M=0,p=new THREE.Vector3();for(const id of b.orbitCenterIds){const x=state.bodies.find(q=>q.id===id),d=disp.get(id);if(!x||!d)continue;const mm=massSolar(x);M+=mm;p.addScaledVector(d,mm)}return M?p.multiplyScalar(1/M):null}
      const p=parentOf(b);return p?disp.get(p.id):null;
    }
    function orbitOpacityFor(b){
      if(b.kind==="structure"||!categoryVisible(b))return 0;
      const mode=state.orbitMode||"context",sel=state.bodies.find(x=>x.id===state.selected),base=b.kind==="moon"?.46:.28;
      if(mode==="all")return base;
      if(mode==="selected")return b.id===state.selected?.95:0;
      if(!sel)return base;
      if(b.id===sel.id)return .95;
      if(b.parent===sel.id)return .62;
      if(sel.parent&&b.id===sel.parent)return .55;
      if(sameOrbitFamily(b,sel))return .36;
      return .035;
    }
    function orbitSpecReferenceDisplay(spec,disp){
      if(spec?.orbitReferenceId){
        const ref=referenceById(spec.orbitReferenceId);if(ref)return referenceDisplayPosition(ref);
      }
      if(Array.isArray(spec?.orbitCenterIds)&&spec.orbitCenterIds.length){
        let M=0,p=new THREE.Vector3();
        for(const id of spec.orbitCenterIds){const b=state.bodies.find(x=>x.id===id),d=disp.get(id);if(!b||!d)continue;const m=massSolar(b);M+=m;p.addScaledVector(d,m)}
        if(M)return p.multiplyScalar(1/M);
      }
      return spec?.parentId?disp.get(spec.parentId)||null:null;
    }
    function orbitSpecReferenceMass(spec,b){
      if(spec?.orbitReferenceId){const rs=referencePhysicalState(referenceById(spec.orbitReferenceId),state.previewState);if(rs)return rs.mass}
      if(Array.isArray(spec?.orbitCenterIds)&&spec.orbitCenterIds.length)return spec.orbitCenterIds.reduce((s,id)=>s+massSolar(state.bodies.find(x=>x.id===id)||{massEarth:0}),0);
      if(spec?.parentId){const p=state.bodies.find(x=>x.id===spec.parentId);if(p)return massSolar(p)}
      return orbitalReferenceAt(b,state.previewState)?.mass||1;
    }
    function orbitalGeometryPoints(spec,b,sc,currentDistanceAU=null){
      if(!spec)return [];
      if(spec.trajectoryMode==="cartesian"&&spec.flybySpec){
        const mu=G*(orbitSpecReferenceMass(spec,b)+massSolar(b));
        return window.SystemForgeCore.EncounterPhysics.conicPoints(spec.flybySpec,mu,360).map(p=>new THREE.Vector3(...p).multiplyScalar(sc));
      }
      const e=Number(spec.e),a=Number(spec.a),i=Number(spec.i)||0,O=Number(spec.Omega)||0,w=Number(spec.omega)||0;
      if(!Number.isFinite(e))return [];
      if(e<1&&a>0){
        const tmp={a,e,i,Omega:O,omega:w},seg=e>.93?720:e>.8?540:e>.5?360:220,pts=[];
        for(let k=0;k<=seg;k++){const nu=-Math.PI+(k/seg)*Math.PI*2;pts.push(orbitPointFromTrueAnomaly(tmp,nu).multiplyScalar(sc))}
        return pts;
      }
      const p=Number(spec.pAU)||(Number.isFinite(a)?a*(1-e*e):null);
      if(!(p>0)||e<1)return [];
      const maxNu=e>1?Math.acos(Math.max(-1,Math.min(1,-1/e)))-.012:Math.PI-.025,limit=Math.max(1,(currentDistanceAU||spec.rAU||1)*2.2,(spec.periAU||p/(1+e)||1)*25),pts=[];
      const mu=G*Math.max(1e-12,orbitSpecReferenceMass(spec,b)+massSolar(b)),seg=420;
      for(let k=0;k<=seg;k++){
        const nu=-maxNu+(2*maxNu*k/seg),st=window.SystemForgeCore.EncounterPhysics.conicState(mu,p,e,nu,i,O,w);
        if(Number.isFinite(st.rAU)&&st.rAU<=limit)pts.push(new THREE.Vector3(...st.posAU).multiplyScalar(sc));
      }
      return pts;
    }
    function currentOsculatingSpec(b){
      const o=osculatingElements(b);if(!o)return null;
      return {trajectoryMode:o.e<1?"orbital":"conic",parentId:b.binaryBarycenterId?null:(b.parent||null),orbitReferenceId:b.binaryBarycenterId||b.orbitReferenceId||null,orbitCenterIds:Array.isArray(b.orbitCenterIds)?[...b.orbitCenterIds]:null,a:o.aAU,e:o.e,pAU:o.pAU,i:o.inclinationDeg,Omega:o.OmegaDeg,omega:o.omegaDeg,M0:o.meanAnomalyDeg,rAU:o.rAU,periAU:o.periAU};
    }
    function addOrbitLine(b,spec,pd,opacity,kind="current"){
      if(!pd||!spec)return;
      const sc=relativeVisualScale(b),pts=orbitalGeometryPoints(spec,b,sc,spec.rAU);if(pts.length<2)return;
      const initial=kind==="initial",line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({
        color:initial?0x71879b:colorFor(b),transparent:true,opacity:initial?Math.min(.22,opacity*.48):opacity,depthWrite:false
      }));
      line.position.copy(pd);line.userData.bodyId=b.id;line.userData.parentId=spec.parentId??b.parent??null;
      line.userData.referenceIds=Array.isArray(spec.orbitCenterIds)?[...spec.orbitCenterIds]:null;line.userData.referenceId=spec.orbitReferenceId||null;
      line.userData.orbitKind=kind;orbitGroup.add(line);
    }
    function refreshOrbitSignatureCache(){
      const next=new Map();
      for(const b of state.bodies){
        if(orbitOpacityFor(b)<=0)continue;const o=osculatingElements(b);if(!o)continue;
        next.set(b.id,{a:o.aAU,e:o.e,i:o.inclinationDeg,O:o.OmegaDeg,w:o.omegaDeg,ref:orbitReferenceKey(b)});
      }
      state.orbitSignatureCache=next;
    }
    function angleDeltaDeg(a,b){let d=Math.abs((a||0)-(b||0))%360;return d>180?360-d:d}
    function dynamicOrbitNeedsRedraw(){
      const next=new Map();let changed=state.orbitSignatureCache.size===0;
      for(const b of state.bodies){
        if(orbitOpacityFor(b)<=0)continue;const o=osculatingElements(b);if(!o)continue;
        const s={a:o.aAU,e:o.e,i:o.inclinationDeg,O:o.OmegaDeg,w:o.omegaDeg,ref:orbitReferenceKey(b)},p=state.orbitSignatureCache.get(b.id);next.set(b.id,s);
        if(!p||p.ref!==s.ref)changed=true;
        else{
          const da=Math.abs((s.a||0)-(p.a||0))/Math.max(1e-9,Math.abs(p.a||s.a||1));
          if(da>1e-3||Math.abs(s.e-p.e)>1e-3||Math.abs(s.i-p.i)>.08||angleDeltaDeg(s.O,p.O)>.25||angleDeltaDeg(s.w,p.w)>.25)changed=true;
        }
      }
      if(next.size!==state.orbitSignatureCache.size)changed=true;
      if(changed)state.orbitSignatureCache=next;
      return changed;
    }
    function maybeUpdateDynamicOrbits(now){
      if(!state.showOrbits||state.orbitGeometryMode==="initial")return;
      const interval=perfMonitor.quality==="economy"?500:perfMonitor.quality==="high"?180:300;
      if(now-state.lastDynamicOrbitDraw<interval)return;
      state.lastDynamicOrbitDraw=now;
      if(dynamicOrbitNeedsRedraw())updateOrbits();
    }
    function updateOrbits(){
      orbitGroup.clear();if(!state.showOrbits)return;const disp=computeDisplayPositions(),mode=state.orbitGeometryMode||"osculating";
      for(const b of state.bodies){
        const opacity=orbitOpacityFor(b);if(opacity<=0)continue;
        const initial=b._initialOrbitSpec||initialOrbitSpec(b);
        if(mode==="initial"||mode==="both"){
          const ipd=orbitSpecReferenceDisplay(initial,disp);
          if(initial.trajectoryMode==="cartesian"&&initial.flybySpec)addOrbitLine(b,initial,ipd,opacity,"initial");
          else if(initial.a>0)addOrbitLine(b,initial,ipd,opacity,"initial");
        }
        if(mode==="osculating"||mode==="both"){
          const current=currentOsculatingSpec(b),pd=displayOrbitalReference(b,disp);
          if(current&&pd)addOrbitLine(b,current,pd,opacity,"current");
          else if(b.trajectoryMode==="cartesian"&&b.flybySpec&&pd)addOrbitLine(b,{...b,flybySpec:b.flybySpec,parentId:b.parent,trajectoryMode:"cartesian"},pd,opacity,"current");
        }
        // Historical incoming hyperbola remains available after a materialized capture.
        if(b.initialFlybySpec&&b.trajectoryMode==="orbital"&&b.initialFlybyParentId&&mode==="osculating"){
          const ip=state.bodies.find(x=>x.id===b.initialFlybyParentId),ipd=ip?disp.get(ip.id):null;if(ip&&ipd){
            const mu0=G*(massSolar(ip)+massSolar(b)),isc=relativeVisualScale({parent:ip.id,a:Math.max(b.initialFlybySpec.rpAU||1,1e-6),kind:b.kind}),ipts=window.SystemForgeCore.EncounterPhysics.conicPoints(b.initialFlybySpec,mu0,260).map(p=>new THREE.Vector3(...p).multiplyScalar(isc));
            if(ipts.length>1){const il=new THREE.Line(new THREE.BufferGeometry().setFromPoints(ipts),new THREE.LineBasicMaterial({color:0x71879b,transparent:true,opacity:.10,depthWrite:false}));il.position.copy(ipd);il.userData.initialTrajectory=true;il.userData.parentId=ip.id;orbitGroup.add(il)}
          }
        }
      }
      refreshOrbitSignatureCache();
    }

    function updateOrbitCenters(disp){
      for(const line of orbitGroup.children){
        if(line.userData.referenceId){const ref=referenceById(line.userData.referenceId);if(ref)line.position.copy(referenceDisplayPosition(ref))}
        else if(Array.isArray(line.userData.referenceIds)&&line.userData.referenceIds.length){
          let M=0,p=new THREE.Vector3();
          for(const id of line.userData.referenceIds){const b=state.bodies.find(x=>x.id===id),d=disp.get(id);if(!b||!d)continue;const mm=massSolar(b);M+=mm;p.addScaledVector(d,mm)}
          if(M)line.position.copy(p.multiplyScalar(1/M));
        }else{const p=disp.get(line.userData.parentId);if(p)line.position.copy(p)}
      }
      for(const ring of overlayGroup.children){
        if(ring.userData.starId==="__bary__")ring.position.copy(barycenterDisplay());
        else {const p=disp.get(ring.userData.starId);if(p)ring.position.copy(p)}
      }
    }
    return {updateOrbits,maybeUpdateDynamicOrbits,updateOrbitCenters,refreshOrbitSignatureCache};
  }
  ns.createOrbitLayer=createOrbitLayer;
})(window);
