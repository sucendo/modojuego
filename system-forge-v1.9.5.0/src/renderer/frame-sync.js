(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class FrameSynchronizer{
    constructor({camera,markerLayer,labelLayer,updateBarycenterMarker,updateMeasurement}={}){
      Object.assign(this,{camera,markerLayer,labelLayer,updateBarycenterMarker,updateMeasurement});
    }
    syncScreenOverlays(){
      // Vector3.project(camera) consumes matrixWorldInverse. Camera travel/follow/controls
      // may have changed the camera earlier in this same frame, so force the matrix to
      // represent the exact camera pose that the WebGL renderer is about to use.
      this.camera?.updateMatrixWorld?.(true);
      this.updateMeasurement?.();
      const markers=this.markerLayer?.update?.()||0;
      const labels=this.labelLayer?.update?.()||0;
      this.updateBarycenterMarker?.();
      return {markers,labels};
    }
  }
  ns.FrameSynchronizer=FrameSynchronizer;
})(window);
