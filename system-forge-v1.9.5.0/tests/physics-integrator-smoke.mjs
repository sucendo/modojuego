import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);

class V3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
  clone(){return new V3(this.x,this.y,this.z)}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
  subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}
  lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}
  length(){return Math.sqrt(this.lengthSq())}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)}
  cross(v){const x=this.y*v.z-this.z*v.y,y=this.z*v.x-this.x*v.z,z=this.x*v.y-this.y*v.x;this.x=x;this.y=y;this.z=z;return this}
}

global.window={SystemForgeCore:{}};
require('../src/physics/integrator.js');
require('../src/physics/structures.js');
const THREE={Vector3:V3},G=4*Math.PI*Math.PI,AU_KM=149597870.7;
const m1=1,m2=3.0034896149156e-6,M=m1+m2,r=1,n=Math.sqrt(G*M);
const state={bodies:[
  {id:'sun',kind:'star',massSolar:m1,pos:new V3(-m2/M*r,0,0),vel:new V3(0,-m2/M*n,0)},
  {id:'earth',kind:'planet',massSolar:m2,pos:new V3(m1/M*r,0,0),vel:new V3(0,m1/M*n,0)}
],t:0,minSep:Infinity,unstable:false};
const massSolar=b=>b.massSolar||0,radiusKm=()=>0,parentOf=()=>null;
const structures=new window.SystemForgeCore.StructurePhysics({THREE,state,G,AU_KM,massSolar,parentOf});
const integrator=new window.SystemForgeCore.NBodyIntegrator({THREE,state,G,AU_KM,massSolar,radiusKm,structurePhysics:structures,recordCriticalEvent:()=>{},invalidateRenderState:()=>{},sampleTemporalSelected:()=>{}});
const E0=integrator.energy(),L0=integrator.angularMomentum().length();
const dt=1/365.25,steps=Math.round(1/dt);
for(let i=0;i<steps;i++)integrator.step(dt);
const E1=integrator.energy(),L1=integrator.angularMomentum().length();
const eDrift=Math.abs((E1-E0)/E0),lDrift=Math.abs((L1-L0)/L0);
assert.ok(eDrift<2e-7,`energy drift=${eDrift}`);
assert.ok(lDrift<2e-12,`angular momentum drift=${lDrift}`);
const separation=state.bodies[0].pos.distanceTo(state.bodies[1].pos);
assert.ok(Math.abs(separation-1)<2e-4,`separation=${separation}`);

// Shell theorem regression: zero acceleration inside the cavity, point-mass field outside.
const shell={id:'shell',kind:'structure',structureType:'shell',gravityEnabled:true,massSolar:1e-3,innerAU:1,outerAU:2,pos:new V3(),vel:new V3()};
state.bodies.push(shell);
const inside={pos:new V3(.5,0,0)},outside={pos:new V3(3,0,0)};
assert.ok(structures.shellGravityOn(inside,shell).length()<1e-18,'shell cavity acceleration must be zero');
const aOut=structures.shellGravityOn(outside,shell);
const expected=G*1e-3/9;
assert.ok(Math.abs(aOut.length()-expected)/expected<1e-12,`shell outside field=${aOut.length()}`);
assert.ok(aOut.x<0,'shell acceleration must point toward center');
console.log(`physics-integrator-smoke OK · ΔE=${eDrift.toExponential(3)} · ΔL=${lDrift.toExponential(3)}`);
