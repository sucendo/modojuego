'use strict';
// 6A V15.1.1 real fragment-grain regression; no FPS or browser pixel claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const glSource=fs.readFileSync(path.join(root,'parts/part-025-bridgefull-trees3d-preview.txt'),'utf8');
const preview=fs.readFileSync(path.join(root,'perf6a-preview.html'),'utf8');
const production=fs.readFileSync(path.join(root,'apex.html'),'utf8');
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.match(production,/url=perf6a-preview\.html/);
const extract=(name,next)=>{
 const i=glSource.indexOf('function '+name+'('),j=glSource.indexOf(next,i);
 assert.ok(i>=0&&j>i,'missing '+name);
 const src=glSource.slice(i,j);new vm.Script(src);return src;
};
const fn=extract('apexPhase5GpuProgram','function apexPhase5GpuGroundError(');
const programs=[];
const compile=(gl,type,shader)=>{programs.push({type,shader});return {}};
const gl={
 VERTEX_SHADER:1,FRAGMENT_SHADER:2,LINK_STATUS:3,
 createProgram:()=>({}),attachShader(){},linkProgram(){},deleteShader(){},
 getProgramParameter:()=>true,getAttribLocation:(_,name)=>name,getUniformLocation:(_,name)=>name
};
const factory=new Function('webglCompile',fn+'return apexPhase5GpuProgram;')(compile);
const flat=factory(gl,false);
assert.equal(flat.uniforms.uRoadTexture,undefined,'other GPU surfaces remain flat');
assert.doesNotMatch(programs[1].shader,/fwidth\(|uRoadWet/,'ground shader must keep legacy performance');
programs.length=0;
const road=factory(gl,true);
assert.equal(road.uniforms.uRoadTexture,'uRoadTexture');
assert.equal(road.uniforms.uRoadWet,'uRoadWet');
assert.match(programs[0].shader,/vRoadWorldXZ=aWorld\.xz/);
assert.match(programs[1].shader,/fwidth\(world\.x\)/);
assert.match(programs[1].shader,/uRoadTexture>0\.001/);
assert.match(programs[1].shader,/asphaltHash\(floor\(world\*20\.0\)\)/);
assert.match(programs[1].shader,/uRoadWet/);
assert.match(glSource,/apexPhase5GpuProgram\(gl,true\)/);
assert.match(glSource,/gl\.uniform1f\(u\.uRoadTexture,g\.asphalt\?textureOn:0\)/);
assert.match(glSource,/apexPhase6RoadGroup\(colors\[0\],false\)/);
assert.match(glSource,/apexPhase6RoadGroup\(colors\[1\],false\)/);
assert.match(glSource,/window\.apexRoadGrainV151Enabled/);
assert.match(glSource,/new URLSearchParams\(location\.search\)\.get\('asphalt'\)!=='0'/);
const groupSrc=extract('apexPhase6RoadGroup','function apexPhase6RoadQuad(');
const s={groups:[],groupMap:new Map(),groupCount:0,groupCapacityBytes:0,indexArrayGrows:0,indexCapacity:10000};
const makeGroup=new Function('apexPhase6RoadGPU','webglCssColor',groupSrc+'return apexPhase6RoadGroup;')(s,()=>[.25,.3,.4,1]);
const asphalt=makeGroup('#33373b'),same=makeGroup('#33373b'),paint=makeGroup('#33373b',false);
assert.equal(asphalt,same,'same asphalt must be batchable');
assert.notEqual(asphalt,paint,'piano and asphalt must never share textured group');
assert.equal(s.groupCount,2);
for(let i=0;i<62;i++)makeGroup('#'+i.toString(16).padStart(6,'0'));
assert.throws(()=>makeGroup('#abcdef'),/budget exceeded/,'phase 6 colour budget must remain bounded');
console.log(JSON.stringify({phase:'V15.1.1',fragmentWorldCoords:true,realGrain:true,
 analyticLod:true,wetness:true,kerbsUntouched:true,gpuGroupBudget:true,groundUntouched:true,ok:true}));
