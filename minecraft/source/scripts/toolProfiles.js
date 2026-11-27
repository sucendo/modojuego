// Basic pickaxe is a virtual, always-available tool (the original key 0).
export const TOOL_IDS = Object.freeze(['basic_pickaxe','wood_pickaxe','stone_pickaxe','iron_pickaxe','saw','sword','broom','spear']);
export const TOOL_PROFILES = Object.freeze({
  basic_pickaxe: {nameKey:'toolBasicPickaxe', level:0, kind:'pickaxe', color:0xaeb3b9},
  wood_pickaxe: {nameKey:'itemWoodPickaxe', level:1, kind:'pickaxe', color:0x916137},
  stone_pickaxe: {nameKey:'itemStonePickaxe', level:2, kind:'pickaxe', color:0x818f99},
  iron_pickaxe: {nameKey:'itemIronPickaxe', level:3, kind:'pickaxe', color:0xc5dde0},
  saw: {nameKey:'itemSaw', level:0, kind:'saw', color:0xc3cbd3},
  sword: {nameKey:'itemSword', level:0, kind:'sword', color:0xc1c7e0, reach:2.6},
  spear: {nameKey:'itemSpear',level:0,kind:'spear',color:0xd4dde0,reach:4.5},
  broom: {nameKey:'itemBroom', level:0, kind:'broom', color:0xcbb071}
});
export const OBJECT_BLOCK_IDS = Object.freeze([18,21,22,23,24,25,26]);
export const isObjectBlock = id => OBJECT_BLOCK_IDS.includes(Number(id));
export const isTool = id => Object.hasOwn(TOOL_PROFILES,id);
export function harvestLevel(toolId, blockId) {
  if (toolId === 'sword'||toolId==='broom'||toolId==='spear') return -1;
  if (toolId === 'saw') return [6,7,11,12,15,20,34,39,40,41,42,48].includes(blockId) ? 3 : -1;
  return TOOL_PROFILES[toolId]?.level ?? 0;
}
export function requiredHarvestLevel(blockId) {
  return [30,31,52,53].includes(blockId)?3:[5,29,51].includes(blockId)?2 : [3,4,16,19,26,27,33,35,36,37,38,47].includes(blockId) ? 1 : 0;
}
