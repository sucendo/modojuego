import { BASIN_SAVED_COLUMNS, BASIN_SAVED_NODES } from '../scripts/basinHydrology.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Inventory, ITEM_CATALOG, createStartingInventory } from '../scripts/inventory.js';
import { WORLD_TYPES, normalizeWorldType, applyWorldPreset } from '../scripts/worldTypes.js';
import { TERRAIN_V10, V10_HEIGHT, LEGACY_HEIGHT } from '../scripts/terrainV10.js';
import { TERRAIN_HYBRID, HYBRID_BLEND_BLOCKS, collectProtectedChunks, validateHybrid } from '../scripts/hybridTerrain.js';
import { TERRAIN_V11 } from '../scripts/hydrology.js';
import { TERRAIN_V112 } from '../scripts/hydrologyV112.js';
import {TERRAIN_HYBRID_V112,HYBRID_V112_SOURCES,validateHydrologyHybrid,sourceGenerator,makeHybridContext} from '../scripts/hybridHydrology.js';
import { validateStations } from '../scripts/stations.js';
import { PlaytimeTracker, validatePlaytime, emptyPlaytime } from '../scripts/playtime.js';
import { DayNightClock,validateDayNight,freshDayNight } from '../scripts/dayNight.js';
import { ProgressTracker,validateProgress,freshProgress } from '../scripts/progress.js';
import { ExplorationTracker,validateExploration,freshExploration } from '../scripts/exploration.js';
import { AchievementTracker,validateAchievements,freshAchievements } from '../scripts/achievements.js';
import { migrateFogPreferences } from '../scripts/fogAtmosphere.js';

// The persistence module is intentionally decoupled from WebGL. Inject only
// the block catalog and translation stub, so Node can test it without Three.js.
const code = fs.readFileSync(new URL('../scripts/saveManager.js', import.meta.url), 'utf8')
  .replace(/^import .*;\s*$/gm, '');
const resources = [
  { id: 3, scarcity: .8, scale: { x: 30, y: 30, z: 30 } },
  { id: 4, scarcity: .8, scale: { x: 20, y: 20, z: 20 } },
  { id: 5, scarcity: .9, scale: { x: 40, y: 40, z: 40 } }
];
globalThis.__testResources = resources;
globalThis.__testMigrateFogPrefs = migrateFogPreferences;
globalThis.__testTranslate = (key) => key;
globalThis.__testCatalog=ITEM_CATALOG;
globalThis.__createStartingInventory=createStartingInventory;
globalThis.__testWorldTypes=WORLD_TYPES;
globalThis.__testNormalize=normalizeWorldType;
globalThis.__testApplyPreset=applyWorldPreset;
globalThis.__testTerrain={TERRAIN_V10,TERRAIN_V11,TERRAIN_V112,V10_HEIGHT,LEGACY_HEIGHT};
globalThis.__testHybrid={TERRAIN_HYBRID,HYBRID_BLEND_BLOCKS,collectProtectedChunks,validateHybrid};
globalThis.__testHydroHybrid={TERRAIN_HYBRID_V112,HYBRID_V112_SOURCES,validateHydrologyHybrid};
globalThis.__validateStations=validateStations;
globalThis.__testPlaytime={PlaytimeTracker,validatePlaytime,emptyPlaytime};
globalThis.__testDayNight={DayNightClock,validateDayNight,freshDayNight};
globalThis.__testProgress={ProgressTracker,validateProgress,freshProgress};
globalThis.__testExploration={ExplorationTracker,validateExploration,freshExploration};
globalThis.__testAchievements={AchievementTracker,validateAchievements,freshAchievements};
const prepared = `const BASIN_SAVED_COLUMNS=${BASIN_SAVED_COLUMNS}, BASIN_SAVED_NODES=${BASIN_SAVED_NODES}; const migrateFogPreferences=globalThis.__testMigrateFogPrefs; const {TERRAIN_V10,TERRAIN_V11,TERRAIN_V112,V10_HEIGHT,LEGACY_HEIGHT}=globalThis.__testTerrain; const {TERRAIN_HYBRID,HYBRID_BLEND_BLOCKS,collectProtectedChunks,validateHybrid}=globalThis.__testHybrid; const {TERRAIN_HYBRID_V112,HYBRID_V112_SOURCES,validateHydrologyHybrid}=globalThis.__testHydroHybrid; const {ExplorationTracker,validateExploration,freshExploration}=globalThis.__testExploration; const {AchievementTracker,validateAchievements,freshAchievements}=globalThis.__testAchievements; const {DayNightClock,validateDayNight,freshDayNight}=globalThis.__testDayNight; const {ProgressTracker,validateProgress,freshProgress}=globalThis.__testProgress; const {PlaytimeTracker,validatePlaytime,emptyPlaytime}=globalThis.__testPlaytime; const validateStations = globalThis.__validateStations; const resources = globalThis.__testResources; const t = globalThis.__testTranslate; const ITEM_CATALOG = globalThis.__testCatalog; const createStartingInventory = globalThis.__createStartingInventory; const WORLD_TYPES = globalThis.__testWorldTypes; const normalizeWorldType = globalThis.__testNormalize; const applyWorldPreset = globalThis.__testApplyPreset;\n${code}`;
const { SaveManager } = await import(`data:text/javascript;base64,${Buffer.from(prepared).toString('base64')}`);

const local = new Map();
globalThis.localStorage = {
  getItem: (key) => local.get(key) ?? null,
  setItem: (key, value) => { local.set(key, value); },
  removeItem: (key) => local.delete(key)
};
globalThis.window = { confirm: () => true };
const classes = new Set();
const status = {
  textContent: '',
  classList: {
    toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
    add(name) { classes.add(name); },
    remove(name) { classes.delete(name); }
  }
};
const toolbarIcons = Array.from({ length: 9 }, (_, index) => ({
  id: `toolbar-${index}`,
  active: false,
  classList: { toggle(name, value) { if (name === 'selected') this.active = value; } }
}));
globalThis.document = {
  getElementById: () => status,
  querySelectorAll: () => toolbarIcons
};

function vector(values) {
  return {
    values: [...values],
    toArray() { return [...this.values]; },
    fromArray(values) { this.values = [...values]; return this; },
    set(...values) { this.values = values; return this; },
    normalize() { return this; }
  };
}

function fixture() {
  const world = {
    params: {
      seed: 0,
      terrain: { scale: 100, magnitude: 8, offset: 6, waterOffset: 4 },
      biomes: { scale: 500, variation: { amplitude: .2, scale: 50 }, tundraToTemperate: .25, temperateToJungle: .5, jungleToDesert: .75 },
      trees: { trunk: { minHeight: 4, maxHeight: 7 }, canopy: { minRadius: 3, maxRadius: 3, density: .7 }, frequency: .005 },
      clouds: { scale: 30, density: .3 }
    },
    type: 'classic',
    terrainVersion:1,chunkSize:{width:32,height:32}, hybrid:null, hybridProtectedSet:new Set(), chunkIndex:new Map(),
    dataStore: { data: { '1,1,2,3,4': 6, '-1,0,1,2,3': 0 } },
    drawDistance: 3,
    asyncLoading: true,
    generations: [],
    generate(clear, position) { this.generations.push([clear, position.toArray()]); }
  };
  const player = {
    position: vector([32, 24, 32]),
    camera: { quaternion: vector([0, 0, 0, 1]) },
    activeBlockId: 0, maxSpeed: 5, jumpSpeed: 10,
    tool: { container: { visible: true } },
    inventory: new Inventory(),
    input: vector([0, 0, 0]), velocity: vector([0, 0, 0]),
    sprinting: false, onGround: false, selectedCoords: null, selectionHelper: { visible: false }
  };
  const scene = { fog: { near: 50, far: 75 } };
  const physics = { simulationRate: 250 };
  let refreshCount = 0;
  const saves = new SaveManager(world, player, physics, scene, () => { refreshCount++; });
  return { world, player, physics, scene, saves, getRefresh: () => refreshCount };
}

test('round-trip captures edited blocks, world settings and player state', () => {
  const { saves, world, player, scene, getRefresh } = fixture();
  const snapshot = JSON.parse(JSON.stringify(saves.createSnapshot()));
  assert.equal(snapshot.format, 'minecraftjs-save');
  assert.equal(snapshot.version,19);
  assert.equal(snapshot.world.blocks['1,1,2,3,4'], 6);
  world.params.terrain.scale = 22;
  player.position.fromArray([999, 22, 111]);
  world.dataStore.data = {};
  scene.fog.near = 12;
  const terrainReference = world.params.terrain;
  saves.apply(saves.decode(snapshot));
  assert.equal(world.params.terrain, terrainReference, 'GUI bound object is preserved');
  assert.equal(world.params.terrain.scale, 100);
  assert.equal(world.dataStore.data['1,1,2,3,4'], 6);
  assert.deepEqual(player.position.toArray(), [32, 24, 32]);
  assert.equal(scene.fog.near, 50);
  assert.deepEqual(world.generations[0], [false, [32, 24, 32]]);
  assert.equal(getRefresh(), 1);
});

test('11.4.6 mantiene el volumen del embalse y valida sus desagües en JSON',()=>{
  const {saves,world}=fixture();
  const state={version:2,cells:[],pressure:[[15,16,1.25],[15,17,.5]],
    pressureInlets:[[16,16,.85,6.4,[[15,16]]]],
    pressureDrains:[[16,16,17,16,1.2]],suppressed:[[17,16]]};
  world.hydrology={snapshot:()=>state,restore(v){this.restored=v;}};
  const snapshot=saves.createSnapshot();
  const decoded=saves.decode(snapshot);
  assert.deepEqual(decoded.world.hydrology.pressure,state.pressure);
  assert.deepEqual(decoded.world.hydrology.pressureInlets,state.pressureInlets);
  assert.deepEqual(decoded.world.hydrology.pressureDrains,state.pressureDrains);
  saves.apply(decoded);
  assert.deepEqual(world.hydrology.restored.pressure,state.pressure);
  const malformed=structuredClone(snapshot);
  malformed.world.hydrology.pressureDrains=[[16,16,17,16,-1]];
  assert.throws(()=>saves.decode(malformed),'no permite desagües negativos');
});

test('weather-adjusted fog saves preferences, not momentary visibility, and migrates old defaults', () => {
  const {saves,scene}=fixture();
  scene.userData={fogPreferences:{near:95,far:150}};
  scene.fog.near=24;scene.fog.far=62; // temporary snowstorm view
  const snapshot=saves.createSnapshot();
  assert.equal(snapshot.settings.fogNear,95);
  assert.equal(snapshot.settings.fogFar,150);
  saves.apply(saves.decode(snapshot));
  assert.deepEqual(scene.userData.fogPreferences,{near:95,far:150});
  // The v10.1 hard-coded 50/75 were not an explicit weather preference.
  snapshot.settings.fogNear=50;snapshot.settings.fogFar=75;
  saves.apply(saves.decode(snapshot));
  assert.deepEqual(scene.userData.fogPreferences,{near:85,far:130});
});

test('cloud style survives round-trip, is validated, and legacy saves default to advanced', () => {
  const { saves, world } = fixture();
  world.cloudStyle='fast';
  const snapshot=saves.createSnapshot();
  assert.equal(snapshot.settings.cloudStyle,'fast');
  world.cloudStyle='fancy';
  saves.apply(saves.decode(snapshot));
  assert.equal(world.cloudStyle,'fast');
  assert.throws(()=>saves.decode({...snapshot,settings:{...snapshot.settings,cloudStyle:'unknown'}}),/invalidFile/);
  const old=structuredClone(snapshot);
  delete old.settings.cloudStyle;
  world.cloudStyle='fancy';
  saves.apply(saves.decode(old));
  assert.equal(world.cloudStyle,'advanced');
});

test('local save persists and load restores after modifications', () => {
  local.clear();
  const { saves, world } = fixture();
  assert.equal(saves.saveLocal(), true);
  world.dataStore.data = {};
  saves.loadLocal();
  assert.equal(world.dataStore.data['-1,0,1,2,3'], 0);
  assert.equal(status.textContent, 'loaded');
});

test('legacy F1/F2 saves remain importable from localStorage', () => {
  local.clear();
  const { saves, world } = fixture();
  local.set('minecraft_params', JSON.stringify(world.params));
  local.set('minecraft_data', JSON.stringify({ '0,0,1,2,3': 12 }));
  saves.loadLocal();
  assert.equal(world.dataStore.data['0,0,1,2,3'], 12);
});

test('malformed formats, invalid block IDs and unsupported versions are rejected', () => {
  const { saves } = fixture();
  const raw = JSON.parse(JSON.stringify(saves.createSnapshot()));
  assert.throws(() => saves.decode({}), /invalidFile/);
  assert.throws(() => saves.decode({ ...raw, version: 44 }), /unsupportedVersion/);
  assert.throws(() => saves.decode({ ...raw, world: { ...raw.world, blocks: { '1,1,2,3,4': 400 } } }), /invalidFile/);
  assert.throws(() => saves.decode({ ...raw, world: { ...raw.world, blocks: { __proto__: 7, foo: 3 } } }), /invalidFile/);
});

test('JSON import creates a separate world and saves it locally', async () => {
  local.clear();
  const { saves, player } = fixture();
  const raw = JSON.parse(JSON.stringify(saves.createSnapshot()));
  raw.player.position = [1000, 12, -3000];
  const json = JSON.stringify(raw);
  await saves.importFile({ size: json.length, text: async () => json });
  assert.deepEqual(player.position.toArray(), [1000, 12, -3000]);
  assert.equal(status.textContent, 'imported');
  const index = JSON.parse(local.get('minecraftjs_worlds_v2'));
  assert.equal(index.worlds.length, 2);
  assert.ok(local.get(`minecraftjs_slot_${index.activeId}`));
});


test('independent worlds keep their own blocks and player positions', () => {
  local.clear();
  const { saves, world, player } = fixture();
  assert.equal(saves.initialize(), true);
  const first = saves.currentWorld().id;
  assert.equal(saves.createWorld('Bosque', 777), true);
  const second = saves.currentWorld().id;
  assert.notEqual(first, second);
  assert.equal(world.params.seed, 777);
  assert.equal(Object.keys(world.dataStore.data).length, 0);
  world.dataStore.data['0,0,5,5,5'] = 15;
  player.position.fromArray([70, 31, 70]);
  assert.equal(saves.switchWorld(first), true);
  assert.equal(world.dataStore.data['1,1,2,3,4'], 6);
  assert.deepEqual(player.position.toArray(), [32,72,32]);
  assert.equal(saves.switchWorld(second), true);
  assert.equal(world.dataStore.data['0,0,5,5,5'], 15);
  assert.deepEqual(player.position.toArray(), [70,31,70]);
});

test('rename, duplicate and delete worlds are independent and preserve the last world', () => {
  local.clear();
  const { saves } = fixture();
  saves.initialize();
  const original = saves.currentWorld().id;
  assert.equal(saves.renameWorld(original,'  Refugio  '),true);
  assert.equal(saves.currentWorld().name,'Refugio');
  assert.equal(saves.duplicateWorld(original),true);
  assert.equal(saves.listWorlds().length,2);
  const duplicate = saves.listWorlds().find(world => world.id !== original);
  assert.ok(duplicate.name.includes('Refugio'));
  assert.equal(saves.deleteWorld(original),true);
  assert.equal(saves.listWorlds().length,1);
  assert.equal(saves.currentWorld().id,duplicate.id);
  assert.equal(saves.deleteWorld(duplicate.id),false);
});

test('autosave skips stationary snapshots but saves changes and movement', () => {
  local.clear();
  const { saves, world, player } = fixture();
  saves.initialize();
  let writes = 0;
  const original = localStorage.setItem;
  localStorage.setItem = (key,value) => { writes++; original(key,value); };
  try {
    saves.autosave();
    assert.equal(writes,0);
    player.position.fromArray([33,24,32]);
    saves.autosave();
    assert.ok(writes > 0);
    writes = 0;
    world.dataStore.data['1,1,2,3,4'] = 0;
    saves.markDirty();
    saves.autosave();
    assert.ok(writes > 0);
  } finally { localStorage.setItem = original; }
});

test('migrates the previous JSON save without deleting it', () => {
  local.clear();
  const { saves, world } = fixture();
  const old = saves.createSnapshot();
  old.version = 1;
  delete old.player.inventory;
  old.world.blocks = { '0,0,5,3,2': 12 };
  local.set('minecraftjs_save_v1',JSON.stringify(old));
  assert.equal(saves.initialize(),true);
  assert.equal(world.dataStore.data['0,0,5,3,2'],12);
  assert.ok(local.get('minecraftjs_save_v1'));
  assert.equal(saves.listWorlds().length,1);
});

test('inventories are saved per world and restored from exports', () => {
  local.clear();
  const { saves, player } = fixture();
  player.inventory.setMode('survival');
  player.inventory.add(6,3);
  saves.initialize();
  const first = saves.currentWorld().id;
  assert.equal(saves.createWorld('Second',1),true);
  assert.equal(player.inventory.mode,'creative');
  assert.equal(player.inventory.count(6),64); // new creative starter bar now includes a trunk
  saves.switchWorld(first);
  assert.equal(player.inventory.mode,'survival');
  assert.equal(player.inventory.count(6),3);
  const snapshot = saves.createSnapshot();
  assert.equal(snapshot.player.inventory.mode,'survival');
  assert.equal(snapshot.player.inventory.slots[0].id,6);
  assert.equal(snapshot.player.inventory.slots[0].count,3);
  assert.throws(() => saves.decode({ ...snapshot, player:{ ...snapshot.player,
    inventory:{mode:'survival',items:{6:1000000}} }}), /invalidFile/);
});


test('six world presets survive switching and are kept independently',()=>{
  local.clear();
  const {saves,world}=fixture();
  saves.initialize();
  const base=saves.currentWorld().id;
  for(const type of WORLD_TYPES){
    assert.equal(saves.createWorld(type,1234,type),true);
    assert.equal(world.type,type);
    assert.equal(saves.currentWorld().type,type);
    if(type==='ocean')assert.equal(world.params.terrain.waterOffset,8);
    if(type==='lava')assert.equal(world.params.trees.frequency,0);
    if(type==='jungle')assert.ok(world.params.trees.frequency>.04);
  }
  assert.equal(saves.switchWorld(base),true);
  assert.equal(world.type,'classic');
  assert.equal(world.params.terrain.offset,6);
});

test('v2 exported world and aggregated inventory are migrated without changing its blocks',()=>{
  const {saves,world,player}=fixture();
  const snapshot=saves.createSnapshot();
  snapshot.version=2;
  delete snapshot.world.type;
  snapshot.player.inventory={mode:'survival',items:{6:5,15:10}};
  player.inventory.restore();
  saves.apply(saves.decode(snapshot));
  assert.equal(world.type,'classic');
  assert.equal(world.dataStore.data['1,1,2,3,4'],6);
  assert.equal(player.inventory.count(6),5);
  assert.equal(player.inventory.count(15),10);
  assert.equal(saves.createSnapshot().version,19);
});

test('bad item stacks, world types and malformed grid are rejected',()=>{
  const {saves}=fixture();const snapshot=saves.createSnapshot();
  assert.throws(()=>saves.decode({...snapshot,world:{...snapshot.world,type:'unknown'}}),/invalidFile/);
  const invalid=structuredClone(snapshot);
  invalid.player.inventory.slots[0]={id:'wood_pickaxe',count:64};
  assert.throws(()=>saves.decode(invalid),/invalidFile/);
  const invalidGrid=structuredClone(snapshot);
  invalidGrid.player.inventory.craftGrid[8]={id:6,count:1};
  assert.throws(()=>saves.decode(invalidGrid),/invalidFile/);
});

test('new worlds have their own selected starter hotbar and support empty survival start',()=>{
  local.clear();
  const {saves,player}=fixture();
  assert.equal(saves.initialize(),true);
  assert.equal(saves.createWorld('Creative',123,'classic','creative'),true);
  assert.equal(player.inventory.getSelected().id,1);
  assert.equal(player.inventory.getSlot(4).id,8);
  assert.equal(saves.createWorld('Survival',124,'snow','survival',true),true);
  assert.equal(player.inventory.mode,'survival');
  assert.equal(player.inventory.getSlot(0).id,'wood_pickaxe');
  assert.equal(saves.createWorld('Empty',125,'ocean','survival',false),true);
  assert.equal(player.inventory.mode,'survival');
  assert.equal(player.inventory.slots.filter(Boolean).length,0);
});

test('bed respawn location and new furniture blocks survive exported JSON and switching',()=>{
  local.clear();
  const {saves,world,player}=fixture();
  assert.equal(saves.initialize(),true);
  const original=saves.currentWorld().id;
  player.respawnPoint=[17,19,28];
  for(const [i,id] of [21,22,23,24].entries())world.dataStore.data[`0,0,${i+1},5,6`]=id;
  const snapshot=saves.createSnapshot();
  assert.deepEqual(saves.decode(snapshot).player.respawnPoint,[17,19,28]);
  assert.equal(saves.createWorld('Other',125,'lava'),true);
  assert.equal(saves.switchWorld(original),true);
  assert.deepEqual(player.respawnPoint,[17,19,28]);
  assert.equal(world.dataStore.data['0,0,3,5,6'],23);
});

test('version 3 world files remain valid with the new block catalogue',()=>{
  const {saves}=fixture();
  const old=saves.createSnapshot();
  old.version=3;
  delete old.player.respawnPoint;
  assert.deepEqual(saves.decode(old).player.respawnPoint,[32,32,32]);
  assert.equal(saves.decode(old).player.inventory.mode,'creative');
});


test('v5 chests, furnaces and harvested animals are isolated per world and exported',()=>{
  local.clear();const {saves,world,player}=fixture();
  assert.equal(saves.initialize(),true);
  const first=saves.currentWorld().id;
  world.stations={'7,8,9':{kind:'chest',slots:[{id:15,count:6},...Array(26).fill(null)]}};
  world.removedAnimals=['1:1:0'];
  player.mineMode=true;
  const snap=saves.createSnapshot();
  assert.equal(snap.version,19);
  assert.equal(snap.world.stations['7,8,9'].slots[0].count,6);
  assert.deepEqual(snap.world.removedAnimals,['1:1:0']);
  assert.equal(saves.createWorld('Second',17,'ocean'),true);
  assert.deepEqual(world.stations,{});
  assert.deepEqual(world.removedAnimals,[]);
  world.stations={'9,9,9':{kind:'furnace',input:{id:8,count:1},fuel:{id:'coal',count:1},output:null,processing:null}};
  assert.equal(saves.switchWorld(first),true);
  assert.equal(world.stations['7,8,9'].slots[0].count,6);
  assert.equal(world.stations['9,9,9'],undefined);
  assert.deepEqual(world.removedAnimals,['1:1:0']);
  assert.equal(player.mineMode,true);
});

test('v4 save migration defaults missing workstation state and retains player selection',()=>{
  const {saves,world,player}=fixture();const raw=saves.createSnapshot();
  raw.version=4;delete raw.world.stations;delete raw.world.removedAnimals;delete raw.player.mineMode;
  raw.player.activeBlockId=15;
  saves.apply(saves.decode(raw));
  assert.deepEqual(world.stations,{});
  assert.deepEqual(world.removedAnimals,[]);
  assert.equal(player.mineMode,false);
});

test('v6 saves independent key-0 tool and E right-click object, and accepts v5 defaults',()=>{
  local.clear();
  const {saves,player}=fixture();
  player.equippedToolId='iron_pickaxe';
  player.rightObjectId=25;
  const snap=JSON.parse(JSON.stringify(saves.createSnapshot()));
  assert.equal(snap.version,19);
  assert.equal(snap.player.equippedToolId,'iron_pickaxe');
  assert.equal(snap.player.rightObjectId,25);
  const parsed=saves.decode(snap);
  assert.equal(parsed.player.equippedToolId,'iron_pickaxe');
  assert.equal(parsed.player.rightObjectId,25);
  player.equippedToolId='basic_pickaxe';player.rightObjectId=21;
  saves.apply(parsed);
  assert.equal(player.equippedToolId,'iron_pickaxe');
  assert.equal(player.rightObjectId,25);
  assert.throws(()=>saves.decode({...snap,player:{...snap.player,equippedToolId:'unknown'}}),/invalidFile/);
  assert.throws(()=>saves.decode({...snap,player:{...snap.player,rightObjectId:999}}),/invalidFile/);
  const old=JSON.parse(JSON.stringify(snap));old.version=5;
  delete old.player.equippedToolId;delete old.player.rightObjectId;
  assert.equal(saves.decode(old).player.equippedToolId,'basic_pickaxe');
  assert.equal(saves.decode(old).player.rightObjectId,21);
});

test('v6 saved worlds load in v7 with empty time history, then retain new playtime', () => {
  local.clear();
  const { saves } = fixture();
  const old = saves.createSnapshot();
  old.version = 6;
  delete old.playtime;
  const migrated = saves.decode(old);
  assert.deepEqual(migrated.playtime,{totalMs:0,sessions:[]});
  saves.apply(migrated);
  assert.equal(saves.playtime.total(),0);
  saves.initialize();
  const now='2026-11-06T15:00:00.000Z';
  saves.playtime.restore({totalMs:125000,sessions:[{startedAt:now,endedAt:'2026-11-06T15:02:05.000Z',durationMs:125000}]});
  assert.equal(saves.saveLocal(false),true);
  const snapshot=JSON.parse(local.get(saves.slotKey(saves.currentWorld().id)));
  assert.equal(snapshot.playtime.totalMs,125000);
  assert.equal(snapshot.playtime.sessions[0].startedAt,now);
  assert.equal(saves.decode(snapshot).playtime.totalMs,125000);
});

test('switching between worlds keeps separate session dates and accumulated hours',()=>{
  local.clear();
  const { saves }=fixture();
  saves.initialize();
  const first=saves.currentWorld().id;
  saves.playtime.restore({totalMs:62000,sessions:[{startedAt:'2026-11-06T09:00:00.000Z',endedAt:'2026-11-06T09:01:02.000Z',durationMs:62000}]});
  assert.equal(saves.createWorld('Lava',555,'lava'),true);
  assert.deepEqual(saves.playtime.snapshot(), {totalMs:0,sessions:[]});
  assert.equal(saves.switchWorld(first),true);
  assert.equal(saves.playtime.total(),62000);
  assert.equal(saves.playtime.snapshot().sessions.length,1);
});

test('malformed time history in an imported world is rejected',()=>{
  const {saves}=fixture();
  const raw=saves.createSnapshot();
  raw.playtime={totalMs:10000,sessions:[{startedAt:'hello',endedAt:'2026-11-06T15:00:00.000Z',durationMs:1000}]};
  assert.throws(()=>saves.decode(raw),/invalidFile/);
});


test('v7 worlds migrate to day 1 morning with empty progress; new state survives JSON round trip',()=>{
  const {saves}=fixture();
  const before=saves.createSnapshot();before.version=7;delete before.dayNight;delete before.progress;
  const old=saves.decode(before);
  assert.deepEqual(old.dayNight,freshDayNight());
  assert.deepEqual(old.progress,freshProgress());
  saves.apply(old);
  saves.dayNight.tick(95000);
  saves.progress.increment('blocksPlaced',12);
  saves.progress.spotSpecies('cow');
  const state=saves.createSnapshot();
  assert.equal(state.version,19);
  assert.equal(state.progress.blocksPlaced,12);
  assert.deepEqual(state.progress.speciesSeen,['cow']);
  assert.ok(state.dayNight.timeMs > freshDayNight().timeMs);
  assert.deepEqual(saves.decode(JSON.parse(JSON.stringify(state))).progress,state.progress);
});

test('world transitions, duplication and exported snapshots isolate calendar and statistics',()=>{
  local.clear();
  const {saves}=fixture();saves.initialize();
  const first=saves.currentWorld().id;
  saves.dayNight.tick(80000);saves.progress.increment('blocksBroken',23);
  assert.equal(saves.createWorld('Segundo',956,'jungle'),true);
  assert.equal(saves.dayNight.hour,8);
  assert.equal(saves.progress.snapshot().blocksBroken,0);
  saves.progress.increment('nightsSlept');
  const second=saves.currentWorld().id;
  assert.equal(saves.switchWorld(first),true);
  assert.equal(saves.progress.snapshot().blocksBroken,23);
  assert.equal(saves.progress.snapshot().nightsSlept,0);
  assert.ok(saves.dayNight.hour>8);
  assert.equal(saves.duplicateWorld(first),true);
  const duplicate=saves.listWorlds().find(w=>w.id!==first && w.id!==second);
  assert.ok(duplicate);
  assert.equal(saves.switchWorld(duplicate.id),true);
  assert.deepEqual(saves.progress.snapshot(),freshProgress());
  assert.equal(saves.dayNight.hour,8);
});

test('reject corrupted calendar and statistics without altering the loaded world',()=>{
  const {saves}=fixture(),original=saves.createSnapshot();
  for(const dayNight of [null,{day:0,timeMs:10},{day:1,timeMs:1200000},{day:2.3,timeMs:400000}])
    assert.throws(()=>saves.decode({...original,dayNight}),/invalidFile/);
  for(const progress of [null,{...freshProgress(),blocksPlaced:-1},{...freshProgress(),speciesSeen:['dragon']},
    {...freshProgress(),speciesSeen:['cow','cow']},{...freshProgress(),distanceMeters:Infinity}])
    assert.throws(()=>saves.decode({...original,progress}),/invalidFile/);
});

test('crafts are counted only when the output is actually accepted',()=>{
  const {saves,player}=fixture();
  player.inventory.restore(createStartingInventory('survival',false));
  player.inventory.add(6,1);
  const crafted=player.inventory.fillRecipe('planks');
  assert.equal(crafted,true);
  assert.equal(player.inventory.craft(),true);
  assert.equal(saves.progress.snapshot().itemsCrafted,4);
  assert.equal(player.inventory.craft(),false);
  assert.equal(saves.progress.snapshot().itemsCrafted,4);
});

test('v9 world creation enables deterministic landmarks, old worlds stay unchanged by default',()=>{
  local.clear();const {saves,world}=fixture();
  const previous=saves.createSnapshot();previous.version=8;
  delete previous.world.landmarksEnabled;delete previous.exploration;delete previous.achievements;
  const restored=saves.decode(previous);
  assert.equal(restored.world.landmarksEnabled,false);
  saves.apply(restored);assert.equal(world.landmarksEnabled,false);
  assert.equal(saves.initialize(),true);
  assert.equal(saves.createWorld('V9',921,'jungle'),true);
  assert.equal(world.landmarksEnabled,true);
  assert.equal(saves.createSnapshot().world.landmarksEnabled,true);
  assert.equal(saves.enableLandmarks(),false);
});

test('map markers and visited places remain separate when switching worlds',()=>{
  local.clear();const {saves}=fixture();saves.initialize();
  const first=saves.currentWorld().id;
  saves.exploration.observe({x:32,z:32});
  saves.exploration.addMarker('Mi casa',30,30,'home');
  saves.exploration.visitPoi('poi:4:4:ruin');
  assert.equal(saves.createWorld('Otro',44),true);
  assert.equal(saves.exploration.data.markers.length,0);
  assert.equal(saves.exploration.data.visitedPois.length,0);
  assert.equal(saves.switchWorld(first),true);
  assert.equal(saves.exploration.data.markers[0].name,'Mi casa');
  assert.equal(saves.exploration.data.visitedPois[0],'poi:4:4:ruin');
});

test('achievements are saved and restored; duplicates reset progress and medals',()=>{
  local.clear();const {saves}=fixture();saves.initialize();
  const first=saves.currentWorld().id;
  saves.progress.increment('blocksPlaced',100);
  assert.ok(saves.achievements.snapshot().unlocked.architect);
  const raw=saves.createSnapshot();
  const decoded=saves.decode(raw);
  assert.deepEqual(decoded.achievements,raw.achievements);
  assert.equal(saves.duplicateWorld(first),true);
  const duplicate=saves.listWorlds().find(w=>w.id!==first);
  assert.ok(duplicate);
  saves.switchWorld(duplicate.id);
  assert.equal(saves.progress.snapshot().blocksPlaced,0);
  assert.equal(Object.keys(saves.achievements.snapshot().unlocked).length,0);
});

test('malformed exploration and achievements are rejected without touching save state',()=>{
  const {saves}=fixture();const raw=saves.createSnapshot();
  assert.throws(()=>saves.decode({...raw,exploration:{...raw.exploration,markers:[{id:1,name:'Exploit',x:NaN,z:0,kind:'home'}]}}),/invalidFile/);
  assert.throws(()=>saves.decode({...raw,achievements:{unlocked:{impossible:'2026-11-12T10:00:00Z'}}}),/invalidFile/);
  assert.throws(()=>saves.decode({...raw,world:{...raw.world,landmarksEnabled:'true'}}),/invalidFile/);
  assert.equal(saves.decode({...raw,version:8,world:{...raw.world,landmarksEnabled:undefined}}).world.landmarksEnabled,false);
});

test('v11.3.4 worlds use the preserved hybrid generator and can edit up to level 79',()=>{
  local.clear();
  const {saves,world,player}=fixture();
  assert.equal(saves.initialize(),true);
  assert.equal(world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(world.chunkSize.height,V10_HEIGHT);
  assert.equal(player.position.toArray()[1],72);
  world.dataStore.data['1,1,2,65,4']=27;
  const snap=saves.createSnapshot();
  assert.equal(snap.version,19);
  assert.equal(snap.world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(saves.decode(snap).world.blocks['1,1,2,65,4'],27);
  world.terrainVersion=1;world.chunkSize.height=32;
  saves.apply(saves.decode(snap));
  assert.equal(world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(world.chunkSize.height,V10_HEIGHT);
  assert.equal(world.dataStore.data['1,1,2,65,4'],27);
  assert.throws(()=>saves.decode({...snap,world:{...snap.world,blocks:{'1,1,2,80,4':27}}}),/invalidFile/);
});

test('v9 imports continue using legacy generator and 32-block edits even after v10 re-save',()=>{
  const {saves,world}=fixture();
  const snap=saves.createSnapshot();
  snap.version=9;delete snap.world.terrainVersion;
  assert.equal(saves.decode(snap).world.terrainVersion,1);
  saves.apply(saves.decode(snap));
  assert.equal(world.terrainVersion,1);
  assert.equal(world.chunkSize.height,LEGACY_HEIGHT);
  const resaved=saves.createSnapshot();
  assert.equal(resaved.version,19);
  assert.equal(resaved.world.terrainVersion,1);
  assert.throws(()=>saves.decode({...resaved,world:{...resaved.world,blocks:{'1,1,1,50,1':3}}}),/invalidFile/);
  assert.throws(()=>saves.decode({...snap,world:{...snap.world,terrainVersion:2}}),/invalidFile/);
});

test('opening a previous-version world upgrades only unexplored chunks automatically',()=>{
  local.clear();
  const {saves,world}=fixture();
  const previous=saves.createSnapshot();previous.version=9;delete previous.world.terrainVersion;
  local.set('minecraftjs_save_v1',JSON.stringify(previous));
  assert.equal(saves.initialize(),true);
  assert.equal(world.chunkSize.height,V10_HEIGHT);
  assert.equal(world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(world.hybrid.sourceVersion,1);
  const original=saves.currentWorld().id;
  assert.equal(saves.createWorld('Cueva',834,'snow'),true);
  assert.equal(world.chunkSize.height,V10_HEIGHT);
  assert.equal(saves.switchWorld(original),true);
  assert.equal(world.chunkSize.height,V10_HEIGHT);
  assert.equal(world.terrainVersion,TERRAIN_HYBRID_V112);
});

test('v10.1 opt-in freezes old explored chunks and constructions before generating v10 terrain',()=>{
  local.clear();
  const {world,player,saves}=fixture();
  assert.equal(saves.initialize(),true);
  // Simulate an existing v9 save created before the terrain upgrade.
  const old=saves.createSnapshot();
  old.world.terrainVersion=1;
  delete old.world.hybrid;
  old.version=10;
  old.world.blocks['-8,13,2,2,1']=9;
  saves.apply(saves.decode(old));
  saves.exploration.observe(player.position);
  saves.exploration.addMarker('Mi casa',-180,22,'home');
  world.chunkIndex=new Map([['-4,9',{}],['0,0',{}]]);
  assert.equal(saves.enableMixedGeneration(),true);
  assert.equal(world.terrainVersion,3);
  assert.equal(world.chunkSize.height,80);
  assert.ok(world.hybridProtectedSet.has('-8,13'));
  assert.ok(world.hybridProtectedSet.has('-4,9'));
  assert.ok(world.hybridProtectedSet.has('-6,0')); // marker buffer
  assert.ok(world.hybridProtectedSet.has('1,1')); // explored
  const frozen=[...world.hybrid.legacyChunks];
  assert.equal(saves.currentWorld().terrainVersion,3);
  assert.equal(saves.createSnapshot().version,19);
  assert.equal(saves.enableMixedGeneration(),false); // one-way protection
  saves.exploration.observe({x:10000,z:10000});
  assert.deepEqual(world.hybrid.legacyChunks,frozen);
  assert.equal(saves.saveLocal(false),true);
  const snap=JSON.parse(local.get(saves.slotKey(saves.index.activeId)));
  assert.deepEqual(snap.world.hybrid.legacyChunks,frozen);
  assert.equal(saves.decode(snap).world.terrainVersion,3);
  const reopened=fixture();reopened.saves.apply(reopened.saves.decode(snap));
  assert.deepEqual(reopened.world.hybrid.legacyChunks,frozen);
  assert.equal(reopened.world.dataStore.data['-8,13,2,2,1'],9);
  // Above y31 is now legal for construction, while original chunks stay old.
  snap.world.blocks['1,1,3,73,2']=17;
  assert.equal(saves.decode(snap).world.blocks['1,1,3,73,2'],17);
});

test('v10.1 JSON validation rejects lost or corrupted frozen terrain data',()=>{
  local.clear();const {saves}=fixture();
  const original=saves.createSnapshot();
  const mixed=structuredClone(original);mixed.version=11;
  mixed.world.terrainVersion=3;
  mixed.world.hybrid={legacyChunks:['0,0'],blendBlocks:96};
  assert.equal(saves.decode(mixed).world.terrainVersion,3);
  for(const bad of [undefined, {legacyChunks:[],blendBlocks:96},
    {legacyChunks:['0,0','0,0'],blendBlocks:96}]){
    const snapshot=structuredClone(mixed);
    snapshot.world.hybrid=bad;
    assert.throws(()=>saves.decode(snapshot),/invalidFile/);
  }
  const old=structuredClone(original);old.version=10;
  assert.equal(saves.decode(old).world.terrainVersion,1);
  assert.throws(()=>saves.decode({...old,world:{...old.world,terrainVersion:3,hybrid:mixed.world.hybrid}}),/invalidFile/);
});

test('v11.4.2 new worlds export hybrid hydrography v3, while old v11 and v10 saves still import',()=>{
  local.clear();
  const {saves,world}=fixture();
  assert.equal(saves.initialize(),true);
  const v112=saves.createSnapshot();
  assert.equal(v112.version,19);
  assert.equal(v112.world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(v112.world.hybrid.hydrographyVersion,3);
  assert.equal(saves.decode(v112).world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(saves.createWorld('Islas v11.2',21,'ocean'),true);
  assert.equal(world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(world.chunkSize.height,80);
  assert.equal(world.hybrid.hydrographyVersion,3);
  const v11={...saves.createSnapshot(),version:12,
    world:{...saves.createSnapshot().world,terrainVersion:TERRAIN_V11,hybrid:undefined}};
  assert.equal(saves.decode(v11).world.terrainVersion,TERRAIN_V11);
  const v10={...saves.createSnapshot(),version:11,world:{...saves.createSnapshot().world,terrainVersion:TERRAIN_V10,hybrid:undefined}};
  assert.equal(saves.decode(v10).world.terrainVersion,TERRAIN_V10);
  assert.throws(()=>saves.decode({...v10,world:{...v10.world,terrainVersion:TERRAIN_V11}}),/invalidFile/);
  assert.throws(()=>saves.decode({...v11,world:{...v11.world,terrainVersion:TERRAIN_V112}}),/invalidFile/);
  saves.apply(saves.decode(v10));
  assert.equal(world.terrainVersion,TERRAIN_V10);
  assert.equal(world.chunkSize.height,80);
});

test('v11.4.2 upgrades v11.3.5 hydrography only outside every explored or edited chunk',()=>{
  local.clear();
  const {saves,world}=fixture();
  assert.equal(saves.initialize(),true);
  const previous=saves.createSnapshot();
  previous.world.hybrid={sourceVersion:5,protectedChunks:['1,1'],blendBlocks:96};
  previous.exploration.explored=['10,11'];
  previous.world.blocks['20,20,4,12,4']=3;
  previous.world.hydrology={version:2,cells:[
    [10*32+5,11*32+4,.6,.2,'sand','river'],
    [40*32+5,40*32+4,1,.1,'rock','river']]};
  const upgraded=saves.upgradeSnapshot(previous,saves.decode(previous));
  assert.ok(upgraded);
  assert.equal(upgraded.world.hybrid.hydrographyVersion,3);
  assert.equal(upgraded.world.hybrid.sourceVersion,5);
  for(const k of ['1,1','10,11','20,20'])
    assert.ok(upgraded.world.hybrid.protectedChunks.includes(k),`original ${k} preserved`);
  assert.equal(upgraded.world.blocks['20,20,4,12,4'],3);
  assert.deepEqual(upgraded.world.hydrology.cells,[previous.world.hydrology.cells[0]]);
  assert.equal(saves.upgradeSnapshot(upgraded,saves.decode(upgraded)),null,
    'the upgrade is idempotent and must not migrate already generated land twice');
  saves.apply(saves.decode(upgraded));
  assert.equal(world.hybrid.hydrographyVersion,3);
  assert.ok(world.hybridProtectedSet.has('10,11'));
});

test('v11.4.0 discovered rivers retain the exact first-generation hydrology across v11.4.2 migration',()=>{
  local.clear();
  const {saves,world}=fixture();
  assert.equal(saves.initialize(),true);
  const old=saves.createSnapshot();
  old.world.hybrid={sourceVersion:5,protectedChunks:['1,1'],blendBlocks:96,hydrographyVersion:1};
  old.exploration.explored=['14,15'];
  old.world.blocks['26,27,5,2,3']=2;
  old.world.hydrology={version:2,cells:[[14*32+2,15*32+3,.8,.1,'rock','river']]};
  const upgraded=saves.upgradeSnapshot(old,saves.decode(old));
  assert.ok(upgraded);
  assert.equal(upgraded.world.hybrid.hydrographyVersion,3);
  assert.deepEqual(upgraded.world.hybrid.hydrographyV1BaseChunks,['1,1']);
  assert.ok(upgraded.world.hybrid.hydrographyV1Chunks.includes('14,15'));
  assert.ok(upgraded.world.hybrid.hydrographyV1Chunks.includes('26,27'));
  assert.ok(upgraded.world.hybrid.protectedChunks.includes('26,27'));
  assert.equal(upgraded.world.blocks['26,27,5,2,3'],2);
  assert.deepEqual(upgraded.world.hydrology.cells,old.world.hydrology.cells);
  assert.equal(saves.upgradeSnapshot(upgraded,saves.decode(upgraded)),null);
  const hybrid=saves.decode(upgraded).world.hybrid;
  assert.equal(sourceGenerator(hybrid,14,15),TERRAIN_HYBRID_V112);
  assert.equal(sourceGenerator(hybrid,1,1),5);
  assert.throws(()=>saves.decode({...upgraded,world:{...upgraded.world,hybrid:{...hybrid,
    hydrographyV1BaseChunks:['14,15']}}}),/invalidFile/,
    'an inconsistent first-generation origin must be rejected');
  assert.throws(()=>saves.decode({...upgraded,world:{...upgraded.world,hybrid:{...hybrid,
    hydrographyV1Chunks:['100,100']}}}),/invalidFile/,
    'a saved unprotected chunk cannot masquerade as explored land');
  const historical=makeHybridContext(new Set(hybrid.protectedChunks),new Set(),hybrid,14,15);
  assert.equal(historical.hybrid.hydrographyVersion,1);
  assert.deepEqual([...historical.protectedSet],['1,1']);
  assert.equal(makeHybridContext(new Set(hybrid.protectedChunks),new Set(),hybrid,60,60).hybrid.hydrographyVersion,3);
  saves.apply(saves.decode(upgraded));
  assert.equal(world.hybridV1Set.has('14,15'),true);
  assert.equal(world.hybridV1Set.has('26,27'),true);
});

test('v11.4.1 river networks and their original transition edges survive the v11.4.2 upgrade',()=>{
  local.clear();
  const {saves,world}=fixture();
  assert.equal(saves.initialize(),true);
  const old=saves.createSnapshot();
  old.world.hybrid={sourceVersion:5,protectedChunks:['1,1','14,15'],blendBlocks:96,
    hydrographyVersion:2,hydrographyV1Chunks:['14,15'],hydrographyV1BaseChunks:['1,1']};
  old.exploration.explored=['30,31'];
  old.world.blocks['40,41,2,8,9']=11;
  const migrated=saves.upgradeSnapshot(old,saves.decode(old));
  assert.ok(migrated);
  const h=migrated.world.hybrid;
  assert.equal(h.hydrographyVersion,3);
  assert.deepEqual(h.hydrographyV1Chunks,['14,15']);
  assert.deepEqual(h.hydrographyV1BaseChunks,['1,1']);
  assert.deepEqual(h.hydrographyV2BaseChunks,['1,1','14,15']);
  assert.ok(h.hydrographyV2Chunks.includes('30,31'));
  assert.ok(h.hydrographyV2Chunks.includes('40,41'));
  assert.equal(sourceGenerator(h,14,15),TERRAIN_HYBRID_V112);
  assert.equal(sourceGenerator(h,30,31),TERRAIN_HYBRID_V112);
  const frozen=new Set(h.protectedChunks);
  const v1=makeHybridContext(frozen,new Set(),h,14,15);
  const v2=makeHybridContext(frozen,new Set(),h,30,31);
  const v3=makeHybridContext(frozen,new Set(),h,80,80);
  assert.equal(v1.hybrid.hydrographyVersion,1);
  assert.deepEqual([...v1.protectedSet],['1,1']);
  assert.equal(v2.hybrid.hydrographyVersion,2);
  assert.deepEqual([...v2.protectedSet],['1,1','14,15']);
  assert.equal(v3.hybrid.hydrographyVersion,3);
  assert.equal(saves.upgradeSnapshot(migrated,saves.decode(migrated)),null);
  saves.apply(saves.decode(migrated));
  assert.ok(world.hybridV1Set.has('14,15'));
  assert.ok(world.hybridV2Set.has('30,31'));
  assert.equal(world.dataStore.data['40,41,2,8,9'],11);
  assert.throws(()=>saves.decode({...migrated,world:{...migrated.world,hybrid:{...h,
    hydrographyV2BaseChunks:['1,1']}}}),/invalidFile/);
});

test('v11.2.1 migrates an old stored world without prompts and freezes original edits',()=>{
  local.clear();
  const {saves,world}=fixture();
  const old=saves.createSnapshot();
  old.version=13;old.world.terrainVersion=TERRAIN_V11;
  old.world.blocks['-8,13,2,2,1']=9;
  old.exploration.explored=['1,1'];
  const id='wabcdef123';
  local.set(saves.slotKey(id),JSON.stringify(old));
  local.set('minecraftjs_worlds_v2',JSON.stringify({version:2,activeId:id,
    worlds:[{id,name:'Casa antigua',type:'classic',seed:0,terrainVersion:4,savedAt:old.savedAt}]}));
  const oldConfirm=window.confirm;
  window.confirm=()=>{throw new Error('migration must not request permission');};
  try {assert.equal(saves.initialize(),true);}finally{window.confirm=oldConfirm;}
  assert.equal(world.terrainVersion,TERRAIN_HYBRID_V112);
  assert.equal(world.hybrid.sourceVersion,TERRAIN_V11);
  assert.ok(world.hybridProtectedSet.has('-8,13'));
  assert.ok(world.hybridProtectedSet.has('1,1'));
  assert.ok(world.hybridProtectedSet.has('1,1'));
  assert.equal(world.dataStore.data['-8,13,2,2,1'],9);
  const migrated=JSON.parse(local.get(saves.slotKey(id)));
  assert.equal(migrated.version,19);
  assert.equal(migrated.world.terrainVersion,6);
  assert.equal(saves.currentWorld().terrainVersion,6);
  const frozen=structuredClone(migrated.world.hybrid.protectedChunks);
  saves.exploration.observe({x:10000,z:10000});
  assert.equal(saves.saveLocal(false),true);
  assert.deepEqual(JSON.parse(local.get(saves.slotKey(id))).world.hybrid.protectedChunks,frozen);
  const reopened=fixture();
  reopened.saves.apply(reopened.saves.decode(JSON.parse(local.get(saves.slotKey(id)))));
  assert.equal(reopened.world.terrainVersion,6);
  assert.deepEqual(reopened.world.hybrid.protectedChunks,frozen);
});

test('existing v10.1 mixed worlds upgrade automatically without losing two old generators',()=>{
  const {saves,world}=fixture();
  const old=saves.createSnapshot();
  old.version=13;old.world.terrainVersion=TERRAIN_HYBRID;
  old.world.hybrid={legacyChunks:['-9,0','0,0'],blendBlocks:96};
  old.exploration.explored=['2,0'];
  const upgraded=saves.upgradeSnapshot(old,saves.decode(old));
  assert.equal(upgraded.world.hybrid.sourceVersion,3);
  assert.ok(upgraded.world.hybrid.protectedChunks.includes('-9,0'));
  assert.ok(upgraded.world.hybrid.protectedChunks.includes('2,0'));
  assert.deepEqual(upgraded.world.hybrid.legacyChunks,['-9,0','0,0']);
  saves.apply(saves.decode(upgraded));
  assert.equal(world.terrainVersion,6);
  assert.ok(world.hybridLegacySet.has('-9,0'));
});

test('importing an older world upgrades it without a separate activation step',async()=>{
  local.clear();const {saves,world}=fixture();
  assert.equal(saves.initialize(),true);
  const old=saves.createSnapshot();
  old.version=12;old.world.terrainVersion=TERRAIN_V11;
  delete old.world.hybrid;
  old.world.blocks['8,8,4,18,4']=17;
  old.name='Mundo anterior';
  const file={size:JSON.stringify(old).length,name:'original.json',
    text:async()=>JSON.stringify(old)};
  const previous=window.confirm;
  window.confirm=()=>{throw new Error('no prompt expected');};
  try{assert.equal(await saves.importFile(file),true);}finally{window.confirm=previous;}
  assert.equal(world.terrainVersion,6);
  assert.ok(world.hybridProtectedSet.has('8,8'));
  assert.equal(world.dataStore.data['8,8,4,18,4'],17);
  assert.equal(saves.currentWorld().terrainVersion,6);
  const saved=JSON.parse(local.get(saves.slotKey(saves.index.activeId)));
  assert.equal(saved.world.terrainVersion,6);
  assert.equal(saved.version,19);
});

test('failed migration write keeps the old world and its stored bytes untouched',()=>{
  local.clear();
  const {saves,world}=fixture();
  const old=saves.createSnapshot();old.version=13;old.world.terrainVersion=4;
  const id='wabcdd001';const before=JSON.stringify(old);
  local.set(saves.slotKey(id),before);
  local.set('minecraftjs_worlds_v2',JSON.stringify({version:2,activeId:id,
    worlds:[{id,name:'Backup',type:'classic',seed:0,terrainVersion:4,savedAt:old.savedAt}]}));
  const setter=localStorage.setItem;
  localStorage.setItem=(key,value)=>{
    if(key===saves.slotKey(id))throw new Error('quota');
    return setter(key,value);
  };
  try {assert.equal(saves.initialize(),true);}finally{localStorage.setItem=setter;}
  assert.equal(world.terrainVersion,TERRAIN_V11);
  assert.equal(local.get(saves.slotKey(id)),before);
});

test('v11.3.4 resets old broken water dynamics, while preserving valid new water state',()=>{
  const {saves,world}=fixture();
  const old=saves.createSnapshot();old.version=14;delete old.world.hydrology;
  assert.deepEqual(saves.decode(old).world.hydrology,{version:2,cells:[]});
  const snapshot=saves.createSnapshot();
  const savedLegacyHydrology={version:1,cells:[[4,-2,1.5,.25,'sand','river']]};
  snapshot.world.hydrology=savedLegacyHydrology;
  assert.deepEqual(saves.decode(snapshot).world.hydrology,{version:2,cells:[]},
    'old transient floods cannot survive into the repaired water renderer');
  snapshot.world.hydrology={version:2,cells:[[4,-2,1.5,.25,'sand','river']]};
  assert.deepEqual(saves.decode(snapshot).world.hydrology,snapshot.world.hydrology);
  let restored;
  world.hydrology={restore(v){restored=v;}};
  saves.apply(saves.decode(snapshot));
  assert.deepEqual(restored,snapshot.world.hydrology);
  for(const invalid of [
    {version:1,cells:[[4,-2,-1,.25,'sand','river']]},
    {version:1,cells:[[4,-2,1,.25,'unknown','river']]},
    {version:1,cells:[[4,-2,1,.25,'sand','river'],[4,-2,2,.25,'sand','river']]},
    {version:3,cells:[]}
  ]){
    snapshot.world.hydrology=invalid;
    assert.throws(()=>saves.decode(snapshot),/invalidFile/);
  }
});

test('v11.4.3 saved flowing water has bounded validated levels and survives roundtrip',()=>{
  const {saves}=fixture();
  const snapshot=saves.createSnapshot();
  snapshot.world.hydrology={version:2,cells:[],flows:[
    [-12,34,7.125,.125,'river'],[0,0,4.75,.875,'lake']]};
  assert.deepEqual(saves.decode(snapshot).world.hydrology,snapshot.world.hydrology);
  for(const invalidFlows of [
    [[0,0,2,0,'river']],[[0,0,2,1.125,'river']],
    [[0,0,2,.5,'unknown']],[[0,0,2,.5,'river'],[0,0,3,.5,'river']],
    [[0,0,Infinity,.5,'river']]]){
    snapshot.world.hydrology={version:2,cells:[],flows:invalidFlows};
    assert.throws(()=>saves.decode(snapshot),/invalidFile/);
  }
});

test('v11.5.0 cave volumes and snow layers survive JSON validation and reject malformed records',()=>{
  const {saves}=fixture(),snapshot=saves.createSnapshot();
  const environment={water:[[0,0,2.5,0],[-32,8,7.5,2.1]],snow:[[2,-3,12,.12]]};
  snapshot.world.hydrology={version:2,cells:[],environment};
  assert.deepEqual(saves.decode(snapshot).world.hydrology.environment,environment);
  for(const bad of [
    {water:[[0,0,2.5,-1]],snow:[]},
    {water:[[0,0,2.25,1]],snow:[]},
    {water:[[0,0,2.5,NaN]],snow:[]},
    {water:[],snow:[[0,0,2,.5]]},
    {water:[[0,0,2.5,1],[0,0,2.5,2]],snow:[]},
    {water:[],snow:[[0,0,2,.1],[0,0,3,.1]]}
  ]){
    snapshot.world.hydrology.environment=bad;
    assert.throws(()=>saves.decode(snapshot),/invalidFile/);
  }
});

test('v11.5.0 subvisible pressure remainders survive saving without rounding to an invalid zero',()=>{
  const {saves}=fixture(),snapshot=saves.createSnapshot();
  snapshot.world.hydrology={version:2,cells:[],pressure:[[0,0,.00000001]]};
  assert.equal(saves.decode(snapshot).world.hydrology.pressure[0][2],.00000001);
});

test('finite lake volumes, dry managed columns and displaced water survive validated JSON saving',()=>{
 const {saves}=fixture(),snapshot=saves.createSnapshot();
 const basins={columns:[[1,2,[[.5,1.23456789,'lake'],[8.5,0,'river']]],[2,2,[[.5,0,'lake']]]],displaced:[[1,2,.0000001]]};
 snapshot.world.hydrology={version:2,cells:[],basins};
 assert.deepEqual(saves.decode(JSON.parse(JSON.stringify(snapshot))).world.hydrology.basins,basins);
 assert.equal(snapshot.version,19);
 for(const invalid of [
  {columns:[[1,2,[[.5,-1,'lake']]]],displaced:[]},
  {columns:[[1,2,[[.5,1,'lake'],[.5,2,'lake']]]],displaced:[]},
  {columns:[[1,2,[[.5,1,'lake']]],[1,2,[]]],displaced:[]},
  {columns:[[1,2,[[1.25,1,'lake']]]],displaced:[]},
  {columns:[],displaced:[[1,2,Infinity]]}
 ]){
  snapshot.world.hydrology.basins=invalid;assert.throws(()=>saves.decode(snapshot),/invalidFile/);
 }
 const old=saves.createSnapshot();old.version=15;assert.equal(saves.decode(old).world.type,old.world.type,'previous files remain readable');
});


test('extended finite-water records preserve parked areas and focus in format 17',()=>{
 const {saves}=fixture(),snapshot=saves.createSnapshot();
 const basins={focus:[4200,0],columns:Array.from({length:4200},(_,x)=>[x,0,[[.5,.25,'lake']]]),displaced:[]};
 snapshot.world.hydrology={version:2,cells:[],basins};
 assert.deepEqual(saves.decode(JSON.parse(JSON.stringify(snapshot))).world.hydrology.basins,basins);
 snapshot.world.hydrology.basins.focus=[Infinity,0];assert.throws(()=>saves.decode(snapshot),/invalidFile/);
 snapshot.world.hydrology.basins={columns:[],displaced:[]};snapshot.version=16;
 assert.ok(saves.decode(snapshot),'11.6.0/11.6.1 finite saves remain readable');
});


test('format 18 preserves frost, cold exposure and the equipped broom while importing format 17',()=>{
 const {saves}=fixture(),snapshot=saves.createSnapshot();
 const environment={water:[],snow:[[2,-3,12,.12,.06,55]]};
 snapshot.world.hydrology={version:2,cells:[],environment};
 snapshot.player.equippedToolId='broom';snapshot.player.inventory.mode='creative';
 const result=saves.decode(JSON.parse(JSON.stringify(snapshot)));
 assert.deepEqual(result.world.hydrology.environment,environment);assert.equal(result.player.equippedToolId,'broom');assert.equal(snapshot.version,19);
 for(const row of [[2,-3,12,.12,.13,55],[2,-3,12,.12,-.01,55],[2,-3,12,.12,.06,NaN],[2,-3,12,.12,.06,121],[2,-3,12,.12,.06]]){
  snapshot.world.hydrology.environment={water:[],snow:[row]};assert.throws(()=>saves.decode(snapshot),/invalidFile/);
 }
 snapshot.version=17;snapshot.player.equippedToolId='basic_pickaxe';snapshot.world.hydrology.environment={water:[],snow:[[2,-3,12,.12]]};
 assert.deepEqual(saves.decode(snapshot).world.hydrology.environment.snow,[[2,-3,12,.12]]);
});

test('format 19 saves construction directions, spear, ore items and soil evolution and accepts format 18',()=>{
 const {saves}=fixture(),snapshot=saves.createSnapshot();snapshot.player.inventory.mode='creative';snapshot.player.equippedToolId='spear';
 snapshot.world.blocks={'0,0,2,3,4':38,'0,0,3,3,4':46,'0,0,4,3,4':47,'0,0,5,3,4':53};
 const soil=[[2,3,8,.65,.43,0]];snapshot.world.hydrology={version:2,cells:[],environment:{water:[],snow:[],soil}};
 const restored=saves.decode(JSON.parse(JSON.stringify(snapshot)));assert.deepEqual({...restored.world.blocks},snapshot.world.blocks);assert.deepEqual(restored.world.hydrology.environment.soil,soil);assert.equal(restored.player.equippedToolId,'spear');
 for(const invalid of [[[2,3,8,1.01,.43,0]],[[2,3,8,.5,NaN,0]],[[2,3,8,.5,.4,241]],[[2,3,8,.5,.4,0],[2,3,9,.5,.4,0]]]){
  snapshot.world.hydrology.environment.soil=invalid;assert.throws(()=>saves.decode(snapshot),/invalidFile/);
 }
 const old=saves.createSnapshot();old.version=18;assert.ok(saves.decode(old));
});


test('format 19 retains integer-height water floors on half slabs',()=>{
 const {saves}=fixture(),snapshot=saves.createSnapshot();
 snapshot.world.hydrology={version:2,cells:[],basins:{columns:[[0,0,[[7,.2,'river']]]],displaced:[]},environment:{water:[[0,0,7,.2]],snow:[]}};
 const restored=saves.decode(JSON.parse(JSON.stringify(snapshot)));
 assert.deepEqual(restored.world.hydrology.basins.columns,snapshot.world.hydrology.basins.columns);
 assert.deepEqual(restored.world.hydrology.environment.water,[[0,0,7,.2]]);
});

 test('new worlds never inherit water or legacy ice from another world',()=>{
  local.clear();const {saves,world}=fixture();saves.initialize();
  const old={version:2,cells:[],environment:{water:[[0,0,2.5,.5]],snow:[]}};
  world.hydrology={snapshot:()=>old,restore(v){this.restored=v;}};
  assert.equal(saves.createWorld('Volcan',42,'lava'),true);
  assert.deepEqual(world.hydrology.restored,{version:2,cells:[]});
  assert.equal(world.type,'lava');assert.equal(saves.dayNight.day,1);assert.equal(saves.playtime.total(),0);
 });
