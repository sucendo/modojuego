// v11.2 opt-in terrain generator. v11.0 (terrainVersion 4) stays unchanged.
// Only local, seeded samples: no fluid simulation and no cross-chunk state.
import {hydrologyColumn} from './hydrology.js';

export const TERRAIN_V112=5;
export const WATERFALL_DROP=1.05;
// A small difference between adjacent horizontal tiles needs a vertical
// riser so the water remains watertight, but it is NOT a waterfall.
export const WATER_STEP_FACE=.035;
// One complete voxel (1 x 1 x 1), anchored BELOW the actual water level.
export const ICE_THICKNESS=1;
const RIVER_TERRACE=1.55;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Coherent patches of surface ice; no single-block random snow confetti. */
export function freezeColumn(type,seed,wx,wz,waterY,kind){
  // Rivers carry moving water, including the approach to every waterfall.
  // Only still lake water (and calm sea columns) may freeze.
  if(kind===null||kind==='river'||kind==='lava'||type==='lava'||type==='desert'||type==='jungle')return false;
  const cold=type==='snow'?1:waterY>=45?.7:0;
  if(!cold)return false;
  const s=seed|0;
  const field=.46*Math.sin(wx*.115+s*.037)*Math.cos(wz*.092-s*.021)+
    .31*Math.sin((wx+wz)*.063+s*.071)+
    .23*Math.cos((wx-wz)*.083-s*.015);
  return field > (cold===1?-.26:.25);
}

/** The v11.2 riverbed is still v11 terrain; a terraced water line produces
 * bounded vertical drops where the terrain changes height.
 * Lakes remain level and may lie well above the world's base sea plane.
 */
export function hydrologyColumnV112(simplex,params,type,wx,wz,seed=params.seed,surface=null,originalHeight=undefined){
  const column=hydrologyColumn(simplex,params,type,wx,wz,seed,surface,originalHeight);
  if(column.waterY===null)return {...column,ice:false};
  let y=column.waterY;
  if(column.kind==='river'||column.kind==='lava'){
    const terraced=Math.round(y/RIVER_TERRACE)*RIVER_TERRACE;
    // The entire river cross-section must share one level. Tying the water
    // level to each bank's terrain height previously created crooked falls
    // and holes across the channel; the carved bed is already low enough.
    y=clamp(terraced,params.terrain.waterOffset+.55,68);
  }
  const kind=column.kind==='frozen'?'lake':column.kind;
  const ice=freezeColumn(type,seed,wx,wz,y,kind);
  return {...column,waterY:y,kind,ice};
}

/** One waterfall curtain only for the positive X/Z side of each wet cell.
 * Passing the adjacent chunk's deterministic sample avoids border gaps.
 * No additional draw calls: the triangles are appended to the water mesh.
 */
export function waterfallFaces(cells,width,neighborAt=()=>null){
  const faces=[];
  for(let z=0;z<width;z++)for(let x=0;x<width;x++){
    const a=cells[z*width+x];
    if(!a||!Number.isFinite(a.y))continue;
    for(let side=0;side<2;side++){
      const dx=side===0?1:0,dz=side===1?1:0;
      const nx=x+dx,nz=z+dz;
      const b=nx<width&&nz<width?cells[nz*width+nx]:neighborAt(nx,nz);
      if(!b||!Number.isFinite(b.y))continue;
      const drop=Math.abs(a.y-b.y);
      // Flat voxel surfaces require a small vertical face at every visible
      // height step, with a waterfall shader only for a genuine large drop.
      if(drop<WATER_STEP_FACE)continue;
      const high=a.y>b.y?a:b;
      faces.push({x,z,axis:dx?'x':'z',high:high.y,low:Math.min(a.y,b.y),
        // Even an inherited frozen lake can feed flowing, vertical water.
        kind:high.kind==='frozen'?'river':high.kind,
        drop,waterfall:drop>=WATERFALL_DROP});
    }
  }
  return faces;
}
