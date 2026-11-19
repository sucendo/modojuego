/**
 * Rendering-only horizon haze.  Distances and blend strengths are computed in
 * the same world units as the LOD height field. No fogged voxel is modified,
 * no new mesh/particle is created, and nothing is serialized with a world.
 */
export const HAZE_MODES=Object.freeze(['off','low','medium','high','auto']);
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
export function normalizeHazeMode(value){return HAZE_MODES.includes(value)?value:'auto';}

export function hazeTarget(radius=12,y=24,waterLevel=4,weather={},mode='auto'){
  const horizon=Math.max(6,Math.min(18,Number.isFinite(radius)?radius:12))*32;
  const altitude=clamp((y-waterLevel-18)/48);
  const strengthOfWeather=clamp(Math.max(weather.rain||0,weather.snow||0,
    weather.storm||0,weather.dust||0,weather.ash||0));
  // A clear summit has a clearer middle distance, while storms blend more
  // aggressively. Even the strongest setting never obscures near voxels.
  const near=Math.min(horizon-56,Math.max(4*32,horizon*(.55-.055*strengthOfWeather)+altitude*24));
  const far=Math.max(near+24,horizon-18);
  const factors={off:0,low:.62,medium:.82,high:1,auto:.88};
  const factor=factors[normalizeHazeMode(mode)];
  const strength=clamp(factor*(1+.11*strengthOfWeather-.05*altitude));
  return {near,far,strength};
}

// A mild world-specific scattering tint; this is mixed *into* the sky colour
// so sunset, night, storm lightning and sunrise still govern the horizon.
const WORLD_TINT=Object.freeze({
  classic:0xa9c2d2,ocean:0x9fc5d6,jungle:0xadc3b3,
  desert:0xe0bc8c,snow:0xcbdce7,lava:0x9b8380
});
export function hazeTintHex(worldType='classic'){
  return WORLD_TINT[worldType]??WORLD_TINT.classic;
}
