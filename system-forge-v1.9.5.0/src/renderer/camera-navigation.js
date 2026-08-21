(function(root){
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class CameraNavigation{
    constructor({state,camera,controls,getPreferences,referenceById,referenceDisplayPosition,getElement,focusBody,focusReference,focusSystem}={}){
      this.state=state;this.camera=camera;this.controls=controls;this.getPreferences=getPreferences;this.referenceById=referenceById;this.referenceDisplayPosition=referenceDisplayPosition;this.getElement=getElement;this.focusBody=focusBody;this.focusReference=focusReference;this.focusSystem=focusSystem;
    }
    static easing(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
    cancel(){this.state.cameraTravel=null}
    start(target,distance,bodyId=null,referenceId=null){
      const duration=Math.max(.05,Number(this.getPreferences?.()?.cameraTravelDuration)||1.5)*1000,startTarget=this.controls.target.clone(),startPos=this.camera.position.clone(),dir=startPos.clone().sub(startTarget);if(dir.lengthSq()<1e-12)dir.set(0,.5,1);dir.normalize();
      this.state.cameraTravel={started:performance.now(),duration,startTarget,startPos,dir,distance:Math.max(1e-9,distance),bodyId,referenceId,lastTarget:target.clone()};
    }
    travelTarget(disp,travel){if(travel.bodyId)return disp.get(travel.bodyId)||travel.lastTarget;if(travel.referenceId){const ref=this.referenceById?.(travel.referenceId);return ref?this.referenceDisplayPosition?.(ref):travel.lastTarget}return travel.lastTarget}
    updateTravel(disp,now=performance.now()){
      const tr=this.state.cameraTravel;if(!tr)return false;const endTarget=this.travelTarget(disp,tr)?.clone();if(!endTarget){this.cancel();return false}tr.lastTarget.copy(endTarget);
      const endPos=endTarget.clone().addScaledVector(tr.dir,tr.distance),t=Math.max(0,Math.min(1,(now-tr.started)/tr.duration)),e=CameraNavigation.easing(t);
      this.controls.target.lerpVectors(tr.startTarget,endTarget,e);this.camera.position.lerpVectors(tr.startPos,endPos,e);this.camera.lookAt(this.controls.target);
      if(t>=1){this.controls.target.copy(endTarget);this.camera.position.copy(endPos);this.state.focusLast=endTarget.clone();this.state.cameraTravel=null;this.controls.update()}
      return true;
    }
    updateFollow(disp){
      const s=this.state;if(s._suppressCameraFollow||s.cameraTravel||!s.followSelected)return;let target=null;
      if(s.selectedReference){const ref=this.referenceById?.(s.selectedReference);if(ref)target=this.referenceDisplayPosition?.(ref)}else if(s.selected)target=disp.get(s.selected);
      if(!target)return;if(!s.focusLast){s.focusLast=target.clone();this.controls.target.copy(target);return}const delta=target.clone().sub(s.focusLast);this.camera.position.add(delta);this.controls.target.copy(target);s.focusLast.copy(target);
    }
    updateModeUI(){const btn=this.getElement?.("cameraFollowBtn");if(!btn)return;btn.textContent=this.state.followSelected?"Cámara · seguir":"Cámara · libre";btn.classList.toggle("primary",this.state.followSelected);btn.classList.toggle("free",!this.state.followSelected);btn.setAttribute("aria-pressed",this.state.followSelected?"true":"false")}
    setFollow(on){this.cancel();this.state.followSelected=!!on;if(this.state.followSelected){if(this.state.selectedReference)this.focusReference?.(this.state.selectedReference,false,true);else if(this.state.selected)this.focusBody?.(this.state.selected,false,true);else this.state.focusLast=null}else this.state.focusLast=null;this.updateModeUI()}
    centerSelected(reframe=false){this.cancel();if(this.state.selectedReference)this.focusReference?.(this.state.selectedReference,reframe,true);else if(this.state.selected)this.focusBody?.(this.state.selected,reframe,true);else this.focusSystem?.()}
  }
  ns.CameraNavigation=CameraNavigation;
})(window);
