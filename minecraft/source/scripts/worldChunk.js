import { waterFlowVector, bindWaterFlow, refreshWaterFlowAttribute } from './waterFlow.js';
import { continuousCorner, connectedWater, WaterTransitions, WATER_TRANSITION_SECONDS, waterTime } from './continuousWater.js';
import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { RNG } from './rng.js';
import { VoxelData } from './voxelData.js';
import { blocks, resources } from './blocks.js';
import { makeFadeMaterial, disposeFadeMaterial, clampFade } from './chunkFade.js';
import { biomeForType, terrainHeight } from './worldTypes.js';
import { advancedSurfaceHeight, isCave, geologyColumn, advancedUndergroundBlock, TERRAIN_V10, LEGACY_HEIGHT } from './terrainV10.js';
import { TERRAIN_HYBRID, hybridSurfaceHeight, transitionWeight } from './hybridTerrain.js';
import { landmarkForChunk, paintLandmark } from './landmarks.js';
import { TERRAIN_V11, hydrologyColumn } from './hydrology.js';
import { TERRAIN_V112, hydrologyColumnV112, freezeColumn, ICE_THICKNESS } from './hydrologyV112.js';
import { TERRAIN_HYBRID_V112, hybridHydrologyColumn, makeHybridContext } from './hybridHydrology.js';
import { waterDepthColor, waterOpacity, applyWaterMotion } from './waterVisuals.js';
import { voxelWaterColumn, exposedVoxelSide, sourceWaterBlocked, isDownstreamWaterfallEdge, mergeCoplanarWaterSurfaces } from './waterVoxelsV1134.js';
import { hydraulicBedAfterEdit } from './hydraulicColumnV1147.js';
import { exposedLiquidIntervals, exposedLiquidTop } from './liquidShell.js';

const geometry = new THREE.BoxGeometry();
const BLOCK_TYPES = [...new Map(Object.values(blocks).map(b => [b.id, b])).values()];
const BLOCK_BY_ID = new Map(BLOCK_TYPES.map(b => [b.id,b]));
// Los bloques semitransparentes no ocultan por completo a sus vecinos.
const NON_OCCLUDING = new Set([blocks.empty.id, blocks.leaves.id, blocks.jungleLeaves.id, blocks.glass.id, blocks.snowLeaves.id, blocks.torch.id, blocks.bookshelf.id, blocks.bed.id, blocks.table.id, blocks.chest.id,...Object.values(blocks).filter(b=>b.partial).map(b=>b.id)]);
const WATER_SOLID = new Set([1,2,3,4,5,8,10,14,15,16,17,18,19,26,27]);

export class WorldChunk extends THREE.Group {
  /**
    * @type {{
    *  id: number,
    *  instanceId: number
    * }[][][]}
  */
  voxels = null;

  constructor(size, params, dataStore, type = 'classic', landmarksEnabled = false, terrainVersion = 1, hybridNearby = null) {
    super();
    this.loaded = false;
    this.fade=1;
    this.fadeTarget=1;
    this.fadeUniform={value:1};
    this.fadeMaterials=new Map();
    this.nearShadows = true;
    this.type = type;
    this.landmarksEnabled = landmarksEnabled;
    this.terrainVersion = terrainVersion;
    this.hybridNearby = hybridNearby;
    this.maxFilledY = 0;
    this.waterColumns = null;
    this.naturalWaterColumns = null;
    this.naturalWaterGround = null;
    this.hydrologyGround = null;
    this.size = size;
    this.params = params;
    this.dataStore = dataStore;
  }

  /**
    * Generates the world data and meshes
    */
  generate() {
    const start = performance.now();

    const rng = new RNG(this.params.seed);
    this.initializeTerrain();
    this._generatingTerrain = true;
    this.generateTerrain(rng);
    this._generatingTerrain = false;
    // The procedural river/lake is an immutable source map. Retain its
    // original bed before applying player blocks so rebuilding fluid cannot
    // move a source uphill or exhaust it.
    if (this.waterColumns) {
      this.naturalWaterColumns = this.waterColumns.map(c => c ? { ...c } : null);
      this.naturalWaterGround = this.hydrologyGround?.slice() ?? null;
    }
    if (this.landmarksEnabled) this.generateLandmark();
    // v9.2: clouds are atmospheric decoration, not solid voxel blocks.
    // Existing player edits remain authoritative through loadPlayerChanges().
    this.loadPlayerChanges();
    if (this.naturalWaterColumns && this.naturalWaterGround) {
      for (let i = 0; i < this.waterColumns.length; i++) {
        const original = this.naturalWaterColumns[i];
        if (!original) continue;
        const lx = i % this.size.width, lz = Math.floor(i / this.size.width);
        if (sourceWaterBlocked(original,this.naturalWaterGround[i],this.hydrologyGround[i],
          y => this.getBlockId(lx,y,lz)))
          this.waterColumns[i] = null;
      }
    }
    this.generateMeshes();

    this.loaded = true;

    //console.log(`Loaded chunk in ${performance.now() - start}ms`);
  }

  generateLandmark() {
    const p=landmarkForChunk(this.params.seed,this.userData.x,this.userData.z);
    if(!p)return;
    const x=16,z=16;
    // Avoid placing ruins in the middle of newly generated lakes or rivers.
    if(this.waterColumns?.[z*this.size.width+x])return;
    const ground=new Set([blocks.grass.id,blocks.sand.id,blocks.snow.id,blocks.jungleGrass.id,blocks.basalt.id,blocks.stone.id,blocks.dirt.id]);
    let y=-1;
    for (let iy=(this.terrainVersion===1?Math.min(LEGACY_HEIGHT,this.size.height):this.size.height)-2;iy>=0;iy--){
      if(ground.has(this.getBlockId(x,iy,z))){y=iy;break;}
    }
    // No structures underwater or at the world ceiling.
    if(y<=this.params.terrain.waterOffset+1 || y>=(this.terrainVersion===1?Math.min(LEGACY_HEIGHT,this.size.height):this.size.height)-9)return;
    paintLandmark((bx,by,bz,id)=>{
      if(this.inBounds(bx,by,bz))this.setBlockId(bx,by,bz,id);
    },x,y+1,z,p.type,blocks.stoneBricks.id,blocks.planks.id,blocks.torch.id);
  }

  /**
   * Initializes an empty world
    */
  initializeTerrain() {
    this.voxels = new VoxelData(this.size.width, this.size.height);
    this.maxFilledY = 0;
    this.waterColumns = null;
    this.naturalWaterColumns = null;
    this.naturalWaterGround = null;
    this.hydrologyGround = null;
    this.hydraulicCeilings = null;
  }

  /**
   * Get the biome at the local chunk coordinates (x,z)
   * @param {SimplexNoise} simplex 
   * @param {number} x 
   * @param {number} z 
   */
  getBiome(simplex, x, z) {
    let noise = 0.5 * simplex.noise(
      (this.position.x + x) / this.params.biomes.scale,
      (this.position.z + z) / this.params.biomes.scale
    ) + 0.5;

    noise += this.params.biomes.variation.amplitude * (simplex.noise(
      (this.position.x + x) / this.params.biomes.variation.scale,
      (this.position.z + z) / this.params.biomes.variation.scale
    ));

    const classicBiome = noise < this.params.biomes.tundraToTemperate ? 'Tundra'
      : noise < this.params.biomes.temperateToJungle ? 'Temperate'
      : noise < this.params.biomes.jungleToDesert ? 'Jungle' : 'Desert';
    if (this.type !== 'classic') return biomeForType(this.type, classicBiome, noise);
    if (noise < this.params.biomes.tundraToTemperate) {
      return 'Tundra';
    } else if (noise < this.params.biomes.temperateToJungle) {
      return 'Temperate';
    } else if (noise < this.params.biomes.jungleToDesert) {
      return 'Jungle';
    } else {
      return 'Desert';
    }
  }

  /**
   * Generates the terrain data for the world
   */
  generateTerrain(rng) {
    if ([TERRAIN_V10,TERRAIN_HYBRID,TERRAIN_V11,TERRAIN_V112,TERRAIN_HYBRID_V112].includes(this.terrainVersion)) return this.generateAdvancedTerrain(rng);
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const biome = this.getBiome(simplex, x, z);

        // Compute the noise value at this x-z location
        const value = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
        );

        // Scale the noise based on the magnitude/offset
        const scaledNoise = this.params.terrain.offset +
          this.params.terrain.magnitude * value;

        // Computing the height of the terrain at this x-z location
        let height = Math.floor(scaledNoise);

        // Clamping height between 0 and max height
        height = Math.max(0, Math.min(terrainHeight(this.type,height,this.position.x+x,this.position.z+z,this.params.terrain.waterOffset),Math.min(this.size.height,LEGACY_HEIGHT) - (this.type === 'classic' ? 1 : 2))); 

        // Fill in all blocks at or below the terrain height
        // Only visit the actual column. Above it there is nothing to fill;
        // walking 32 levels for a 6-block column was wasted CPU.
        for (let y = height; y >= 0; y--) {
          if (this.type === 'lava' && y === height) {
            this.setBlockId(x,y,z,blocks.basalt.id);
          } else if (y <= this.params.terrain.waterOffset && y === height) {
            this.setBlockId(x, y, z, blocks.sand.id);
          } else if (y === height) {
            let groundBlockType;
            if (this.type === 'lava') {
              groundBlockType = blocks.basalt.id;
            } else if (biome === 'Desert') {
              groundBlockType = blocks.sand.id;
            } else if (biome === 'Jungle' && this.type !== 'classic') {
              groundBlockType = blocks.jungleGrass.id;
            } else if (biome === 'Temperate' || biome === 'Jungle') {
              groundBlockType = blocks.grass.id;
            } else if (biome === 'Tundra') {
              groundBlockType = blocks.snow.id;
            } else if (biome === 'Jungle') {
              groundBlockType = blocks.jungleGrass.id;
            }

            this.setBlockId(x, y, z, groundBlockType);

            // Randomly generate a tree
            if (rng.random() < this.params.trees.frequency) {
              this.generateTree(rng, biome, x, height + 1, z);
            }
          } else if (y < height && this.getBlockId(x, y, z) === blocks.empty.id) {
            this.generateResourceIfNeeded(simplex, x, y, z);
          }
        }
      }
    }
  }

  /** v10 landscape: mountain ridges, layered rock and genuine hollow cave networks. */
  generateAdvancedTerrain(rng) {
    const wasGenerating=!!this._generatingTerrain;
    this._generatingTerrain=true;
    const simplex = new SimplexNoise(rng);
    const oreTypes = {coal:resources.find(r=>r.id===blocks.coalOre.id), iron:resources.find(r=>r.id===blocks.ironOre.id)};
    const hydrological=this.terrainVersion===TERRAIN_V11||this.terrainVersion===TERRAIN_V112||this.terrainVersion===TERRAIN_HYBRID_V112;
    if(hydrological){
      this.waterColumns=new Array(this.size.width*this.size.width).fill(null);
      // Actual solid bed for each bank: avoid guessing the terrain from the
      // liquid depth when generating visible shoreline faces.
      this.hydrologyGround=new Float32Array(this.size.width*this.size.width).fill(-.5);
    }
    const surface=(x,z)=>advancedSurfaceHeight(simplex,this.params,this.type,x,z,this.size.height);
    for(let x=0;x<this.size.width;x++)for(let z=0;z<this.size.width;z++){
      const wx=this.position.x+x,wz=this.position.z+z;
      let height=this.terrainVersion===TERRAIN_HYBRID
        ? hybridSurfaceHeight(simplex,this.params,this.type,wx,wz,this.hybridNearby)
        : advancedSurfaceHeight(simplex,this.params,this.type,wx,wz,this.size.height);
      const originalHeight=height;
      let water=null,hydro=null;
      if(hydrological){
        const hydrology=this.terrainVersion===TERRAIN_V112?hydrologyColumnV112:hydrologyColumn;
        hydro=this.terrainVersion===TERRAIN_HYBRID_V112
          ? hybridHydrologyColumn(simplex,this.params,this.type,wx,wz,this.hybridNearby)
          : hydrology(simplex,this.params,this.type,wx,wz,this.params.seed,surface,height);
        height=hydro.height;
        if(hydro.waterY!==null){
          // Rendering metadata only. Saved chunks still store their original
          // voxel edits; water surface depth is deterministically regenerated.
          water={y:hydro.waterY,kind:hydro.kind,depth:Math.max(0,hydro.waterY-height-.5),
            stable:!!hydro.stable,source:!!hydro.source,waterfall:!!hydro.waterfall,
            flowX:hydro.flowX??0,flowZ:hydro.flowZ??0};
          this.waterColumns[z*this.size.width+x]=water;
        }
      }
      // The old renderer used an entire chunk-wide sea plane. With that
      // plane removed, real lowlands need actual full water voxels too;
      // otherwise the ocean preset would lose its seas altogether.
      if(hydrological&&!water&&this.type!=='lava'&&height<this.params.terrain.waterOffset){
        const top=this.params.terrain.waterOffset+.5;
        water={y:top-.25,kind:'lake',depth:top-(height+.5)};
        this.waterColumns[z*this.size.width+x]=water;
      }
      const mix=this.terrainVersion===TERRAIN_HYBRID?transitionWeight(wx,wz,this.hybridNearby)
        :this.terrainVersion===TERRAIN_HYBRID_V112?hydro.mix:1;
      // Worlds from v10/v11 already had stone strata and caves. Keep those
      // materials right up to the frozen edge instead of mixing in v9 dirt.
      const advancedSource=this.terrainVersion===TERRAIN_HYBRID_V112&&
        [TERRAIN_V10,TERRAIN_V11].includes(this.hybridNearby.hybrid.sourceVersion);
      const geologyMix=advancedSource?1:this.terrainVersion===TERRAIN_HYBRID_V112&&
        this.hybridNearby.hybrid.sourceVersion===TERRAIN_HYBRID
          ? Math.max(mix,transitionWeight(wx,wz,this.hybridNearby.legacyNear)):mix;
      const biome=this.getBiome(simplex,x,z);
      const profile=geologyColumn(simplex,wx,wz);
      for(let y=0;y<=height;y++){
        // Cavities are suppressed near original territory: no sudden vertical
        // cave mouths or tunnels reaching into already preserved foundations.
        if(geologyMix>=.82 && (!water || y<height-4) && isCave(simplex,wx,y,wz,height))continue;
        let id;
        if(y===height){
          id=this.type==='lava'?blocks.basalt.id:
            // The legacy generator marked an extra six-block corridor around
            // every river as bare stone/sand, even without terrain changes.
            // Keep the natural biome wherever no actual carving took place.
            hydro?.bank&&height<originalHeight-1?(this.type==='snow'?blocks.stone.id:blocks.sand.id):
            height<=this.params.terrain.waterOffset?blocks.sand.id:
            biome==='Desert'?blocks.sand.id:biome==='Tundra'?blocks.snow.id:
            biome==='Jungle'&&this.type!=='classic'?blocks.jungleGrass.id:blocks.grass.id;
        }else{
          if(geologyMix<1){
            // Deterministic geological dither, grading dirt/old ore into the
            // deeper v10 stone without a single vertical material seam.
            const hash=(((wx*73856093)^(y*19349663)^(wz*83492791))>>>0)/4294967296;
            if(hash>=geologyMix){this.generateResourceIfNeeded(simplex,x,y,z);continue;}
          }
          id=advancedUndergroundBlock(simplex,oreTypes,this.type,wx,y,wz,height,profile);
        }
        this.setBlockId(x,y,z,id);
      }
      const seaIce=water&&hydro?.waterY===null&&this.type==='snow'&&
        freezeColumn(this.type,this.params.seed,wx,wz,water.y,'lake');
      if(water&&(hydro?.ice||seaIce)){
        // The solid voxel and the visible sheet must occupy the same block.
        // The old ceil() left an invisible empty voxel beneath the selector.
        const iceTop=voxelWaterColumn(water,this.hydrologyGround[z*this.size.width+x])?.top;
        const iceY=Math.floor(iceTop);
        if(iceY>height&&iceY<this.size.height-2)
          this.setBlockId(x,iceY,z,blocks.ice.id);
      }
      // Tree placement is still deterministic and uses the same biome rules.
      if(!water && this.getBlockId(x,height,z)!==blocks.empty.id && height>this.params.terrain.waterOffset+1 && height<this.size.height-12 && rng.random()<this.params.trees.frequency)
        this.generateTree(rng,biome,x,height+1,z);
    }
    this._generatingTerrain=wasGenerating;
  }

  /**
   * Determines if a resource block should be generated at (x, y, z)
   * @param {SimplexNoise} simplex 
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  generateResourceIfNeeded(simplex, x, y, z) {
    this.setBlockId(x, y, z, this.type === 'lava' ? blocks.basalt.id : this.type !== 'classic' && y < 4 ? blocks.stone.id : blocks.dirt.id);
    resources.forEach(resource => {
      const value = simplex.noise3d(
        (this.position.x + x) / resource.scale.x,
        (this.position.y + y) / resource.scale.y,
        (this.position.z + z) / resource.scale.z);

      if (value > resource.scarcity) {
        this.setBlockId(x, y, z, resource.id);
      }
    });
  }

  /**
   * Creates a tree appropriate for the biome at (x, y, z)
   * @param {string} biome
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  generateTree(rng, biome, x, y, z) {
    const minH = this.params.trees.trunk.minHeight;
    const maxH = this.params.trees.trunk.maxHeight;
    const h = Math.round(minH + (maxH - minH) * rng.random());

    for (let treeY = y; treeY < y + h; treeY++) {
      if(this.terrainVersion===1 && treeY>=LEGACY_HEIGHT) break;
      if (biome === 'Temperate' || biome === 'Tundra') {
        this.setBlockId(x, treeY, z, blocks.tree.id);
      } else if (biome === 'Jungle') {
        this.setBlockId(x, treeY, z, blocks.jungleTree.id);
      } else if (biome === 'Desert') {
        this.setBlockId(x, treeY, z, blocks.cactus.id);
      }
    }

    // Generate canopy centered on the top of the tree
    if (biome === 'Temperate' || biome === 'Jungle' || (biome === 'Tundra' && this.type === 'snow')) {
      this.generateTreeCanopy(biome, x, y + h, z, rng);
    }
  }

  generateTreeCanopy(biome, centerX, centerY, centerZ, rng) {
    const minR = this.params.trees.canopy.minRadius;
    const maxR = this.params.trees.canopy.maxRadius;
    const r = Math.round(minR + (maxR - minR) * rng.random());

    for (let x = -r; x <= r; x++) {
      for (let y = -r; y <= r; y++) {
        for (let z = -r; z <= r; z++) {
          const n = rng.random();
          if(this.terrainVersion===1 && centerY+y>=LEGACY_HEIGHT)continue;

          // Make sure the block is within the canopy radius
          if (x * x + y * y + z * z > r * r) continue;
          // Don't overwrite an existing block
          if (this.getBlockId(centerX + x, centerY + y, centerZ + z) !== blocks.empty.id) continue;
          // Fill in the tree canopy with leaves based on the density parameter
          if (n < this.params.trees.canopy.density) {
            if (biome === 'Temperate') {
              this.setBlockId(centerX + x, centerY + y, centerZ + z, blocks.leaves.id);
            } else if (biome === 'Jungle') {
              this.setBlockId(centerX + x, centerY + y, centerZ + z, blocks.jungleLeaves.id);
            } else if (biome === 'Tundra') {
              this.setBlockId(centerX + x, centerY + y, centerZ + z, blocks.snowLeaves.id);
            }
          }
        }
      }
    }
  }

  /**
   * Creates happy little clouds
   * @param {RNG} rng 
   */
  generateClouds(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = (simplex.noise(
          (this.position.x + x) / this.params.clouds.scale,
          (this.position.z + z) / this.params.clouds.scale
        ) + 1) * 0.5;

        if (value < this.params.clouds.density) {
          this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
        }
      }
    }
  }

  /**
   * Pulls any changes from the data store and applies them to the data model
   */
  loadPlayerChanges() {
    // Only iterate edits in this chunk, not all 32,768 cells and JSON keys.
    for (const [x,y,z,id] of [...this.dataStore.entriesForChunk(this.position.x,this.position.z)]) {
      // Pre-11.4.5 saves addressed natural ice one voxel above its visible
      // mesh. Move only known old deletions so excavated holes stay holes.
      const oldKey=`${this.position.x},${this.position.z},${x},${y},${z}`;
      if(id===0 && this.dataStore.legacyIceEdits?.has(oldKey)){
        const water=this.waterColumns?.[z*this.size.width+x];
        const top=water&&voxelWaterColumn(water,this.hydrologyGround?.[z*this.size.width+x])?.top;
        const iceY=Number.isFinite(top)?Math.floor(top):null;
        const oldY=water?Math.ceil(water.y+.25):null;
        if(iceY!==null&&y===oldY&&iceY!==oldY&&this.getBlockId(x,iceY,z)===blocks.ice.id){
          this.dataStore.remapEdit(this.position.x,this.position.z,x,y,z,iceY,id);
          this.setBlockId(x,iceY,z,id);
          continue;
        }
        this.dataStore.legacyIceEdits.delete(oldKey);
      }
      this.setBlockId(x,y,z,id);
    }
  }

  materialFor(blockType){
    if(!this.fadeMaterials.has(blockType.id))
      this.fadeMaterials.set(blockType.id,makeFadeMaterial(blockType.material,this.fadeUniform));
    return this.fadeMaterials.get(blockType.id);
  }
  setFade(value){
    this.fade=clampFade(value);
    this.fadeUniform.value=this.fade;
    for(const item of this.children){
      if(item.isInstancedMesh){
        const id=Number(item.name);
        item.castShadow=this.nearShadows && this.fade>=.995 && id!==7 && id!==12 && id!==9 && id!==21;
      }
      if(item.userData?.waterSurface){
        const base=item.userData.originalOpacity;
        item.material.opacity=base*this.fade;
        item.visible=this.fade>.002;
      }
    }
  }
  generateWater() {
    const advancedWater=this.terrainVersion===TERRAIN_V112||this.terrainVersion===TERRAIN_HYBRID_V112;
    // The legacy blanket water plane used to overlap voxel rivers, creating
    // hovering transparent patches. New terrain has water ONLY where a
    // physical voxel column exists; keep the plane for pre-hydrology saves.
    if(!advancedWater){
    const winterLiquid=this.type==='snow'&&(this.terrainVersion===TERRAIN_V112||this.terrainVersion===TERRAIN_HYBRID_V112);
    const baseKind=this.type==='lava'?'lava':this.type==='snow'&&!winterLiquid?'frozen':'river';
    const baseColor=this.type==='lava'?0xff4a08:this.type==='snow'&&!winterLiquid?0xb3dfe8:
      this.type==='ocean'?0x358ab9:this.type==='jungle'?0x3e999c:
      this.type==='desert'?0x4baca1:0x4489b5;
    const material = applyWaterMotion(new THREE.MeshLambertMaterial({
      color: baseColor,
      emissive: this.type === 'lava' ? 0xb52200 : 0x000000,
      emissiveIntensity: this.type === 'lava' ? .55 : 0,
      transparent: true,
      opacity: waterOpacity(baseKind,this.type),
      side: THREE.DoubleSide,depthWrite:false
    }),baseKind);

    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);
    waterMesh.rotateX(-Math.PI / 2.0);
    waterMesh.position.set(
      this.size.width / 2,
      this.params.terrain.waterOffset + 0.4,
      this.size.width / 2
    );
    waterMesh.scale.set(this.size.width, this.size.width, 1);
    waterMesh.layers.set(1);
    waterMesh.userData.waterSurface=true;
    waterMesh.userData.originalOpacity=material.opacity;
    material.opacity*=this.fade;

    this.add(waterMesh);
    }
    // One indexed surface per water type, with per-vertex water-depth colors:
    // no new render passes, texture downloads or individual water blocks.
    if(!this.waterColumns)return;
    const size=this.size.width;
    // Both static and simulated liquid use this same source of truth when
    // building a surface, a shoreline and a real vertical waterfall.
    const simplex=advancedWater?new SimplexNoise(new RNG(this.params.seed)):null;
    const heightAt=advancedWater?(wx,wz)=>advancedSurfaceHeight(simplex,this.params,this.type,wx,wz,this.size.height):null;
    const boundaryCache=new Map();
    const readBoundary=(x,z)=>{
      if(!advancedWater)return null;
      const wx=this.position.x+x,wz=this.position.z+z;
      const dynamic=this.hydrologyLookup?.(wx,wz);
      if(dynamic!==undefined){
        if(dynamic)return dynamic;
        const bed=this.hydrologyGroundLookup?.(wx,wz);
        return Number.isFinite(bed)?{bed}:null;
      }
      const context=this.hybridNearby;
      const hydro=this.terrainVersion===TERRAIN_HYBRID_V112
        ? (context.protectedSet.has(`${Math.floor(wx/size)},${Math.floor(wz/size)}`)
          ? null:hybridHydrologyColumn(simplex,this.params,this.type,wx,wz,
            makeHybridContext(context.protectedSet,context.legacySet,context.hybrid,
              Math.floor(wx/size),Math.floor(wz/size))))
        : hydrologyColumnV112(simplex,this.params,this.type,wx,wz,this.params.seed,heightAt);
      if(!hydro)return null;
      if(hydro.waterY===null&&this.type!=='lava'&&hydro.height<this.params.terrain.waterOffset)
        return {y:this.params.terrain.waterOffset+.25,kind:'lake',
          bed:hydro.height+.5};
      return hydro.waterY===null?{bed:hydro.height+.5}:
        {y:hydro.waterY,kind:hydro.kind,bed:hydro.height+.5,depth:Math.max(0,hydro.waterY-hydro.height-.5),
          stable:!!hydro.stable,source:!!hydro.source,waterfall:!!hydro.waterfall,
          flowX:hydro.flowX??0,flowZ:hydro.flowZ??0};
    };
    const boundary=(x,z)=>{
      const key=`${x},${z}`;
      if(!boundaryCache.has(key))boundaryCache.set(key,readBoundary(x,z));
      return boundaryCache.get(key);
    };
    const groups=new Map();
    const now=waterTime();
    const timeline=this.waterTransitions??(this.waterTransitions=new WaterTransitions());
    const owner=this;
    timeline.begin(owner);
    const previous=this.presentedWaterCells||[];
    const drySince=this.dryingWaterSince??(this.dryingWaterSince=new Map());
    const renderCells=this.waterColumns.map((c,i)=>{
      if(c){drySince.delete(i);return c;}
      const old=previous[i];
      if(!old||old.kind==='frozen'||old.kind==='lava')return null;
      if(!drySince.has(i))drySince.set(i,now);
      if(now-drySince.get(i)>WATER_TRANSITION_SECONDS){drySince.delete(i);return null;}
      const ground=this.hydrologyGround?.[i];
      if(!Number.isFinite(ground)||ground>old.bottom+.01)return null;
      const bed=old.bottom,depth=old.finite?.0011:.026;
      return {kind:old.kind,bed,depth,y:bed+depth-.25,finite:old.finite,dynamic:true,drying:true};
    });
    this.presentedWaterCells=this.waterColumns.map((c,i)=>{
      const v=voxelWaterColumn(c,this.hydrologyGround?.[i]);return v?{...v,finite:!!c?.finite}:renderCells[i]?.drying?previous[i]:null;
    });
    const flowVectors=renderCells.map(c=>waterFlowVector(c));
    const newGroup=()=>({verts:[],indices:[],colors:[],falls:[],motion:[]});

    const blockAt=(x,y,z)=>x>=0&&x<size&&z>=0&&z<size
      ?this.getBlockId(x,y,z):this.liquidBlockLookup?.(this.position.x+x,y,this.position.z+z)??0;
    const debugSources=typeof window!=='undefined'&&
      /(?:\?|&)waterDebug(?:=1|(?=&|$))/.test(window.location?.search||'');
    const voxelCache=new Map();
    const readVoxel=(x,z)=>{
      const inside=x>=0&&x<size&&z>=0&&z<size;
      const cell=inside?renderCells[z*size+x]:boundary(x,z);
      const bed=inside?this.hydrologyGround?.[z*size+x]:cell?.bed;
      const voxel=voxelWaterColumn(cell,bed);
      return voxel?{...voxel,flow:inside?flowVectors[z*size+x]:waterFlowVector(cell),kind:cell.kind,dynamic:!!cell.dynamic,drying:!!cell.drying,open:exposedLiquidTop(voxel.top,y=>blockAt(x,y,z))}:null;
    };
    const voxelAt=(x,z)=>{
      const key=`${x},${z}`;
      if(!voxelCache.has(key))voxelCache.set(key,readVoxel(x,z));
      return voxelCache.get(key);
    };
    // Equal-height and equal-kind cells share both a tint and a single mesh
    // rectangle. Per-tile depth colors and transparent triangle edges used to
    // expose a checkerboard across otherwise perfectly flat reservoirs.
    const surfaceColor=(kind,sourceDebug=false)=>sourceDebug
      ?[.025,.10,.42]:waterDepthColor(kind,this.type,1);
    const surfaces=new Array(size*size).fill(null),voxels=new Array(size*size).fill(null);
    for(let z=0;z<size;z++)for(let x=0;x<size;x++){
      const i=z*size+x,cell=renderCells[i],voxel=voxelAt(x,z);
      voxels[i]=voxel;
      if(voxel){
        if(!groups.has(cell.kind))groups.set(cell.kind,newGroup());
        if(exposedLiquidTop(voxel.top,y=>blockAt(x,y,z)))
          surfaces[i]={kind:cell.kind,top:voxel.top,flowKey:flowVectors[i].map(v=>Math.round(v*10)).join(','),sourceDebug:debugSources&&!!cell.source};
      }
    }
    const cornerCache=new Map(),sharedCornerCache=new Map();
    const cornersAt=(x,z)=>{
      const id=`${x},${z}`;if(cornerCache.has(id))return cornerCache.get(id);
      const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>
        continuousCorner(this.position.x+x,this.position.z+z,sx,sz,
          (wx,wz)=>voxelAt(wx-this.position.x,wz-this.position.z),sharedCornerCache));
      cornerCache.set(id,corners);return corners;
    };
    const motionFor=(x,z,corner,y)=>{
      const i=z*size+x,cell=renderCells[i],voxel=voxels[i];
      const initial=previous[i]?y:voxel.bottom+.001;
      return {key:'surface:'+corner.key,initial,normal:corner.normal,flow:corner.flow||flowVectors[i],flowSamples:corner.flowSamples||[[this.position.x+x,this.position.z+z,voxel.bottom]],fixed:!Number.isFinite(corner.top)||Math.abs(y-corner.top)>1e-6,alphaKey:`cell:${this.position.x+x},${this.position.z+z}`,
        alpha:cell.drying?0:1,initialAlpha:previous[i]?1:0};
    };
    const flat=surfaces.map((cell,i)=>{
      if(!cell)return null;
      const x=i%size,z=Math.floor(i/size);
      const cs=cornersAt(x,z);
      return !renderCells[i].dynamic&&cs.every(c=>c&&Math.abs(c.top-cell.top)<1e-7)?cell:null;
    });
    for(const rect of mergeCoplanarWaterSurfaces(size,flat)){
      const {x,z,width,depth,top,kind,sourceDebug}=rect;
      if(!groups.has(kind))groups.set(kind,newGroup());
      const group=groups.get(kind),base=group.verts.length/3;
      group.verts.push(
        x-.5,top,z-.5,
        x+width-.5,top,z-.5,
        x+width-.5,top,z+depth-.5,
        x-.5,top,z+depth-.5);
      group.indices.push(base,base+2,base+1,base,base+3,base+2);
      const color=surfaceColor(kind,sourceDebug);
      group.colors.push(...color,...color,...color,...color);
      group.falls.push(0,0,0,0);
      const locations=[[x,z,0],[x+width-1,z,1],[x+width-1,z+depth-1,2],[x,z+depth-1,3]];
      for(const [cx,cz,k] of locations)group.motion.push(motionFor(cx,cz,cornersAt(cx,cz)[k],top));
    }
    // Varying levels keep a grid, but adjoining cells use identical corner
    // heights instead of drawing overlapping stair-step walls.
    for(let z=0;z<size;z++)for(let x=0;x<size;x++){
      const i=z*size+x,cell=surfaces[i];if(!cell||flat[i])continue;
      const group=groups.get(cell.kind),base=group.verts.length/3,cs=cornersAt(x,z);
      for(let k=0;k<4;k++){
        const sx=k===0||k===3?-.5:.5,sz=k<2?-.5:.5;
        group.verts.push(x+sx,cs[k].top,z+sz);
        group.colors.push(...surfaceColor(cell.kind,cell.sourceDebug));group.falls.push(0);
        group.motion.push(motionFor(x,z,cs[k],cs[k].top));
      }
      group.indices.push(base,base+2,base+1,base,base+3,base+2);
    }
    if(!groups.size){timeline.end();return;}
    if(advancedWater){
      // The higher liquid owns the exposed edge. Its face reaches a lower
      // river only on the actual downstream side; lateral differences stop
      // at the upper voxel rather than making tall transparent curtains.
      for(let z=0;z<size;z++)for(let x=0;x<size;x++){
        const i=z*size+x,cell=renderCells[i];
        const voxel=voxels[i];
        if(!voxel)continue;
        const group=groups.get(cell.kind);
        if(!group)continue;
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=x+dx,nz=z+dz;
          const inside=nx>=0&&nx<size&&nz>=0&&nz<size;
          const neighbor=inside?voxels[nz*size+nx]:voxelAt(nx,nz);
          const neighborCell=inside?renderCells[nz*size+nx]:boundary(nx,nz);
          const dry=nx>=0&&nx<size&&nz>=0&&nz<size
            ?this.hydrologyGround?.[nz*size+nx]:boundary(nx,nz)?.bed;
          const naturalRiver=!cell.dynamic&&!cell.finite&&cell.kind==='river';
          const directed=isDownstreamWaterfallEdge(cell,neighborCell,dx,dz);
          const inferred=naturalRiver&&!Math.hypot(cell.flowX||0,cell.flowZ||0)&&
            neighborCell&&['river','lake','oasis'].includes(neighborCell.kind)&&neighbor&&voxel.top-neighbor.top>1.05;
          const cascades=(naturalRiver||cell.fallRate>0)&&(directed||inferred);
          const cavities=this.cavityLiquidLookup?.(this.position.x+nx,this.position.z+nz)??[];
          const mouth=cavities.some(c=>c.bottom<voxel.top&&c.roof>voxel.bottom);
          if(connectedWater(voxel,neighbor))continue;
          const edgeFace=exposedVoxelSide(voxel,neighbor,mouth?undefined:dry,cascades);
          if(!edgeFace)continue;
          const {waterfall}=edgeFace;
          const cs=cornersAt(x,z),edgeCorners=dx>0?[cs[1],cs[2]]:dx<0?[cs[0],cs[3]]:
            dz>0?[cs[3],cs[2]]:[cs[0],cs[1]];
          for(const {top,bottom} of exposedLiquidIntervals(edgeFace.bottom,edgeFace.top,
            [...(neighbor?[neighbor]:[]),...cavities],y=>blockAt(nx,y,nz))){
          const base=group.verts.length/3;
          const topA=Math.min(top,edgeCorners[0].top),topB=Math.min(top,edgeCorners[1].top);
          const joinsLower=waterfall&&cascades&&neighbor&&Math.abs(bottom-neighbor.top)<1e-6;
          const lower=joinsLower?cornersAt(nx,nz):null;
          const lowerCorners=!lower?null:dx>0?[lower[0],lower[3]]:dx<0?[lower[1],lower[2]]:
            dz>0?[lower[0],lower[1]]:[lower[3],lower[2]];
          const bottomA=lowerCorners?.[0]?.top??bottom,bottomB=lowerCorners?.[1]?.top??bottom;
          const flowLength=Math.hypot(cell.flowX||0,cell.flowZ||0);
          // Outside simulation, use a nominal natural river discharge only
          // for shaping the curtain; never create or activate physical water.
          const nominal=.3*(voxel.top-voxel.bottom)*(flowLength?Math.abs(dx?cell.flowX:cell.flowZ)/flowLength:1);
          const edgeRate=cell.finite?(cell.fallEdges?.[dx>0?0:dx<0?1:dz>0?2:3]??cell.fallRate):nominal;
          const halfWidth=waterfall&&cascades?Math.max(.04,Math.min(.5,Math.sqrt(Math.max(0,edgeRate||0)/.6)*.5)):.5;
          const continues=(side)=>{
            if(!waterfall||!cascades||!neighbor)return false;
            const tx=dx?0:side,tz=dx?side:0,up=voxelAt(x+tx,z+tz),down=voxelAt(nx+tx,nz+tz);
            if(!connectedWater(voxel,up)||!connectedWater(neighbor,down)||up.top-down.top<=.05)return false;
            const sx=x+tx,sz=z+tz;
            const adjacent=sx>=0&&sx<size&&sz>=0&&sz<size?renderCells[sz*size+sx]:boundary(sx,sz);
            return isDownstreamWaterfallEdge(adjacent,neighborCell,dx,dz)||
              (!adjacent?.dynamic&&adjacent?.kind==='river'&&!Math.hypot(adjacent.flowX||0,adjacent.flowZ||0));
          };
          // Narrow only the outside edges of a curtain. Interior neighbours
          // share the exact seam instead of tapering every tile separately.
          const lowA=continues(-1)?-.5:-halfWidth,lowB=continues(1)?.5:halfWidth;
          if(topA<=bottom&&topB<=bottom)continue;
          if(dx){
            const edge=x+dx*.5;
            group.verts.push(edge,Math.max(bottom,topA),z-.5,edge,Math.max(bottom,topB),z+.5,
              edge,bottomB,z+lowB,edge,bottomA,z+lowA);
          }else{
            const edge=z+dz*.5;
            group.verts.push(x-.5,Math.max(bottom,topA),edge,x+.5,Math.max(bottom,topB),edge,
              x+lowB,bottomB,edge,x+lowA,bottomA,edge);
          }
          group.motion.push({...motionFor(x,z,edgeCorners[0],Math.max(bottom,topA)),normal:null},
            {...motionFor(x,z,edgeCorners[1],Math.max(bottom,topB)),normal:null},
            lowerCorners?.[1]?{...motionFor(x,z,lowerCorners[1],bottomB),normal:null}:
              {...motionFor(x,z,{key:`fixed:${x},${z},${dx},${dz},1,${bottom}`},bottom),fixed:true},
            lowerCorners?.[0]?{...motionFor(x,z,lowerCorners[0],bottomA),normal:null}:
              {...motionFor(x,z,{key:`fixed:${x},${z},${dx},${dz},0,${bottom}`},bottom),fixed:true});
          // Flip the winding for the two negative-facing normal directions.
          const front=dx>0||dz<0;
          group.indices.push(...(front
            ?[base,base+1,base+2,base,base+2,base+3]
            :[base,base+2,base+1,base,base+3,base+2]));
          const tint=surfaceColor(cell.kind,debugSources&&!!cell.source);
          group.colors.push(...tint,...tint,...tint,...tint);
          const animateFall=waterfall&&cascades;
          group.falls.push(animateFall?1:0,animateFall?1:0,
            animateFall?1:0,animateFall?1:0);
          }
        }
      }
    }
    for(const [kind,group] of groups){
      if(!group.verts.length)continue;
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(group.verts,3));
      geometry.setAttribute('color',new THREE.Float32BufferAttribute(group.colors,3));
      const heightMotion=[],alphaMotion=[],flow=[];
      for(let v=0;v<group.motion.length;v++){
        const m=group.motion[v],y=group.verts[v*3+1];
        const r=m.fixed?{from:y,start:now,duration:0}:timeline.target(m.key,y,now,m.initial);
        const a=timeline.target(m.alphaKey,m.alpha,now,m.initialAlpha);
        heightMotion.push(r.from,r.start,r.duration);flow.push(...(m.flow||[0,0]));
        alphaMotion.push(a.from,a.to,a.start,a.duration);
      }
      geometry.setAttribute('waterHeightMotion',new THREE.Float32BufferAttribute(heightMotion,3));
      geometry.setAttribute('waterAlphaMotion',new THREE.Float32BufferAttribute(alphaMotion,4));
      geometry.setAttribute('waterFlow',new THREE.Float32BufferAttribute(flow,2));
      if(THREE.DynamicDrawUsage!==undefined)geometry.getAttribute?.('waterFlow')?.setUsage?.(THREE.DynamicDrawUsage);
      bindWaterFlow(geometry,group.motion);
      if(this.terrainVersion===TERRAIN_V112||this.terrainVersion===TERRAIN_HYBRID_V112)
        geometry.setAttribute('waterFall',new THREE.Float32BufferAttribute(group.falls,1));
      geometry.setIndex(group.indices);geometry.computeVertexNormals();
      const normals=geometry.getAttribute?.('normal');
      if(normals)for(let v=0;v<group.motion.length;v++){
        const n=group.motion[v].normal;if(n)normals.setXYZ(v,...n);
      }
      const surfaceMat=applyWaterMotion(new THREE.MeshLambertMaterial({
        color:0xffffff,vertexColors:true,transparent:true,opacity:waterOpacity(kind,this.type),
        emissive:kind==='lava'?0x9c2200:0x000000,emissiveIntensity:kind==='lava'?.55:0,
        side:THREE.DoubleSide,depthWrite:false
      }),kind,this.terrainVersion===TERRAIN_V112||this.terrainVersion===TERRAIN_HYBRID_V112,true,true);
      // Three.js otherwise draws transparent DoubleSide back faces in an
      // extra pass, amplifying dark translucent overlaps on waterfalls.
      surfaceMat.forceSinglePass=true;
      // Falling sheets touch cliff faces. A depth bias prevents coplanar
      // flicker without moving the physical surface or adding geometry.
      surfaceMat.polygonOffset=true;surfaceMat.polygonOffsetFactor=-1;surfaceMat.polygonOffsetUnits=-1;
      const surface=new THREE.Mesh(geometry,surfaceMat);
      // Include both endpoints in culling bounds throughout a transition.
      if(geometry.computeBoundingBox){
      geometry.computeBoundingBox();
      for(const m of heightMotion.filter((_,i)=>i%3===0)){
        geometry.boundingBox.min.y=Math.min(geometry.boundingBox.min.y,m);
        geometry.boundingBox.max.y=Math.max(geometry.boundingBox.max.y,m);
      }
      geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
      }
      surface.layers.set(1);surface.userData.waterSurface=true;
      surface.userData.originalOpacity=surfaceMat.opacity;
      surfaceMat.opacity*=this.fade;
      this.add(surface);
    }
    timeline.end();
  }

  refreshWaterFlow(){
    if(!this.loaded)return;
    const size=this.size.width;
    const sample=(wx,wz,bottom)=>{
      const x=wx-this.position.x,z=wz-this.position.z,inside=x>=0&&x<size&&z>=0&&z<size;
      const cell=inside?this.waterColumns[z*size+x]:this.hydrologyLookup?.(wx,wz);
      const bed=inside?this.hydrologyGround?.[z*size+x]:cell?.bed;
      const water=voxelWaterColumn(cell,bed);
      return water&&Math.abs(water.bottom-bottom)<.001?waterFlowVector(cell):[0,0];
    };
    for(const mesh of this.children)if(mesh.userData?.waterSurface)refreshWaterFlowAttribute(mesh.geometry,sample);
  }

  /** Rebuild only the batched water meshes after a hydrology tick. Solid block
   * instances, player edits, shadows and fading are left untouched. */
  refreshWater() {
    if(!this.loaded)return;
    for(const mesh of [...this.children]){
      if(!mesh.userData?.waterSurface)continue;
      this.remove(mesh);
      mesh.geometry?.dispose?.();mesh.material?.dispose?.();
    }
    this.generateWater();
  }

  /**
    * Generates the 3D representation of the world from the world data
    */
  generateMeshes() {
    this.clear();
    this.generateWater();
    // First collect visible cubes. The old implementation reserved 32768
    // matrices for EVERY material in EVERY chunk, even absent materials.
    const visible=new Map();
    for(let x=0;x<this.size.width;x++)for(let y=0;y<=this.maxFilledY;y++)for(let z=0;z<this.size.width;z++){
      const id=this.getBlockId(x,y,z);
      if(id===blocks.empty.id||this.isBlockObscured(x,y,z))continue;
      if(!visible.has(id))visible.set(id,[]);
      visible.get(id).push(this.voxels.index(x,y,z));
    }
    const matrix=new THREE.Matrix4();
    for(const blockType of BLOCK_TYPES){
      if(blockType.id===blocks.empty.id)continue;
      const positions=visible.get(blockType.id)||[];
      if(!positions.length)continue;
      // Keep a modest amount of editing headroom. Grow on demand later.
      const capacity=Math.max(16,Math.ceil(positions.length*1.25)+32);
      const mesh=new THREE.InstancedMesh(blockType.geometry || geometry,this.materialFor(blockType),capacity);
      mesh.name=String(blockType.id);mesh.count=positions.length;
      // Explicit voxel identity survives instance transforms for thin ice.
      mesh.userData.blockIndices=positions.slice();
      mesh.castShadow=this.nearShadows && blockType.id!==7 && blockType.id!==12 && blockType.id!==9 && blockType.id!==21;mesh.receiveShadow=true;
      positions.forEach((encoded,index)=>{
        const z=encoded%this.size.width;
        const t=(encoded-z)/this.size.width;
        const y=t%this.size.height;
        const x=(t-y)/this.size.height;
        this.setBlockMatrix(matrix,x,y,z,blockType.id);
        mesh.setMatrixAt(index,matrix);
        this.setBlockInstanceId(x,y,z,index);
      });
      if(positions.length)mesh.instanceMatrix.needsUpdate=true;
      this.add(mesh);
    }
  }

  /** Natural ice is in the same voxel as its actual geometry and hitbox.
   * Manually placed ice on dry land retains its standard cube shape. */
  iceSurfaceAt(x,y,z){
    if(this.getBlockId(x,y,z)!==blocks.ice.id)return null;
    if(this.terrainVersion!==TERRAIN_V112&&this.terrainVersion!==TERRAIN_HYBRID_V112)return null;
    if(x<0||z<0||x>=this.size.width||z>=this.size.width)return null;
    const cell=this.waterColumns?.[z*this.size.width+x];
    const iceTop=cell?voxelWaterColumn(cell,this.hydrologyGround?.[z*this.size.width+x])?.top:null;
    const surface=cell?iceTop:
      this.type==='snow'?this.params.terrain.waterOffset+.5:null;
    const expectedY=Math.floor(surface);
    return Number.isFinite(surface)&&expectedY===y?surface:null;
  }

  setBlockMatrix(matrix,x,y,z,id){
    const surface=id===blocks.ice.id?this.iceSurfaceAt(x,y,z):null;
    if(surface!==null){
      matrix.makeScale(1,ICE_THICKNESS,1);
      matrix.setPosition(x,surface-ICE_THICKNESS/2+.003,z);
    }else{
      matrix.identity();
      matrix.setPosition(x,y,z);
    }
  }

  setNearShadows(enabled) {
    if(this.nearShadows===enabled)return;
    this.nearShadows=enabled;
    for(const mesh of this.children)if(mesh.isInstancedMesh){
      const id=Number(mesh.name);
      mesh.castShadow=enabled && this.fade>=.995 && id!==7 && id!==12 && id!==9 && id!==21;
    }
  }

  ensureMeshCapacity(mesh) {
    if(mesh.count < mesh.instanceMatrix.count)return mesh;
    const blockType=BLOCK_BY_ID.get(Number(mesh.name));
    const grown=new THREE.InstancedMesh(blockType.geometry || geometry,mesh.material,Math.min(this.size.width**2*this.size.height,Math.max(64,mesh.count*2)));
    grown.name=mesh.name;grown.count=mesh.count;
    grown.userData.blockIndices=mesh.userData.blockIndices?.slice()||[];
    grown.castShadow=mesh.castShadow;grown.receiveShadow=mesh.receiveShadow;
    const matrix=new THREE.Matrix4();
    for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);grown.setMatrixAt(i,matrix);}
    grown.instanceMatrix.needsUpdate=true;
    this.remove(mesh);this.add(grown);
    mesh.dispose?.();
    return grown;
  }

  /**
  * Gets the block data at (x, y, z)
  * @param {number} x
  * @param {number} y
  * @param {number} z
  * @returns {{id: number, instanceId: number}}
  */
  getBlock(x, y, z) {
    if (!this.inBounds(x,y,z)) return null;
    const i=this.voxels.index(x,y,z);
    const instance=this.voxels.instances[i];
    return { id:this.voxels.ids[i], instanceId:instance<0?null:instance };
  }

  /** Allocation-free accessor used by physics and voxel selection. */
  getBlockId(x,y,z) { return this.voxels?.id(x,y,z) ?? 0; }

  /**
   * Adds a new block at (x,y,z) of type `blockId`
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} blockId 
   */
  addBlock(x, y, z, blockId) {
    if (this.loaded && this.getBlockId(x, y, z) === blocks.empty.id && BLOCK_BY_ID.has(blockId)) {
      this.setBlockId(x, y, z, blockId);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId);
      return true;
    }
    return false;
  }

  /**
   * Removes the block at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (this.loaded && block && block.id !== blocks.empty.id) {
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
      this.dataStore.set(this.position.x, this.position.z, x, y, z, blocks.empty.id);
      return true;
    }
    return false;
  }

  /**
   * Removes the mesh instance associated with `block` by swapping it
   * with the last instance and decrementing the instance count.
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    if (block.id === blocks.empty.id || block.instanceId === null) return;

    // Get the mesh and instance id of the block
    const mesh = this.children.find((instanceMesh) => Number(instanceMesh.name) === block.id);
    const instanceId = block.instanceId;

    // Swapping the transformation matrix of the block in the last position
    // with the block that we are going to remove
    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // Matrix translations do not coincide with voxel coordinates for thin
    // ice, so recover the logical voxel from the retained instance index.
    const lastEncoded=mesh.userData.blockIndices?.[mesh.count-1];
    if(Number.isInteger(lastEncoded)){
      const zLast=lastEncoded%this.size.width;
      const tLast=(lastEncoded-zLast)/this.size.width;
      const yLast=tLast%this.size.height;
      const xLast=(tLast-yLast)/this.size.height;
      this.setBlockInstanceId(xLast,yLast,zLast,instanceId);
      mesh.userData.blockIndices[instanceId]=lastEncoded;
      mesh.userData.blockIndices.pop();
    }else{
      const v=new THREE.Vector3();v.applyMatrix4(lastMatrix);
      this.setBlockInstanceId(v.x,v.y,v.z,instanceId);
    }

    // Swapping the transformation matrices
    mesh.setMatrixAt(instanceId, lastMatrix);

    // This effectively removes the last instance from the scene
    mesh.count--;

    // Notify the instanced mesh we updated the instance matrix
    // Also re-compute the bounding sphere so raycasting works
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    // Remove the instance associated with the block and update the data model
    this.setBlockInstanceId(x, y, z, null);
  }

  /**
   * Create a new instance for the block at (x,y,z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    // Verify the block exists, it isn't an empty block type, and it doesn't already have an instance
    if (block && block.id !== blocks.empty.id && block.instanceId === null) {
      // Get the mesh and instance id of the block
      let mesh = this.children.find((instanceMesh) => Number(instanceMesh.name) === block.id);
      if(!mesh){
        const blockType=BLOCK_BY_ID.get(block.id);
        if(!blockType)return;
        mesh=new THREE.InstancedMesh(blockType.geometry || geometry,this.materialFor(blockType),16);
        mesh.name=String(block.id);mesh.count=0;mesh.castShadow=this.nearShadows && block.id!==7 && block.id!==12 && block.id!==9 && block.id!==21;mesh.receiveShadow=true;
        this.add(mesh);
      }
      mesh = this.ensureMeshCapacity(mesh);
      const instanceId = mesh.count++;
      this.setBlockInstanceId(x, y, z, instanceId);
      if(!mesh.userData.blockIndices)mesh.userData.blockIndices=[];
      mesh.userData.blockIndices[instanceId]=this.voxels.index(x,y,z);

      // Compute the transformation matrix for the new instance and update the instanced
      const matrix = new THREE.Matrix4();
      this.setBlockMatrix(matrix,x,y,z,block.id);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  /**
    * Sets the block id for the block at (x, y, z)
    * @param {number} x
    * @param {number} y
    * @param {number} z
    * @param {number} id
    */
  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      // Standard worlds do not track exposed water banks; avoid a redundant
      // voxel read for every block generated in those older terrain versions.
      const before=this.hydrologyGround?this.voxels.id(x,y,z):null;
      this.voxels.setId(x,y,z,id);
      if(id!==blocks.empty.id && y>this.maxFilledY)this.maxFilledY=y;
      if(this.hydrologyGround && before!==id){
        const index=z*this.size.width+x,oldTop=Math.floor(this.hydrologyGround[index]-.5);
        this.hydraulicCeilings?.delete(index);
        if(this._generatingTerrain){
          // Keep procedural geology (including pre-existing caves) unchanged.
          if(WATER_SOLID.has(id)&&y>oldTop)this.hydrologyGround[index]=y+.5;
          else if(y===oldTop&&WATER_SOLID.has(before)&&!WATER_SOLID.has(id)){
            let next=y-1;
            while(next>=0&&!WATER_SOLID.has(this.voxels.id(x,next,z)))next--;
            this.hydrologyGround[index]=next+.5;
          }
        }else{
          this.hydrologyGround[index]=hydraulicBedAfterEdit(
            this.hydrologyGround[index],y,WATER_SOLID.has(before),WATER_SOLID.has(id),
            level=>WATER_SOLID.has(this.voxels.id(x,level,z)),this.size.height);
        }
      }
    }
  }


  /**
    * Sets the block instance id for the block at (x, y, z)
    * @param {number} x
    * @param {number} y
    * @param {number} z
    * @param {number} instanceId
    */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.voxels.setInstance(x,y,z,instanceId);
    }
  }

  /**
    * Checks if the (x, y, z) coordinates are within bounds
    * @param {number} x
    * @param {number} y
    * @param {number} z
    * @returns {boolean}
    */
  inBounds(x, y, z) {
    if (x >= 0 && x < this.size.width &&
      y >= 0 && y < this.size.height &&
      z >= 0 && z < this.size.width) {
      return true;
    } else {
      return false;
    }
  }

  /**
    * Returns true if this block is completely hidden by other blocks
    * @param {number} x
    * @param {number} y
    * @param {number} z
    * @returns {boolean}
    */
  isBlockObscured(x, y, z) {
    const up = this.getBlockId(x, y + 1, z);
    const down = this.getBlockId(x, y - 1, z);
    const left = this.getBlockId(x + 1, y, z);
    const right = this.getBlockId(x - 1, y, z);
    const forward = this.getBlockId(x, y, z + 1);
    const back = this.getBlockId(x, y, z - 1);

    // If any of the block's sides is exposed, it is not obscured
    // Una roca rodeada de cristal u hojas debe seguir dibujándose, ya que
    // estos bloques dejan ver su interior. Sin ello aparecen huecos visuales.
    return ![up, down, left, right, forward, back].some(id => NON_OCCLUDING.has(id));
  }

  disposeInstances() {
    this.waterTransitions?.release(this);
    this.presentedWaterCells=null;
    this.dryingWaterSince=null;
    this.traverse((obj) => {
      if (obj.isInstancedMesh) obj.dispose();
      else { if (obj.geometry?.dispose) obj.geometry.dispose(); if (obj.material?.dispose) obj.material.dispose(); }
    });
    this.clear();
    for(const material of this.fadeMaterials.values())disposeFadeMaterial(material);
    this.fadeMaterials.clear();
    this.voxels=null;
  }
}
