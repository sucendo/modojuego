import test from 'node:test';
import assert from 'node:assert/strict';
import { HydrologyEngine } from '../scripts/hydrologyEngine.js';
import { waterfallFaces, ICE_THICKNESS } from '../scripts/hydrologyV112.js';
import { waterCornerHeight, exposedBankFace, needsWaterMeshRefresh } from '../scripts/waterGeometry.js';

const close = (value, expected, tolerance = 1e-7) =>
  assert.ok(Math.abs(value - expected) < tolerance, `${value} ≠ ${expected}`);

test('a reservoir descends into a lower basin while accounting for every unit of water', () => {
  const engine = new HydrologyEngine();
  const reservoir = engine.insert(0, 0, { bed: 8.5, water: 3, material: 'impermeable' });
  engine.insert(1, 0, { bed: 7.5, water: 2, material: 'impermeable' });
  const channel = engine.insert(2, 0, { bed: 3.5, material: 'impermeable' });
  const lowerPool = engine.insert(3, 0, { bed: 2.5, material: 'impermeable' });
  for (let tick = 0; tick < 24; tick++) engine.step(.5, () => null, 0);
  assert.ok(reservoir.water < 3, 'the reservoir releases liquid');
  assert.ok(channel.water > .1, 'liquid enters the lower channel');
  assert.ok(lowerPool.water > .1, 'liquid propagates to the end of the channel');
  close(engine.total(), 5);
  close(engine.balanceError(), 0);
});

test('a solid levee cuts the current, then removing blocks reopens the channel', () => {
  const engine = new HydrologyEngine();
  const upstream = engine.insert(0, 0, { bed: 7.5, water: 2, material: 'impermeable' });
  const dam = engine.insert(1, 0, { bed: 14.5, material: 'impermeable' });
  const downstream = engine.insert(2, 0, { bed: 2.5, material: 'impermeable' });
  for (let tick = 0; tick < 12; tick++) engine.step(.5, () => null, 0);
  close(dam.water, 0);
  close(downstream.water, 0);
  close(upstream.water, 2);
  dam.bed = 2.5; // The player removed blocks holding the water back.
  for (let tick = 0; tick < 16; tick++) engine.step(.5, () => null, 0);
  assert.ok(dam.water > 0);
  assert.ok(downstream.water > 0);
  close(engine.total(), 2);
  close(engine.balanceError(), 0);
});

test('each water tile stays flat; neighboring levels meet at vertical voxel steps', () => {
  const cells = [{ y: 10, kind: 'river' }, { y: 10.2, kind: 'river' },
    { y: 10.3, kind: 'river' }, { y: 10.4, kind: 'river' }];
  const at = (x, z) => x >= 0 && x < 2 && z >= 0 && z < 2 ? cells[z * 2 + x] : null;
  for (let i = 0; i < cells.length; i++) {
    for (const [dx, dz] of [[-1,-1],[1,-1],[1,1],[-1,1]])
      close(waterCornerHeight(cells[i], i % 2, Math.floor(i / 2), dx, dz, at), cells[i].y + .25);
  }
  const risers = waterfallFaces(cells, 2);
  assert.equal(risers.length, 4, 'all small height differences are closed by short straight faces');
  assert.ok(risers.every(face => !face.waterfall), 'a small riser is not a waterfall');
  const upper = { y: 12, kind: 'river' }, lower = { y: 6, kind: 'river' };
  const waterfall = waterfallFaces([upper, lower, null, null], 2);
  assert.equal(waterfall.length, 1);
  close(waterfall[0].high - waterfall[0].low, 6);
  close(waterCornerHeight(upper, 0, 0, 1, -1, (x, z) => x === 1 && z === 0 ? lower : null), 12.25);
});

test('ice fills a complete voxel below the water line; dry banks hide ghost walls', () => {
  assert.equal(ICE_THICKNESS, 1);
  const water = { y: 10, depth: 3, kind: 'lake' };
  assert.equal(exposedBankFace(water, 11.5), null);
  assert.equal(exposedBankFace(water, 10.25), null);
  const exposed = exposedBankFace(water, 9.9);
  close(exposed.top, 10.25);
  close(exposed.bottom, 9.9);
  const deep = exposedBankFace(water, 0);
  close(deep.bottom, 7);
  const surface = water.y + .25;
  const iceBottom = surface - ICE_THICKNESS;
  close(surface - iceBottom, 1);
});

test('water geometry rebuilds only after an accumulated visible change', () => {
  const old = { y: 12, depth: 3, kind: 'river' };
  assert.equal(needsWaterMeshRefresh(old, { ...old, y: 12.015, depth: 2.985 }), false);
  assert.equal(needsWaterMeshRefresh(old, { ...old, y: 12.04 }), true);
  assert.equal(needsWaterMeshRefresh(old, { ...old, kind: 'lake' }), true);
  assert.equal(needsWaterMeshRefresh(null, old), true);
  assert.equal(needsWaterMeshRefresh(null, null), false);
});

test('the live chunk waits for a perceptible water change before regenerating its mesh', () => {
  const waterColumns = Array(32 * 32).fill(null);
  waterColumns[3 * 32 + 3] = { y: 9.25, depth: 2, kind: 'river' };
  const chunk = { loaded: true, position: { x: 0, z: 0 }, waterColumns, rebuilds: 0,
    refreshWater() { this.rebuilds++; } };
  const engine = new HydrologyEngine();
  const cell = engine.insert(3, 3, { bed: 7.5, water: 2, material: 'impermeable' });
  engine.applyChunk(chunk);
  assert.equal(chunk.rebuilds, 0);
  cell.water += .01;
  engine.applyChunk(chunk);
  assert.equal(chunk.rebuilds, 0);
  cell.water += .03;
  engine.applyChunk(chunk);
  assert.equal(chunk.rebuilds, 1);
  engine.applyChunk(chunk);
  assert.equal(chunk.rebuilds, 1);
  cell.water = 0;
  engine.applyChunk(chunk);
  assert.equal(chunk.rebuilds, 2);
});
