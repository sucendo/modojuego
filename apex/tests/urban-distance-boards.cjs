'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('apex/parts/part-025.txt','utf8'),start=source.indexOf('function apexUrbanBoardMount('),end=source.indexOf('function boardGeometry(',start);
const c={readStoredCircuitJson:()=>({}),trackData:{spec:{dir:'urban'},km:5,customWorld:{wallSegments:[{side:1,s:100,x1:10,z1:90,x2:10,z2:110,y1:2,y2:2,height:1.1,fence:true,fenceH:2.35}]}},circuitEnvironmentProfile:()=>({family:'URBAN'}),renderRibbonFrameAt:()=>({x:0,z:100,ox:1,oz:0,tx:0,tz:1}),envProfile:()=>({half:6,curb:1,runoff:3}),wallBarrierStyle:()=>({height:1.1,fenceH:2.35}),wallGeometryAtS:()=>({enabled:false}),wrapDeltaS:(a,b)=>a-b,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
vm.runInNewContext(source.slice(start,end)+source.slice(source.indexOf('const SEVEN_SEG_DIGITS='),source.indexOf('function drawVectorDigitOnQuad(')),c);
const board={s:100,side:1,mark:150},mount=c.apexUrbanBoardMount(board);assert.equal(mount.source,'SVG_FENCE');assert.equal(mount.x,9.39);assert.ok(Math.abs(mount.bottom-3.65)<1e-8);assert.equal(mount.height,.82);assert.equal(mount.width,1.20);assert.ok(mount.width>mount.height*1.35);assert.equal(c.apexUrbanBoardMount({...board}),mount,'Cached across merged definition copies');
for(const mark of [200,150,100,50]){const faces=c.apexUrbanBoardPaint(mark);assert.ok(faces.length<35);for(const face of faces)for(const [u,v] of face.points)assert.ok(u>=0&&u<=1&&v>=0&&v<=1);assert.equal(c.apexUrbanBoardPaint(mark),faces);const black=faces.filter(f=>f.color==='#101519'||f.color==='#f8ffff');assert.ok(Math.max(...black.flatMap(f=>f.points.map(p=>p[1])))-Math.min(...black.flatMap(f=>f.points.map(p=>p[1])))>.65);
 const xs=black.flatMap(f=>f.points.map(p=>p[0]));
 assert.ok(Math.max(...xs)-Math.min(...xs)>.38,'Digits must extend horizontally, not stack vertically');
 const signs=faces.filter(f=>f.color==='#101519');
 assert.ok(signs.length>=8&&signs.every(f=>f.points.every(([x,y])=>x>=0&&x<=1&&y>=0&&y<=1)));}
c.trackData={spec:{dir:'park'},km:5};c.circuitEnvironmentProfile=()=>({family:'PARK',urban:0});assert.equal(c.apexUrbanBoardMount(board),null);
c.trackData={spec:{dir:'urban'},km:5};c.circuitEnvironmentProfile=()=>({family:'URBAN'});assert.equal(c.apexUrbanBoardMount(board),null,'No invented fence');
c.trackData._distanceBoardMounts.clear();c.wallGeometryAtS=()=>({enabled:true,top:{x:12,y:1.1,z:100},barrier:{fence:true,fenceH:2.35}});assert.equal(c.apexUrbanBoardMount(board).source,'RIBBON_FENCE');
for(const id of ['02-china','13-italy','19-mexico','22-qatar','23-abu-dhabi']){c.trackData={spec:{dir:id},km:5};assert.equal(c.apexUrbanBoardMount(board),null,id+' keeps permanent track boards even with urban scenery');}
c.trackData={spec:{dir:'13-italy'},km:5};c.readStoredCircuitJson=()=>({walls:{distanceBoardMount:'FENCE'}});assert.equal(c.apexUrbanBoardMount(board).source,'RIBBON_FENCE');
c.trackData={spec:{dir:'06-monaco'},km:5};c.readStoredCircuitJson=()=>({walls:{distanceBoardMount:'POSTS'}});assert.equal(c.apexUrbanBoardMount(board),null);

const geometryStart=source.indexOf('function boardGeometry('),geometryEnd=source.indexOf('const APEX_FIA_2026_CORNER_AUDIT_LOTE1',geometryStart);
assert.ok(geometryStart>0&&geometryEnd>geometryStart,'Geometry function found');
vm.runInNewContext(source.slice(geometryStart,geometryEnd),c);
c.readStoredCircuitJson=()=>({}); // Previous Monaco POSTS override must not leak into these cases.
c.worldToCamera=(x,y,z)=>({x,y,z:z+20});
c.projectLocal=(x,y,z)=>({x,y,scale:1});
for(const side of [1,-1]){
  // Reverse the wall's endpoint order on the left: its direction must not reverse the painted face.
  const sg={side,s:100,x1:side*10,z1:side===1?90:110,x2:side===1?11:-11,z2:side===1?110:90,y1:2,y2:2,height:1.1,fence:true,fenceH:2.35};
  c.trackData={spec:{dir:'14-spain'},km:5,customWorld:{wallSegments:[sg]}};
  const b={s:100,side,mark:150},m=c.apexUrbanBoardMount(b),g=c.boardGeometry(b,{},0);
  assert.ok(g&&g.urban&&g.poles.length===0,'Hanging board without ground posts');
  const dx=g.camPts[1].x-g.camPts[0].x,dz=g.camPts[1].z-g.camPts[0].z,
        wallDx=sg.x2-sg.x1,wallDz=sg.z2-sg.z1,wallLen=Math.hypot(wallDx,wallDz);
  assert.ok(Math.abs(dx*wallDx+dz*wallDz)<1e-8,'Plate must be perpendicular to actual fence');
  const faceDot=(dz*0-dx*1)/Math.hypot(dx,dz);
  assert.ok(faceDot<-.95,'Front must face opposite to driving direction on both sides');
  const edge=side===1?g.camPts[1]:g.camPts[0],
        wallGap=Math.abs((edge.x-sg.x1)*wallDz-(edge.z-20-sg.z1)*wallDx)/wallLen;
  assert.ok(Math.abs(wallGap-.01)<1e-8,'One vertical side fixed 1 cm from fence');
}

console.log(JSON.stringify({test:'urban-distance-boards',svg:true,procedural:true,cache:true,horizontalDigits:true,permanentUnchanged:true,facesOncoming:true,sideAttached:true,ok:true}));
