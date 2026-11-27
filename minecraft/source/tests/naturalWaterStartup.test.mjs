import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {voxelWaterColumn} from '../scripts/waterVoxelsV1134.js';
// Load actual terrain and mesh code without fetching textures or creating WebGL.
const loadTexture=THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
const {World}=await import('../scripts/world.js');
THREE.TextureLoader.prototype.load=loadTexture;

const freshWorld=()=>{
 const world=new World(0);
 world.params.seed=0;world.type='classic';world.terrainVersion=6;
 world.hybrid={sourceVersion:5,protectedChunks:[],blendBlocks:96,hydrographyVersion:3};
 world.hybridProtectedSet=new Set();world.hybridLegacySet=new Set();world.hybridV1Set=new Set();world.hybridV2Set=new Set();
 world.chunkSize.height=80;world.asyncLoading=false;world.landmarksEnabled=false;
 return world;
};
const topEdge=(chunk,x)=>{
 const heights=new Map();
 for(const mesh of chunk.children)if(mesh.userData.waterSurface){
  const p=mesh.geometry.getAttribute('position'),n=mesh.geometry.getAttribute('normal');
  for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-x)<1e-6&&n.getY(i)>.1){
   heights.set((p.getZ(i)+chunk.position.z).toFixed(5),p.getY(i));
  }
 }
 return heights;
};

test('real generated untouched rivers start fractional and keep their edge heights when neighboring chunks load',()=>{
 const world=freshWorld();world.generateChunk(-2,-3,true);
 const right=world.getChunk(-2,-3),before=topEdge(right,-.5);
 assert.ok(before.size>0,'this real generated reach crosses the chunk edge');
 let fractional=0;
 for(let i=0;i<right.waterColumns.length;i++){
  const c=right.waterColumns[i];if(c?.kind!=='river')continue;
  const v=voxelWaterColumn(c,right.hydrologyGround[i]);
  assert.ok(v);assert.equal(v.top-v.bottom,Math.min(1,c.depth));
  if(c.depth<1)fractional++;
 }
 assert.ok(fractional>10,'the actual generator produces shallow natural flow, not just a synthetic fixture');
 assert.equal(world.hydrology.basins.columns.size,0,'first appearance needs no finite simulation');
 world.generateChunk(-3,-3,true);right.refreshWater();
 const after=topEdge(right,-.5);
 assert.deepEqual(after,before,'procedural boundary samples and loaded neighbor columns give identical first-frame edge heights');
 assert.equal(world.hydrology.basins.columns.size,0);
 world.disposeChunks();
});
