import test from 'node:test';
import assert from 'node:assert/strict';
import {SHAPES,canonicalBlock,placementVariant,rayShape,surfaceHeight,surfacePatches} from '../scripts/constructionShapes.js';
import {pickVoxel} from '../scripts/voxelPicking.js';
import {snowSurfaces} from '../scripts/snowSurfaces.js';
import {evolveSoil} from '../scripts/soilEvolution.js';
import {WaterEnvironment,ColumnWaterMap} from '../scripts/waterEnvironment.js';
import {ITEM_BY_ID,RECIPES,Inventory} from '../scripts/inventory.js';
import {TOOL_PROFILES,harvestLevel,requiredHarvestLevel} from '../scripts/toolProfiles.js';
import {FURNACE_RECIPES} from '../scripts/stations.js';

test('all construction orientations share a catalog item and retain exact picking surfaces',()=>{
 for(const [id,s] of SHAPES){
  assert.ok(ITEM_BY_ID[canonicalBlock(id)]);assert.ok(s.boxes.length<=8);
  for(const b of s.boxes){assert.ok(b.halfY>0);assert.ok(Math.abs(b.offsetY)+b.halfY<=.50001);}
  for(const x of [-.25,.25])for(const z of [-.25,.25]){
   const hit=rayShape(id,{x,y:2,z},{x:0,y:-1,z:0});assert.ok(hit);
   assert.ok(Math.abs((2-hit.distance)-surfaceHeight(id,x,z))<1e-8,`surface and picking agree for ${id}`);
  }
  assert.ok(surfacePatches(id).every(p=>p.corners.every(c=>c.every(Number.isFinite))));
 }
 assert.deepEqual([0,1,2,3].map(q=>placementVariant(35,[{x:0,z:1},{x:1,z:0},{x:0,z:-1},{x:-1,z:0}][q])),[35,36,37,38]);
 assert.equal(placementVariant(33,undefined,{y:-1}),47);assert.equal(canonicalBlock(47),33);
});
test('a ray passes through the empty half of a slab and the open half above a stair',()=>{
 const world={getBlockId:(x,y,z)=>y===0&&z===0?(x===0?33:x===2?3:0):0};
 const high=pickVoxel(world,{x:-2,y:.25,z:0},{x:1,y:0,z:0},7);
 assert.equal(high.x,2,'a full cube behind the open slab is selected');
 assert.equal(pickVoxel(world,{x:-2,y:-.25,z:0},{x:1,y:0,z:0},7).x,0);
 assert.equal(rayShape(35,{x:-2,y:.25,z:-.25},{x:1,y:0,z:0}),null);
 assert.ok(rayShape(35,{x:-2,y:.25,z:.25},{x:1,y:0,z:0}));
});
test('snow covers slabs, stair treads and inclined roofs at their actual height',()=>{
 for(const id of [33,34,35,36,39,43,44,49]){
  const {powder}=snowSurfaces([{id,x:0,z:0,y:2,depth:.1}]);assert.ok(powder.length>0);
  assert.ok(powder.every(Number.isFinite));
  const highest=Math.max(...powder.filter((_,i)=>i%3===1));
  assert.ok(Math.abs(highest-(id===33||id===34||id===49?2.102:2.602))<1e-8);
 }
});
test('uniform snow merges its tops and hides interior walls instead of drawing five faces per tile',()=>{
 const cells=Array.from({length:1024},(_,i)=>({x:i%32,z:Math.floor(i/32),y:0,id:2,depth:.12,ice:0}));
 const {powder}=snowSurfaces(cells),oldVertices=cells.length*5*6;
 assert.ok(powder.length/3<oldVertices*.05,`${powder.length/3} vertices instead of ${oldVertices}`);
 const two=snowSurfaces(cells.map(c=>({...c,ice:.06})));assert.ok((two.ice.length+two.powder.length)/3<oldVertices*.1);
});
test('moist exposed dirt grows grass in sunshine, nearby grass accelerates it, roofs and water prevent it',()=>{
 const run=options=>{let r={moisture:.8};for(let i=0;i<80;i++)r=evolveSoil(r,{hour:12,temperature:10},1,options);return r;};
 assert.equal(run({neighbor:true}).growth,1);assert.ok(run({neighbor:false}).growth<1);
 assert.equal(run({neighbor:true,covered:true}).growth,0);assert.equal(run({neighbor:true,wet:true}).growth,0);
 let moist={moisture:.1};moist=evolveSoil(moist,{rain:1,hour:12,temperature:10},8);assert.ok(moist.moisture>.35);
 assert.equal(evolveSoil({moisture:.8},{hour:0,temperature:5},8,{neighbor:true}).growth,0);
});
test('soil transformation stores a material edit and preserves its moisture without activating water physics',()=>{
 let id=2,changes=0;const chunk={loaded:true,position:{x:0,z:0}};
 const world={type:'classic',params:{terrain:{waterOffset:0}},chunkSize:{width:32},getChunk:()=>chunk,getBlockId:(x,y,z)=>y===0?(x===0&&z===0?id:1):0,replaceBlock(x,y,z,next,physical){assert.equal(physical,false);id=next;changes++;return true;}};
 const env=new WaterEnvironment(world),c={x:0,z:0,top:0};
 env.updateSoil(c,{rain:1,temperature:10,hour:12},8);
 for(let i=0;i<100;i++)env.updateSoil(c,{temperature:10,hour:12},1);
 assert.equal(id,1);assert.equal(changes,1);
 const restored=new WaterEnvironment(world);restored.restore(env.snapshot());assert.deepEqual(restored.snapshot(),env.snapshot());
});
test('column water lookup avoids scanning unrelated saved water and keeps its index current',()=>{
 const map=new ColumnWaterMap();map.set('1,2,0.5',3);map.set('1,2,5.5',2);map.delete('1,2,0.5');assert.deepEqual([...map.byColumn.get('1,2')],['1,2,5.5']);map.clear();assert.equal(map.byColumn.size,0);
 const world={type:'classic',params:{seed:0,terrain:{waterOffset:0}},chunkSize:{width:32,height:16},getChunk:()=>({loaded:true,position:{x:0,z:0}}),getBlockId:(x,y,z)=>y===0||y===8?3:0};
 const env=new WaterEnvironment(world);for(let i=0;i<16000;i++)env.water.set(`${i+100},0,0.5`,0);
 env.water[Symbol.iterator]=()=>{throw Error('global water scan');};
 assert.ok(env.readColumn(0,0));assert.ok(env.water.size>=16000);
});
test('new resources, construction and spear have crafting, processing and survival harvest rules',()=>{
 for(const id of [32,33,34,35,39,43,49,51,52,53,'spear'])assert.ok(RECIPES.some(r=>r.output===id));
 assert.equal(FURNACE_RECIPES.raw_gold,'gold_ingot');assert.ok(TOOL_PROFILES.spear.reach>TOOL_PROFILES.sword.reach);
 assert.equal(harvestLevel('spear',3),-1);assert.equal(requiredHarvestLevel(31),3);
 const inventory=new Inventory();inventory.mode='survival';assert.ok(inventory.add('spear'));assert.ok(inventory.has('spear'));
});

test('half-height water on a lower slab keeps its exact floor and visible free surface',async()=>{
 const {voxelWaterColumn}=await import('../scripts/waterVoxelsV1134.js');
 const {exposedLiquidTop,exposedLiquidIntervals}=await import('../scripts/liquidShell.js');
 const water=voxelWaterColumn({finite:true,dynamic:true,kind:'river',bed:7,depth:.2,y:6.95},.5);
 assert.equal(water.bottom,7);assert.equal(water.top,7.2);
 assert.ok(exposedLiquidTop(7.2,y=>y===7?33:0));
 assert.deepEqual(exposedLiquidIntervals(6.5,7.2,[],y=>y===7?33:0),[{bottom:7,top:7.2}]);
});
