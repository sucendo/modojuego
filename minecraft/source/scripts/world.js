import { WaterTransitions } from './continuousWater.js';
import * as THREE from 'three';
import { WorldChunk } from './worldChunk.js';
import { DataStore } from './dataStore.js';
import { normalizeWorldType } from './worldTypes.js';
import { LEGACY_HEIGHT, V10_HEIGHT, TERRAIN_V10 } from './terrainV10.js';
import { TERRAIN_HYBRID, generatorForChunk, protectionNearby } from './hybridTerrain.js';
import { TERRAIN_HYBRID_V112, sourceGenerator, makeHybridContext } from './hybridHydrology.js';
import { TERRAIN_V11 } from './hydrology.js';
import { ICE_THICKNESS } from './hydrologyV112.js';
import { HydrologyEngine } from './hydrologyEngine.js';
import { blocks } from './blocks.js';

export class World extends THREE.Group {

  /**
   * Whether or not we want to load the chunks asynchronously
   */
  asyncLoading = true;

  /**
  * The number of chunks to render around the player.
  * When this is set to 0, the chunk the player is on
  * is the only one that is rendered. If it is set to 1,
  * the adjacent chunks are rendered; if set to 2, the
  * chunks adjacent to those are rendered, and so on.
  */
  drawDistance = 3;
  // Runtime only: never written to the world save file.
  adaptiveDrawDistance = null;
  fadeSeconds = 0.75;
  // Rendering-only LOD horizon: does not generate voxel chunks or affect saves.
  horizonDistance = 12;
  horizonQualityCap = 18;
  adaptiveHorizonDistance = null;
  terrainEpoch = 0;
  waterTransitions = new WaterTransitions();


  chunkSize = {
    width: 32,
    height: LEGACY_HEIGHT
  };

  params = {
    seed: 0,
    terrain: {
      scale: 100,
      magnitude: 8,
      offset: 6,
      waterOffset: 4
    },
    biomes: {
      scale: 500,
      variation: {
        amplitude: 0.2,
        scale: 50
      },
      tundraToTemperate: 0.25,
      temperateToJungle: 0.5,
      jungleToDesert: 0.75
    },
    trees: {
      trunk: {
        minHeight: 4,
        maxHeight: 7
      },
      canopy: {
        minRadius: 3,
        maxRadius: 3,
        density: 0.7 // Vary between 0.0 and 1.0
      },
      frequency: 0.005
    },
    clouds: {
      scale: 30,
      density: 0.3
    }
  };

  dataStore = new DataStore();
  type = 'classic';
  terrainVersion = 1; // Updated on loading: protected old chunks plus v11.2 in unexplored terrain.
  hybrid = null;
  hybridProtectedSet = new Set();
  hybridV1Set = new Set();
  hybridV2Set = new Set();
  hybridLegacySet = new Set();
  weatherEnabled = true;
  cloudStyle = 'advanced'; // fast | fancy | advanced
  landmarksEnabled = false;
  stations = {};
  removedAnimals = [];
  chunkIndex = new Map();
  lastVisibleKey = null;
  pendingChunks = [];
  pendingIdleId = null;
  // null keeps the same full-distance shadows as v9.3 (high quality).
  shadowRadius = null;
  activeChunkX = 0;
  activeChunkZ = 0;
  generationMsLast = 0;
  generationCount = 0;
  generationMsTotal = 0;

  constructor(seed = 0) {
    super();
    this.seed = seed;
    this.hydrology = typeof HydrologyEngine === 'function' ? new HydrologyEngine(this) : null;
  }

  getRenderDistance(){
    const requested=Math.max(0,Math.min(5,Math.floor(this.drawDistance)));
    return this.adaptiveDrawDistance===null?requested:
      Math.max(0,Math.min(requested,Math.floor(this.adaptiveDrawDistance)));
  }

  getHorizonDistance(){
    const near=this.getRenderDistance();
    // A tiny manually configured full radius should not imply an enormous
    // visual-only ground surface without collisions.
    if(near<2)return near;
    const cap=Math.max(near,Math.min(18,Math.floor(this.horizonQualityCap)));
    const requested=Math.max(near,Math.min(cap,Math.floor(this.horizonDistance)));
    return this.adaptiveHorizonDistance===null?requested:
      Math.max(near,Math.min(requested,Math.floor(this.adaptiveHorizonDistance)));
  }

  setAdaptiveHorizonDistance(radius){
    this.adaptiveHorizonDistance=radius===null?null:Math.max(6,Math.min(18,Math.floor(radius)));
  }

  setAdaptiveDrawDistance(radius){
    const next=radius===null?null:Math.max(0,Math.min(5,Math.floor(radius)));
    if(this.adaptiveDrawDistance===next)return;
    this.adaptiveDrawDistance=next;
    this.lastVisibleKey=null;
  }

  /** Update the screen-door fade outside of the expensive terrain generation path. */
  updateTransitions(dt){
    const delta=Math.min(Math.max(0,Number(dt)||0),.1);
    for(const chunk of [...this.children]){
      const target=chunk.fadeTarget??1;
      if(chunk.fade!==target){
        const step=delta/this.fadeSeconds;
        const next=Math.abs(target-chunk.fade)<=step?target:chunk.fade+Math.sign(target-chunk.fade)*step;
        chunk.setFade(next);
      }
      // Retired terrain can remain visible briefly, then releases all GPU resources.
      if(target===0&&chunk.fade<=.001){
        this.cancelPendingGeneration(chunk);
        chunk.disposeInstances();this.remove(chunk);
        this.chunkIndex.delete(`${chunk.userData.x},${chunk.userData.z}`);
      }
    }
  }

  /**
   * Regenerate the world data model and the meshes
   */
  generate(clearCache = false, center = null) {
    this.terrainEpoch++;
    if (clearCache) {
      this.dataStore.clear();
      this.hydrology?.clear();
    }

    this.disposeChunks();

    // Rebuild around the restored player's position, not always world origin.
    const originX = center ? Math.floor(center.x / this.chunkSize.width) : 0;
    const originZ = center ? Math.floor(center.z / this.chunkSize.width) : 0;
    this.activeChunkX=originX;this.activeChunkZ=originZ;
    const radius=this.getRenderDistance();
    // Keep the spawning chunk ready before loading the remaining ring.
    this.generateChunk(originX,originZ,true);
    const neighbors=[];
    for (let x = originX - radius; x <= originX + radius; x++) {
      for (let z = originZ - radius; z <= originZ + radius; z++) {
        if(x!==originX || z!==originZ)neighbors.push({x,z});
      }
    }
    // Nearby chunks load first: no faraway terrain while the surroundings are empty.
    neighbors.sort((a,b)=>(a.x-originX)**2+(a.z-originZ)**2-((b.x-originX)**2+(b.z-originZ)**2));
    for(const {x,z} of neighbors)this.generateChunk(x,z);
    this.lastVisibleKey=`${originX},${originZ},${radius}`;
  }

  /**
   * Updates the visible portions of the world based on the
   * current player position
   * @param {Player} player 
   */
  update(player) {
    const cx=Math.floor(player.position.x/this.chunkSize.width);
    const cz=Math.floor(player.position.z/this.chunkSize.width);
    const key=`${cx},${cz},${this.getRenderDistance()}`;
    // Prioritize the chunk the player is actually standing in. An unloaded
    // asynchronous chunk must never be interpreted as an empty floor.
    const center=this.getChunk(cx,cz);
    if(center && !center.loaded){
      this.cancelPendingGeneration(center);
      this.buildChunk(center);
    }
    if(this.lastVisibleKey===key)return;
    this.lastVisibleKey=key;
    this.activeChunkX=cx;this.activeChunkZ=cz;
    this.refreshChunkShadows();
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);
    // A chunk that is fading out may become visible again when the player turns.
    for(const {x,z} of visibleChunks){
      const chunk=this.chunkIndex.get(`${x},${z}`);
      if(chunk)chunk.fadeTarget=1;
    }

    chunksToAdd.sort((a,b)=>(a.x-cx)**2+(a.z-cz)**2-((b.x-cx)**2+(b.z-cz)**2));
    for (const chunk of chunksToAdd) {
      // The current player's floor takes precedence over the idle queue.
      this.generateChunk(chunk.x, chunk.z, chunk.x===cx && chunk.z===cz);
    }
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are currently visible to the player
   * @param {Player} player 
   * @returns {{ x: number, z: number}[]}
   */
  getVisibleChunks(player) {
    const visibleChunks = [];

    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (let x = chunkX - this.getRenderDistance(); x <= chunkX + this.getRenderDistance(); x++) {
      for (let z = chunkZ - this.getRenderDistance(); z <= chunkZ + this.getRenderDistance(); z++) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are not yet loaded and need to be added to the scene
   * @param {{ x: number, z: number}[]} visibleChunks 
   * @returns {{ x: number, z: number}[]}
   */
  getChunksToAdd(visibleChunks) {
    // Set lookups avoid a quadratic scan of loaded chunks on every frame.
    return visibleChunks.filter(chunk => !this.chunkIndex.has(`${chunk.x},${chunk.z}`));
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   * @param {{ x: number, z: number}[]} visibleChunks 
   */
  removeUnusedChunks(visibleChunks) {
    const visible = new Set(visibleChunks.map(chunk => `${chunk.x},${chunk.z}`));
    const chunksToRemove = this.children.filter(chunk => !visible.has(`${chunk.userData.x},${chunk.userData.z}`));

    for (const chunk of chunksToRemove) {
      if(!chunk.loaded){
        this.cancelPendingGeneration(chunk);
        chunk.disposeInstances();this.remove(chunk);
        this.chunkIndex.delete(`${chunk.userData.x},${chunk.userData.z}`);
      }else chunk.fadeTarget=0;
    }
  }

  /**
   * Generates the chunk at the (x, z) coordinates
   * @param {number} x 
   * @param {number} z
   */
  generateChunk(x, z, immediate=false) {
    if(this.chunkIndex.has(`${x},${z}`))return;
    const upgraded=this.terrainVersion===TERRAIN_HYBRID_V112;
    const generator = upgraded
      ? (this.hybridProtectedSet.has(`${x},${z}`)
        ? sourceGenerator(this.hybrid,x,z,this.hybridLegacySet,this.hybridV1Set,this.hybridV2Set):TERRAIN_HYBRID_V112)
      : generatorForChunk(this.terrainVersion,this.hybridProtectedSet,x,z);
    const nearby = generator===TERRAIN_HYBRID_V112
      ? makeHybridContext(this.hybridProtectedSet,this.hybridLegacySet,this.hybrid,x,z)
      : generator === TERRAIN_HYBRID
        ? protectionNearby(upgraded?this.hybridLegacySet:this.hybridProtectedSet,x,z):null;
    const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore, this.type, this.landmarksEnabled, generator, nearby);
    chunk.waterTransitions=this.waterTransitions;
    chunk.liquidBlockLookup=(wx,y,wz)=>this.getBlockId(wx,y,wz);
    chunk.cavityLiquidLookup=(wx,wz)=>{
      const model=this.hydrology?.environment;
      return (model?.columns.get(`${wx},${wz}`)?.cavities??[]).map(c=>({
        bottom:c.bottom,roof:c.roof,
        top:Math.min(c.roof,c.bottom+(model.water.get(`${wx},${wz},${c.bottom}`)||0))
      }));
    };
    chunk.hydrologyLookup = (wx,wz) => {
      if (this.hybrid?.hydrographyVersion >= 1) {
        const other = this.getChunk(Math.floor(wx / 32), Math.floor(wz / 32));
        if (other?.loaded && other.waterColumns) {
          const ix = ((wx % 32) + 32) % 32, iz = ((wz % 32) + 32) % 32;
          return other.waterColumns[iz * 32 + ix] ?? null;
        }
        return this.hydrology?.flowCells.get(`${wx},${wz}`) ?? undefined;
      }
      const cell=this.hydrology?.cells.get(`${wx},${wz}`);
      return cell===undefined?undefined:cell.water>.025
        ?{y:cell.bed+cell.water-.25,kind:cell.kind,
          depth:cell.water,bed:cell.bed,dynamic:true}:null;
    };
    chunk.hydrologyGroundLookup = (wx,wz) => {
      const other=this.getChunk(Math.floor(wx/this.chunkSize.width),Math.floor(wz/this.chunkSize.width));
      if(!other?.loaded || !other.hydrologyGround)return null;
      const lx=((wx%this.chunkSize.width)+this.chunkSize.width)%this.chunkSize.width;
      const lz=((wz%this.chunkSize.width)+this.chunkSize.width)%this.chunkSize.width;
      return other.hydrologyGround[lz*this.chunkSize.width+lx];
    };
    chunk.position.set(
      x * this.chunkSize.width,
      0,
      z * this.chunkSize.width);
    chunk.userData = { x, z };
    const distance=Math.max(Math.abs(x-this.activeChunkX),Math.abs(z-this.activeChunkZ));
    // Always render the inner ring immediately to avoid fading the floor underfoot.
    chunk.fade=(immediate||distance<=1)?1:0;
    chunk.fadeUniform.value=chunk.fade;
    chunk.fadeTarget=1;
    const limit=this.shadowRadius ?? this.getRenderDistance();
    chunk.setNearShadows(Math.max(Math.abs(x-this.activeChunkX),Math.abs(z-this.activeChunkZ))<=limit);

    this.add(chunk);
    this.chunkIndex.set(`${x},${z}`,chunk);
    if (!immediate && this.asyncLoading) {
      this.pendingChunks.push(chunk);
      this.scheduleChunkGeneration();
    } else this.buildChunk(chunk);

  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{id: number, instanceId: number} | null}
   */
  getBlockId(x,y,z) {
    if(y<0 || y>=this.chunkSize.height) return 0;
    const width=this.chunkSize.width;
    const cx=Math.floor(x/width),cz=Math.floor(z/width);
    const chunk=this.chunkIndex.get(`${cx},${cz}`);
    return chunk?.loaded ? chunk.getBlockId(x-cx*width,y,z-cz*width) : 0;
  }

  /** A natural ice cap now occupies its visible voxel (including picking). */
  getBlockHitbox(x,y,z,id){
    if(id!==blocks.ice.id)return null;
    const width=this.chunkSize.width;
    const cx=Math.floor(x/width),cz=Math.floor(z/width);
    const chunk=this.chunkIndex.get(`${cx},${cz}`);
    if(!chunk?.loaded)return null;
    const top=chunk.iceSurfaceAt(x-cx*width,y,z-cz*width);
    if(top===null)return null;
    return {halfX:.5,halfZ:.5,halfY:ICE_THICKNESS/2,
      offsetY:top-ICE_THICKNESS/2-y};
  }

  getBlock(x, y, z) {
    // Hot path: the DDA selector and player physics query this thousands of
    // times per second. Avoid allocating chunk/block coordinate objects.
    if(y<0 || y>=this.chunkSize.height) return null;
    const width=this.chunkSize.width;
    const cx=Math.floor(x/width),cz=Math.floor(z/width);
    const chunk=this.chunkIndex.get(`${cx},${cz}`);
    return chunk?.loaded ? chunk.getBlock(x-cx*width,y,z-cz*width) : null;
  }

  /**
   * Returns the coordinates of the block at world (x,y,z)
   *  - `chunk` is the coordinates of the chunk containing the block
   *  - `block` is the coordinates of the block relative to the chunk
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{
   *  chunk: { x: number, z: number},
   *  block: { x: number, y: number, z: number}
   * }}
   */
  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width)
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z
    };

    return {
      chunk: chunkCoords,
      block: blockCoords
    }
  }

  /**
   * Returns the WorldChunk object at the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk(chunkX, chunkZ) {
    return this.chunkIndex.get(`${chunkX},${chunkZ}`) || null;
  }

  refreshChunkShadows(){
    const limit=this.shadowRadius ?? this.getRenderDistance();
    for(const chunk of this.children){
      const dx=Math.abs(chunk.userData.x-this.activeChunkX);
      const dz=Math.abs(chunk.userData.z-this.activeChunkZ);
      chunk.setNearShadows(Math.max(dx,dz)<=limit);
    }
  }

  buildChunk(chunk) {
    if(chunk.parent!==this || chunk.loaded)return;
    const start=performance.now();
    chunk.generate();
    this.hydrology?.reconcileChunk(chunk);
    chunk.setFade(chunk.fade);
    this.generationMsLast=performance.now()-start;
    this.generationMsTotal+=this.generationMsLast;
    this.generationCount++;
  }

  scheduleChunkGeneration() {
    if(this.pendingIdleId!==null || !this.pendingChunks.length)return;
    // One chunk per idle window, with setTimeout fallback for Safari.
    const generate=()=>{
      this.pendingIdleId=null;
      while(this.pendingChunks.length){
        const chunk=this.pendingChunks.shift();
        if(chunk.parent===this&&!chunk.loaded){this.buildChunk(chunk);break;}
      }
      this.scheduleChunkGeneration();
    };
    if(typeof requestIdleCallback==='function')
      this.pendingIdleId=requestIdleCallback(generate,{timeout:300});
    else this.pendingIdleId=setTimeout(generate,0);
  }

  cancelPendingGeneration(chunk) {
    if(this.pendingChunks.length)this.pendingChunks=this.pendingChunks.filter(item=>item!==chunk);

  }

  disposeChunks() {
    if(this.pendingIdleId!==null){
      if(typeof cancelIdleCallback==='function')cancelIdleCallback(this.pendingIdleId);
      else clearTimeout(this.pendingIdleId);
    }
    this.pendingIdleId=null;this.pendingChunks=[];
    this.children.forEach((chunk) => {
      this.cancelPendingGeneration(chunk);
      chunk.disposeInstances();
    });
    this.clear();
    this.chunkIndex.clear();
    this.waterTransitions.clear();
    this.lastVisibleKey=null;
  }

  /**
   * Adds a new block at (x,y,z) of type `blockId`
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} blockId 
   */
  // Snow-covered soil and normal grass have identical shape and sealing.
  // Replace the material and persist it without waking the river routing.
  washSnowBlock(x,y,z){
    const coords=this.worldToChunkCoords(x,y,z);
    const chunk=this.getChunk(coords.chunk.x,coords.chunk.z);
    if(!chunk?.loaded||chunk.getBlockId(coords.block.x,y,coords.block.z)!==10)return false;
    chunk.deleteBlockInstance(coords.block.x,y,coords.block.z);
    chunk.setBlockId(coords.block.x,y,coords.block.z,1);
    chunk.addBlockInstance(coords.block.x,y,coords.block.z);
    this.dataStore.set(chunk.position.x,chunk.position.z,coords.block.x,y,coords.block.z,1);
    return true;
  }

  replaceBlock(x,y,z,id,physical=true){
    const {chunk,block}=this.worldToChunkCoords(x,y,z),c=this.getChunk(chunk.x,chunk.z);
    if(!c?.loaded||!c.getBlockId(block.x,y,block.z)||c.getBlockId(block.x,y,block.z)===id)return false;
    c.deleteBlockInstance(block.x,y,block.z);c.setBlockId(block.x,y,block.z,id);c.addBlockInstance(block.x,y,block.z);
    this.dataStore.set(c.position.x,c.position.z,block.x,y,block.z,id);
    if(physical)this.hydrology?.onBlockEdit(x,y,z);
    return true;
  }

  addBlock(x, y, z, blockId) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.loaded) {
      const added = chunk.addBlock(
        coords.block.x,
        coords.block.y,
        coords.block.z,
        blockId
      );
      if (!added) return false;
      this.hydrology?.onBlockEdit(x,y,z);

      // Hide neighboring blocks if they are completely obscured
      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
      return true;
    }
    return false;
  }

  /**
   * Removes the block at (x, y, z) and sets it to empty
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  removeBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    // Don't allow removing the first layer of blocks
    if (coords.block.y === 0) return false;

    if (chunk && chunk.loaded) {
      const removed = chunk.removeBlock(
        coords.block.x,
        coords.block.y,
        coords.block.z
      );
      if (!removed) return false;
      this.hydrology?.onBlockEdit(x,y,z);

      // Reveal adjacent neighbors if they are hidden
      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);
      return true;
    }
    return false;
  }

  /**
   * Reveals the block at (x,y,z) by adding a new mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  revealBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlockInstance(
        coords.block.x,
        coords.block.y,
        coords.block.z
      )
    }
  }

  /**
   * Hides the block at (x,y,z) by removing the mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  hideBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)) {
      chunk.deleteBlockInstance(
        coords.block.x,
        coords.block.y,
        coords.block.z
      )
    }
  }
}
