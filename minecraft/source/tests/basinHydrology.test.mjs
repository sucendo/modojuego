import test from 'node:test';
import assert from 'node:assert/strict';
import {stepBasinWater,fallWidth,BasinHydrology} from '../scripts/basinHydrology.js';
import {HydrologyEngine} from '../scripts/hydrologyEngine.js';
const cell=(x,z,volume,bottom=.5,roof=20.5,outdoor=true)=>({x,z,bottom,roof,outdoor,volume,kind:'lake',permeability:0});
const total=nodes=>[...nodes.values()].reduce((s,c)=>s+c.volume,0);
const simulate=(nodes,seconds,options)=>{for(let i=0;i<seconds*10;i++)stepBasinWater(nodes,.1,options);};

test('widening a finite lake draws down its stored water and levels a closed canal',()=>{
 const nodes=new Map();for(let x=0;x<4;x++)nodes.set(`${x}`,cell(x,0,2));
 for(let x=4;x<12;x++)nodes.set(`${x}`,cell(x,0,0));
 const before=total(nodes);simulate(nodes,20);
 assert.ok(Math.abs(total(nodes)-before)<1e-9);
 const heads=[...nodes.values()].map(c=>c.bottom+c.volume);
 assert.ok(Math.max(...heads)-Math.min(...heads)<.002,'closed canal is hydrostatic, not an eight-level permanent slope');
 assert.ok(nodes.get('0').volume<2,'lake pays for the new channel');
 assert.ok(nodes.get('11').volume>.5);
});

test('a real opening below the top of a dam transmits flow without filling the wall',()=>{
 const nodes=new Map([['lake',cell(0,0,4)],['hole',cell(1,0,0,1.5,2.5,false)],['out',cell(2,0,0)]]);
 const before=total(nodes);simulate(nodes,90);
 assert.ok(nodes.get('out').volume>1,'water crosses the low opening');
 assert.ok(nodes.get('hole').volume<=1+1e-8);
 assert.ok(Math.abs(total(nodes)-before)<1e-9);
 const sealed=new Map([['lake',cell(0,0,4)],['crest',cell(1,0,0,6.5)],['out',cell(2,0,0)]]);
 simulate(sealed,90);assert.equal(sealed.get('out').volume,0,'a solid dam has no invisible drain');
});

test('small and large orifices produce different discharge, without creating water',()=>{
 const run=height=>{
  const nodes=new Map([['a',cell(0,0,5)],['hole',cell(1,0,0,1.5,1.5+height,false)],['b',cell(2,0,0)]]);
  simulate(nodes,3);return nodes.get('b').volume;
 };
 assert.ok(run(1)>run(.2));
 assert.ok(fallWidth(.6)>fallWidth(.01));assert.equal(fallWidth(0),.08);
});

test('puddles lose volume progressively through measured evaporation and material infiltration',()=>{
 const nodes=new Map([['sand',{...cell(0,0,.04),permeability:.001}],['rock',cell(10,0,.04)]]);
 let previous=total(nodes),loss=0;
 for(let i=0;i<100;i++){
  const r=stepBasinWater(nodes,.1,{evaporation:.0001,infiltration:1});loss+=r.evaporated+r.infiltrated;
  assert.ok(total(nodes)<=previous+1e-12);previous=total(nodes);
 }
 assert.ok(nodes.get('sand').volume<nodes.get('rock').volume);
 assert.ok(Math.abs(total(nodes)+loss-.08)<1e-10);
 simulate(nodes,600,{evaporation:.0001,infiltration:1});assert.equal(total(nodes),0);
});

test('only declared springs add water; a lake node never self-refills',()=>{
 const nodes=new Map([['a',{...cell(0,0,0),kind:'river',sourceRate:.25,sourceHead:2}],['lake',cell(5,0,0)]]);
 let supplied=0;for(let i=0;i<100;i++)supplied+=stepBasinWater(nodes,.1).supplied;
 assert.equal(nodes.get('lake').volume,0);assert.ok(Math.abs(total(nodes)-supplied)<1e-10);
});

function worldFixture(){
 const width=32,height=16,blocks=new Map(),chunk={loaded:true,position:{x:0,z:0},waterColumns:Array(1024).fill(null),hydrologyGround:new Float32Array(1024).fill(.5),refreshWater(){}};
 // Bedrock floor and outer stone walls; a lake occupies x=1..3, z=1.
 for(let x=0;x<8;x++)for(let z=0;z<8;z++)blocks.set(`${x},0,${z}`,3);
 for(let x=0;x<8;x++)for(let z=0;z<8;z++)if(z!==1||x===0||x===7)for(let y=1;y<8;y++)blocks.set(`${x},${y},${z}`,3);
 for(let x=1;x<=3;x++)chunk.waterColumns[32+x]={bed:.5,y:2.25,depth:2,kind:'lake',stable:true,source:true};
 chunk.naturalWaterColumns=chunk.waterColumns.map(c=>c?{...c}:null);chunk.naturalWaterGround=chunk.hydrologyGround.slice();
 chunk.getBlockId=(x,y,z)=>blocks.get(`${x},${y},${z}`)||0;
 const world={type:'classic',params:{seed:1,terrain:{waterOffset:0}},terrainEpoch:0,hybrid:{hydrographyVersion:3},chunkSize:{width,height},getChunk:(x,z)=>x===0&&z===0?chunk:null,getBlockId:(x,y,z)=>x<0||x>=8||z<0||z>=8?3:blocks.get(`${x},${y},${z}`)||0};
 world.hydrology=new HydrologyEngine(world);return {world,chunk,blocks};
}

test('engine edit activates a finite basin; reloading does not restore the spent natural lake',()=>{
 const f=worldFixture(),e=f.world.hydrology;
 e.onBlockEdit(4,1,1);assert.ok(e.basins.columns.size>0);
 const initial=e.basins.total();assert.equal(initial,6);
 for(let i=0;i<1000;i++)e.update(.1);
 assert.ok(Math.abs(e.basins.balanceError())<1e-8);
 assert.ok(f.chunk.waterColumns[32+6]?.depth>0);
 const saved=e.snapshot(),restored=worldFixture();restored.world.hydrology.restore(saved);restored.world.hydrology.reconcileChunk(restored.chunk);
 assert.ok(Math.abs(restored.world.hydrology.basins.total()-e.basins.total())<1e-8);
 assert.ok(restored.chunk.waterColumns[32+1].depth<2);
 assert.equal(restored.world.hydrology.basins.snapshot().columns.length,saved.basins.columns.length);
});

test('placing a solid into managed water preserves displaced volume in real free spans',()=>{
 const f=worldFixture(),b=f.world.hydrology.basins;b.edit(4,1,1);
 const before=b.total();f.blocks.set('2,1,1',3);b.edit(2,1,1);
 assert.ok(Math.abs(b.total()-before)<1e-9);assert.ok(Math.abs(b.balanceError())<1e-9);
});

test('concurrent pressurized openings stay within capacity and conserve finite volume',()=>{
 const nodes=new Map();let seed=73;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let z=0;z<6;z++)for(let x=0;x<6;x++){
  const roof=random()<.4?1.5+Math.floor(random()*4):12.5;
  nodes.set(`${x},${z}`,cell(x,z,random()*(roof-.5),.5,roof,roof===12.5));
 }
 const initial=total(nodes);
 for(let i=0;i<2000;i++){
  stepBasinWater(nodes,.1);
  for(const n of nodes.values())assert.ok(n.volume>=0&&n.volume<=n.roof-n.bottom+1e-7);
 }
 assert.ok(Math.abs(total(nodes)-initial)<1e-8);
});

test('repeated terrain edits do not create cave recharge or duplicate lake water',()=>{
 const f=worldFixture(),e=f.world.hydrology;e.onBlockEdit(4,1,1);const before=e.basins.total();
 for(let i=0;i<10;i++){
  f.blocks.set('2,2,1',3);e.onBlockEdit(2,2,1);
  f.blocks.delete('2,2,1');e.onBlockEdit(2,2,1);
 }
 assert.ok(Math.abs(e.basins.total()-before)<1e-9);
 assert.ok(Math.abs(e.basins.balanceError())<1e-9);
 for(const c of e.environment.columns.values())e.environment.readColumn(c.x,c.z);
 assert.ok(Math.abs(e.basins.total()-before)<1e-9);
});

test('real voxel walls pass water through a low gap and block it when fully sealed',()=>{
 const run=open=>{
  const f=worldFixture(),e=f.world.hydrology;
  for(let y=1;y<=6;y++)if(!open||y!==2)f.blocks.set(`4,${y},1`,3);
  f.chunk.hydrologyGround[32+4]=open?1.5:6.5;
  e.onBlockEdit(4,2,1);
  for(let i=0;i<900;i++)e.update(.1);
  assert.ok(Math.abs(e.basins.balanceError())<1e-8);
  const b=e.basins.snapshot(),saved=e.snapshot(),reload=worldFixture();
  for(let y=1;y<=6;y++)if(!open||y!==2)reload.blocks.set(`4,${y},1`,3);
  reload.chunk.hydrologyGround[32+4]=open?1.5:6.5;
  reload.world.hydrology.restore(saved);reload.world.hydrology.reconcileChunk(reload.chunk);
  assert.deepEqual(reload.world.hydrology.basins.snapshot(),b);
  return {out:f.chunk.waterColumns[32+5]?.depth||0,hole:e.environment.water.get('4,1,1.5')||0};
 };
 const open=run(true),closed=run(false);
 assert.ok(open.out>.3);assert.ok(open.hole>0);assert.equal(closed.out,0);
});

test('loading an old excavated channel activates finite water without requiring another terrain edit',()=>{
 const f=worldFixture(),e=f.world.hydrology;
 e.restore({version:2,cells:[],flows:[[4,1,.75,.5,'lake']]});
 e.reconcileChunk(f.chunk);
 assert.ok(e.basins.ownsColumn(4,1));assert.equal(e.flowCells.has('4,1'),false);
 assert.ok(Math.abs(e.basins.total()-6.5)<1e-9);
 for(let i=0;i<400;i++)e.update(.1);
 assert.ok(Math.abs(e.basins.balanceError())<1e-8);
 const heads=[1,2,3,4,5,6].map(x=>f.chunk.waterColumns[32+x].y+.25);
 assert.ok(Math.max(...heads)-Math.min(...heads)<.01);
});

test('a real spring continues beneath a roof and retains its inlet after reloading',()=>{
 const prepare=()=>{
  const f=worldFixture();f.blocks.set('1,4,1',3);
  for(const rows of [f.chunk.waterColumns,f.chunk.naturalWaterColumns])rows[33]={...rows[33],kind:'river',source:true};
  return f;
 };
 const f=prepare(),e=f.world.hydrology;e.onBlockEdit(4,1,1);
 assert.ok(e.basins.columns.get('1,1').nodes.some(n=>!n.outdoor&&n.sourceRate>0));
 const restored=prepare();restored.world.hydrology.restore(e.snapshot());restored.world.hydrology.reconcileChunk(restored.chunk);
 assert.ok(restored.world.hydrology.basins.columns.get('1,1').nodes.some(n=>!n.outdoor&&n.sourceRate>0));
});
