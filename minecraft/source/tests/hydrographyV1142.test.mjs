import test from 'node:test';
import assert from 'node:assert/strict';
import {hydrographyColumnV1142,hydrographyDebugNetworkV1142} from '../scripts/hydrographyV1142.js';
import {hydrographyColumnV1141} from '../scripts/hydrographyV1141.js';
import {makeHybridContext,hybridHydrologyColumn} from '../scripts/hybridHydrology.js';
import {advancedSurfaceHeight} from '../scripts/terrainV10.js';
import {applyWorldPreset} from '../scripts/worldTypes.js';
import {exposedVoxelSide} from '../scripts/waterVoxelsV1134.js';

const simplex={noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);}};
const params={seed:345,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
  trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}};
applyWorldPreset(params,'snow');
const base=(x,z)=>advancedSurfaceHeight(simplex,params,'snow',x,z,80);
const wet=(x,z)=>hydrographyColumnV1142(simplex,params,'snow',x,z,params.seed,base);
const net=()=>hydrographyDebugNetworkV1142(simplex,params,'snow',-700,-700,700,700);

test('v11.4.2 water is settled before the first visit, even after visiting far-away tiles',()=>{
  const points=[];
  for(let x=-180;x<180;x+=7)for(let z=-180;z<180;z+=7)points.push([x,z]);
  const before=points.map(([x,z])=>wet(x,z));
  for(let i=0;i<15;i++)wet(2500+i*176,800+i*117);
  const after=points.toReversed().map(([x,z])=>wet(x,z)).reverse();
  assert.deepEqual(before,after);
  const water=before.filter(c=>c.waterY!==null);
  assert.ok(water.length>=10);
  for(const c of water){
    assert.equal(c.stable,true);
    assert.ok(c.waterY>c.height+.5&&c.waterY<=c.height+1.25);
  }
});

test('v11.4.2 multiple deterministic tributaries connect at the main-channel elevation',()=>{
  const routes=net();
  const branches=routes.filter(r=>r.end==='confluence');
  assert.ok(branches.length>=6);
  assert.ok(branches.some(b=>b.id.endsWith(':1')),'a second independent tributary can reach the main river');
  let checked=0;
  for(const branch of branches){
    const parentId=branch.id.replace(/:tributary:\d+$/,'');
    const parent=routes.find(r=>r.id===parentId);
    if(!parent)continue; // the parent may lie outside this debug-map viewport
    const last=branch.path.at(-1);
    const joint=parent.path.find(p=>p.x===last.x&&p.z===last.z);
    assert.ok(joint,'the tributary must end at an actual main-river voxel');
    assert.equal(last.h,joint.h,'water cannot rise through a confluence');
    checked++;
  }
  assert.ok(checked>=4);
  for(const route of routes)for(let i=1;i<route.path.length;i++){
    const a=route.path[i-1],b=route.path[i];
    assert.ok(b.h<=a.h,`${route.id} water rose from ${a.h} to ${b.h}`);
    assert.ok(Math.hypot(b.x-a.x,b.z-a.z)<=8.5);
  }
});

test('v11.4.2 lake is flat, rests on solid blocks and never rises above its inflowing river',()=>{
  const basins=net().filter(r=>r.end==='basin');
  assert.ok(basins.length>0);
  let verified=0;
  for(const basin of basins){
    const {x,z}=basin.outlet,last=basin.path.at(-1),center=wet(x,z);
    if(center.kind!=='lake')continue;
    assert.equal(center.waterY,last.h-.75,'the lake meets the river at the same block elevation');
    assert.equal(center.height,last.h-2);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const neighboring=wet(x+dx,z+dz);
      assert.equal(neighboring.kind,'lake','the basin cannot fragment into rivulets at its center');
      assert.equal(neighboring.waterY,center.waterY,'the lake surface must be flat');
      assert.ok(neighboring.height<=base(x+dx,z+dz));
    }
    verified++;
  }
  assert.ok(verified>=2);
});

test('steep river segments are flagged; waterfalls connect both levels with a vertical face',()=>{
  const steep=net().flatMap(r=>r.path).filter(p=>p.fall>=2);
  assert.ok(steep.length>0);
  const upper={top:17.5,bottom:16.5},lower={top:13.5,bottom:12.5};
  assert.deepEqual(exposedVoxelSide(upper,lower,0,true),
    {top:17.5,bottom:13.5,waterfall:true});
  assert.deepEqual(exposedVoxelSide(upper,lower,0,false),
    {top:17.5,bottom:16.5,waterfall:true},
    'old saves keep their original waterfall rendering');
  assert.equal(exposedVoxelSide(lower,upper,0,true),null);
});

test('v11.4.1 explored landscape keeps its original relief and water when generating v11.4.2 nearby',()=>{
  const h={sourceVersion:5,protectedChunks:['0,0','12,12'],blendBlocks:96,
    hydrographyVersion:3,hydrographyV2Chunks:['12,12'],hydrographyV2BaseChunks:['0,0']};
  const saved=makeHybridContext(new Set(h.protectedChunks),new Set(),h,12,12);
  const fresh=makeHybridContext(new Set(h.protectedChunks),new Set(),h,-14,-14);
  assert.equal(saved.hybrid.hydrographyVersion,2);
  assert.equal(fresh.hybrid.hydrographyVersion,3);
  const old=hybridHydrologyColumn(simplex,params,'snow',384,384,saved);
  const oldExact=hydrographyColumnV1141(simplex,params,'snow',384,384);
  assert.deepEqual({height:old.height,waterY:old.waterY},{height:oldExact.height,waterY:oldExact.waterY});
  const current=hybridHydrologyColumn(simplex,params,'snow',-448,-448,fresh);
  const newExact=wet(-448,-448);
  assert.deepEqual({height:current.height,waterY:current.waterY},{height:newExact.height,waterY:newExact.waterY});
});
