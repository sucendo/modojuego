import test from 'node:test';
import assert from 'node:assert/strict';
import {hydrographyColumnV1141,hydrographyDebugNetworkV1141} from '../scripts/hydrographyV1141.js';
import {hybridHydrologyColumn,makeHybridContext,sourceGenerator,TERRAIN_HYBRID_V112} from '../scripts/hybridHydrology.js';
import {advancedSurfaceHeight} from '../scripts/terrainV10.js';
import {applyWorldPreset} from '../scripts/worldTypes.js';

const simplex={noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);}};
const params={seed:345,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
  trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}};
applyWorldPreset(params,'snow');
const original=(x,z)=>advancedSurfaceHeight(simplex,params,'snow',x,z,80);
const water=(x,z)=>hydrographyColumnV1141(simplex,params,'snow',x,z,params.seed,original);
const routes=()=>hydrographyDebugNetworkV1141(simplex,params,'snow',-420,-420,420,420);

test('v11.4.1 preserves deterministic water heights regardless of query and discovery order',()=>{
  const points=[];
  for(let x=-220;x<=220;x+=7)for(let z=-220;z<=220;z+=7)points.push([x,z]);
  const forward=points.map(([x,z])=>water(x,z));
  const backwards=points.toReversed().map(([x,z])=>water(x,z)).reverse();
  assert.deepEqual(forward,backwards);
  const wet=forward.filter(c=>c.waterY!==null);
  assert.ok(wet.length>=10,`expected a prefilled river, got ${wet.length}`);
  for(const column of wet){
    assert.equal(column.stable,true);
    assert.ok(column.waterY>=column.height+.75);
    assert.ok(column.waterY<=column.height+1.25);
    assert.ok(['river','lake'].includes(column.kind));
  }
});

test('v11.4.1 downhill drainage has explicitly joined tributaries and basin/sea outlets',()=>{
  const network=routes();
  assert.ok(network.length>10);
  assert.ok(network.some(r=>r.end==='confluence'),'tributaries should join the main stem');
  assert.ok(network.some(r=>r.end==='sea'),'rivers should end at low elevation where possible');
  assert.ok(network.some(r=>r.end==='basin'),'closed basins should be retained instead of uphill spills');
  for(const route of network){
    assert.ok(route.path.length>=3);
    assert.equal(route.source.x,route.path[0].x);
    assert.equal(route.source.z,route.path[0].z);
    for(let i=1;i<route.path.length;i++){
      const a=route.path[i-1],b=route.path[i];
      assert.ok(b.h<=a.h,`water climbed ${a.h}→${b.h} on ${route.id}`);
      assert.ok(Math.hypot(b.x-a.x,b.z-a.z)<=8.5,'water has a gap between consecutive voxels');
      assert.ok(b.flow>0);
    }
  }
  assert.deepEqual(routes(),network,'read-only overlay must not alter the network');
});

test('sources are exact water blocks and the new riverbed never protrudes above ground',()=>{
  const first=routes().find(r=>water(r.source.x,r.source.z).source);
  assert.ok(first,'source must be a water block rather than an unrelated random spring');
  const source=water(first.source.x,first.source.z);
  assert.equal(source.stable,true);
  assert.ok(source.waterY!==null);
  for(let x=-200;x<=200;x+=9)for(let z=-200;z<=200;z+=9){
    const col=water(x,z);
    assert.ok(col.height<=original(x,z));
    if(col.waterY!==null)assert.ok(col.waterY<=col.height+1.25);
  }
});

test('v11.4.0 explored chunks use their frozen v1 hydrology while new ones use v2',()=>{
  const hybrid={sourceVersion:5,protectedChunks:['0,0','14,14'],blendBlocks:96,
    hydrographyVersion:2,hydrographyV1Chunks:['14,14'],hydrographyV1BaseChunks:['0,0']};
  const protectedSet=new Set(hybrid.protectedChunks);
  assert.equal(sourceGenerator(hybrid,14,14),TERRAIN_HYBRID_V112);
  const old=makeHybridContext(protectedSet,new Set(),hybrid,14,14);
  assert.equal(old.hybrid.hydrographyVersion,1);
  assert.equal(old.protectedSet.has('14,14'),false,'old version retains its original blending footprint');
  const fresh=makeHybridContext(protectedSet,new Set(),hybrid,-14,-14);
  assert.equal(fresh.hybrid.hydrographyVersion,2);
  const column=hybridHydrologyColumn(simplex,params,'snow',-448,-448,fresh);
  assert.deepEqual({height:column.height,waterY:column.waterY},
    {height:water(-448,-448).height,waterY:water(-448,-448).waterY});
});
