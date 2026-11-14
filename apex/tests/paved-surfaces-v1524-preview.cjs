'use strict';
// Preview-only V15.2.4: separate real asphalt from painted markings.
// Offline static/geometry checks; no claim of verified mobile FPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024-bridgefull-preview.txt'),
 render=read('parts/part-025-bridgefull-trees3d-preview.txt'),
 frame=read('parts/part-026-perf6a-preview.txt'),
 preview=read('perf6a-preview.html'),production=read('apex.html');
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.match(production,/url=perf6a-preview\.html/);
function extract(src,start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Missing '+start);
 const block=src.slice(a,b);new vm.Script(block);return block;
}
const kind=extract(render,'function apexSurfaceMaterialKindV152(', 'function apexPavedExtraGpuZonesV1524(');
const material=new Function(kind+'return apexSurfaceMaterialKindV152;')();
for(const name of ['ASPHALT','ROAD','CITY','PLAZA','SERVICE','PIT','PITLANE','PIT_WORK','PADDOCK','PARKING','APRON','TARMAC'])
 assert.equal(material(name),2,name+' must be paved');
for(const name of ['CONCRETE','GRAVEL','SAND','GRASS','MARKING','WATER'])
 assert.notEqual(material(name),2,name+' is not asphalt');
const extraSrc=extract(render,'function apexPavedExtraGpuZonesV1524(', 'function apexPhase5PrepareGpuGround(');
const road={type:'road',color:'#747c83',_apexStaticBatch:{roadQuads:[
 [[0,1,0],[5,1,0],[5,1,10],[0,1,10]]]}};
const mark={type:'marking',color:'#ffffff'};
const trackData={customWorld:{pitNetwork:{runs:[{points:[]}],
 serviceLayout:{offset:10,start:0,end:100}}}};
const extra=new Function('trackLandmarks','trackData','webglCssColor','shadeColor',
 'apexPitSegments','apexPitWorkWidthAt','apexRoadSvgNormalizeColorV15','apexPitMergeQuadV1526','apexRoadSvgBaseColorV15',extraSrc+'return apexPavedExtraGpuZonesV1524;')(
 ()=>[road,mark],trackData,()=>[.3,.35,.4,1],color=>color,
 ()=>[{x1:0,z1:0,y1:1,x2:20,z2:0,y2:1,len:20,width:6,s1:0,s2:20}],
 ()=>3,color=>color,sg=>({quad:[
  {x:sg.x1,y:sg.y1+.012,z:sg.z1+3},{x:sg.x1,y:sg.y1+.012,z:sg.z1-3},
  {x:sg.x2,y:sg.y2+.012,z:sg.z2-3},{x:sg.x2,y:sg.y2+.012,z:sg.z2+3}
 ]}),()=> '#555b61')();
assert.equal(extra.pit,true,'exact pit needs its own textured base');
assert.equal(extra.roads.size,1,'authored city roads are compiled once');
assert.ok(extra.roads.has(road));
assert.equal(extra.extraTriangles,6,'road, pitlane and work apron each add two triangles');
assert.deepEqual(extra.zones.map(z=>z.kind),[2,3,2],
 'pit surface uses weather-tinted asphalt; pit-work has distinct colour');
assert.ok(extra.zones.every(z=>z.tris.every(t=>t.every(v=>v.length===3))));
assert.match(render,/Markings are own 3-D quads assembled by collectExactPitRenderItems/);
assert.match(render,/if\(it\.type==='road'&&apexPhase5GroundGPU\.atlas===groundAtlas/);
assert.match(render,/if\(!seg\?\._apexPitGpuV1524\)webglPushCamQuad/);
assert.match(render,/uPavedDark/);
assert.match(render,/vGroundKind>2\.5/);
assert.match(render,/apexPhase6QueueDynamicRoadQuad\(pts,apexPitAsphaltColorV152\(\),-\.022,'pitlane'\)/);
assert.match(frame,/apexPhase6QueueLegacyPitAsphalt\(roadSegments\)/);
assert.match(frame,/if\(trackData\?\.customWorld\?\._apexUnifiedGroundAtlas\)renderProfileMeasure/);
assert.match(core,/apexSurfaceTintV152\(item\.material\.kind\|\|'PITLANE'/);
assert.match(core,/function apexRenderUnifiedAuthoredGround\(/);
assert.match(core,/if\(!atlas\.svgFaces\)return false/);
console.log(JSON.stringify({test:'paved-surfaces-v1524-preview',roads:true,exactPit:true,pitWork:true,
 legacyPit:true,authoredColours:true,markingsUntouched:true,svgAsphaltAliases:true,
 previewOnly:true,ok:true}));
