'use strict';
// APEX V15.2.7: automatically painted margins do not extend to far SVG
// walls; authored runoff keeps its geometry and material, including banking.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024-bridgefull-preview.txt'),
 world=read('parts/part-025-bridgefull-trees3d-preview.txt'),
 frame=read('parts/part-026-perf6a-preview.txt'),
 preview=read('perf6a-preview.html'),prod=read('apex.html');
assert.match(preview,/part-026-perf6a-preview\.txt/);
assert.doesNotMatch(prod,/part-026-perf6a-preview\.txt/);
function snippet(s,start,end){
 const a=s.indexOf(start),b=s.indexOf(end,a);
 assert.ok(a>=0&&b>a,'missing '+start);const block=s.slice(a,b);
 new vm.Script(block);return block;
}
const geo=snippet(core,'function apexVisualRunoffLimitV1527(', 'window.apexRoadMarginInfoV1527=');
const env={half:6,curb:.75,runoff:3.2};
const make=authoritative=>new Function('apexRoadFlatLimit','trackData',geo+
 'return apexVisualRunoffLimitV1527;')(()=>27,{customWorld:{authoritative}}); 
const svg=make(true),legacy=make(false);
assert.ok(Math.abs(svg(200,env,1)-9.95)<1e-5,'asphalt cannot extend 27m to an SVG wall');
assert.ok(Math.abs(svg(200,env,-1)-9.95)<1e-5,'symmetric visual cap');
assert.equal(legacy(200,env,1),27,'legacy tracks retain their supported shoulder');
const nearCanvas=snippet(world,'function drawNearRoadSafetyPatch(', 'function drawRoad(');
const nearWebgl=snippet(frame,'function webglPushNearPatch(', 'function webglCollectCircuitSegments(');
for(const near of [nearCanvas,nearWebgl]){
 assert.match(near,/ribbonWorldPoint\(frame,Math\.abs\(lat\),lat>=0\?1:-1\)/,
 'near track follows authored SVG edges and true banking');
 assert.doesNotMatch(near,/surfaceColor\(env\.runoffSurface/,'do not repaint flat runway margins');
 assert.doesNotMatch(near,/apexClipGenericRunoffPolygon\(/,
 'near patch no longer draws duplicate clipped runoff');
 assert.match(near,/player\.driveNetwork==='PIT'/,'do not draw near road patch over pit');
}
const corridor=snippet(core,'function apexUnifiedGroundDrawCorridor(', 'function apexRenderUnifiedAuthoredGround(');
const roadStep=snippet(core,'function roadStep(', 'function clipPolyNear(');
assert.match(corridor,/autoAsphalt=String\(a\.env\.runoffSurface\|\|''\)\.toUpperCase\(\)==='ASPHALT'/);
assert.match(corridor,/shared=autoAsphalt\?apexRoadMaterialColorV15\(seg\):null/);
assert.match(corridor,/if\(left!==null\)paint\(left,cL\)/,
 'authored SVG masking must take priority');
assert.match(corridor,/if\(right!==null\)paint\(right,cR\)/);
assert.match(roadStep,/apexVisualRunoffLimitV1527\(s,env,1\)/);
assert.match(roadStep,/apexVisualRunoffLimitV1527\(s,env,-1\)/);
assert.match(core,/outer=apexFlatRunoffPoint\(q,e,apexVisualRunoffLimitV1527\(st\.s,e,side\),side\)/);
const cut=snippet(core,'function apexRunoffRoadClipIndex(', 'function apexClipTerrainAtPit(');
assert.match(cut,/Math\.max\(w,apexVisualRunoffLimitV1527\(s,e,1\)\)/,
 'terrain cut must not extend beyond the painted left asphalt');
assert.match(cut,/Math\.max\(w,apexVisualRunoffLimitV1527\(s,e,-1\)\)/,
 'terrain cut must not extend beyond the painted right asphalt');
assert.doesNotMatch(cut,/Math\.max\(w,apexRoadFlatLimit\(s,e,1\)\)/,
 'old far-wall cuts expose the sky through unpainted shoulders');
assert.match(cut,/const mesh=apexPitMergeQuadV1526\(sg\)/,
 'pit terrain cut must use the exact tapered merge mesh');
assert.doesNotMatch(cut,/const w=sg\.width\*\.5\/sg\.len/,
 'old rectangular pit cut leaves holes after merge');
assert.match(frame,/apexPhase6QueueDynamicRoadQuad\(quad,nearColor,bias,'near'\)/);
assert.match(frame,/qa=renderRibbonFrameAt\(mod\(player\.s\+a,L\)\)/);
assert.match(core,/window\.apexRoadMarginInfoV1527=/);
console.log(JSON.stringify({test:'road-margins-v1527-preview',svgAsphaltBounded:true,
 authoredRunoffPreserved:true,nearRectanglesRemoved:true,bankAndSVGEdges:true,
 canvasAndWebGL:true,physicsUnchanged:true,prodUntouched:true,ok:true}));
