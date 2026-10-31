'use strict';
// AUT tight-corner preview: checks the ACTUAL production helper rather than a
// duplicated model, including angular wrap, chicane and traffic exclusions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
const a=src.indexOf('function autoSoloTrajectoryPreview('),b=src.indexOf('\nfunction demoDriverControl(',a);
assert.ok(a>=0&&b>a,'Production AUT trajectory helper is required');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
let kind='left',width=6,lat=0;
const ctx={Math,player:{lat},trackData:{km:5.414},clamp,
 envProfile:()=>({half:width}),
 angleDiff:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),
 poseAt:(s)=>{
  let theta=kind==='straight'?0:kind==='chicane'?(s<17?-.034*s:.034*(s-17)-.578):-.039*s;
  return{tx:Math.sin(theta),tz:Math.cos(theta),x:0,z:s};
 }};
vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
const p=()=>ctx.autoSoloTrajectoryPreview(0,12,{active:true,hairpin:true},false,false);
const left=p();assert.ok(left.active&&left.turn<-.16&&left.correction<0,'Turn toward left before apex');
assert.ok(ctx.angleDiff(left.heading,0)<-.20,'Anticipation turns ahead of current track tangent');
const repeat=p();assert.deepEqual(repeat,left);
assert.equal(ctx.autoSoloTrajectoryPreview(0,12,{active:true,hairpin:true},true,false).active,false,'Racing traffic uses proven passing controller');
assert.equal(ctx.autoSoloTrajectoryPreview(0,12,{active:true,hairpin:true},false,true).active,false,'Kink commit wins');
ctx.kind='chicane';kind='chicane';
assert.equal(p().active,false,'Chicane direction reversal must not be bridged');
ctx.kind='straight';kind='straight';
assert.equal(p().active,false,'Straight line untouched');
kind='left';ctx.player.lat=5.95;
assert.equal(p().active,false,'Near track edge never demand a new violent direction change');
console.log(JSON.stringify({test:'aut-trajectory-preview',leftTurnRadians:left.turn,headingRadians:left.heading,passed:true}));
