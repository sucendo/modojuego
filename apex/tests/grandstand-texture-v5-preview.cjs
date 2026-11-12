'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const canvas=read('parts/part-024-bridgefull-preview.txt'),
 webgl=read('parts/part-025-bridgefull-trees3d-preview.txt'),
 preview=read('perf6a-preview.html'),production=read('apex.html'),
 sponsor=read('js/sponsor-textures.js');
assert.match(preview,/part-024-bridgefull-preview\.txt/);
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.doesNotMatch(production,/part-024-bridgefull-preview|part-025-bridgefull-trees3d-preview/);
assert.match(sponsor,/function registerCanvas\(key,canvas\)/);
assert.match(sponsor,/registerCanvas,ensureTexture/);
assert.match(sponsor,/gl\.LINEAR_MIPMAP_LINEAR/);
assert.match(webgl,/apexGrandstandTextureQueuePolyGl\(/);
assert.match(webgl,/apexGrandstandTextureQueuePolyGl\(strip,/);
assert.match(webgl,/if\(!textureCrowd\|\|!texturedStrips\)for\(const tile of apexGrandstandCrowdMosaic/);
assert.match(canvas,/apexGrandstandTextureDrawPolyCanvas\(/);
assert.match(canvas,/apexGrandstandTextureV5Keys\.crowd,pitch/);
assert.match(canvas,/apexGrandstandTextureV5Keys\.seats,pitch/);
const a=canvas.indexOf('const apexGrandstandTextureV5Keys='),b=canvas.indexOf('// 6A preview · Tribunas v3',a);
assert.ok(a>=0&&b>a,'Grandstand texture v5 functions must be shared before both render paths');
const snippet=canvas.slice(a,b);
const textureSource=sponsor.replace('(function(global){','(function(global){');
const textureWindow={},context={window:textureWindow,Image:undefined};
vm.runInNewContext(textureSource,context);
const tex=textureWindow.ApexSponsorTextures;
const originalSponsors=Object.keys(tex.assets);
assert.equal(originalSponsors.length,7,'Existing sponsor texture catalog must be unchanged');
assert.equal(tex.registerCanvas('invalid',null),null);
let drawCalls=0;
const mockCtx={
 fillStyle:null,beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},
 ellipse(){},fillRect(){drawCalls++;}
};
const document={createElement:()=>({width:0,height:0,getContext:()=>mockCtx})};
const frame={span:64,depth:16,edge:{a:[0,0],b:[64,0],tx:1,tz:0,nx:0,nz:1}};
const seatTop=(h,p,g,t)=>h*(.2+.6*Math.ceil(Math.max(.001,t)*10)/10)+.10;
let pressure=0,mobile=false;
const factory=new Function('window','document','trackData','apexGrandstandSeatTopV4',
 'apexGrandstandWorldCam','apexSceneDetailBudget','mobilePerformanceMode','clamp',
 snippet+'\nreturn {ready:apexGrandstandTexturesV5Ready,seat:apexGrandstandSeatTextureV5Vertices,crowd:apexGrandstandCrowdTextureV5Strips,stats:apexGrandstandTextureV5Stats,keys:apexGrandstandTextureV5Keys};');
const trackData={spec:{dir:'01-australia'}};
const renderer=factory(textureWindow,document,trackData,seatTop,
 (frame,u,depth,y)=>({x:u*frame.span,y,z:depth}),()=>({pressure}),()=>mobile,(x,a,b)=>Math.max(a,Math.min(b,x)));
assert.equal(renderer.ready({melbourne:false}),false);
assert.equal(renderer.ready({melbourne:true}),true);
assert.equal(renderer.ready({melbourne:true}),true);
assert.equal(renderer.stats.atlasBuilds,1,'Texture atlases must be generated once');
assert.ok(drawCalls>100,'Real seat/crowd pixels must be rasterized');
assert.equal(Object.keys(tex.assets).length,originalSponsors.length);
for(const key of Object.values(renderer.keys)){
 const item=tex.entry(key);
 assert.equal(item.status,'ready');
 assert.equal(item.canvas.width,512);
 assert.equal(item.canvas.height,128);
 assert.equal(tex.load(key),item,'Dynamic texture should be cached');
}
const band=[[0,8],[64,8],[64,9.6],[0,9.6]],top=band.map(p=>({x:p[0],y:10,z:p[1]}));
const textured=renderer.seat(band,top,frame,5,10);
assert.equal(textured.length,4);
assert.ok(textured.every(p=>Number.isFinite(p.u)&&p.v>=0&&p.v<=1),'UV must stay finite/in-bounds per tier');
assert.ok(textured[1].u>textured[0].u,'UV repeats along grandstand span');
const full={crowd:true,fill:1,label:'full'},empty={crowd:false,fill:0,label:'empty'};
const near=renderer.crowd(frame,14,{rows:10},{tier:2},full,{}),
 medium=renderer.crowd(frame,14,{rows:10},{tier:1},full,{});
assert.equal(near.length,0,'Near stands use 3D spectators, not crowd cards');
assert.ok(medium.length>0&&medium.length<=3,'Medium stands need only 3 strips');
assert.equal(renderer.crowd(frame,14,{rows:10},{tier:0},empty,{}).length,0);
pressure=3;
assert.ok(renderer.crowd(frame,14,{rows:10},{tier:0},full,{}).length<=1,'Pressure should cap far crowd to 1 strip');
assert.ok(renderer.crowd(frame,14,{rows:10},{tier:0},full,{}).length>0,'Far races must remain populated');
for(const [source,start,end] of [
 [canvas,'}else if(it.type==="grandstand"){','}else if(it.type==="billboard"||it.type==="advertising"){'],
 [webgl,"}else if(it.type==='grandstand'){","}else if(it.type==='gantry'){"]
]){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i);
 new Function('for(let k=0;k<1;k++){if(false){}'+source.slice(i+1,j)+'}}');
}
console.log(JSON.stringify({test:'grandstand-texture-v5-preview',atlases:2,vertices:textured.length,
 crowdMedium:medium.length,pressureCap:1,previewOnly:true,ok:true}));
