'use strict';
// Tests the actual universal production guide, counter-yaw and physically
// bounded speed-target release on several tracks, not a duplicated algorithm.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
const a=source.indexOf('function autoUniversalRacingReference(');
const b=source.indexOf('\nfunction demoDriverControl(',a);
assert.ok(a>=0&&b>a,'Universal racing reference must exist in production code');
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const latAt=s=>1.15+.25*Math.sin((s-1000)/85);
const ctx={
 Math,Number,trackData:{km:5.414,spec:{dir:'14-spain'},model:{driver:{step:5.5}}},
 clamp,lerp:(x,y,t)=>x+(y-x)*t,mod:(x,n)=>(x%n+n)%n,
 poseAt:s=>({x:0,z:s,nx:-1,nz:0}),
 driverReferencePoseAt:s=>({x:-latAt(s),z:s}),
 autoSafeLaneLimit:()=>3.1,
 finite:(v,fallback)=>Number.isFinite(v)?v:fallback,
 player:{yawRate:0,slipAngle:0}
};
vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);
const ref=s=>ctx.autoUniversalRacingReference(s);
for(const dir of ['14-spain','06-monaco','10-belgium','13-italy','03-japan']){
 ctx.trackData.spec.dir=dir;
 for(let s=800;s<=1500;s++){
  const r=ref(s),next=ref(s+1);
  assert.ok(r&&next,'Universal reference missing on '+dir+' at '+s);
  assert.equal(r.weight,1);
  assert.ok(Math.abs(r.lat-latAt(s))<1e-9,'Production world->Frenet conversion '+dir+' at '+s);
  assert.ok(Math.abs(next.lat-r.lat)<.008,'No sudden change in lateral target: '+dir+' at '+s);
 }
}
ctx.trackData.model.driver=null;
assert.equal(ref(1150),null,'Gracefully use legacy control if no safe track reference');
ctx.trackData.model.driver={step:5.5};
assert.equal(ctx.autoUniversalDangerSide(.2,-4.2),-1,'Predict imminent other-side boundary');
assert.equal(ctx.autoUniversalDangerSide(-.2,4.2),1,'Predict imminent other-side boundary');
assert.equal(ctx.autoUniversalDangerSide(4.2,-.3),1,'Do not counter-steer unnecessarily on re-entry');
ctx.player.yawRate=1.2;ctx.player.slipAngle=.04;
const r=ctx.autoUniversalYawGuard(55,.35,-.025,-.002,true);
assert.ok(r.active&&r.steer<-.25,'Counter-yaw for positive spin');
ctx.player.yawRate=-1.15;ctx.player.slipAngle=-.04;
const l=ctx.autoUniversalYawGuard(55,-.35,-.025,-.002,true);
assert.ok(l.active&&l.steer>.25,'Counter-yaw for negative spin');
ctx.player.yawRate=-.11;
assert.equal(ctx.autoUniversalYawGuard(55,.2,-.025,-.002,true).active,false,'Expected yaw leaves steering intact');
const rise=ctx.autoUniversalTargetReleaseRate;
assert.ok(rise(true,.001,0,1,false)>6,'Clean-air exit may release a physically viable target');
assert.ok(rise(true,.012,.9,.8,true)<rise(true,.001,0,1,false),'Worn/wet and unstable corners release more cautiously');
assert.ok(rise(true,.012,.9,.8,true)>0,'Do not permanently lock speed target');
assert.match(source,/const futureGuide=lineGuide\?autoUniversalRacingReference\(player\.s\+look\):null/,'Future line uses same reference');
assert.match(source,/autoDynamicStability\(sp,env,steer,target,!!lineGuide\)/,'Predictive side shared with stabilization');
assert.match(source,/driverReferencePathCurvatureAt\(kSampleS\)/,'Feed-forward follows continuous reference');
assert.match(source,/!raceTraffic\.active&&!Number\.isFinite\(traffic\.lane\)/,'Racing traffic still wins');
assert.match(source,/const soloSession=!\(rivals&&rivals\.length\)/,'Universal guide must not flicker in a populated race');
assert.match(source,/const lineGuide=\(soloSession&&!offTrack/,'Passing controller holds authority whenever rivals exist');
assert.match(source,/const lineGuide=\(soloSession&&!offTrack&&\s*!raceTraffic\.active/,'A solo technical corner must never switch away from the continuous guide');
console.log(JSON.stringify({test:'autopilot-universal-reference-and-speed',passed:true,circuits:5}));
