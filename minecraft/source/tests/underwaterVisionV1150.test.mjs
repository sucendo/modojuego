import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {UnderwaterVision,EnvironmentVisuals,immersionTarget} from '../scripts/environmentVisuals.js';
import {WaterEnvironment} from '../scripts/waterEnvironment.js';

test('underwater vision restores exactly the atmospheric fog, clear colour, alpha and sky visibility',()=>{
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x80a0e0,85,130);
  const clear=new THREE.Color(0x123456);
  const renderer={getClearColor(out){return out.copy(clear);},getClearAlpha(){return .75;},
    setClearColor(c,a){clear.copy(c);this.alpha=a;}};
  const sky=[{visible:true},{visible:false}];
  const chunk={loaded:true,position:{x:0,z:0},waterColumns:[{y:3.25,depth:1,kind:'river'}],hydrologyGround:[2.5]};
  const world={chunkSize:{width:32},getChunk:()=>chunk,getBlockId:()=>0};
  const vision=new UnderwaterVision(scene,renderer,world,sky);
  vision.update({position:{x:0,y:3,z:0}});
  assert.ok(scene.fog.far<20);assert.ok(sky.every(c=>!c.visible));
  vision.restore();
  assert.equal(scene.fog.near,85);assert.equal(scene.fog.far,130);
  assert.equal(scene.fog.color.getHex(),0x80a0e0);assert.equal(clear.getHex(),0x123456);
  assert.equal(renderer.alpha,.75);assert.deepEqual(sky.map(c=>c.visible),[true,false]);
  vision.update({position:{x:0,y:4,z:0}});assert.equal(vision.saved,null);
  assert.ok(immersionTarget(10).far<immersionTarget(1).far);
});

test('batched cave and snow meshes contain finite vertices and stay beneath their physical roof',()=>{
  const scene=new THREE.Scene(),chunk={loaded:true,position:{x:0,z:0}};
  const world={type:'classic',getChunk:()=>chunk,getBlockId:(x,y,z)=>y===12?1:0};
  const model=new WaterEnvironment(world);world.hydrology={environment:model};
  model.columns.set('0,0',{x:0,z:0,chunk,cavities:[{x:0,z:0,bottom:2.5,roof:6.5}]});
  model.water.set('0,0,2.5',4);model.snow.set('0,0',{x:0,z:0,y:12,depth:.1});
  const visuals=new EnvironmentVisuals(scene,world);visuals.update(1);
  assert.equal(visuals.meshes.length,2);
  for(const mesh of visuals.meshes)assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
  const water=visuals.meshes.find(m=>m.material.transparent);
  const p=water.geometry.attributes.position.array;
  assert.ok([...p].filter((_,i)=>i%3===1).every(y=>y<=6.5));
  model.clear();visuals.update(1);assert.equal(visuals.meshes.length,0,'old world meshes are removed');
});

test('v11.5.1 adjacent underground cells share one top mesh with no internal face',()=>{
  const scene=new THREE.Scene(),chunk={loaded:true,position:{x:0,z:0}};
  const world={type:'classic',getChunk:()=>chunk,getBlockId:()=>0};
  const model=new WaterEnvironment(world);world.hydrology={environment:model};
  for(const x of [0,1]){
    model.columns.set(`${x},0`,{x,z:0,chunk,cavities:[{x,z:0,bottom:2.5,roof:8.5}]});
    model.water.set(`${x},0,2.5`,1);
  }
  const visuals=new EnvironmentVisuals(scene,world);visuals.update(1);
  assert.equal(visuals.meshes.length,1);assert.equal(visuals.waterMaterial.forceSinglePass,true);
  const positions=visuals.meshes[0].geometry.attributes.position.array;
  let flatTop=0,internal=0;
  for(let i=0;i<positions.length;i+=9){
    if([positions[i+1],positions[i+4],positions[i+7]].every(y=>y===3.5))flatTop++;
    if([positions[i],positions[i+3],positions[i+6]].every(x=>x===.5))internal++;
  }
  assert.equal(flatTop,2,'one rectangle represented by two triangles');
  assert.equal(internal,0,'no transparent dividing wall between liquid cells');
});
