'use strict';
// Production regression: the Madrid PK 1150 corridor must use one continuous
// world-space reference for present lane, future lane and curvature feed-forward.
// It must not alter other circuits or lead/follow/race traffic controllers.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
const a=source.indexOf('function autoMadridPk1150Reference(');
const b=source.indexOf('\nfunction demoDriverControl(',a);
assert.ok(a>=0&&b>a,'Production PK1150 reference helper must exist');
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
const pathLat=s=>1.15+.25*Math.sin((s-1000)/85);
const ctx={
 Math,Number,trackData:{km:5.4085,spec:{dir:'14-spain'},model:{driver:{}}},
 clamp,mod:(x,n)=>(x%n+n)%n,
 poseAt:s=>({x:0,z:s,nx:-1,nz:0}),
 driverReferencePoseAt:s=>({x:-pathLat(s),z:s}),
 autoSafeLaneLimit:()=>3.1
};
vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);
const ref=s=>ctx.autoMadridPk1150Reference(s);
assert.equal(ref(850),null,'Outside approach reference is untouched');
assert.equal(ref(1410),null,'After corridor the old controller is untouched');
assert.equal(ref(1150).weight,1,'Full reference authority at the repeated crash point');
assert.ok(Math.abs(ref(1150).lat-pathLat(1150))<1e-10,'World path converts correctly to actual Frenet lateral coordinates');
for(let s=975;s<=1280;s++){
 const result=ref(s);
 assert.ok(result&&Math.abs(result.lat-pathLat(s))<1e-10,'No lane-selection switch at s='+s);
 assert.equal(result.weight,1,'Inside crash corridor the line must not jump back to the legacy planner');
}
for(let s=900;s<=1380;s++){
 const r1=ref(s),r2=ref(s+1);
 if(r1&&r2){
  assert.ok(Math.abs(r1.weight-r2.weight)<.035,'Soft in/out transition at s='+s);
  assert.ok(Math.abs(r1.lat-r2.lat)<.008,'Continuous lateral trajectory at s='+s);
 }
}
ctx.trackData.spec.dir='10-belgium';assert.equal(ref(1150),null,'No changes to Spa');
ctx.trackData.spec.dir='14-spain';ctx.trackData.model.driver=null;
assert.equal(ref(1150),null,'No reference fallback if model is unavailable');
assert.match(source,/const futureGuide=lineGuide\?autoMadridPk1150Reference\(player\.s\+look\):null/,'Future steering path uses same production reference');
assert.match(source,/driverReferencePathCurvatureAt\(kSampleS\)/,'Steering feed-forward uses continuous reference curvature');
assert.match(source,/!raceTraffic\.active&&!Number\.isFinite\(traffic\.lane\)/,'Racing traffic must keep legacy lane authority');
console.log(JSON.stringify({test:'autopilot-madrid-pk1150-reference',passed:true,range:'970–1280 m'}));
