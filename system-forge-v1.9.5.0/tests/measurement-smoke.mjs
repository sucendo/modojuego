import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
class V{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}clone(){return new V(this.x,this.y,this.z)}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}length(){return Math.hypot(this.x,this.y,this.z)}dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}cross(v){return new V(this.y*v.z-this.z*v.y,this.z*v.x-this.x*v.z,this.x*v.y-this.y*v.x)}toArray(){return [this.x,this.y,this.z]}}
global.window={SystemForgeCore:{}};require('../src/analysis/orbital-dynamics.js');require('../src/analysis/relative-measurement.js');
const G=4*Math.PI*Math.PI,K=365.25*86400/149597870.7,earthMass=3.0034896149156e-6;
const engine=new window.SystemForgeCore.RelativeMeasurement({G,AU_KM:149597870.7,KMS_TO_AUYR:K,massSolar:b=>b.m,orbitalDynamics:window.SystemForgeCore.OrbitalDynamics});
const sun={m:1,pos:new V(),vel:new V()},earth={m:earthMass,pos:new V(1,0,0),vel:new V(0,0,-2*Math.PI)};
const r=engine.compute(sun,earth);assert.ok(r);assert.ok(Math.abs(r.distanceAU-1)<1e-12);assert.ok(r.bound);assert.ok(Math.abs(r.elements.aAU-1)<1e-4);assert.ok(r.relativeSpeedKms>29&&r.relativeSpeedKms<30.5);assert.ok(Math.abs(r.radialSpeedKms)<1e-10);assert.ok(r.lightTimeSeconds>499&&r.lightTimeSeconds<500);assert.ok(r.specificAngularMomentumAU2Yr>6.2&&r.specificAngularMomentumAU2Yr<6.4);assert.ok(r.specificEnergyKm2S2<0);assert.ok(r.specificAngularMomentumKm2S>0);
console.log('measurement-smoke OK');
