import test from 'node:test';
import assert from 'node:assert/strict';
import { Inventory, ITEM_BY_ID, RECIPES } from '../scripts/inventory.js';
import { getStation, stationKey, canBreakStation, placeInStation, takeFromStation, canStartFurnace,
  startFurnace, tickFurnaces, validateStations } from '../scripts/stations.js';
const inv=()=>{const i=new Inventory();i.setMode('survival');return i;};

test('a chest has 27 independent slots and can store/retrieve items',()=>{
  const world={stations:{}};const chest=getStation(world,4,5,-3,25);
  assert.equal(chest.slots.length,27);
  assert.equal(stationKey(4,5,-3),'4,5,-3');
  const bag=inv();bag.add(15,6);
  assert.equal(placeInStation(bag,chest,0,0,5),true);
  assert.equal(bag.count(15),1);
  assert.deepEqual(chest.slots[0],{id:15,count:5});
  assert.equal(takeFromStation(bag,chest,0),true);
  assert.equal(bag.count(15),6);
  assert.equal(chest.slots[0],null);
});

test('chests refuse incompatible stacks and prevent accidental deletion of stored items',()=>{
  const world={stations:{}};const chest=getStation(world,3,6,4,25);
  const bag=inv();bag.add(15,2);bag.add(3,3);
  assert.equal(placeInStation(bag,chest,0,0),true);
  const stoneIndex=bag.slots.findIndex(s=>s?.id===3);
  assert.equal(placeInStation(bag,chest,stoneIndex,0),false);
  assert.equal(canBreakStation(world,3,6,4,25,bag),false);
  bag.setMode('creative');
  assert.equal(canBreakStation(world,3,6,4,25,bag),false);
  assert.equal(takeFromStation(bag,chest,0),true);
  assert.equal(canBreakStation(world,3,6,4,25,bag),true);
});

test('furnace cooks iron with coal in 3s and conserves inputs/outputs',()=>{
  const world={stations:{}};const furnace=getStation(world,2,3,4,26);
  const bag=inv();bag.add('raw_iron',2);bag.add('coal',2);
  assert.equal(placeInStation(bag,furnace,bag.slots.findIndex(s=>s?.id==='raw_iron'),'input',2),true);
  assert.equal(placeInStation(bag,furnace,bag.slots.findIndex(s=>s?.id==='coal'),'fuel',2),true);
  assert.equal(canStartFurnace(furnace),true);
  assert.equal(startFurnace(furnace),true);
  assert.equal(furnace.input.count,1);
  assert.equal(furnace.fuel.count,1);
  assert.equal(canStartFurnace(furnace),false);
  tickFurnaces(world,1500);
  assert.equal(furnace.processing.remainingMs,1500);
  tickFurnaces(world,1500);
  assert.equal(furnace.processing,null);
  assert.deepEqual(furnace.output,{id:'iron_ingot',count:1});
  assert.equal(takeFromStation(bag,furnace,'output'),true);
  assert.equal(bag.count('iron_ingot'),1);
  assert.equal(startFurnace(furnace),true);
  tickFurnaces(world,3000);
  assert.equal(furnace.output.count,1);
});

test('furnace smelts sand into glass, logs into charcoal and meat into food',()=>{
  for(const [input,expected] of [[8,17],[6,'charcoal'],['raw_meat','cooked_meat']]){
    const station=getStation({stations:{}},1,2,3,26);
    const world={stations:{'1,2,3':station}};
    station.input={id:input,count:1};station.fuel={id:15,count:1};
    assert.equal(startFurnace(station),true);
    assert.equal(tickFurnaces(world,3000),true);
    assert.equal(station.output.id,expected);
  }
});

test('furnace rejects invalid ingredients and output stack overflow',()=>{
  const f=getStation({stations:{}},0,2,2,26);f.input={id:21,count:1};f.fuel={id:'coal',count:1};
  assert.equal(canStartFurnace(f),false);
  f.input={id:8,count:1};f.output={id:17,count:64};
  assert.equal(canStartFurnace(f),false);
  f.output={id:'wool',count:1};assert.equal(canStartFurnace(f),false);
});

test('workstation validation round-trips while rejecting invalid data',()=>{
  const stations={'1,3,-7':{kind:'chest',slots:[{id:15,count:3},...Array(26).fill(null)]},
    '2,8,9':{kind:'furnace',input:null,fuel:null,output:null,processing:{outputId:17,remainingMs:1000}}};
  assert.deepEqual(validateStations(JSON.parse(JSON.stringify(stations)),()=>{throw Error('invalid');}),stations);
  assert.throws(()=>validateStations({'x,y,z':stations['1,3,-7']},()=>{throw Error('invalid');}),/invalid/);
  assert.throws(()=>validateStations({'1,3,5':{kind:'chest',slots:[{id:21,count:999},...Array(26).fill(null)]}},()=>{throw Error('invalid');}),/invalid/);
});

test('chest and furnace recipes are available and creative inventory can select them',()=>{
  assert.ok(RECIPES.some(r=>r.id==='chest'&&r.output===25));
  assert.ok(RECIPES.some(r=>r.id==='furnace'&&r.output===26));
  assert.equal(ITEM_BY_ID[25].blockId,25);assert.equal(ITEM_BY_ID[26].blockId,26);
});
