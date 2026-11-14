'use strict';
// APEX V15.2.7: automatically painted margins do not extend to far SVG
// walls; authored runoff keeps its geometry and material, including banking.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024.txt'),
 world=read('parts/part-025.txt'),
 frame=read('parts/part-026.txt'),
 preview=read('apex.html'),prod=read('apex.html');
function snippet(s,start,end){
 const a=s.indexOf(start),b=s.indexOf(end,a);
 assert.ok(a>=0&&b>a,'missing '+start);const block=s.slice(a,b);
 new vm.Script(block);return block;
}
{
 const source=core;
 const edge=snippet(source,'function apexTrackEdgeSection(', '// v5.211');
 const geometry=new Function('ribbonWorldPoint',edge+'return apexTrackCrossSection;')(
  (q,w,side)=>({x:q.x+w*side,y:q.y+Math.tan(q.bank)*w*side,z:q.z}));
 for(const bank of [-.38,0,.38]){
  const q={x:10,y:17,z:20,ox:1.2,oz:0,bank,authoredRoadEdges:{
   half:6,left:{x:17,z:20,width:.28},right:{x:5,z:20,width:.15}}};
  const env={half:5,curb:.8,runoff:8};
  const g=geometry(q,env,{left:false,right:false});
  const width=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  assert.ok(Math.abs(width(g.l,g.li)-.28)<1e-10);
  assert.ok(Math.abs(width(g.r,g.ri)-.15)<1e-10);
  assert.ok(Math.abs((g.l.x+g.li.x)*.5-16)<1e-10);
  assert.equal(g.l,g.lo,'asphalt and terrain share the paint exterior');
  assert.equal(g.r,g.ro);
  const legacy=geometry({...q,authoredRoadEdges:null},env,{left:false,right:false});
  assert.equal(legacy.l.x,15,'legacy road width is its asphalt boundary');
  assert.ok(Math.abs(width(legacy.l,legacy.li)-.20)<1e-10);
 }
 assert.doesNotMatch(source,/apexVisualRunoffLimitV1527/);
 assert.match(source,/const samples=apexRoadMeshSamples\(\),cell=48/);
}
assert.doesNotMatch(world,/function drawNearRoadSafetyPatch/);
assert.doesNotMatch(frame,/function webglPushNearPatch/);
console.log(JSON.stringify({test:'road-margins',fixedStations:true,bankedWidths:true,
 sharedBoundary:true,legacyWidthPreserved:true,ok:true}));
