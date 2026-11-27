// Terrain generator v10. Pure functions: same coordinates + same seeded
// simplex field => identical landscape, including across chunk borders.
// Worlds saved before v10 retain the original generator (version 1).
import { terrainHeight } from './worldTypes.js';

export const V10_HEIGHT = 80;
export const LEGACY_HEIGHT = 32;
export const TERRAIN_V10 = 2;
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

const MOUNTAIN_STRENGTH = Object.freeze({
  classic: 1.05, snow: 1.38, jungle: .85,
  desert: .66, ocean: .57, lava: 1.22
});

/** Returns the surface block Y; can be used by the 3D chunks and 2D map. */
export function advancedSurfaceHeight(simplex, params, type, wx, wz, ceiling = V10_HEIGHT) {
  const {terrain} = params;
  const base = terrain.offset + terrain.magnitude * simplex.noise(wx/terrain.scale, wz/terrain.scale);
  // Low-frequency highlands, sharper crests, plus local rolling hills.
  const continent = .5 + .5 * simplex.noise((wx+163)/270, (wz-111)/270);
  const highland = clamp((continent-.36)/.44, 0, 1);
  const ridge = 1 - Math.abs(simplex.noise((wx-79)/87, (wz+113)/87));
  const foothills = simplex.noise((wx+27)/68, (wz-17)/68) * 3.5;
  const mountain = 32 * highland * highland * Math.pow(ridge,.85) * (MOUNTAIN_STRENGTH[type] ?? 1);
  const raw = Math.floor(base + foothills + mountain);
  const islandSafe = terrainHeight(type, raw, wx, wz, terrain.waterOffset);
  return clamp(islandSafe, 1, ceiling-9);
}

/** Deterministic connected underground tunnels and chambers, without
 * opening gaping pits throughout the surface or changing the lowest strata. */
export function isCave(simplex, wx, y, wz, surface) {
  if(y < 4 || y > surface) return false;
  if(y >= surface-2){
    // A few natural mouths open onto hillsides; keep the initial spawn clear.
    if(surface<12 || Math.hypot(wx-32,wz-32)<18 ||
       simplex.noise((wx+407)/82,(wz-223)/82)<.58) return false;
  }
  const tunnel = Math.abs(simplex.noise3d((wx+147)/24, (y-31)/17, (wz-83)/24));
  if (tunnel > .17) return false;
  const chamber = simplex.noise3d((wx-37)/43, (y+27)/29, (wz+73)/43);
  return chamber > -.05;
}

/** Per-column geology; avoid recalculating 2D noise for every underground cell. */
export function geologyColumn(simplex, wx, wz) {
  return {
    soilDepth:3+Math.floor((simplex.noise((wx+19)/47,(wz-71)/47)+1)*.75),
    deepLimit:17+Math.floor(simplex.noise((wx-45)/82,(wz+32)/82)*3)
  };
}

/** Rock strata, ore veins and soil; called only for solid underground cells. */
export function advancedUndergroundBlock(simplex, resources, type, wx, y, wz, surface, column = null) {
  if (type==='lava' && y > 6) return 19; // Basalt on volcanic worlds.
  if (y <= 2) return 19; // Dense bottom layer (unbreakable bedrock is not introduced).
  const profile=column || geologyColumn(simplex,wx,wz);
  if(y >= surface-profile.soilDepth) return type==='desert'?8:type==='lava'?19:2;
  // One extra field only in a quarter of coarse regions, below the soil.
  // Coherent thresholds create small veins, independent of chunk order.
  if(y<=24&&y<surface-6&&((((Math.floor(wx/8)*73)^(Math.floor(wz/8)*199))&3)===0)){
    const vein=simplex.noise3d((wx+137)/9,(y-71)/7,(wz-89)/9);
    if(y<=10&&vein>.87)return 31;
    if(y<=16&&vein>.80)return 30;
    if(vein>.72)return 29;
  }
  const iron=Array.isArray(resources)?resources.find(r=>r.id===5):resources.iron;
  const coal=Array.isArray(resources)?resources.find(r=>r.id===4):resources.coal;
  // Ore occurrences depend on depth; keep the existing sliders meaningful.
  if(iron && y<=24 && y<surface-5 && simplex.noise3d(wx/iron.scale.x,y/iron.scale.y,wz/iron.scale.z) > clamp(iron.scarcity-.17,.35,.94)) return 5;
  if(coal && y>=6 && y<=47 && y<surface-4 && simplex.noise3d((wx+63)/coal.scale.x,(y+19)/coal.scale.y,(wz-47)/coal.scale.z) > clamp(coal.scarcity-.16,.35,.94)) return 4;
  // Separate deep slate from ordinary stone, with a gently wavering boundary.
  return y<=profile.deepLimit?27:3;
}
