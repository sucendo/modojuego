(function(root){
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class SimpleOrbitControls{
    constructor(THREE,camera,dom){
      this.THREE=THREE;this.camera=camera;this.dom=dom;this.target=new THREE.Vector3();this.enabled=true;
      this.rotateSpeed=.005;this.zoomSpeed=.0014;this.minDistance=1e-7;this.maxDistance=1e7;
      this._drag=false;this._lastX=0;this._lastY=0;this._spherical=new THREE.Spherical();this._pointers=new Map();this._pinchDistance=null;this._lastGestureAt=0;this._gestureMoved=false;
      this._syncFromCamera();
      dom.addEventListener("pointerdown",e=>{if(e.button!==0&&e.pointerType!=="touch")return;this._pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this._gestureMoved=false;try{dom.setPointerCapture?.(e.pointerId)}catch{}if(this._pointers.size===1){this._drag=true;this._lastX=e.clientX;this._lastY=e.clientY;this._pinchDistance=null}else if(this._pointers.size>=2){this._drag=false;this._pinchDistance=this._currentPinchDistance();this._lastGestureAt=performance.now()}});
      dom.addEventListener("pointermove",e=>{if(!this.enabled||!this._pointers.has(e.pointerId))return;this._pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this._pointers.size>=2){const d=this._currentPinchDistance();if(this._pinchDistance&&d>0){const factor=this._pinchDistance/d;if(Math.abs(1-factor)>.002){this._spherical.radius=Math.max(this.minDistance,Math.min(this.maxDistance,this._spherical.radius*factor));this._apply();this._gestureMoved=true}}this._pinchDistance=d;this._lastGestureAt=performance.now();return}if(!this._drag)return;const dx=e.clientX-this._lastX,dy=e.clientY-this._lastY;this._lastX=e.clientX;this._lastY=e.clientY;if(Math.abs(dx)+Math.abs(dy)>1)this._gestureMoved=true;this._spherical.theta-=dx*this.rotateSpeed;this._spherical.phi-=dy*this.rotateSpeed;this._spherical.phi=Math.max(.02,Math.min(Math.PI-.02,this._spherical.phi));this._apply();if(this._gestureMoved)this._lastGestureAt=performance.now()});
      const stop=e=>{this._pointers.delete(e.pointerId);try{dom.releasePointerCapture?.(e.pointerId)}catch{}if(this._pointers.size===1){const p=[...this._pointers.values()][0];this._drag=true;this._lastX=p.x;this._lastY=p.y;this._pinchDistance=null}else if(!this._pointers.size){this._drag=false;this._pinchDistance=null;if(this._gestureMoved)this._lastGestureAt=performance.now()}};
      dom.addEventListener("pointerup",stop);dom.addEventListener("pointercancel",stop);dom.addEventListener("wheel",e=>{if(!this.enabled)return;e.preventDefault();this.zoomBy(Math.exp(e.deltaY*this.zoomSpeed))},{passive:false});
    }
    _currentPinchDistance(){const p=[...this._pointers.values()];return p.length<2?null:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}
    _syncFromCamera(){const offset=this.camera.position.clone().sub(this.target);this._spherical.setFromVector3(offset)}
    _apply(){const offset=new this.THREE.Vector3().setFromSpherical(this._spherical);this.camera.position.copy(this.target).add(offset);this.camera.lookAt(this.target)}
    update(){this._syncFromCamera();this.camera.lookAt(this.target)}
    zoomBy(factor){this._syncFromCamera();this._spherical.radius=Math.max(this.minDistance,Math.min(this.maxDistance,this._spherical.radius*factor));this._apply();this._lastGestureAt=performance.now()}
    wasGestureRecently(ms=220){return performance.now()-this._lastGestureAt<ms}
  }
  ns.SimpleOrbitControls=SimpleOrbitControls;
})(window);
