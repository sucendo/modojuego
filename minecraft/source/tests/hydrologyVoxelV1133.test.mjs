import test from 'node:test';
import assert from 'node:assert/strict';
import { HydrologyEngine } from '../scripts/hydrologyEngine.js';
import { waterCornerHeight } from '../scripts/waterGeometry.js';
import { waterfallFaces } from '../scripts/hydrologyV112.js';

function forestRiverWorld(trackGround) {
  const waterColumns = Array(1024).fill(null);
  waterColumns[16 * 32 + 16] = { y: 5.25, depth: 1.75, kind: 'river' };
  const chunk = {
    loaded: true, position: { x: 0, z: 0 }, waterColumns, maxFilledY: 24,
    getBlockId(x, y, z) {
      if (x === 16 && z === 16 && y >= 6 && y <= 21) return 6; // tree trunk above river
      if (x === 17 && z === 16 && y >= 4 && y <= 21) return 6; // tree beside river
      return y <= 3 ? 8 : 0;
    },
    refreshWater() {}
  };
  if (trackGround) chunk.hydrologyGround = new Float32Array(1024).fill(3.5);
  return { chunk, world: {
    type: 'snow', params: { seed: 42, terrain: { waterOffset: 1 } },
    chunkSize: { height: 80 }, getChunk(x,z) { return x === 0 && z === 0 ? chunk : null; }
  }};
}

for (const trackGround of [true, false]) {
  test(`a river below a tree does not jump up to its crown when explored (bed cache ${trackGround})`, () => {
    const { chunk, world } = forestRiverWorld(trackGround);
    const engine = new HydrologyEngine(world);
    const water = engine.activateColumn(16, 16);
    assert.equal(water.bed, 3.5, 'tree trunks do not count as the riverbed');
    assert.equal(water.water, 1, 'a natural river activates with at most one voxel of water');
    engine.applyChunk(chunk);
    assert.ok(chunk.waterColumns[16 * 32 + 16].y<=5.25,
      'activation cannot raise the water surface to the top of the tree');
    const bank = engine.activateColumn(17, 16);
    assert.equal(bank.bed, 3.5, 'adjacent trees do not become artificial solid levees');
  });
}

test('v11.3.5 spontaneous flow cannot lift a river up a nearby tree',()=>{
  const {chunk,world}=forestRiverWorld(true);
  const engine=new HydrologyEngine(world);
  const dryTree=chunk.waterColumns[16*32+17];
  assert.equal(dryTree,null);
  for(let i=0;i<7;i++)engine.update(.5,{x:16.5,z:16.5});
  engine.flushVisuals();
  const source=engine.cells.get('16,16');
  assert.ok(source);
  assert.equal(source.bed,3.5,'only the real terrain, never the trunk, is the riverbed');
  assert.ok(source.water>=0&&source.water<=1);
  assert.ok([...engine.cells.values()].every(c=>c.bed+c.water<=4.5+1e-6),
    'a one-block river cannot suddenly create a water head above its original level');
  const shown=chunk.waterColumns[16*32+16];
  assert.ok(shown===null || shown.y+.25<=4.5+1e-6);
  assert.ok(Math.abs(engine.balanceError())<1e-6);
});

test('v11.4 pre-settled natural water does not start flowing when the player arrives',()=>{
  const {chunk,world}=forestRiverWorld(true);
  chunk.waterColumns[16*32+16].stable=true;
  const engine=new HydrologyEngine(world);
  for(let i=0;i<20;i++)engine.update(.5,{x:16.5,z:16.5});
  assert.equal(engine.cells.size,0,'approaching new water must not activate the solver');
  assert.equal(chunk.waterColumns[16*32+16].depth,1.75,
    'the river geometry must stay at its original settled level');
  engine.onBlockEdit(16,5,16);
  assert.ok(engine.cells.size>0,'an actual edit may activate physical redistribution');
});

test('v11.4 migration stops old water cells passively redistributing in visited terrain',()=>{
  const {world,chunk}=forestRiverWorld(true);
  world.hybrid={hydrographyVersion:1};
  const engine=new HydrologyEngine(world);
  engine.insert(16,16,{bed:3.5,water:1,material:'sand'});
  const initial=engine.snapshot();
  for(let i=0;i<60;i++)engine.update(.5,{x:16,z:16});
  assert.deepEqual(engine.snapshot(),initial,'moving the camera never alters saved water');
  assert.equal(engine.cells.size,1,'no spontaneous neighbors or springs');
  engine.onBlockEdit(16,4,16);
  assert.equal(engine.editActivity,0,'new worlds never awaken finite-volume physics');
  assert.equal(engine.cells.size,1,'old solver state cannot spread on a block edit');
});

test('a new solid barrier above the old water level does not produce a taller tower', () => {
  const { chunk, world } = forestRiverWorld(true);
  chunk.hydrologyGround[16 * 32 + 16] = 9.5;
  const engine = new HydrologyEngine(world);
  const blocked = engine.activateColumn(16, 16);
  assert.equal(blocked.bed, 9.5);
  assert.equal(blocked.water, 0, 'a covered column cannot regenerate above the obstruction');
  engine.applyChunk(chunk);
  assert.equal(chunk.waterColumns[16 * 32 + 16], null);
});

test('voxel water never bends to an adjacent height, even across a high drop', () => {
  const upper = { y: 12.125, kind: 'river' };
  const lower = { y: 6.5, kind: 'river' };
  for (const [dx,dz] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
    assert.equal(waterCornerHeight(upper, 0, 0, dx, dz, () => lower), 12.375);
    assert.equal(waterCornerHeight(lower, 0, 0, dx, dz, () => upper), 6.75);
  }
  const curtains = waterfallFaces([upper, lower, null, null], 2);
  assert.equal(curtains.length, 1);
  assert.equal(curtains[0].waterfall, true);
  assert.equal(curtains[0].drop, 5.625);
});
