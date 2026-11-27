import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SHAPES,surfaceHeight} from '../scripts/constructionShapes.js';
import {pickVoxel} from '../scripts/voxelPicking.js';
import {advancedUndergroundBlock} from '../scripts/terrainV10.js';
import {SimplexNoise} from 'three/addons/math/SimplexNoise.js';
import {RNG} from '../scripts/rng.js';
const load=THREE.TextureLoader.prototype.load;THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
const {World}=await import('../scripts/world.js');
const {Physics}=await import('../scripts/physics.js');
const {Player}=await import('../scripts/player.js');
const {blocks}=await import('../scripts/blocks.js');
THREE.TextureLoader.prototype.load=load;

test('real Three.js construction geometry matches analytic surfaces for every orientation',()=>{
 const ray=new THREE.Raycaster();let checked=0;
 for(const b of Object.values(blocks))if(SHAPES.has(b.id)){
  assert.ok(b.geometry.attributes.position.count>0);assert.ok([...b.geometry.attributes.position.array].every(Number.isFinite));
  const mesh=new THREE.Mesh(b.geometry,new THREE.MeshBasicMaterial());mesh.updateMatrixWorld();
  for(const x of [-.25,.25])for(const z of [-.25,.25]){
   ray.set(new THREE.Vector3(x,2,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];assert.ok(hit);assert.ok(hit.face.normal.y>0,'top faces point outward with normal front-face culling');
   assert.ok(Math.abs(hit.point.y-surfaceHeight(b.id,x,z))<1e-6,`geometry ${b.id} agrees with picking`);checked++;
  }
 }
 assert.equal(checked,SHAPES.size*4);
});
const actor=()=>({position:new THREE.Vector3(0,1.30,-.65),height:1.8,radius:.25,input:{x:0,z:1},velocity:new THREE.Vector3(),onGround:true});
test('physics walks a real stair in two half-steps and refuses to climb through a low ceiling',()=>{
 const physics=new Physics(new THREE.Scene()),world={getBlockId:(x,y,z)=>x===0&&y===0&&z===0?35:0};
 const player=actor();physics.tryStep(physics.broadPhase(player,world),player);assert.ok(Math.abs(player.position.y-1.801)<1e-6);
 player.position.z=-.15;physics.tryStep(physics.broadPhase(player,world),player);assert.ok(Math.abs(player.position.y-2.301)<1e-6);
 const blocked=actor(),lowRoof={getBlockId:(x,y,z)=>y===2?3:world.getBlockId(x,y,z)};
 physics.tryStep(physics.broadPhase(blocked,lowRoof),blocked);assert.equal(blocked.position.y,1.30);
});
test('world block replacement changes only the requested material and keeps new shapes in chunk storage',()=>{
 const world=new World();world.asyncLoading=false;world.landmarksEnabled=false;world.generateChunk(0,0,true);
 const chunk=world.getChunk(0,0);let physical=0;world.hydrology.onBlockEdit=()=>physical++;
 const y=chunk.maxFilledY+1;assert.ok(y<32);assert.ok(world.addBlock(10,y,10,33));assert.equal(world.getBlockId(10,y,10),33);
 const before=physical;assert.ok(world.replaceBlock(10,y,10,35,false));assert.equal(physical,before);assert.equal(world.getBlockId(10,y,10),35);
 const hit=pickVoxel(world,{x:10,y:y+2,z:10.25},{x:0,y:-1,z:0},3);assert.equal(hit.id,35);
 assert.equal(world.dataStore.get(0,0,10,y,10),35);world.disposeChunks();
});
test('precious ores form deterministic depth-bounded veins with the real noise generator',()=>{
 const noise=new SimplexNoise(new RNG(931)),counts=new Map();
 for(let z=-64;z<=64;z+=2)for(let x=-64;x<=64;x+=2)for(let y=3;y<=30;y++){
  const a=advancedUndergroundBlock(noise,{},'classic',x,y,z,50),b=advancedUndergroundBlock(noise,{},'classic',x,y,z,50);
  assert.equal(a,b);if(a>=29&&a<=31){counts.set(a,(counts.get(a)||0)+1);assert.ok(y<=(a===31?10:a===30?16:24));}
 }
 for(const id of [29,30,31])assert.ok(counts.get(id)>0,`ore ${id} occurs`);
 assert.ok(counts.get(29)>counts.get(31));
});
test('real player mining returns gems and canonical stair items rather than hidden orientation variants',()=>{
 const player=Object.create(Player.prototype),drops=[];let id=30;
 player.world={getBlock:()=>({id}),removeBlock:()=>true};player.inventory={mode:'survival',canAccept:()=>true,add:item=>drops.push(item)};
 player.equippedToolId='iron_pickaxe';player.onFeedback=()=>{};
 assert.ok(player.breakAt(0,0,0));id=42;assert.ok(player.breakAt(0,0,0));assert.deepEqual(drops,['emerald',39]);
});

test('actual placement rotates stairs toward the view and combines two compatible slabs',()=>{
 const player=Object.create(Player.prototype),added=[],replaced=[];let old=3,consumed=0;
 player.placeCoords={x:4,y:5,z:4};player.mineCoords={x:4,y:4,z:4};player.placementNormal={y:1};player.canPlaceAt=()=>true;
 player.raycaster={ray:{direction:{x:1,z:0}}};player.world={getBlock:()=>({id:old}),addBlock:(x,y,z,id)=>{added.push(id);return true;},replaceBlock:(x,y,z,id)=>{replaced.push(id);return true;}};
 player.inventory={mode:'creative',consumeSelected:()=>consumed++};
 assert.ok(player.placeSelected(35));assert.deepEqual(added,[36]);
 old=33;assert.ok(player.placeSelected(33));assert.deepEqual(replaced,[3]);assert.equal(consumed,2);
});

test('finite water spans rest at the actual lower-slab top and keep their volume',async()=>{
 const {BasinHydrology,stepBasinWater}=await import('../scripts/basinHydrology.js');
 const chunk={loaded:true,position:{x:0,z:0}},world={chunkSize:{width:32,height:16},getChunk:()=>chunk,getBlockId:(x,y,z)=>y===0?3:y===7?33:0};
 const b=new BasinHydrology({world}),spans=b.readSpans(0,0).spans,outdoor=spans.find(c=>c.outdoor);
 assert.equal(outdoor.bottom,7);outdoor.volume=.2;outdoor.kind='river';
 const result=stepBasinWater(new Map([['0,0,7',outdoor]]),.1);assert.equal(outdoor.volume,.2);assert.equal(result.discharged,0);
});


test('ridge caps meet both full-height roof slopes without a half-block gap',()=>{
 const ramp=surfaceHeight(43,0,.5),ridge=1+surfaceHeight(49,0,-.5);
 assert.equal(ramp,ridge);assert.equal(1+surfaceHeight(49,0,.5),surfaceHeight(45,0,-.5));
});

test('actual targeting gives the spear more reach than the sword while retaining voxel placement distance',()=>{
 const player=Object.create(Player.prototype),limits=[];
 player.camera=new THREE.PerspectiveCamera();player.camera.updateMatrixWorld();player.raycaster=new THREE.Raycaster();
 player.inventory={getSelected:()=>null};player.selectionHelper=new THREE.Object3D();player.mineMode=true;
 player.animals={raycast:(ray,limit)=>{limits.push(limit);return null;}};
 const world={chunkSize:{height:80},getBlockId:()=>0};
 player.equippedToolId='spear';player.updateRaycaster(world);player.equippedToolId='sword';player.updateRaycaster(world);
 assert.deepEqual(limits,[4.5,2.6]);assert.equal(player.raycaster.far,7);
});
