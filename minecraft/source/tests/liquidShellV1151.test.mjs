import test from 'node:test';
import assert from 'node:assert/strict';
import {exposedLiquidIntervals,exposedLiquidTop,mergeLiquidTiles} from '../scripts/liquidShell.js';
import {WaterEnvironment} from '../scripts/waterEnvironment.js';
import {stepPressureV1147} from '../scripts/pressureHydrologyV1147.js';
import {voxelWaterColumn} from '../scripts/waterVoxelsV1134.js';
import {HydrologyEngine} from '../scripts/hydrologyEngine.js';
const sum=m=>[...m.values()].reduce((s,v)=>s+v,0);

test('a changed cave boundary refreshes the adjoining surface mesh even at an unchanged river level',()=>{
  let refreshed=0;
  const chunk={loaded:true,position:{x:0,z:0},waterColumns:Array(1024).fill(null),
    naturalWaterColumns:Array(1024).fill(null),hydrologyGround:new Float32Array(1024).fill(4.5),
    refreshWater(){refreshed++;}};
  const world={hybrid:{hydrographyVersion:3},getChunk:(x,z)=>x===0&&z===0?chunk:null};
  const engine=new HydrologyEngine(world);
  engine.pressureDirtyChunks.add('0,0');engine.updatePressure(.5);
  assert.equal(refreshed,1);
});

test('water sharing an interface has no internal transparent face, including distinct vertical cave layers',()=>{
  assert.deepEqual(exposedLiquidIntervals(2.5,5.5,[{bottom:2.5,top:5.5}]),[]);
  assert.deepEqual(exposedLiquidIntervals(2.5,6.5,[{bottom:2.5,top:3.5},{bottom:4.5,top:6.5}]),[{bottom:3.5,top:4.5}]);
});

test('a solid wall hides the water boundary; an actual window leaves only the opening',()=>{
  assert.deepEqual(exposedLiquidIntervals(2.5,5.5,[],()=>16),[]);
  assert.deepEqual(exposedLiquidIntervals(2.5,5.5,[],y=>y===4?0:16),[{bottom:3.5,top:4.5}]);
  assert.deepEqual(exposedLiquidIntervals(2.5,3.5,[],()=>17),[{bottom:2.5,top:3.5}], 'water remains visible through a glass tank');
});

test('ice overlapping the top voxel and a touching roof do not carry a second water sheet',()=>{
  assert.equal(exposedLiquidTop(4.5,y=>y===4?28:0),false);
  assert.equal(exposedLiquidTop(4.5,y=>y===5?16:0),false);
  assert.equal(exposedLiquidTop(4.5,y=>y===6?16:0),true,'a bridge with an air gap retains a free surface');
});

test('a 24-cell level pool has one top rectangle, preserves a hole, and joins across chunk boundaries',()=>{
  const tiles=[];for(let x=30;x<36;x++)for(let z=0;z<4;z++)tiles.push({x,z,top:4.5,kind:'river'});
  assert.deepEqual(mergeLiquidTiles(tiles),[{x:30,z:0,top:4.5,kind:'river',width:6,depth:4}]);
  const hole=mergeLiquidTiles(tiles.filter(c=>c.x!==32||c.z!==2));
  assert.equal(hole.reduce((s,c)=>s+c.width*c.depth,0),23);
});

test('roofing an existing channel does not create a second subterranean volume below the same top',()=>{
  const chunk={loaded:true,position:{x:0,z:0},waterColumns:Array(1024).fill(null),hydrologyGround:new Float32Array(1024).fill(2.5)};
  chunk.waterColumns[0]={kind:'river',depth:1,y:3.25};
  const world={type:'classic',params:{seed:1,terrain:{waterOffset:4}},chunkSize:{width:32,height:16},
    getChunk:()=>chunk,getBlockId:(x,y,z)=>y<=2||y===7?3:0};
  const model=new WaterEnvironment(world);
  assert.equal(model.readColumn(0,0).cavities.length,0);
  assert.equal(sum(model.water),0);
  // A real rock separator creates a separate lower cavity, not a duplicate.
  world.getBlockId=(x,y,z)=>y<=0||y===2||y===7?3:0;
  model.invalidate(0,0);
  const separate=model.readColumn(0,0).cavities;
  assert.equal(separate.length,1);assert.equal(separate[0].bottom,.5);assert.equal(separate[0].roof,1.5);
});

test('dynamic height follows actual volume continuously, including very shallow water',()=>{
  const base={kind:'river',dynamic:true,y:4,bed:2.5};
  for(const depth of [.03,.06,.11,.126,.74,1.48]){
    const v=voxelWaterColumn({...base,depth},2.5);
    assert.ok(Math.abs(v.top-(2.5+depth))<1e-12);
  }
});

test('a stone-walled channel contains water, levels out without oscillation, and drains through an opened outlet',()=>{
  const sample=(x,z)=>x>=0&&x<8&&z>=0&&z<3
    ?{bed:4.5,baseTop:4.5,capacity:8}
    :{bed:10.5,baseTop:10.5,capacity:0,dammed:true};
  let volumes=new Map([['0,0',6]]),previous=Infinity;
  for(let i=0;i<4000;i++){
    volumes=stepPressureV1147(volumes,[],sample).volumes;
    assert.ok(Math.abs(sum(volumes)-6)<1e-9);
    for(const [k,v] of volumes){
      const [x,z]=k.split(',').map(Number);assert.ok(x>=0&&x<8&&z>=0&&z<3);assert.ok(v>=0);
    }
    const peak=Math.max(...volumes.values());assert.ok(peak<=previous+1e-9);previous=peak;
  }
  assert.ok(Math.max(...volumes.values())-Math.min(...volumes.values())<.03,'the retained pool is nearly level');
  let out=0;
  for(let i=0;i<4000;i++){
    const result=stepPressureV1147(volumes,[],sample,.25,[{x:7,z:1,rate:.2}]);
    volumes=result.volumes;out+=result.removed;
  }
  assert.ok(sum(volumes)<.1,'opening the outlet releases the pool');
  assert.ok(Math.abs(sum(volumes)+out-6)<1e-8);
});
