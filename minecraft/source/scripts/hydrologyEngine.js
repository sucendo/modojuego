import { BasinHydrology } from './basinHydrology.js';
import { needsWaterMeshRefresh } from './waterGeometry.js';
import { voxelWaterColumn, sourceWaterBlocked, isWaterBlockingBlock } from './waterVoxelsV1134.js';
import { hydraulicCeiling } from './hydraulicColumnV1147.js';
import { stepPressureV1147, PRESSURE_STEP, PRESSURE_LIMIT, PRESSURE_MIN, pressureKey } from './pressureHydrologyV1147.js';
import { WaterEnvironment } from './waterEnvironment.js';

/**
 * v11.3 — conservative local hydrology. All volumes are in block³ and all
 * rates in block³ / simulation second. Moving between columns or into an
 * aquifer NEVER creates or destroys water. Only explicitly declared sources,
 * atmosphere and the boundary of the simulated area change the total.
 *
 * Natural rivers in the v11.4 generator are pre-settled and do not enter the
 * active simulation just because the player approaches. Legacy chunks retain
 * their saved behavior; an actual block edit activates nearby liquid. Unloaded
 * cells are CLOSED boundaries: water never vanishes into ungenerated land.
 */
export const HYDROLOGY_SCHEMA = 2;
export const HYDROLOGY_LIMIT = 8192;
const STEP = .5;
const MAX_STEPS_PER_FRAME = 2;
const RADIUS = 11;
const MAX_DEPTH = 24;
const OBSERVE_RADIUS = 14;
const OBSERVE_INTERVAL = 2;
const OBSERVE_MOVE = 5;
const FRONTIER_RADIUS = 34;
const FRONTIER_BUDGET = 160;
const NEIGHBORS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
// Event-driven water: springs and lakes are reservoirs, river REACHES are not.
// A river reach must remain connected to an upstream inlet after a dam edit.
const FLOW_RADIUS = 64;
const FLOW_LEVELS = 8;
const FLOW_BUDGET = 25000;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const key = (x, z) => `${x},${z}`;

export const SOIL = Object.freeze({
  // permeability in water-column blocks / second, capacity in block³ / m²
  gravel: { permeability: .018, capacity: 2.4, conductivity: .06 },
  sand: { permeability: .011, capacity: 1.8, conductivity: .04 },
  dirt: { permeability: .003, capacity: 1.25, conductivity: .017 },
  clay: { permeability: .00015, capacity: .8, conductivity: .001 },
  rock: { permeability: .0002, capacity: .45, conductivity: .0015 },
  impermeable: { permeability: 0, capacity: 0, conductivity: 0 }
});

/** The geological profile is inferred from existing block ids. */
export function soilForBlock(id) {
  if (id === 8) return 'sand';
  if ([1, 2, 10, 14].includes(id)) return 'dirt';
  if ([3, 4, 5, 19, 20].includes(id)) return 'rock';
  if ([15, 16, 17, 18, 26, 27, 28].includes(id)) return 'impermeable';
  return 'dirt';
}

function hash(x, z, seed) {
  let h = Math.imul(x | 0, 0x45d9f3b) ^ Math.imul(z | 0, 0x27d4eb2d) ^ (seed | 0);
  h = Math.imul(h ^ h >>> 16, 0x7feb352d);
  h = Math.imul(h ^ h >>> 15, 0x846ca68b);
  return (h ^ h >>> 16) >>> 0;
}

/** Rare deterministic springs are real inputs; river segments are NOT sources. */
export function springRate(seed, x, z, kind) {
  if (kind !== 'river' && kind !== 'lake' && kind !== 'oasis') return 0;
  const tx=Math.floor(x / 16),tz=Math.floor(z / 16);
  const h=hash(tx,tz,seed);
  return h % 4 === 0 && x===tx*16+((h>>>8)&15) && z===tz*16+((h>>>16)&15)
    ? .006+(h%5)*.001:0;
}

/** Enumerating spring *points* by terrain tiles is cheap on the map. A river
 * passing a spring does not itself create any water at later segments. */
export function springSites(seed,minX,minZ,maxX,maxZ,waterAt){
  const result=[];
  for(let tx=Math.floor(minX/16);tx<=Math.floor(maxX/16);tx++)
    for(let tz=Math.floor(minZ/16);tz<=Math.floor(maxZ/16);tz++){
      const h=hash(tx,tz,seed);
      if(h%4!==0)continue;
      const x=tx*16+((h>>>8)&15),z=tz*16+((h>>>16)&15);
      if(x<minX||x>maxX||z<minZ||z>maxZ)continue;
      const kind=waterAt(x,z);
      const rate=springRate(seed,x,z,kind);
      if(rate>0)result.push({x,z,rate});
    }
  return result;
}

function liveSpringRate(world,x,z,kind){
  const cxz=`${Math.floor(x/32)},${Math.floor(z/32)}`;
  if(world?.hybrid?.hydrographyVersion>=1&&
      (!world.hybridProtectedSet?.has(cxz)||world.hybridV1Set?.has(cxz)||world.hybridV2Set?.has(cxz))){
    // The procedural network has ONE deterministic source cell. It is not
    // physically correct to invent extra springs every 16 river blocks.
    const chunk=world.getChunk?.(Math.floor(x/32),Math.floor(z/32));
    const column=chunk?.waterColumns?.[(((z%32)+32)%32)*32+(((x%32)+32)%32)];
    return column?.source ? .012 : 0;
  }
  return springRate(world?.params?.seed??0,x,z,kind);
}

function sampleHead(cell) { return cell.bed + cell.water; }
function waterKind(cell) { return cell.kind === 'lake' || cell.kind === 'oasis' ? cell.kind : 'river'; }

export class HydrologyEngine {
  constructor(world = null) {
    this.world = world;
    this.cells = new Map();
    this.flowCells = new Map();
    this.suppressedNatural = new Set();
    this.pressureVolumes = new Map();
    this.pressureInlets = new Map();
    this.pressureDrains = new Map();
    this.pressureElapsed = 0;
    this.pressureVisualElapsed = 0;
    this.pressureDirtyChunks = new Set();
    this.accumulator = 0;
    this.visualElapsed = 0;
    this.changedChunks = new Set();
    this.observeElapsed = 0;
    this.lastObserve = null;
    this.editActivity = 0;
    this.onChange = () => {};
    this.environment = new WaterEnvironment(world,()=>this.onChange());
    this.basins = new BasinHydrology(this);
    this.ledger = { initial: 0, springs: 0, boundaryIn: 0, boundaryOut: 0, evaporation: 0 };
  }

  clear() {
    this.environment.clear();
    this.basins.clear();
    this.cells.clear();this.changedChunks.clear();this.accumulator = 0;
    this.flowCells.clear();
    this.suppressedNatural.clear();
    this.pressureVolumes.clear();
    this.pressureInlets.clear();
    this.pressureDrains.clear();
    this.pressureElapsed=0;
    this.pressureVisualElapsed=0;
    this.pressureDirtyChunks.clear();
    this.visualElapsed = 0;
    this.observeElapsed = 0;
    this.lastObserve = null;
    this.editActivity = 0;
    this.ledger = { initial: 0, springs: 0, boundaryIn: 0, boundaryOut: 0, evaporation: 0 };
  }

  /** A synthetic water column is also accepted for unit tests. */
  insert(x, z, { bed, water = 0, groundwater = 0, material = 'dirt', kind = 'river', sourceRate = 0, frozen = false } = {}) {
    if (this.cells.size >= HYDROLOGY_LIMIT || this.cells.has(key(x, z))) return this.cells.get(key(x, z));
    const cell = { x, z, bed, water: clamp(water, 0, MAX_DEPTH), groundwater: Math.max(0, groundwater),
      material: SOIL[material] ? material : 'dirt', kind, sourceRate: Math.max(0, sourceRate), frozen: !!frozen };
    this.cells.set(key(x, z), cell);
    this.ledger.initial += cell.water + cell.groundwater;
    return cell;
  }

  total() { let n = 0; for (const c of this.cells.values()) n += c.water + c.groundwater; return n; }

  /** Conservation includes explicit exchange with the *unsimulated* world. */
  balanceError() {
    const l = this.ledger;
    return this.total() - (l.initial + l.springs + l.boundaryIn - l.boundaryOut - l.evaporation);
  }

  /** Cells outside the active domain are a boundary condition, not a source
   * magically attached to every river tile. The caller supplies a bed and a
   * fixed head; boundary exchange is always accounted for in the ledger. */
  step(dt = STEP, boundary = () => null, evaporationRate = .00002) {
    dt = clamp(Number(dt) || 0, 0, STEP);
    if (!dt || !this.cells.size) return false;
    const waterDelta = new Map(), groundDelta = new Map(), waterSpent = new Map(), groundSpent = new Map();
    const add = (map, cell, amount) => map.set(cell, (map.get(cell) || 0) + amount);
    let changed = false;
    for (const cell of this.cells.values()) {
      if(cell.pending)continue;
      const soil = SOIL[cell.material];
      if (cell.sourceRate > 0) {
        const addition = cell.sourceRate * dt;
        add(waterDelta, cell, addition);
        this.ledger.springs += addition;
        changed = true;
      }
      if (cell.water > 0 && !cell.frozen) {
        // Infiltration stores water underground, never discards it. A saturated
        // layer takes no more water until groundwater has drained elsewhere.
        const infiltrated = Math.min(cell.water * .7, soil.permeability * dt,
          Math.max(0, soil.capacity - cell.groundwater));
        if (infiltrated > 0) {
          add(waterDelta, cell, -infiltrated);add(groundDelta, cell, infiltrated);
          waterSpent.set(cell, infiltrated); changed = true;
        }
        // Evaporation is atmospheric loss, not a soil sink.
        const evaporated = Math.min(Math.max(0, cell.water - infiltrated), evaporationRate * dt);
        if (evaporated > 0) {
          add(waterDelta, cell, -evaporated);
          waterSpent.set(cell, infiltrated + evaporated);
          this.ledger.evaporation += evaporated;changed = true;
        }
      }
      // A pressurized, full aquifer can emerge at the surface as a spring.
      if (soil.capacity && cell.groundwater > soil.capacity * .94 && !cell.frozen) {
        const amount = Math.min(cell.groundwater - soil.capacity * .9, .004 * dt);
        if (amount > 0) {
          add(groundDelta, cell, -amount);add(waterDelta, cell, amount);
          groundSpent.set(cell, amount);changed = true;
        }
      }
    }

    const internalTransfers = [];
    // Evaluate each internal edge once. The standalone solver still supports
    // explicit boundary reservoirs; the live world does not expose unloaded
    // terrain as a sink, and instead activates nearby loaded columns.
    for (const cell of this.cells.values()) {
      if(cell.pending)continue;
      for (const [dx, dz] of NEIGHBORS) {
        const nx = cell.x + dx, nz = cell.z + dz;
        const other = this.cells.get(key(nx, nz));
        if (other && (dx < 0 || dz < 0)) continue;
        if (other?.pending) continue;
        const external = !other ? boundary(nx, nz) : null;
        if (!other && !external) continue; // impermeable/unloaded boundary
        const neighbor = other || external;
        const lhs = sampleHead(cell), rhs = sampleHead(neighbor);
        const donor = lhs > rhs ? cell : neighbor;
        const receiver = lhs > rhs ? neighbor : cell;
        const diff = Math.abs(lhs - rhs);
        if (diff > .002 && !donor.frozen && !receiver.frozen && donor.water > 0 && lhs !== rhs) {
          // An elevated solid block at the receiving cell acts as a levee;
          // water may pass only once its free surface clears that block.
          const clearance = sampleHead(donor) - receiver.bed;
          if (clearance > .001) {
            // Horizontal pressure equalizes a pool, while a steep fall
            // accelerates the transfer. Do not move more than a donor owns.
            const requested = Math.min(1.3 * dt * Math.sqrt(diff),
              clearance * .95 * dt, MAX_DEPTH * .32 * dt);
            // A column never drains completely in a single half-second tick;
            // this avoids a disappearing upper lip while a waterfall forms.
            // Allocate outgoing water across ALL edges together. Otherwise
            // the first edge visited receives almost everything; water seemed
            // to turn sharply left/right instead of spreading downhill.
            if (other) {
              internalTransfers.push({ donor, receiver, requested });
            } else {
              const available = donor === cell
                ? Math.max(0, donor.water * .7 - (waterSpent.get(donor) || 0)) : requested;
              const moved = Math.min(requested, available);
              if (moved <= 0) continue;
              if (donor === cell) {
                add(waterDelta, cell, -moved);
                waterSpent.set(cell, (waterSpent.get(cell) || 0) + moved);
                this.ledger.boundaryOut += moved;
              } else {
                add(waterDelta, cell, moved);
                this.ledger.boundaryIn += moved;
              }
              changed = true;
            }
          }
        }
        if (!other) continue;
        const soilA = SOIL[cell.material], soilB = SOIL[other.material];
        if (!soilA.capacity || !soilB.capacity) continue;
        const headA = cell.bed - 3 + 3 * (cell.groundwater / soilA.capacity);
        const headB = other.bed - 3 + 3 * (other.groundwater / soilB.capacity);
        const from = headA > headB ? cell : other;
        const to = headA > headB ? other : cell;
        const cap = SOIL[to.material].capacity;
        const move = Math.min(Math.max(0, from.groundwater - (groundSpent.get(from) || 0)),
          Math.max(0, cap - to.groundwater - (groundDelta.get(to) || 0)),
          Math.min(soilA.conductivity, soilB.conductivity) * Math.abs(headA - headB) * dt);
        if (move > 0) {
          add(groundDelta, from, -move);add(groundDelta, to, move);
          groundSpent.set(from, (groundSpent.get(from) || 0) + move);
          changed = true;
        }
      }
    }

    const totalRequests = new Map();
    for (const { donor, requested } of internalTransfers)
      totalRequests.set(donor, (totalRequests.get(donor) || 0) + requested);
    const donorScales = new Map();
    for (const [donor, requested] of totalRequests) {
      const available = Math.max(0, donor.water * .7 - (waterSpent.get(donor) || 0));
      donorScales.set(donor, requested > 0 ? Math.min(1, available / requested) : 0);
    }
    for (const { donor, receiver, requested } of internalTransfers) {
      const moved = requested * donorScales.get(donor);
      if (moved <= 0) continue;
      add(waterDelta, donor, -moved);
      add(waterDelta, receiver, moved);
      changed = true;
    }

    for (const cell of this.cells.values()) {
      if(cell.pending)continue;
      const before = cell.water;
      const next = Math.max(0, cell.water + (waterDelta.get(cell) || 0));
      // Explicit exported overflow at the local solver's safety boundary.
      // Prevents unbounded heights/saves in a closed pocket fed indefinitely.
      if (next > MAX_DEPTH) this.ledger.boundaryOut += next - MAX_DEPTH;
      cell.water = Math.min(MAX_DEPTH, next);
      cell.groundwater = Math.max(0, cell.groundwater + (groundDelta.get(cell) || 0));
      if (Math.abs(before - cell.water) > .0001) this.changedChunks.add(`${Math.floor(cell.x / 32)},${Math.floor(cell.z / 32)}`);
    }
    if (changed) this.onChange();
    return changed;
  }

  /** Read the topmost solid in the old water's vicinity. Higher blocks divert
   * the water; breaking them lowers the local effective riverbed. */
  sample(world, x, z) {
    const chunk = world.getChunk(Math.floor(x / 32), Math.floor(z / 32));
    if (!chunk?.loaded || !chunk.waterColumns) return null;
    const ix = ((x % 32) + 32) % 32, iz = ((z % 32) + 32) % 32;
    const water = chunk.waterColumns[iz * 32 + ix];
    const original = this.cells.get(key(x, z));
    // CRITICAL: topmost solid != riverbed. A trunk, bridge or roof above a
    // wet column used to raise its simulated bed several blocks *on approach*
    // and make the whole body of water surge up into the trees. The chunk
    // tracks actual terrain/constructed banks, excluding trees and foliage.
    const knownBed = chunk.hydrologyGround?.[iz * 32 + ix];
    let top = Number.isFinite(knownBed) ? Math.floor(knownBed - .5) : -1;
    if (!Number.isFinite(knownBed)) {
      const waterSurface = water ? water.y + .25 : Infinity;
      const ceiling = Math.min(world.chunkSize.height - 2,
        Math.max(chunk.maxFilledY ?? 0, Math.ceil(original?.bed ?? 0) + 2));
      for (let iy = ceiling; iy >= 0; iy--) {
        const block = chunk.getBlockId(ix, iy, iz);
        if (iy + .5 <= waterSurface + .01 &&
            [1,2,3,4,5,8,10,14,15,16,17,18,19,26,27].includes(block)) {
          top = iy;break;
        }
      }
    }
    const bed = top + .5;
    // If the player covered the river with a block, that column must not
    // reappear as a tall liquid tower above the obstruction.
    const unobstructed = !!water && bed < water.y + .24;
    const id = top >= 0 ? chunk.getBlockId(ix, top, iz) : 0;
    const volume = unobstructed ? Math.max(0, water.depth + .25) : 0;
    // Natural rivers are one water voxel deep. Old terrain versions had
    // visually deep channels; importing their old depth into the solver made
    // a sudden oversized flood whenever those columns became active.
    return { bed, water: water?.kind === 'river' ? Math.min(1, volume) : volume,
      kind: waterKind(water || original || { kind: 'river' }),
      material: soilForBlock(id), frozen: unobstructed && chunk.getBlockId(ix,Math.ceil(water.y+.25),iz) === 28 };
  }

  /** Activate a loaded column with the exact water that was already present.
   * There are no artificial inflows: newly observed initial volumes enter the
   * conservation ledger, while already simulated columns are never reset. */
  activateColumn(x, z) {
    const existing = this.cells.get(key(x, z));
    if (existing) return existing;
    if (this.cells.size >= HYDROLOGY_LIMIT) return null;
    const s = this.sample(this.world, x, z);
    if (!s) return null;
    const cell = this.insert(x, z, {
      ...s, sourceRate: liveSpringRate(this.world,x,z,s.water > 0 ? s.kind : null)
    });
    if (cell) this.changedChunks.add(`${Math.floor(x / 32)},${Math.floor(z / 32)}`);
    return cell;
  }

  /** Pre-settled v11.4 channels are frozen in their generated equilibrium.
   * Exploring them may load meshes, but it must NOT trigger hydrodynamics. */
  observePlayer(position) {
    if (!position || !this.world || this.world.type === 'lava') return 0;
    // Migration preserves previously explored terrain, but it must never
    // activate its old simulation again merely because the player approaches.
    if(this.world.hybrid?.hydrographyVersion>=1)return 0;
    const cx = Math.floor(position.x), cz = Math.floor(position.z);
    const wet = [];
    for (let dz = -OBSERVE_RADIUS; dz <= OBSERVE_RADIUS; dz++) {
      for (let dx = -OBSERVE_RADIUS; dx <= OBSERVE_RADIUS; dx++) {
        if (dx * dx + dz * dz > OBSERVE_RADIUS * OBSERVE_RADIUS) continue;
        const x = cx + dx, z = cz + dz;
        const chunk = this.world.getChunk(Math.floor(x / 32), Math.floor(z / 32));
        if (!chunk?.loaded || !chunk.waterColumns) continue;
        const ix = ((x % 32) + 32) % 32, iz = ((z % 32) + 32) % 32;
        const column=chunk.waterColumns[iz * 32 + ix];
        if(column?.stable&&!this.cells.has(key(x,z)))continue;
        if (column || this.cells.get(key(x, z))?.water > .025) wet.push([x, z]);
      }
    }
    let inserted = 0;
    for (const [x, z] of wet) {
      if (this.cells.size >= HYDROLOGY_LIMIT) break;
      if (!this.cells.has(key(x, z)) && this.activateColumn(x, z)) inserted++;
      for (const [dx, dz] of NEIGHBORS) {
        const nx = x + dx, nz = z + dz;
        if (this.cells.size >= HYDROLOGY_LIMIT) break;
        const neighborChunk=this.world.getChunk(Math.floor(nx/32),Math.floor(nz/32));
        const neighbor=neighborChunk?.waterColumns?.[(((nz%32)+32)%32)*32+(((nx%32)+32)%32)];
        if(neighbor?.stable&&!this.cells.has(key(nx,nz)))continue;
        if (!this.cells.has(key(nx, nz)) && this.activateColumn(nx, nz)) inserted++;
      }
    }
    if (inserted) this.onChange();
    return inserted;
  }

  /** Give liquid a new downhill destination before each integration step.
   * Works across already loaded 32x32 chunks. No loaded recipient is left as
   * an invisible boundary outflow, including at a river's natural bank. */
  expandFrontier(position = null) {
    if (!this.world || this.world.type === 'lava') return 0;
    let inserted = 0;
    const candidates = [...this.cells.values()];
    const px = Number.isFinite(position?.x) ? position.x : null;
    const pz = Number.isFinite(position?.z) ? position.z : null;
    for (const cell of candidates) {
      if (inserted >= FRONTIER_BUDGET || this.cells.size >= HYDROLOGY_LIMIT) break;
      if (cell.pending || cell.frozen || cell.water <= .025) continue;
      if (px !== null && (Math.abs(cell.x - px) > FRONTIER_RADIUS ||
        Math.abs(cell.z - pz) > FRONTIER_RADIUS)) continue;
      for (const [dx, dz] of NEIGHBORS) {
        const x = cell.x + dx, z = cell.z + dz;
        if (this.cells.has(key(x, z))) continue;
        if (this.activateColumn(x, z)) inserted++;
        if (inserted >= FRONTIER_BUDGET || this.cells.size >= HYDROLOGY_LIMIT) break;
      }
    }
    if (inserted) this.onChange();
    return inserted;
  }

  onBlockEdit(x, y, z) {
    if(!this.basins.ownsColumn(x,z))this.environment.invalidate(x,z);
    const world = this.world;
    if (!world || world.type === 'lava') return;
    const editedChunk=world.getChunk?.(Math.floor(x/32),Math.floor(z/32));
    editedChunk?.hydraulicCeilings?.delete((((z%32)+32)%32)*32+(((x%32)+32)%32));
    if (world.hybrid?.hydrographyVersion >= 1) {
      if(this.basins.supported()){this.basins.edit(x,y,z);return;}
      this.updateSourceFlow(x, z);
      this.updatePressureInlets(x,z);
      return;
    }
    const at = this.cells.get(key(x, z));
    let nearWater = !!at;
    if (!nearWater) for (let dx = -2; dx <= 2 && !nearWater; dx++) for (let dz = -2; dz <= 2; dz++) {
      const sample = this.sample(world, x + dx, z + dz);
      if (sample?.water > .2) { nearWater = true; break; }
    }
    if (!nearWater) return;
    this.editActivity=30; // only real terrain edits wake local fluid physics
    let inserted = 0;
    for (let dx = -RADIUS; dx <= RADIUS; dx++) for (let dz = -RADIUS; dz <= RADIUS; dz++) {
      if (this.cells.size >= HYDROLOGY_LIMIT) break;
      const cx = x + dx, cz = z + dz;
      if (this.cells.has(key(cx, cz))) continue;
      const s = this.sample(world, cx, cz);
      if (!s) continue;
      this.insert(cx, cz, { ...s, sourceRate: liveSpringRate(world,cx,cz,s.water ? s.kind : null) });
      inserted++;
    }
    const cell = this.cells.get(key(x, z));
    if (cell) {
      const s = this.sample(world, x, z);
      if (s) { cell.bed = s.bed;cell.material = s.material;cell.frozen = s.frozen; }
    }
    if (inserted || cell) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) for (let dz = -RADIUS; dz <= RADIUS; dz++)
        this.changedChunks.add(`${Math.floor((x + dx) / 32)},${Math.floor((z + dz) / 32)}`);
      this.flushVisuals();this.onChange();
    }
  }

  /** The generator describes the original river geometry. Only true springs
   * and standing lakes remain reservoirs when a player changes the channel. */
  naturalColumn(x, z) {
    const chunk = this.world?.getChunk(Math.floor(x / 32), Math.floor(z / 32));
    if (!chunk?.loaded || !chunk.waterColumns) return null;
    if (!chunk.naturalWaterColumns) chunk.naturalWaterColumns = chunk.waterColumns.map(c => c ? { ...c } : null);
    const ix = ((x % 32) + 32) % 32, iz = ((z % 32) + 32) % 32;
    const index = iz * 32 + ix;
    const bed = chunk.hydrologyGround?.[index];
    if (!Number.isFinite(bed)) return null;
    const initialBed=chunk.naturalWaterGround?.[index];
    const original = chunk.naturalWaterColumns[index];
    const voxel = voxelWaterColumn(original, initialBed ?? bed);
    const blockAt = chunk.getBlockId ? (y => chunk.getBlockId(ix,y,iz)) : null;
    return { chunk, index, bed, original, top: voxel?.top ?? -Infinity,
      // A natural dry bank is not a new spillway. Only an excavation in the
      // actual surface creates an opening from the permanent reservoir.
      excavated: !original&&Number.isFinite(initialBed)&&bed<initialBed-.01,
      // A player-built solid occupying the source surface can dam this cell.
      open: !!voxel && !sourceWaterBlocked(original,
        initialBed ?? bed, bed, blockAt) };
  }

  /** Rebuild the connected stream around an edit, including optional bypasses
   * through excavated banks. Natural reaches downstream of an obstruction dry
   * up; their stable levels are restored if the player opens a new route. */
  updateSourceFlow(x, z) {
    const domain = new Map();
    const radius = FLOW_RADIUS;
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      const wx = x + dx, wz = z + dz;
      const sample = this.naturalColumn(wx, wz);
      if (sample) domain.set(key(wx, wz), { ...sample, x: wx, z: wz });
    }
    if (!domain.size) return;
    const queue = [], best = new Map();
    let nearWater = false;
    const isInlet = c => {
      const fx = Number(c.original?.flowX) || 0, fz = Number(c.original?.flowZ) || 0;
      // Older river saves have no flow direction. Treat their boundary as a
      // reservoir rather than accidentally draining an entire old river.
      if (!fx && !fz) return true;
      if ((c.x === x - radius && fx > 0) ||
        (c.x === x + radius && fx < 0) ||
        (c.z === z - radius && fz > 0) ||
        (c.z === z + radius && fz < 0)) return true;
      // The player's loaded terrain may end *inside* the requested radius.
      // A river entering from an unloaded upstream chunk is still an inlet.
      const length=Math.hypot(fx,fz);
      return NEIGHBORS.some(([dx,dz])=>
        fx*dx+fz*dz < -.2*length && !domain.has(key(c.x+dx,c.z+dz)));
    };
    for (const cell of domain.values()) {
      if (cell.original && Math.abs(cell.x - x) <= 2 && Math.abs(cell.z - z) <= 2)
        nearWater = true;
      if (!cell.original || !cell.open) continue;
      if (cell.original.kind === 'river' && !cell.original.source &&
        !isInlet(cell)) continue;
      const seed = { x: cell.x, z: cell.z, top: cell.top,
        level: FLOW_LEVELS, kind: cell.original.kind, source: true,
        flowX: cell.original.flowX || 0, flowZ: cell.original.flowZ || 0 };
      queue.push(seed);
      best.set(key(seed.x, seed.z), seed);
    }
    if (!nearWater && ![...this.flowCells.values()].some(c =>
      Math.abs(c.x - x) <= 2 && Math.abs(c.z - z) <= 2)) return;

    let processed = 0;
    for (let i = 0; i < queue.length && processed < FLOW_BUDGET; i++, processed++) {
      const current = queue[i];
      if (best.get(key(current.x, current.z)) !== current) continue;
      for (const [dx, dz] of NEIGHBORS) {
        const nx = current.x + dx, nz = current.z + dz;
        const neighbor = domain.get(key(nx, nz));
        if (!neighbor) continue;
        if (neighbor.original && !neighbor.open) continue; // a dammed source is solid
        if (neighbor.original && neighbor.open) {
          const fx = Number(current.flowX) || 0, fz = Number(current.flowZ) || 0;
          // Propagate sideways within the channel, but not backwards against
          // the flow. Without this, the downstream boundary feeds the dam.
          if ((fx || fz) && fx*dx+fz*dz < -.15*Math.hypot(fx,fz)) continue;
          if (neighbor.top > current.top + 1.01 || neighbor.bed >= current.top - .02) continue;
          const nk = key(nx,nz);
          if (best.has(nk)) continue;
          const next = { x:nx, z:nz, top:neighbor.top, level:FLOW_LEVELS,
            kind:neighbor.original.kind, source:true,
            flowX:neighbor.original.flowX || 0, flowZ:neighbor.original.flowZ || 0 };
          best.set(nk,next);
          queue.push(next);
          continue;
        }
        // A single edit must not flood every low, previously dry bank in the
        // surrounding 19x19 area. Water first enters an excavated outlet;
        // only then may it spread onto adjacent dry ground.
        if(current.source&&!neighbor.excavated)continue;
        if (neighbor.bed >= current.top - .02) continue; // no uphill water
        const fall = current.top - (neighbor.bed + 1) >= .75;
        const level = fall ? FLOW_LEVELS : Math.min(current.level - 1,
          Math.floor((current.top - neighbor.bed + .0001) * FLOW_LEVELS));
        if (level <= 0) continue;
        const top = neighbor.bed + level / FLOW_LEVELS;
        const old = best.get(key(nx, nz));
        if (old && old.top >= top - .0001) continue;
        const next = { x: nx, z: nz, top, level, kind: current.kind,
          source: false, flowX:dx, flowZ:dz };
        best.set(key(nx, nz), next);
        queue.push(next);
      }
    }

    const affected = new Set();
    for (const cell of domain.values()) {
      const k = key(cell.x, cell.z);
      const next = best.get(k);
      const previous = this.flowCells.get(k);
      if (cell.original?.kind === 'river') {
        const wasSuppressed = this.suppressedNatural.has(k);
        const shouldSuppress = cell.open && !next;
        if (shouldSuppress) this.suppressedNatural.add(k);
        else this.suppressedNatural.delete(k);
        if (wasSuppressed !== shouldSuppress)
          affected.add(`${Math.floor(cell.x/32)},${Math.floor(cell.z/32)}`);
      }
      if (next && !next.source && (!cell.original || !cell.open)) {
        const depth = next.level / FLOW_LEVELS;
        const flow = { x: cell.x, z: cell.z, y: next.top - .25,
          bed: cell.bed, depth, kind: next.kind, dynamic: true,
          flowing: true, stable: false, source: false };
        if (!previous || Math.abs(previous.y-flow.y)>.0001 || previous.kind!==flow.kind)
          affected.add(`${Math.floor(cell.x/32)},${Math.floor(cell.z/32)}`);
        this.flowCells.set(k, flow);
      } else if (previous) {
        this.flowCells.delete(k);
        affected.add(`${Math.floor(cell.x/32)},${Math.floor(cell.z/32)}`);
      }
    }
    // Even if no new flow was generated, placing a block may cover (or
    // uncover) a natural source. Include the edited chunk and neighbors.
    affected.add(`${Math.floor(x/32)},${Math.floor(z/32)}`);
    const touched = [...affected];
    for (const id of touched) {
      const [cx, cz] = id.split(',').map(Number);
      const chunk = this.world.getChunk(cx, cz);
      if (chunk?.loaded) this.applySourceChunk(chunk);
    }
    this.onChange();
  }

  applySourceChunk(chunk,forceMesh=false) {
    if (!chunk.loaded || !chunk.waterColumns || !chunk.hydrologyGround) return;
    if (!chunk.naturalWaterColumns) chunk.naturalWaterColumns = chunk.waterColumns.map(c => c ? { ...c } : null);
    let changed = false;
    for (let z = 0; z < 32; z++) for (let x = 0; x < 32; x++) {
      const index = z * 32 + x, wx = chunk.position.x + x, wz = chunk.position.z + z;
      if(this.basins.ownsColumn(wx,wz))continue;
      const natural = chunk.naturalWaterColumns[index], bed = chunk.hydrologyGround[index];
      const originalBed = chunk.naturalWaterGround?.[index] ?? bed;
      const blockAt = chunk.getBlockId ? (y => chunk.getBlockId(x,y,z)) : null;
      const permanent = natural && !this.suppressedNatural.has(key(wx,wz)) &&
        !sourceWaterBlocked(natural,originalBed,bed,blockAt) ? natural : null;
      const flow = this.flowCells.get(key(wx, wz));
      let next = permanent || (flow && bed < flow.bed + flow.depth - .01 &&
        Math.abs(bed - flow.bed) < .001 ? flow : null);
      const extra=this.pressureVolumes.get(key(wx,wz))||0;
      if(extra>PRESSURE_MIN){
        const baseline=voxelWaterColumn(next,bed)?.top ?? bed;
        const physicalCeiling=this.pressureSample(wx,wz)?.ceiling ?? Infinity;
        const depth=Math.min(24,Math.max(0,Math.min(baseline+extra,physicalCeiling)-bed));
        if(depth>PRESSURE_MIN){
          next={y:bed+depth-.25,bed,depth,kind:next?.kind||natural?.kind||'river',
            dynamic:true,flowing:true,stable:false,source:false};
        }
      }
      if (needsWaterMeshRefresh(chunk.waterColumns[index], next)) changed = true;
      chunk.waterColumns[index] = next;
    }
    if (changed||forceMesh) {
      this.basins.meshQueue.add(chunk);
      // Adjacent chunk faces depend on our water level as well.
      for (const [dx, dz] of [...NEIGHBORS,[1,1],[-1,1],[1,-1],[-1,-1]]) {
        const neighbor = this.world.getChunk(chunk.position.x / 32 + dx, chunk.position.z / 32 + dz);
        if (neighbor?.loaded) this.basins.meshQueue.add(neighbor);
      }
    }
  }

  /** A dam gets ONE inlet from its real upstream river cells. This is an
   * explicit finite supply, not an infinite source for every stream tile. */
  updatePressureInlets(x,z){
    for(let dz=-12;dz<=12;dz++)for(let dx=-12;dx<=12;dx++){
      const wx=x+dx,wz=z+dz,k=key(wx,wz),dam=this.naturalColumn(wx,wz);
      if(!dam?.original || dam.original.kind!=='river' || dam.open){
        this.pressureInlets.delete(k);this.pressureDrains.delete(k);continue;
      }
      const upstream=[];
      for(const [sx,sz] of NEIGHBORS){
        const u=this.naturalColumn(wx+sx,wz+sz);
        if(!u?.original || !u.open || this.suppressedNatural.has(key(wx+sx,wz+sz)))continue;
        const fx=Number(u.original.flowX)||0,fz=Number(u.original.flowZ)||0;
        if(u.original.kind==='river'&&(fx||fz) &&
          fx*(-sx)+fz*(-sz)<.18*Math.hypot(fx,fz))continue;
        upstream.push({x:wx+sx,z:wz+sz});
      }
      if(!upstream.length){
        this.pressureInlets.delete(k);this.pressureDrains.delete(k);continue;
      }
      const headLimit=Math.max(dam.bed+.9,
        ...upstream.map(p=>(this.naturalColumn(p.x,p.z)?.top||dam.top)+1));
      this.pressureInlets.set(k,{damX:wx,damZ:wz,upstream,rate:.85,headLimit});
      this.pressureDrains.delete(k);
      const fx=Number(dam.original.flowX)||0,fz=Number(dam.original.flowZ)||0;
      const downstream=NEIGHBORS.map(([sx,sz])=>({x:wx+sx,z:wz+sz,
        score:fx*sx+fz*sz})).sort((a,b)=>b.score-a.score)
        .find(p=>p.score>0&&this.naturalColumn(p.x,p.z)?.open);
      if(downstream)this.pressureDrains.set(k,{x:downstream.x,z:downstream.z,rate:1.2});
    }
  }

  pressureSample(x,z){
    if(this.basins.ownsColumn(x,z))return null;
    const c=this.naturalColumn(x,z);
    if(!c)return null;
    const k=key(x,z);
    const naturalActive=c.original&&c.open&&!this.suppressedNatural.has(k);
    const oldFlow=this.flowCells.get(k);
    const flowActive=oldFlow&&Math.abs(oldFlow.bed-c.bed)<.001;
    const baseTop=naturalActive?c.top:
      flowActive?(voxelWaterColumn(oldFlow,c.bed)?.top??c.bed):c.bed;
    const safeBaseTop=Math.max(c.bed,baseTop);
    const ix=c.index%32,iz=Math.floor(c.index/32);
    const ceilings=c.chunk.hydraulicCeilings??(c.chunk.hydraulicCeilings=new Map());
    let roof=ceilings.get(c.index);
    if(roof===undefined){
      roof=c.chunk.getBlockId?hydraulicCeiling(c.bed,
        y=>isWaterBlockingBlock(c.chunk.getBlockId(ix,y,iz)),c.chunk.size?.height??128):Infinity;
      ceilings.set(c.index,roof);
    }
    const material=c.chunk.getBlockId
      ?soilForBlock(c.chunk.getBlockId(ix,Math.max(0,Math.round(c.bed-.5)),iz)):'dirt';
    return {bed:c.bed,baseTop:safeBaseTop,ceiling:roof,
      capacity:Number.isFinite(roof)?Math.max(0,roof-safeBaseTop):12,
      roofed:Number.isFinite(roof),permeability:SOIL[material].permeability,
      // Procedural ocean/lowland water has no spring or stable lake flag.
      // It absorbs local excess without raising the world's global sea level.
      oceanSink:!!c.original&&c.original.kind==='lake'&&
        !c.original.stable&&!c.original.source,
      dammed:!!c.original&&!c.open};
  }

  /** Limit processing to edited water, with paired volume exchanges. No
   * terrain edits -> no pressure solver and no additional frame cost. */
  updatePressure(dt){
    if(!this.pressureInlets.size&&!this.pressureVolumes.size&&!this.pressureDirtyChunks.size){
      this.pressureDrains.clear();return;
    }
    this.pressureElapsed=Math.min(1,this.pressureElapsed+Math.max(0,dt));
    let steps=0;
    while(this.pressureElapsed>=PRESSURE_STEP&&steps<2){
      const cache=new Map();
      const sample=(x,z)=>{
        const k=pressureKey(x,z);
        if(!cache.has(k))cache.set(k,this.pressureSample(x,z));
        return cache.get(k);
      };
      const before=this.pressureVolumes;
      const update=stepPressureV1147(before,this.pressureInlets.values(),sample,
        PRESSURE_STEP,this.pressureDrains.values(),
        {evaporationRate:.0001,infiltrationScale:.4,deepDrainRate:.003});
      this.pressureVolumes=update.volumes;
      for(const k of new Set([...before.keys(),...this.pressureVolumes.keys()])){
        if(Math.abs((before.get(k)||0)-(this.pressureVolumes.get(k)||0))<.00001)continue;
        const [x,z]=k.split(',').map(Number);
        this.pressureDirtyChunks.add(`${Math.floor(x/32)},${Math.floor(z/32)}`);
      }
      this.pressureElapsed-=PRESSURE_STEP;
      steps++;
    }
    this.pressureVisualElapsed+=dt;
    if(this.pressureVisualElapsed>=.15&&this.pressureDirtyChunks.size){
      for(const k of this.pressureDirtyChunks){
        const [cx,cz]=k.split(',').map(Number);
        const chunk=this.world.getChunk(cx,cz);
        if(chunk?.loaded)this.applySourceChunk(chunk,true);
      }
      this.pressureDirtyChunks.clear();
      this.pressureVisualElapsed=0;
      this.onChange();
    }
  }

  /** A not-yet-simulated column is temporarily closed. Once its chunk is
   * loaded it is joined by expandFrontier, preserving actual water volume. */
  boundary(x, z) {
    return null;
  }

  update(dt, playerPosition = null) {
    if (!this.world || this.world.type === 'lava') return;
    this.basins.update(dt,playerPosition);
    const settledWorld=this.world.hybrid?.hydrographyVersion>=1;
    if(settledWorld){this.updatePressure(dt);return;}
    if(settledWorld&&this.editActivity<=0)return;
    if(settledWorld)this.editActivity=Math.max(0,this.editActivity-Math.max(0,dt));
    // Legacy water can activate on approach. New rivers are settled when the
    // world is generated, so walking into view cannot cause fresh flooding.
    this.observeElapsed += Math.max(0, Number(dt) || 0);
    if (playerPosition && Number.isFinite(playerPosition.x) && Number.isFinite(playerPosition.z)) {
      const x = Math.floor(playerPosition.x), z = Math.floor(playerPosition.z);
      const moved = !this.lastObserve || Math.hypot(x-this.lastObserve.x,z-this.lastObserve.z)>=OBSERVE_MOVE;
      if(moved || this.observeElapsed>=OBSERVE_INTERVAL) {
        this.observePlayer(playerPosition);
        this.lastObserve = {x,z};
        this.observeElapsed = 0;
      }
    }
    if (!this.cells.size) return;
    this.accumulator = Math.min(1.5, this.accumulator + Math.max(0, dt));
    let steps = 0;
    while (this.accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
      this.expandFrontier(playerPosition);
      this.step(STEP, (x, z) => this.boundary(x, z));
      this.accumulator -= STEP;steps++;
    }
    this.visualElapsed += dt;
    if (this.visualElapsed >= .15 && this.changedChunks.size) {
      this.visualElapsed = 0;this.flushVisuals();
    }
  }

  applyChunk(chunk,deferMesh=false) {
    if (!chunk.loaded || !chunk.waterColumns) return;
    const x0 = chunk.position.x,z0 = chunk.position.z;
    const visual = chunk.hydrologyVisualState ?? (chunk.hydrologyVisualState = new Map());
    let changed = false;
    for (let z = 0; z < 32; z++) for (let x = 0; x < 32; x++) {
      const cell = this.cells.get(key(x0 + x, z0 + z));
      if (!cell) continue;
      const depth = cell.water;
      const index = z * 32 + x;
      // Compare against the LAST DISPLAYED water, not the last solver tick.
      // This prevents full-chunk geometry rebuilds for imperceptible changes.
      if (!visual.has(index)) visual.set(index, chunk.waterColumns[index] ? { ...chunk.waterColumns[index] } : null);
      const next = depth > .025
        ? { y: cell.bed + depth - .25, depth, bed:cell.bed,
            kind: waterKind(cell),dynamic:true } : null;
      if (needsWaterMeshRefresh(visual.get(index), next)) changed = true;
      chunk.waterColumns[index] = next;
    }
    if (changed) {
      if(!deferMesh)chunk.refreshWater();
      for (const [index] of visual) {
        const rendered = chunk.waterColumns[index];
        visual.set(index, rendered ? { ...rendered } : null);
      }
    }
    return changed;
  }

  flushVisuals() {
    if (!this.world) return;
    const keys = [...this.changedChunks];
    this.changedChunks.clear();
    const refresh=new Set();
    for (const k of keys) {
      const [cx, cz] = k.split(',').map(Number);
      const chunk = this.world.getChunk(cx, cz);
      if(chunk?.loaded&&this.applyChunk(chunk,true)){
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
          const other=this.world.getChunk(cx+dx,cz+dz);if(other?.loaded)refresh.add(other);
        }
      }
    }
    // Publish all levels before rebuilding shared boundary vertices.
    for(const chunk of refresh)this.basins.meshQueue.add(chunk);
  }

  springsNear(minX, minZ, maxX, maxZ) {
    const result = [];
    for (const cell of this.cells.values()) {
      if (cell.sourceRate > 0 && cell.x >= minX && cell.x <= maxX && cell.z >= minZ && cell.z <= maxZ)
        result.push({ x: cell.x, z: cell.z, rate: cell.sourceRate });
    }
    return result.slice(0, 48);
  }

  snapshot() {
    const environment=this.environment.snapshot();
    if (this.world?.hybrid?.hydrographyVersion >= 1)
      return { version: HYDROLOGY_SCHEMA, cells: [], environment,
        ...(this.basins.columns.size||this.basins.restored.size?{basins:this.basins.snapshot()}:{}),
        suppressed: [...this.suppressedNatural].slice(0, HYDROLOGY_LIMIT)
          .map(k => k.split(',').map(Number)),
        pressure:[...this.pressureVolumes].slice(0,PRESSURE_LIMIT)
          .map(([k,v])=>[...k.split(',').map(Number),v]),
        pressureInlets:[...this.pressureInlets.values()].slice(0,512)
          .map(c=>[c.damX,c.damZ,c.rate,c.headLimit,
            c.upstream.map(p=>[p.x,p.z])]),
        pressureDrains:[...this.pressureDrains].slice(0,512)
          .map(([damKey,c])=>[...damKey.split(',').map(Number),c.x,c.z,c.rate]),
        flows: [...this.flowCells.values()].slice(0, HYDROLOGY_LIMIT)
          .map(c => [c.x, c.z, +c.y.toFixed(3), c.depth, c.kind]) };
    return { version: HYDROLOGY_SCHEMA, environment,
      cells: [...this.cells.values()].map(c => [c.x, c.z, +c.water.toFixed(6), +c.groundwater.toFixed(6), c.material, c.kind]) };
  }

  restore(snapshot = null) {
    this.clear();
    if (!snapshot || !Array.isArray(snapshot.cells)) return;
    this.environment.restore(snapshot.environment);
    this.basins.restore(snapshot.basins);
    if (this.world?.hybrid?.hydrographyVersion >= 1) {
      // Old conservative cells were transient and could contain the water
      // depletion bug. Player structures and natural rivers are not reset.
      for (const [x, z, y, depth, kind] of snapshot.flows || []) {
        this.flowCells.set(key(x, z), { x, z, y, depth,
          bed: y + .25 - depth, kind, dynamic: true, flowing: true,
          stable: false, source: false });
      }
      for (const [x,z] of snapshot.suppressed || [])
        if (Number.isInteger(x) && Number.isInteger(z)) this.suppressedNatural.add(key(x,z));
      for(const [x,z,v] of snapshot.pressure||[])
        if(Number.isInteger(x)&&Number.isInteger(z)&&Number.isFinite(v)&&v>0)
          this.pressureVolumes.set(key(x,z),v);
      for(const [damX,damZ,rate,headLimit,upstream] of snapshot.pressureInlets||[])
        this.pressureInlets.set(key(damX,damZ),{damX,damZ,rate,headLimit,
          upstream:upstream.map(([x,z])=>({x,z}))});
      for(const [damX,damZ,x,z,rate] of snapshot.pressureDrains||[])
        this.pressureDrains.set(key(damX,damZ),{x,z,rate});
      return;
    }
    // v1 saved the spontaneously activated, overfilled rivers from 11.3.3.
    // Replaying those volumes recreates high water towers even after repairing
    // the generator. Reset ONLY that temporary liquid simulation; the saved
    // solid blocks, buildings and explored footprint remain untouched.
    if (snapshot.version !== HYDROLOGY_SCHEMA) return;
    for (const [x, z, water, groundwater, material, kind] of snapshot.cells) {
      const cell = this.insert(x, z, { bed: 0, water, groundwater, material, kind,
        sourceRate: springRate(this.world?.params.seed ?? 0, x, z, kind) });
      if(cell)cell.pending = true;
    }
    this.changedChunks = new Set([...this.cells.values()].map(c => `${Math.floor(c.x / 32)},${Math.floor(c.z / 32)}`));
  }

  reconcileChunk(chunk) {
    if (!chunk.loaded) return;
    if (this.world?.hybrid?.hydrographyVersion >= 1) {
      this.basins.reconcileChunk(chunk);
      this.applySourceChunk(chunk);
      // Old edited canals and reservoirs must adopt finite volumes on load,
      // rather than retaining their permanent eight-level slope until edited.
      if(this.basins.supported()){
        const seeds=[...this.flowCells.values()].map(c=>[c.x,c.z])
          .concat([...this.pressureVolumes.keys()].map(k=>k.split(',').map(Number)));
        const width=this.world.chunkSize.width;
        for(const [x,z] of seeds)if(!this.basins.ownsColumn(x,z)&&
          Math.floor(x/width)===chunk.position.x/width&&Math.floor(z/width)===chunk.position.z/width)
          this.basins.edit(x,0,z);
      }
      return;
    }
    // A save stores only water/groundwater; solid blocks remain authoritative.
    for (let z = 0; z < 32; z++) for (let x = 0; x < 32; x++) {
      const cell = this.cells.get(key(chunk.position.x + x, chunk.position.z + z));
      if (!cell) continue;
      const s = this.sample(this.world, cell.x, cell.z);
      if (s) {cell.bed = s.bed;cell.material = s.material;cell.pending = false;
        cell.sourceRate=liveSpringRate(this.world,cell.x,cell.z,s.water?s.kind:null);}
    }
    this.applyChunk(chunk);
  }
}
