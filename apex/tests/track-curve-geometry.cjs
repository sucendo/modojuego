'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Test production geometry, not a duplicate of its implementation.
const source = fs.readFileSync('apex/parts/part-024.txt','utf8');
const begin = source.indexOf('function ensureRenderMiters(){');
const end = source.indexOf('function trackSurfacePoseAt(',begin);
assert.ok(begin>=0&&end>begin,'Shared 3D road ribbon source must exist');
const ribbonSource = source.slice(begin,end);
assert.ok(!ribbonSource.includes('authoredMadrid'),'Curve joins must not be Madrid-specific');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const mod=(a,m)=>(a%m+m)%m;
const svg = fs.readFileSync('apex/circuits/svg/apex26_14-madrid-spain_2026-11-03.svg','utf8');
function svgPoints(id) {
 const idx=svg.indexOf('id="'+id+'"');
 assert.ok(idx>=0,'Missing authored SVG path: '+id);
 const element=svg.slice(svg.lastIndexOf('<',idx),svg.indexOf('>',idx));
 const path=element.match(/\sd="([^"]+)"/);
 assert.ok(path,'Missing SVG path data: '+id);
 return [...path[1].matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],-(+m[2])]);
}
const points=svgPoints('track_centerline');
assert.ok(points.length>900);
const L=5400,step=L/points.length;
const trackData={pts:points,km:L/1000,spec:{dir:'14-spain'},customWorld:null,model:{}};
const sandbox={trackData,clamp,lerp,mod,bankAt:()=>0,elevationAt:()=>0,poseAt:()=>({x:0,z:0,nx:1,nz:0}),guideContinuousSample:()=>null};
vm.createContext(sandbox);
vm.runInContext(ribbonSource,sandbox,{filename:'apex-road-ribbon.js'});
const {ensureRenderMiters,renderRibbonFrameAt,ribbonWorldPoint}=sandbox;
const M=ensureRenderMiters();
assert.equal(M.length,points.length);
// Both sides of the actual tight T20 region must advance along the SVG,
// never reverse at one of its sharp polyline vertices.
let reversals=0,maxVector=0;
for(let i=0;i<points.length;i++){
 const q=renderRibbonFrameAt(i*step),pL=ribbonWorldPoint(q,6.2,1),pR=ribbonWorldPoint(q,6.2,-1);
 for(const p of [q,pL,pR])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));
 maxVector=Math.max(maxVector,Math.hypot(M[i].x,M[i].z));
 if(i<855||i>895)continue;
 const q1=renderRibbonFrameAt((i+1)*step),dx=q1.x-q.x,dz=q1.z-q.z,d=Math.hypot(dx,dz);
 for(const side of [1,-1]){
  const a=ribbonWorldPoint(q,6.2,side),b=ribbonWorldPoint(q1,6.2,side);
  if(((b.x-a.x)*dx+(b.z-a.z)*dz)/Math.max(.01,d)<-.01)reversals++;
 }
}
assert.equal(reversals,0,'T20 cannot produce backwards folded road boundaries');
assert.ok(maxVector<=2.21,'Unlimited miters would draw spikes on acute bends');
// Identical rules for every GP; no special adjustment for the Madrid ID.
const original=M.map(p=>[p.x,p.z]);
trackData.spec.dir='any-other-circuit';delete trackData.model.renderMiters;
const other=ensureRenderMiters();
for(let i=0;i<other.length;i++)assert.ok(Math.abs(other[i].x-original[i][0])<1e-12&&Math.abs(other[i].z-original[i][1])<1e-12);
trackData.spec.dir='14-spain';

// Inject a deterministic authoritative SVG guide at the SAME station.
// The production renderer must use exact X/Z (not just inferred lateral width).
const leftSamples=[{kind:'left'}],rightSamples=[{kind:'right'}];
trackData.customWorld={authoritative:true,edgeLeftSamples:leftSamples,edgeRightSamples:rightSamples};
const rawPose=s=>{
 const f=mod(s,L)/step,i=Math.floor(f),t=f-i,a=points[i],b=points[(i+1)%points.length],
 dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz)||1;
 return {x:lerp(a[0],b[0],t),z:lerp(a[1],b[1],t),nx:-dz/d,nz:dx/d};
};
sandbox.guideContinuousSample=(samples,s)=>{
 const p=rawPose(s),side=samples===leftSamples?1:-1;
 return {x:p.x+6.2*side*p.nx,z:p.z+6.2*side*p.nz,lat:6.2*side};
};
let authoritative=0;
for(const s of [4690,4750,4760,4770,4780,4788,4800,4820,4880]){
 const q=renderRibbonFrameAt(s);
 if(!q.authoredRoadEdges)continue;
 authoritative++;
 const raw=rawPose(s);
 for(const side of [1,-1]){
  const p=ribbonWorldPoint(q,6.2,side);
  assert.ok(Math.hypot(p.x-(raw.x+side*6.2*raw.nx),p.z-(raw.z+side*6.2*raw.nz))<1e-9,'Road edge must coincide with SVG');
  const ext=ribbonWorldPoint(q,8.2,side);
  assert.ok(Math.hypot(ext.x-p.x,ext.z-p.z)>1.8,'Kerb and shoulder must extend outwards from SVG edge');
 }
}
assert.equal(authoritative,9,'Source SVG edges must be used through the full T20 bend');
assert.match(source,/const q=renderRibbonFrameAt\(s,false\),signedLat/,'Physics must be isolated from new visual road edges');
const physical=renderRibbonFrameAt(4788,false),drawn=renderRibbonFrameAt(4788,true);
assert.ok(drawn.authoredRoadEdges,'Visual track uses imported SVG');
assert.equal(physical.authoredRoadEdges,undefined,'Physical pose retains original kinematics');
assert.ok(Number.isFinite(physical.ox)&&Number.isFinite(physical.oz),'Original physical reference stays finite');
sandbox.guideContinuousSample=()=>null;
assert.equal(renderRibbonFrameAt(4788).authoredRoadEdges,undefined,'Missing guide must fall back safely');
assert.ok(source.includes('const oa=ribbonWorldPoint(qa,ha+width,side)'),'Kerbs must share SVG-derived road boundary');
const compiled=fs.readFileSync('apex/parts/part-025.txt','utf8');
assert.match(compiled,/const APEX_CIRCUIT_COMPILE_REV=230693;/,'Stale compiled meshes must be invalidated');
console.log(JSON.stringify({test:'track-curve-geometry',points:points.length,station:'T20 4788 m',reversals,maxVector:Number(maxVector.toFixed(4)),svgEdges:authoritative,ok:true}));
