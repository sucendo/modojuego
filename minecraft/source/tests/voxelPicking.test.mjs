import test from 'node:test';
import assert from 'node:assert/strict';
import {pickVoxel,adjacentCell} from '../scripts/voxelPicking.js';
import {harvestLevel,requiredHarvestLevel,isObjectBlock,isTool} from '../scripts/toolProfiles.js';
const fake = entries => ({getBlock(x,y,z){return {id:entries.get(`${x},${y},${z}`)||0};}});
test('ray grid picks the exposed voxel face and adjacent empty cell',()=>{
  const w=fake(new Map([['2,3,4',3]]));
  const result=pickVoxel(w,{x:0,y:3,z:4},{x:1,y:0,z:0},6);
  assert.equal(result.x,2);assert.equal(result.distance,1.5);
  assert.deepEqual(result.normal,{x:-1,y:0,z:0});
  assert.deepEqual(adjacentCell(result),{x:1,y:3,z:4});
});
test('ray grid misses an empty gap: no free-floating placement',()=>{
  const w=fake(new Map());
  assert.equal(pickVoxel(w,{x:1,y:3,z:4},{x:1,y:0,z:0},7),null);
});
test('picking traverses negative coordinates and respects maximum reach',()=>{
  const w=fake(new Map([['-3,3,4',6]]));
  assert.equal(pickVoxel(w,{x:0,y:3,z:4},{x:-1,y:0,z:0},2),null);
  assert.equal(pickVoxel(w,{x:0,y:3,z:4},{x:-1,y:0,z:0},3)?.x,-3);
});
test('tool catalogue distinguishes pico, saw, sword and right-click objects',()=>{
  assert.equal(isTool('iron_pickaxe'),true);assert.equal(isTool('sword'),true);
  assert.equal(requiredHarvestLevel(5),2);
  assert.equal(harvestLevel('stone_pickaxe',5),2);
  assert.equal(harvestLevel('basic_pickaxe',5),0);
  assert.equal(harvestLevel('saw',6),3);
  assert.equal(harvestLevel('saw',3),-1);
  assert.equal(isObjectBlock(25),true);assert.equal(isObjectBlock(3),false);
});
