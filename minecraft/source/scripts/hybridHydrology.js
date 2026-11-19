// v11.2.1: immutable upgrade of explored worlds to v11.2 hydrology.
// Only unvisited chunks use the new generator; a 96-block transition joins
// their original, versioned landscape without rewriting protected chunks.
import { advancedSurfaceHeight, V10_HEIGHT } from './terrainV10.js';
import { TERRAIN_HYBRID, HYBRID_BLEND_BLOCKS, chunkKey, legacySurfaceHeight, hybridSurfaceHeight,
  protectionNearby, transitionWeight } from './hybridTerrain.js';
import { TERRAIN_V11, hydrologyColumn } from './hydrology.js';
import { TERRAIN_V112, hydrologyColumnV112 } from './hydrologyV112.js';
import { hydrologyColumnV1134 } from './hydrologyV1134.js';
import { hydrographyColumnV1140 } from './hydrographyV1140.js';
import { hydrographyColumnV1141 } from './hydrographyV1141.js';
import { hydrographyColumnV1142 } from './hydrographyV1142.js';

export const TERRAIN_HYBRID_V112=6;
export const HYBRID_V112_SOURCES=Object.freeze([1,2,TERRAIN_HYBRID,TERRAIN_V11,TERRAIN_V112]);

export function validateHydrologyHybrid(raw,version,invalid=()=>{throw new Error('invalidFile');}) {
  if(version!==TERRAIN_HYBRID_V112)return null;
  if(!raw || !HYBRID_V112_SOURCES.includes(raw.sourceVersion) ||
    raw.blendBlocks!==HYBRID_BLEND_BLOCKS || !Array.isArray(raw.protectedChunks) ||
    raw.protectedChunks.length<1 || raw.protectedChunks.length>25000)return invalid();
  const coord=/^-?\d+,-?\d+$/;
  const check=values=>{
    const set=new Set();
    for(const k of values){
      if(typeof k!=='string'||!coord.test(k)||set.has(k))return invalid();
      const [x,z]=k.split(',').map(Number);
      if(!Number.isSafeInteger(x)||!Number.isSafeInteger(z)||Math.abs(x)>100000||Math.abs(z)>100000)return invalid();
      set.add(k);
    }
    return [...set];
  };
  const protectedChunks=check(raw.protectedChunks);
  if(raw.sourceVersion!==TERRAIN_HYBRID && raw.legacyChunks!==undefined)return invalid();
  if(raw.hydrographyVersion!==undefined&&![1,2,3].includes(raw.hydrographyVersion))return invalid();
  const legacyChunks=raw.sourceVersion===TERRAIN_HYBRID && Array.isArray(raw.legacyChunks)
    ? check(raw.legacyChunks):null;
  const protectedSet=new Set(protectedChunks);
  if(raw.sourceVersion===TERRAIN_HYBRID && (!legacyChunks?.length ||
    legacyChunks.some(k=>!protectedSet.has(k))))return invalid();
  // If a v11.4.0 player explored new land, its exact v1 generator must stay
  // available after later upgrades. A chunk cannot simply revert to its
  // much older v11.2 sourceVersion when newly marked as protected.
  const hasV1=raw.hydrographyV1Chunks!==undefined||raw.hydrographyV1BaseChunks!==undefined;
  if(hasV1&&(raw.hydrographyVersion<2||
    !Array.isArray(raw.hydrographyV1Chunks)||!Array.isArray(raw.hydrographyV1BaseChunks)))return invalid();
  const v1Chunks=hasV1?check(raw.hydrographyV1Chunks):null;
  const v1Base=hasV1?check(raw.hydrographyV1BaseChunks):null;
  const hasV2=raw.hydrographyV2Chunks!==undefined||raw.hydrographyV2BaseChunks!==undefined;
  if(hasV2&&(raw.hydrographyVersion!==3||
    !Array.isArray(raw.hydrographyV2Chunks)||!Array.isArray(raw.hydrographyV2BaseChunks)))return invalid();
  const v2Chunks=hasV2?check(raw.hydrographyV2Chunks):null;
  const v2Base=hasV2?check(raw.hydrographyV2BaseChunks):null;
  const v1Set=new Set(v1Chunks||[]),v1BaseSet=new Set(v1Base||[]);
  const v2Set=new Set(v2Chunks||[]),v2BaseSet=new Set(v2Base||[]);
  if(hasV1&&(v1Chunks.some(k=>!protectedSet.has(k))||
    v1Base.some(k=>!protectedSet.has(k))||
    v1Chunks.some(k=>v1BaseSet.has(k))||
    raw.sourceVersion===TERRAIN_HYBRID&&legacyChunks.some(k=>!v1BaseSet.has(k))))return invalid();
  if(hasV2&&(v2Chunks.some(k=>!protectedSet.has(k)||v1Set.has(k)||v2BaseSet.has(k))||
    v2Base.some(k=>!protectedSet.has(k))||
    hasV1&&(v1Chunks.some(k=>!v2BaseSet.has(k))||v1Base.some(k=>!v2BaseSet.has(k)))||
    raw.sourceVersion===TERRAIN_HYBRID&&legacyChunks.some(k=>!v2BaseSet.has(k))))return invalid();
  return {sourceVersion:raw.sourceVersion,protectedChunks,blendBlocks:HYBRID_BLEND_BLOCKS,
    ...(legacyChunks?{legacyChunks}:{}),
    ...(raw.hydrographyVersion?{hydrographyVersion:raw.hydrographyVersion}:{}),
    ...(hasV1?{hydrographyV1Chunks:v1Chunks,hydrographyV1BaseChunks:v1Base}:{}),
    ...(hasV2?{hydrographyV2Chunks:v2Chunks,hydrographyV2BaseChunks:v2Base}:{})};
}

/** Returns the exact old chunk generator; v10.1 had two different old modes. */
export function sourceGenerator(hybrid,cx,cz,oldLegacySet=new Set(),v1Set=null,v2Set=null) {
  const key=chunkKey(cx,cz);
  if(v1Set?v1Set.has(key):hybrid.hydrographyV1Chunks?.includes(key))return TERRAIN_HYBRID_V112;
  if(v2Set?v2Set.has(key):hybrid.hydrographyV2Chunks?.includes(key))return TERRAIN_HYBRID_V112;
  if(hybrid.sourceVersion!==TERRAIN_HYBRID)return hybrid.sourceVersion;
  return oldLegacySet.has(key)?1:TERRAIN_HYBRID;
}

export function makeHybridContext(protectedSet,legacySet,hybrid,cx,cz) {
  const v1=hybrid.hydrographyVersion>=2&&
    hybrid.hydrographyV1Chunks?.includes(chunkKey(cx,cz));
  const v2=!v1&&hybrid.hydrographyVersion===3&&
    hybrid.hydrographyV2Chunks?.includes(chunkKey(cx,cz));
  const activeProtected=v1?new Set(hybrid.hydrographyV1BaseChunks):
    v2?new Set(hybrid.hydrographyV2BaseChunks):protectedSet;
  return {hybrid:v1?{...hybrid,hydrographyVersion:1}:
    v2?{...hybrid,hydrographyVersion:2}:hybrid,
    protectedNear:protectionNearby(activeProtected,cx,cz),
    legacyNear:hybrid.sourceVersion===TERRAIN_HYBRID?protectionNearby(legacySet,cx,cz):null,
    protectedSet:activeProtected,legacySet};
}

function originalColumn(simplex,params,type,wx,wz,context) {
  const source=context.hybrid.sourceVersion;
  const advanced=(x,z)=>advancedSurfaceHeight(simplex,params,type,x,z,V10_HEIGHT);
  if(source===1)return {height:legacySurfaceHeight(simplex,params,type,wx,wz),waterY:null};
  if(source===2)return {height:advanced(wx,wz),waterY:null};
  if(source===TERRAIN_HYBRID)return {height:hybridSurfaceHeight(simplex,params,type,wx,wz,context.legacyNear),waterY:null};
  return source===TERRAIN_V112
    ? hydrologyColumnV112(simplex,params,type,wx,wz,params.seed,advanced)
    : hydrologyColumn(simplex,params,type,wx,wz,params.seed,advanced);
}

/** Shared by actual chunks, remote waterfall boundary sampling and the map. */
export function hybridHydrologyColumn(simplex,params,type,wx,wz,context) {
  const generator=type==='lava'?hydrologyColumnV1134:
    context.hybrid.hydrographyVersion===3?hydrographyColumnV1142:
    context.hybrid.hydrographyVersion===2?hydrographyColumnV1141:
    context.hybrid.hydrographyVersion===1?hydrographyColumnV1140:hydrologyColumnV1134;
  const mix=transitionWeight(wx,wz,context.protectedNear);
  if(mix>=1)return {...generator(simplex,params,type,wx,wz,params.seed,
    (x,z)=>advancedSurfaceHeight(simplex,params,type,x,z,V10_HEIGHT)),mix};
  const old=originalColumn(simplex,params,type,wx,wz,context);
  if(mix===0)return {...old,kind:old.kind??null,bank:old.bank??false,ice:false,mix};
  const advanced=(x,z)=>advancedSurfaceHeight(simplex,params,type,x,z,V10_HEIGHT);
  const next=generator(simplex,params,type,wx,wz,params.seed,advanced);
  // Only introduce a new river when the terrain has already made room for it.
  // Existing v11 rivers are kept continuous across the old/new boundary.
  const keepOldWater=[TERRAIN_V11,TERRAIN_V112].includes(context.hybrid.sourceVersion)&&old.waterY!==null;
  const newWater=next.waterY!==null && mix>=.78;
  let waterY=null,kind=null,ice=false;
  if(keepOldWater && next.waterY!==null){
    waterY=old.waterY+(next.waterY-old.waterY)*mix;
    kind=next.kind;
    ice=next.ice && mix>=.88;
  }else if(keepOldWater && mix<.78){
    waterY=old.waterY;kind=old.kind;
  }else if(newWater){waterY=next.waterY;kind=next.kind;ice=next.ice;}
  const height=Math.round(old.height+(next.height-old.height)*mix);
  // A new liquid plane cannot occupy the solid bank of a preserved world.
  // Keep the old relief authoritative until the hybrid riverbed is open.
  if(waterY!==null&&height+.5>=waterY){waterY=null;kind=null;ice=false;}
  return {height,waterY,kind,ice,bank:mix>.5&&next.bank,mix,
    stable:next.stable&&mix>=.95,source:next.source&&mix>=.95,
    flowX:next.flowX??0,flowZ:next.flowZ??0};
}
