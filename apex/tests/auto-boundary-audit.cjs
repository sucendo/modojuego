/* Production recovery/gate functions: authoritative drivable polygons may be
   narrower than the modeled road width and may contain holes. */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'apex/parts/part-026.txt'),'utf8'),old=cp.execFileSync('git',['show','8e71e2d0dba93cf4b6efbb97aba546f36278be6d:apex/parts/part-026.txt'],{cwd:root,encoding:'utf8',maxBuffer:10e6});
function func(s,name){const i=s.indexOf(`function ${name}(`);assert.ok(i>=0);for(let e=s.indexOf('}',i);e>=0;e=s.indexOf('}',e+1)){const code=s.slice(i,e+1);try{new vm.Script(`(${code})`);return code}catch{}}throw Error(name);}
function context(s){const c=vm.createContext({Math,Number,player:{s:0,x:0,z:0,lat:2,heading:0,trackIndex:0,track:{tx:0,tz:1},autoLastWallHit:-99,autoLastRivalContact:-99,lastDrivableBoundaryHit:19.99},raceT:20,currentSession:'race',trackData:{km:5},
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),finite:(v,d=0)=>Number.isFinite(v)?v:d,angleDiff:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),mod:(a,n)=>(a%n+n)%n,
 poseAt:s=>({x:0,z:s,nx:1,nz:0,tx:0,tz:1}),nearestTrackState:(x,z)=>({s:z,lat:x,index:0}),wallContactAtPose:()=>null,envProfile:()=>({half:10,curb:1,runoff:3}),wallGeometryAtS:()=>({edge:20}),apexDrivableAreaContains:()=>null,
 playerSurfaceState:()=>({zone:'TRACK',kind:'ASPHALT'}),autoMarkLocalRisk(){},autoChicaneEscapeAheadPlan:()=>null,autoChooseRecoveryPlan:()=>({s:10,lane:0,x:0,z:10,heading:0,reverseNeeded:false,trafficBlocking:false}),autoSafeLaneLimit:()=>5,forwardDistanceS:(a,b)=>b-a,autoRecoveryTrafficRisk:()=>({risk:0,blocking:false}),pushTelemetryEvent(){}});
 vm.runInContext(['autoRecoveryGateClear','autoStraightRecoveryCorridor','autoBoundaryRejoinPoint','autoRecoveryController'].filter(n=>s.includes(`function ${n}(`)).map(n=>func(s,n)).join('\n'),c);return c;}
const before=context(old),now=context(source),env={half:10,curb:1,runoff:3,wall:false};
assert.equal(before.autoRecoveryController(.1,env),null);const control=now.autoRecoveryController(.1,env);assert.equal(control.reverse,true);assert.ok(control.throttle>0);assert.equal(control.brake,0);assert.equal(now.player.x,0);assert.equal(now.player.z,0);
now.player.autoRecovery=null;now.player.autoStuckSince=0;now.player.autoRecoveryProbe=null;now.player.lastDrivableBoundaryHit=18;assert.equal(now.autoRecoveryController(.1,env),null);
for(const c of [before,now])c.apexDrivableAreaContains=(x,z)=>Math.abs(x)<3;
assert.equal(before.autoRecoveryGateClear(5),true);assert.equal(now.autoRecoveryGateClear(5),false);assert.equal(now.autoRecoveryGateClear(0),true);
// A direct chord can cross an authoritative hole despite both endpoints being valid.
for(const c of [before,now])c.apexDrivableAreaContains=(x,z)=>Math.hypot(x-5,z-5)>2;
assert.equal(before.autoStraightRecoveryCorridor(10,10).clear,true);assert.equal(now.autoStraightRecoveryCorridor(10,10).clear,false);
now.apexDrivableAreaContains=()=>null;assert.equal(now.autoStraightRecoveryCorridor(10,10).clear,true);now.wallContactAtPose=()=>({penetration:.5});assert.equal(now.autoStraightRecoveryCorridor(10,10).clear,false);
const blocked=context(source);blocked.player.autoRecovery={since:19,episodeStart:18,startX:0,startZ:0,startLat:2,startS:0,attempts:2,plan:{s:10,lane:0,x:0,z:10,heading:0},emergency:true,emergencyStage:'ALIGN',emergencySince:19,emergencyPlan:{s:0,lane:0,x:0,z:0},emergencySide:1,emergencyBestLat:2,emergencyLastImprove:20};
const rescue=blocked.autoRecoveryController(.1,env);assert.equal(rescue.reverse,true);assert.equal(blocked.player.autoRecovery.emergencyStage,'BACKOUT');assert.equal(blocked.player.x,0);assert.equal(blocked.player.z,0);
const entry=context(source);entry.player.x=4;entry.apexDrivableAreaContains=(x,z)=>Math.abs(x)<3;assert.equal(entry.autoStraightRecoveryCorridor(0,10).clear,true);
console.log('PASS: pinned emergency ALIGN backs out; outside-to-inside rescue remains legal');
console.log('PASS: blocked SVG boundary enters existing reverse recovery without moving/rotating the car');
console.log('PASS: boundary signal expires; wider modeled road does not override authoritative polygon');
console.log('PASS: recovery gates/chords respect SVG holes, absent boundaries and physical walls');

// Reaching valid asphalt pointing mostly along it must stop chasing a stale point.
for(const [heading,inside,expected] of [[.5,true,'ALIGN'],[1.2,true,'PULL_IN'],[.5,false,'PULL_IN']]){
 const c=context(source);c.player.heading=heading;c.player.lastDrivableBoundaryHit=18;c.apexDrivableAreaContains=()=>inside;
 c.player.autoRecovery={since:19,episodeStart:18,startX:0,startZ:0,startLat:2,startS:0,attempts:2,plan:{s:10,lane:0,x:0,z:10,heading:0},boundaryEpisode:true,emergency:true,emergencyStage:'PULL_IN',emergencySince:19,emergencyPlan:{s:100,lane:0,x:0,z:100},emergencySide:1,emergencyBestLat:2,emergencyLastImprove:20};
 c.autoRecoveryController(2,env);assert.equal(c.player.autoRecovery.emergencyStage,expected);
 if(expected==='ALIGN')assert.equal(c.player.autoRecovery.emergencyEdgeLane,2);
 assert.equal(c.player.x,0);assert.equal(c.player.z,0);assert.equal(c.player.heading,heading);
}
console.log('PASS: reached asphalt enters alignment in its actual lane; crossed/outside cars do not');


// Madrid lap-two regression: while the car is almost stationary and sliding
// OUTWARD beside a barrier, ALIGN must stop pushing ahead along the wall.
// Check the actual production recovery state machine, not a replica.
function outerEdgeContext(vx=.9){
 const c=context(source);c.raceT=20;c.telemetryRound=n=>n;
 c.lerp=(a,b,t)=>a+(b-a)*t;
 Object.assign(c.player,{s:1205,x:7.2,lat:7.2,heading:0,vx,vz:0,
   lastDrivableBoundaryHit:18,autoLastWallHit:-99});
 c.player.autoRecovery={since:19,episodeStart:18,startX:7.2,startZ:0,
   startLat:7.2,startS:1205,attempts:2,
   plan:{s:1215,lane:4,x:4,z:1215,heading:0},
   emergency:true,emergencyStage:'ALIGN',emergencySince:19,
   emergencyPlan:{s:1205,lane:4,x:4,z:1205},
   emergencyEdgeLane:4,emergencySide:1,
   emergencyBestLat:7.2,emergencyLastImprove:20};
 return c;
}
const edge=outerEdgeContext();
const outwardAbort=edge.autoRecoveryController(1,env);
assert.equal(edge.player.autoRecovery.emergencyStage,'PULL_IN',
  'Outward drift near a barrier must abort heading-only ALIGN');
assert.ok(edge.player.autoRecovery.emergencyPlan.lane<3,
  'Recovery must aim inside the lane, not toward the dangerous verge');
assert.equal(outwardAbort.throttle,0,'Do not accelerate into the barrier');
assert.equal(outwardAbort.brake>0,true);
const inward=outerEdgeContext(-.9);
const inwardResult=inward.autoRecoveryController(1,env);
assert.equal(inward.player.autoRecovery.emergencyStage,'ALIGN',
  'Already moving inward should not be sent into a second pull-in cycle');
assert.ok(inwardResult.target>0,'Normal alignment must remain available');
const repeated=outerEdgeContext(0);
repeated.player.autoRecovery.emergencyBestLat=4;
repeated.player.autoRecovery.emergencyLastImprove=19;
repeated.autoRecoveryController(1,env);
assert.equal(repeated.player.autoRecovery.emergencyStage,'PULL_IN',
  'Lateral-worsening fallback must not bounce back to ALIGN near the wall');
console.log('PASS: outward boundary creep is interrupted; inward alignment and recovery remain possible');
