import test from 'node:test';
import assert from 'node:assert/strict';
import {advancedSurfaceHeight} from '../scripts/terrainV10.js';
import {legacySurfaceHeight} from '../scripts/hybridTerrain.js';
import {hydrologyColumn} from '../scripts/hydrology.js';
import {hydrologyColumnV112} from '../scripts/hydrologyV112.js';
import {TERRAIN_HYBRID_V112,hybridHydrologyColumn,makeHybridContext,
  sourceGenerator,validateHydrologyHybrid} from '../scripts/hybridHydrology.js';

const simplex={noise:(x,z)=>Math.sin(x*1.77+z*.82)*Math.cos(z*.7-x*.34),
  noise3d:(x,y,z)=>Math.sin(x+z+y)};
const params={seed:401,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4}};
const upgraded=(sourceVersion=1,protect=['0,0'],legacyChunks=[])=>({
  sourceVersion,protectedChunks:protect,blendBlocks:96,
  ...(sourceVersion===3?{legacyChunks}:{})
});
const context=(hybrid,cx=1,cz=0)=>makeHybridContext(new Set(hybrid.protectedChunks),
  new Set(hybrid.legacyChunks||[]),hybrid,cx,cz);

test('automatic hybrid keeps original column exactly beside a frozen legacy chunk',()=>{
  const hybrid=upgraded(),near=context(hybrid);
  for(let z=4;z<32;z+=4){
    const actual=hybridHydrologyColumn(simplex,params,'classic',32,z,near);
    assert.equal(actual.height,legacySurfaceHeight(simplex,params,'classic',32,z));
    assert.equal(actual.waterY,null);
    assert.equal(actual.mix,0);
  }
  const far=context(hybrid,6,0);
  const actual=hybridHydrologyColumn(simplex,params,'classic',192,12,far);
  const expected=hydrologyColumnV112(simplex,params,'classic',192,12,params.seed,
    (x,z)=>advancedSurfaceHeight(simplex,params,'classic',x,z,80));
  assert.equal(actual.mix,1);
  assert.equal(actual.height,expected.height);
  assert.equal(actual.waterY,expected.waterY);
});

test('v11 river height and waterline are unchanged at the protected boundary',()=>{
  const near=context(upgraded(4));
  const old=hydrologyColumn(simplex,params,'snow',32,145,params.seed,
    (x,z)=>advancedSurfaceHeight(simplex,params,'snow',x,z,80));
  const edge=hybridHydrologyColumn(simplex,params,'snow',32,145,near);
  assert.equal(edge.height,old.height);
  assert.equal(edge.waterY,old.waterY);
  assert.equal(edge.ice,false);
});

test('v10.1 previously protected terrain keeps its exact generator within the new protected list',()=>{
  const hybrid=upgraded(3,['0,0','1,0','2,0'],['0,0']);
  assert.equal(sourceGenerator(hybrid,0,0,new Set(hybrid.legacyChunks)),1);
  assert.equal(sourceGenerator(hybrid,1,0,new Set(hybrid.legacyChunks)),3);
  assert.equal(TERRAIN_HYBRID_V112,6);
  assert.equal(validateHydrologyHybrid(hybrid,6).sourceVersion,3);
});

test('hybrid metadata rejects bad coordinates, missing protection or lost v10.1 history',()=>{
  const valid=upgraded(2);
  assert.deepEqual(validateHydrologyHybrid(valid,6).protectedChunks,['0,0']);
  for(const bad of [
    {...valid,protectedChunks:[]},
    {...valid,protectedChunks:['0,0','0,0']},
    {...valid,protectedChunks:['a,b']},
    {...valid,sourceVersion:99},
    {...valid,blendBlocks:32},
    {...upgraded(3,['0,0']),legacyChunks:['3,4']},
  ])assert.throws(()=>validateHydrologyHybrid(bad,6),/invalidFile/);
});
