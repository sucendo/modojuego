'use strict';
// Executed against the production functions, not a duplicate corner model.
// Limits: a deterministic physics-unit audit, not a complete GP simulation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'parts/part-026.txt'),'utf8');
function section(from,to){
 const i=src.indexOf(from),j=src.indexOf(to,i+from.length);
 assert.ok(i>=0&&j>i,'Missing AUT production function: '+from);
 return src.slice(i,j);
}
const physical=section('function autoCurvatureEnvelope(','function autoEnsureRiskMemory(');
const envelope=section('function autoGripTrajectoryEnvelope(','// v5.145: segundo cinturón');
const ctx={
 Math,Number,player:{teamKey:'test',tyres:{gripFront:1,gripRear:1}},trackData:{km:5.414},
 raceT:1,wet:false,nowCurvature:s=>(s>=150&&s<=240?.012:0),
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
 curvatureAt:s=>ctx.nowCurvature(s),
 apexTyreGripScale:car=>Math.min(car.tyres.gripFront,car.tyres.gripRear),
 apexWeatherIsWet:()=>ctx.wet,
 teamPerformance:()=>({brake:1}),
 envProfile:()=>({half:7}),
 apexWallishAtS:()=>false
};
vm.createContext(ctx);vm.runInContext(physical+'\n'+envelope,ctx);
const dry=ctx.autoGripTrajectoryEnvelope(0);
assert.ok(Number.isFinite(dry.target)&&dry.target>35,'Dry approach must be quick but finite');
assert.equal(ctx.autoGripTrajectoryEnvelope(0),dry,'No repeated scan during 75 ms cache period');
ctx.player.tyres.gripFront=ctx.player.tyres.gripRear=.58;ctx.raceT+=.1;
const worn=ctx.autoGripTrajectoryEnvelope(0);
assert.ok(worn.target<dry.target,'Worn tyres must brake earlier than fresh slicks');
ctx.wet=true;ctx.raceT+=.1;
const rain=ctx.autoGripTrajectoryEnvelope(0);
assert.ok(rain.target<worn.target,'Rain must further reduce approach speed');
ctx.nowCurvature=()=>.15;ctx.raceT+=.1;
const hairpin=ctx.autoPhysicalCornerSpeed(0);
assert.ok(hairpin<14,'Physical corner speed must not be floored to 14 m/s');
ctx.nowCurvature=()=>0;ctx.raceT+=.1;
const straight=ctx.autoGripTrajectoryEnvelope(0);
assert.equal(straight.target,Infinity,'A truly straight section must not get an arbitrary cap');
assert.ok(src.includes('futureReach=Math.max(.18,laneRate*futureTravel)'),'Lookahead must follow reachable lateral motion');
assert.ok(src.includes("targetReason='GRIP_ENVELOPE'"),'Grip envelope not connected to AUT');
console.log(JSON.stringify({test:'autopilot-grip',dry:dry.target,worn:worn.target,rain:rain.target,hairpin,straight:'unrestricted',cache:true,passed:true}));
