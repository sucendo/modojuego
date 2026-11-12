'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const canvas=fs.readFileSync(path.join(root,'parts/part-024-bridgefull-preview.txt'),'utf8');
const webgl=fs.readFileSync(path.join(root,'parts/part-025-bridgefull-trees3d-preview.txt'),'utf8');
const preview=fs.readFileSync(path.join(root,'perf6a-preview.html'),'utf8');
const production=fs.readFileSync(path.join(root,'apex.html'),'utf8');

assert.match(preview,/part-024-bridgefull-preview\.txt/);
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.match(preview,/trees3d-mobile-preview\.js/);
assert.doesNotMatch(production,/part-024-bridgefull-preview|part-025-bridgefull-trees3d-preview/);
const a=canvas.indexOf('const apexGrandstandCrowdPreviewStats=');
const b=canvas.indexOf('function apexGrandstandFrameStats(it){',a);
assert.ok(a>=0&&b>a,'shared preview crowd helper must exist before the grandstand renderer');
const helper=canvas.slice(a,b);
let mobile=true,groundCalls=0;
const window={};
const ground=(frame,u,depth)=>{groundCalls++;return 2;};
const profile=(prof,ri,rows,ci,att)=>({occupied:(ri+ci)%4!==0&&att.fill>.01,top:'#b64255'});
const seatStart=canvas.indexOf('function apexGrandstandSeatTopV4(');
const seatEnd=canvas.indexOf('function apexGrandstandAttendanceProfile(){',seatStart);
const seatTop=new Function(canvas.slice(seatStart,seatEnd)+';return apexGrandstandSeatTopV4;')();
const factory=new Function('window','mobilePerformanceMode','apexGrandstandSeatVisual','apexMadridCrowdHeads','apexGrandstandFrameXZ','apexStaticSceneryGroundY','trackData','apexGrandstandSeatTopV4',
 helper+'\nreturn apexGrandstandPreviewCrowd;');
const draw=factory(window,()=>mobile,profile,['#c28d6a','#9b7059'],
 (frame,u,depth)=>[frame.span*u,depth],ground,{_apexGroundStamp:'test'},seatTop);
const frame={span:60,depth:16,edge:{a:[0,0],b:[60,0],nx:0,nz:1}};
const full={label:'full',fill:1,crowd:true};
const half={label:'half',fill:.58,crowd:true};
const empty={label:'empty',fill:0,crowd:false};
const tierNear={tier:2,crowdHeight:1.1},tierMid={tier:1,crowdHeight:1.05};
const stand={sourceId:'svg-test'};
const people=draw(stand,{madrid:true},frame,13,tierNear,full);
assert.ok(people.length>0&&people.length<=55,'mobile near view exceeds fixed geometry cap');
assert.ok(people.every(p=>p.body.length===4&&p.head.length===4&&p.body.every(v=>v.length===3)),'near figures must have torso/head');
for(const person of people){
 const bodyW=Math.hypot(person.body[2][0]-person.body[3][0],person.body[2][2]-person.body[3][2]);
 assert.ok(bodyW<.85,'torso is wider than a real spectator');
 const headW=Math.hypot(person.head[2][0]-person.head[3][0],person.head[2][2]-person.head[3][2]);
 assert.ok(headW<.4,'head exceeds body width');
}
const previous=groundCalls;
assert.equal(draw(stand,{madrid:true},frame,13,tierNear,full),people,'cache should reuse geometry');
assert.equal(groundCalls,previous,'a second frame must not recompute ground for crowd');
const mid=draw(stand,{madrid:true},frame,13,tierMid,full);
assert.ok(mid.length<=18&&mid.every(p=>p.head===null),'medium LOD needs cheap torso-only figures');
assert.equal(draw(stand,{madrid:true},frame,13,{tier:0},full).length,0,'far LOD must not draw spectators');
assert.equal(draw(stand,{madrid:true},frame,13,tierNear,empty).length,0,'empty sessions must remain empty');
const part=draw(stand,{madrid:true},frame,13,tierNear,half);
assert.ok(part.length<=people.length,'practice sessions must not be fuller than races');
mobile=false;
assert.ok(draw({}, {madrid:false},frame,13,tierNear,full).length<=90,'desktop crowd budget exceeded');

for(const [source,start,end] of [
 [canvas,'}else if(it.type==="grandstand"){','}else if(it.type==="billboard"||it.type==="advertising"){'],
 [webgl,"}else if(it.type==='grandstand'){","}else if(it.type==='gantry'){"]
]){
 const s=source.indexOf(start),e=source.indexOf(end,s);
 assert.ok(s>=0&&e>s,'missing SVG grandstand rendering branch');
 const body=source.slice(s+1,e);
 // The extra brace closes the enclosing chain of if statements.
 new Function('for(let k=0;k<1;k++){if(false){}'+body+'}}');
 assert.match(body,/apexGrandstandPreviewCrowd\(it,prof,frame,h,gb,att\)/);
 assert.match(body,/if\(prof\.covered\)\{/,'keep the canopy visible at all LODs');
 assert.doesNotMatch(body,/const crowdRows=/,'remove per-frame 3D spectator geometry');
}
assert.match(webgl,/railTop\[j\],railTop\[j-1\]/,'rear rail must have real height, not a degenerate quad');
assert.ok(window.apexGrandstandCrowdPreviewInfo().hits>=1);
console.log(JSON.stringify({test:'grandstand-crowd-perf6a-preview',mobileNear:people.length,mobileMid:mid.length,
 cached:true,bounded:true,sessionAttendance:true,canopy:true,rail:true,trees3dPreserved:true,ok:true}));
