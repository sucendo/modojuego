'use strict';
// Regression: authored SVG barriers must be rendered by visible segment, not
// culled by one anchor along a long polyline. No procedural walls are added.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8');
const render=fs.readFileSync(path.join(root,'parts/part-025.txt'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'circuits/manifest.json'),'utf8'));

function getFunction(source,name){
 const start=source.indexOf('function '+name+'(');
 assert.ok(start>=0,'Missing production function: '+name);
 const end=source.indexOf('\n}\n',start);
 assert.ok(end>start,'Could not isolate production function: '+name);
 return source.slice(start,end+2);
}
assert.match(core,/barrierChunks=\[\]/,'Compile per-chunk barrier visibility bounds');
assert.match(core,/barrierSegments:segments/,'Canvas must preserve actual visible segments');
assert.match(render,/barrierVisible=it\.type==='barrier'\?apexVisibleBarrierSegments/,'WebGL segment selection missing');
assert.match(render,/it\.type!=='barrier'&&!groundVisual/,'WebGL still uses landmark-anchor frustum for barriers');
assert.match(render,/segs=barrierVisible/,'WebGL must render selected barrier segments');
assert.match(render,/barrierLod=webglCircuitLod\('barrier'/,'LOD must be applied per barrier segment');

const first={q:[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],bound:{x:0,z:0,r:1}};
const second={q:[[100,0,0],[101,0,0],[101,1,0],[100,1,0]],bound:{x:100,z:0,r:1}};
const barrier={
 type:'barrier',anchor:{x:-9999,s:4900},
 _apexStaticBatch:{
  barrierSegments:[first,second],
  barrierChunks:[{start:0,end:1,bound:first.bound},{start:1,end:2,bound:second.bound}]
 }
};
const context={
 apexBuildLandmarkStaticBatch(){throw Error('Unexpected batch rebuild')},
 apexStaticBoundInView(bound,cam){return Math.abs(bound.x-cam.x)<15;}
};
vm.runInNewContext(getFunction(core,'apexVisibleBarrierSegments')+'\nthis.select=apexVisibleBarrierSegments;',context);
assert.deepEqual(Array.from(context.select(barrier,{x:0},1200)),[first],
 'First segment must be visible even with remote landmark anchor');
assert.deepEqual(Array.from(context.select(barrier,{x:100},1200)),[second],
 'Second segment must remain visible when first/anchor is far away');
assert.equal(context.select(barrier,{x:250},1200).length,0,
 'Truly off-camera segments must be culled individually');

const sectors=Array.from({length:64},()=>({landmarks:[]}));
const data={
 trackData:{compiledCircuit:{sectors,sectorM:100,skylineLandmarks:[]},km:6.4,customWorld:null},
 player:{s:100},mod:(n,m)=>((n%m)+m)%m,lerp:(a,b,t)=>a+(b-a)*t,
 mobileRenderPressure:()=>1,mobilePerformanceMode:()=>false,
 apexInspectionFullScene:()=>false,apexIsCurbAuthoringMark:()=>false,
 apexStaticBatchPerf:{entryCacheHits:0,entryCacheMisses:0},
 apexNearbyGroundSurfaceIds:()=>[]
};
vm.runInNewContext(getFunction(core,'apexCompiledLandmarkEntries')+'\nthis.entries=apexCompiledLandmarkEntries;',data);
const normal={type:'tree',anchor:{s:4900}};
const selected=data.entries([normal,barrier]);
assert.deepEqual(Array.from(selected,e=>e.i),[1],
 'Long barrier must be selected even if its anchor is in a distant sector');

const expected={
 '01-australia':'svg/apex26_01-australia_circuito-propuesta-20261110.svg',
 '14-spain':'svg/apex26_14-spain_circuito-propuesta-20261110.svg'
};
for(const [id,svgPath] of Object.entries(expected)){
 assert.equal(manifest.circuits[id].svg,svgPath);
 const svg=fs.readFileSync(path.join(root,'circuits',svgPath),'utf8');
 assert.match(svg,/<svg\b/);
 assert.match(svg,/data-apex-role="track-centerline"/);
 assert.match(svg,/data-apex-role="drivable-area"/);
 assert.equal((svg.match(/<image\b/g)||[]).length,0);
}
console.log(JSON.stringify({test:'svg-barrier-visibility',selectedSegments:2,geometryPreserved:true,ok:true}));
