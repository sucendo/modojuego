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
assert.match(canvas,/function apexGrandstandRakedSeatV6\(band,frame,h,cam,offset=0\)/);
assert.match(canvas,/const raked3=prof\.melbourne&&frame\?apexGrandstandRakedSeatV6/);
assert.match(webgl,/const raked=prof\.melbourne&&frame\?apexGrandstandRakedSeatV6/);
assert.match(canvas,/if\(!prof\.melbourne\)for\(let j=0;j<backBand\.length/);
assert.match(webgl,/if\(!prof\.melbourne\)for\(let j=0;j<backBand\.length/);
assert.match(canvas,/if\(!prof\.melbourne\)\{polyCam\(leftWall/);
assert.match(webgl,/if\(!prof\.melbourne\)\{webglPushCamPoly\(leftWall/);
assert.match(canvas,/polyCam\(\[low3\[j\],low3\[k\],raked3\[k\],raked3\[j\]\]/,'Canvas steps cannot hide seats');
assert.match(webgl,/webglPushCamQuad\(low\[j\],low\[k\],raked\[k\],raked\[j\]/,'WebGL steps cannot hide seats');
assert.match(canvas,/apexGrandstandRakedSeatV6\(aisle,frame,h,cam,\.038\)/);
assert.match(webgl,/apexGrandstandRakedSeatV6\(aisle,frame,h,cam,\.038\)/);

assert.equal(originalSponsors.length,7,'Existing sponsor texture catalog must be unchanged');
assert.equal(tex.registerCanvas('invalid',null),null);
let drawCalls=0;
const mockCtx={
 fillStyle:null,beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},
 ellipse(){},fillRect(){drawCalls++;},scale(){}
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
 assert.equal(item.canvas.width,1024);
 assert.equal(item.canvas.height,256);
 assert.equal(tex.load(key),item,'Dynamic texture should be cached');
}
const band=[[0,8],[64,8],[64,9.6],[0,9.6]],top=band.map(p=>({x:p[0],y:10,z:p[1]}));
const textured=renderer.seat(band,top,frame,5,10);
const rakedSource=canvas.slice(canvas.indexOf('function apexGrandstandRakedSeatYV6('),canvas.indexOf('// 6A preview · Tribunas v3'));
const raked=new Function('clamp','apexStaticSceneryGroundY','worldToCamera',
 rakedSource+';return {ramp:apexGrandstandRakedSeatV6,height:apexGrandstandRakedSeatYV6};')(
 (x,a,b)=>Math.max(a,Math.min(b,x)),()=>0,(x,y,z)=>({x,y,z}));
const ramp=raked.ramp([[0,0],[64,0],[64,16],[0,16]],frame,14,{});
assert.equal(ramp.length,4);
assert.ok(Math.abs(ramp[0].y-(14*.20+.11))<.0001,'Front seating must begin near the track');
assert.ok(Math.abs(ramp[2].y-(14*.80+.11))<.0001,'Rear seating rises by full stand height');
assert.ok(ramp[2].y-ramp[0].y>8,'Seating is inclined, never a thin top strip');
assert.equal(textured.length,4);
assert.ok(textured.every(p=>Number.isFinite(p.u)&&p.v>=0&&p.v<=1),'UV must stay finite/in-bounds per tier');
assert.ok(textured[1].u>textured[0].u,'UV repeats along grandstand span');
const full={crowd:true,fill:1,label:'full'},empty={crowd:false,fill:0,label:'empty'},
 half={crowd:true,fill:.58,label:'half'};
assert.doesNotMatch(canvas,/const textureCrowd=apexGrandstandTexturesV5Ready\(prof\)&&gb\.tier<2/,
 'Canvas must layer near 3D spectators over rear texture rows');
assert.doesNotMatch(webgl,/const textureCrowd=apexGrandstandTexturesV5Ready\(prof\)&&gb\.tier<2/,
 'WebGL must layer near 3D spectators over rear texture rows');
assert.match(canvas,/rowDepth=dep\*\(prof\.melbourne\?\(\.18\+\.26\*rowFrac\)/,
 'Near 3D spectators must live in front of rear texture rows');
for(const isMobile of [false,true]){
 mobile=isMobile;
 for(let p=0;p<=3;p++){
  pressure=p;
  for(const tier of [0,1,2]){
   const strips=renderer.crowd(frame,14,{rows:10,melbourne:true},{tier},full,{});
   assert.ok(strips.length>=3&&strips.length<=6,
    'Race stands must preserve multiple rows even under max pressure: '+JSON.stringify({tier,p,isMobile,count:strips.length}));
   const depths=strips.map(s=>s[0].z);
   assert.ok(depths.every((z,i)=>z>0&&z<frame.depth&&(i===0||z>depths[i-1]+.1)),
    'Rows must be separated and distributed over the ramp');
   assert.ok(depths[depths.length-1]-depths[0]>frame.depth*(tier===2?.32:.42),
    'Crowd must span a substantial portion of the seating deck, not form a top strip');
   assert.ok(strips.every(s=>s.length===4&&s.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&Number.isFinite(q.z))),
    'No degenerate crowd quad');
   assert.ok(strips.every(s=>s[0].y>s[3].y),'Crowd silhouettes must extend above the raked deck');
   assert.ok(strips.every(s=>s[1].u>s[0].u),'Atlas pattern must repeat across grandstand width');
  }
 }
}
pressure=0;mobile=false;
const near=renderer.crowd(frame,14,{rows:10,melbourne:true},{tier:2},full,{}),
 medium=renderer.crowd(frame,14,{rows:10,melbourne:true},{tier:1},full,{}),
 partial=renderer.crowd(frame,14,{rows:10,melbourne:true},{tier:1},half,{});
assert.ok(near.length>=5,'Near stands need rear rows behind the 3D crowd');
assert.ok(medium.length>=5,'Medium stands need several rows');
assert.ok(partial.length>0&&partial.length<medium.length,'Practice occupancy must stay partial');
assert.equal(renderer.crowd(frame,14,{rows:10,melbourne:true},{tier:0},empty,{}).length,0);
pressure=3;mobile=true;
const lowPerf=renderer.crowd(frame,14,{rows:10,melbourne:true},{tier:0},full,{});
assert.ok(lowPerf.length>=3,'Pressure may trim density, never collapse to a single row');
for(const [source,start,end] of [
 [canvas,'}else if(it.type==="grandstand"){','}else if(it.type==="billboard"||it.type==="advertising"){'],
 [webgl,"}else if(it.type==='grandstand'){","}else if(it.type==='gantry'){"]
]){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i);
 new Function('for(let k=0;k<1;k++){if(false){}'+source.slice(i+1,j)+'}}');
}
console.log(JSON.stringify({test:'grandstand-texture-v5-preview',atlases:2,vertices:textured.length,
 crowdMedium:medium.length,pressureCap:lowPerf.length,previewOnly:true,ok:true}));
