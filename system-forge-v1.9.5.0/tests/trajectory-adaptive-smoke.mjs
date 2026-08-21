import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
class V{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
  clone(){return new V(this.x,this.y,this.z)}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}
  length(){return Math.hypot(this.x,this.y,this.z)}
  cross(v){return new V(this.y*v.z-this.z*v.y,this.z*v.x-this.x*v.z,this.x*v.y-this.y*v.x)}
  toArray(){return [this.x,this.y,this.z]}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}
  distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2}
}
class G{setFromPoints(points){this.points=points.map(p=>p.clone());return this}}
class M{constructor(opts){this.opts=opts}}
class L{constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new V();this.userData={}}}
global.window={SystemForgeCore:{}};
require('../src/renderer/trajectory-layer.js');
const {createTrajectoryLayer}=window.SystemForgeCore;
const sun={id:'sun',kind:'star',parent:null,pos:new V(),vel:new V()};
const earth={id:'earth',kind:'planet',parent:'sun',pos:new V(1,0,0),vel:new V(0,2*Math.PI,0),trail:[]};
const state={bodies:[sun,earth],selected:'earth',trailMode:'selected',trailMaxPoints:600,trailRevision:0,lastTrailDrawRevision:-1,running:true,t:0,_lastYps:0};
const trailGroup={children:[],clear(){this.children=[]},add(x){this.children.push(x)}};
const layer=createTrajectoryLayer({THREE:{Vector3:V,BufferGeometry:G,LineBasicMaterial:M,Line:L},state,trailGroup,referenceById:()=>null,referencePhysicalState:()=>null,orbitalReferenceAt:b=>b.id==='earth'?{pos:sun.pos.clone(),vel:sun.vel.clone(),mass:1}:null,parentOf:b=>b.parent==='sun'?sun:null,osculatingElements:b=>b.id==='earth'?{periodYears:1}:null,period:b=>b.id==='earth'?1:null,categoryVisible:()=>true,sameOrbitFamily:()=>false,computeDisplayPositions:()=>new Map([['sun',sun.pos.clone()],['earth',earth.pos.clone()]]),referenceDisplayPosition:()=>new V(),relativeVisualScale:()=>1,colorFor:()=>0xffffff,perfMonitor:{quality:'normal'}});
const base=layer.trailSampleIntervalYears(earth);
assert.ok(Math.abs(base-1/220)<1e-9,`base=${base}`);
state._lastYps=10;
const fast=layer.trailSampleIntervalYears(earth);
assert.ok(fast>=.2-1e-12,`fast cadence=${fast}`);
assert.equal(layer.adaptiveDrawIntervalMs(),24,'fast orbital motion should use normal-quality minimum redraw interval');
state._lastYps=0;
assert.equal(layer.adaptiveDrawIntervalMs(),260);
// Historical samples stay sparse, but the rendered polyline must reach the live body state.
earth.trail=[{t:0,pos:[1,0,0],refPos:[0,0,0],refKey:'parent:sun',parentId:'sun',referenceId:null,referenceIds:null}];
earth.pos=new V(0,1,0);state.trailRevision=1;layer.updateTrails();
assert.equal(trailGroup.children.length,1);const pts=trailGroup.children[0].geometry.points;assert.equal(pts.length,2);assert.deepEqual(pts.at(-1).toArray(),[0,1,0]);
console.log('trajectory-adaptive-smoke OK');
