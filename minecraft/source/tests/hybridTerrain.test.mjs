import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 TERRAIN_HYBRID, HYBRID_BLEND_BLOCKS, collectProtectedChunks, validateHybrid,
 chunkKey, coordinateChunk, generatorForChunk, protectionNearby,
 transitionWeight, legacySurfaceHeight, hybridSurfaceHeight
} from '../scripts/hybridTerrain.js';
import {advancedSurfaceHeight} from '../scripts/terrainV10.js';

const simplex={
 noise(x,z){return Math.sin(x*.38+z*.11)*Math.cos(x*.13-z*.39);},
 noise3d(x,y,z){return Math.sin(x+y+z);}
};
const params={terrain:{offset:6,magnitude:8,scale:100,waterOffset:4}};

test('known legacy footprint freezes explored, edited, workstation, markers, spawn and currently visible chunks',()=>{
 const saved=collectProtectedChunks({
  explored:['-2,-4','0,0'], blocks:{'-18,5,1,12,30':4,'3,-5,1,4,2':0},
  stations:{'1024,2,-64':{kind:'chest'}},
  markers:[{x:9021,z:75}],player:[32,24,32],spawn:[32,20,32],
  visible:['-10,11','4,4']
 });
 const set=new Set(saved);
 for(const key of ['-2,-4','0,0','-18,5','3,-5','32,-2','281,2','-10,11','4,4','-1,-1','3,3'])assert.ok(set.has(key),key);
 assert.equal(set.size,saved.length);
 assert.ok(!set.has('900,900'));
 assert.equal(coordinateChunk(-1),-1);
 assert.equal(coordinateChunk(-32),-1);
 assert.equal(coordinateChunk(-33),-2);
});

test('only protected chunks stay original; open chunks always use hybrid generation',()=>{
 const legacy=new Set(['0,0','-1,3']);
 assert.equal(generatorForChunk(1,legacy,72,72),1);
 assert.equal(generatorForChunk(2,legacy,0,0),2);
 assert.equal(generatorForChunk(TERRAIN_HYBRID,legacy,0,0),1);
 assert.equal(generatorForChunk(TERRAIN_HYBRID,legacy,-1,3),1);
 assert.equal(generatorForChunk(TERRAIN_HYBRID,legacy,1,0),TERRAIN_HYBRID);
});

test('hybrid boundary uses original terrain, then blends smoothly over three chunks',()=>{
 const nearby=protectionNearby(new Set(['0,0']),1,0);
 assert.deepEqual(nearby,[[0,0]]);
 assert.equal(transitionWeight(32,12,nearby),0);
 assert.equal(transitionWeight(31,12,nearby),0);
 assert.equal(transitionWeight(32+HYBRID_BLEND_BLOCKS+1,12,nearby),1);
 let last=0;
 for(let x=32;x<=140;x++){
  const w=transitionWeight(x,12,nearby);
  assert.ok(w>=last && w<=1);
  assert.ok(w-last<.02,`sudden blend jump ${w-last} at x=${x}`);
  last=w;
 }
 for(const z of [0,8,31]){
  assert.equal(hybridSurfaceHeight(simplex,params,'classic',32,z,nearby),legacySurfaceHeight(simplex,params,'classic',32,z));
 }
 assert.equal(hybridSurfaceHeight(simplex,params,'classic',200,8,nearby),advancedSurfaceHeight(simplex,params,'classic',200,8));
 assert.equal(hybridSurfaceHeight(simplex,params,'classic',-100,8,nearby),advancedSurfaceHeight(simplex,params,'classic',-100,8));
});

test('hybrid terrain depends on immutable saved footprint, not newly explored cells',()=>{
 const footprint=validateHybrid({legacyChunks:['0,0','-1,0'],blendBlocks:HYBRID_BLEND_BLOCKS},TERRAIN_HYBRID);
 const frozen=new Set(footprint.legacyChunks);
 const sample=(wx,wz)=>hybridSurfaceHeight(simplex,params,'snow',wx,wz,
   protectionNearby(frozen,coordinateChunk(wx),coordinateChunk(wz)));
 const before=[sample(35,12),sample(135,12),sample(220,12)];
 const newlyExplored=['10,0','11,0']; // NOT added to the frozen legacy set.
 assert.equal(newlyExplored.length,2);
 assert.deepEqual([sample(35,12),sample(135,12),sample(220,12)],before);
 assert.equal(generatorForChunk(TERRAIN_HYBRID,frozen,10,0),TERRAIN_HYBRID);
});

test('malformed or hostile hybrid saves are rejected, never treated as legacy',()=>{
 const good={legacyChunks:['0,0','-1,5'],blendBlocks:96};
 assert.deepEqual(validateHybrid(good,3),good);
 assert.equal(validateHybrid(undefined,1),null);
 assert.equal(validateHybrid(undefined,2),null);
 for(const bad of [undefined,{}, {legacyChunks:[],blendBlocks:96},
  {legacyChunks:['0,0','0,0'],blendBlocks:96},
  {legacyChunks:['0,0'],blendBlocks:5},
  {legacyChunks:['hello'],blendBlocks:96},
  {legacyChunks:['100001,0'],blendBlocks:96},
  {legacyChunks:['0,9007199254740992'],blendBlocks:96}]) {
  assert.throws(()=>validateHybrid(bad,3));
 }
 assert.throws(()=>validateHybrid(good,1));
});

test('3D chunks and 2D map use the same hybrid height and immutable protection',()=>{
 const chunk=readFileSync(new URL('../scripts/worldChunk.js',import.meta.url),'utf8');
 const map=readFileSync(new URL('../scripts/mapTerrain.js',import.meta.url),'utf8');
 const world=readFileSync(new URL('../scripts/world.js',import.meta.url),'utf8');
 assert.match(chunk,/hybridSurfaceHeight\(simplex,this\.params,this\.type,wx,wz,this\.hybridNearby\)/);
 assert.match(map,/hybridSurfaceHeight\(this\.simplex,p,this\.world\.type,x,z,this\.nearbyCache\.get\(key\)\)/);
 assert.match(world,/generatorForChunk\(this\.terrainVersion,this\.hybridProtectedSet,x,z\)/);
 assert.match(chunk,/LEGACY_HEIGHT\) - \(this\.type === 'classic'/);
});
