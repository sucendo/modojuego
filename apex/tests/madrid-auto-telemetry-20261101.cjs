'use strict';
// APEX Madrid: invoke production helpers, verifying event-free impact counting
// and local barrier response without duplicating the runtime algorithms.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'../parts'),p26=fs.readFileSync(path.join(root,'part-026.txt'),'utf8'),
      p27=fs.readFileSync(path.join(root,'part-027.txt'),'utf8');
function slice(from,to){
 const a=p26.indexOf(from),b=p26.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'Missing production function: '+from);
 return p26.slice(a,b);
}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const ctx={Math,Number,Infinity,clamp,sessionTelemetry:{events:[],incidentCounters:{wallHits:0,physicalWallHits:0,boundaryHits:0,lastContactT:-99,recent:[]}},
 player:{s:1200,lat:2.5,speed:30,autoTargetSpeed:35,autoTargetSpeedReason:'TRACK'},mode:'race',
 raceT:10,demoMode:true,assistMode:false,trackData:{spec:{dir:'14-spain'}},apexWallishAtS:()=>true,
 telemetryRound:(v,n=4)=>Number.isFinite(v)?+v.toFixed(n):null,
 telemetryRecordingEnabled:()=>false,telemetryEventAllowed:()=>true,
 apexWeatherIsWet:()=>false,apexTyreGripScale:()=>1,curvatureAt:()=>.008};
vm.createContext(ctx);
vm.runInContext(slice('function pushTelemetryEvent(','function captureTelemetryEventState('),ctx);
vm.runInContext(slice('function apexRecordPlayerBarrierContact(','function pushTelemetryEvent('),ctx);
vm.runInContext(slice('function autoMadridBarrierApproachLimit(','function demoDriverControl('),ctx);
ctx.apexRecordPlayerBarrierContact('WALL');
ctx.raceT=10.03;ctx.apexRecordPlayerBarrierContact('BOUNDARY');
assert.equal(ctx.sessionTelemetry.incidentCounters.wallHits,1,'100Hz contacts are one wall incident');
assert.equal(ctx.sessionTelemetry.incidentCounters.physicalWallHits,1);
ctx.raceT=10.80;ctx.apexRecordPlayerBarrierContact('BOUNDARY');
assert.equal(ctx.sessionTelemetry.incidentCounters.wallHits,2,'separate incident counted with recording OFF');
assert.equal(ctx.sessionTelemetry.incidentCounters.boundaryHits,1);
assert.equal(ctx.sessionTelemetry.incidentCounters.recent.length,2);
assert.equal(ctx.sessionTelemetry.events.length,0,'OFF must not allocate detailed events');
const env={half:5.5};
const risky=ctx.autoMadridBarrierApproachLimit(1200,42,env,6,false);
assert.ok(risky<42&&risky>=12,'outward slide receives achievable brake target');
assert.equal(ctx.autoMadridBarrierApproachLimit(1200,42,env,-6,false),Infinity,'inward velocity not slowed');
assert.equal(ctx.autoMadridBarrierApproachLimit(1200,42,env,6,true),Infinity,'traffic driving left unchanged');
ctx.trackData.spec.dir='10-belgium';
assert.equal(ctx.autoMadridBarrierApproachLimit(1200,42,env,6,false),Infinity,'other circuits unchanged');
// Static linkage: the physics must emit the counter independent of the recorder.
assert.match(p27,/if\(wallHitThisFrame\)apexRecordPlayerBarrierContact\("WALL"\)/);
assert.match(p27,/if\(drivableBoundaryHitThisFrame\)apexRecordPlayerBarrierContact\("BOUNDARY"\)/);
assert.match(p26,/wallHits:sessionTelemetry\.incidentCounters\?\.wallHits\|\|0/);
// Grip planner only evaluates the expensive curvature once per horizon point.
let curvatureCalls=0;ctx.curvatureAt=()=>{curvatureCalls++;return .008};
vm.runInContext(slice('function autoCurvatureEnvelope(','function autoEnsureRiskMemory('),ctx);
const fast=ctx.autoPhysicalCornerSpeed(1000,ctx.player,.008);
assert.ok(Number.isFinite(fast)&&fast>0);
assert.equal(curvatureCalls,0,'precomputed k must not be rescanned');
ctx.autoPhysicalCornerSpeed(1000,ctx.player);
assert.ok(curvatureCalls>0,'default standalone call still measures curvature');
console.log(JSON.stringify({test:'madrid-auto-telemetry',barrierLimitKph:+(risky*3.6).toFixed(1),episodes:2,passed:true}));
