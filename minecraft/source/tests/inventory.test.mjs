import test from 'node:test';
import assert from 'node:assert/strict';
import { Inventory, INVENTORY_SIZE, ITEM_CATALOG } from '../scripts/inventory.js';

const survival = () => {const i=new Inventory();i.setMode('survival');return i;};

test('creative mode may spawn any object and survival consumes selected stacks',()=>{
  const i=new Inventory();assert.ok(i.assignCreative('stone_pickaxe'));
  assert.equal(i.slots[0].count,1);assert.equal(i.consumeSelected(),true);
  i.setMode('survival');assert.equal(i.consumeSelected(),true);
  assert.equal(i.slots[0],null);
});

test('inventory has exactly 36 slots and stacks split at 64',()=>{
  const i=survival();assert.equal(i.slots.length,INVENTORY_SIZE);
  assert.equal(i.add(6,130),true);
  assert.deepEqual(i.slots.slice(0,3),[{id:6,count:64},{id:6,count:64},{id:6,count:2}]);
  assert.equal(i.moveSlot(0,4,true),true);
  assert.equal(i.slots[0].count,32);assert.equal(i.slots[4].count,32);
  assert.equal(i.moveSlot(4,0),true);assert.equal(i.slots[0].count,64);
  assert.equal(i.slots[4],null);
  assert.equal(i.consume(6,130),true);assert.equal(i.count(6),0);
});

test('2×2 crafting requires a real pattern and consumes one ingredient from each square',()=>{
  const i=survival();i.add(6,1);assert.equal(i.putInCraft(0,0),true);
  assert.equal(i.getRecipe()?.id,'planks');assert.equal(i.craft(),true);
  assert.equal(i.count(15),4);
  const slot=i.slots.findIndex(s=>s?.id===15);
  assert.equal(i.putInCraft(slot,0),true);
  assert.equal(i.putInCraft(slot,1),true);
  assert.equal(i.putInCraft(slot,3),true);
  assert.equal(i.putInCraft(slot,4),true);
  assert.equal(i.getRecipe()?.id,'craftingTable');
  assert.equal(i.craft(),true);assert.equal(i.count(18),1);
  assert.equal(i.setCraftSize(3),true);
});

test('3×3 pickaxe can be crafted from planks and sticks',()=>{
  const i=survival();i.add(18,1);i.setCraftSize(3);
  i.add(15,3);i.add('stick',2);
  for(const cell of [0,1,2])i.putInCraft(i.slots.findIndex(s=>s?.id===15),cell);
  for(const cell of [4,7])i.putInCraft(i.slots.findIndex(s=>s?.id==='stick'),cell);
  assert.equal(i.getRecipe()?.id,'woodPickaxe');
  assert.equal(i.craft(),true);assert.equal(i.count('wood_pickaxe'),1);
  assert.equal(i.setCraftSize(2),true);
});

test('v2 inventory migration preserves overfull materials in reserve',()=>{
  const i=survival();i.restore({mode:'survival',items:{6:3000,15:5,99:50}});
  assert.equal(i.count(6),36*64);
  assert.equal(i.reserve['6'],3000-36*64);
  assert.equal(i.reserve['15'],5);
  const snap=i.snapshot();
  const restored=new Inventory();restored.restore(snap);
  assert.deepEqual(restored.reserve,i.reserve);
  assert.equal(restored.slots.length,36);
  restored.consume(6,64);
  assert.equal(restored.reclaim(6),true);
});

test('unknown items cannot be created and invalid stacks are not restored',()=>{
  const i=survival();assert.equal(i.add('invalid'),false);
  i.restore({mode:'survival',slots:[{id:'stone_pickaxe',count:200},{id:3,count:2},...Array(34).fill(null)],selectedSlot:0,craftSize:2,craftGrid:Array(9).fill(null)});
  assert.equal(i.slots[0],null);assert.equal(i.slots[1].count,2);
  assert.equal(ITEM_CATALOG.some(item=>item.id==='stone_pickaxe'),true);
});


test('recipe book automatically fills a 2×2 pattern and consumes materials',()=>{
  const i=survival();i.add(6,1);
  assert.equal(i.fillRecipe('planks'),true);
  assert.equal(i.count(6),0);
  assert.equal(i.getRecipe()?.id,'planks');
  assert.equal(i.craft(),true);assert.equal(i.count(15),4);
  assert.equal(i.fillRecipe('craftingTable'),true);
  assert.equal(i.getRecipe()?.id,'craftingTable');
  assert.equal(i.craft(),true);assert.equal(i.count(18),1);
});

test('recipe book refuses a 3×3 recipe without a crafting table',()=>{
  const i=survival();i.add(15,3);i.add('stick',2);
  assert.equal(i.fillRecipe('woodPickaxe'),false);
  assert.equal(i.setCraftSize(3),false);
  i.add(18,1);assert.equal(i.setCraftSize(3),true);
  assert.equal(i.fillRecipe('woodPickaxe'),true);
  assert.equal(i.getRecipe()?.id,'woodPickaxe');
});

test('starter hotbars preload new creative and survival worlds without changing legacy inventories', async () => {
  const { createStartingInventory }=await import('../scripts/inventory.js');
  const creative=createStartingInventory('creative');
  assert.equal(creative.slots.length,36);
  assert.deepEqual(creative.slots.slice(0,9).map(stack=>stack.id),[1,2,3,6,8,10,15,16,17]);
  const survival=createStartingInventory('survival');
  assert.equal(survival.slots[0].id,'wood_pickaxe');
  assert.equal(survival.slots[3].id,21);
  const empty=createStartingInventory('survival',false);
  assert.equal(empty.slots.filter(Boolean).length,0);
});

test('torches craft from coal and a stick with 2×2 crafting',()=>{
  const i=survival();i.add('coal',1);i.add('stick',1);
  assert.equal(i.fillRecipe('torches'),true);
  assert.equal(i.getRecipe()?.output,21);
  assert.equal(i.craft(),true);
  assert.equal(i.count(21),4);
});

test('fabric, bed, books, shelves and tables can all be crafted from obtainable materials',()=>{
  const i=survival();i.add(18,1);i.add(15,64);i.add(7,64);i.add('stick',8);
  assert.equal(i.setCraftSize(3),true);
  for(let j=0;j<2;j++){
    assert.equal(i.fillRecipe('fabric'),true);assert.equal(i.craft(),true);
  }
  assert.equal(i.count('fabric'),4);
  assert.equal(i.fillRecipe('bed'),true);assert.equal(i.craft(),true);
  assert.equal(i.count(23),1);
  for(let j=0;j<3;j++){
    assert.equal(i.fillRecipe('paper'),true);assert.equal(i.craft(),true);
    assert.equal(i.fillRecipe('book'),true);assert.equal(i.craft(),true);
  }
  assert.equal(i.count('book'),3);
  assert.equal(i.fillRecipe('bookshelf'),true);assert.equal(i.craft(),true);
  assert.equal(i.count(22),1);
  assert.equal(i.fillRecipe('table'),true);assert.equal(i.craft(),true);
  assert.equal(i.count(24),1);
});

test('right-click interaction with a placed crafting table can unlock 3×3 temporarily',()=>{
  const i=survival();
  assert.equal(i.setCraftSize(3),false);
  i.workbenchAccess=true;
  assert.equal(i.setCraftSize(3),true);
});
