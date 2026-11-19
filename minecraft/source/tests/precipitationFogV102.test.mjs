import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SkyExposure, blocksPrecipitation } from '../scripts/skyExposure.js';
import { DEFAULT_FOG, fogTarget, migrateFogPreferences, FogAtmosphere } from '../scripts/fogAtmosphere.js';

function voxels(height=80){
  const blocks=new Map(); let calls=0;
  return {
    chunkSize:{height},
    getBlockId(x,y,z){calls++;return blocks.get(`${x},${y},${z}`)||0;},
    put(x,y,z,id){blocks.set(`${x},${y},${z}`,id);},
    calls:()=>calls,
  };
}
const fair={rain:0,snow:0,storm:0,dust:0,ash:0,cloudCover:.12};
const winter={...fair,snow:1,cloudCover:.91};
const world={drawDistance:3,params:{terrain:{waterOffset:8}}};

test('v10 mountain/cave ceilings above Y32 block snowfall underneath',()=>{
  const w=voxels(80);w.put(3,58,6,3);
  const sky=new SkyExposure(w);
  assert.equal(sky.roofHeight(3,6,1000),58);
  assert.equal(sky.skyVisible(3,40,6,1000),false);
  assert.equal(sky.skyVisible(3,59,6,1000),true);
  assert.equal(sky.skyVisible(3,79,6,1000),true);
});

test('v10 does not snow through user-built roofs, glass or tree leaves',()=>{
  for(const block of [3,7,12,17,20,26]){
    const w=voxels();w.put(0,62,0,block);
    assert.equal(new SkyExposure(w).skyVisible(0,45,0,0),false,`block ${block}`);
  }
  for(const block of [0,9,21,23,24])assert.equal(blocksPrecipitation(block),false);
});

test('snow remains visible outdoors at cave entrances, not on the inside',()=>{
  const w=voxels();w.put(0,47,0,3);w.put(1,47,0,2);
  const sky=new SkyExposure(w);
  assert.equal(sky.skyVisible(.1,35,.2,0),false);
  assert.equal(sky.skyVisible(1.1,35,.2,0),false);
  assert.equal(sky.skyVisible(2.1,35,.2,0),true);
});

test('legacy height 32 keeps its own roof bound',()=>{
  const w=voxels(32);w.put(0,27,0,16);
  const sky=new SkyExposure(w);
  assert.equal(sky.roofHeight(0,0,0),27);
  assert.equal(sky.skyVisible(0,26,0,0),false);
  assert.equal(sky.skyVisible(0,29,0,0),true);
});

test('roof lookup caches repeated samples then notices construction edits',()=>{
  const w=voxels();const sky=new SkyExposure(w);
  assert.equal(sky.roofHeight(0,0,100),-1);
  const total=w.calls();
  assert.equal(sky.roofHeight(0,0,200),-1);
  assert.equal(w.calls(),total,'same column avoids scanning 80 levels');
  w.put(0,60,0,16);
  assert.equal(sky.skyVisible(0,40,0,200),true,'cached until next small refresh');
  assert.equal(sky.skyVisible(0,40,0,710),false,'refresh sees new roof');
  sky.clear();assert.equal(sky.skyVisible(0,61,0,711),true);
});

test('nearest cave ceiling supports limited drips while open sky has none',()=>{
  const w=voxels();w.put(0,39,0,3);w.put(0,72,0,3);
  const sky=new SkyExposure(w);
  assert.equal(sky.caveCeiling(0,35,0,7),39);
  assert.equal(sky.caveCeiling(0,50,0,7),null);
});

test('a clear mountain has farther fog than a clear valley',()=>{
  const valley=fogTarget(fair,{y:22},world,DEFAULT_FOG);
  const mountain=fogTarget(fair,{y:70},world,DEFAULT_FOG);
  assert.ok(valley.near>50&&valley.far>75);
  assert.ok(mountain.near>valley.near);
  assert.ok(mountain.far>valley.far);
  assert.ok(mountain.far>mountain.near+20);
});

test('weather, not permanent fog, reduces visibility during snow, rain and ash',()=>{
  const clear=fogTarget(fair,{y:55},world,DEFAULT_FOG);
  for(const weather of [winter,{...fair,rain:.9,storm:.6},{...fair,dust:.8},{...fair,ash:.8}]){
    const wet=fogTarget(weather,{y:55},world,DEFAULT_FOG);
    assert.ok(wet.near<clear.near);
    assert.ok(wet.far<clear.far);
    assert.ok(wet.far>=wet.near+20);
  }
  const inside=fogTarget(fair,{y:25},world,DEFAULT_FOG,true);
  const outside=fogTarget(fair,{y:25},world,DEFAULT_FOG,false);
  assert.ok(inside.far>outside.far);
  assert.ok(fogTarget(winter,{y:25},world,DEFAULT_FOG,true).far>fogTarget(winter,{y:25},world,DEFAULT_FOG,false).far);
});

test('v10.1 hard-coded fog defaults migrate; custom settings remain unchanged',()=>{
  assert.deepEqual(migrateFogPreferences(50,75),DEFAULT_FOG);
  assert.deepEqual(migrateFogPreferences(undefined,undefined),DEFAULT_FOG);
  assert.deepEqual(migrateFogPreferences(31,92),{near:31,far:92});
});

test('atmospheric fog interpolation never changes saved fog preferences',()=>{
  const scene={fog:{near:50,far:75},userData:{fogPreferences:{near:85,far:130}}};
  const fog=new FogAtmosphere(scene,world);const before={...scene.userData.fogPreferences};
  fog.update(fair,{y:70},.2);
  assert.ok(scene.fog.far>75);
  fog.update(winter,{y:70},0,true);
  assert.ok(scene.fog.far<100);
  assert.deepEqual(scene.userData.fogPreferences,before);
});

test('precipitation rendering clips each particle using sky visibility',()=>{
  const src=readFileSync(new URL('../scripts/precipitation.js',import.meta.url),'utf8');
  assert.match(src,/new SkyExposure\(world\)/);
  assert.match(src,/this\.sky\.skyVisible\(wx,position\.y\+points\[p\+4\],wz,now\)/);
  assert.match(src,/this\.sky\.skyVisible\(position\.x\+points\[p\],position\.y\+points\[p\+1\],position\.z\+points\[p\+2\],now\)/);
  assert.doesNotMatch(src,/for\(let y=Math\.floor\(position\.y\)\+2;y<32;y\+\+\)/);
});
