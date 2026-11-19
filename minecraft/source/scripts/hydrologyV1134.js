// Unexplored terrain only: a river occupies one complete voxel vertically.
// Old protected v11.2/v11.3 chunks retain their original heights.
import { hydrologyColumnV112 } from './hydrologyV112.js';

export function hydrologyColumnV1134(simplex,params,type,wx,wz,seed=params.seed,surface=null,originalHeight=undefined){
  const old=hydrologyColumnV112(simplex,params,type,wx,wz,seed,surface,originalHeight);
  if(old.waterY===null)return old;
  if(old.kind==='river'){
    // Water top is precisely Y+.5; the solid floor is Y-.5, exactly one
    // complete 1x1x1 water block. No partial-height sheet can hover above it.
    const floor=Math.max(1,Math.min(75,Math.round(old.waterY-.25)-1));
    return {...old,height:floor,waterY:floor+1.25,ice:false};
  }
  // Still-water basins may be several blocks deep, but their top is also
  // aligned to the same voxel grid in every lake cell.
  const snappedY=Math.round(old.waterY-.25)+.25;
  return {...old,waterY:Math.max(old.height+1.25,snappedY)};
}
