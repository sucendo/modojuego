'use strict';
// APEX sponsor texture regressions. SVG masters remain untouched, while the
// race renderer must never emit per-letter vector triangle meshes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const textureSource=read('js/sponsor-textures.js');
const renderSource=read('parts/part-025.txt'),worldSource=read('parts/part-024.txt');
const submitSource=read('parts/part-026.txt'),html=read('apex.html');
const assets=['team-equipalia','sct','mdtel','sct-wall',
 'apex26-start-finish','radiquero-pedestrian-bridge','mdtel-white-24m'];
assert.ok(html.includes('js/sponsor-textures.js'),'Texture loader is missing');
assert.ok(submitSource.includes('apexSponsorTextureBeginFrame()'));
assert.ok(submitSource.includes('apexSponsorTextureSubmitGl()'));
assert.ok(textureSource.includes('gl.LINEAR_MIPMAP_LINEAR'));
assert.ok(textureSource.includes('gl.generateMipmap'));
assert.ok(renderSource.includes('gl.DEPTH_TEST'));
const canvases=[];
class MockImage{
 set src(v){this._src=v;}
}
const mock={window:{},Image:MockImage,document:{createElement(tag){
 assert.equal(tag,'canvas');
 const cv={width:0,height:0,getContext:()=>({clearRect(){},drawImage(){}})};
 canvases.push(cv);return cv;
}}};
vm.runInNewContext(textureSource,mock,{filename:'sponsor-textures.js'});
const tex=mock.window.ApexSponsorTextures;
assert.deepEqual(Object.keys(tex.assets).sort(),assets.slice().sort());
for(const key of assets){
 const spec=tex.assets[key],img=tex.entry(key).image;
 assert.ok(read('assets/sponsors/'+spec[0]).includes('<svg'),key+' SVG source missing');
 assert.equal(tex.entry(key).status,'loading');
 img.onload();
 assert.equal(tex.entry(key).status,'ready');
 assert.equal(tex.load(key),tex.entry(key));
}
assert.equal(tex.state.loaded,7);
assert.equal(canvases.length,7);
const gpuFunctions=renderSource.slice(renderSource.indexOf('const apexSponsorTextureGpu='),renderSource.indexOf('function webglGradientRect('));
assert.ok(gpuFunctions.includes('gl.drawArrays(gl.TRIANGLES,0,data.length/6)'));
assert.ok(gpuFunctions.includes('gl.depthMask(false)'));
assert.ok(gpuFunctions.includes('v.z,v.u,v.v'));
assert.ok(gpuFunctions.includes('gl_Position=vec4(aPosDepth.xyz*aPosDepth.w,aPosDepth.w)'));
const wallTexture=worldSource.slice(worldSource.indexOf('function apexSponsorTexturePaint('),worldSource.indexOf('const apexSctProceduralAtlases='));
assert.ok(!wallTexture.includes('layer.triangles'));
const muralTexture=worldSource.slice(worldSource.indexOf('function apexPlanSctWallMurals('),worldSource.indexOf('function apexSponsorWallLogo('));
assert.ok(muralTexture.includes("'sct-wall'"),'SCT murals must use a texture');
assert.ok(!muralTexture.includes('sctMuralSlices('),'SCT must not build per-letter triangles');
const panelTexture=worldSource.slice(worldSource.indexOf('function apexSponsorDraw('),worldSource.indexOf('const APEX_AD_BRANDS='));
assert.ok(!panelTexture.includes('layer.triangles'));
assert.ok(panelTexture.includes('apexSponsorTexturePaint('));
const drawn=[],ctx={
 window:{ApexTrackSponsors:{enabled:true,featureEnabled:true,data:{mdtel:{aspect:2}}},ApexSponsorTextures:tex},
 W:1280,H:720,mobilePerformanceMode:()=>false,
 clipPolyNear:v=>v,
 projectCameraPoly:v=>v.map(p=>[640+p.x*20,360-p.y*20]),
 apexSponsorTextureQueueGl:(quad,key,pitch,u0,u1)=>{drawn.push({quad,key,u0,u1});return true;},
 apexSponsorTextureDrawCanvas:(quad,key,pitch,u0,u1)=>{drawn.push({quad,key,u0,u1});return true;},
 wrapDeltaS:(a,b)=>a-b,
 mod:(s,L)=>(s%L+L)%L,
 readStoredCircuitJson:id=>id==='14-spain'?{pitLane:{trackConnection:{entryTrackS:-264,exitTrackS:763}}}:null,
 trackData:{km:5},
 camMix:(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t})
};
vm.createContext(ctx);
vm.runInContext(wallTexture,ctx);
vm.runInContext(panelTexture,ctx);
const quad=[{x:0,y:0,z:12},{x:0,y:2,z:12},{x:8,y:2,z:12},{x:8,y:0,z:12}];
assert.equal(ctx.apexSponsorContinuousWall({sponsorSource:{sponsorPatternFromM:0,sponsorPatternToM:8},sponsorPoly3:quad},0,'webgl2','team-equipalia'),true);
assert.equal(drawn[0].u0,0);assert.equal(drawn[0].u1,1);
assert.equal(ctx.apexSponsorContinuousWall({sponsorSource:{sponsorPatternFromM:8,sponsorPatternToM:16},sponsorPoly3:quad},0,'webgl2','team-equipalia'),true);
assert.equal(drawn[1].u0,1);assert.equal(drawn[1].u1,2,'Physical UV must not restart at the joint');
ctx.apexSponsorDraw(quad,'mdtel',0,'webgl2','panel',1,true);
assert.equal(drawn[2].key,'mdtel');
const sctFn=muralTexture.slice(muralTexture.indexOf('const apexMadridPitWallSponsorRange='));
vm.runInContext(sctFn,ctx);
ctx.apexDrawSctWallMural({sctMuralPlan:{raw:quad,from:0,to:24,reverse:false}},0,'webgl2');
assert.equal(drawn[3].key,'sct-wall');assert.equal(drawn[3].u1,1);
// Madrid's SCT wall between the pit lane and main straight is mirrored,
// with continuous physical UVs across neighbouring 24m mural fragments.
ctx.trackData.spec={dir:'14-spain'};ctx.trackData.km=5.414;
const drawSct=(side,s,from,to,reverse,backend='webgl2')=>{
 ctx.apexDrawSctWallMural({side,s,sctMuralPlan:{raw:quad,from,to,reverse}},0,backend);
 return drawn.at(-1);
};
const rightA=drawSct(1,120,48,56,true);
const rightB=drawSct(1,128,56,64,true);
assert.equal(rightA.u0,-48/24);assert.equal(rightA.u1,-56/24);
assert.equal(rightB.u0,rightA.u1,'Pit-wall artwork must not jump at joins');
assert.equal(rightB.u1,-64/24);
const beforeFinish=drawSct(1,5250,72,80,true,'canvas2d');
assert.equal(beforeFinish.u0,-72/24);assert.equal(beforeFinish.u1,-80/24);
const otherWall=drawSct(1,1400,48,56,true);
assert.equal(otherWall.u0,-56/24);assert.equal(otherWall.u1,-48/24,'Other right walls unchanged');
const opposite=drawSct(-1,120,48,56,false);
assert.equal(opposite.u0,48/24);assert.equal(opposite.u1,56/24,'Opposite wall unchanged');
ctx.trackData.spec.dir='13-other';
const otherCircuit=drawSct(1,120,48,56,true);
assert.equal(otherCircuit.u0,-56/24);assert.equal(otherCircuit.u1,-48/24,'Other circuits unchanged');
assert.ok(!worldSource.slice(worldSource.indexOf('function apexSponsorDraw('),worldSource.indexOf('const APEX_AD_BRANDS=')).includes('webglVertexPx'));
console.log(JSON.stringify({test:'sponsor-textures',brands:assets.length,wallTriangles:2,fullSctTriangles:2,sourceSVGs:true,glBatch:true,canvasFallback:true,uvContinuity:true,ok:true}));
