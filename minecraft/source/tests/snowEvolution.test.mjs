import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceTemperature,evolveSnow} from '../scripts/snowEvolution.js';
import {WaterEnvironment} from '../scripts/waterEnvironment.js';
import {Inventory,RECIPES} from '../scripts/inventory.js';
import {TOOL_PROFILES,harvestLevel} from '../scripts/toolProfiles.js';
import {readFileSync} from 'node:fs';

test('game climate is colder at night and altitude, and snowfall is below freezing',()=>{
 assert.ok(surfaceTemperature('classic',{hour:0})<0);
 assert.ok(surfaceTemperature('classic',{hour:12})>0);
 assert.ok(surfaceTemperature('classic',{hour:12},70)<surfaceTemperature('classic',{hour:12},12));
 assert.ok(surfaceTemperature('jungle',{hour:0})>0);
 assert.ok(surfaceTemperature('classic',{hour:12,snow:1})<0);
});
test('snow only hardens after sustained frost, keeps its volume and progressively thaws with warmth',()=>{
 let record={depth:.12};
 for(let i=0;i<29;i++)record=evolveSnow(record,{temperature:-5},1);
 assert.equal(record.ice,0);
 for(let i=0;i<40;i++)record=evolveSnow(record,{temperature:-5},1);
 assert.equal(record.depth,.12);assert.ok(record.ice>.1&&record.ice<=record.depth);
 const frozen=record.ice;
 record=evolveSnow(record,{temperature:8,rain:.5},8);
 assert.ok(record.depth<.12&&record.ice<frozen&&record.ice>0,'thaw is gradual, not an instant replacement');
 for(let i=0;i<1000;i++)record=evolveSnow(record,{temperature:12},1);
 assert.equal(record.depth,0);assert.equal(record.ice,0);
});
function fixture(){
 const world={type:'classic',chunkSize:{width:32,height:32},getBlockId:(x,y,z)=>y===5?2:0,getChunk:()=>({loaded:true,position:{x:0,z:0}}),params:{seed:0,terrain:{waterOffset:0}}};
 return {world,model:new WaterEnvironment(world)};
}
test('broom removes loose snow, preserves the frozen crust and never edits the underlying block',()=>{
 const {world,model}=fixture();model.snow.set('0,0',{x:0,z:0,y:5,depth:.18,ice:.06,cold:50});
 assert.equal(model.clearSurface(0,4,0,'broom'),false,'cannot sweep through the floor');
 while(model.clearSurface(0,5,0,'broom')){}
 assert.equal(model.snow.get('0,0').depth,.06);
 assert.equal(model.clearSurface(0,5,0,'broom'),false);
 assert.equal(model.clearSurface(0,5,0,'pickaxe'),true);assert.equal(model.snow.size,0);
 assert.equal(world.getBlockId(0,5,0),2);
});
test('surface evolution and sweeping survive save/reload and do not invalidate water geometry',()=>{
 const {model}=fixture(),c={x:0,z:0,top:5},waterRevision=model.revision;
 for(let i=0;i<15;i++)model.updateSnow(c,{snow:1,temperature:-5},8);
 const r=model.snow.get('0,0');assert.ok(r.ice>0&&r.depth>0);
 assert.equal(model.revision,waterRevision);assert.ok(model.snowRevision>0);
 const restored=fixture().model;restored.restore(model.snapshot());assert.deepEqual(restored.snapshot(),model.snapshot());
 const before=restored.snapshot();restored.update(8,{x:0,y:6,z:0},{temperature:12},false);assert.deepEqual(restored.snapshot(),before);
});
test('broom is equipable in creative, has a survival recipe and cannot harvest blocks',()=>{
 const inventory=new Inventory();inventory.mode='creative';assert.ok(inventory.has('broom'));
 assert.equal(TOOL_PROFILES.broom.kind,'broom');assert.equal(harvestLevel('broom',2),-1);
 assert.ok(RECIPES.some(r=>r.output==='broom'));
});
test('actual input routing sweeps or breaks the crust before considering the underlying block',()=>{
 const source=readFileSync(new URL('../scripts/player.js',import.meta.url),'utf8');
 const start=source.indexOf('  onMouseDown(event) {'),end=source.indexOf('\n  /**',start);
 const method=new Function('TOOL_PROFILES','ITEM_BY_ID',`return ({${source.slice(start,end)}}).onMouseDown`)(TOOL_PROFILES,{});
 const {model}=fixture();model.snow.set('0,0',{x:0,z:0,y:5,depth:.12,ice:.06,cold:50});
 let broken=0,swings=0;
 const player={controls:{isLocked:true},mineMode:true,equippedToolId:'broom',inventory:{has:()=>true},mineCoords:{x:0,y:5,z:0},world:{hydrology:{environment:model}},animateSwing:()=>swings++,onFeedback(){},breakAt(){broken++;return true;}};
 method.call(player,{button:0});assert.equal(broken,0);assert.equal(swings,1);
 player.equippedToolId='basic_pickaxe';method.call(player,{button:0});assert.equal(broken,0);assert.equal(model.snow.size,0);
 method.call(player,{button:0});assert.equal(broken,1,'a second intentional pickaxe strike can mine the exposed ground');
});


test('subvisible snowfall accumulates at frame rate instead of disappearing between small steps',()=>{
 const small=fixture().model,large=fixture().model,c={x:0,z:0,top:5},weather={snow:1,temperature:-4};
 for(let i=0;i<480;i++)small.updateSnow(c,weather,1/60);
 large.updateSnow(c,weather,8);
 assert.ok(small.snow.get('0,0').depth>.0199);
 assert.ok(Math.abs(small.snow.get('0,0').depth-large.snow.get('0,0').depth)<1e-10);
});
