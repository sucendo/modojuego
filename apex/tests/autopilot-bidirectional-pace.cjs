'use strict';
// Production helpers only. The racing-speed envelope must remain finite,
// cyclic, dry/wet aware and bounded by achievable braking and acceleration.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync(path.join(__dirname,'../parts/part-024.txt'),'utf8'),
      b=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
function between(s,from,to){const p=s.indexOf(from),q=s.indexOf(to,p);assert.ok(p>=0&&q>p,from);return s.slice(p,q)}
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const mod=(v,n)=>(v%n+n)%n;
const ctx={Math,Float32Array,Number,clamp,mod,
 trackData:{model:{driver:{pacePlan:{}}}},
 driverReferenceTargetSpeedAt:()=>40};
vm.createContext(ctx);
vm.runInContext(between(a,'function driverBidirectionalPacePlan(','\nfunction prepareDriverReferenceModel('),ctx);
vm.runInContext(between(b,'function autoUniversalPaceRelease(','\nfunction autoTargetSpeed('),ctx);
function solve(wet){
 const n=120,limits=Float32Array.from({length:n},()=>82),curve=Float32Array.from({length:n},()=>0);
 limits[45]=18;curve[45]=.016;
 return ctx.driverBidirectionalPacePlan(limits,curve,6.2,wet);
}
const dry=solve(false),rain=solve(true);
assert.equal(dry.speed.length,120);
assert.ok(dry.speed.every(Number.isFinite));
assert.ok(rain.speed.every(Number.isFinite));
assert.equal(dry.speed[45],18);
assert.equal(rain.speed[45],18);
assert.ok(dry.speed[43]<82&&dry.speed[47]<82,'Brake AND accelerate either side of turn');
assert.ok(rain.speed[42]<=dry.speed[42]+1e-6,'Wet braking must have extra margin');
assert.ok(rain.speed[50]<=dry.speed[50]+1e-6,'Wet acceleration must be slower');
assert.ok(dry.speed[0]>dry.speed[44],'Far straight must recover speed');
assert.ok(dry.speed.every((v,i)=>v<=82+1e-6),'No speed can exceed physical local limit');
const release=ctx.autoUniversalPaceRelease(0,27,true,1,false);
assert.ok(release.target>27&&release.target<=30.7+1e-6,'Clean and solo may release some conservative margin');
assert.equal(ctx.autoUniversalPaceRelease(0,27,false,1,false).target,27,'Unstable cars retain the old limit');
assert.equal(ctx.autoUniversalPaceRelease(0,27,true,.25,true).target,27,'Wet and low grip cannot force a faster target');
assert.match(b,/soloPaceStable=!!lineGuide/);
assert.match(b,/!technical\.active&&/);
assert.match(b,/!compound\.active&&/);
assert.match(b,/paceRelease\.target<target-\.20/);
console.log(JSON.stringify({test:'aut-bidirectional-pace',passed:true,
 dryModelTime:dry.after,wetModelTime:rain.after,
 fullThrottleReleaseMps:release.released}));
