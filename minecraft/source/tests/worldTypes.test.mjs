import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_TYPES,applyWorldPreset,biomeForType,terrainHeight,normalizeWorldType} from '../scripts/worldTypes.js';
const defaults=()=>({terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}});
test('all six world types have deterministic, distinct generation settings',()=>{
  const config=new Map();
  for(const type of WORLD_TYPES){const p=defaults();assert.equal(applyWorldPreset(p,type),type);config.set(type,JSON.stringify(p));}
  assert.equal(new Set(config.values()).size,6);
  assert.equal(JSON.stringify(defaults()),config.get('classic'));
  assert.equal(normalizeWorldType('nonexistent'),'classic');
});
test('new biomes select the right surface conditions, old biomes remain unchanged',()=>{
  for(const [type,biome] of [['jungle','Jungle'],['desert','Desert'],['snow','Tundra'],['lava','Volcanic']])
    assert.equal(biomeForType(type,'Temperate',.1),biome);
  assert.equal(biomeForType('classic','Desert',.1),'Desert');
  assert.equal(biomeForType('ocean','Temperate',.4),'Jungle');
});
test('ocean and lava worlds start on protected islands but differ elsewhere',()=>{
  for(const type of ['ocean','lava']){
    assert.ok(terrainHeight(type,0,32,32,8)>8);
    assert.equal(terrainHeight(type,0,100,100,8),0);
  }
  assert.equal(terrainHeight('classic',0,32,32,8),0);
});
