(function(root){
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class MarkerLayer{
    constructor({state,camera,canvas,getLayer,getPreferences,getScale,currentScaleU,resolver}={}){
      this.state=state;this.camera=camera;this.canvas=canvas;this.getLayer=getLayer;this.getPreferences=getPreferences;this.getScale=getScale;this.currentScaleU=currentScaleU;this.resolver=resolver;
    }
    static bodyFadeForDiameter(diameterPx){return diameterPx<=5?1:Math.max(0,1-(diameterPx-5)/6)}
    static ringSize(diameterPx,selected=false){const minRing=selected?21:17,maxRing=selected?42:36;return Math.max(minRing,Math.min(maxRing,diameterPx+10))}
    update(){
      const layer=this.getLayer?.();if(!layer)return 0;
      const prefs=this.getPreferences?.()||{},u=Number(this.getScale?.())||0,active=!!prefs.showTrueScaleMarkers&&u<this.currentScaleU-.001,scaleFade=active?Math.max(0,1-u/this.currentScaleU):0,rect=this.canvas.getBoundingClientRect(),h=Math.max(1,rect.height),fovRad=this.camera.fov*Math.PI/180,candidates=[];
      for(const b of this.state.bodies||[]){
        const mark=b.positionMarker;if(!mark||!b.mesh)continue;mark.style.display="none";mark.tabIndex=-1;
        const p=b.mesh.position.clone().project(this.camera),d=Math.max(this.camera.position.distanceTo(b.mesh.position),1e-12),worldPerPixel=2*d*Math.tan(fovRad/2)/h,apparentRadiusPx=Math.max(0,(Number(b.mesh.scale.x)||0)/Math.max(worldPerPixel,1e-16)),diameterPx=apparentRadiusPx*2;
        const bodyFade=MarkerLayer.bodyFadeForDiameter(diameterPx),eligible=active&&bodyFade>0&&this.resolver.markerCategoryVisible(b)&&p.z>-1&&p.z<1&&Math.abs(p.x)<1.12&&Math.abs(p.y)<1.12;
        if(!eligible)continue;
        const selected=b.id===this.state.selected,ringPx=MarkerLayer.ringSize(diameterPx,selected),x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height,r=ringPx/2;
        candidates.push({b,mark,x,y,ringPx,bodyFade,selected,priority:this.resolver.priority(b),box:{l:x-r,r:x+r,t:y-r,b:y+r}});
      }
      candidates.sort((a,b)=>b.priority-a.priority);
      const accepted=[];
      for(const c of candidates){
        const collision=accepted.some(a=>this.resolver.boxesOverlap(c.box,a.box,2));
        if(collision&&!c.selected)continue;
        const {b,mark,x,y,ringPx,bodyFade,selected}=c;
        mark.style.display="block";mark.style.left=`${x}px`;mark.style.top=`${y}px`;mark.style.width=`${ringPx}px`;mark.style.height=`${ringPx}px`;mark.style.opacity=String(scaleFade*bodyFade);mark.classList.toggle("selected",selected);mark.style.color=b.color||"#8ed0ff";mark.style.borderColor="currentColor";mark.tabIndex=0;accepted.push(c);
      }
      return accepted.length;
    }
  }
  ns.MarkerLayer=MarkerLayer;
})(window);
