(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
class PerformanceMonitor{
  constructor(){
    this.mode="auto";this.quality="normal";
    this.frames=0;this.steps=0;this.lastSample=performance.now();
    this.fps=60;this.stepsPerSecond=0;
    this.frameEMA=16.7;this.physicsEMA=0;this.structuresEMA=0;this.renderEMA=0;
  }
  ema(oldV,newV,a=.12){return oldV+(newV-oldV)*a}
  recordFrame(frameMs,physicsMs,structuresMs,renderMs,steps){
    this.frameEMA=this.ema(this.frameEMA,frameMs,.10);
    this.physicsEMA=this.ema(this.physicsEMA,physicsMs,.12);
    this.structuresEMA=this.ema(this.structuresEMA,structuresMs,.12);
    this.renderEMA=this.ema(this.renderEMA,renderMs,.12);
    this.frames++;this.steps+=steps||0;
    const now=performance.now(),elapsed=now-this.lastSample;
    if(elapsed>=600){
      this.fps=this.frames*1000/elapsed;this.stepsPerSecond=this.steps*1000/elapsed;
      this.frames=0;this.steps=0;this.lastSample=now;
      if(this.mode==="auto"){
        if(this.quality==="high"){
          if(this.fps<47)this.quality="normal";
        }else if(this.quality==="economy"){
          if(this.fps>45)this.quality="normal";
        }else{
          if(this.fps<36)this.quality="economy";
          else if(this.fps>58)this.quality="high";
          else this.quality="normal";
        }
      }else this.quality=this.mode;
    }
  }
  structureIntervalMs(isMobile){
    if(this.quality==="economy")return isMobile?140:100;
    if(this.quality==="high")return isMobile?70:45;
    return isMobile?90:60;
  }
  pixelRatioCap(){
    if(this.quality==="economy")return 1.25;
    if(this.quality==="high")return 2;
    return 1.6;
  }
  snapshot(){
    return {
      mode:this.mode,quality:this.quality,fps:this.fps,frameMs:this.frameEMA,
      physicsMs:this.physicsEMA,structuresMs:this.structuresEMA,renderMs:this.renderEMA,
      nbodyStepsPerSecond:this.stepsPerSecond
    };
  }
}
core.PerformanceMonitor=PerformanceMonitor;
})();