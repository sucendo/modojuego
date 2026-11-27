// Persistent, serializable workstations. No Three.js or DOM dependencies.
import { ITEM_BY_ID } from './inventory.js';

export const FURNACE_RECIPES = Object.freeze({
  raw_iron: 'iron_ingot',
  raw_gold: 'gold_ingot',
  '8': 17, // sand -> glass
  '6': 'charcoal', // wood -> charcoal
  '11': 'charcoal',
  raw_meat: 'cooked_meat'
});
export const FURNACE_FUELS = new Set(['coal', 'charcoal', 15, 6, 11]);
export const STATION_TYPES = Object.freeze({25:'chest',26:'furnace'});
export const stationKey = (x,y,z) => `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
const copy = stack => stack ? {id: stack.id, count: stack.count} : null;
const canMerge = (a,b) => !a || (b && String(a.id)===String(b.id) && a.count+b.count<= (ITEM_BY_ID[a.id]?.maxStack||64));

export function createStation(kind) {
  if (kind === 'chest') return {kind,slots:Array(27).fill(null)};
  if (kind === 'furnace') return {kind,input:null,fuel:null,output:null,processing:null};
  return null;
}
export function getStation(world,x,y,z,blockId) {
  const kind=STATION_TYPES[blockId];
  if (!kind) return null;
  world.stations ||= {};
  const key=stationKey(x,y,z);
  const old=world.stations[key];
  if(!old || old.kind!==kind) world.stations[key]=createStation(kind);
  return world.stations[key];
}
export function stationStacks(station) {
  if(!station)return [];
  return station.kind==='chest' ? station.slots.filter(Boolean)
    : [station.input,station.fuel,station.output].filter(Boolean);
}
export function canBreakStation(world,x,y,z,blockId,inventory) {
  const station=world.stations?.[stationKey(x,y,z)];
  if(!station || !STATION_TYPES[blockId])return true;
  // Keep any stored items safe: ask the player to empty the station before breaking it.
  return stationStacks(station).length===0 && !station.processing;
}
export function takeFromStation(inventory,station,slot) {
  const stack=station.kind==='chest'?station.slots[slot]:station[slot];
  if(!stack || !inventory.canAccept(stack.id,stack.count))return false;
  if(!inventory.add(stack.id,stack.count))return false;
  if(station.kind==='chest')station.slots[slot]=null;else station[slot]=null;
  return true;
}
export function placeInStation(inventory,station,inventoryIndex,slot,requested=1) {
  const item=inventory.getSlot(inventoryIndex);
  if(!item)return false;
  if(station.kind==='furnace') {
    if(slot==='input' && FURNACE_RECIPES[String(item.id)]===undefined)return false;
    if(slot==='fuel' && !FURNACE_FUELS.has(item.id))return false;
    if(!['input','fuel'].includes(slot))return false;
  } else if(!Number.isInteger(slot)||slot<0||slot>=27)return false;
  const target=station.kind==='chest'?station.slots[slot]:station[slot];
  const amount=Math.min(item.count,Math.max(1,Math.floor(requested)));
  if(!canMerge(target,{id:item.id,count:amount}))return false;
  if(target)target.count+=amount;else if(station.kind==='chest')station.slots[slot]={id:item.id,count:amount};
  else station[slot]={id:item.id,count:amount};
  inventory.slots[inventoryIndex].count-=amount;
  if(inventory.slots[inventoryIndex].count===0)inventory.slots[inventoryIndex]=null;
  inventory.notify();return true;
}
export function canStartFurnace(station) {
  if(!station || station.kind!=='furnace' || station.processing || !station.input || !station.fuel)return false;
  const result=FURNACE_RECIPES[String(station.input.id)];
  return result!==undefined && FURNACE_FUELS.has(station.fuel.id) &&
    canMerge(station.output,{id:result,count:1});
}
export function startFurnace(station) {
  if(!canStartFurnace(station))return false;
  const result=FURNACE_RECIPES[String(station.input.id)];
  station.input.count--;if(!station.input.count)station.input=null;
  station.fuel.count--;if(!station.fuel.count)station.fuel=null;
  station.processing={outputId:result,remainingMs:3000};
  return true;
}
export function tickFurnaces(world,dtMs) {
  if(!world.stations || !Number.isFinite(dtMs) || dtMs<=0)return false;
  let changed=false;
  for(const station of Object.values(world.stations)){
    if(station.kind!=='furnace' || !station.processing)continue;
    const process=station.processing;
    process.remainingMs=Math.max(0,process.remainingMs-dtMs);
    if(process.remainingMs<=0){
      if(canMerge(station.output,{id:process.outputId,count:1})){
        if(station.output)station.output.count++;
        else station.output={id:process.outputId,count:1};
        station.processing=null;
        changed=true;
      }
    }
  }
  return changed;
}
export function validateStations(raw,invalid) {
  if(raw===undefined)return {};
  if(!raw || typeof raw!=='object' || Array.isArray(raw) || Object.keys(raw).length>3000)invalid();
  const result={};
  function stack(value){
    if(value===null)return null;
    const item=ITEM_BY_ID[value?.id];
    if(!item || !Number.isInteger(value.count) || value.count<1 || value.count>item.maxStack)invalid();
    return {id:item.id,count:value.count};
  }
  for(const [key,value] of Object.entries(raw)){
    if(!/^-?\d+,\d+,-?\d+$/.test(key)|| !value || typeof value!=='object')invalid();
    const [x,y,z]=key.split(',').map(Number);
    if(!Number.isSafeInteger(x)||!Number.isSafeInteger(z)||Math.abs(x)>1e6||Math.abs(z)>1e6||y<0||y>79)invalid();
    if(value.kind==='chest'){
      if(!Array.isArray(value.slots)||value.slots.length!==27)invalid();
      result[key]={kind:'chest',slots:value.slots.map(stack)};
    } else if(value.kind==='furnace'){
      const processing=value.processing===undefined||value.processing===null?null:value.processing;
      if(processing){
        if(FURNACE_RECIPES && !Object.values(FURNACE_RECIPES).some(v=>String(v)===String(processing.outputId)) ||
           !Number.isFinite(processing.remainingMs) || processing.remainingMs<0 || processing.remainingMs>3000)invalid();
      }
      result[key]={kind:'furnace',input:stack(value.input??null),fuel:stack(value.fuel??null),
        output:stack(value.output??null),processing:processing?{outputId:ITEM_BY_ID[processing.outputId].id,remainingMs:processing.remainingMs}:null};
    } else invalid();
  }
  return result;
}
