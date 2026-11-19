import test from 'node:test';
import assert from 'node:assert/strict';
import { HydrologyEngine, SOIL, soilForBlock, springRate, springSites, HYDROLOGY_LIMIT } from '../scripts/hydrologyEngine.js';

test('v11.3 transports surface water downhill without duplicating it', () => {
  const engine=new HydrologyEngine();
  engine.insert(0,0,{bed:6,water:2,material:'impermeable'});
  engine.insert(1,0,{bed:5,water:0,material:'impermeable'});
  for(let i=0;i<20;i++)engine.step(.5,()=>null,0);
  assert.ok(engine.cells.get('1,0').water>0);
  assert.ok(engine.cells.get('0,0').water<2);
  assert.ok(Math.abs(engine.balanceError())<1e-8,`error ${engine.balanceError()}`);
});

test('a solid levee blocks flow until water overtops it', () => {
  const engine=new HydrologyEngine();
  engine.insert(0,0,{bed:5,water:2,material:'impermeable'});
  engine.insert(1,0,{bed:8,water:0,material:'impermeable'});
  for(let i=0;i<15;i++)engine.step(.5,()=>null);
  assert.equal(engine.cells.get('1,0').water,0);
  engine.cells.get('1,0').bed=5;
  engine.step(.5,()=>null,0);
  assert.ok(engine.cells.get('1,0').water>0);
  assert.ok(Math.abs(engine.balanceError())<1e-8);
});

test('infiltration puts surface water in an aquifer, not a hidden sink', () => {
  const engine=new HydrologyEngine();
  const sand=engine.insert(0,0,{bed:5,water:1,material:'sand'});
  for(let i=0;i<15;i++)engine.step(.5,()=>null);
  assert.ok(sand.water<1&&sand.groundwater>0);
  assert.ok(engine.ledger.evaporation>0);
  assert.ok(Math.abs(engine.balanceError())<1e-8);
});

test('impermeable building blocks prevent infiltration; sands drain faster than dirt', () => {
  const layers=['sand','dirt','rock','impermeable'].map(material=>{
    const engine=new HydrologyEngine();
    engine.insert(0,0,{bed:5,water:1,material});
    engine.step(.5,()=>null,0);
    return engine.cells.get('0,0').groundwater;
  });
  assert.ok(layers[0]>layers[1]&&layers[1]>layers[2]);
  assert.equal(layers[3],0);
  assert.ok(SOIL.gravel.permeability>SOIL.sand.permeability);
  assert.equal(soilForBlock(16),'impermeable');
});

test('a deterministic spring is the only local creation and is accounted for', () => {
  const engine=new HydrologyEngine();
  engine.insert(0,0,{bed:5,water:0,sourceRate:.1,material:'impermeable'});
  for(let i=0;i<10;i++)engine.step(.5,()=>null,0);
  assert.ok(Math.abs(engine.cells.get('0,0').water-.5)<1e-8);
  assert.ok(Math.abs(engine.ledger.springs-.5)<1e-8);
  assert.ok(Math.abs(engine.balanceError())<1e-8);
  assert.equal(springRate(44,111,-42,'river'),springRate(44,111,-42,'river'));
  assert.equal(springRate(44,111,-42,'lava'),0);
});

test('exchange with fixed-height unsimulated terrain is explicitly balanced', () => {
  const engine=new HydrologyEngine();
  engine.insert(0,0,{bed:7,water:2,material:'impermeable'});
  const outside=(x,z)=> x===1&&z===0?{bed:5,water:0}:null;
  for(let i=0;i<10;i++)engine.step(.5,outside,0);
  assert.ok(engine.ledger.boundaryOut>0);
  assert.ok(Math.abs(engine.balanceError())<1e-8);
});

test('subsurface pressure drains toward a lower aquifer without generating mass', () => {
  const engine=new HydrologyEngine();
  const a=engine.insert(0,0,{bed:8,groundwater:1,material:'sand'});
  const b=engine.insert(1,0,{bed:5,groundwater:0,material:'sand'});
  for(let i=0;i<10;i++)engine.step(.5,()=>null,0);
  assert.ok(a.groundwater<1&&b.groundwater>0);
  assert.ok(Math.abs(engine.balanceError())<1e-8);
});

test('existing saves and future saves keep independent surface/aquifer volumes', () => {
  const engine=new HydrologyEngine({params:{seed:999}});
  engine.insert(-12,7,{bed:4,water:2.5,groundwater:.4,material:'sand',kind:'lake'});
  const saved=engine.snapshot();
  assert.deepEqual(saved.cells,[[-12,7,2.5,.4,'sand','lake']]);
  const loaded=new HydrologyEngine({params:{seed:999}});
  loaded.restore(saved);
  assert.equal(loaded.cells.get('-12,7').pending,true);
  assert.equal(loaded.total(),engine.total());
  loaded.restore(undefined);
  assert.equal(loaded.cells.size,0,'v11.2 worlds have no old fluid data to corrupt');
});

test('the sparse solver has an explicit memory budget', () => {
  const engine=new HydrologyEngine();
  for(let i=0;i<HYDROLOGY_LIMIT+5;i++)engine.insert(i,0,{bed:1});
  assert.equal(engine.cells.size,HYDROLOGY_LIMIT);
});

test('map spring points exactly match inputs used by the local solver',()=>{
  const springs=springSites(18,-80,-80,80,80,()=> 'river');
  assert.ok(springs.length>1);
  for(const p of springs)assert.equal(springRate(18,p.x,p.z,'river'),p.rate);
  assert.deepEqual(springSites(18,-80,-80,80,80,()=> 'river'),springs);
  assert.equal(springSites(18,-80,-80,80,80,()=> 'frozen').length,0);
});

test('a closed basin is bounded and excess is recorded as exported overflow',()=>{
  const engine=new HydrologyEngine();
  const c=engine.insert(0,0,{bed:4,water:23.95,sourceRate:2,material:'impermeable'});
  for(let i=0;i<10;i++)engine.step(.5,()=>null,0);
  assert.equal(c.water,24);
  assert.ok(engine.ledger.boundaryOut>0);
  assert.ok(Math.abs(engine.balanceError())<1e-8);
});

test('modifying the world activates a local river patch and updates its water mesh', () => {
  const data=new Array(32*32).fill(null);
  data[16*32+16]={y:7,depth:2,kind:'river'};
  let refreshed=0;
  const chunk={loaded:true,position:{x:0,z:0},waterColumns:data,
    getBlockId(x,y,z){return y<=4?8:0;},
    refreshWater(){refreshed++;}};
  const world={params:{seed:44,terrain:{waterOffset:4}},chunkSize:{height:80},type:'classic',
    getChunk(cx,cz){return cx===0&&cz===0?chunk:null;}};
  const engine=new HydrologyEngine(world);
  engine.onBlockEdit(16,5,16);
  assert.ok(engine.cells.size>300);
  assert.ok(refreshed>0);
  assert.ok(engine.total()>0);
  assert.ok(Math.abs(engine.balanceError())<1e-8);
  engine.update(.5);
  assert.ok(Math.abs(engine.balanceError())<1e-6);
});

test('v11.4 source-water rivers cannot be depleted by edits and retain the upstream debug marker',()=>{
  const data=new Array(1024).fill(null);
  data[16*32+16]={y:5.25,depth:1,kind:'river',stable:true,source:true};
  data[16*32+17]={y:5.25,depth:1,kind:'river',stable:true,source:false};
  const chunk={loaded:true,position:{x:0,z:0},waterColumns:data,
    hydrologyGround:new Float32Array(1024).fill(4.5),
    getBlockId(x,y,z){return y<=4?8:0;},refreshWater(){}};
  const world={type:'classic',params:{seed:44,terrain:{waterOffset:4}},
    hybrid:{hydrographyVersion:1},hybridProtectedSet:new Set(),chunkSize:{height:80},
    getChunk(cx,cz){return cx===0&&cz===0?chunk:null;}};
  const engine=new HydrologyEngine(world);
  engine.update(3,{x:16,z:16});
  assert.equal(engine.cells.size,0);
  engine.onBlockEdit(16,5,16);
  assert.equal(engine.cells.size,0,'the finite-volume solver stays dormant');
  assert.equal(engine.editActivity,0);
  engine.update(100,{x:16,z:16});
  assert.equal(chunk.waterColumns[16*32+16].source,true);
  assert.equal(chunk.waterColumns[16*32+17].source,false);
  assert.equal(chunk.waterColumns[16*32+16].stable,true);
});
