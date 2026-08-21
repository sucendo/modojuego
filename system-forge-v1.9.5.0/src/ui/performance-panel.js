(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
class PerformancePanelController{
  constructor(ids={}){this.ids={badge:"perfBadge",panel:"perfPanel",fps:"perfFps",frame:"perfFrame",physics:"perfPhysics",structures:"perfStructures",render:"perfRender",steps:"perfSteps",quality:"perfQuality",...ids};this.visible=true;this.lastDraw=0;this.lastQuality=null}
  el(key){return document.getElementById(this.ids[key])}
  setVisible(on){this.visible=!!on;const b=this.el("badge"),p=this.el("panel");b?.classList.toggle("uiHidden",!this.visible);if(!this.visible)p?.classList.remove("open");return this.visible}
  toggle(){if(!this.visible)return false;this.el("panel")?.classList.toggle("open");return true}
  update(now,snapshot){if(!this.visible||!snapshot||now-this.lastDraw<500)return {drawn:false,qualityChanged:false};this.lastDraw=now;const fps=Number.isFinite(snapshot.fps)?snapshot.fps:0,b=this.el("badge");if(b){b.textContent=`${Math.round(fps)} FPS`;b.classList.remove("good","warn","bad");b.classList.add(fps>=50?"good":fps>=35?"warn":"bad")}
    const put=(k,v)=>{const n=this.el(k);if(n)n.textContent=v};put("fps",fps.toFixed(0));put("frame",`${snapshot.frameMs.toFixed(1)} ms`);put("physics",`${snapshot.physicsMs.toFixed(2)} ms`);put("structures",`${snapshot.structuresMs.toFixed(2)} ms`);put("render",`${snapshot.renderMs.toFixed(2)} ms`);put("steps",Math.round(snapshot.nbodyStepsPerSecond).toLocaleString("es-ES"));put("quality",`Calidad visual: ${snapshot.quality} · modo ${snapshot.mode}`);
    const changed=this.lastQuality!==null&&snapshot.quality!==this.lastQuality;this.lastQuality=snapshot.quality;return {drawn:true,qualityChanged:changed}
  }
}
core.PerformancePanelController=PerformancePanelController;
})();
