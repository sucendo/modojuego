// Water is voxel-shaped: every column is a full 1x1 horizontal tile.
// Never interpolate corner heights: that makes translucent twisted triangles.
export const SURFACE_SMOOTHING_DROP = 0;
export const WATER_VISUAL_EPSILON = .035;

export function waterCornerHeight(cell) {
  return cell?.y + .25;
}

export function exposedBankFace(cell, neighborBed) {
  const top = cell?.y + .25;
  if (!Number.isFinite(top) || !Number.isFinite(neighborBed)) return null;
  // A solid bank at or above the free surface hides the entire side of the
  // liquid. Drawing the old full-depth face produced enormous ghost walls.
  if (neighborBed >= top - .05) return null;
  const depth = Math.max(.25, Number(cell.depth || 0) + .25);
  // A visible edge is only the actual water column, not a wall extending
  // through the neighboring hillside or beneath the riverbed.
  const bottom = Math.max(neighborBed, top - depth);
  return top - bottom > .1 ? { top, bottom } : null;
}

export function needsWaterMeshRefresh(before, next, epsilon = WATER_VISUAL_EPSILON) {
  if (!before || !next) return !!before !== !!next;
  return before.kind !== next.kind ||
    Math.abs(before.y - next.y) >= epsilon ||
    Math.abs(before.depth - next.depth) >= epsilon;
}
