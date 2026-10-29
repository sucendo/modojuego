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
 apexSponsorTextureDrawCanvas:()=>true,
 wrapDeltaS:(a,b)=>a-b,
 trackData:{km:5},
 camMix:(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t})
};
vm.createContext(ctx);
vm.runInContext(wallTexture,ctx);
vm.runInContext(panelTexture,ctx);
const quad=[{x:0,y:0,z:12},{x:0,y:2,z:12},{x:8,y:2,z:12},{x:8,y:0,z:12}];
assert.equal(ctx.apexSponsorContinuousWall({side:-1,sponsorSource:{sponsorPatternFromM:0,sponsorPatternToM:8,sponsorMuralReverse:true},sponsorPoly3:quad},0,'webgl2','team-equipalia'),true);
assert.equal(drawn[0].u0,0);assert.equal(drawn[0].u1,1);
assert.equal(ctx.apexSponsorContinuousWall({side:-1,sponsorSource:{sponsorPatternFromM:8,sponsorPatternToM:16,sponsorMuralReverse:true},sponsorPoly3:quad},0,'webgl2','team-equipalia'),true);
assert.equal(drawn[1].u0,1);assert.equal(drawn[1].u1,2,'Physical UV must not restart at the joint');
ctx.apexSponsorDraw(quad,'mdtel',0,'webgl2','panel',1,true);
assert.equal(drawn[2].key,'mdtel');
const sctFn=muralTexture.slice(muralTexture.indexOf('function apexDrawSctWallMural('));
vm.runInContext(sctFn,ctx);
ctx.apexDrawSctWallMural({sctMuralPlan:{raw:quad,from:0,to:24,reverse:true}},0,'webgl2');
assert.equal(drawn[3].key,'sct-wall');assert.equal(drawn[3].u1,1);

assert.equal(ctx.apexSponsorContinuousWall({side:1,sponsorSource:{sponsorPatternFromM:0,sponsorPatternToM:8,sponsorMuralReverse:false},sponsorPoly3:quad},0,'webgl2','team-equipalia'),true);
assert.deepEqual([drawn[4].u0||0,drawn[4].u1],[0,-1],'Right-hand wall must face the asphalt, not mirror the logo');
assert.equal(ctx.apexSponsorContinuousWall({side:1,sponsorSource:{sponsorPatternFromM:8,sponsorPatternToM:16,sponsorMuralReverse:false},sponsorPoly3:quad},0,'webgl2','team-equipalia'),true);
assert.deepEqual([drawn[5].u0,drawn[5].u1],[-1,-2],'Flipped texture must be seamless on adjacent segments');
assert.equal(ctx.apexSponsorContinuousWall({side:1,sponsorS0:0,sponsorS1:8,sponsorPoly3:quad},0,'webgl2','mdtel-white-24m'),true);
assert.equal(drawn[6].u1,-1,'Procedural right wall faces inward');
assert.equal(ctx.apexSponsorContinuousWall({side:-1,sponsorS0:0,sponsorS1:8,sponsorPoly3:quad},0,'webgl2','mdtel-white-24m'),true);
assert.equal(drawn[7].u1,1,'Procedural left wall faces inward');
ctx.apexDrawSctWallMural({sctMuralPlan:{raw:quad,from:24,to:48,reverse:false}},0,'webgl2');
assert.deepEqual([drawn[8].u0,drawn[8].u1],[-1,-2],'SCT right wall reverses continuously');
ctx.apexDrawSctWallMural({sctMuralPlan:{raw:quad,from:48,to:72,reverse:false}},0,'webgl2');
assert.equal(drawn[8].u1,drawn[9].u0,'SCT seam must not jump when reversed');
ctx.apexSponsorDraw(quad,'mdtel',0,'webgl2','right-wall',1,true,true);
assert.deepEqual([drawn[10].u0,drawn[10].u1],[1,0],'Individual wall logo faces asphalt');
ctx.apexSponsorDraw([{x:12,y:0,z:12},{x:12,y:2,z:12},{x:-12,y:2,z:12},{x:-12,y:0,z:12}], 'mdtel',0,'webgl2','gantry',1,true,false);
assert.deepEqual([drawn[11].u0||0,drawn[11].u1],[0,1],'Gantry orientation is fixed, not inferred from camera X');
assert.ok(!panelTexture.includes('quad[0].x>quad[1].x'),'Camera-dependent texture flipping must not return');
// The bridge must face ONCOMING cars and keep its artwork readable even if
// the camera moves to the back of the bridge.
const bridgeSource=worldSource.slice(worldSource.indexOf('function apexFeatureBridgeBanner('),worldSource.indexOf('function apexFeatureTunnelBanner('));
const bridgeDraws=[],bridge={
 window:{ApexTrackSponsors:{featureEnabled:true}},renderRibbonFrameAt:()=>({tx:0,tz:1,nx:-1,nz:0}),
 clamp:(n,min,max)=>Math.min(max,Math.max(min,n)),
 worldToCamera:(x,y,z)=>({x,y,z:z+30}),
 camMix:ctx.camMix,
 apexSponsorDraw:(quad,key,pitch,backend,id,h,full,flipU)=>{bridgeDraws.push({quad,key,flipU});return true;},
 webglPushCamQuad:()=>{},drawCamQuadTriangles:()=>{}
};
vm.createContext(bridge);vm.runInContext(bridgeSource,bridge);
const bridgeItem={pedestrianBridge:true,worldPath:[[-15,10],[15,10]],width:5,height:7,anchor:{s:10,y:0}};
assert.equal(bridge.apexFeatureBridgeBanner(bridgeItem,{x:0,z:-25},0,'webgl2'),true);
assert.equal(bridge.apexFeatureBridgeBanner(bridgeItem,{x:0,z:45},0,'webgl2'),true);
assert.equal(bridgeDraws[0].flipU,true,'Bridge text must read from the approach');
assert.deepEqual(bridgeDraws[0],bridgeDraws[1],'Bridge front/UV must not follow the camera');

assert.ok(!worldSource.slice(worldSource.indexOf('function apexSponsorDraw('),worldSource.indexOf('const APEX_AD_BRANDS=')).includes('webglVertexPx'));
console.log(JSON.stringify({test:'sponsor-textures',brands:assets.length,wallTriangles:2,fullSctTriangles:2,sourceSVGs:true,glBatch:true,canvasFallback:true,uvContinuity:true,trackFacingBothSides:true,bridgeCameraIndependent:true,ok:true}));
