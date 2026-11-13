'use strict';
// Preview-only V15.2.1 regression: the asphalt material remains continuous across
// near-plane clips and moving ribbon endpoints, without changing tyre physics.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024-bridgefull-preview.txt'),
 render=read('parts/part-025-bridgefull-trees3d-preview.txt'),
 frame=read('parts/part-026-perf6a-preview.txt'),
 html=read('perf6a-preview.html'),prod=read('apex.html');
assert.match(html,/part-026-perf6a-preview\.txt/);
assert.doesNotMatch(prod,/part-026-perf6a-preview\.txt/);
const functionBody=(s,name,next)=>{
 const start=s.indexOf('function '+name+'('),end=s.indexOf(next,start);
 assert.ok(start>=0&&end>start,name+' missing');
 const code=s.slice(start,end);new Function(code);return code;
};
const state={active:true,dynamicBuffer:{},dynamicData:new Float32Array(16*6*7),
 dynamicVertices:0,dynamicRanges:[],dynamicQueued:[],dynamicSegments:0};
const webglCssColor=color=>color==='#123456'?[.07,.2,.33,1]:[.22,.24,.26,1];
const ribbon=s=>({
 points:[null,{x:s,y:9+s*.08,z:6+s},{x:s+7,y:8.4+s*.08,z:6+s}]
});
const fns=functionBody(render,'apexPhase6QueueDynamicRoadQuad','function apexPhase6QueueRoadBase(');
const library=new Function('apexPhase6RoadGPU','webglCssColor','apexRoadWorldNode',
 fns+'return {quad:apexPhase6QueueDynamicRoadQuad,segment:apexPhase6QueueDynamicRoadSegment};')(
 state,webglCssColor,ribbon);
const seg={a:{s:11,meshNode:-1},b:{s:14,meshNode:21}};
assert.equal(library.segment(seg,'#123456'),true,'moving end must be textured GPU geometry');
assert.equal(state.dynamicVertices,6);
assert.equal(state.dynamicQueued.length,1);
assert.equal(state.dynamicSegments,1);
assert.equal(state.dynamicRanges.length,1);
assert.equal(state.dynamicData[0],11);
assert.ok(Math.abs(state.dynamicData[1]-(9+11*.08))<1e-5); // float32 slope
assert.equal(state.dynamicData[7],18); // opposite edge of banked ribbon
assert.ok(Math.abs(state.dynamicData[8]-(8.4+11*.08))<1e-5);
const near=[{x:0,y:3,z:0},{x:7,y:2,z:0},{x:7,y:5,z:12},{x:0,y:6,z:12}];
assert.equal(library.quad(near,'#123456',.42,'near'),true);
assert.equal(state.dynamicVertices,12);
assert.equal(state.dynamicRanges.length,2);
assert.equal(state.dynamicRanges[1].depthBias,.42);
assert.equal(state.dynamicData[6],1); // opacity
assert.equal(state.dynamicData[0],11); // no overwritten moving vertices
assert.equal(library.quad([{x:0,y:0,z:0}], '#123456'),false,'wrong polygon forbidden');
state.active=false;
assert.equal(library.segment(seg,'#123456'),false,'disabled batch stays in CPU fallback');
const staticCode=functionBody(render,'apexPhase6QueueRoadBase','function apexPhase6SealRoad(');
const s={active:true,queued:[],cpuSegments:0,gpuSegments:0};
const batches=[];
const check=new Function('apexPhase6RoadGPU','apexPhase6RoadSegmentId','webglCssColor',
 'apexPhase6RoadQuad','apexPhase6RoadGroup','shadeColor','window',staticCode+
 'return apexPhase6QueueRoadBase;')(
 s,()=>1,webglCssColor,(group,...indices)=>batches.push({group,indices}),
 (color,asphalt=true)=>({color,asphalt}),(color,n)=>color+n,{apexRoadGrainV151Enabled:true});
const step=z=>({meshNode:1,v:{l:{z},r:{z},lo:{z},ro:{z}},curb:{left:false,right:false}});
const crosses={a:step(-1.3),b:step(12)};
assert.equal(check(crosses,['#ffffff','#aa0000'],'#123456',false,false),true,
 'banked slopes crossing the near plane must no longer be painted flat');
assert.equal(batches.length,1,'GPU asphalt with procedural shader has one continuous base strip');
assert.equal(batches[0].group.asphalt,true);
const behind={a:step(-10),b:step(.2)};
assert.equal(check(behind,['#ffffff','#aa0000'],'#123456',false,false),false,
 'fully invisible road faces stay culled');
assert.match(core,/apexPhase6QueueDynamicRoadSegment\(seg,road\)/);
assert.doesNotMatch(core.slice(core.indexOf('function apexWebglRoadBase('),core.indexOf('function apexSurfaceTintV152(')),
 /webglPushCamQuad\(V0\.l,lA,lB,V1\.l/,'hard three-band fallback has been retired');
assert.match(render,/gl\.bufferSubData\(gl\.ARRAY_BUFFER,0,s\.dynamicData\.subarray/);
assert.match(render,/gl\.drawArrays\(gl\.TRIANGLES,range\.first,range\.count\)/);
assert.doesNotMatch(frame,/function webglPushNearPatch/,'no overlapping near-camera road quad');
assert.match(render,/const node=mod\(anchor\+sign\*i,count\)/);
assert.match(frame,/webglPushCamQuad\(V0\.l,V0\.li,V1\.li,V1\.l/);
console.log(JSON.stringify({test:'road-near-grain-v1521-preview',gpuNearClipping:true,
 movingEndpoints:true,trueBankAndGrade:true,fixedNearMesh:true,
 legacyBandingRemoved:true,dynamicBudget:true,previewOnly:true,ok:true}));
