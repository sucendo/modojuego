(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  function createTrajectoryLayer(ctx={}){
    const {THREE,state,trailGroup,referenceById,referencePhysicalState,orbitalReferenceAt,parentOf,osculatingElements,period,categoryVisible,sameOrbitFamily,computeDisplayPositions,referenceDisplayPosition,relativeVisualScale,colorFor,perfMonitor}=ctx;
    function trailReferenceSnapshot(b){
      if(b.orbitReferenceId){
        const ref=referenceById(b.orbitReferenceId),rs=referencePhysicalState(ref);
        if(rs)return {key:`ref:${b.orbitReferenceId}`,pos:rs.pos.clone(),vel:rs.vel?.clone?.()||new THREE.Vector3(),parentId:null,referenceId:b.orbitReferenceId};
      }
      if(Array.isArray(b.orbitCenterIds)&&b.orbitCenterIds.length){
        const rs=orbitalReferenceAt(b,null);
        if(rs)return {key:`bary:${[...b.orbitCenterIds].sort().join("|")}`,pos:rs.pos.clone(),vel:rs.vel?.clone?.()||new THREE.Vector3(),parentId:null,referenceIds:[...b.orbitCenterIds]};
      }
      const p=parentOf(b);if(p)return {key:`parent:${p.id}`,pos:p.pos.clone(),vel:p.vel.clone(),parentId:p.id};
      return {key:"root",pos:new THREE.Vector3(),vel:new THREE.Vector3(),parentId:null};
    }
    function relativeKinematics(b){
      const ref=trailReferenceSnapshot(b),r=b.pos.clone().sub(ref.pos),v=b.vel.clone().sub(ref.vel||new THREE.Vector3()),radius=r.length(),speed=v.length();
      const angularSpeed=radius>1e-12?r.clone().cross(v).length()/(radius*radius):0;
      return {radius,speed,angularSpeed};
    }
    function trailSampleIntervalYears(b){
      const o=osculatingElements(b),P=o?.periodYears||period(b),k=relativeKinematics(b);let interval=Infinity;
      if(P&&Number.isFinite(P)&&P>0)interval=Math.min(interval,P/220);
      if(k.radius>1e-12&&k.speed>1e-12)interval=Math.min(interval,(2*Math.PI/220)*(k.radius/k.speed));
      if(k.angularSpeed>1e-12)interval=Math.min(interval,(2*Math.PI/220)/k.angularSpeed);
      if(b.encounterRole&&b.encounterRole!=="")interval=Math.min(interval,.002);
      if(!Number.isFinite(interval))interval=.05;
      // Storage cadence follows simulation speed as well: never attempt to store more
      // samples per real second than the renderer can use, while preserving extra detail
      // for the selected body.
      const yps=Math.abs(Number(state._lastYps)||0),targetHz=b.id===state.selected?50:28;
      if(yps>0)interval=Math.max(interval,yps/targetHz);
      return Math.max(1/(365.25*24*60),Math.min(20,interval));
    }
    function sampleRealTrails(force=false){
      let added=false;
      for(const b of state.bodies){
        if(b.kind==="structure")continue;
        const interval=trailSampleIntervalYears(b),last=b._trailLastT;
        if(!force&&last!=null&&Math.abs(state.t-last)<interval)continue;
        const ref=trailReferenceSnapshot(b),sample={t:state.t,pos:b.pos.toArray(),refPos:ref.pos.toArray(),refKey:ref.key,parentId:ref.parentId||null,referenceId:ref.referenceId||null,referenceIds:ref.referenceIds||null};
        b.trail.push(sample);b._trailLastT=state.t;
        const max=Math.max(100,Math.min(2400,state.trailMaxPoints||600));if(b.trail.length>max)b.trail.splice(0,b.trail.length-max);
        added=true;
      }
      if(added)state.trailRevision++;
    }
    function trailVisibleFor(b){
      if(!categoryVisible(b)||b.kind==="structure")return false;
      const mode=state.trailMode||"selected";
      if(mode==="none")return false;
      if(mode==="all")return true;
      if(mode==="selected")return b.id===state.selected;
      const sel=state.bodies.find(x=>x.id===state.selected);
      if(!sel)return b.kind==="planet"||b.kind==="star";
      return b.id===sel.id||b.parent===sel.id||sel.parent===b.id||sameOrbitFamily(b,sel);
    }
    function trailAnchorForSegment(seg,disp){
      const first=seg[0];if(!first)return {display:new THREE.Vector3(),scale:1,key:"root"};
      if(first.refKey==="root")return {display:new THREE.Vector3(),scale:1,key:"root"};
      if(first.referenceId){
        const ref=referenceById(first.referenceId),p=ref?referenceDisplayPosition(ref):null;
        return {display:p||new THREE.Vector3(),scale:null,key:first.refKey};
      }
      if(first.parentId){
        const p=state.bodies.find(x=>x.id===first.parentId),pd=p?disp.get(p.id):null;
        const radii=seg.map(s=>Math.hypot(s.pos[0]-s.refPos[0],s.pos[1]-s.refPos[1],s.pos[2]-s.refPos[2])).filter(Number.isFinite).sort((a,b)=>a-b);
        const a=radii.length?radii[Math.floor(radii.length/2)]:1,pseudo={parent:first.parentId,a:Math.max(a,1e-9),kind:state.bodies.find(x=>x.id===seg.bodyId)?.kind||"planet",trajectoryMode:"orbital"};
        return {display:pd||new THREE.Vector3(),scale:p?relativeVisualScale(pseudo):1,key:first.refKey};
      }
      return {display:new THREE.Vector3(),scale:1,key:first.refKey};
    }
    function livePointFor(b,ref,scale){
      if(ref.key==="root")return b.pos.clone();
      return b.pos.clone().sub(ref.pos).multiplyScalar(scale);
    }
    function updateTrails(){
      trailGroup.clear();state.lastTrailDrawRevision=state.trailRevision;
      if(state.trailMode==="none")return;
      const disp=computeDisplayPositions();
      for(const b of state.bodies){
        if(!trailVisibleFor(b)||!Array.isArray(b.trail)||b.trail.length<1)continue;
        const segments=[];let cur=[];
        for(const s of b.trail){
          if(cur.length&&cur[cur.length-1].refKey!==s.refKey){segments.push(cur);cur=[]}
          cur.push(s);
        }if(cur.length)segments.push(cur);
        for(let segIndex=0;segIndex<segments.length;segIndex++){
          const seg=segments[segIndex];if(!seg.length)continue;seg.bodyId=b.id;
          const anchor=trailAnchorForSegment(seg,disp),sc=anchor.scale??relativeVisualScale(b),pts=[];
          for(const s of seg){
            if(s.refKey==="root")pts.push(new THREE.Vector3(...s.pos));
            else pts.push(new THREE.Vector3(s.pos[0]-s.refPos[0],s.pos[1]-s.refPos[1],s.pos[2]-s.refPos[2]).multiplyScalar(sc));
          }
          // The stored history can use a sparse cadence, but the rendered endpoint is
          // always the body's current physical state. This prevents a visibly detached
          // trail at high simulation speeds.
          if(segIndex===segments.length-1){
            const refNow=trailReferenceSnapshot(b);
            if(refNow.key===seg[seg.length-1].refKey){
              const live=livePointFor(b,refNow,sc),last=pts[pts.length-1];
              if(!last||last.distanceToSquared(live)>1e-18)pts.push(live);
            }
          }
          if(pts.length<2)continue;
          const opacity=b.id===state.selected?.75:(state.trailMode==="all"?.18:.32),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:colorFor(b),transparent:true,opacity,depthWrite:false}));
          line.position.copy(anchor.display);line.userData.trail=true;line.userData.refKey=seg[0].refKey;line.userData.parentId=seg[0].parentId||null;line.userData.referenceId=seg[0].referenceId||null;trailGroup.add(line);
        }
      }
    }
    function updateTrailCenters(disp){
      for(const line of trailGroup.children){
        if(line.userData.refKey==="root"){line.position.set(0,0,0);continue}
        if(line.userData.referenceId){const ref=referenceById(line.userData.referenceId);if(ref)line.position.copy(referenceDisplayPosition(ref));continue}
        if(line.userData.parentId){const p=disp.get(line.userData.parentId);if(p)line.position.copy(p)}
      }
    }
    function maxVisiblePhaseRatePerSecond(){
      const yps=Math.abs(Number(state._lastYps)||0);if(!yps)return 0;let max=0;
      for(const b of state.bodies){if(!trailVisibleFor(b))continue;const k=relativeKinematics(b);if(Number.isFinite(k.angularSpeed))max=Math.max(max,k.angularSpeed*yps)}
      return max;
    }
    function adaptiveDrawIntervalMs(){
      const quality=perfMonitor.quality,base=quality==="economy"?450:quality==="high"?150:260,min=quality==="economy"?40:quality==="high"?16:24,phaseRate=maxVisiblePhaseRatePerSecond();
      if(!(phaseRate>0))return base;
      // Aim for no more than ~1.5 degrees of orbital phase between trajectory redraws.
      const motionLimited=1000*(Math.PI/120)/phaseRate;
      return Math.max(min,Math.min(base,motionLimited));
    }
    function maybeUpdateTrails(now){
      if(state.trailMode==="none")return;
      const revisionChanged=state.lastTrailDrawRevision!==state.trailRevision;
      if(!state.running&&!revisionChanged)return;
      const interval=adaptiveDrawIntervalMs();
      if(revisionChanged||!state._lastTrailUiDraw||now-state._lastTrailUiDraw>=interval){state._lastTrailUiDraw=now;updateTrails()}
    }

    return {sampleRealTrails,updateTrails,updateTrailCenters,maybeUpdateTrails,trailSampleIntervalYears,adaptiveDrawIntervalMs};
  }
  ns.createTrajectoryLayer=createTrajectoryLayer;
})(window);
