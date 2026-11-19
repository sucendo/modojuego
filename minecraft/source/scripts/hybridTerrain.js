// v10.1: immutable, versioned hybrid world boundaries. Functions here are
// independent from Three.js and can be tested without rendering or DOM.
import { advancedSurfaceHeight, LEGACY_HEIGHT, V10_HEIGHT, clamp } from './terrainV10.js';
import { terrainHeight } from './worldTypes.js';

export const TERRAIN_HYBRID = 3;
export const HYBRID_BLEND_BLOCKS = 96; // Three chunks of gradual relief.
export const MAX_LEGACY_CHUNKS = 25000;
const CHUNK_WIDTH = 32;
const CHUNK_KEY = /^(-?\d+),(-?\d+)$/;
const MAX_COORD = 100000;
const bad = () => { throw new Error('invalidFile'); };

export const chunkKey = (x,z) => `${x},${z}`;
export const coordinateChunk = (coord) => Math.floor(coord/CHUNK_WIDTH);

/** Freeze already known original chunks. Newly visited areas never join this
 * set after migration, so the same coordinates never change generator. */
export function collectProtectedChunks({ explored=[], blocks={}, stations={}, markers=[], player=null,
  visible=[], spawn=null }={}) {
  const found = new Set();
  const add=(cx,cz)=>{
    if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cz)||Math.abs(cx)>MAX_COORD||Math.abs(cz)>MAX_COORD) return;
    found.add(chunkKey(cx,cz));
    if(found.size>MAX_LEGACY_CHUNKS)throw new Error('legacyChunkLimit');
  };
  const near=(p,radius=1)=>{
    if(!p || !Number.isFinite(p[0]) || !Number.isFinite(p[2]))return;
    const x=coordinateChunk(p[0]),z=coordinateChunk(p[2]);
    for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)add(x+dx,z+dz);
  };
  for(const k of explored){
    if(typeof k!=='string'||!CHUNK_KEY.test(k))continue;
    const [cx,cz]=k.split(',').map(Number);add(cx,cz);
  }
  for(const k of Object.keys(blocks)){
    const parts=k.split(',');if(parts.length===5)add(Number(parts[0]),Number(parts[1]));
  }
  for(const k of Object.keys(stations)){
    const parts=k.split(',').map(Number);
    if(parts.length===3)near([parts[0],parts[1],parts[2]],0);
  }
  for(const marker of markers)near([marker.x,0,marker.z],1);
  near(player,2);near(spawn,2);
  for(const k of visible){
    if(typeof k!=='string'||!CHUNK_KEY.test(k))continue;
    const [cx,cz]=k.split(',').map(Number);add(cx,cz);
  }
  return [...found].sort((a,b)=>{
    const [ax,az]=a.split(',').map(Number),[bx,bz]=b.split(',').map(Number);
    return ax-bx||az-bz;
  });
}

export function validateHybrid(raw, terrainVersion, invalid=bad) {
  if(terrainVersion!==TERRAIN_HYBRID) {
    if(raw!==undefined && raw!==null) return invalid();
    return null;
  }
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Array.isArray(raw.legacyChunks)||
    raw.legacyChunks.length===0||raw.legacyChunks.length>MAX_LEGACY_CHUNKS||
    raw.blendBlocks!==HYBRID_BLEND_BLOCKS)return invalid();
  const set=new Set();
  for(const key of raw.legacyChunks){
    if(typeof key!=='string'||!CHUNK_KEY.test(key)||set.has(key))return invalid();
    const [cx,cz]=key.split(',').map(Number);
    if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cz)||Math.abs(cx)>MAX_COORD||Math.abs(cz)>MAX_COORD)return invalid();
    set.add(key);
  }
  return {legacyChunks:[...set],blendBlocks:HYBRID_BLEND_BLOCKS};
}

/** Only protected chunks render the original terrain. */
export function generatorForChunk(version, protectedSet, cx,cz){
  if(version!==TERRAIN_HYBRID)return version;
  return protectedSet.has(chunkKey(cx,cz))?1:TERRAIN_HYBRID;
}

/** Find nearby frozen chunks once per new chunk, not for every voxel. */
export function protectionNearby(protectedSet, cx,cz) {
  const limit=Math.ceil(HYBRID_BLEND_BLOCKS/CHUNK_WIDTH)+1;
  const rects=[];
  for(let dx=-limit;dx<=limit;dx++)for(let dz=-limit;dz<=limit;dz++){
    const x=cx+dx,z=cz+dz;
    if(protectedSet.has(chunkKey(x,z)))rects.push([x*CHUNK_WIDTH,z*CHUNK_WIDTH]);
  }
  return rects;
}
export function transitionWeight(wx,wz,nearby){
  if(!nearby?.length)return 1;
  let closest=Infinity;
  for(const [x,z] of nearby){
    const dx=Math.max(x-wx,0,wx-(x+CHUNK_WIDTH-1));
    const dz=Math.max(z-wz,0,wz-(z+CHUNK_WIDTH-1));
    const d=dx*dx+dz*dz;
    if(d<closest)closest=d;
  }
  // The first new column starts with exactly legacy heights. A smoothstep
  // across 96 blocks keeps the ridge slope continuous at either boundary.
  const t=clamp((Math.sqrt(closest)-1)/HYBRID_BLEND_BLOCKS,0,1);
  return t*t*(3-2*t);
}

/** Must use the exact original height equation to avoid a one-block cliff. */
export function legacySurfaceHeight(simplex,params,type,wx,wz){
  const t=params.terrain;
  const base=Math.floor(t.offset+t.magnitude*simplex.noise(wx/t.scale,wz/t.scale));
  const h=terrainHeight(type,base,wx,wz,t.waterOffset);
  return clamp(h,0,LEGACY_HEIGHT-(type==='classic'?1:2));
}

export function hybridSurfaceHeight(simplex,params,type,wx,wz,nearby){
  const weight=transitionWeight(wx,wz,nearby);
  if(weight===0)return legacySurfaceHeight(simplex,params,type,wx,wz);
  const newHeight=advancedSurfaceHeight(simplex,params,type,wx,wz,V10_HEIGHT);
  if(weight===1)return newHeight;
  const oldHeight=legacySurfaceHeight(simplex,params,type,wx,wz);
  return Math.round(oldHeight+(newHeight-oldHeight)*weight);
}
