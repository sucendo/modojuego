// Pure generation presets. The classic preset retains the previous terrain
// algorithm so v1/v2 worlds keep their original terrain and buildings.
export const WORLD_TYPES = Object.freeze(['classic','ocean','jungle','desert','snow','lava']);
export const normalizeWorldType = type => WORLD_TYPES.includes(type)?type:'classic';
export function applyWorldPreset(params,requestedType){
  const type=normalizeWorldType(requestedType);
  switch(type){
    case 'ocean':
      Object.assign(params.terrain,{scale:150,magnitude:10,offset:3,waterOffset:8});
      params.trees.frequency=.015; break;
    case 'jungle':
      Object.assign(params.terrain,{scale:105,magnitude:9,offset:8,waterOffset:3});
      params.trees.frequency=.045;params.trees.canopy.density=.85;break;
    case 'desert':
      Object.assign(params.terrain,{scale:135,magnitude:6,offset:8,waterOffset:2});
      params.trees.frequency=.018;break;
    case 'snow':
      Object.assign(params.terrain,{scale:115,magnitude:11,offset:9,waterOffset:3});
      params.trees.frequency=.013;break;
    case 'lava':
      Object.assign(params.terrain,{scale:110,magnitude:10,offset:6,waterOffset:5});
      params.trees.frequency=0;params.clouds.density=.13;break;
  }
  return type;
}
export function biomeForType(type,classicBiome,noise){
  if(type==='jungle')return 'Jungle';
  if(type==='desert')return 'Desert';
  if(type==='snow')return 'Tundra';
  if(type==='lava')return 'Volcanic';
  if(type==='ocean')return noise>.26?'Jungle':'Temperate';
  return classicBiome;
}
export function terrainHeight(type,baseHeight,x,z,waterHeight){
  if(type!=='ocean'&&type!=='lava')return baseHeight;
  // Guarantee one playable island near the initial spawn (32, 32).
  const distance=Math.hypot(x-32,z-32);
  const safeRadius=type==='ocean'?18:15;
  const island=waterHeight+3+Math.floor(Math.max(0,safeRadius-distance)*.24);
  return distance<safeRadius?Math.max(baseHeight,island):baseHeight;
}
export function isDangerousLiquid(type){return type==='lava';}
