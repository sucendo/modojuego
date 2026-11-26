// Water occupies exactly one voxel horizontally. Natural river water is a
// full voxel; player-triggered flow uses the same eight levels as its solver.
export const WATER_MIN_VISIBLE_VOLUME = .025;
export const WATER_MAX_LAYERS = 24;
const WATER_BLOCKERS = new Set([1,2,3,4,5,8,10,14,15,16,17,18,19,26,27]);
export const isWaterBlockingBlock = id => WATER_BLOCKERS.has(id);

/** A bridge or roof ABOVE a natural stream must not erase its water. Only a
 * solid occupying its actual top water voxel dams the source. The bed-height
 * fallback also supports older synthetic worlds without block lookup. */
export function sourceWaterBlocked(cell, originalBed, currentBed, blockAt = null) {
  const water = voxelWaterColumn(cell, originalBed);
  if (!water) return true;
  if (typeof blockAt === 'function') {
    const topVoxelY = Math.ceil(water.top - .5);
    return WATER_BLOCKERS.has(blockAt(topVoxelY));
  }
  return Number.isFinite(currentBed) && currentBed >= water.top - .01;
}

export function voxelWaterColumn(cell, bed) {
  if (!cell || !Number.isFinite(cell.y)) return null;
  // Finite spans already carry their physical floor. The terrain hydraulic
  // bed can remain far below a suspended aqueduct or another stacked span.
  const physicalBed = cell.finite&&Number.isFinite(cell.bed)?cell.bed:Number.isFinite(bed)
    ? bed : (Number.isFinite(cell.bed) ? cell.bed :
      cell.y + .25 - (Number(cell.depth) || 0));
  if (!Number.isFinite(physicalBed)) return null;
  // Solid blocks are centered on integer Y; their top lies on Y + 0.5.
  const bottom = Math.round(physicalBed - .5) + .5;
  const actualDepth = Math.max(0, Number.isFinite(cell.depth)
    ? cell.depth : cell.y + .25 - physicalBed);
  const minimum=cell.finite?.001:WATER_MIN_VISIBLE_VOLUME;
  if (actualDepth <= minimum) return null;
  // Natural river channels have a *single* full water block, including in
  // legacy worlds with an over-deep procedural trough. A reservoir may stack
  // blocks when its pressure truly rises after a player edits the landscape.
  const maxLayers = cell.kind === 'river' && !cell.dynamic ? 1 : WATER_MAX_LAYERS;
  if(cell.dynamic){
    // Follow the actual stored volume. Rounding to eighths used to make a
    // filling reservoir jump between terraces and overstate shallow puddles.
    const renderedDepth=Math.min(cell.finite?256:WATER_MAX_LAYERS,actualDepth);
    if(renderedDepth<=minimum)return null;
    return {kind:cell.kind,bottom,top:bottom+renderedDepth,layers:Math.ceil(renderedDepth)};
  }
  const layers = Math.max(1, Math.min(maxLayers, Math.ceil(actualDepth - 1e-8)));
  return { kind: cell.kind, bottom, top: bottom + layers, layers };
}

export function exposedVoxelSide(here, next, bankBed, cascade=false) {
  if (!here) return null;
  // Higher adjacent liquid covers this face; it owns the shared step.
  if (next && next.top >= here.top - 1e-7) return null;
  // Older saves still classify a vertical step as a waterfall. Only the
  // explicit `cascade` flag lets the face extend below its own voxel.
  const waterfall=!!next&&(here.top-next.top>=1.05||cascade&&here.top-next.top>.05);
  const obstacle = next ? next.top : Number.isFinite(bankBed) ? bankBed : here.bottom;
  // New catchments: the exposed face of a waterfall reaches the LOWER
  // connected stream. It is a vertical, batched quad (no sloping geometry,
  // no physical water created in the air, and no changes to old saves).
  const bottom = waterfall&&cascade ? next.top : Math.max(here.bottom, obstacle);
  return here.top > bottom + 1e-7 ? { top: here.top, bottom,
    waterfall } : null;
}

/** Natural river direction is supplied by the terrain generator. A tall
 * waterfall face may only bridge two wet, downstream-connected columns.
 * Crossing a channel sideways must never create a curtain down a cliff. */
export function isDownstreamWaterfallEdge(cell,neighbor,dx,dz){
  if(cell?.finite&&neighbor&&cell.fallEdges)return (cell.fallEdges[dx>0?0:dx<0?1:dz>0?2:3]||0)>1e-7;
  if(!cell||!neighbor||(cell.dynamic&&!cell.fallRate)||(cell.kind!=='river'&&!cell.finite)||
    !['river','lake','oasis'].includes(neighbor.kind))return false;
  const fx=Number(cell.flowX)||0,fz=Number(cell.flowZ)||0;
  if(!Number.isFinite(fx)||!Number.isFinite(fz))return false;
  // Declared natural waterfall reaches can descend on both grid axes.
  // Preserve the legacy dominant-axis guard for unmarked river banks.
  if(cell.waterfall)return dx!==0?fx*dx>1e-7:fz*dz>1e-7;
  if(dx!==0)return fx*dx>0&&Math.abs(fx)>=Math.abs(fz);
  return fz*dz>0&&Math.abs(fz)>=Math.abs(fx);
}

/** Greedy rectangles make a coplanar lake one continuous top surface instead
 * of thousands of individually triangulated, transparently shaded squares.
 * `cells` contains {kind,top,sourceDebug} or null, in row-major order. */
export function mergeCoplanarWaterSurfaces(size,cells){
  const used=new Uint8Array(size*size),quads=[];
  const compatible=(a,b)=>!!b&&a.kind===b.kind&&
    Math.abs(a.top-b.top)<1e-6&&!!a.sourceDebug===!!b.sourceDebug&&a.flowKey===b.flowKey;
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
    const i=z*size+x,first=cells[i];
    if(!first||used[i])continue;
    let width=1,depth=1;
    while(x+width<size&&!used[i+width]&&compatible(first,cells[i+width]))width++;
    rows:while(z+depth<size){
      for(let xx=0;xx<width;xx++){
        const p=(z+depth)*size+x+xx;
        if(used[p]||!compatible(first,cells[p]))break rows;
      }
      depth++;
    }
    for(let zz=0;zz<depth;zz++)for(let xx=0;xx<width;xx++)
      used[(z+zz)*size+x+xx]=1;
    quads.push({x,z,width,depth,top:first.top,kind:first.kind,
      sourceDebug:!!first.sourceDebug});
  }
  return quads;
}
