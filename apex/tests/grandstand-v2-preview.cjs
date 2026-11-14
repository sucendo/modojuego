'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const canvas=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8');
const webgl=fs.readFileSync(path.join(root,'parts/part-025.txt'),'utf8');
const preview=fs.readFileSync(path.join(root,'apex.html'),'utf8');
const production=fs.readFileSync(path.join(root,'apex.html'),'utf8');

// Tribunas v3: el arriostramiento debe tener presupuesto acotado y mismo backend.
assert.match(canvas,/function apexGrandstandTrussV3\(it,frame,h,gb\)/);
assert.match(canvas,/if\(!it\|\|!frame\|\|!gb\|\|!gb\.braces\|\|gb\.tier<1\)return\[\]/);
assert.match(canvas,/trackData\?\.spec\?\.dir==='01-australia'/);
assert.match(canvas,/railPosts=Math\.min\(mobilePerformanceMode\(\)\?5:8/);
assert.match(webgl,/railPosts=Math\.min\(mobilePerformanceMode\(\)\?5:8/);
assert.match(canvas,/for\(const brace of apexGrandstandTrussV3\(it,frame,h,gb\)\)/);
assert.match(webgl,/for\(const brace of apexGrandstandTrussV3\(it,frame,h,gb\)\)/);
// Público v4: regresión de alturas, carrera rápida y ambos renderizadores.
assert.match(canvas,/seatY=apexGrandstandSeatTopV4\(h,prof,gb,rowDepth\/dep\)/);
assert.match(canvas,/seatY=apexGrandstandSeatTopV4\(h,prof,gb,depth\/dep\)/);
assert.match(webgl,/apexGrandstandPreviewCrowd\(it,prof,frame,h,gb,att\)/);
assert.match(webgl,/apexGrandstandCrowdMosaic\(it,prof,frame,h,gb,att\)/);
const seatStart=canvas.indexOf('function apexGrandstandSeatTopV4(');
const seatEnd=canvas.indexOf('function apexGrandstandAttendanceProfile(){',seatStart);
const seatTop=new Function(canvas.slice(seatStart,seatEnd)+';return apexGrandstandSeatTopV4;')();
for(const tier of [0,1,2]){
 const gb={tier},prof={rows:10},h=14;
 for(const depthFraction of [.24,.38,.51,.65,.80]){
  const y=seatTop(h,prof,gb,depthFraction);
  assert.ok(y>=h*(.20+.60*depthFraction)+.07,'crowd must be above step surface');
  assert.ok(y<=h*.81,'crowd should stay below grandstand roof');
 }
}
assert.doesNotMatch(canvas,/pressure>=3&&!mid\)return\[\]/);
const start=canvas.indexOf('const apexGrandstandCrowdMosaicStats=');
const end=canvas.indexOf('function apexGrandstandFrameStats(it){',start);
assert.ok(start>=0&&end>start,'shared mosaic renderer is missing');
let pressure=0,groundCalls=0,mobile=true;
const window={};
const factory=new Function('window','mobilePerformanceMode','apexSceneDetailBudget',
 'apexGrandstandSeatVisual','apexGrandstandFrameXZ','apexStaticSceneryGroundY','trackData','apexGrandstandSeatTopV4',
 canvas.slice(start,end)+'\nreturn apexGrandstandCrowdMosaic;');
const draw=factory(window,()=>mobile,()=>({pressure}),
 (prof,ri,rows,ci,att)=>({occupied:att.fill>.01&&((ci+ri)%5!==0),top:'#c45a41'}),
 (frame,u,depth)=>[frame.span*u,depth],
 ()=>{groundCalls++;return 1.5;},{customWorld:{_apexGroundStamp:'test'}},seatTop);
const frame={span:70,depth:19,edge:{a:[0,0],b:[70,0],nx:0,nz:1}};
const stand={},prof={style:'grandstand_covered',rows:10};
const full={crowd:true,fill:1,label:'full'},empty={crowd:false,fill:0,label:'empty'};
const mid=draw(stand,prof,frame,14,{tier:1},full);
assert.ok(mid.length>0&&mid.length<=21,'mobile medium LOD must have a small, visible mosaic');
assert.ok(mid.every(p=>p.quad.length===4&&p.quad.every(v=>v.length===3)));
const previous=groundCalls;
assert.equal(draw(stand,prof,frame,14,{tier:1},full),mid,'mosaic must reuse cached world geometry');
assert.equal(groundCalls,previous,'cached mosaic must not sample terrain again');
const far=draw(stand,prof,frame,14,{tier:0},full);
assert.ok(far.length>0&&far.length<=12,'far mobile crowd should remain visible with <=12 tiles');
assert.equal(draw(stand,prof,frame,14,{tier:0},empty).length,0,'empty stands must remain empty');
pressure=2;
assert.ok(draw(stand,prof,frame,14,{tier:0},full).length<=4,'under load far crowd should shrink');
pressure=3;
assert.ok(draw(stand,prof,frame,14,{tier:0},full).length>0&&draw(stand,prof,frame,14,{tier:0},full).length<=4,'under severe load distant spectators remain visible at minimum LOD');
assert.ok(draw(stand,prof,frame,14,{tier:1},full).length<=5,'under severe load medium crowd must be bounded');
mobile=false;pressure=0;
assert.ok(draw({},prof,frame,14,{tier:1},full).length<=36,'desktop medium budget exceeded');

for(const [source,startBranch,endBranch] of [
 [canvas,'}else if(it.type==="grandstand"){','}else if(it.type==="billboard"||it.type==="advertising"){'],
 [webgl,"}else if(it.type==='grandstand'){","}else if(it.type==='gantry'){"]
]){
 const a=source.indexOf(startBranch),b=source.indexOf(endBranch,a);
 assert.ok(a>=0&&b>a,'missing SVG grandstand branch');
 const body=source.slice(a+1,b);
 new Function('for(let k=0;k<1;k++){if(false){}'+body+'}}');
 assert.match(body,/apexGrandstandCrowdMosaic\(it,prof,frame,h,gb,att\)/);
 assert.match(body,/apexGrandstandPreviewCrowd\(it,prof,frame,h,gb,att\)/);
 assert.match(body,/const hasVip=!!\(it\.vip\|\|it\.hasVip/,'ordinary covered stands must not be blocked by huge VIP rooms');
 assert.match(body,/fasciaL/,'canopy should have a visible front edge');
 assert.match(body,/railH/,'stand front rail should remain visible near track');
 assert.match(body,/if\(prof\.covered\)\{/,'roof should remain at distance');
}
assert.match(canvas,/gb\.tier!==2\)return\[\]/,'only near spectators should use individual polygons');
assert.ok(window.apexGrandstandCrowdMosaicInfo().hits>0);
console.log(JSON.stringify({test:'grandstand-v2-preview',mobileMid:mid.length,mobileFar:far.length,
 cached:true,attendance:true,pressureThrottling:true,canvas:true,webgl:true,previewOnly:true,ok:true}));
