import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VoxelData } from '../scripts/voxelData.js';
import { DataStore } from '../scripts/dataStore.js';
import { graphicsProfile,normalizeGraphicsQuality } from '../scripts/graphicsQuality.js';

const source=name=>readFileSync(new URL(`../scripts/${name}`,import.meta.url),'utf8');

test('un chunk completo usa dos arrays compactos con 5 bytes por celda',()=>{
  const voxels=new VoxelData(32,32);
  assert.equal(voxels.length,32768);
  assert.equal(voxels.byteLength,32768*5);
  assert.equal(voxels.id(0,0,0),0);
  assert.equal(voxels.instance(31,31,31),-1);
  assert.equal(voxels.ids instanceof Uint8Array,true);
  assert.equal(voxels.instances instanceof Int32Array,true);
  assert.equal(voxels.id(-1,1,2),0);
  assert.equal(voxels.id(32,1,2),0);
});

test('los bloques y los IDs de instancias son independientes y admiten intercambio',()=>{
  const voxels=new VoxelData(32,32);
  voxels.setId(2,3,4,25);
  voxels.setInstance(2,3,4,144);
  voxels.setId(31,31,31,8);
  assert.equal(voxels.id(2,3,4),25);
  assert.equal(voxels.instance(2,3,4),144);
  voxels.setInstance(2,3,4,null);
  assert.equal(voxels.instance(2,3,4),-1);
  assert.equal(voxels.id(2,3,4),25);
  assert.equal(voxels.id(31,31,31),8);
  assert.equal(voxels.id(0,0,0),0);
});

test('la restauración localiza solo los bloques editados del chunk correcto',()=>{
  const store=new DataStore();
  store.data={'-32,0,2,3,4':8,'0,0,1,5,2':25,'0,0,1,5,3':0,'32,-32,4,9,4':21};
  assert.deepEqual([...store.entriesForChunk(0,0)],[[1,5,2,25],[1,5,3,0]]);
  assert.deepEqual([...store.entriesForChunk(-32,0)],[[2,3,4,8]]);
  assert.deepEqual([...store.entriesForChunk(32,-32)],[[4,9,4,21]]);
  assert.deepEqual([...store.entriesForChunk(64,0)],[]);
  store.set(0,0,5,6,7,22);
  assert.deepEqual([...store.entriesForChunk(0,0)].at(-1),[5,6,7,22]);
  store.set(0,0,5,6,7,0);
  assert.deepEqual([...store.entriesForChunk(0,0)].at(-1),[5,6,7,0]);
  store.clear();
  assert.deepEqual([...store.entriesForChunk(0,0)],[]);
});

test('sobrescribir datos al importar invalida el índice de bloques sin perder ediciones',()=>{
  const store=new DataStore();
  store.set(0,0,1,2,3,6);
  assert.deepEqual([...store.entriesForChunk(0,0)],[[1,2,3,6]]);
  store.data={'-32,0,1,2,3':8};
  assert.deepEqual([...store.entriesForChunk(0,0)],[]);
  assert.deepEqual([...store.entriesForChunk(-32,0)],[[1,2,3,8]]);
  assert.equal(store.get(-32,0,1,2,3),8);
});

test('perfiles de calidad controlan solo el render y limitan el pixel ratio',()=>{
  assert.equal(normalizeGraphicsQuality('extra'),'high');
  assert.deepEqual(graphicsProfile('low',4),{pixelRatio:1,shadowMapSize:512,shadowRadius:1,precipitation:.35});
  assert.deepEqual(graphicsProfile('medium',4),{pixelRatio:1.25,shadowMapSize:768,shadowRadius:2,precipitation:.7});
  assert.deepEqual(graphicsProfile('high',2),{pixelRatio:1.5,shadowMapSize:1024,shadowRadius:null,precipitation:1});
  assert.equal(graphicsProfile('high',1).pixelRatio,1);
});

test('la cámara y el mundo no cambian el formato de partidas por los ajustes locales',()=>{
  const chunk=source('worldChunk.js');
  const world=source('world.js');
  const cloud=source('cloudLayer.js');
  const perf=source('performanceUI.js');
  const save=source('saveManager.js');
  assert.match(chunk,/new VoxelData\(/);
  assert.match(chunk,/this\.dataStore\.entriesForChunk/);
  assert.match(world,/generationMsLast/);
  assert.match(world,/scheduleChunkGeneration/);
  assert.match(cloud,/MOVE_THRESHOLD_SQ/);
  assert.match(cloud,/cellCache\.get/);
  assert.match(perf,/event\.code!=='F3'/);
  assert.match(perf,/setPixelRatio/);
  assert.match(save,/const SAVE_VERSION = 15/);
});
