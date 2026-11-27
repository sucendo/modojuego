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
  assert.equal(visuals.meshes.length,1);assert.equal(visuals.snowMeshes.length,1);
  for(const mesh of [...visuals.meshes,...visuals.snowMeshes])assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
  const water=visuals.meshes.find(m=>m.material.transparent);
  const p=water.geometry.attributes.position.array;
  assert.ok([...p].filter((_,i)=>i%3===1).every(y=>y<=6.5));
  model.clear();visuals.update(1);assert.equal(visuals.meshes.length,0,'old world meshes are removed');assert.equal(visuals.snowMeshes.length,0);
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

test('uneven underground flow joins continuously while stacked cavities remain separate',()=>{
  const scene=new THREE.Scene(),chunk={loaded:true,position:{x:0,z:0}};
  const world={type:'classic',getChunk:()=>chunk,getBlockId:()=>0};
  const model=new WaterEnvironment(world);world.hydrology={environment:model};
  for(const x of [0,1]){
    const cavities=[{x,z:0,bottom:.5,roof:4.5},{x,z:0,bottom:6.5,roof:9.5}];
    model.columns.set(`${x},0`,{x,z:0,chunk,cavities});
    model.water.set(`${x},0,0.5`,x?1.3:1.1);model.water.set(`${x},0,6.5`,x?1.3:1.1);
  }
  const visuals=new EnvironmentVisuals(scene,world);visuals.update(1);
  const g=visuals.meshes[0].geometry,p=g.attributes.position;
  const heights=[];
  for(let i=0;i<p.count;i++)if(p.getX(i)===.5&&p.getY(i)>.6)heights.push(p.getY(i));
  assert.ok(heights.some(y=>Math.abs(y-1.7)<1e-5));
  assert.ok(heights.some(y=>Math.abs(y-7.7)<1e-5));
  assert.ok(heights.every(y=>y<=4.5||y>=6.5));
  assert.equal(g.attributes.waterHeightMotion.count,p.count);
  const physical=[...model.water];
  visuals.rebuild(model);assert.deepEqual([...model.water],physical);
  model.clear();visuals.update(1);
  assert.equal(visuals.transitions.records.size,0);
});

test('surface water queries separate a suspended aqueduct from the water beneath it',async()=>{
 const {surfaceWater,waterAtPoint}=await import('../scripts/waterEnvironment.js');
 const chunk={loaded:true,position:{x:0,z:0},waterColumns:Array(1024).fill(null),hydrologyGround:new Float32Array(1024).fill(.5)};
 chunk.waterColumns[33]={kind:'river',bed:7.5,depth:.6,y:7.85,finite:true,dynamic:true};
 const world={chunkSize:{width:32},getChunk:()=>chunk,getBlockId:(x,y,z)=>y===7?3:0};
 const model=new WaterEnvironment(world);world.hydrology={environment:model};
 model.columns.set('1,1',{x:1,z:1,chunk,cavities:[{x:1,z:1,bottom:.5,roof:6.5}]});model.water.set('1,1,0.5',1);
 assert.equal(surfaceWater(world,1,1).bottom,7.5);
 assert.ok(Math.abs(waterAtPoint(world,{x:1,y:7.8,z:1}).depth-.3)<1e-6);
 assert.equal(waterAtPoint(world,{x:1,y:1,z:1}).kind,'underground');
 assert.equal(waterAtPoint(world,{x:1,y:4,z:1}),null,'air between the two water layers remains dry');
 const visuals=new EnvironmentVisuals(new THREE.Scene(),world);visuals.rebuild(model);
 assert.ok(visuals.meshes.some(m=>Array.from(m.geometry.attributes.position.array).filter((_,i)=>i%3===1).some(y=>Math.abs(y-1.5)<1e-6)),'lower water is not suppressed by the elevated surface');
});

test('cave current changes update attributes while retaining all cave and snow geometry',()=>{
 const scene=new THREE.Scene(),chunk={loaded:true,position:{x:0,z:0},waterColumns:[]};
 const world={type:'classic',chunkSize:{width:32},getChunk:()=>chunk,getBlockId:()=>0};
 const model=new WaterEnvironment(world);world.hydrology={environment:model};
 const c={x:1,z:1,bottom:7.5,roof:12.5,finite:true,kind:'river',volume:.5,flowX:.1,flowZ:0};
 model.columns.set('1,1',{x:1,z:1,chunk,cavities:[c]});model.water.set('1,1,7.5',.5);
 const visuals=new EnvironmentVisuals(scene,world);visuals.update(1);
 const mesh=visuals.meshes[0],geometry=mesh.geometry,positions=geometry.getAttribute('position').array;
 c.flowX=-.1;model.flowRevision=1;visuals.update(1);
 assert.equal(visuals.meshes[0],mesh);assert.equal(mesh.geometry,geometry);assert.equal(geometry.getAttribute('position').array,positions);
 const flow=geometry.getAttribute('waterFlow').array;assert.ok(Array.from(flow).filter((_,i)=>i%2===0).every(x=>x<0));
});


test('snow and frost rebuild independently without replacing cave water geometry',()=>{
 const scene=new THREE.Scene(),chunk={loaded:true,position:{x:0,z:0}};
 const world={type:'classic',chunkSize:{width:32},getChunk:()=>chunk,getBlockId:(x,y,z)=>y===12?2:0};
 const model=new WaterEnvironment(world);world.hydrology={environment:model};
 model.columns.set('0,0',{x:0,z:0,chunk,cavities:[{x:0,z:0,bottom:2.5,roof:6.5}]});model.water.set('0,0,2.5',1);
 model.snow.set('0,0',{x:0,z:0,y:12,depth:.12,ice:.06,cold:55});
 const visuals=new EnvironmentVisuals(scene,world);visuals.update(1);
 const water=visuals.meshes[0];assert.equal(visuals.snowMeshes.length,2);
 const ice=visuals.snowMeshes.find(m=>m.material===visuals.iceMaterial),snow=visuals.snowMeshes.find(m=>m.material===visuals.snowMaterial);
 assert.ok(ice&&snow);assert.ok([...ice.geometry.attributes.position.array].every(Number.isFinite));
 model.clearSurface(0,12,0,'broom');visuals.update(1);
 assert.equal(visuals.meshes[0],water);assert.equal(visuals.snowMeshes.length,1);assert.equal(visuals.snowMeshes[0].material,visuals.iceMaterial);
 model.clearSurface(0,12,0,'pickaxe');visuals.update(1);assert.equal(visuals.snowMeshes.length,0);assert.equal(visuals.meshes[0],water);
});
