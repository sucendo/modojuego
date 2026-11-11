'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const canvas=fs.readFileSync('apex/parts/part-024-bridgefull-preview.txt','utf8');
const webgl=fs.readFileSync('apex/parts/part-025-bridgefull-trees3d-preview.txt','utf8');
const prodCanvas=fs.readFileSync('apex/parts/part-024.txt','utf8');
const prodWebgl=fs.readFileSync('apex/parts/part-025.txt','utf8');
const svg=fs.readFileSync('apex/circuits/svg/apex26_01-australia_circuito-propuesta-20261111-v2.svg','utf8');
function extract(source,name){
 const start=source.indexOf('function '+name+'(');
 assert.ok(start>=0,'Missing '+name);
 const end=source.indexOf('\n}\n',start);
 assert.ok(end>start,'Missing end of '+name);
 return source.slice(start,end+2);
}
const profile=extract(canvas,'apexSvgConcreteFenceProfile');
const canvasFence=extract(canvas,'apexSvgConcreteFenceCanvas');
const glFence=extract(webgl,'webglPushSvgConcreteFence');
const drawn=[],glDrawn=[];
let depth=50,mobile=true;
const ctx={
 Math,Number,Array,
 worldToCamera:(x,y,z)=>({x,y,z:z+depth}),
 mobilePerformanceMode:()=>mobile,
 camMix:(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}),
 drawCamLine:(...args)=>drawn.push(args),
 webglPushScreenLineDepth:(...args)=>glDrawn.push(args),
 sceneHFov:()=>1.1,sceneHorizon:()=>300,driverEyeHeight:()=>1,
 W:1000,H:600
};
vm.createContext(ctx);
vm.runInContext(profile+'\n'+canvasFence+'\n'+glFence,ctx);
const q=[[0,0,0],[8,0,0],[8,1.05,0],[0,1.05,0]];
const p=ctx.apexSvgConcreteFenceProfile(q,{},1.3,1);
assert.ok(p,'Fence profile exists');
assert.ok(Math.abs(p.T0.y-3.10)<1e-8,'Old 1.3m default must render like modern 2.05m F1 fence');
assert.ok(Math.abs(p.T0.z-50.55)<1e-8,'F1 inclined top projects 0.55m toward circuit');
const reverse=ctx.apexSvgConcreteFenceProfile(q,{},1.3,-1);
assert.ok(Math.abs(reverse.T0.z-49.45)<1e-8,'Fence overhang responds to side');
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
assert.ok(!prodCanvas.includes('apexSvgConcreteFenceProfile'),'Production Canvas stays untouched');
assert.ok(!prodWebgl.includes('webglPushSvgConcreteFence'),'Production WebGL stays untouched');
console.log(JSON.stringify({ok:true,canvasNear,glNear,melbourneConcrete:true,productionIsolated:true}));
