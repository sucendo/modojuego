'use strict';
// Exercise production AUT release calculations, not a duplicated planner.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
const a=source.indexOf('function autoUniversalTargetReleaseRate(');
const b=source.indexOf('\nfunction demoDriverControl(',a);
assert.ok(a>0&&b>a,'Universal exit-release helpers missing');
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ctx={Math,Number,clamp,lerp,curvatureAt:()=>0,
 // The universal speed release now queries the racing-line curvature adapter.
 autoRacingCurvatureAt:s=>ctx.curvatureAt(s)};
vm.createContext(ctx);
vm.runInContext(source.slice(a,b),ctx);
const clearance=ctx.autoUniversalExitClearance,rate=ctx.autoUniversalTargetReleaseRate;
const profile=(past,now,next,far,after70)=>s=>s<0?past:s<12?now:s<33?next:s<57?far:after70;
const call=(p,heading=0,risk=0,rear=0,wet=false)=>{
 ctx.curvatureAt=profile(...p);return clearance(0,heading,risk,rear,wet);
};
const clean=call([.013,.008,.0008,.0006,.0005]);
assert.ok(clean>.70,'Clean corner exit should recover requested pace: '+clean);
assert.equal(call([.013,.007,.003,.011,.0005]),0,'Second apex of chicane must block release');
assert.equal(call([.009,.006,.012,.002,.001]),0,'Approaching hairpin must block release');
assert.equal(call([.002,.002,.002,.002,.002]),0,'Steady-radius corner is not an exit');
assert.equal(call([0,0,0,0,0]),0,'A straight is not an exit event');
assert.equal(call([.013,.008,.0008,.0006,.0005],.4),0,'Misaligned car must not accelerate');
assert.equal(call([.013,.008,.0008,.0006,.0005],0,.9),0,'Unstable car must not accelerate');
assert.equal(call([.013,.008,.0008,.0006,.0005],0,0,.8),0,'Critical rear axle blocks acceleration');
assert.ok(call([.013,.008,.0008,.0006,.0005],0,0,0,true)<clean,'Rain slows reopening');
const cautious=rate(true,.008,0,1,false),fast=rate(true,.008,0,1,false,clean);
assert.ok(fast>cautious*1.5,'Release is faster on safe exit');
assert.ok(fast<=16.5,'Rate still bounded');
assert.ok(rate(true,.012,.9,.8,true,0)<cautious,'Grip/risk/wet remain protective');
assert.equal(rate(true,.008,0,1,false,0),cautious,'No change to unconfirmed exits');
assert.equal(rate(false,.008,0,1,false,clean),11,'Open straights retain existing request');
assert.match(source,/if\(exitClearance>\.25&&target>sp\+\.8\)/,'Speed floor requires stable exit');
assert.match(source,/player\.autoCommittedTargetSpeed=Math\.min\(target,Math\.max\(player\.autoCommittedTargetSpeed,/,
 'The actual safe target remains the hard speed cap');
assert.match(source,/!offTrack&&!raceTraffic\.active/,'Traffic and off-track retain normal controller');
console.log(JSON.stringify({test:'autopilot-clean-exit',clean,rateBefore:cautious,rateAfter:fast,passed:true}));
