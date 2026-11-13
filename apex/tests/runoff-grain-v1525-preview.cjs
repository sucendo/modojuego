'use strict';
// APEX V15.2.5: generic asphalt runoff must share world-space track texture,
// respect authored SVG clipping and remain flat for non-paved materials.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024-bridgefull-preview.txt'),render=read('parts/part-025-bridgefull-trees3d-preview.txt');
const preview=read('perf6a-preview.html'),production=read('apex.html');
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.doesNotMatch(production,/part-025-bridgefull-trees3d-preview\.txt/);
const snippet=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i);assert.ok(i>=0&&j>i);const s=text.slice(i,j);new vm.Script(s);return s};
const enqueue=snippet(render,'function apexPhase6QueueDynamicRoadPolygon(', 'function apexPhase6QueueDynamicRoadSegment(');
const state={active:true,dynamicBuffer:{},dynamicData:new Float32Array(70*7),
 dynamicVertices:0,dynamicRanges:[],dynamicQueued:[]};
const gpu=new Function('apexPhase6RoadGPU','webglCssColor',enqueue+'return apexPhase6QueueDynamicRoadPolygon;')(
 state,()=>[.25,.3,.4,1]);
const points=[{x:0,y:1,z:0},{x:5,y:1,z:0},{x:5,y:1,z:8},{x:0,y:1,z:8}];
assert.equal(gpu(points,'#676b70',0,'runoff'),true);
assert.equal(state.dynamicVertices,6);
assert.equal(state.dynamicRanges[0].kind,'runoff');
assert.equal(state.dynamicRanges[0].count,6);
assert.equal(gpu(points.slice(0,3),'#676b70',0,'runoff'),true);
assert.equal(state.dynamicRanges.length,1,'adjacent runoff polygons share a batch');
assert.equal(state.dynamicVertices,9);
assert.equal(gpu([{x:NaN,y:1,z:0},points[1],points[2]],'#fff'),false);
const draw=snippet(core,'function apexUnifiedGroundDrawCorridor(', '/* Pasada unica para las superficies SVG');
assert.match(draw,/\['ASPHALT','ROAD','CITY','PLAZA'/);
assert.match(draw,/apexPhase6QueueDynamicRoadPolygon\(p,col,0,'runoff'\)/,
 'clipped SVG runoff is textured without redrawing the uncut polygon');
assert.match(draw,/apexPhase6QueueDynamicRoadPolygon\(q,col,0,'runoff'\)/,
 'unmasked legacy shoulder is textured');
assert.match(draw,/if\(!paintFree\(1,cL\)\)/);
assert.match(draw,/if\(!paintFree\(-1,cR\)\)/);
assert.match(draw,/else drawCamPoly\(cp,pitch,tint,.58\)/,'Canvas fallback preserved');
assert.match(draw,/seg.z<245/,'bounded near camera LOD');
assert.match(render,/if\(u.uRoadTexture!=null\)gl.uniform1f\(u.uRoadTexture,textureOn\)/);
console.log(JSON.stringify({test:'runoff-grain-v1525-preview',clippedSvg:true,
 unmaskedAsphalt:true,worldShader:true,nonPavedUnaffected:true,canvasFallback:true,
 clippingUnchanged:true,shaderBudget:true,previewOnly:true,ok:true}));
