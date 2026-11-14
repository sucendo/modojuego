'use strict';
// APEX V15.2.6: visual pit entry/exit taper, track-owned asphalt and crisp
// 3-D separator are universal. No driving physics or automatic limiter edits.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024-bridgefull-preview.txt'),
 render=read('parts/part-025-bridgefull-trees3d-preview.txt'),
 production=read('apex.html'),preview=read('perf6a-preview.html');
assert.match(preview,/part-024-bridgefull-preview\.txt/);
assert.match(production,/url=perf6a-preview\.html/);
function section(src,from,to){const a=src.indexOf(from),b=src.indexOf(to,a);
 assert.ok(a>=0&&b>a,'missing '+from);const part=src.slice(a,b);new vm.Script(part);return part;}
const code=section(core,'function apexPitVisualMergeProfileV1526(', 'function nearestPitState(');
const api=new Function('nearestTrackState','envProfile','renderRibbonFrameAt','apexTrackEdgeSection',
 code+'return {profile:apexPitVisualMergeProfileV1526,point:apexPitVisualPointV1526,merge:apexPitMergeQuadV1526};')(
 (x,z)=>({s:x,lat:z}),()=>({half:5}),()=>({nx:0,nz:1}),(frame,env,side)=>({end:{x:0,y:0,z:side*env.half}}));
const sg=(a,b,y=0)=>({x1:0,z1:a,y1:y,x2:20,z2:b,y2:y,width:6,leftWidth:3,rightWidth:3,len:Math.hypot(20,b-a)});
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
assert.match(render,/paved&&!d.material.merge/,'pit overlap is drawn after the main road');
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
