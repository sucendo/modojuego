import { AIRCRAFTS, gravity } from './config.js';
import * as Utils from './utils.js';

export class Aircraft {
  constructor(viewer, effects) {
    this.viewer = viewer;
    this.effects = effects; // <<<<< NUEVO
    this.entity=null; this.projectiles=[];
    const ACTIVE = AIRCRAFTS.F22;

    this.sim = {
      mass: ACTIVE.mass, wingArea: ACTIVE.wingArea, wingSpan: ACTIVE.wingSpan,
      CL0: ACTIVE.CL0, CL_ALPHA: ACTIVE.CL_ALPHA, CD0: ACTIVE.CD0, e_oswald: ACTIVE.e_oswald,
      k_form: ACTIVE.k_form, machDrag: ACTIVE.machDrag,
      maxThrustMIL: ACTIVE.maxThrustMIL, maxThrustAB: ACTIVE.maxThrustAB, maxMach: ACTIVE.maxMach,
      afterburner:false, throttle:0.25, compassOffsetDeg:0, lastRho:1.225, defl:{}
    };

    this.position = Cesium.Cartesian3.fromDegrees(-3.7038, 40.4168, 5000);
    this.orientationQuat = this.initOrientation();
    this.forwardSpeed = 150.0; this.verticalSpeed = 0.0; this.ω = new Cesium.Cartesian3(0,0,0);

    this.δa_current=0; this.δe_current=0; this.δr_current=0;

    this.tmp = { planeVelocity:new Cesium.Cartesian3(), vForward:new Cesium.Cartesian3(), vVert:new Cesium.Cartesian3() };
  }

  initOrientation(){
    const hpr = new Cesium.HeadingPitchRoll(0,0,0);
    return Cesium.Transforms.headingPitchRollQuaternion(this.position, hpr);
  }

  async createModel(){
    this.viewer.entities.removeAll();
    this.entity = this.viewer.entities.add({
      name:'F-22 Raptor',
      position:new Cesium.CallbackProperty(()=>this.position,false),
      orientation:new Cesium.CallbackProperty(()=>this.orientationQuat,false),
      model:{ uri:'models/simulador/f22_model.glb', minimumPixelSize:64, maximumScale:10000, scale:1 }
    });
    this.autocalibrateCompass();
  }

  autocalibrateCompass(){
    const st=this.computeFrameState();
    const hprHdg=Utils.wrap360(Cesium.Math.toDegrees(st.hpr.heading));
    const fwdHdg=Utils.computeCompassFromForward(this.position, st.forward, 0);
    if (Math.abs(Utils.wrap180(hprHdg - fwdHdg)) > 150) {
      this.sim.compassOffsetDeg=180;
      console.log('Compass autocalibrated: +180°');
    }
  }

  getCompassHeading(){
    const st=this.computeFrameState();
    return Utils.computeCompassFromForward(this.position, st.forward, this.sim.compassOffsetDeg);
  }

  resetControls(){
    this.ω=new Cesium.Cartesian3(0,0,0); this.δa_current=0; this.δe_current=0; this.δr_current=0;
  }

  computeFrameState(){
    const rotMatrix = Cesium.Matrix3.fromQuaternion(this.orientationQuat);
    const forward = Cesium.Matrix3.multiplyByVector(rotMatrix, Cesium.Cartesian3.UNIT_X, new Cesium.Cartesian3());
    const right   = Cesium.Matrix3.multiplyByVector(rotMatrix, Cesium.Cartesian3.UNIT_Y, new Cesium.Cartesian3());
    const up      = Cesium.Matrix3.multiplyByVector(rotMatrix, Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());

    const surfaceNormal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(this.position, new Cesium.Cartesian3());
    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.position);
    const hpr = Cesium.HeadingPitchRoll.fromQuaternion(this.orientationQuat);

    const vForward = Cesium.Cartesian3.multiplyByScalar(forward, this.forwardSpeed, this.tmp.vForward);
    const vVert = Cesium.Cartesian3.multiplyByScalar(surfaceNormal, this.verticalSpeed, this.tmp.vVert);
    const planeVelocity = Cesium.Cartesian3.add(vForward, vVert, this.tmp.planeVelocity);

    const speed = Cesium.Cartesian3.magnitude(planeVelocity);
    const angularVel = Cesium.Cartesian3.clone(this.ω);

    return { rotMatrix, forward, right, up, surfaceNormal, carto, hpr,
             planeVelocity, speed, angularVel, position:this.position,
             verticalSpeed:this.verticalSpeed };
  }

  updatePosition(dt, forward, surfaceNormal){
    const stepF = Cesium.Cartesian3.multiplyByScalar(forward, this.forwardSpeed*dt, new Cesium.Cartesian3());
    const stepV = Cesium.Cartesian3.multiplyByScalar(surfaceNormal, this.verticalSpeed*dt, new Cesium.Cartesian3());
    this.position = Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.add(stepF, stepV, new Cesium.Cartesian3()), this.position);
  }

  updateCamera(state, orbitAngles, orbitRadius){
    const { rotMatrix, position } = state;
    const center = Cesium.Cartesian3.clone(position);
    const localOffset = new Cesium.Cartesian3(
      orbitRadius*Math.cos(orbitAngles.pitch)*Math.sin(orbitAngles.yaw),
      orbitRadius*Math.cos(orbitAngles.pitch)*Math.cos(orbitAngles.yaw),
      orbitRadius*Math.sin(orbitAngles.pitch)
    );
    const offset = Cesium.Matrix3.multiplyByVector(rotMatrix, localOffset, new Cesium.Cartesian3());
    const cameraPos = Cesium.Cartesian3.add(center, offset, new Cesium.Cartesian3());
    const dir = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(center, cameraPos, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    const upVec = Cesium.Matrix3.multiplyByVector(rotMatrix, Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());

    this.viewer.scene.camera.setView({ destination: cameraPos, orientation:{ direction: dir, up: upVec } });
  }

  shootProjectile(){
    if (!this.position || !this.orientationQuat) return;
    const st=this.computeFrameState();

    const muzzleOffset = Cesium.Cartesian3.multiplyByScalar(st.forward, 2.5, new Cesium.Cartesian3());
    const muzzlePosition = Cesium.Cartesian3.add(this.position, muzzleOffset, new Cesium.Cartesian3());
    const downOffset = Cesium.Cartesian3.multiplyByScalar(st.up, -1, new Cesium.Cartesian3());
    const initialPosition = Cesium.Cartesian3.add(muzzlePosition, downOffset, new Cesium.Cartesian3());

    const planeVel = Cesium.Cartesian3.multiplyByScalar(st.forward, this.forwardSpeed, new Cesium.Cartesian3());
    const muzzleVelocity = 1030;
    const push = Cesium.Cartesian3.multiplyByScalar(st.forward, muzzleVelocity, new Cesium.Cartesian3());
    const initialVelocity = Cesium.Cartesian3.add(planeVel, push, new Cesium.Cartesian3());

    let currentPosition = Cesium.Cartesian3.clone(initialPosition);
    const entity = this.viewer.entities.add({
      position:new Cesium.CallbackProperty(()=>currentPosition,false),
      model:{ uri:'models/simulador/silver_projectile.glb', scale:1, minimumPixelSize:1 }
    });

    const viewerRef=this.viewer;
    const effectsRef=this.effects;
    this.projectiles.push({
      entity,
      velocity: Cesium.Cartesian3.clone(initialVelocity),
      impacted:false,
      update: function(dt){
        this.velocity.z -= gravity*dt;
        const step=Cesium.Cartesian3.multiplyByScalar(this.velocity, dt, new Cesium.Cartesian3());
        currentPosition = Cesium.Cartesian3.add(currentPosition, step, new Cesium.Cartesian3());

        const carto=Cesium.Cartographic.fromCartesian(currentPosition);
        const th=viewerRef.scene.globe.getHeight(carto);
        const hit=(typeof th==='number') && (carto.height <= th + 1);

        if (hit && !this.impacted){
          this.impacted=true;
          // Explosión + marca + humo
          try { effectsRef.explosionAt(currentPosition); } catch {}
          viewerRef.entities.remove(entity);
          return false;
        }
        if (Cesium.Cartesian3.distance(currentPosition, initialPosition) > 20000){
          viewerRef.entities.remove(entity);
          return false;
        }
        return true;
      }
    });
  }

  updateProjectiles(dt){
    for (let i=this.projectiles.length-1; i>=0; i--){
      if (!this.projectiles[i].update(dt)) this.projectiles.splice(i,1);
    }
  }
}
