// Traverse the world voxel grid instead of raycasting every InstancedMesh.
// Blocks are centred at integer coordinates, so grid boundaries are at +/-0.5.
export function pickVoxel(world, origin, direction, maxDistance = 7) {
  if (!origin || !direction || !Number.isFinite(maxDistance) || maxDistance <= 0) return null;
  const magnitude = Math.hypot(direction.x, direction.y, direction.z);
  if (!Number.isFinite(magnitude) || magnitude < 1e-9) return null;
  const d = [direction.x / magnitude, direction.y / magnitude, direction.z / magnitude];
  const p = [origin.x + .5, origin.y + .5, origin.z + .5];
  const cell = p.map(Math.floor);
  const step = d.map(n => Math.sign(n));
  const delta = d.map(n => n ? Math.abs(1 / n) : Infinity);
  const next = d.map((n,i) => n ? Math.max(0, ((n > 0 ? cell[i] + 1 : cell[i]) - p[i]) / n) : Infinity);
  let distance = 0;
  let face = {x:0,y:0,z:0};
  for (let i = 0; i < 128 && distance <= maxDistance; i++) {
    const id=typeof world.getBlockId === 'function' ? world.getBlockId(cell[0],cell[1],cell[2]) : world.getBlock(cell[0],cell[1],cell[2])?.id;
    if (id && id !== 0) {
      return {x:cell[0], y:cell[1], z:cell[2], id, normal:face, distance};
    }
    const axis = next[0] <= next[1] && next[0] <= next[2] ? 0 : next[1] <= next[2] ? 1 : 2;
    if (!Number.isFinite(next[axis]) || next[axis] > maxDistance) break;
    distance = next[axis];
    cell[axis] += step[axis];
    next[axis] += delta[axis];
    face = {x:0,y:0,z:0};
    face[['x','y','z'][axis]] = -step[axis];
  }
  return null;
}
export const adjacentCell = hit => hit && ({x:hit.x+hit.normal.x,y:hit.y+hit.normal.y,z:hit.z+hit.normal.z});
