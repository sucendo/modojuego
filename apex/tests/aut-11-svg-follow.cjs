'use strict';
// AUT11 deterministic authored-line tracking regression (no browser/physics lap).
// Run: node apex/tests/aut-11-svg-follow.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.resolve(__dirname,'../parts/part-026.txt'),'utf8');
const a=src.indexOf('function autoAuthoredTrackingDemand(');
const b=src.indexOf('function apexAuthoredPhysicalCornerSpeed(',a);
assert.ok(a>=0&&b>a,'Production SVG tracking-demand function missing');
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
let grip=1,offset=s=>.055*s;
const context={Math,Number,clamp,player:{tyres:{gripFront:1,gripRear:1}},
 apexAuthoredRacingOffset:s=>offset(s),apexTyreGripScale:()=>grip};
vm.createContext(context);
vm.runInContext(src.slice(a,b),context);
const plan=(speed=48,wallish=true)=>context.autoAuthoredTrackingDemand(0,speed,wallish);
const city=plan();
assert.equal(city.smooth,true,'Continuous authored line is eligible for safe slew anticipation');
assert.ok(city.required>2.6&&city.rate>3.2,'City-speed target must not lag a smooth SVG sweep');
assert.ok(city.rate<3.56,'Urban authored slew remains bounded');
const wide=plan(48,false);
assert.ok(wide.rate>=city.rate,'Open track may use greater reference motion');
grip=.55;const worn=plan();
assert.ok(worn.rate<city.rate,'Degraded grip lowers virtual reference authority');
grip=1;
offset=()=>2.1;
assert.equal(plan().required,0,'Constant-offset SVG needs no artificial lateral sweep');
offset=s=>s<16?.07*s:2.24-.07*s;
assert.equal(plan().smooth,false,'Direction reversal must keep the technical chicane guard');
offset=()=>null;
assert.equal(plan(),null,'Missing SVG samples must fall back safely');
assert.match(src,/authoredDemand\?\.smooth&&Math\.abs\(player\.lat\)<trackEdge-1\.10/,'City exception must require smooth reference and edge room');
assert.match(src,/authoredDemand\?\.smooth&&!contactGuardActive&&learnedLong\.risk<\.32/,'Incidents and contact must prevent rate uplift');
assert.match(src,/let desiredHeading=tangentHeading\+Math\.atan\(-laneSlope\)/);
assert.match(src,/angleDiff\(heading,desiredHeading\)\*trust/,'SVG tangent must correct the final heading once');
assert.doesNotMatch(src,/angleDiff\(heading,tangentHeading\)\*\.56/,'Old double-counted tangent feedforward must be gone');
assert.match(src,/authoredRequiredLaneRateMps:/);
assert.match(src,/authoredHeadingCorrectionDeg:/);
console.log(JSON.stringify({test:'aut-11-svg-follow',passed:true,cityRateMps:city.rate,requiredMps:city.required,lowGripRateMps:worn.rate}));
