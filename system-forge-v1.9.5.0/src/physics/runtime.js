(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class SimulationRuntime{
    constructor(ctx={}){Object.assign(this,ctx);this.prev=performance.now();this.lastAnalysisDraw=0;this.lastHudDraw=0;this.running=false;this._loop=this.loop.bind(this)}
    static describeMode({mode="full",hasVisitor=false,limited=false,approximate=false}={}){if(mode==="reduced")return `${hasVisitor?"Encuentro N-body planetario":"N-body planetario rápido · lunas orbitales"}${limited?" · limitado":""}`;if(mode==="kepler")return "Kepler osculante · sin perturbaciones";return approximate?"N-body completo · tras avance aproximado":"N-body completo"}
    start(){if(this.running)return;this.running=true;this.prev=performance.now();requestAnimationFrame(this._loop)}
    stop(){this.running=false}
    updatePerformanceUI(now){const result=this.performancePanel.update(now,this.perfMonitor.snapshot());if(result.qualityChanged)this.resize()}
    loop(now){
      if(!this.running)return;
      const {state,el,fastTimeController,nbodyIntegrator,trajectoryLayer,orbitLayer}=this;
      const frameStart=performance.now(),dtReal=Math.min(.05,(now-this.prev)/1000);this.prev=now;
      const yps=fastTimeController.speedYearsPerSecond();state._lastYps=yps;state._lastRealFrameDelta=dtReal;el("speedLabel").textContent=fastTimeController.formatTimeScale(yps);
      const hasVisitor=fastTimeController.activeVisitors().length>0,nextMode=fastTimeController.selectIntegrationMode(yps,now),prevMode=state.timeIntegrationMode||"full";
      if(prevMode==="kepler"&&nextMode!=="kepler"&&state.fastPreview)fastTimeController.commitKeplerPreview();
      if(prevMode==="reduced"&&nextMode!=="reduced")fastTimeController.endReducedFastMode();
      if(nextMode==="reduced"&&prevMode!=="reduced")fastTimeController.beginReducedFastMode();
      if(nextMode==="kepler"&&prevMode!=="kepler")fastTimeController.beginKeplerPreview();
      state.timeIntegrationMode=nextMode;state.fastPreview=nextMode==="kepler";state.encounterFastMode=nextMode==="reduced";
      el("speedMode").textContent=SimulationRuntime.describeMode({mode:nextMode,hasVisitor,limited:state.encounterSpeedLimited,approximate:state.approximateAdvanceUsed});
      el("speedMode").style.color=(state.fastPreview||state.encounterFastMode||state.approximateAdvanceUsed)?"var(--warn)":"var(--muted)";
      let stepsThisFrame=0,simDeltaThisFrame=0;
      const physicsStart=performance.now();
      if(state.running&&state.bodies.length){
        const simT0=state.t,simYears=dtReal*yps;
        if(state.encounterFastMode){const rr=fastTimeController.encounterFastAdvance(simYears);stepsThisFrame=rr.steps}
        else if(state.fastPreview)fastTimeController.updateKeplerPreview(simYears);
        else{state.encounterSpeedLimited=false;const maxStep=fastTimeController.adaptiveMaxStep(),n=Math.max(1,Math.ceil(simYears/maxStep)),h=simYears/n;stepsThisFrame=n;for(let k=0;k<n;k++)nbodyIntegrator.step(h)}
        simDeltaThisFrame=state.t-simT0;state._lastPhysicalDeltaYears=simDeltaThisFrame;if(!state.fastPreview){if(!state.encounterFastMode)trajectoryLayer.sampleRealTrails();this.autoActivatePerturbedStructures();this.advanceStructureTracers(simDeltaThisFrame);this.trackClosestApproaches();this.trackExperimentEncounterSeries();this.updateDynamicCaptures(simDeltaThisFrame)}
      }
      const physicsMs=performance.now()-physicsStart;if(stepsThisFrame>0){const sample=physicsMs/stepsThisFrame;if(state.timeIntegrationMode==="full")state.fullStepCostMs=state.fullStepCostMs*.88+sample*.12;else if(state.timeIntegrationMode==="reduced")state.reducedStepCostMs=state.reducedStepCostMs*.88+sample*.12;}
      orbitLayer.maybeUpdateDynamicOrbits(now);trajectoryLayer.maybeUpdateTrails(now);
      const structuresStart=performance.now();this.updateMeshes();this.updateStructureVisualMotion(now);this.controls.update();this.frameSynchronizer?.syncScreenOverlays();const structuresMs=performance.now()-structuresStart;
      const renderStart=performance.now();this.renderer.render(this.scene,this.camera);const renderMs=performance.now()-renderStart;
      const prefs=this.getUIPreferences();if(now-this.lastHudDraw>125){this.lastHudDraw=now;this.updateHUD()}if(prefs.showTemporalAnalysis&&state.analysisPanelOpen&&state.temporalEnabled&&now-this.lastAnalysisDraw>350){this.lastAnalysisDraw=now;this.updateAnalysisUI()}
      const frameMs=performance.now()-frameStart;this.perfMonitor.recordFrame(frameMs,physicsMs,structuresMs,renderMs,stepsThisFrame);this.updatePerformanceUI(now);
      requestAnimationFrame(this._loop)
    }
  }
  ns.SimulationRuntime=SimulationRuntime;
})(window);
