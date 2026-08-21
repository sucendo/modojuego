(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class LayersController{
    constructor({state,getElement,setLabelCategories,updateStructureVisibility,updateHZ,updateTrails,updateBarycenterMarker,syncVisibilityUI,updateOrbits}={}){Object.assign(this,{state,getElement,setLabelCategories,updateStructureVisibility,updateHZ,updateTrails,updateBarycenterMarker,syncVisibilityUI,updateOrbits})}
    el(id){return this.getElement?.(id)}
    applyViewPreset(mode){
      const s=this.state;
      if(mode==="essential"){
        Object.assign(s,{showStars:true,showPlanets:true,showDwarfPlanets:true,showMoons:true,showMinorBodies:false,showComets:false,showSpacecraft:true,showBelts:false,showRings:true,showOrbits:true,showHZ:false,showBarycenter:false});
        s.orbitMode="context";s.orbitGeometryMode="osculating";s.trailMode="none";this.setLabelCategories(["selected","stars","planets"]);
      }else if(mode==="dynamics"){
        Object.assign(s,{showStars:true,showPlanets:true,showDwarfPlanets:true,showMoons:true,showMinorBodies:true,showComets:true,showSpacecraft:true,showBelts:true,showRings:true,showOrbits:true,showHZ:true,showBarycenter:true});
        s.orbitMode="context";s.orbitGeometryMode="osculating";s.trailMode="selected";this.setLabelCategories(["selected","stars","planets","dwarfs"]);
      }else{
        Object.assign(s,{showStars:true,showPlanets:true,showDwarfPlanets:true,showMoons:true,showMinorBodies:true,showComets:true,showSpacecraft:true,showBelts:true,showRings:true,showOrbits:true,showHZ:true,showBarycenter:true});
        s.orbitMode="all";s.orbitGeometryMode="both";s.trailMode="context";this.setLabelCategories(["selected","stars","planets","dwarfs","moons","minors","comets","spacecraft"]);
      }
      if(this.el("orbitMode"))this.el("orbitMode").value=s.orbitMode;if(this.el("orbitGeometryMode"))this.el("orbitGeometryMode").value=s.orbitGeometryMode;if(this.el("trailMode"))this.el("trailMode").value=s.trailMode;
      this.updateStructureVisibility(true);this.updateHZ();this.updateTrails();this.updateBarycenterMarker();this.syncVisibilityUI();
    }
    toggleVisibilityFlag(key){this.state[key]=!this.state[key];this.updateStructureVisibility(true);if(key==="showHZ")this.updateHZ();if(key==="showBarycenter")this.updateBarycenterMarker()}
    install(){
      const el=id=>this.el(id),s=this.state,bind=(id,fn)=>{const n=el(id);if(n)n.onclick=fn};
      const guideSplitIds=["orbitsSplit","trailsSplit","labelsSplit"];
      for(const id of guideSplitIds){const d=el(id);if(d)d.addEventListener("toggle",()=>{if(!d.open)return;for(const otherId of guideSplitIds){const other=el(otherId);if(other&&other!==d)other.open=false}})}
      document.addEventListener("pointerdown",e=>{if(e.target.closest?.(".guideSplit"))return;for(const id of guideSplitIds){const d=el(id);if(d)d.open=false}});
      bind("hzBtnSide",()=>this.toggleVisibilityFlag("showHZ"));bind("orbitsBtnSide",()=>this.toggleVisibilityFlag("showOrbits"));bind("baryBtnSide",()=>this.toggleVisibilityFlag("showBarycenter"));
      bind("labelsBtnSide",()=>{if(s.showLabels){s._savedLabelCategories=[...s.labelCategories];this.setLabelCategories([])}else this.setLabelCategories(s._savedLabelCategories?.length?s._savedLabelCategories:["selected","stars","planets","dwarfs","moons","minors","comets","spacecraft"])});
      bind("trailsBtnSide",()=>{s.trailMode=s.trailMode==="none"?"selected":"none";if(el("trailMode"))el("trailMode").value=s.trailMode;this.updateTrails();this.syncVisibilityUI()});
      bind("viewEssential",()=>this.applyViewPreset("essential"));bind("viewDynamics",()=>this.applyViewPreset("dynamics"));bind("viewComplete",()=>this.applyViewPreset("complete"));
      for(const [id,key] of [["starsVisibleBtn","showStars"],["planetsVisibleBtn","showPlanets"],["dwarfPlanetsVisibleBtn","showDwarfPlanets"],["moonsVisibleBtn","showMoons"],["minorBodiesBtn","showMinorBodies"],["cometsBtn","showComets"],["spacecraftBtn","showSpacecraft"],["beltsVisibleBtn","showBelts"],["ringsVisibleBtn","showRings"]])bind(id,()=>this.toggleVisibilityFlag(key));
      if(el("orbitMode"))el("orbitMode").onchange=e=>{s.orbitMode=e.target.value;this.updateOrbits();this.updateTrails()};
      if(el("orbitGeometryMode"))el("orbitGeometryMode").onchange=e=>{s.orbitGeometryMode=e.target.value;s.orbitSignatureCache.clear();this.updateOrbits()};
      if(el("trailMode"))el("trailMode").onchange=e=>{s.trailMode=e.target.value;this.updateTrails();this.syncVisibilityUI()};
      if(el("trailLength"))el("trailLength").onchange=e=>{s.trailMaxPoints=parseInt(e.target.value,10)||600;for(const b of s.bodies)if(b.trail?.length>s.trailMaxPoints)b.trail.splice(0,b.trail.length-s.trailMaxPoints);s.trailRevision++;this.updateTrails()};
    }
  }
  ns.LayersController=LayersController;
})(window);
