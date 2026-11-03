'use strict';
// Production safety rules must be geometry-driven, never GP-name or PK driven.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../parts/part-026.txt'),'utf8');
const from=source.indexOf('function autoGripTrajectoryEnvelope('),to=source.indexOf('\n// v5.145:',from);
const previewStart=source.indexOf('function autoSoloTrajectoryPreview('),previewEnd=source.indexOf('\nfunction autoUniversalRacingReference(',previewStart);
assert.ok(from>=0&&to>from&&previewStart>=0&&previewEnd>previewStart,'Production universal functions must exist');
const code=source.slice(from,to)+'\n'+source.slice(previewStart,previewEnd);
assert.doesNotMatch(code,/14-spain|06-monaco|MADRID_COMPLEX|MadridSoloCriticalBend|2795|2863/,'No circuit identifier or fixed PK in universal helpers');
assert.match(source,/const criticalBend=autoCriticalBendEnvelope\(player\.s,!!raceTraffic\.active\)/,'Production controller uses universal bend governor');
assert.match(source,/autoUniversalTargetReleaseRate\(brakeComplex,releasePressure,/,'Speed-target release uses actual racing-path curvature');
assert.match(source,/driverReferencePathCurvatureAt\(player\.s\+28\)/,'Release looks ahead on the planned path');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function shape(s){const x=((s%500)+500)%500;if(x<100)return .0013;if(x<150)return .0013+(x-100)*.00020;if(x<180)return .0113;return .0013;}
const ctx={Math,Number,Infinity,
 clamp,lerp:(a,b,t)=>a+(b-a)*t,
 trackData:{km:5.414,spec:{dir:'14-spain'},model:{driver:{step:5.4}}},
 player:{speed:42,lat:0,teamKey:'demo',tyres:{},autoFarKinkCache:null,autoGripEnvelopeCache:null},
 raceT:20,demoMode:true,assistMode:false,currentSession:'race',rivals:[],
 apexTyreGripScale:()=>1,apexWeatherIsWet:()=>false,teamPerformance:()=>({brake:1}),
 curvatureAt:shape,driverReferencePathCurvatureAt:()=>.007,autoPhysicalCornerSpeed:()=>26,
 envProfile:()=>({half:6.2}),apexWallishAtS:()=>true,
 poseAt:s=>{const h=s*.017;return{tx:Math.sin(h),tz:Math.cos(h)};},
 angleDiff:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),
 autoCurvatureEnvelope:shape,geometricKinkAhead:()=>({active:true,d:72,angle:Math.PI*.18}),
 driverReferenceKinkAhead:()=>({active:true,angle:Math.PI*.09}),
};
vm.createContext(ctx);vm.runInContext(code,ctx);
for(const dir of ['14-spain','06-monaco','10-belgium','13-italy','03-japan']){
 ctx.trackData.spec.dir=dir;ctx.player.autoCriticalBendCache=null;ctx.player.autoFarKinkCache=null;ctx.player.autoGripEnvelopeCache=null;
 const bend=ctx.autoCriticalBendEnvelope(0,false),kink=ctx.autoFarKinkBrakingEnvelope(0);
 assert.ok(bend.active&&Number.isFinite(bend.target)&&bend.d>0,dir+' severe tightening bend should be protected');
 assert.ok(Number.isFinite(kink.target),dir+' persistent authored kink should be protected');
 const preview=ctx.autoSoloTrajectoryPreview(0,35,{active:true,hairpin:true},false,false);
 assert.equal(preview.active,true,dir+' should have bounded hairpin preview');
 assert.ok(Math.abs(preview.correction)<=.18,'Preview stays bounded');
}
assert.equal(ctx.autoCriticalBendEnvelope(0,true).active,false,'Traffic racecraft retains priority');
ctx.curvatureAt=()=>.002;ctx.player.autoCriticalBendCache=null;
assert.equal(ctx.autoCriticalBendEnvelope(0,false).active,false,'Do not brake for an ordinary constant-radius corner');
ctx.curvatureAt=()=>.008;ctx.player.autoCriticalBendCache=null;
assert.equal(ctx.autoCriticalBendEnvelope(0,false).active,false,'Moderate constant-radius bend already has tyre envelope; no extra critical braking');
ctx.curvatureAt=()=>.014;ctx.player.autoCriticalBendCache=null;
assert.equal(ctx.autoCriticalBendEnvelope(0,false).active,true,'A genuinely severe apex keeps its universal additional braking guard');
ctx.geometricKinkAhead=()=>({active:true,d:72,angle:Math.PI*.18});
ctx.driverReferenceKinkAhead=()=>({active:false,angle:0});
ctx.player.autoFarKinkCache=null;
assert.equal(ctx.autoFarKinkBrakingEnvelope(0).target,Infinity,'Smoothed-out vertex does not force unnecessary braking');
ctx.driverReferenceKinkAhead=()=>({active:true,angle:Math.PI*.09});
ctx.curvatureAt=shape; // authored isolated kink, not a dense series of turns
ctx.rivals=[{id:1}];ctx.trackData.detailedSvg=false;ctx.player.autoFarKinkCache=null;
assert.equal(ctx.autoFarKinkBrakingEnvelope(0).target,Infinity,'Generated layouts in traffic use the existing race survival controller');
ctx.trackData.detailedSvg=true;ctx.player.autoFarKinkCache=null;
assert.ok(Number.isFinite(ctx.autoFarKinkBrakingEnvelope(0).target),'Authored SVGs keep raw-vertex protection even in populated races');
ctx.curvatureAt=()=>.014;ctx.player.autoFarKinkCache=null;
assert.equal(ctx.autoFarKinkBrakingEnvelope(0).target,Infinity,'Traffic planner owns dense multi-corner approaches on any SVG');

console.log(JSON.stringify({test:'autopilot-universal-guards',passed:true,circuits:5}));
