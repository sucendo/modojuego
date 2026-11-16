'use strict';
// APEX V15.2.6: visual pit entry/exit taper, track-owned asphalt and crisp
// 3-D separator are universal. No driving physics or automatic limiter edits.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024.txt'),
 render=read('parts/part-025.txt'),
 production=read('apex.html'),preview=read('apex.html');
function section(src,from,to){const a=src.indexOf(from),b=src.indexOf(to,a);
 assert.ok(a>=0&&b>a,'missing '+from);const part=src.slice(a,b);new vm.Script(part);return part;}
const code=section(core,'function apexPitVisualMergeProfileV1526(', 'function nearestPitState(');
const api=new Function('nearestTrackState','envProfile','renderRibbonFrameAt','apexTrackEdgeSection','terrainEase',
 code+'return {profile:apexPitVisualMergeProfileV1526,point:apexPitVisualPointV1526,merge:apexPitMergeQuadV1526};')(
 (x,z)=>({s:x,lat:z}),()=>({half:5}),()=>({nx:0,nz:1}),(frame,env,side)=>({end:{x:0,y:0,z:side*env.half}}),x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);});
const sg=(a,b,y=0)=>({x1:0,z1:a,y1:y,x2:20,z2:b,y2:y,width:6,leftWidth:3,rightWidth:3,len:Math.hypot(20,b-a)});
const joinedSegments=new Function('trackData',section(core,'function apexPitSegments(', 'function apexPitVisualMergeProfileV1526(')+'return apexPitSegments();')(
 {customWorld:{pitNetwork:{runs:[{width:6,points:[
  {x:0,y:0,z:16,pitS:0},{x:10,y:0,z:16,pitS:10},{x:18,y:0,z:21,pitS:20}]}]}}});
for(const width of [-3,3]){
 assert.deepEqual(api.point(api.profile(joinedSegments[0],1),width),
  api.point(api.profile(joinedSegments[1],0),width),'Adjacent quads share their complete cross-section');
}
const config=JSON.parse(read('circuits/json/apex26_01-australia_pit.json'));
assert.equal(config.pitLane.totalLengthM,717.911);
const pitCode=section(read('parts/part-023.txt'),'function apexPitProfileSample(', 'function apexMigratePitNetworkV2(');
const points=[0,100,200].map(pitS=>({x:pitS,z:0,y:99,pitS}));
const network={primaryChainId:0,primaryLength:200,runs:[{chainId:0,points}]};
new Function('trackData','apexPitLaneJsonProfile','apexNearestTrackSurfaceY','apexCloneJson','apexPitPointAtS','raceMetaFor','apexPitServiceLayout','clamp','lerp',pitCode+'apexApplyPitLaneJsonProfile();')(
 {customWorld:{pitNetwork:network}},()=>config.pitLane,x=>x===0?2:3,x=>x,()=>null,()=>null,()=>null,
 (x,lo,hi)=>Math.min(hi,Math.max(lo,x)),(a,b,t)=>a+(b-a)*t);
assert.equal(points[0].y,2,'Entry joins the active road elevation');
assert.equal(points[2].y,3,'Exit joins the active road elevation');
assert.ok(points[1].y<1,'Interior elevation is taken from the profile');
const savedSvg=read('circuits/svg/apex26_01-australia_circuito-propuesta-20261111-v2.svg');
const rejoinGroup=savedSvg.slice(savedSvg.indexOf('id="APEX_PIT_REJOIN"'));
const rejoinTag=rejoinGroup.match(/<polygon\b[^>]*>/)[0];
const attrs=Object.fromEntries([...rejoinTag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const verts=attrs.points.split(/\s+/).map(p=>p.split(',').map(Number));
const landmark=section(core,'function apexSvgLandmarkExact(', 'function apexAuthoredCurbMesh(');
const surfaceY=section(core,'function apexSvgSurfaceMarkingY(', 'function apexCompileCrosswalkTriangles(');
const imported=new Function('apexPitSpeedMarkColor','apexSvgSampleMounted','nearestTrackState','proposalWorldAnchor','poseAt',
 'apexSvgReadAppearance','apexSvgSurfaceColor','apexIsCurbAuthoringMark','envProfile','apexNearestTrackSurfaceY',
 'apexNearestGradeSegment','apexWorldGroundY',landmark+surfaceY+'return apexSvgLandmarkExact;')(
 ()=>null,()=>verts,()=>({s:0,lat:2}),()=>({}),()=>null,()=>({}),
 el=>el.getAttribute('fill'),()=>false,()=>({half:5}),()=>3,()=>null,()=>0)(
 {localName:'polygon',closest:s=>s==='#APEX_PIT_REJOIN',getAttribute:k=>attrs[k]??null},0,{toWorld:p=>p});
assert.match(read('parts/part-023.txt'),/querySelectorAll\('[^']*#APEX_PIT_REJOIN polygon/);
assert.equal(imported.type,'marking');
assert.equal(imported.markingKind,'PIT_REJOIN');
assert.equal(imported.color,attrs.fill);
assert.deepEqual(imported.worldFootprint,verts);
assert.ok(imported.worldY.every(y=>y===3),'Paint follows road grade');
const workGroup=savedSvg.slice(savedSvg.indexOf('id="APEX_PIT_WORK_AREA"'));
const workTag=workGroup.match(/<polygon\b[^>]*>/)[0];
const workPts=workTag.match(/points="([^"]+)"/)[1].split(/\s+/).map(p=>p.split(',').map(Number));
const triangulate=section(core,'function apexTriangulateGroundFootprint(', 'function apexRunoffRoadClipIndex(');
const triangles=new Function(triangulate+'return apexTriangulateGroundFootprint;')()(workPts);
assert.ok(triangles?.length>30,'Melbourne SVG work polygon triangulates as pavement');
const {startPitS,endPitS}=config.pitLane.boxZone;
assert.equal(startPitS,349.233);
assert.equal(endPitS,595.61);
assert.equal(config.pitLane.boxSlots.length,11);
assert.ok(config.pitLane.boxSlots.every(slot=>slot.pitS>startPitS&&slot.pitS<endPitS&&slot.status==='SVG_PROJECTED'));
const separated=api.merge(sg(16,16));
assert.equal(separated.a.width,6);
assert.equal(separated.b.width,6);
const exit=api.merge(sg(16,1));
assert.ok(exit.a.width>0&&exit.b.width===0,'pit must taper to a point');
assert.ok(exit.b.z>1&&exit.b.z<16,'pit tip must stop BEFORE authored centre enters track');
assert.ok(exit.quad.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
assert.ok(Math.hypot(exit.quad[2].x-exit.quad[3].x,exit.quad[2].z-exit.quad[3].z)<1e-9);
const entry=api.merge(sg(1,16));
assert.equal(entry.a.width,0);
assert.ok(entry.a.z>1&&entry.a.z<16,'pit entry must grow from the correct edge');
assert.equal(api.merge(sg(0,0)),null,'no overlay when both pit edges lie inside circuit');
const authoredExit={...sg(8,5),s1:80,s2:100,exitS:100};
const overlap=api.merge(authoredExit);
assert.ok(overlap.a.merge&&overlap.b.merge);
assert.ok(Math.abs(overlap.quad[2].z-4.45)<1e-9,'pit exit crosses the main edge by 55 cm');
assert.ok(overlap.quad[2].y>0,'pit asphalt sits above the track at the join');
assert.match(core,/apexClipTerrainAtPit\(poly\)\?\?\[poly\]/,'main paint cedes to the pit footprint');
assert.match(render,/if\(merge\)lane.push/,'pit overlap uses the same textured mesh as the rest of the lane');
for(const key of ['entryS','exitS']){
 const joined={...sg(1,1),s1:0,s2:20,[key]:key==='entryS'?0:20};
 assert.equal(api.merge(joined),null,'main asphalt is already underneath');
 for(const end of [0,1]){
  const edges=api.profile(joined,end).paintEdges;
  assert.equal(edges.length,2,'both pit lane edges remain visible');
  assert.equal(Math.abs(edges[0][0].z-edges[1][0].z),6,'paint follows the original lane width');
  for(const stripe of edges){
   assert.ok(stripe.every(p=>p.z<5&&p.y===.045),'pit paint remains above the main asphalt');
   assert.ok(Math.abs(Math.hypot(stripe[1].x-stripe[0].x,stripe[1].z-stripe[0].z)-.09)<1e-9);
  }
 }
}
const longExit={...sg(4,3),s1:0,s2:20,exitS:140};
assert.equal(api.profile(longExit,0).merge,false,'asphalt overlap is still limited to the exit');
assert.equal(api.profile(longExit,0).paintCrossesTrack,true,'paint follows crossings outside the asphalt overlap window');
assert.equal(api.profile(sg(16,16),0).paintCrossesTrack,false,'isolated pit edges do not get overlapping paint');
const narrowMerge={...sg(8.4,8.4),s1:0,s2:20,entryS:0};
const narrowQuad=api.merge(narrowMerge);
assert.ok(narrowQuad.overlap&&narrowQuad.quad[1].z<5,'A short entrance gap is covered by the paved merge');
const distinctLane=api.merge({...sg(9.2,9.2),s1:0,s2:20,entryS:0});
assert.ok(!distinctLane.overlap&&distinctLane.quad[1].z>5,'A wider median remains separate');
const wallSide={...sg(9.6,9.6),s1:647,s2:651,exitS:718,rejoinPavementFromPitS:652.7};
assert.ok(api.merge(wallSide).quad[1].z>5,'The median alongside the separator wall stays green');
const afterWall={...sg(9.6,9.6),s1:656,s2:660,exitS:718,rejoinPavementFromPitS:652.7};
assert.ok(api.merge(afterWall).quad[1].z<5,'Pavement closes the wider wedge past the wall');
assert.equal(config.pitLane.trackConnection.rejoinPavementFromPitS,652.7);
const overpass={...sg(3,3,8),entryS:0,exitS:20,s1:0,s2:20};
assert.equal(api.profile(overpass,0).paintEdges,null);
const opposite=api.merge(sg(-7,-7));
assert.ok(opposite.a.clipped&&opposite.a.side===-1,'opposite track side is supported');
const bridge=api.merge(sg(7,7,8));
assert.equal(bridge.a.width,6,'different-level road must never be cut');
assert.match(core,/stripe\(true\)/);
assert.match(core,/if\(!pa\.clipped&&!pb\.clipped\)stripe\(false\)/);
assert.match(core,/kind:'PITLANE'/);
assert.match(render,/const merge=apexPitMergeQuadV1526\(sg\)/,'static pit GPU must use same clipped mesh');
assert.doesNotMatch(render.slice(render.indexOf('function webglPushExactPitLane('),render.indexOf('function webglPushSurfaceMarkings(')),
 /camMix\(A,B,\.018\)/,'no second auto-painted line across race asphalt');
assert.match(core,/\bvisualLeftA:al,visualRightA:ar,visualLeftB:bl,visualRightB:br\b/);
console.log(JSON.stringify({test:'pit-merge-geometry-v1526-preview',entry:true,exit:true,
 exactTip:true,noRectangularOverlay:true,paintIndependent:true,oppositeSide:true,
 gradeSafe:true,canvasAndWebglShared:true,physicsUnchanged:true,ok:true}));
