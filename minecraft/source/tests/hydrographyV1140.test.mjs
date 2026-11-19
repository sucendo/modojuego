import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrographyColumnV1140, hydrographyDebugSources, hydrographyDebugSegments } from '../scripts/hydrographyV1140.js';
import { hybridHydrologyColumn, makeHybridContext } from '../scripts/hybridHydrology.js';
import { advancedSurfaceHeight } from '../scripts/terrainV10.js';
import { applyWorldPreset } from '../scripts/worldTypes.js';

const simplex={noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);}};
const params={seed:345,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
  trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}};
applyWorldPreset(params,'snow');
const original=(x,z)=>advancedSurfaceHeight(simplex,params,'snow',x,z,80);
const river=(x,z)=>hydrographyColumnV1140(simplex,params,'snow',x,z,params.seed,original);

test('new hydrography is fully generated on first sight and independent of visit order',()=>{
  const coordinates=[];
  for(let z=-220;z<220;z+=7)for(let x=-220;x<220;x+=7)coordinates.push([x,z]);
  const forward=coordinates.map(([x,z])=>river(x,z));
  const reverse=coordinates.toReversed().map(([x,z])=>river(x,z)).reverse();
  assert.deepEqual(forward,reverse,'exploration order must never rewrite a river');
  const wet=forward.filter(c=>c.waterY!==null);
  assert.ok(wet.length>10,`expected real channels, found ${wet.length}`);
  assert.ok(wet.every(c=>c.stable===true));
  assert.ok(wet.every(c=>c.waterY>c.height+.5));
  assert.ok(wet.every(c=>c.waterY<=c.height+1.25+1e-7),
    'river water must be a grounded, single-block column');
  assert.ok(wet.every(c=>c.height<=original(coordinates[forward.indexOf(c)][0],coordinates[forward.indexOf(c)][1])));
});

test('source positions are deterministic and visible only with the developer overlay',()=>{
  const sources=hydrographyDebugSources(simplex,params,'snow',-350,-350,350,350);
  assert.ok(sources.length>0);
  const first=sources[0];
  assert.equal(river(first.x,first.z).source,true);
  assert.equal(river(first.x,first.z).stable,true);
  assert.deepEqual(hydrographyDebugSources(simplex,params,'snow',-350,-350,350,350),sources);
});

test('all traced river segments descend or stay level; none climb a hillside',()=>{
  const segments=hydrographyDebugSegments(simplex,params,'snow',-500,-500,500,500)
    .filter(segment=>segment.width);
  assert.ok(segments.length>20);
  for(const segment of segments){
    assert.ok(segment.b.h<=segment.a.h,`river climbed ${segment.a.h}→${segment.b.h}`);
    assert.ok(Math.hypot(segment.b.x-segment.a.x,segment.b.z-segment.a.z)<=8.5,
      'adjacent watercourse nodes must form one connected trail');
  }
});

test('a frozen explored chunk preserves old water while far virgin land uses stable river networks',()=>{
  const hybrid={sourceVersion:5,protectedChunks:['0,0'],blendBlocks:96,hydrographyVersion:1};
  const protectedSet=new Set(['0,0']);
  const near=makeHybridContext(protectedSet,new Set(),hybrid,0,0);
  const far=makeHybridContext(protectedSet,new Set(),hybrid,14,14);
  const preserved=hybridHydrologyColumn(simplex,params,'snow',16,16,near);
  assert.equal(preserved.stable,undefined);
  const rebuilt=hybridHydrologyColumn(simplex,params,'snow',448,448,far);
  assert.deepEqual({height:rebuilt.height,waterY:rebuilt.waterY},
    {height:river(448,448).height,waterY:river(448,448).waterY});
  assert.equal(rebuilt.stable,true);
});
