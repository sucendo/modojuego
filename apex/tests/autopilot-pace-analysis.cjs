'use strict';
// Runs the production export analyzer, without a duplicate implementation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
const a=source.indexOf('function apexAutPaceAnalysis('),b=source.indexOf('\nfunction exportSessionTelemetry(',a);
assert.ok(a>=0&&b>a,'Pace export analyzer must exist in production');
const ctx={Math,Number,Object,Array,String};
vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);
const analyze=(samples,L)=>ctx.apexAutPaceAnalysis(samples,L);
assert.equal(analyze([],400).reason,'FULL_AUT_SAMPLES_REQUIRED');
assert.equal(analyze([{autoMode:'OFF',t:0,s:0,lap:1,targetSpeedKph:50}],400).available,false);
assert.equal(analyze([],NaN).reason,'INVALID_CIRCUIT');
const samples=[],add=(lap,s,t,changes={})=>{
 samples.push({autoMode:'FULL',lap,s,t,speedKph:180,baseTrackTargetKph:200,
  targetSpeedKph:140,targetSpeedReason:'GRIP_ENVELOPE',
  autDecision:{afterGeometryKph:170,beforeStabilityKph:160,afterStabilityKph:150},
  preCommitTargetKph:145,...changes});
};
let t=0;
for(let lap=1;lap<=3;lap++){
 for(let s=0;s<=400;s+=20){add(lap,s,t);t+=.4;}
}
const result=analyze(samples,400);
assert.equal(result.available,true);
assert.equal(result.intervalM,100);
assert.equal(result.intervals.length,4);
assert.equal(result.completedFlyingLaps.length,2);
assert.equal(result.fastestSampledFlyingLap.lap,2);
assert.equal(result.intervals[0].dominantReason,'GRIP_ENVELOPE');
assert.ok(result.hotspots.length>=1);
const stage=result.stageReductionKphSeconds;
for(const [k,v] of [['GEOMETRY',30],['LOCAL_RISK',10],['STABILITY',10],['TRAFFIC',5],['BRAKE_COMMIT',5]]){
 assert.ok(Math.abs(stage[k]/result.validSeconds-v)<.01,k+' missing or double counted: '+stage[k]);
}
const total=result.intervals.reduce((acc,i)=>acc+i.limiterReductionKphSeconds,0);
const stages=Object.values(stage).reduce((a,b)=>a+b,0);
assert.ok(Math.abs(total-stages)<.1,'Attribution must sum to total target-speed cut');
assert.ok(result.measuredDistanceM>1000,'Completed laps need measured forward movement');
assert.ok(!('estimatedTimeLossSec' in result),'Speed cuts are not certifiable time gains');
// Pauses, telemetry OFF, missing stage data and reversing are intentionally not extrapolated.
const sparse=analyze([
 {autoMode:'FULL',lap:2,s:80,t:0,speedKph:50,baseTrackTargetKph:80,targetSpeedKph:50},
 {autoMode:'FULL',lap:2,s:70,t:7,speedKph:40,baseTrackTargetKph:80,targetSpeedKph:50},
 {autoMode:'OFF',lap:2,s:100,t:7.1,speedKph:60,baseTrackTargetKph:90,targetSpeedKph:60}
],400);
assert.equal(sparse.measuredDistanceM,0);
assert.equal(sparse.validSeconds,0);
console.log(JSON.stringify({test:'aut-pace-analysis',passed:true,completedFlyingLaps:result.completedFlyingLaps.length,
 intervalM:result.intervalM,stages:Object.keys(stage),hotspots:result.hotspots.length}));
