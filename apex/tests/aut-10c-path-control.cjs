'use strict';
// AUT 10C: production physics/technical-line helpers under deterministic inputs.
// Run: node apex/tests/aut-10c-path-control.cjs
// This is a unit regression, not a measured browser lap or WebGL test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../parts/part-026.txt'),'utf8');
function section(from,to){const i=src.indexOf(from),j=src.indexOf(to,i+from.length);assert.ok(i>=0&&j>i,'Missing '+from);return src.slice(i,j)}
const physical=section('function autoCurvatureEnvelope(','function autoEnsureRiskMemory(');
const authored=section('function autoRacingCurvatureAt(','function apexAuthoredPhysicalCornerSpeed(');
const authoredCorner=section('function apexAuthoredPhysicalCornerSpeed(','function apexAuthoredRacingSpeedLimit(');
const compound=section('function autoCompoundEntryProfile(','function autoTechnicalProfile(');
const technical=section('function autoTechnicalProfile(','function autoTechnicalDriveNow(');
const car={tyres:{gripFront:1,gripRear:1}},rival={tyres:{gripFront:1,gripRear:1}};
let hasLine=true,wet=false,route=()=>.0006;
const ctx={Math,Number,player:car,demoMode:true,assistMode:false,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,
 curvatureAt:()=>.022,bankAt:()=>0,apexAuthoredRacingProfile:()=>hasLine?{valid:true}:null,
 apexAuthoredRacingCurvatureAt:s=>hasLine?route(s):null,
 apexAuthoredRacingOffset:()=>0,poseAt:s=>({x:s,z:0,nx:0,nz:1}),
 apexWeatherIsWet:()=>wet,apexTyreGripScale:c=>Math.min(c.tyres.gripFront,c.tyres.gripRear)};
vm.createContext(ctx);vm.runInContext(physical+'\n'+authored+'\n'+authoredCorner+'\n'+compound+'\n'+technical,ctx);
const speedAuthored=ctx.autoPhysicalCornerSpeed(0),rivalSpeed=ctx.autoPhysicalCornerSpeed(0,rival),
      technicalAuthored=ctx.autoTechnicalProfile(0);
assert.ok(speedAuthored>rivalSpeed,'Smoother authored racing line should allow a controlled speed uplift');
assert.ok(speedAuthored<rivalSpeed*1.5,'Authored path must retain a residual centreline safety margin');
assert.equal(technicalAuthored.active,false,'A smooth authored trajectory should avoid phantom hairpin mode');
hasLine=false;
const rawSpeed=ctx.autoPhysicalCornerSpeed(0),technicalRaw=ctx.autoTechnicalProfile(0);
assert.ok(Math.abs(rawSpeed-rivalSpeed)<.05,'Rival/manual physics must retain legacy model');
assert.equal(technicalRaw.active,true,'Missing authored line must retain the original technical guard');
hasLine=true;
route=s=>{const x=((s%200)+200)%200;return x<20?.012:x<38?.007:x<55?.002:x<85?.0005:.0001};
const stable={risk:.04,rearCritical:0};
const exit=ctx.autoRacingExitFlow(26,stable,.08,.02,false);
assert.ok(exit>.2,'Open clean exit should free a bounded throttle headroom');
assert.equal(ctx.autoRacingExitFlow(26,stable,.08,.02,true),0,'Traffic cannot release throttle guard');
assert.equal(ctx.autoRacingExitFlow(26,{risk:.4,rearCritical:.3},.08,.02,false),0,'Unstable car cannot release throttle guard');
wet=true;
assert.ok(ctx.autoPhysicalCornerSpeed(0)<speedAuthored,'Wet tyres lower safe authored speed');
assert.match(src,/autoRacingCurvatureAt\(player\.s\+8\)/,'Braking memory must use the same curve reference');
assert.match(src,/apexAuthoredRacingHeadingAt\(player\.s\+look\)/,'Steering must preview the authored line');
assert.match(src,/technicalExitFlow:telemetryRound/,'Telemetry must record exit-flow release');
assert.match(src,/FULL_PHYSICS_V5149_AUT10C_SVG/,'AUT release should be identifiable in telemetry');
console.log(JSON.stringify({test:'aut-10c-path-control',speedAuthored,speedRaw:rawSpeed,exitFlow:exit,technicalAuthored:technicalAuthored.active,technicalFallback:technicalRaw.active,passed:true}));
