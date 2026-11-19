import test from 'node:test';
import assert from 'node:assert/strict';
import { HydrologyEngine } from '../scripts/hydrologyEngine.js';
import { waterfallFaces } from '../scripts/hydrologyV112.js';

function createWorld({ wet = [], chunks = [[0, 0]], heightAt = () => 1 } = {}) {
  const loaded = new Map();
  for (const [cx, cz] of chunks) {
    const waterColumns = Array(32 * 32).fill(null);
    const chunk = {
      loaded: true, position: { x: cx * 32, z: cz * 32 }, waterColumns, maxFilledY: 40, refreshes: 0,
      getBlockId(x, y, z) {
        return y <= heightAt(cx * 32 + x, cz * 32 + z) ? 8 : 0;
      },
      refreshWater() { this.refreshes++; }
    };
    loaded.set(`${cx},${cz}`, chunk);
  }
  for (const { x, z, depth = 2, kind = 'river' } of wet) {
    const c = loaded.get(`${Math.floor(x / 32)},${Math.floor(z / 32)}`);
    if (c) c.waterColumns[((z % 32) + 32) % 32 * 32 + ((x % 32) + 32) % 32] = {
      y: heightAt(x, z) + .5 + depth - .25, depth, kind
    };
  }
  const world = {
    type: 'classic', params: { seed: 1337, terrain: { waterOffset: 0 } }, chunkSize: { height: 80 },
    getChunk(cx, cz) { return loaded.get(`${cx},${cz}`) ?? null; }
  };
  return { world, loaded };
}

test('v11.3.5 water spreads downhill autonomously, without changing any block', () => {
  const { world, loaded } = createWorld({ wet: [{ x: 16, z: 16 }], heightAt: (x, z) => x === 16 && z === 16 ? 5 : 1 });
  const engine = new HydrologyEngine(world);
  assert.equal(engine.cells.size, 0);
  engine.update(.5, { x: 16.5, z: 16.5 });
  assert.ok(engine.cells.size>0,'existing water must begin moving without edits');
  assert.ok(engine.cells.has('16,16'), 'wet source was activated by observing it');
  assert.ok(engine.cells.has('17,16'), 'a dry downhill bank was activated before transport');
  assert.ok(engine.cells.get('17,16').water > 0, 'gravity filled the lower space');
  const waterAtFirstTick=engine.cells.get('17,16').water;
  engine.update(.5, { x: 16.5, z: 16.5 });
  assert.ok(engine.cells.get('17,16').water !== waterAtFirstTick,
    'liquid keeps evolving even when the player stands motionless');
  assert.ok(Math.max(...[...engine.cells.values()].map(c=>c.bed+c.water))<=6.5+1e-6,
    'the surface cannot rise above the initial source level without another source');
  assert.equal(engine.ledger.boundaryOut, 0);
  assert.ok(Math.abs(engine.balanceError()) < 1e-8);
  engine.flushVisuals();
  assert.ok(loaded.get('0,0').refreshes > 0);
  assert.ok(loaded.get('0,0').waterColumns[16 * 32 + 17], 'newly flooded ground renders');
});

test('water falls across a loaded chunk boundary instead of disappearing', () => {
  const { world, loaded } = createWorld({
    wet: [{ x: 31, z: 15, depth: 3 }], chunks: [[0, 0], [1, 0]],
    heightAt: (x, z) => x === 31 && z === 15 ? 7 : 1
  });
  const engine = new HydrologyEngine(world);
  engine.onBlockEdit(31,7,15);
  engine.update(.5, { x: 31, z: 15 });
  const downstream = engine.cells.get('32,15');
  assert.ok(downstream, 'adjacent loaded chunk must be in the active volume');
  assert.ok(downstream.water > .01, 'water crosses the 31/32 boundary');
  assert.equal(engine.ledger.boundaryOut, 0, 'no invisible border drain');
  assert.ok(Math.abs(engine.balanceError()) < 1e-8);
  engine.flushVisuals();
  assert.ok(loaded.get('1,0').waterColumns[15 * 32 + 0], 'other chunk displays the new water');
  const first = loaded.get('0,0').waterColumns[15 * 32 + 31];
  const second = loaded.get('1,0').waterColumns[15 * 32 + 0];
  const fall = waterfallFaces([first, second, null, null], 2);
  assert.equal(fall.length, 1);
  assert.equal(fall[0].axis, 'x');
  assert.ok(fall[0].high > fall[0].low, 'the fall remains vertical');
});

test('v11.3.5 natural flow crosses loaded chunk borders without player edits',()=>{
  const {world,loaded}=createWorld({
    wet:[{x:31,z:15,depth:3}],chunks:[[0,0],[1,0]],
    heightAt:(x,z)=>x===31&&z===15?7:1
  });
  const engine=new HydrologyEngine(world);
  engine.update(.5,{x:31.5,z:15.5});
  assert.ok(engine.cells.get('32,15')?.water>0,
    'gravity must move water into the next loaded chunk without edits');
  engine.flushVisuals();
  assert.ok(loaded.get('1,0').waterColumns[15*32],
    'the automatically flooded neighboring chunk displays its water');
  assert.ok(Math.abs(engine.balanceError())<1e-8);
});

test('an unloaded downstream chunk cannot silently absorb water', () => {
  const { world } = createWorld({
    wet: [{ x: 31, z: 16, depth: 2 }], chunks: [[0, 0]],
    heightAt: (x, z) => x === 31 && z === 16 ? 5 : 1
  });
  const engine = new HydrologyEngine(world);
  engine.onBlockEdit(31,5,16);
  engine.update(.5, { x: 31, z: 16 });
  const before = engine.total();
  for (let i = 0; i < 8; i++) engine.update(.5, { x: 31, z: 16 });
  assert.ok(engine.total() <= before + .01, 'no spontaneous mass creation');
  assert.equal(engine.ledger.boundaryOut, 0);
  assert.ok(Math.abs(engine.balanceError()) < 1e-6);
  assert.equal(engine.cells.has('32,16'), false, 'unloaded chunk is not sampled');
});

test('a new chunk can receive water when it becomes loaded later', () => {
  const { world, loaded } = createWorld({
    wet: [{ x: 31, z: 16, depth: 3 }], chunks: [[0, 0]],
    heightAt: (x, z) => x === 31 && z === 16 ? 6 : 1
  });
  const engine = new HydrologyEngine(world);
  engine.onBlockEdit(31,6,16);
  engine.update(.5, { x: 31, z: 16 });
  assert.equal(engine.cells.has('32,16'), false);
  const second = createWorld({ chunks: [[1, 0]] }).loaded.get('1,0');
  loaded.set('1,0', second);
  engine.update(.5, { x: 31, z: 16 });
  assert.ok(engine.cells.get('32,16')?.water > 0);
  assert.ok(Math.abs(engine.balanceError()) < 1e-6);
});

test('no nearby liquid means observation does not invent a source', () => {
  const { world } = createWorld();
  const engine = new HydrologyEngine(world);
  for (let i = 0; i < 6; i++) engine.update(.5, { x: 16, z: 16 });
  assert.equal(engine.cells.size, 0);
  assert.equal(engine.total(), 0);
});

test('the fluid redistribution accelerates visibly down a steep slope', () => {
  const engine = new HydrologyEngine();
  const upper = engine.insert(0, 0, { bed: 9.5, water: 2, material: 'impermeable' });
  const lower = engine.insert(1, 0, { bed: 2.5, water: 0, material: 'impermeable' });
  engine.step(.5, () => null, 0);
  assert.ok(lower.water > .5, `downhill flow too slow: ${lower.water}`);
  assert.ok(upper.water > 0 && upper.water < 2);
  assert.ok(Math.abs(engine.balanceError()) < 1e-8);
});

test('an uphill solid column acts as a dam, not an imaginary dry basin', () => {
  const { world } = createWorld({
    wet: [{ x: 16, z: 16, depth: 2 }],
    heightAt: (x, z) => x === 17 && z === 16 ? 14 : 5
  });
  const engine = new HydrologyEngine(world);
  engine.onBlockEdit(16,5,16);
  engine.update(.5, { x: 16, z: 16 });
  const uphill = engine.cells.get('17,16');
  assert.equal(uphill.bed, 14.5, 'the actual top of the hill was detected');
  for (let i = 0; i < 6; i++) engine.update(.5, { x: 16, z: 16 });
  assert.equal(uphill.water, 0, 'gravity cannot push water through a solid bank');
  assert.ok(Math.abs(engine.balanceError()) < 1e-6);
});
