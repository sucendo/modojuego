'use strict';
// Tests actual production 2B helpers, without duplicating their implementation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
const a=source.indexOf('function autoUniversalKinkApproachTarget('),b=source.indexOf('\nfunction autoUniversalTargetReleaseRate(',a);
assert.ok(a>0&&b>a,'Kink stopping-distance and exit-settled helpers missing');
const ctx={Math,Number,clamp:(x,l,h)=>Math.min(h,Math.max(l,x))};vm.createContext(ctx);
vm.runInContext(source.slice(a,b),ctx);
const approach=ctx.autoUniversalKinkApproachTarget,settled=ctx.autoUniversalKinkExitSettled;
for(const angle of [.70,1.15,1.62]){
 const v0=approach(angle,0,1,false,1),v15=approach(angle,15,1,false,1),
       v60=approach(angle,60,1,false,1),v85=approach(angle,85,1,false,1);
 assert.ok(v0>6&&v0<13,'Preserve safe apex speed');
 assert.ok(v15>=v0&&v60>v15&&v85>v60,'Progressive physically reachable braking');
 assert.ok(v85<39,'No unsafe 85m approach speed');
 assert.ok(approach(angle,85,.55,true,.9)<v85,'Wet/worn tyres must brake earlier');
 const alpha=angle>Math.PI*.47?7.2:angle>Math.PI*.31?9.8:12;
 assert.ok(Math.abs(v0-alpha)<1e-8,'Same conservative kink apex as main');
}
assert.equal(settled(.03,.06,.01,.65,.04,.04,false),true,'Stable, aligned exit can reopen');
assert.equal(settled(.20,.06,.01,.65,.04,.04,false),false,'Heading error remains guarded');
assert.equal(settled(.03,.50,.01,.65,.04,.04,false),false,'Yaw remains guarded');
assert.equal(settled(.03,.06,.09,.65,.04,.04,false),false,'Slip remains guarded');
assert.equal(settled(.03,.06,.01,.96,.04,.04,false),false,'Rear tyre saturation remains guarded');
assert.equal(settled(.03,.06,.01,.65,.50,.04,false),false,'Risk memory remains guarded');
assert.equal(settled(.03,.06,.01,.65,.04,.30,false),false,'Track edge remains guarded');
assert.equal(settled(.03,.06,.01,.65,.04,.04,true),false,'Next nearby kink remains guarded');
assert.match(source,/target=Math.min\(target,reopen\?Math.max\(exitCap,sp\+3\.5\):exitCap\)/,
 'Even after release, normal physics/traffic/tyre target stays an upper bound');
assert.match(source,/const reopen=soloSession&&!offTrack&&!raceTraffic.active&&aligned/,
 'Never release for traffic or recovery');
console.log(JSON.stringify({test:'autopilot-kink-braking',passed:true,profiles:3,wet:true,guards:8}));
