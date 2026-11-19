import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/player.js',import.meta.url),'utf8');
test('0 and 1–9 build and mine using original left click, right click separately places E objects',()=>{
  assert.match(source,/case 'Digit0'/);
  assert.match(source,/case 'Digit9'/);
  assert.match(source,/event\.button===2/);
  assert.match(source,/this\.placeSelected\(this\.rightObjectId,true\)/);
  assert.match(source,/pickVoxel\(/);
  assert.match(source,/adjacentCell\(hit\)/);
  assert.doesNotMatch(source,/freePlacementCell\(/);
  assert.equal(existsSync(new URL('../scripts/placement.js',import.meta.url)),false);
});
test('pickaxe mining removes chest, bed and other objects with station safeguards',()=>{
  assert.match(source,/this\.breakAt\(x,y,z\)/);
  assert.match(source,/canBreakStation\(this\.world/);
  assert.match(source,/this\.world\.removeBlock\(x,y,z\)/);
});
