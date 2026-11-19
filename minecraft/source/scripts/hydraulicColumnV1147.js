/**
 * The hydraulic bed is the continuous, supporting floor of a column.
 * An isolated block above it is a bridge/roof, NOT a new riverbed. All
 * arguments describe the block edit after the voxel array has been updated.
 */
export function hydraulicBedAfterEdit(bed, y, wasSolid, isSolid, solidAt, height = 128) {
  if (!Number.isFinite(bed) || !Number.isInteger(y) || wasSolid === isSolid)
    return bed;
  const oldTop = Math.round(bed - .5);
  if (isSolid) {
    // A suspended roof cannot raise the hydraulic floor. A completed wall
    // does, including contiguous blocks placed above it beforehand.
    if (y !== oldTop + 1) return bed;
    let top = y;
    while (top + 1 < height && solidAt(top + 1)) top++;
    return top + .5;
  }
  if (y > oldTop) return bed; // removing a roof must not lower the riverbed
  let top = y - 1;
  while (top >= 0 && !solidAt(top)) top--;
  return top + .5;
}

/** Lowest solid ceiling above the supporting riverbed, or Infinity outdoors.
 * A horizontal roof limits the height of free water but leaves room below it.
 * Search is bounded to the game's maximum local water depth. */
export function hydraulicCeiling(bed, solidAt, height = 128, maxLayers = 24) {
  if (!Number.isFinite(bed) || typeof solidAt !== 'function') return Infinity;
  const from = Math.max(0, Math.round(bed - .5) + 1);
  for (let y = from; y < Math.min(height, from + maxLayers); y++) {
    if (solidAt(y)) return y - .5;
  }
  return Infinity;
}
