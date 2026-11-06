'use strict';
// AUT12: chicane cut must be faster only for a verified, kerbed, smooth,
// correctly tracked SVG chord. No live browser dependency.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.resolve(__dirname,'../parts/part-026.txt'),'utf8');
const begin=src.indexOf('function autoChicaneCutOpportunity(');
const end=src.indexOf('function autoAuthoredTrackingDemand(',begin);
assert.ok(begin>0&&end>begin,'AUT12 production chicane classifier is missing');
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
let wet=false,wall=false,curb=.8,grip=1,authoredK=.004,offset=3.55,traffic=false;
const context={Math,Number,player:{lat:3.55,heading:0,autoChicaneCutCache:null},
 trackData:{km:5.4},raceT:1,clamp,angleDiff:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),
 apexWeatherIsWet:()=>wet,apexAuthoredRacingProfile:()=>({valid:true}),
 apexTyreGripScale:()=>grip,envProfile:()=>({half:6,curb}),
 apexAuthoredRacingOffset:()=>offset,apexAuthoredRacingCurvatureAt:()=>authoredK,
 curvatureAt:s=>s<48?.014:-.014,apexWallishAtS:()=>wall,autoSafeLaneLimit:()=>4.15,
 apexAuthoredRacingHeadingAt:()=>0};
vm.createContext(context);vm.runInContext(src.slice(begin,end),context);
const probe=()=>{context.raceT+=.12;return context.autoChicaneCutOpportunity(0,traffic);};
assert.equal(probe().active,true,'A safe straightened kerb-to-kerb chicane must be eligible');
traffic=true;assert.equal(probe(),null,'Traffic must disable shortcut');traffic=false;
wet=true;assert.equal(probe(),null,'Wet kerbs must disable shortcut');wet=false;
wall=true;assert.equal(probe().active,false,'A wall within the target corridor must disable shortcut');wall=false;
curb=0;assert.equal(probe().active,false,'No kerb, no cut');curb=.8;
authoredK=.019;assert.equal(probe().active,false,'Tight SVG path must not bypass normal slow corners');authoredK=.004;
offset=4.8;assert.equal(probe().active,false,'Unsafe outside-edge path must not cut');offset=3.55;
context.player.lat=1.2;assert.equal(probe().active,false,'Car missing the SVG cannot claim the extra speed');context.player.lat=3.55;
context.player.heading=.7;assert.equal(probe().active,false,'Heading error must keep conservative caps');context.player.heading=0;
grip=.52;assert.equal(probe().active,false,'Low tyre grip forbids aggressive kerb crossing');grip=1;
assert.equal(probe().active,true,'Normal dry, aligned state should restore the safe cut');
assert.match(src,/const chicaneCut=autoChicaneCutOpportunity\(player\.s,!!raceTraffic\.active\)/);
assert.match(src,/!chicaneCut\?\.active&&geometryKink\.d<kinkApproachD/);
assert.match(src,/const uplift=Math\.min\(9,baseline\*\.14\)/);
assert.match(src,/autoChicaneCutActive=!!chicaneCut\?\.active/);
console.log(JSON.stringify({test:'aut-12-kerb-chicane',passed:true}));
