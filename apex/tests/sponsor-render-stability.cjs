'use strict';
// Regression: no 24m SCT gaps, triangle-lite base, and partial near-plane logos.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vectors={window:{location:{search:''}}};vm.createContext(vectors);
for(const file of ['js/track-sponsor-vectors.js','js/feature-sponsor-vectors.js','js/track-sponsors.js'])
 vm.runInContext(read(file),vectors,{filename:file});
const api=vectors.window.ApexTrackSponsors;
const original=api.data['sct-wall'].layers.find(l=>l.part==='continuous-background');
assert.equal(original.triangles.length/6,457,'Do not change the original SVG master');
const section=api.sctMuralSlices({},0,24);
assert.equal(section.length,1);
const background=section[0].layers.find(l=>l.part==='continuous-background');
assert.equal(background.triangles.length/6,2,'Render the blue base as exactly two triangles');
assert.equal(section[0].triangles,1294,'SCT mural has 455 fewer triangles per 24m');
for(const [a,b] of [[0,8],[8,16],[16,24],[-8,0],[24,48]]){
 const parts=api.sctMuralSlices({},a,b);
 assert.ok(parts.every(s=>s.layers.find(l=>l.part==='continuous-background').triangles.length===12));
}
api.beginFrame(123);
assert.equal(api.claimMuralBackdrop(70),true);
assert.equal(api.stats.sctBaseTriangles,70);
assert.equal(api.stats.triangles,70);
assert.equal(api.claimMural('detail',1200,false),true);
assert.equal(api.stats.sctTriangles,1270);

const src=read('parts/part-024.txt');
const cut=(from,to)=>{const start=src.indexOf(from),end=src.indexOf(to,start);assert.ok(start>=0&&end>start,from);return src.slice(start,end)};
const emitted=[];
const painter={
 window:{ApexTrackSponsors:api},W:1280,H:720,renderFrameId:2,
 mobilePerformanceMode:()=>false,performance:{now:()=>0},
 projectLocal:(x,y,z)=>({x:640+x*300/z,y:360-y*300/z}),
 webglCssColor:()=>[1,1,1,1],
 webglVertexPx:(x,y,col,z)=>{assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z),'No NaN near camera');emitted.push({x,y,z});},
 camMix:(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}),
 sceneHFov:()=>1.5,sceneHorizon:()=>360,driverEyeHeight:()=>1.4,
 ctx:{save(){},restore(){},fill(){},beginPath(){},moveTo(){},lineTo(){},closePath(){}}
};
vm.createContext(painter);
vm.runInContext(cut('function clipPolyNear(','function wallPointCamera('),painter);
vm.runInContext(cut('function apexSponsorClipTriangle(','// A single physical coordinate system per wall run'),painter);
vm.runInContext(cut('function apexSponsorDraw(','const APEX_AD_BRANDS='),painter);
const a={x:-.4,y:0,z:.2},t0={x:-.4,y:1.5,z:.2},
 t1={x:1.4,y:1.5,z:6},b={x:1.4,y:0,z:6};
assert.equal(painter.apexSponsorClipTriangle(a,b,t1,0,'webgl2',[1,1,1,1],.026),true);
assert.ok(emitted.length>=3,'Partially visible triangle must survive clipping');
const n=emitted.length;
assert.equal(painter.apexSponsorClipTriangle({x:0,y:0,z:.1},{x:1,y:0,z:.2},{x:0,y:1,z:.3},0,'webgl2',[1,1,1,1],.026),false);
assert.equal(emitted.length,n);
const source={runId:'test',sponsorPatternFromM:0,sponsorPatternToM:8};
assert.equal(painter.apexSponsorContinuousWall({sponsorSource:source,sponsorPoly3:[a,t0,t1,b],side:1},0,'webgl2','team-equipalia'),true,'Wall partially behind camera must still render');
const wallVertices=emitted.length;
assert.ok(wallVertices>n,'Visible wall remains filled');
assert.equal(painter.apexSponsorDraw([a,t0,t1,b],'mdtel',0,'webgl2','partial-mdtel',1,true),true,'Partially visible individual logo must remain');
assert.ok(emitted.length>wallVertices,'Individual logo emits clipped triangles');
for(const part of ['function apexSctMuralPartLod(','api.claimMuralBackdrop(block.baseTriangles)','if(apexSctMuralPartLod(layer.part)>(block.accepted?block.lod:0))continue'])
 assert.ok(src.includes(part),'SCT no-gap LOD must stay enabled: '+part);
console.log(JSON.stringify({test:'sponsor-render-stability',sctMaster:1749,sctRendered:1294,baseTriangles:2,nearClip:true,ok:true}));
