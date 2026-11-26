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

function publicationFixture(){
 const chunks=new Map(),calls=[];
 for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)chunks.set(`${x},${z}`,{loaded:true,position:{x:x*32,z:z*32},waterColumns:Array(1024),hydrologyGround:new Float32Array(1024).fill(100),refreshWater(){calls.push(`${x},${z}`);}});
 const world={chunkSize:{width:32,height:32},getChunk:(x,z)=>chunks.get(`${x},${z}`)};
 const env={water:new Map(),columns:new Map(),revision:0};
 const b=new BasinHydrology({world,environment:env,onChange(){}});
 const put=(x,z,volume=1,bottom=.5,outdoor=true)=>{
  const id=`${x},${z}`,c=cell(x,z,volume,bottom,20.5,outdoor),chunk=world.getChunk(Math.floor(x/32),Math.floor(z/32));
  b.nodes.set(`${id},${bottom}`,c);b.columns.set(id,{x,z,chunk,index:(z%32)*32+x%32,top:0,nodes:[c]});b.dirty.add(id);return c;
 };
 return {b,env,chunks,calls,put};
}

test('surface publication touches only chunks sharing the changed vertices and defers mesh work',()=>{
 for(const [x,z,count] of [[10,10,1],[0,10,2],[0,0,4]]){
  const f=publicationFixture();f.put(x,z);f.b.publish();
  assert.equal(f.calls.length,0,'publication never performs a synchronous mesh burst');
  assert.equal(f.b.meshQueue.size,count);
  while(f.b.meshQueue.size){const before=f.calls.length;f.b.flushMeshes();assert.equal(f.calls.length-before,1);}
  assert.equal(f.calls.length,count);assert.equal(f.env.revision,0,'surface-only changes do not rebuild all cave and snow meshes');
 }
});

test('publication deletes old cavity spans directly without scanning unrelated water',()=>{
 const f=publicationFixture();const c=f.put(10,10,.7,2.5,false);
 f.env.columns.set('10,10',{cavities:[cell(10,10,.3,.5,1.5,false)]});
 f.env.water.set('10,10,0.5',.3);f.env.water.set('1000,1000,0.5',.9);
 f.env.water.keys=()=>{throw Error('global water scan');};
 f.b.publish();assert.equal(f.env.water.has('10,10,0.5'),false);
 assert.equal(f.env.water.get('10,10,2.5'),c.volume);assert.equal(f.env.water.get('1000,1000,0.5'),.9);
 assert.equal(f.env.revision,1,'wet cavities still invalidate their presentation');
});

test('cached basin connections rebuild after chunk unloading and reloading',()=>{
 const f=publicationFixture();f.put(10,10,2);f.put(11,10,0);f.b.ledger.initial=2;
 f.b.update(.1);assert.ok(f.b.nodes.get('11,10,0.5').volume>0);
 const old=f.b.active,totalBefore=f.b.total();f.chunks.get('0,0').loaded=false;
 f.b.update(.1);assert.notEqual(f.b.active,old);assert.equal(f.b.active.size,0);assert.equal(f.b.total(),totalBefore);
 f.chunks.get('0,0').loaded=true;f.b.update(.1);assert.equal(f.b.active.size,2);
 assert.ok(Math.abs(f.b.balanceError())<1e-9);
});

test('slow frames run at most one physical step and one mesh rebuild',()=>{
 const f=publicationFixture();f.put(10,10,2);f.put(11,10,0);f.b.publish();
 let steps=0;const expand=f.b.expand.bind(f.b);f.b.expand=()=>{steps++;expand();};
 f.b.update(2);assert.equal(steps,1);assert.equal(f.calls.length,1);
});

test('large lake discovery stays local instead of consuming every construction slot',()=>{
 const chunk={loaded:true,position:{x:0,z:0},waterColumns:Array.from({length:4096},()=>({kind:'lake',bed:.5,y:2.25,depth:2})),hydrologyGround:new Float32Array(4096).fill(.5),refreshWater(){}};
 const world={chunkSize:{width:64,height:16},getChunk:(x,z)=>x===0&&z===0?chunk:null,getBlockId:(x,y,z)=>y===0?3:0};
 const engine={world,environment:{water:new Map(),columns:new Map(),ledger:{displaced:0},revision:0},flowCells:new Map(),pressureVolumes:new Map(),pressureInlets:new Map(),pressureDrains:new Map(),onChange(){}};
 const b=new BasinHydrology(engine);b.edit(32,1,32);
 assert.ok(b.columns.size<=70,'one edit cannot scan the whole lake');assert.ok(b.activation.length>0);
 for(let i=0;i<300&&b.columns.size<4096;i++)b.expand();
 assert.ok(b.columns.size<800);assert.equal(b.total(),b.columns.size*2);assert.equal(b.balanceError(),0);
});

test('an existing full simulation domain still admits a freshly excavated lake outlet',()=>{
 const width=128,height=16,waterColumns=Array(width*width).fill(null),ground=new Float32Array(width*width).fill(10.5);
 const chunk={loaded:true,position:{x:0,z:0},waterColumns,hydrologyGround:ground,refreshWater(){}};
 const world={chunkSize:{width,height},getChunk:(x,z)=>x===0&&z===0?chunk:null,getBlockId:(x,y,z)=>y===0?3:(x<64&&z<64||x>=64&&x<=70&&z===32)?0:y<=10?3:0};
 const engine={world,environment:{water:new Map(),columns:new Map(),ledger:{displaced:0},revision:0},flowCells:new Map(),pressureVolumes:new Map(),pressureInlets:new Map(),pressureDrains:new Map(),onChange(){}};
 const b=new BasinHydrology(engine);
 for(let z=0;z<64;z++)for(let x=0;x<64;x++){
  const id=`${x},${z}`,c=cell(x,z,2,.5,15.5);b.nodes.set(`${id},0.5`,c);
  b.columns.set(id,{x,z,chunk,index:z*width+x,top:0,nodes:[c]});
  ground[z*width+x]=.5;waterColumns[z*width+x]={kind:'lake',bed:.5,y:2.25,depth:2,dynamic:true,finite:true};
 }
 for(let x=64;x<=70;x++)ground[32*width+x]=.5;
 b.savedNodes=b.nodes.size;b.ledger.initial=b.total();b.edit(64,1,32);
 for(let i=0;i<20;i++)b.update(.1);
 assert.ok(b.nodes.get('64,32,0.5')?.volume>0,'excavation must receive water even when the old lake occupied every active slot');
 assert.ok(Math.abs(b.balanceError())<1e-8);
 const snapshot=b.snapshot(),before=b.total();assert.ok(snapshot.columns.length>4096);
 const recovered=new BasinHydrology(engine);recovered.restore(JSON.parse(JSON.stringify(snapshot)));recovered.reconcileChunk(chunk);
 assert.ok(Math.abs(recovered.total()-before)<1e-8,'passive and active volumes survive a reload together');
 assert.ok(recovered.restored.has('0,0'));assert.equal(chunk.waterColumns[0].depth,2,'a parked lake keeps its stored presentation on reload');
 recovered.setFocus(0,0);recovered.update(.1);
 assert.ok(recovered.columns.has('0,0'),'returning to parked water reactivates it');
 assert.ok(Math.abs(recovered.balanceError())<1e-8);
});

function aqueductFixture(sealed=false){
 const width=32,height=16,blocks=new Map(),chunks=new Map();
 const solid=(x,y,z)=>blocks.set(`${x},${y},${z}`,3);
 for(let x=0;x<=42;x++)for(let z=0;z<3;z++){
  solid(x,0,z);
  if(x<=4)for(let y=1;y<=4;y++)solid(x,y,z);
  else solid(x,5,z); // Suspended deck, open air underneath.
  if(z!==1||x===0||x===41||x===42)for(let y=1;y<=8;y++)solid(x,y,z);
 }
 if(sealed)for(let y=6;y<=8;y++)solid(5,y,1);
 for(let cx=0;cx<2;cx++){
  const chunk={loaded:true,position:{x:cx*width,z:0},waterColumns:Array(1024).fill(null),hydrologyGround:new Float32Array(1024).fill(8.5),refreshWater(){}};
  for(let x=Math.max(1,cx*width);x<=Math.min(40,cx*width+31);x++){
   const index=width+x-cx*width;chunk.hydrologyGround[index]=x<=4?4.5:5.5;
   if(x<=4)chunk.waterColumns[index]={kind:'lake',bed:4.5,y:6.25,depth:2,stable:true};
  }
  chunk.naturalWaterColumns=chunk.waterColumns.map(c=>c?{...c}:null);chunk.naturalWaterGround=chunk.hydrologyGround.slice();
  chunks.set(`${cx},0`,chunk);
 }
 const world={type:'classic',params:{seed:1,terrain:{waterOffset:0}},hybrid:{hydrographyVersion:3},chunkSize:{width,height},getChunk:(x,z)=>chunks.get(`${x},${z}`),getBlockId:(x,y,z)=>x<0||x>42||z<0||z>2?3:blocks.get(`${x},${y},${z}`)||0};
 world.hydrology=new HydrologyEngine(world);return {world,chunks,blocks};
}

test('a suspended aqueduct crosses a chunk border, levels and retains water above its deck',()=>{
 const f=aqueductFixture(),e=f.world.hydrology;e.onBlockEdit(5,6,1);
 for(let i=0;i<600;i++)e.update(.1,{x:Math.min(36,5+i/10),z:1});
 const b=e.basins,depth=x=>b.columns.get(`${x},1`)?.nodes.find(n=>n.outdoor)?.volume||0;
 assert.ok(depth(40)>.02,'water reaches the far end of the elevated canal in the next chunk');
 assert.ok(depth(1)<2,'the lake pays for the canal');
 const heads=Array.from({length:40},(_,i)=>{const c=b.columns.get(`${i+1},1`)?.nodes.find(n=>n.outdoor);return c?c.bottom+c.volume:0;});
 assert.ok(Math.max(...heads)-Math.min(...heads)<.02,'a closed aqueduct becomes level');
 assert.ok([...b.nodes.values()].filter(n=>n.x>=5&&n.bottom<5.5).every(n=>n.volume===0),'solid deck prevents water entering the air underneath');
 assert.ok(Math.abs(b.balanceError())<1e-8);
 const reload=aqueductFixture();reload.world.hydrology.restore(e.snapshot());
 for(const chunk of reload.chunks.values())reload.world.hydrology.reconcileChunk(chunk);
 assert.ok(Math.abs(reload.world.hydrology.basins.total()-b.total())<1e-9);
 assert.ok(reload.chunks.get('1,0').waterColumns[32+8]?.depth>.02);
});

test('sealing and reopening the aqueduct inlet controls actual transfer',()=>{
 const f=aqueductFixture(true),e=f.world.hydrology;e.onBlockEdit(5,6,1);
 for(let i=0;i<100;i++)e.update(.1,{x:12,z:1});
 assert.equal(e.basins.columns.get('6,1')?.nodes.find(n=>n.outdoor)?.volume||0,0);
 for(let y=6;y<=8;y++)f.blocks.delete(`5,${y},1`);
 e.onBlockEdit(5,6,1);
 for(let i=0;i<100;i++)e.update(.1,{x:12,z:1});
 assert.ok(e.basins.columns.get('6,1')?.nodes.find(n=>n.outdoor)?.volume>0);
 assert.ok(Math.abs(e.basins.balanceError())<1e-8);
});

function waterfallFixture(){
 const width=32,height=16,blocks=new Map(),chunks=new Map();
 for(let x=0;x<64;x++)for(let z=0;z<3;z++)for(let y=0;y<=10;y++){
  const floor=x<=40?4:0;
  if(y<=floor||z!==1||x===0||x===63)blocks.set(`${x},${y},${z}`,3);
 }
 for(let cx=0;cx<2;cx++){
  const chunk={loaded:true,position:{x:cx*32,z:0},waterColumns:Array(1024).fill(null),hydrologyGround:new Float32Array(1024).fill(10.5),refreshWater(){}};
  for(let x=Math.max(1,cx*32);x<Math.min(63,(cx+1)*32);x++){
   const index=32+x-cx*32,bed=x<=40?4.5:.5;chunk.hydrologyGround[index]=bed;
   chunk.waterColumns[index]={kind:'river',bed,y:bed+.75,depth:1,flowX:1,flowZ:0,source:x===1,stable:true};
  }
  chunk.naturalWaterColumns=chunk.waterColumns.map(c=>c?{...c}:null);chunk.naturalWaterGround=chunk.hydrologyGround.slice();chunks.set(`${cx},0`,chunk);
 }
 const world={type:'classic',params:{seed:1,terrain:{waterOffset:0}},hybrid:{hydrographyVersion:3},chunkSize:{width,height},getChunk:(x,z)=>chunks.get(`${x},${z}`),getBlockId:(x,y,z)=>x<0||x>=64||z<0||z>2?3:blocks.get(`${x},${y},${z}`)||0};
 world.hydrology=new HydrologyEngine(world);return {world,chunks,blocks};
}

test('editing a waterfall retains upstream supply when its spring is outside the local domain but upstream chunks are loaded',()=>{
 const f=waterfallFixture(),e=f.world.hydrology;f.blocks.set('41,1,1',3);e.onBlockEdit(41,1,1);
 for(let i=0;i<400;i++)e.update(.1,{x:41,z:1});
 assert.ok(e.basins.ledger.supplied>1,'the local river remains connected to its upstream background reach');
 assert.ok(e.basins.columns.get('40,1')?.nodes.some(c=>c.volume>.01&&c.fallRate>.001),'the waterfall lip keeps discharging after consuming its initial volume');
 assert.ok(Math.abs(e.basins.balanceError())<1e-8);
});


test('a solid upstream dam cuts waterfall inflow and reopening restores it',()=>{
 const f=waterfallFixture(),e=f.world.hydrology;e.onBlockEdit(41,1,1);
 for(let i=0;i<300;i++)e.update(.1,{x:41,z:1});
 for(let y=5;y<=10;y++)f.blocks.set(`28,${y},1`,3);
 e.onBlockEdit(28,5,1);
 const downstream=()=>[...e.basins.nodes.values()].filter(c=>c.x>=28).reduce((s,c)=>s+c.volume,0);
 const trapped=downstream();
 for(let i=0;i<1000;i++)e.update(.1,{x:35,z:1});
 const lip=()=>e.basins.columns.get('40,1')?.nodes.find(c=>c.outdoor);
 assert.ok(downstream()<=trapped+1e-8,'the sealed downstream volume has no continuing artificial recharge');
 const residual=lip()?.fallRate||0;
 assert.ok([...e.basins.nodes.values()].filter(c=>c.x>=28).every(c=>c.sourceRate===0));
 for(let y=5;y<=10;y++)f.blocks.delete(`28,${y},1`);
 e.onBlockEdit(28,5,1);
 for(let i=0;i<400;i++)e.update(.1,{x:35,z:1});
 assert.ok(lip()?.fallRate>Math.max(.001,residual),'physical reconnection restores the waterfall');
 assert.ok(Math.abs(e.basins.balanceError())<1e-8);
});

test('upstream boundary supply survives saved waterfall edits and reloading',()=>{
 const f=waterfallFixture(),e=f.world.hydrology;f.blocks.set('41,1,1',3);e.onBlockEdit(41,1,1);
 for(let i=0;i<100;i++)e.update(.1,{x:41,z:1});
 const saved=e.snapshot(),before=e.basins.total(),reload=waterfallFixture();reload.blocks.set('41,1,1',3);
 const r=reload.world.hydrology;r.restore(saved);for(const chunk of reload.chunks.values())r.reconcileChunk(chunk);
 assert.ok(Math.abs(r.basins.total()-before)<1e-9);
 for(let i=0;i<300;i++)r.update(.1,{x:41,z:1});
 assert.ok(r.basins.ledger.supplied>1);assert.ok(r.basins.columns.get('40,1').nodes.some(c=>c.fallRate>.001));
 assert.ok(Math.abs(r.basins.balanceError())<1e-8);
});

test('slow current changes publish velocity without queueing whole water meshes',()=>{
 const f=publicationFixture(),a=f.put(10,10,1.01),b=f.put(11,10,1);
 for(const c of [a,b]){c.finite=true;c.kind='river';}
 let attributeUpdates=0;f.chunks.get('0,0').refreshWaterFlow=()=>attributeUpdates++;
 f.b.publish();while(f.b.meshQueue.size)f.b.flushMeshes();const meshes=f.calls.length;
 f.b.update(.1);
 assert.equal(f.b.dirty.size,0,'subthreshold level changes do not change the surface geometry');
 assert.ok(f.b.flowDirty.size>0,'the visible slow current is still updated');
 f.b.publish();assert.equal(f.b.meshQueue.size,0);assert.equal(f.calls.length,meshes);assert.equal(attributeUpdates,1);
 assert.ok(f.chunks.get('0,0').waterColumns[32*10+10].flowX>0);
 assert.equal(f.env.revision,0);assert.equal(f.env.flowRevision,1);
});


test('a newly visible thin film still changes geometry rather than only velocity',()=>{
 const f=publicationFixture(),a=f.put(10,10,.04),b=f.put(11,10,0);
 for(const c of [a,b]){c.finite=true;c.kind='river';}
 f.b.publish();while(f.b.meshQueue.size)f.b.flushMeshes();f.b.update(.1);
 assert.ok(b.volume>.001&&b.volume<.002);
 assert.ok(f.b.dirty.has('11,10'),'crossing the visibility threshold needs a new surface');
 f.b.publish();assert.ok(f.b.meshQueue.size>0);
});


test('an open sea boundary discharges excess, preserves sea level and accounts every removed volume',()=>{
 const c={...cell(0,0,4),oceanHead:2.5},nodes=new Map([['sea',c]]),initial=total(nodes);
 let discharged=0;for(let i=0;i<100;i++)discharged+=stepBasinWater(nodes,.1).discharged;
 assert.ok(c.volume>=2&&c.volume<2.000001);
 assert.ok(Math.abs(total(nodes)+discharged-initial)<1e-10);
 c.volume=1;assert.equal(stepBasinWater(nodes,.1).discharged,0);assert.equal(c.volume,1,'a sea outlet does not create replenishment');
});

test('only original unmarked sea water becomes an outlet; stable lakes stay finite after reload',()=>{
 for(const sea of [false,true]){
  const f=worldFixture();
  if(sea)for(const rows of [f.chunk.waterColumns,f.chunk.naturalWaterColumns])for(let x=1;x<=3;x++)rows[32+x]={...rows[32+x],stable:false,source:false};
  const b=f.world.hydrology.basins;b.edit(4,1,1);
  const seaNodes=[...b.nodes.values()].filter(c=>Number.isFinite(c.oceanHead));
  assert.equal(seaNodes.length,sea?3:0);assert.ok(seaNodes.every(c=>c.outdoor));
  b.exchange(1,1,.5,3);for(let i=0;i<100;i++)b.update(.1);
  assert.equal(b.ledger.discharged>0,sea);assert.ok(Math.abs(b.balanceError())<1e-8);
  const snapshot=b.snapshot(),r=worldFixture();
  if(sea)for(const rows of [r.chunk.waterColumns,r.chunk.naturalWaterColumns])for(let x=1;x<=3;x++)rows[32+x]={...rows[32+x],stable:false,source:false};
  r.world.hydrology.basins.restore(snapshot);r.world.hydrology.reconcileChunk(r.chunk);
  const restored=r.world.hydrology.basins;
  assert.equal([...restored.nodes.values()].filter(c=>Number.isFinite(c.oceanHead)).length,sea?3:0);
  assert.ok(Math.abs(restored.total()-b.total())<1e-8);assert.ok(Math.abs(restored.balanceError())<1e-8);
 }
});


test('water spreading onto originally dry land never creates a new ocean outlet',()=>{
 const f=worldFixture();f.chunk.waterColumns[36]={bed:.5,y:1.25,depth:1,kind:'lake',finite:true,dynamic:true,stable:false,source:false};
 const b=f.world.hydrology.basins;b.edit(4,1,1);
 assert.ok(b.columns.has('4,1'));assert.ok(b.columns.get('4,1').nodes.every(c=>!Number.isFinite(c.oceanHead)));
});
