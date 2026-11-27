import { BASIN_SAVED_COLUMNS, BASIN_SAVED_NODES } from './basinHydrology.js';
import { resources } from './blocks.js';
import { migrateFogPreferences } from './fogAtmosphere.js';
import { t } from './i18n.js';
import { ITEM_CATALOG, createStartingInventory } from './inventory.js';
import { WORLD_TYPES, normalizeWorldType, applyWorldPreset } from './worldTypes.js';
import { TERRAIN_V10, V10_HEIGHT, LEGACY_HEIGHT } from './terrainV10.js';
import { TERRAIN_HYBRID, HYBRID_BLEND_BLOCKS, collectProtectedChunks, validateHybrid } from './hybridTerrain.js';
import { TERRAIN_V11 } from './hydrology.js';
import { TERRAIN_V112 } from './hydrologyV112.js';
import { TERRAIN_HYBRID_V112, HYBRID_V112_SOURCES, validateHydrologyHybrid } from './hybridHydrology.js';
import { validateStations } from './stations.js';
import { PlaytimeTracker, validatePlaytime, emptyPlaytime } from './playtime.js';
import { DayNightClock, validateDayNight, freshDayNight } from './dayNight.js';
import { ProgressTracker, validateProgress, freshProgress } from './progress.js';
import { ExplorationTracker, validateExploration, freshExploration } from './exploration.js';
import { AchievementTracker, validateAchievements, freshAchievements } from './achievements.js';

const INDEX_KEY = 'minecraftjs_worlds_v2';
const SLOT_PREFIX = 'minecraftjs_slot_';
const PREVIOUS_KEY = 'minecraftjs_save_v1';
const OLD_PARAMS_KEY = 'minecraft_params';
const OLD_DATA_KEY = 'minecraft_data';
const SAVE_FORMAT = 'minecraftjs-save';
const SAVE_VERSION = 19;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_EDITED_BLOCKS = 400000;
const BLOCK_KEY = /^(-?\d+),(-?\d+),(\d+),(\d+),(\d+)$/;
const INVENTORY_IDS = ITEM_CATALOG.map(item => item.id);
const SPAWN_GROUND_IDS = new Set([1,2,3,8,10,14,19]);
const SOIL_TYPES = new Set(['gravel','sand','dirt','clay','rock','impermeable']);
const WATER_TYPES = new Set(['river','lake','oasis']);

function validateHydrology(raw) {
  if (raw === undefined) return { version:2, cells:[] };
  if (!isObject(raw) || ![1,2].includes(raw.version) || !Array.isArray(raw.cells) || raw.cells.length > 8192) invalidFile();
  const seen = new Set();
  const cells=raw.cells.map(cell => {
    if (!Array.isArray(cell) || cell.length !== 6) invalidFile();
    const [x,z,water,ground,material,kind] = cell;
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(z) || Math.abs(x)>100000 || Math.abs(z)>100000 ||
        !validNumber(water,0,24) || !validNumber(ground,0,24) ||
        !SOIL_TYPES.has(material) || !WATER_TYPES.has(kind)) invalidFile();
    const key = `${x},${z}`;
    if (seen.has(key)) invalidFile();
    seen.add(key);
    return [x,z,water,ground,material,kind];
  });
  const flows = raw.flows === undefined ? [] : raw.flows;
  if (!Array.isArray(flows) || flows.length > 8192) invalidFile();
  const flowSeen = new Set();
  const checkedFlows = flows.map(flow => {
    if (!Array.isArray(flow) || flow.length !== 5) invalidFile();
    const [x,z,y,depth,kind] = flow;
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(z) || Math.abs(x)>100000 ||
        Math.abs(z)>100000 || !validNumber(y,-1,255) || !validNumber(depth,.125,1) ||
        !WATER_TYPES.has(kind)) invalidFile();
    const k = `${x},${z}`;
    if (flowSeen.has(k)) invalidFile();
    flowSeen.add(k);
    return [x,z,y,depth,kind];
  });
  const suppressed=raw.suppressed===undefined?[]:raw.suppressed;
  if(!Array.isArray(suppressed)||suppressed.length>8192)invalidFile();
  const checkedSuppressed=suppressed.map(cell=>{
    if(!Array.isArray(cell)||cell.length!==2||!cell.every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=100000))invalidFile();
    return cell;
  });
  if(new Set(checkedSuppressed.map(c=>c.join(','))).size!==checkedSuppressed.length)invalidFile();
  const pressure=raw.pressure===undefined?[]:raw.pressure;
  if(!Array.isArray(pressure)||pressure.length>4096)invalidFile();
  const checkedPressure=pressure.map(cell=>{
    if(!Array.isArray(cell)||cell.length!==3||
      !Number.isSafeInteger(cell[0])||!Number.isSafeInteger(cell[1])||
      Math.abs(cell[0])>100000||Math.abs(cell[1])>100000||
      !validNumber(cell[2],Number.MIN_VALUE,12))invalidFile();
    return cell;
  });
  if(new Set(checkedPressure.map(c=>`${c[0]},${c[1]}`)).size!==checkedPressure.length)invalidFile();
  const pressureInlets=raw.pressureInlets===undefined?[]:raw.pressureInlets;
  if(!Array.isArray(pressureInlets)||pressureInlets.length>512)invalidFile();
  const checkedInlets=pressureInlets.map(inlet=>{
    if(!Array.isArray(inlet)||inlet.length!==5||
      !Number.isSafeInteger(inlet[0])||!Number.isSafeInteger(inlet[1])||
      Math.abs(inlet[0])>100000||Math.abs(inlet[1])>100000||
      !validNumber(inlet[2],0,8)||!validNumber(inlet[3],0,255)||
      !Array.isArray(inlet[4])||inlet[4].length>4||
      inlet[4].some(p=>!Array.isArray(p)||p.length!==2||
        p.some(v=>!Number.isSafeInteger(v)||Math.abs(v)>100000)))invalidFile();
    return inlet;
  });
  if(new Set(checkedInlets.map(c=>`${c[0]},${c[1]}`)).size!==checkedInlets.length)invalidFile();
  const drains=raw.pressureDrains===undefined?[]:raw.pressureDrains;
  if(!Array.isArray(drains)||drains.length>512)invalidFile();
  const checkedDrains=drains.map(d=>{
    if(!Array.isArray(d)||d.length!==5||
      d.slice(0,4).some(v=>!Number.isSafeInteger(v)||Math.abs(v)>100000)||
      !validNumber(d[4],0,8))invalidFile();
    return d;
  });
  if(new Set(checkedDrains.map(c=>`${c[0]},${c[1]}`)).size!==checkedDrains.length)invalidFile();
  let environment;
  if(raw.environment!==undefined){
    const source=raw.environment;
    if(!isObject(source)||!Array.isArray(source.water)||!Array.isArray(source.snow)||
      source.water.length>16384||source.snow.length>16384)invalidFile();
    const validateRecords=(records,snow)=>{
      const seen=new Set();
      return records.map(c=>{
        if(!Array.isArray(c)||!(snow?[4,6].includes(c.length):c.length===4)||
          c.slice(0,2).some(n=>!Number.isSafeInteger(n)||Math.abs(n)>100000)||
          !validNumber(c[2],0,255)||
          (snow?!Number.isInteger(c[2]):!Number.isInteger(c[2]*2))||
          !validNumber(c[3],0,snow?.18:255))invalidFile();
        if(snow&&c.length===6&&(!validNumber(c[4],0,c[3])||!validNumber(c[5],0,120)))invalidFile();
        const k=c.slice(0,snow?2:3).join(',');
        if(seen.has(k))invalidFile();seen.add(k);return [...c];
      });
    };
    environment={water:validateRecords(source.water,false),snow:validateRecords(source.snow,true)};
    if(source.soil!==undefined){
      if(!Array.isArray(source.soil)||source.soil.length>16384)invalidFile();
      const seen=new Set();environment.soil=source.soil.map(c=>{
        if(!Array.isArray(c)||c.length!==6||c.slice(0,2).some(n=>!Number.isSafeInteger(n)||Math.abs(n)>100000)||!Number.isInteger(c[2])||!validNumber(c[2],0,255)||!validNumber(c[3],0,1)||!validNumber(c[4],0,1)||!validNumber(c[5],0,240))invalidFile();
        const k=c.slice(0,2).join(',');if(seen.has(k))invalidFile();seen.add(k);return [...c];
      });
    }
  }
  let basins;
  if(raw.basins!==undefined){
    const b=raw.basins;
    if(!isObject(b)||!Array.isArray(b.columns)||b.columns.length>BASIN_SAVED_COLUMNS||
      !Array.isArray(b.displaced)||b.displaced.length>BASIN_SAVED_COLUMNS)invalidFile();
    const seenColumns=new Set();let count=0;
    const columns=b.columns.map(c=>{
      if(!Array.isArray(c)||c.length!==3||
        c.slice(0,2).some(v=>!Number.isSafeInteger(v)||Math.abs(v)>100000)||!Array.isArray(c[2]))invalidFile();
      const id=c.slice(0,2).join(',');if(seenColumns.has(id))invalidFile();seenColumns.add(id);
      const floors=new Set();
      const spans=c[2].map(n=>{
        if(!Array.isArray(n)||n.length!==3||!validNumber(n[0],0,255)||
          !Number.isInteger(n[0]*2)||!validNumber(n[1],0,255)||!WATER_TYPES.has(n[2])||floors.has(n[0]))invalidFile();
        floors.add(n[0]);if(++count>BASIN_SAVED_NODES)invalidFile();return [...n];
      });
      return [c[0],c[1],spans];
    });
    const ids=new Set();
    const displaced=b.displaced.map(c=>{
      if(!Array.isArray(c)||c.length!==3||c.slice(0,2).some(v=>!Number.isSafeInteger(v)||Math.abs(v)>100000)||!validNumber(c[2],0,4194304))invalidFile();
      const id=c.slice(0,2).join(',');if(ids.has(id))invalidFile();ids.add(id);return [...c];
    });
    let focus;
    if(b.focus!==undefined){
      if(!Array.isArray(b.focus)||b.focus.length!==2||b.focus.some(v=>!Number.isSafeInteger(v)||Math.abs(v)>100000))invalidFile();
      focus=[...b.focus];
    }
    basins={columns,displaced,...(focus?{focus}:{})};
  }
  // Legacy v1 water volumes accumulated on camera approach and caused the
  // artificial flooding. Drop just those transient cells when opening an
  // older save; its player edits, terrain and exploration are preserved.
  return raw.version===1?{version:2,cells:[]}:
    {version:2,cells,...(basins?{basins}:{}),...(environment?{environment}:{}),...(raw.flows===undefined?{}:{flows:checkedFlows}),
      ...(raw.suppressed===undefined?{}:{suppressed:checkedSuppressed}),
      ...(raw.pressure===undefined?{}:{pressure:checkedPressure}),
      ...(raw.pressureInlets===undefined?{}:{pressureInlets:checkedInlets}),
      ...(raw.pressureDrains===undefined?{}:{pressureDrains:checkedDrains})};
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validNumber = (v,min,max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const clone = value => JSON.parse(JSON.stringify(value));
const worldName = (name, fallback = 'Mundo') => String(name || '').trim().replace(/[\x00-\x1f]/g,'').slice(0,40) || fallback;

class SaveFileError extends Error {
  constructor(messageKey) { super(messageKey); this.messageKey = messageKey; }
}
function invalidFile() { throw new SaveFileError('invalidFile'); }

function validateParamTree(defaultValue, incoming, key = '') {
  if (isObject(defaultValue)) {
    if (!isObject(incoming)) invalidFile();
    const result = {};
    for (const childKey of Object.keys(defaultValue)) {
      result[childKey] = validateParamTree(defaultValue[childKey],
        incoming[childKey] === undefined ? defaultValue[childKey] : incoming[childKey], `${key}.${childKey}`);
    }
    return result;
  }
  if (!validNumber(incoming, 0, 100000) || (key.endsWith('.scale') && incoming === 0)) invalidFile();
  return incoming;
}
function validateBlocks(blocks, terrainVersion = 1) {
  const maxY = [TERRAIN_V10,TERRAIN_HYBRID,TERRAIN_V11,TERRAIN_V112,TERRAIN_HYBRID_V112].includes(terrainVersion) ? V10_HEIGHT - 1 : LEGACY_HEIGHT - 1;
  if (!isObject(blocks)) invalidFile();
  const result = Object.create(null);
  const entries = Object.entries(blocks);
  if (entries.length > MAX_EDITED_BLOCKS) invalidFile();
  for (const [key, value] of entries) {
    const parts = BLOCK_KEY.exec(key);
    if (!parts || !Number.isInteger(value) || value < 0 || value > 53) invalidFile();
    const nums = parts.slice(1).map(Number);
    if (!nums.every(Number.isSafeInteger)) invalidFile();
    if (Math.abs(nums[0]) > 100000 || Math.abs(nums[1]) > 100000 ||
        nums[2] > 31 || nums[3] > maxY || nums[4] > 31) invalidFile();
    result[key] = value;
  }
  return result;
}
function validateVector(values, n, min, max) {
  if (!Array.isArray(values) || values.length !== n || !values.every(v => validNumber(v,min,max))) invalidFile();
  return [...values];
}
function validateSettings(value) {
  if (value === undefined) return {};
  if (!isObject(value)) invalidFile();
  const result = {};
  if (value.drawDistance !== undefined) {
    if (!Number.isInteger(value.drawDistance) || value.drawDistance < 0 || value.drawDistance > 5) invalidFile();
    result.drawDistance = value.drawDistance;
  }
  if (value.asyncLoading !== undefined) {
    if (typeof value.asyncLoading !== 'boolean') invalidFile();
    result.asyncLoading = value.asyncLoading;
  }
  if (value.weatherEnabled !== undefined) {
    if (typeof value.weatherEnabled !== 'boolean') invalidFile();
    result.weatherEnabled = value.weatherEnabled;
  }
  if (value.cloudStyle !== undefined) {
    if (!['fast','fancy','advanced'].includes(value.cloudStyle)) invalidFile();
    result.cloudStyle = value.cloudStyle;
  }
  for (const key of ['fogNear','fogFar','simulationRate']) {
    if (value[key] !== undefined) {
      if (!validNumber(value[key],.1,1000)) invalidFile();
      result[key] = value[key];
    }
  }
  if (value.resources !== undefined) {
    if (!Array.isArray(value.resources) || value.resources.length > resources.length) invalidFile();
    result.resources = value.resources.map(item => {
      if (!isObject(item) || !resources.some(r => r.id === item.id) ||
          !validNumber(item.scarcity,0,1) || !isObject(item.scale)) invalidFile();
      for (const dimension of ['x','y','z']) {
        if (!validNumber(item.scale[dimension],1,10000)) invalidFile();
      }
      return { id: item.id, scarcity: item.scarcity, scale: { ...item.scale } };
    });
  }
  return result;
}
function validateInventory(raw) {
  if (raw === undefined) return createStartingInventory('creative');
  if (!isObject(raw) || !['survival','creative'].includes(raw.mode)) invalidFile();
  const validateStack = stack => {
    if (stack === null) return null;
    if (!isObject(stack) || !INVENTORY_IDS.some(id => String(id) === String(stack.id)) ||
        !Number.isInteger(stack.count) || stack.count < 1 ||
        stack.count > (ITEM_CATALOG.find(item => String(item.id) === String(stack.id))?.maxStack || 64)) invalidFile();
    // Use the canonical type: string ids for objects and number ids for blocks.
    const item = ITEM_CATALOG.find(item => String(item.id) === String(stack.id));
    return { id: item.id, count: stack.count };
  };
  if (Array.isArray(raw.slots)) {
    if (raw.slots.length !== 36 || !Number.isInteger(raw.selectedSlot) || raw.selectedSlot < 0 || raw.selectedSlot > 8 ||
        ![2,3].includes(raw.craftSize) || !Array.isArray(raw.craftGrid) || raw.craftGrid.length !== 9) invalidFile();
    const slots = raw.slots.map(validateStack);
    const craftGrid = raw.craftGrid.map(validateStack);
    if(raw.craftSize === 2 && craftGrid.some((cell,i)=>cell && ![0,1,3,4].includes(i))) invalidFile();
    const reserve={};
    if(raw.reserve!==undefined){
      if(!isObject(raw.reserve)||Object.keys(raw.reserve).length>INVENTORY_IDS.length)invalidFile();
      for(const [id,n] of Object.entries(raw.reserve)){
        if(!INVENTORY_IDS.some(item=>String(item)===id)||!Number.isSafeInteger(n)||n<1||n>2000000)invalidFile();
        reserve[id]=n;
      }
    }
    return { mode: raw.mode, slots, selectedSlot: raw.selectedSlot, craftSize: raw.craftSize, craftGrid, reserve }; 
  }
  // Legacy v2 aggregate counts. Inventory.restore distributes them into stacks.
  if (!isObject(raw.items) || Object.keys(raw.items).length > INVENTORY_IDS.length) invalidFile();
  const items = {};
  for (const [id,amount] of Object.entries(raw.items)) {
    if (!/^\d+$/.test(id) || !INVENTORY_IDS.includes(Number(id)) || !Number.isInteger(amount) || amount < 1 || amount > 99999) invalidFile();
    items[id] = amount;
  }
  return { mode: raw.mode, items };
}
function validateRemovedAnimals(raw) {
  if(raw===undefined)return [];
  if(!Array.isArray(raw)||raw.length>30000)invalidFile();
  const seen=new Set();
  for(const id of raw){
    if(typeof id!=='string'||! /^-?\d+:-?\d+:[01]$/.test(id) || id.length>40)invalidFile();
    const [x,z]=id.split(':').map(Number);
    if(!Number.isSafeInteger(x)||!Number.isSafeInteger(z)||Math.abs(x)>100000||Math.abs(z)>100000||seen.has(id))invalidFile();
    seen.add(id);
  }
  return [...raw];
}
function assignNestedValues(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (isObject(value)) assignNestedValues(target[key], value);
    else target[key] = value;
  }
}
function newId() {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2,10)}`;
}

export class SaveManager {
  constructor(world, player, physics, scene, onRestored = () => {}) {
    this.world = world;
    this.player = player;
    this.physics = physics;
    this.scene = scene;
    this.onRestored = onRestored;
    this.defaultParams = clone(world.params);
    this.statusTimer = null;
    this.index = null;
    this.onWorldsChange = () => {};
    this.dirty = false;
    this.lastPose = null;
    this.playtime = new PlaytimeTracker();
    this.dayNight = new DayNightClock();
    this.exploration = new ExplorationTracker(() => {this.markDirty();this.checkAchievements();});
    this.achievements = new AchievementTracker(() => this.markDirty(), key => this.showStatus('achievementEarned'));
    this.progress = new ProgressTracker(() => {this.markDirty();this.checkAchievements();});
    this.lastSavedPlaytimeMs = 0;
    world.dataStore.onChange = () => this.markDirty();
    if(world.hydrology)world.hydrology.onChange = () => this.markDirty();
    if (player.inventory) {
      player.inventory.onChange = () => this.markDirty();
      player.inventory.onCraft = (recipe) => this.progress.increment('itemsCrafted', recipe.count);
    }
    player.progress = this.progress;
  }

  // New v10 worlds begin just above their actual surface instead of falling
  // from the world ceiling. Legacy worlds keep their saved spawn unchanged.
  positionFreshSpawn(snapshot = null) {
    const world = this.world;
    if(![TERRAIN_V10,TERRAIN_V11,TERRAIN_V112].includes(world.terrainVersion) || typeof world.getBlockId!=='function')return;
    let surface=-1;
    for(let y=world.chunkSize.height-2;y>=0;y--){
      if(SPAWN_GROUND_IDS.has(world.getBlockId(32,y,32))){surface=y;break;}
    }
    if(surface<0)return;
    const height=Math.min(V10_HEIGHT-2,surface+4);
    const spawn=[32,height,32];
    this.player.position.fromArray(spawn);
    this.player.respawnPoint=[...spawn];
    this.progress.resetMovement(this.player.position);
    if(snapshot){snapshot.player.position=[...spawn];snapshot.player.respawnPoint=[...spawn];}
  }

  markDirty() { this.dirty = true; }
  checkAchievements(announce=true) {
    this.achievements.update(this.progress.data,this.exploration.data,announce);
  }

  showStatus(key, error = false) {
    const node = document.getElementById('status');
    if (!node) return;
    node.textContent = t(key);
    node.classList.toggle('error', error);
    node.classList.add('visible');
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => node.classList.remove('visible'), 4500);
  }

  createSnapshot() {
    const { world, player, physics, scene } = this;
    return {
      format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: new Date().toISOString(),
      playtime: this.playtime.snapshot(),
      dayNight: this.dayNight.snapshot(), progress: this.progress.snapshot(),
      exploration: this.exploration.snapshot(), achievements: this.achievements.snapshot(),
      world: { type: normalizeWorldType(world.type), terrainVersion:world.terrainVersion, hybrid:world.hybrid?clone(world.hybrid):undefined, params: clone(world.params), blocks: { ...world.dataStore.data },
        legacyIceEdits:[...(world.dataStore.legacyIceEdits??[])],
        hydrology: world.hydrology?.snapshot?.() || {version:2,cells:[]},
        stations: clone(world.stations||{}), removedAnimals:[...(world.removedAnimals||[])], landmarksEnabled:!!world.landmarksEnabled },
      player: {
        position: player.position.toArray(), quaternion: player.camera.quaternion.toArray(),
        respawnPoint: player.respawnPoint || [32,32,32], mineMode: player.mineMode, 
        activeBlockId: player.activeBlockId, equippedToolId:player.equippedToolId || 'basic_pickaxe',
        rightObjectId:player.rightObjectId ?? 21, maxSpeed: player.maxSpeed, jumpSpeed: player.jumpSpeed,
        inventory: player.inventory?.snapshot() ?? { mode: 'creative', items: {} }
      },
      settings: {
        drawDistance: world.drawDistance, asyncLoading: world.asyncLoading, weatherEnabled:world.weatherEnabled, cloudStyle:world.cloudStyle,
        fogNear: scene.userData?.fogPreferences?.near ?? scene.fog.near, fogFar: scene.userData?.fogPreferences?.far ?? scene.fog.far, simulationRate: physics.simulationRate,
        resources: resources.map(r => ({ id: r.id, scarcity: r.scarcity, scale: { ...r.scale } }))
      }
    };
  }

  decode(raw) {
    if (!isObject(raw) || raw.format !== SAVE_FORMAT) invalidFile();
    if (![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,SAVE_VERSION].includes(raw.version)) throw new SaveFileError('unsupportedVersion');
    if (!isObject(raw.world)) invalidFile();
    if (raw.world.landmarksEnabled !== undefined && typeof raw.world.landmarksEnabled !== 'boolean')invalidFile();
    const terrainVersion = raw.world.terrainVersion === undefined ? 1 : raw.world.terrainVersion;
    if (![1,TERRAIN_V10,TERRAIN_HYBRID,TERRAIN_V11,TERRAIN_V112,TERRAIN_HYBRID_V112].includes(terrainVersion) ||
      (raw.version < 10 && terrainVersion !== 1) ||
      (raw.version < 11 && terrainVersion === TERRAIN_HYBRID) ||
      (raw.version < 12 && terrainVersion === TERRAIN_V11) ||
      (raw.version < 13 && terrainVersion === TERRAIN_V112) ||
      (raw.version < 14 && terrainVersion === TERRAIN_HYBRID_V112)) invalidFile();
    const hybrid=terrainVersion===TERRAIN_HYBRID_V112
      ? validateHydrologyHybrid(raw.world.hybrid,terrainVersion,invalidFile)
      : validateHybrid(raw.world.hybrid,terrainVersion,invalidFile);
    const validatedBlocks=validateBlocks(raw.world.blocks,terrainVersion);
    const oldIceKeys=raw.world.legacyIceEdits===undefined
      ? Object.keys(validatedBlocks).filter(k=>validatedBlocks[k]===0)
      : raw.world.legacyIceEdits;
    if(!Array.isArray(oldIceKeys)||oldIceKeys.length>MAX_EDITED_BLOCKS||
      oldIceKeys.some(k=>typeof k!=='string'||!BLOCK_KEY.test(k)||validatedBlocks[k]!==0)||
      new Set(oldIceKeys).size!==oldIceKeys.length)invalidFile();
    const normalized = {
      world: { terrainVersion, hybrid, type: raw.world.type === undefined ? 'classic' : (WORLD_TYPES.includes(raw.world.type) ? raw.world.type : invalidFile()), params: validateParamTree(this.defaultParams, raw.world.params), blocks: validatedBlocks,
        legacyIceEdits:oldIceKeys,
        hydrology:validateHydrology(raw.world.hydrology),
        stations: validateStations(raw.world.stations,invalidFile), removedAnimals:validateRemovedAnimals(raw.world.removedAnimals),
        landmarksEnabled:raw.world.landmarksEnabled===true },
      settings: validateSettings(raw.settings),
      playtime: validatePlaytime(raw.playtime,invalidFile),
      dayNight: validateDayNight(raw.dayNight,invalidFile), progress: validateProgress(raw.progress,invalidFile),
      exploration:validateExploration(raw.exploration,invalidFile), achievements:validateAchievements(raw.achievements,invalidFile)
    };
    if (raw.player !== undefined) {
      const player = raw.player;
      if (!isObject(player)) invalidFile();
      const position = validateVector(player.position,3,-1000000,1000000);
      const quaternion = validateVector(player.quaternion,4,-1,1);
      const respawnPoint = player.respawnPoint === undefined ? [32,32,32] : validateVector(player.respawnPoint,3,-1000000,1000000);
      if (quaternion.every(v => v === 0)) invalidFile();
      if (!Number.isInteger(player.activeBlockId) ||
          ![0,...ITEM_CATALOG.filter(item=>Number.isInteger(item.id)&&item.blockId).map(item=>item.id)].includes(player.activeBlockId) ||
          !validNumber(player.maxSpeed,1,20) || !validNumber(player.jumpSpeed,1,10)) invalidFile();
      if(player.mineMode!==undefined && typeof player.mineMode!=='boolean') invalidFile();
      const equippedToolId = player.equippedToolId === undefined ? 'basic_pickaxe' : player.equippedToolId;
      const rightObjectId = player.rightObjectId === undefined ? 21 : player.rightObjectId;
      if(!['basic_pickaxe','wood_pickaxe','stone_pickaxe','iron_pickaxe','saw','sword','broom','spear'].includes(equippedToolId) ||
         ![18,21,22,23,24,25,26,null].includes(rightObjectId))invalidFile();
      normalized.player = { position, quaternion, respawnPoint, mineMode: player.mineMode===undefined ? player.activeBlockId===0 : player.mineMode, activeBlockId: player.activeBlockId, equippedToolId, rightObjectId,
        maxSpeed: player.maxSpeed, jumpSpeed: player.jumpSpeed, inventory: validateInventory(player.inventory) };
    }
    return normalized;
  }

  decodeLegacy(paramsJson, blocksJson) {
    let params, blocks;
    try { params = JSON.parse(paramsJson); blocks = JSON.parse(blocksJson); }
    catch { invalidFile(); }
    return { world: { type:'classic', params: validateParamTree(this.defaultParams,params), blocks: validateBlocks(blocks),stations:{},removedAnimals:[] }, settings: {}, playtime:emptyPlaytime(), dayNight:freshDayNight(), progress:freshProgress(), exploration:freshExploration(), achievements:freshAchievements() };
  }

  /** Prepare a save once, on load, with no button or confirmation. Only the
   * never-explored footprint switches to the newest hydrology generator. */
  upgradeSnapshot(raw,normalized,visible=[]) {
    const terrainVersion=normalized.world.terrainVersion;
    const existingHybrid=terrainVersion===TERRAIN_HYBRID_V112;
    if(existingHybrid&&normalized.world.hybrid.hydrographyVersion===3)return null;
    if(!existingHybrid&&!HYBRID_V112_SOURCES.includes(terrainVersion))return null;
    const player=normalized.player;
    const oldHybrid=normalized.world.hybrid;
    const frozen=new Set(collectProtectedChunks({
      explored:normalized.exploration.explored,
      blocks:normalized.world.blocks,stations:normalized.world.stations,
      markers:normalized.exploration.markers,
      player:player?.position??[32,32,32],spawn:player?.respawnPoint??[32,32,32],visible
    }));
    if(existingHybrid){
      // v11.3.5 worlds already have a frozen footprint. The player may have
      // explored many more chunks since that first migration: include them
      // all BEFORE changing the unvisited terrain's hydrology algorithm.
      for(const k of oldHybrid.protectedChunks)frozen.add(k);
    }
    if(terrainVersion===TERRAIN_HYBRID){
      for(const k of oldHybrid.legacyChunks)frozen.add(k);
    }
    if(frozen.size>25000)throw new SaveFileError('invalidFile');
    const upgraded=clone(raw);
    upgraded.version=SAVE_VERSION;
    upgraded.world.terrainVersion=TERRAIN_HYBRID_V112;
    const formerProtected=new Set(existingHybrid?oldHybrid.protectedChunks:[]);
    const newlyProtected=existingHybrid&&[1,2].includes(oldHybrid.hydrographyVersion)
      ?[...frozen].filter(k=>!formerProtected.has(k)).sort():[];
    upgraded.world.hybrid={
      ...(existingHybrid?oldHybrid:{sourceVersion:terrainVersion}),
      protectedChunks:[...frozen].sort(),blendBlocks:HYBRID_BLEND_BLOCKS,
      hydrographyVersion:3,
      ...(existingHybrid&&oldHybrid.hydrographyVersion===1
        ?{hydrographyV1Chunks:newlyProtected,
          hydrographyV1BaseChunks:[...oldHybrid.protectedChunks]}:{}),
      ...(existingHybrid&&oldHybrid.hydrographyVersion===2
        ?{hydrographyV2Chunks:newlyProtected,
          hydrographyV2BaseChunks:[...oldHybrid.protectedChunks]}:{}),
      ...(!existingHybrid&&oldHybrid?.legacyChunks?{legacyChunks:[...oldHybrid.legacyChunks]}:{})};
    // The old automatic solver is meaningful only for original visited land.
    // Spurious old water in unvisited chunks must not leak into new channels.
    const cells=normalized.world.hydrology.cells.filter(([x,z])=>
      frozen.has(`${Math.floor(x/32)},${Math.floor(z/32)}`));
    upgraded.world.hydrology={version:2,cells};
    // Canonical validation also protects malicious or corrupted imported files.
    this.decode(upgraded);
    return upgraded;
  }

  /** Persist the frozen footprint before generating any terrain with it. If
   * quota/storage fails, fall back to the original unmodified world. */
  prepareStoredSlot(id,raw) {
    const original=this.decode(raw);
    try {
      const upgraded=this.upgradeSnapshot(raw,original);
      if(!upgraded)return original;
      localStorage.setItem(this.slotKey(id),JSON.stringify(upgraded));
      return this.decode(upgraded);
    }catch(error){
      console.warn('Automatic world migration unavailable; original world retained',error);
      return original;
    }
  }

  apply(normalized) {
    const { world, player, physics, scene } = this;
    this.playtime.restore(normalized.playtime || emptyPlaytime());
    this.dayNight.restore(normalized.dayNight || freshDayNight());
    this.progress.restore(normalized.progress || freshProgress());
    this.exploration.restore(normalized.exploration || freshExploration());
    this.achievements.restore(normalized.achievements || freshAchievements());
    this.checkAchievements(false);
    this.lastSavedPlaytimeMs = this.playtime.total();
    assignNestedValues(world.params, normalized.world.params);
    world.type = normalized.world.type;
    world.terrainVersion = normalized.world.terrainVersion || 1;
    world.hybrid = normalized.world.hybrid || null;
    world.hybridProtectedSet = new Set(world.hybrid?.protectedChunks || world.hybrid?.legacyChunks || []);
    world.hybridV1Set = new Set(world.hybrid?.hydrographyV1Chunks || []);
    world.hybridV2Set = new Set(world.hybrid?.hydrographyV2Chunks || []);
    world.hybridLegacySet = new Set(world.hybrid?.legacyChunks || []);
    world.chunkSize.height = [TERRAIN_V10,TERRAIN_HYBRID,TERRAIN_V11,TERRAIN_V112,TERRAIN_HYBRID_V112].includes(world.terrainVersion) ? V10_HEIGHT : LEGACY_HEIGHT;
    world.dataStore.data = normalized.world.blocks;
    world.dataStore.legacyIceEdits = new Set(normalized.world.legacyIceEdits || []);
    world.hydrology?.restore(normalized.world.hydrology);
    world.stations = normalized.world.stations || {};
    world.removedAnimals = normalized.world.removedAnimals || [];
    world.landmarksEnabled = normalized.world.landmarksEnabled===true;
    world.weatherEnabled=normalized.settings.weatherEnabled ?? true;
    world.cloudStyle=normalized.settings.cloudStyle ?? 'advanced';
    for (const key of ['drawDistance','asyncLoading']) {
      if (normalized.settings[key] !== undefined) world[key] = normalized.settings[key];
    }
    if (scene.userData?.fogPreferences) {
      // The v10.1 defaults were always saved as 50/75, even when unchanged.
      // Migrate only that pair; retain other user-adjusted fog preferences.
      const preference=migrateFogPreferences(normalized.settings.fogNear,normalized.settings.fogFar);
      Object.assign(scene.userData.fogPreferences,preference); // keep GUI bindings
    } else {
      if (normalized.settings.fogNear !== undefined) scene.fog.near = normalized.settings.fogNear;
      if (normalized.settings.fogFar !== undefined) scene.fog.far = normalized.settings.fogFar;
    }
    if (normalized.settings.simulationRate !== undefined) physics.simulationRate = normalized.settings.simulationRate;
    if (normalized.settings.resources) {
      for (const value of normalized.settings.resources) {
        const resource = resources.find(r => r.id === value.id);
        resource.scarcity = value.scarcity;
        Object.assign(resource.scale, value.scale);
      }
    }
    if (normalized.player) {
      player.position.fromArray(normalized.player.position);
      player.respawnPoint = normalized.player.respawnPoint || [32,32,32];
      player.camera.quaternion.fromArray(normalized.player.quaternion).normalize();
      player.maxSpeed = normalized.player.maxSpeed;
      player.jumpSpeed = normalized.player.jumpSpeed;
      if (player.inventory) player.inventory.restore(normalized.player.inventory);
      player.mineMode=normalized.player.mineMode;
      player.equippedToolId=normalized.player.equippedToolId || 'basic_pickaxe';
      player.rightObjectId=normalized.player.rightObjectId ?? 21;
      player.refreshToolModel?.();
      if (normalized.player.inventory?.items && player.setSelectedBlock && normalized.player.activeBlockId)
        player.setSelectedBlock(normalized.player.activeBlockId);
      else if (player.syncSelectedSlot) player.syncSelectedSlot();
      else if (player.setSelectedBlock) player.setSelectedBlock(normalized.player.activeBlockId);
      else {
        player.activeBlockId = normalized.player.activeBlockId;
        player.tool.container.visible = player.activeBlockId === 0;
        document.querySelectorAll('.toolbar-icon').forEach(icon => {
          icon.classList.toggle('selected', icon.id === `toolbar-${player.activeBlockId}`);
        });
      }
    } else if (player.inventory) { player.inventory.restore(); player.respawnPoint=[32,32,32]; player.mineMode=true;player.equippedToolId='basic_pickaxe';player.rightObjectId=21;player.refreshToolModel?.(); }
    player.velocity.set(0,0,0);
    player.input.set(0,0,0);
    player.sprinting = false;
    player.onGround = false;
    player.selectedCoords = null;
    player.selectionHelper.visible = false;
    this.progress.resetMovement(player.position);
    world.generate(false,player.position);
    this.onRestored();
    this.dirty = false;
    this.rememberPose();
  }

  rememberPose() {
    this.lastPose = [...this.player.position.toArray(), ...this.player.camera.quaternion.toArray()];
  }
  poseChanged() {
    if (!this.lastPose) return true;
    const now = [...this.player.position.toArray(), ...this.player.camera.quaternion.toArray()];
    return now.some((value,index) => Math.abs(value - this.lastPose[index]) > .025);
  }

  slotKey(id) { return SLOT_PREFIX + id; }
  currentWorld() { return this.index?.worlds.find(w => w.id === this.index.activeId) || null; }
  listWorlds() { return this.index ? this.index.worlds.map(w => ({ ...w, active: w.id === this.index.activeId })) : []; }
  notifyWorlds() { this.onWorldsChange(this.listWorlds()); }

  writeIndex(index) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    this.index = index;
    this.notifyWorlds();
  }

  addSlot(name, snapshot, makeActive = true) {
    const id = newId();
    const metadata = { id, name: worldName(name, t('worldDefault')), createdAt: new Date().toISOString(),
      savedAt: snapshot.savedAt || new Date().toISOString(), seed: snapshot.world.params.seed, type: normalizeWorldType(snapshot.world.type), terrainVersion: snapshot.world.terrainVersion || 1 };
    const next = { version: 2, activeId: makeActive ? id : this.index.activeId,
      worlds: [...this.index.worlds, metadata] };
    localStorage.setItem(this.slotKey(id), JSON.stringify(snapshot));
    try { this.writeIndex(next); }
    catch (error) { localStorage.removeItem(this.slotKey(id)); throw error; }
    return metadata;
  }

  initialize() {
    if (this.index) return true;
    try {
      const stored = localStorage.getItem(INDEX_KEY);
      if (stored !== null) {
        const index = JSON.parse(stored);
        if (!isObject(index) || index.version !== 2 || !Array.isArray(index.worlds) ||
            !index.worlds.length || index.worlds.length > 50 ||
            !index.worlds.some(w => w.id === index.activeId) ||
            index.worlds.some(w => !isObject(w) || !/^w[a-z\d]{5,40}$/.test(w.id) || typeof w.name !== 'string')) invalidFile();
        const saved = localStorage.getItem(this.slotKey(index.activeId));
        if (saved === null || saved.length > MAX_FILE_BYTES) invalidFile();
        const normalized = this.prepareStoredSlot(index.activeId,JSON.parse(saved));
        this.index = index;
        this.apply(normalized);
        if(normalized.world.terrainVersion===TERRAIN_HYBRID_V112)
          this.updateTerrainMetadata(index.activeId,TERRAIN_HYBRID_V112);
        this.notifyWorlds();
        return true;
      }
      this.index = { version: 2, activeId: null, worlds: [] };
      let restoredSnapshot = null;
      const old = localStorage.getItem(PREVIOUS_KEY);
      if (old !== null) {
        if (old.length > MAX_FILE_BYTES) throw new SaveFileError('fileTooLarge');
        const raw = JSON.parse(old);
        const normalized = this.decode(raw);
        restoredSnapshot = this.upgradeSnapshot(raw,normalized) || clone(raw);
        this.apply(this.decode(restoredSnapshot));
      } else {
        const params = localStorage.getItem(OLD_PARAMS_KEY);
        const blocks = localStorage.getItem(OLD_DATA_KEY);
        if (params !== null && blocks !== null) {
          this.apply(this.decodeLegacy(params,blocks));
          const legacySnapshot=this.createSnapshot();
          restoredSnapshot=this.upgradeSnapshot(legacySnapshot,this.decode(legacySnapshot)) || legacySnapshot;
          this.apply(this.decode(restoredSnapshot));
        }
      }
      if(!restoredSnapshot){
        this.world.terrainVersion=TERRAIN_HYBRID_V112;
        this.world.hybrid={sourceVersion:TERRAIN_V112,
          protectedChunks:['1,1'],blendBlocks:HYBRID_BLEND_BLOCKS,hydrographyVersion:3};
        this.world.hybridProtectedSet=new Set(['1,1']);
        this.world.hybridV1Set=new Set();
        this.world.hybridV2Set=new Set();
        this.world.hybridLegacySet=new Set();
        this.world.chunkSize.height=V10_HEIGHT;
        this.player.position.fromArray([32,72,32]);
        this.player.respawnPoint=[32,72,32];
      }
      const snapshot = restoredSnapshot || this.createSnapshot();
      if (!restoredSnapshot) {
        snapshot.player.inventory = createStartingInventory('creative');
        snapshot.world.landmarksEnabled = true;
        this.world.landmarksEnabled = true;
        this.world.generate(false,this.player.position);
        this.positionFreshSpawn(snapshot);
      }
      this.addSlot(t('worldDefault'),snapshot);
      this.rememberPose();
      return true;
    } catch (error) {
      console.error('Cannot initialize worlds:',error);
      this.index = null; // Never overwrite unreadable legacy/index data.
      this.showStatus(error.messageKey || 'saveError',true);
      return false;
    }
  }

  saveLocal(showMessage = true) {
    if (!this.index && !this.initialize()) return false;
    try {
      const snapshot = this.createSnapshot();
      const current = this.currentWorld();
      localStorage.setItem(this.slotKey(current.id),JSON.stringify(snapshot));
      // Slot is the authoritative save; a failed metadata update does not erase it.
      const updated = { ...this.index, worlds: this.index.worlds.map(w => w.id === current.id
        ? { ...w, savedAt: snapshot.savedAt, seed: snapshot.world.params.seed, type: normalizeWorldType(snapshot.world.type), terrainVersion: snapshot.world.terrainVersion || 1 } : w) };
      try { this.writeIndex(updated); } catch (err) { console.warn('Save metadata update failed',err); }
      this.dirty = false;
      this.lastSavedPlaytimeMs = snapshot.playtime.totalMs;
      this.rememberPose();
      if (showMessage) this.showStatus('saved');
      return true;
    } catch (error) {
      console.error('Cannot save locally:',error);
      if (showMessage) this.showStatus('saveError',true);
      return false;
    }
  }

  updateTerrainMetadata(id,version) {
    if(!this.index)return;
    const next={...this.index,worlds:this.index.worlds.map(w=>w.id===id?{...w,terrainVersion:version}:w)};
    try{this.writeIndex(next);}catch(error){console.warn('World listing update postponed',error);}
  }

  autosave() {
    if (!this.index) return;
    if (this.dirty || this.poseChanged() || this.playtime.total() - this.lastSavedPlaytimeMs >= 1000) {
      if (!this.saveLocal(false)) this.showStatus('autosaveError',true);
    }
  }

  loadLocal() {
    if (!this.index && !this.initialize()) return false;
    try {
      const json = localStorage.getItem(this.slotKey(this.index.activeId));
      if (json === null) throw new SaveFileError('noSave');
      if (json.length > MAX_FILE_BYTES) throw new SaveFileError('fileTooLarge');
      if (!window.confirm(t('confirmLoad'))) return false;
      const normalized = this.prepareStoredSlot(this.index.activeId,JSON.parse(json));
      this.apply(normalized);
      this.updateTerrainMetadata(this.index.activeId,normalized.world.terrainVersion);
      this.showStatus('loaded');
      return true;
    } catch (error) {
      console.error('Cannot load:',error);
      this.showStatus(error.messageKey || 'invalidFile',true);
      return false;
    }
  }

  switchWorld(id) {
    if (!this.index || id === this.index.activeId) return false;
    const target = this.index.worlds.find(w => w.id === id);
    if (!target) return false;
    try {
      const json = localStorage.getItem(this.slotKey(id));
      if (!json) invalidFile();
      if (!this.saveLocal(false)) { this.showStatus('saveError',true); return false; }
      const normalized = this.prepareStoredSlot(id,JSON.parse(json));
      this.writeIndex({ ...this.index, activeId: id });
      this.apply(normalized);
      this.updateTerrainMetadata(id,normalized.world.terrainVersion);
      this.notifyWorlds();
      this.showStatus('worldLoaded');
      return true;
    } catch (error) {
      console.error('Cannot switch world:',error);
      this.showStatus(error.messageKey || 'invalidFile',true);
      return false;
    }
  }

  createWorld(name, seed, type = 'classic', mode = 'creative', starterKit = true) {
    if (!this.index && !this.initialize()) return false;
    if (!['creative','survival'].includes(mode)) { this.showStatus('invalidFile',true); return false; }
    if (!WORLD_TYPES.includes(type)) { this.showStatus('invalidWorldType',true); return false; }
    if (!Number.isInteger(seed) || seed < 0 || seed > 10000) { this.showStatus('invalidSeed',true); return false; }
    if (!this.saveLocal(false)) { this.showStatus('saveError',true); return false; }
    try {
      const snapshot = this.createSnapshot();
      snapshot.world.params = clone(this.defaultParams);
      snapshot.world.params.seed = seed;
      snapshot.world.type = type;
      snapshot.world.terrainVersion = TERRAIN_HYBRID_V112;
      snapshot.world.hybrid={sourceVersion:TERRAIN_V112,
        protectedChunks:['1,1'],blendBlocks:HYBRID_BLEND_BLOCKS,hydrographyVersion:3};
      applyWorldPreset(snapshot.world.params,type);
      snapshot.settings.weatherEnabled = true;
      snapshot.world.blocks = {};
      snapshot.world.stations = {};
      snapshot.world.removedAnimals = [];
      snapshot.world.landmarksEnabled = true;
      snapshot.player.position = [32,72,32];
      snapshot.player.respawnPoint = [32,72,32];
      snapshot.player.quaternion = [0,0,0,1];
      snapshot.player.activeBlockId = 0;
      snapshot.player.mineMode = true;
      snapshot.player.equippedToolId=mode==='survival'&&starterKit?'wood_pickaxe':'basic_pickaxe';
      snapshot.player.rightObjectId=21;
      snapshot.player.inventory = createStartingInventory(mode,starterKit);
      snapshot.playtime = emptyPlaytime(); // Each newly created world starts at zero.
      snapshot.dayNight = freshDayNight();
      snapshot.progress = freshProgress();
      snapshot.exploration = freshExploration();
      snapshot.achievements = freshAchievements();
      snapshot.savedAt = new Date().toISOString();
      this.addSlot(name,snapshot);
      this.apply(this.decode(snapshot));
      this.positionFreshSpawn();
      this.saveLocal(false);
      this.showStatus('worldCreated');
      return true;
    } catch (error) {
      console.error('Cannot create world:',error);
      this.showStatus('saveError',true);
      return false;
    }
  }

  enableMixedGeneration() {
    if(!this.index || this.world.terrainVersion!==1)return false;
    if(!this.saveLocal(false)) {this.showStatus('saveError',true);return false;}
    const current=this.currentWorld();
    const savedBefore=localStorage.getItem(this.slotKey(current.id));
    try {
      const old=this.createSnapshot();
      const legacyChunks=collectProtectedChunks({
        explored:this.exploration.data.explored,
        blocks:old.world.blocks,stations:old.world.stations,
        markers:this.exploration.data.markers,
        player:old.player.position,spawn:old.player.respawnPoint,
        visible:[...this.world.chunkIndex.keys()]
      });
      old.version=SAVE_VERSION;
      old.world.terrainVersion=TERRAIN_HYBRID;
      old.world.hybrid={legacyChunks,blendBlocks:HYBRID_BLEND_BLOCKS};
      const valid=this.decode(old);
      // Persist the frozen protection list before exposing the new terrain.
      localStorage.setItem(this.slotKey(current.id),JSON.stringify(old));
      this.apply(valid);
      try {this.writeIndex({...this.index,worlds:this.index.worlds.map(w=>w.id===current.id?
        {...w,terrainVersion:TERRAIN_HYBRID,savedAt:old.savedAt}:w)});}catch(error){console.warn('Hybrid metadata update failed',error);}
      this.showStatus('hybridEnabled');
      return true;
    } catch(error) {
      // If the conversion was rejected, retain the original local save.
      if(this.world.terrainVersion===1 && savedBefore!==null){
        try{localStorage.setItem(this.slotKey(current.id),savedBefore);}catch{}
      }
      console.error('Cannot enable mixed terrain',error);
      this.showStatus('saveError',true);
      return false;
    }
  }

  enableLandmarks() {
    if(!this.index || this.world.landmarksEnabled)return false;
    // Explicit opt-in on legacy worlds: their original terrain stays unchanged
    // until the user elects to add deterministic structures.
    this.world.landmarksEnabled=true;
    this.world.generate(false,this.player.position);
    this.markDirty();
    this.showStatus('mapPlacesEnabled');
    return true;
  }

  renameWorld(id,name) {
    if (!this.index || !this.index.worlds.some(w => w.id === id)) return false;
    try {
      this.writeIndex({ ...this.index, worlds: this.index.worlds.map(w => w.id === id
        ? { ...w, name: worldName(name,w.name) } : w) });
      return true;
    } catch { this.showStatus('saveError',true); return false; }
  }

  duplicateWorld(id) {
    if (!this.index || !this.index.worlds.some(w => w.id === id)) return false;
    if (id === this.index.activeId && !this.saveLocal(false)) { this.showStatus('saveError',true); return false; }
    try {
      const source = this.index.worlds.find(w => w.id === id);
      const snapshot = JSON.parse(localStorage.getItem(this.slotKey(id)));
      this.decode(snapshot);
      const copy = clone(snapshot);
      copy.savedAt = new Date().toISOString();
      copy.playtime = emptyPlaytime(); // Duplicate the construction, not the other world's time log.
      copy.dayNight = freshDayNight();
      copy.progress = freshProgress();
      copy.exploration = freshExploration();
      copy.achievements = freshAchievements();
      this.addSlot(`${source.name} (${t('copy')})`,copy,false);
      this.showStatus('worldDuplicated');
      return true;
    } catch (error) { console.error(error); this.showStatus('saveError',true); return false; }
  }

  deleteWorld(id) {
    if (!this.index || this.index.worlds.length < 2 || !this.index.worlds.some(w => w.id === id)) return false;
    try {
      const nextActive = this.index.activeId === id
        ? this.index.worlds.find(w => w.id !== id).id : this.index.activeId;
      const normalized = nextActive !== this.index.activeId
        ? this.prepareStoredSlot(nextActive,JSON.parse(localStorage.getItem(this.slotKey(nextActive)))) : null;
      this.writeIndex({ ...this.index, activeId: nextActive,
        worlds: this.index.worlds.filter(w => w.id !== id) });
      localStorage.removeItem(this.slotKey(id));
      if (normalized) this.apply(normalized);
      this.notifyWorlds();
      this.showStatus('worldDeleted');
      return true;
    } catch (error) { console.error(error); this.showStatus('saveError',true); return false; }
  }

  exportFile() {
    try {
      const snapshot = this.createSnapshot();
      snapshot.name = this.currentWorld()?.name || t('worldDefault');
      const blob = new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = snapshot.name.replace(/[^a-z0-9-_áéíóúüñ ]/gi,'').trim().replace(/\s+/g,'-') || 'world';
      link.download = `${cleanName}-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url),1500);
      this.showStatus('exported');
    } catch (error) { console.error(error); this.showStatus('exportError',true); }
  }

  async importFile(file) {
    if (!file) return false;
    if (file.size > MAX_FILE_BYTES) { this.showStatus('fileTooLarge',true); return false; }
    try {
      const raw = JSON.parse(await file.text());
      const normalized = this.decode(raw);
      if (!this.index && !this.initialize()) return false;
      if (!this.saveLocal(false)) { this.showStatus('saveError',true); return false; }
      const name = worldName(raw.name, file.name?.replace(/\.json$/i,'') || t('worldDefault'));
      const snapshot = this.upgradeSnapshot(raw,normalized) || clone(raw);
      // Canonicalize old saves to the new schema (inventory + newly supported block types).
      snapshot.format = SAVE_FORMAT;
      snapshot.version = SAVE_VERSION;
      snapshot.world.type = normalized.world.type;
      const prepared=this.decode(snapshot);
      snapshot.world.terrainVersion = prepared.world.terrainVersion;
      if(prepared.world.hybrid)snapshot.world.hybrid=prepared.world.hybrid;
      else delete snapshot.world.hybrid;
      if (normalized.player) snapshot.player.inventory = normalized.player.inventory;
      snapshot.playtime = normalized.playtime;
      snapshot.dayNight = normalized.dayNight;
      snapshot.progress = normalized.progress;
      snapshot.exploration = normalized.exploration;
      snapshot.achievements = normalized.achievements;
      snapshot.world.landmarksEnabled = normalized.world.landmarksEnabled;
      this.addSlot(name,snapshot);
      this.apply(prepared);
      this.showStatus('imported');
      return true;
    } catch (error) {
      console.error('Cannot import:',error);
      this.showStatus(error.messageKey || 'importError',true);
      return false;
    }
  }
}
