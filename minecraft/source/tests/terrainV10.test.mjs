import test from 'node:test';
import assert from 'node:assert/strict';
import { advancedSurfaceHeight, isCave, geologyColumn, advancedUndergroundBlock,
  V10_HEIGHT, LEGACY_HEIGHT, TERRAIN_V10 } from '../scripts/terrainV10.js';
import {applyWorldPreset, WORLD_TYPES} from '../scripts/worldTypes.js';
import {VoxelData} from '../scripts/voxelData.js';
import {readFileSync,existsSync} from 'node:fs';

// A stable synthetic noise field isolates pure terrain logic from Three.js/WebGL.
const simplex={
  noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);},
  noise3d(x,y,z){return Math.sin(x*1.37+y*.63+z*.92)*Math.cos(x*.42-y*1.17+z*.3);}
};
const params=(type)=>{
 const p={terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}};
 applyWorldPreset(p,type);return p;
};
const ores=[{id:4,scarcity:.8,scale:{x:20,y:20,z:20}},{id:5,scarcity:.9,scale:{x:40,y:40,z:40}}];

test('v10 increases vertical space while keeping the old 32-block height',()=>{
 assert.equal(TERRAIN_V10,2);assert.equal(LEGACY_HEIGHT,32);assert.equal(V10_HEIGHT,80);
 const voxels=new VoxelData(32,V10_HEIGHT);
 voxels.setId(2,62,2,27);assert.equal(voxels.id(2,62,2),27);
 assert.equal(voxels.byteLength,32*32*V10_HEIGHT*5);
});

test('height generation is coordinate-stable and seamless at negative chunk boundaries',()=>{
 const p=params('classic');
 for(const [x,z] of [[0,0],[31,31],[32,31],[-1,-1],[-32,0],[-33,0],[10000,-77]]){
  const a=advancedSurfaceHeight(simplex,p,'classic',x,z);
  assert.equal(a,advancedSurfaceHeight(simplex,p,'classic',x,z));
  assert.ok(a>=1 && a<V10_HEIGHT-8);
 }
 // The exact border coordinates are world coordinates; chunks merely divide them.
 assert.equal(advancedSurfaceHeight(simplex,p,'classic',32,-31),advancedSurfaceHeight(simplex,p,'classic',32,-31));
});

test('mountain country has greater relief than the original small world',()=>{
 const p=params('snow');let highest=0,lowest=99;
 for(let x=-512;x<=512;x+=13)for(let z=-512;z<=512;z+=13){
  const h=advancedSurfaceHeight(simplex,p,'snow',x,z);
  highest=Math.max(highest,h);lowest=Math.min(lowest,h);
 }
 assert.ok(highest>35,`highest mountain only ${highest}`);
 assert.ok(highest-lowest>30);
});

test('all six types produce playable surfaces; ocean and lava spawn on land',()=>{
 for(const type of WORLD_TYPES){
  const p=params(type);
  const spawn=advancedSurfaceHeight(simplex,p,type,32,32);
  assert.ok(spawn>0&&spawn<V10_HEIGHT-8);
  if(type==='ocean'||type==='lava')assert.ok(spawn>p.terrain.waterOffset,`${type} spawn underwater`);
 }
});

test('caves contain continuous tunnels but do not hollow out the deepest foundation or surface',()=>{
 let openings=0,solid=0;
 for(let x=-32;x<64;x+=3)for(let z=-32;z<64;z+=3)for(let y=3;y<36;y+=2){
  if(isCave(simplex,x,y,z,42))openings++;else solid++;
 }
 assert.ok(openings>100,`no caves (${openings})`);
 assert.ok(solid>openings,`underground excessively hollow (${openings}/${solid})`);
 for(let y=0;y<4;y++)assert.equal(isCave(simplex,11,y,12,42),false);
 assert.equal(isCave(simplex,11,41,12,42),false);
});

test('soil, ordinary stone and deep slate form separate layers with depth-restricted veins',()=>{
 const column=geologyColumn(simplex,65,42);
 const layer=(y)=>advancedUndergroundBlock(simplex,[], 'classic',65,y,42,54,column);
 assert.equal(layer(0),19);
 assert.equal(layer(1),19);
 assert.equal(layer(53),2);
 assert.equal(layer(35),3);
 assert.equal(layer(8),27);
 let coal=0,iron=0;
 for(let x=0;x<100;x+=2)for(let z=0;z<100;z+=2)for(let y=6;y<32;y+=2){
  const id=advancedUndergroundBlock(simplex,ores,'classic',x,y,z,56,geologyColumn(simplex,x,z));
  if(id===4)coal++;if(id===5)iron++;
 }
 assert.ok(coal>0);assert.ok(iron>0);
 for(let y=45;y<55;y++)assert.notEqual(advancedUndergroundBlock(simplex,ores,'classic',2,y,3,59),5);
});

test('3D chunks and 2D map both sample the same v10 terrain function',()=>{
 const chunk=readFileSync(new URL('../scripts/worldChunk.js',import.meta.url),'utf8');
 const map=readFileSync(new URL('../scripts/mapTerrain.js',import.meta.url),'utf8');
 const save=readFileSync(new URL('../scripts/saveManager.js',import.meta.url),'utf8');
 assert.match(chunk,/advancedSurfaceHeight\(simplex,this\.params,this\.type,wx,wz,this\.size\.height\)/);
 assert.match(map,/advancedSurfaceHeight\(this\.simplex,p,this\.world\.type,x,z,this\.world\.chunkSize\.height\)/);
 assert.match(save,/world\.terrainVersion = normalized\.world\.terrainVersion \|\| 1/);
 assert.ok(existsSync(new URL('../textures/deepslate.png',import.meta.url)));
 assert.ok(existsSync(new URL('../public/textures/deepslate.png',import.meta.url)));
});
