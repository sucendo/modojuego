'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const canvas=fs.readFileSync('apex/parts/part-024.txt','utf8');
const webgl=fs.readFileSync('apex/parts/part-025.txt','utf8');
const svg=fs.readFileSync('apex/circuits/svg/apex26_01-australia_circuito-propuesta-20261111-v2.svg','utf8');
function extract(source,name){
 const start=source.indexOf('function '+name+'(');
 assert.ok(start>=0,'Missing '+name);
 const end=source.indexOf('\n}\n',start);
 assert.ok(end>start,'Missing end of '+name);
 return source.slice(start,end+2);
}
const inwardFn=extract(canvas,'apexSvgConcreteFenceInward');
const profile=extract(canvas,'apexSvgConcreteFenceProfile');
const canvasFence=extract(canvas,'apexSvgConcreteFenceCanvas');
const glFence=extract(webgl,'webglPushSvgConcreteFence');
const drawn=[],glDrawn=[];
let depth=50,mobile=true;
const ctx={
 Math,Number,Array,
 worldToCamera:(x,y,z)=>({x,y,z:z+depth}),
 nearestTrackState:(x,z)=>({s:z}),
 renderRibbonFrameAt:(s)=>({x:0,z:s}),
 mobilePerformanceMode:()=>mobile,
 camMix:(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}),
 drawCamLine:(...args)=>drawn.push(args),
 webglPushScreenLineDepth:(...args)=>glDrawn.push(args),
 sceneHFov:()=>1.1,sceneHorizon:()=>300,driverEyeHeight:()=>1,
 W:1000,H:600
};
vm.createContext(ctx);
vm.runInContext(inwardFn+'\n'+profile+'\n'+canvasFence+'\n'+glFence,ctx);
const q=[[0,0,0],[8,0,0],[8,1.05,0],[0,1.05,0]];
const p=ctx.apexSvgConcreteFenceProfile(q,{},1.3,1);
assert.ok(p,'Fence profile exists');
assert.ok(Math.abs(p.T0.y-3.10)<1e-8,'Old 1.3m default must render like modern 2.05m F1 fence');
assert.ok(Math.abs(p.T0.z-50.55)<1e-8,'F1 inclined top projects 0.55m toward circuit');
const reverse=ctx.apexSvgConcreteFenceProfile(q,{},1.3,-1);
assert.ok(Math.abs(reverse.T0.z-49.45)<1e-8,'Fence overhang responds to side');
const leftQ=[[10,0,0],[10,0,8],[10,1.05,8],[10,1.05,0]];
const leftDir=ctx.apexSvgConcreteFenceInward(leftQ);
assert.ok(leftDir&&leftDir[0]<-.99,'Left wall overhang must point toward track centre');
const leftP=ctx.apexSvgConcreteFenceProfile(leftQ,{},1.3,-1,leftDir);
assert.ok(leftP.T0.x<leftP.J0.x,'Left overhang must lean inward');
const reversedLeftQ=[[10,0,8],[10,0,0],[10,1.05,0],[10,1.05,8]];
const reverseDir=ctx.apexSvgConcreteFenceInward(reversedLeftQ);
assert.ok(reverseDir&&reverseDir[0]<-.99,'Reversed SVG winding must not flip lean');
const rightQ=[[-10,0,0],[-10,0,8],[-10,1.05,8],[-10,1.05,0]];
const rightDir=ctx.apexSvgConcreteFenceInward(rightQ);
assert.ok(rightDir&&rightDir[0]>.99,'Right wall overhang must point toward track centre');
const rightP=ctx.apexSvgConcreteFenceProfile(rightQ,{},1.3,1,rightDir);
assert.ok(rightP.T0.x>rightP.J0.x,'Right overhang must lean inward');
assert.match(canvas,/fenceInward:it\.barrierKind==='CONCRETE'\?apexSvgConcreteFenceInward\(q\)/,'Cache inward direction per segment');
assert.match(canvas,/it\.side\|\|1,sg\.fenceInward/,'Canvas uses inward direction');
assert.match(webgl,/it\.side\|\|1,sg\.fenceInward/,'WebGL uses inward direction');
ctx.apexSvgConcreteFenceCanvas(q,{},0,1.3,1);
const canvasNear=drawn.length;
assert.ok(canvasNear>=15,'Canvas near fence must have rails, posts and mesh');
drawn.length=0;depth=550;
ctx.apexSvgConcreteFenceCanvas(q,{},0,1.3,1);
assert.ok(drawn.length<canvasNear,'Canvas distant fence must reduce detail');
depth=50;
ctx.webglPushSvgConcreteFence(q,{},0,1.3,1);
const glNear=glDrawn.length;
assert.ok(glNear>=15,'WebGL near fence must have rails, posts and mesh');
glDrawn.length=0;depth=550;
ctx.webglPushSvgConcreteFence(q,{},0,1.3,1);
assert.ok(glDrawn.length<glNear,'WebGL distant fence must reduce detail');
assert.match(canvas,/if\(it\.fence\)apexSvgConcreteFenceCanvas\(/,'Canvas only draws fences when enabled');
assert.match(webgl,/if\(kind==='CONCRETE'\)\{webglPushSvgConcreteFence\(/,'WebGL concrete uses F1 profile, not pale translucent sheet');
assert.match(webgl,/Math\.min\(mobile\?12:18/,'Mobile post budget must be capped');
assert.match(svg,/data-apex-barrier="CONCRETE"/,'Melbourne actually defines concrete barriers');
console.log(JSON.stringify({ok:true,canvasNear,glNear,melbourneConcrete:true,productionIsolated:true}));
