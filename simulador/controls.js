import { wrap360 } from './utils.js';

export class Controls {
  constructor(viewer, aircraft) {
    this.viewer = viewer; this.aircraft = aircraft;

    // Teclado/ratón/cámara
    this.keys = {}; this.isDragging=false; this.dragStart={x:0,y:0};
    this.orbitAngles = { yaw: -Math.PI/2, pitch: 0.2 };
    this.orbitRadius = 25;

    // AP/HDG
    this.autopilot=false; this.autopilotHeading=0; this.autopilotAltitude=0; this.autopilotThrottle=0; this.apPhase="LEVEL"; this.apHdgInt=0; this.apAltInt=0;
    this.hdgHold=false; this.hdgBugDeg=0; this.autoLevel=false;
    this.autopilotSpeed=0;
    this.apSpdInt=0;

    // Giroscopio
    this.useGyro=false; this.gyroOffset={alpha:0,beta:0,gamma:0}; this.gyroAngles={roll:0,pitch:0,yaw:0}; this.lastEvent={alpha:0,beta:0,gamma:0};

    this.initKeyboard(); this.initMouse(); this.initMobile();
  }

  initKeyboard(){
    window.addEventListener('keydown',(e)=>{
      this.keys[e.code]=true;

      if (e.code==='Space') this.aircraft.shootProjectile();                 // Disparo
      if (e.code==='KeyF') this.aircraft.sim.afterburner=!this.aircraft.sim.afterburner; // AB
      if (e.code==='Enter'){ this.autoLevel=false; this.aircraft.resetControls(); console.log('[CTRL] Timones a 0. AutoLevel OFF.'); }

      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyQ","KeyE"].includes(e.code)) this.autoLevel=false;

      if (e.code==='KeyA') this.toggleAutopilot();

      if (e.code==='KeyH') { // HDG HOLD
        this.hdgBugDeg = this.aircraft.getCompassHeading();
        this.hdgHold=!this.hdgHold;
        console.log('HDG Hold', this.hdgHold?'ON':'OFF', this.hdgBugDeg.toFixed(0));
      }
      if (e.code==='BracketLeft')  this.hdgBugDeg=wrap360(this.hdgBugDeg-(e.shiftKey?10:1));
      if (e.code==='BracketRight') this.hdgBugDeg=wrap360(this.hdgBugDeg+(e.shiftKey?10:1));
    });

    window.addEventListener('keyup',(e)=>{ if (this.keys[e.code]) this.keys[e.code]=false; });
  }

  initMouse(){
    const handler=new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    handler.setInputAction((evt)=>{ this.isDragging=true; this.dragStart.x=evt.position.x; this.dragStart.y=evt.position.y; }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(()=>{ this.isDragging=false; }, Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction((evt)=>{
      if(!this.isDragging) return;
      const dx=evt.startPosition.x-evt.endPosition.x;
      const dy=evt.startPosition.y-evt.endPosition.y;
      this.orbitAngles.yaw-=dx*0.005;
      this.orbitAngles.pitch+=dy*0.005;
      this.orbitAngles.pitch=Cesium.Math.clamp(this.orbitAngles.pitch,-Math.PI/2+0.1,Math.PI/2-0.1);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.viewer.scene.canvas.addEventListener('wheel',(e)=>{
      this.orbitRadius+=e.deltaY*0.1;
      this.orbitRadius=Cesium.Math.clamp(this.orbitRadius,5,100);
      e.preventDefault();
    }, {passive:false});
  }

  initMobile(){
    const isMobile=/Mobi|Android|iPhone|iPad|Tablet/.test(navigator.userAgent);
    if (isMobile){
      document.getElementById('mobileControls').style.display='flex';
      document.getElementById('throttleSlider').style.display='block';
    }

    if (window.DeviceOrientationEvent){
      const needPerm = (typeof DeviceOrientationEvent.requestPermission === 'function');
      const enableGyro = ()=>{ this.useGyro = isMobile; };

      window.addEventListener('deviceorientation',(e)=>{
        if (!this.useGyro) return;
        if (e.alpha==null) return;
        this.lastEvent={alpha:e.alpha,beta:e.beta,gamma:e.gamma};
        const a=e.alpha-this.gyroOffset.alpha;
        const b=e.beta -this.gyroOffset.beta;
        const g=e.gamma-this.gyroOffset.gamma;
        this.gyroAngles.yaw  = Cesium.Math.toRadians(a*0.4);
        this.gyroAngles.pitch= Cesium.Math.toRadians(g*0.6);
        this.gyroAngles.roll = Cesium.Math.toRadians(b*0.6);
      });

      const btn=document.getElementById('btnResetGyro');
      btn.addEventListener('click', async ()=>{
        if (needPerm){
          try{
            const r=await DeviceOrientationEvent.requestPermission();
            if (r==='granted') enableGyro();
          }catch{}
        } else { enableGyro(); }
        this.gyroOffset = { ...this.lastEvent };
        this.aircraft.resetControls();
        console.log('🔄 Giroscopio reiniciado');
      });
    }

    document.getElementById('btnFullscreen').addEventListener('click',()=>{
      const el=document.documentElement; if(!document.fullscreenElement) el.requestFullscreen(); else document.exitFullscreen();
    });

    document.getElementById('throttleSlider').addEventListener('input',(e)=>{
      this.aircraft.sim.throttle = e.target.value/100;
    });

    document.getElementById('btnShoot').addEventListener('click',()=> this.aircraft.shootProjectile());
  }

  toggleAutopilot(){
    this.autopilot=!this.autopilot;
    if (this.autopilot){
      const s=this.aircraft.computeFrameState();
      this.autopilotAltitude=s.carto.height;
      // << CORRECCIÓN: Guardar el RUMBO DE BRÚJULA (0-360 deg)
      this.autopilotHeading = this.aircraft.getCompassHeading();
      this.autopilotSpeed=s.speed;
      this.apPhase='LEVEL'; 
      this.apHdgInt=0; 
      this.apSpdInt=0;
      console.log('Autopilot: ON');
    } else {
      this.apHdgInt=0; this.apSpdInt=0; this.apPhase='LEVEL';
      console.log('Autopilot: OFF');
    }
  }

  getInputs(){ return { keys:this.keys, useGyro:this.useGyro, gyroAngles:this.gyroAngles, autoLevel:this.autoLevel }; }
}
