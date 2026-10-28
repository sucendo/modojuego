'use strict';
// Regression for the three user-authored vector panels and tunnel switch.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{}};
for(const file of ['js/track-sponsor-vectors.js','js/feature-sponsor-vectors.js','js/track-sponsors.js'])
 vm.runInNewContext(read(file),context,{filename:file});
const api=context.window.ApexTrackSponsors;
const panels=[
 ['apex26-start-finish', 'assets/sponsors/apex26-start-finish.svg',7.5],
 ['radiquero-pedestrian-bridge','assets/sponsors/radiquero-pedestrian-bridge.svg',7.2],
 ['mdtel-white-24m','assets/sponsors/mdtel-white-24m.svg',1800/210]
];
for(const [key,file,aspect] of panels){
 const svg=read(file),data=api.data[key];
 assert.ok(data&&data.layers.length,'Precompiled vector art missing: '+key);
 assert.equal(data.aspect,aspect,'Artwork aspect ratio: '+key);
 assert.ok(!/<image\b|<text\b|<foreignObject\b/i.test(svg),'Embedded raster/text instead of SVG contours');
 let count=0;
 for(const layer of data.layers){
   assert.match(layer.fill,/^#[a-f0-9]{6}$/i);
   assert.equal(layer.triangles.length%6,0);
   assert.ok(ArrayBuffer.isView(layer.triangles),'Vector buffer must be typed array');
   for(const v of layer.triangles)assert.ok(Number.isFinite(v)&&v>=-.03&&v<=1.03,'Art outside normalized canvas '+key);
   count+=layer.triangles.length/6;
 }
 assert.ok(count>100&&count<3000,'Vector triangle budget '+key);
}
for(const key of ['team-equipalia','sct','mdtel','sct-wall'])assert.ok(api.data[key],'Legacy sponsor lost: '+key);
assert.equal(api.wallPatternMetres('mdtel-white-24m'),8);
assert.equal(api.wallPatternMetres('sct-wall'),24);
const body2=read('parts/part-024.txt'),body3=read('parts/part-025.txt'),editor=read('parts/part-023.txt');
for(const fn of ['apexFeatureTrackBanner','apexFeatureBridgeBanner','apexFeatureTunnelBanner'])
 assert.ok(body2.includes('function '+fn+'('),'Missing common feature placement: '+fn);
for(const x of [body2,body3]){
 assert.ok(x.includes('apexFeatureBridgeBanner(it,cam,pitch,'));
 assert.ok(x.includes('apexFeatureTunnelBanner(it,cam,pitch,'));
 assert.ok(x.includes('apexFeatureTrackBanner(a.s,span,'));
}
assert.ok(editor.includes('data-apex-ad-banner'));
assert.ok(body2.includes("advertisingBanner:el.getAttribute('data-apex-ad-banner')==='true'"));
const madrid=read('circuits/svg/apex26_14-madrid-spain_2026-10-28.svg');
for(const id of ['tunnel_madrid_01','tunnel_madrid_02']){
 const match=madrid.match(new RegExp('<path id="'+id+'"[^>]*>'));
 assert.ok(match&&match[0].includes('data-apex-ad-banner="true"')&&match[0].includes('apex-tunnel-ad-enabled'),id+' opt-in missing');
}
const manifest=JSON.parse(read('circuits/manifest.json'));
assert.equal(manifest.circuits['14-spain'].svg,'svg/apex26_14-madrid-spain_2026-10-28.svg');
// Exercise the geometry helper without starting WebGL, ensuring physical locations
// and the explicit false/true tunnel flag are independent of the renderer.
const start=body2.indexOf('function apexFeatureTrackBanner('),end=body2.indexOf('function apexSponsorDraw(',start);
assert.ok(start>0&&end>start);
const drawn=[],testContext={
 window:{ApexTrackSponsors:{enabled:true,featureEnabled:true}},
 trackData:{km:5,customWorld:{structureZones:[{kind:'UNDER',sourceId:'t0',s0:800,width:24,height:5}]}},
 renderRibbonFrameAt:s=>({x:0,z:s,y:0}),ribbonWorldPoint:(q,h,side,y)=>({x:h*side,y,z:q.z}),
 worldToCamera:(x,y,z)=>({x,y,z:z+10}),
 apexSponsorDraw:(quad,key,pitch,backend,id,fraction,fullBleed)=>{drawn.push({quad,key,backend,id,fullBleed});return true},
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
 webglPushCamQuad:(...args)=>{drawn.push({kind:'band',args});},
 polyCam:(...args)=>{drawn.push({kind:'canvas-band',args});}
};
vm.runInNewContext(body2.slice(start,end),testContext);
assert.equal(testContext.apexFeatureTunnelBanner({sourceId:'t0',width:24,height:5,anchor:{s:808},advertisingBanner:false}, {},0,'webgl2'),false);
assert.equal(drawn.length,0);
assert.equal(testContext.apexFeatureTunnelBanner({sourceId:'t0',width:24,height:5,anchor:{s:808},advertisingBanner:true}, {},0,'webgl2'),true);
assert.equal(drawn.length,1);
assert.equal(drawn[0].key,'apex26-start-finish');
assert.equal(drawn[0].fullBleed,true);
assert.equal(drawn[0].quad[0].z,810);
assert.equal(drawn[0].quad[3].x,12);
const bridge={sourceId:'ped-1',pedestrianBridge:true,width:5,height:7,anchor:{y:0,s:1100},worldPath:[[-24,1200],[0,1200],[24,1200]]};
assert.equal(testContext.apexFeatureBridgeBanner(bridge,{x:0,z:1180},0,'webgl2'),true);
const radiquero=drawn.find(v=>v.key==='radiquero-pedestrian-bridge');
assert.ok(radiquero&&radiquero.fullBleed);
const width=Math.abs(radiquero.quad[3].x-radiquero.quad[0].x),
      height=Math.abs(radiquero.quad[1].y-radiquero.quad[0].y);
assert.ok(width>14&&width<28,'Centre artwork must keep physical proportions');
assert.ok(Math.abs(width/height-7.2*1.12)<.1,'Radiquero lettering must not be stretched across the full footbridge');
assert.ok(drawn.filter(v=>v.kind==='band').length>=2,'Burgundy fascia continues to bridge ends');
console.log(JSON.stringify({test:'feature-sponsor-audit',panels:3,legacy:4,tunnelOptIn:true,canvasWebgl:true,ok:true}));
