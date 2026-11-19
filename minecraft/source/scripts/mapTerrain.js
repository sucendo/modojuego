import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { RNG } from './rng.js';
import { biomeForType, terrainHeight } from './worldTypes.js';
import { advancedSurfaceHeight, TERRAIN_V10 } from './terrainV10.js';
import { TERRAIN_HYBRID, generatorForChunk, protectionNearby, coordinateChunk, hybridSurfaceHeight, legacySurfaceHeight } from './hybridTerrain.js';
import { TERRAIN_V11, hydrologyColumn } from './hydrology.js';
import { TERRAIN_V112, hydrologyColumnV112, freezeColumn } from './hydrologyV112.js';
import { TERRAIN_HYBRID_V112, hybridHydrologyColumn, sourceGenerator, makeHybridContext } from './hybridHydrology.js';

// Same Simplex seed and height/biome equations as WorldChunk. This is a
// *read-only* sampler: no chunks, voxels, meshes or new WebGL resources.
export class MapTerrain{
  constructor(world){this.world=world;this.refresh();}
  refresh(){
    this.simplex=new SimplexNoise(new RNG(this.world.params.seed));
    this.seed=this.world.params.seed;
    this.cachedVersion=this.world.terrainVersion;
    this.cachedHybrid=this.world.hybrid;
    this.nearbyCache=new Map();
  }
  sample(x,z){
    if(this.seed!==this.world.params.seed || this.cachedVersion!==this.world.terrainVersion || this.cachedHybrid!==this.world.hybrid)this.refresh();
    const p=this.world.params;
    let n=.5*this.simplex.noise(x/p.biomes.scale,z/p.biomes.scale)+.5;
    n+=p.biomes.variation.amplitude*this.simplex.noise(x/p.biomes.variation.scale,z/p.biomes.variation.scale);
    const base=n<p.biomes.tundraToTemperate?'Tundra':n<p.biomes.temperateToJungle?'Temperate':n<p.biomes.jungleToDesert?'Jungle':'Desert';
    const biome=biomeForType(this.world.type,base,n);
    const cx=coordinateChunk(x),cz=coordinateChunk(z);
    const upgraded=this.world.terrainVersion===TERRAIN_HYBRID_V112;
    const gen=upgraded
      ? (this.world.hybridProtectedSet.has(`${cx},${cz}`)
        ? sourceGenerator(this.world.hybrid,cx,cz,this.world.hybridLegacySet,this.world.hybridV1Set,this.world.hybridV2Set):TERRAIN_HYBRID_V112)
      : generatorForChunk(this.world.terrainVersion,this.world.hybridProtectedSet,cx,cz);
    const key=`${cx},${cz}`;
    if((gen===TERRAIN_HYBRID||gen===TERRAIN_HYBRID_V112)&&!this.nearbyCache.has(key))
      this.nearbyCache.set(key,gen===TERRAIN_HYBRID_V112
        ?makeHybridContext(this.world.hybridProtectedSet,this.world.hybridLegacySet,this.world.hybrid,cx,cz)
        :protectionNearby(upgraded?this.world.hybridLegacySet:this.world.hybridProtectedSet,cx,cz));
    let height=gen===TERRAIN_HYBRID
      ? hybridSurfaceHeight(this.simplex,p,this.world.type,x,z,this.nearbyCache.get(key))
      : gen===TERRAIN_V10 || gen===TERRAIN_V11 || gen===TERRAIN_V112
      ? advancedSurfaceHeight(this.simplex,p,this.world.type,x,z,this.world.chunkSize.height)
      : legacySurfaceHeight(this.simplex,p,this.world.type,x,z);
    let hydro=null;
    if(gen===TERRAIN_V11||gen===TERRAIN_V112||gen===TERRAIN_HYBRID_V112){
      const sampleHydro=gen===TERRAIN_V112?hydrologyColumnV112:hydrologyColumn;
      hydro=gen===TERRAIN_HYBRID_V112
        ?hybridHydrologyColumn(this.simplex,p,this.world.type,x,z,this.nearbyCache.get(key))
        :sampleHydro(this.simplex,p,this.world.type,x,z,p.seed,
          (sx,sz)=>advancedSurfaceHeight(this.simplex,p,this.world.type,sx,sz,this.world.chunkSize.height),height);
      height=hydro.height;
    }
    const naturalWater=height<=p.terrain.waterOffset;
    const water=naturalWater||hydro?.waterY!==null&&hydro?.waterY!==undefined;
    const naturalIce=(gen===TERRAIN_V112||gen===TERRAIN_HYBRID_V112&&hydro?.mix>=.88)&&this.world.type==='snow'&&naturalWater&&
      freezeColumn(this.world.type,p.seed,x,z,p.terrain.waterOffset,'lake');
    return {height,biome,water,waterY:hydro?.waterY??(naturalWater?p.terrain.waterOffset:null),
      waterKind:hydro?.ice||naturalIce?'frozen':hydro?.kind??(naturalWater?(this.world.type==='lava'?'lava':'sea'):null),
      waterBank:hydro?.bank??false,stableWater:!!hydro?.stable&&hydro?.waterY!==null,
      waterSource:!!hydro?.source};
  }
  color(x,z){
    const {height,biome,water,waterKind,waterBank,waterSource}=this.sample(x,z);
    if(waterSource&&typeof window!=='undefined'&&
      /(?:\?|&)waterDebug(?:=1|(?=&|$))/.test(window.location?.search||''))return '#123975';
    if(this.world.type==='lava')return water?'#f2632c':height>11?'#61565b':'#3d454c';
    if(water)return waterKind==='frozen'?'#b2d9e3':waterKind==='oasis'?'#41ada9':this.world.type==='ocean'?'#2679aa':'#2e83a4';
    if(waterBank)return this.world.type==='snow'?'#9faeb2':'#c9ae72';
    if(height<=this.world.params.terrain.waterOffset+1)return '#d2be83';
    const base=biome==='Desert'?[210,183,113]:biome==='Tundra'?[215,224,227]:biome==='Jungle'?[47,120,68]:[82,152,83];
    const shade=Math.max(-22,Math.min(22,(height-8)*2));
    return `rgb(${base.map(c=>Math.min(255,Math.max(0,c+shade))).join(',')})`;
  }
}
