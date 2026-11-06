'use strict';
// AUT13 production regression: forward-apex braking, clean-air SVG priority,
// true wall-clearance at urban kinks and physically bounded speed credit.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
const extract=(start,end)=>{
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing production section '+start);return src.slice(a,b);
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let wet=false,wallClear=8,grip=1,traffic=false,refK=.005;
const player={lat:0,heading:0,s:0,speed:20,yawRate:.1,slipAngle:0,teamKey:'SILVERWING',
 autoRacingLineSource:'SVG_AUTHORED',autoTrafficActive:false};
const ctx={Math,Number,player,clamp,trackData:{km:5.414},raceT:1,
 currentSession:'freepractice',apexWeatherIsWet:()=>wet,apexTyreGripScale:()=>grip,
 apexAuthoredRacingProfile:()=>({valid:true}),
 envProfile:()=>({half:6,curb:.7}),
 apexAuthoredRacingOffset:()=>0,apexAuthoredRacingHeadingAt:()=>0,
 apexAuthoredRacingCurvatureAt:()=>refK,
 apexAuthoredPhysicalCornerSpeed:s=>s>87?14:34,
 autoPhysicalCornerSpeed:()=>32,
 autoRacingCurvatureAt:()=>.014,
 curvatureAt:()=>.020,
 apexWallContextAtS:()=>({pos:wallClear,neg:wallClear}),
 autoSafeLaneLimit:()=>4.6,angleDiff:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),
 teamPerformance:()=>({brake:1}),autoRiskAt:()=>0,
 sharedDriverTrackTargetSpeed:()=>24,
 apexAuthoredRacingSpeedLimit:()=>32,
 };
vm.createContext(ctx);
vm.runInContext(
 extract('function autoTechnicalProfile(','function autoTechnicalDriveNow(')+
 extract('function autoAuthoredKinkBypass(','function autoAuthoredTrackingDemand(')+
 extract('function autoTargetSpeed(','function autoGripTrajectoryEnvelope('),ctx);
// The first threshold may occur at 4 m, while the actual minimum is 90 m ahead.
let profile=ctx.autoTechnicalProfile(0,112,5);
assert.equal(profile.firstTightD,4);
assert.ok(profile.minSafeD>80,'Actual slowest apex must be measured independently');
assert.equal(profile.minSafe,14);
// A sharp raw centreline knot must not override the smooth, safe SVG chord.
assert.equal(ctx.autoAuthoredKinkBypass(0,{active:true,d:28},false),true);
wallClear=1;assert.equal(ctx.autoAuthoredKinkBypass(0,{active:true,d:28},false),false);
wallClear=8;player.lat=2.1;assert.equal(ctx.autoAuthoredKinkBypass(0,{active:true,d:28},false),false);
player.lat=0;traffic=true;assert.equal(ctx.autoAuthoredKinkBypass(0,{active:true,d:28},traffic),false);
traffic=false;wet=true;assert.equal(ctx.autoAuthoredKinkBypass(0,{active:true,d:28},false),false);
wet=false;refK=.019;assert.equal(ctx.autoAuthoredKinkBypass(0,{active:true,d:28},false),false);
refK=.005;
// Credit from the centreline target of 24 m/s cannot exceed real SVG 32 m/s.
let target=ctx.autoTargetSpeed(null,null,.99,.98,1);
assert.ok(target>24&&target<28,'Stable authored path should earn bounded speed');
assert.ok(player.autoSvgPaceCreditMps>0);
player.autoTrafficActive=true;assert.equal(ctx.autoTargetSpeed(null,null,.99,.98,1),24);
assert.equal(player.autoSvgPaceCreditMps,0);
player.autoTrafficActive=false;wet=true;assert.equal(ctx.autoTargetSpeed(null,null,.99,.98,1),24);
wet=false;grip=.6;assert.equal(ctx.autoTargetSpeed(null,null,.99,.98,1),24);
grip=1;
assert.match(src,/const svgTrafficClear=!?\(/); // race clean-air reference is explicit
assert.match(src,/const apexD=Number\.isFinite\(technical\.minSafeD\)/);
assert.match(src,/svgKinkBypass:!!player\.autoSvgKinkBypass/);
assert.match(src,/chicaneCutRejectReason:player\.autoChicaneCutPlan/);
console.log(JSON.stringify({test:'aut-13-svg-pace',passed:true,slowestApexD:profile.minSafeD,creditTargetMps:target}));
