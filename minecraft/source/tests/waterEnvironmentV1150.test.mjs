import test from 'node:test';
import assert from 'node:assert/strict';
import {WaterEnvironment,stepCavities,permeability,waterAtPoint} from '../scripts/waterEnvironment.js';
import {stepPressureV1147} from '../scripts/pressureHydrologyV1147.js';
const sum=m=>[...m.values()].reduce((s,v)=>s+v,0);

test('connected cavities conserve water for 2000 steps, including a full tunnel and rising outlet',()=>{
  const nodes=new Map([
    ['0',{x:0,z:0,bottom:4.5,roof:10.5,drain:0}],
    ['1',{x:1,z:0,bottom:1.5,roof:5.5,drain:0}],
    ['2',{x:2,z:0,bottom:4.5,roof:10.5,drain:0}]
  ]);
  let volumes=new Map([['0',4],['1',4],['2',0]]);
  for(let i=0;i<2000;i++){
    const r=stepCavities(nodes,volumes);volumes=r.volumes;
    assert.ok(Math.abs(sum(volumes)-8)<1e-9);
    for(const [k,v] of volumes)assert.ok(v>=0&&v<=nodes.get(k).roof-nodes.get(k).bottom+1e-9);
  }
  assert.ok(volumes.get('2')>.5,'water rises on the far side of the flooded lower tunnel');
  assert.ok(Math.abs(volumes.get('0')-volumes.get('2'))<.02,'connected free surfaces reach equilibrium');
});

test('a rock layer between two water levels is a sealed boundary',()=>{
  const nodes=new Map([['a',{x:0,z:0,bottom:1.5,roof:3.5}],['b',{x:1,z:0,bottom:4.5,roof:8.5}]]);
  const before=new Map([['a',0],['b',2]]);
  assert.deepEqual(stepCavities(nodes,before).volumes,before);
  assert.equal(permeability(3),0);assert.equal(permeability(16),0);assert.equal(permeability(17),0);
  assert.ok(permeability(8)>permeability(2));
});

test('inactive and unloaded water does not disappear; deep drainage is accounted exactly',()=>{
  const nodes=new Map([['a',{x:0,z:0,bottom:1.5,roof:3.5,drain:.02}]]);
  const before=new Map([['a',1],['unloaded',7]]);
  const result=stepCavities(nodes,before);
  assert.equal(result.volumes.get('unloaded'),7);
  assert.ok(Math.abs(sum(result.volumes)+result.drained-8)<1e-12);
});

function worldFixture(){
  const solid=new Map();
  for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)for(let y=0;y<=12;y++)
    if(y<3||y>6)solid.set(`${x},${y},${z}`,y===12?10:2);
  const chunk={loaded:true,position:{x:0,z:0},waterColumns:Array(1024).fill(null),hydrologyGround:new Float32Array(1024).fill(12.5)};
  const world={params:{seed:7,terrain:{waterOffset:4}},type:'classic',terrainEpoch:1,
    chunkSize:{width:32,height:24},getChunk:(x,z)=>x===0&&z===0?chunk:null,
    getBlockId:(x,y,z)=>solid.get(`${x},${y},${z}`)||0,
    washSnowBlock(x,y,z){solid.set(`${x},${y},${z}`,1);}};
  return {world,chunk,solid};
}

test('real geometry admits several levels per column, restores volumes and does not reseed drained caves',()=>{
  const {world}=worldFixture(),m=new WaterEnvironment(world);
  const c=m.readColumn(0,0);assert.equal(c.cavities.length,1);
  assert.equal(c.cavities[0].bottom,2.5);assert.equal(c.cavities[0].roof,6.5);
  const k='0,0,2.5';m.water.set(k,0);m.invalidate(0,0);m.readColumn(0,0);
  assert.equal(m.water.get(k),0);
  const restored=new WaterEnvironment(world);restored.restore(m.snapshot());restored.readColumn(0,0);
  assert.equal(restored.water.get(k),0);
});

test('snow builds on exposed soil, running water washes the layer and snowy terrain',()=>{
  const {world,chunk}=worldFixture(),m=new WaterEnvironment(world);
  let c=m.readColumn(0,0);
  m.updateSnow(c,{snow:1},8);assert.ok(m.snow.get('0,0').depth>0);
  chunk.waterColumns[0]={y:13.25,depth:1,kind:'river',dynamic:true};
  m.updateSnow(c,{snow:1},8);
  assert.equal(m.snow.has('0,0'),false);assert.equal(world.getBlockId(0,12,0),1);
  chunk.waterColumns[0]=null;
  m.updateSnow(c,{snow:1},8);assert.ok(m.snow.has('0,0'),'snow can cover washed normal terrain again');
});

test('snow falls on the roof, not inside a subterranean room, and pauses with the game',()=>{
  const {world}=worldFixture(),m=new WaterEnvironment(world);
  m.update(1,{x:0,y:5,z:0},{snow:1},false);assert.equal(m.snow.size,0);
  const c=m.readColumn(0,0);m.updateSnow(c,{snow:1},8);
  assert.equal(m.snow.get('0,0').y,12);
});

test('vision tests actual water volume and solid ice rather than using global sea level',()=>{
  const {world,chunk}=worldFixture();world.hydrology={environment:new WaterEnvironment(world)};
  chunk.waterColumns[0]={y:13.25,depth:1,kind:'river',dynamic:true};
  assert.equal(waterAtPoint(world,{x:0,y:13,z:0}).depth,.5);
  assert.equal(waterAtPoint(world,{x:0,y:14,z:0}),null);
  assert.equal(waterAtPoint(world,{x:1,y:13,z:0}),null);
  const m=world.hydrology.environment;m.readColumn(0,0);m.water.set('0,0,2.5',2);
  assert.equal(waterAtPoint(world,{x:0,y:3.5,z:0}).kind,'underground');
  assert.equal(waterAtPoint(world,{x:0,y:10,z:0}),null,'solid rock above the cave is not underwater');
});

test('pressure retains small volumes and accounts for all programmed drainage',()=>{
  const cells=new Map([['0,0',.0021],['1,0',.001]]);
  const sample=()=>({bed:.5,baseTop:.5,permeability:.01});
  const result=stepPressureV1147(cells,[],sample,.25,[],{deepDrainRate:.003,evaporationRate:.0001});
  assert.ok(Math.abs(sum(result.volumes)+result.removed-sum(cells))<1e-12);
});

test('several simultaneous dams share a bounded supply instead of multiplying river sources',()=>{
  const inlets=Array.from({length:10},(_,i)=>({damX:i*3,damZ:0,upstream:[{x:i*3+1,z:0}],rate:.85,headLimit:5}));
  const r=stepPressureV1147(new Map(),inlets,(x,z)=>z===0?{bed:.5,baseTop:1.5,dammed:x%3===0}:null);
  assert.ok(r.added<=.85*.25+1e-12);
  assert.ok(Math.abs(sum(r.volumes)+r.removed-r.added)<1e-10);
});

test('excavation alone does not create a new underground source',()=>{
  const {world}=worldFixture();
  world.dataStore={get(cx,cz,x,y,z){return x===0&&z===0&&y===3?0:undefined;}};
  const m=new WaterEnvironment(world),column=m.readColumn(0,0);
  assert.equal(column.cavities[0].natural,0);assert.equal(m.water.get('0,0,2.5'),0);
});

test('long run: bounded infiltration reaches a steady state and input leaves through explicit drainage',()=>{
  const {world,chunk}=worldFixture();
  chunk.waterColumns[0]={y:13.25,depth:1,kind:'river',dynamic:true};
  const m=new WaterEnvironment(world);m.readColumn(0,0);
  for(let i=0;i<6000;i++)m.step(.25);
  const volume=sum(m.water),before=volume;
  assert.ok(Math.abs(m.balanceError())<1e-8);
  assert.ok(volume<2,'the whole four-block cavity does not fill');
  for(let i=0;i<1000;i++)m.step(.25);
  assert.ok(Math.abs(sum(m.water)-before)<.005,'inflow and outflow converge');
  chunk.waterColumns[0]=null;
  // Natural shallow channel remains; flood water recedes towards it.
  const natural=m.columns.get('0,0').cavities[0].natural;
  for(let i=0;i<6000;i++)m.step(.25);
  assert.ok(sum(m.water)<=natural+.002);
  assert.ok(Math.abs(m.balanceError())<1e-8);
});

test('surface flood water transferred into a cave is debited from its actual pressure reservoir',()=>{
  const {world,chunk}=worldFixture();
  const m=new WaterEnvironment(world);m.readColumn(0,0);
  chunk.waterColumns[0]={y:13.25,depth:1,kind:'river',dynamic:true};
  world.hydrology={environment:m,pressureVolumes:new Map([['0,0',.1]]),
    flowCells:new Map(),pressureDirtyChunks:new Set()};
  const initial=sum(m.water)+.1;
  m.step(.25);
  assert.ok(world.hydrology.pressureVolumes.get('0,0')<.1);
  assert.ok(Math.abs(sum(m.water)+sum(world.hydrology.pressureVolumes)+m.ledger.drainage-initial)<1e-10);
  world.hydrology.pressureVolumes.clear();
  assert.equal(m.takeSurface({x:0,z:0,chunk,index:0},1),0,'a stale flood mesh cannot become an infinite source');
});
