/**
 * v11.4.7: conservative, shallow-water pressure above an already settled
 * natural river. A volume is measured in block³ per 1×1 horizontal column.
 * Existing river water is the resting baseline; only the EXTRA water moves.
 * The only additions here are explicitly tagged spring/inlet supplies.
 * Transfers are paired so a spill never creates or consumes a reservoir.
 */
export const PRESSURE_STEP = .25;
export const PRESSURE_LIMIT = 4096;
export const PRESSURE_MIN = .002;
export const PRESSURE_MAX = 12;
const SIDES = [[1,0],[-1,0],[0,1],[0,-1]];
export const pressureKey = (x,z) => `${x},${z}`;
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

/**
 * sample(x,z) -> {bed,baseTop,dammed?,capacity?,roofed?,permeability?,
 *                  oceanSink?} or null (closed/unloaded cell).
 * inlets -> iterable of {damX,damZ,upstream:[{x,z}],rate,headLimit}.
 * Values in `volumes` are fluid above the resting water column, NOT a height.
 */
export function stepPressureV1147(volumes,inlets,sample,dt=PRESSURE_STEP,drains=[],losses={}) {
  if (!(volumes instanceof Map) || !Number.isFinite(dt) || dt <= 0)
    return {volumes:new Map(volumes),added:0,transferred:0,removed:0,
      removedOcean:0,evaporated:0,infiltrated:0};
  const current=new Map(volumes),delta=new Map();
  const add=(k,n)=>delta.set(k,(delta.get(k)||0)+n);
  let added=0,transferred=0,removedOcean=0;
  let supplyBudget=.85*dt;
  const capacity=cell=>clamp(cell?.capacity??PRESSURE_MAX,0,PRESSURE_MAX);
  // A dam captures the continual upstream supply. It does not turn all
  // downstream river blocks into infinite sources.
  for(const inlet of inlets){
    const dam=sample(inlet.damX,inlet.damZ);
    if (!dam?.dammed) continue;
    const sources=inlet.upstream||[];
    for(const {x,z} of sources){
      const cell=sample(x,z);
      if(!cell||cell.dammed||cell.oceanSink)continue;
      const k=pressureKey(x,z),previous=current.get(k)||0;
      // The river continues beneath a bridge, but a roof is not an empty
      // reservoir and cannot store water above its physical lower face.
      const room=clamp((inlet.headLimit ?? dam.bed+.75)-cell.baseTop-previous,
        0,Math.max(0,capacity(cell)-previous));
      const supply=Math.min(room,Math.max(0,inlet.rate??.8)*dt/sources.length,supplyBudget);
      if(supply<=0)continue;
      current.set(k,previous+supply);
      added+=supply;
      supplyBudget-=supply;
    }
  }
  // Every accepted transfer has both a debit and a credit. Check receiving
  // capacity and global active-cell budget BEFORE debiting the donor: the old
  // late 4096-column cutoff silently discarded water from full reservoirs.
  const admitted=new Set();
  let openSlots=Math.max(0,PRESSURE_LIMIT-current.size);
  for(const [k,volume] of current){
    if(volume<=PRESSURE_MIN)continue;
    const [x,z]=k.split(',').map(Number),cell=sample(x,z);
    if(!cell)continue;
    const head=cell.baseTop+volume;
    const candidates=[];
    for(const [dx,dz] of SIDES){
      const nx=x+dx,nz=z+dz,next=sample(nx,nz);
      if(!next)continue;
      const nextKey=pressureKey(nx,nz),nextVolume=current.get(nextKey)||0;
      if(!next.oceanSink &&
        capacity(next)-nextVolume-(delta.get(nextKey)||0)<=PRESSURE_MIN)continue;
      if(!next.oceanSink&&!current.has(nextKey)&&!admitted.has(nextKey)&&!openSlots)continue;
      const threshold=next.dammed?next.bed+.55:next.bed;
      const nextHead=Math.max(next.baseTop+nextVolume,threshold);
      const difference=head-nextHead;
      if(difference>.0005)candidates.push({key:nextKey,difference,next});
    }
    if(!candidates.length)continue;
    const available=volume*.78;
    const totalPotential=candidates.reduce((sum,c)=>sum+c.difference,0);
    const budget=Math.min(available,totalPotential*.52*dt);
    for(const candidate of candidates){
      const wanted=budget*candidate.difference/totalPotential;
      const targetVolume=current.get(candidate.key)||0;
      const room=candidate.next.oceanSink?Infinity:
        Math.max(0,capacity(candidate.next)-targetVolume-(delta.get(candidate.key)||0));
      const transfer=Math.min(wanted,room);
      if(transfer<=1e-8)continue;
      add(k,-transfer);add(candidate.key,transfer);
      if(candidate.next.oceanSink){
        add(candidate.key,-transfer);removedOcean+=transfer;
      }else if(!current.has(candidate.key)&&!admitted.has(candidate.key)){
        admitted.add(candidate.key);openSlots--;
      }
      transferred+=transfer;
    }
  }
  const result=new Map();
  for(const [k,v] of current){
    const next=Math.max(0,v+(delta.get(k)||0));
    if(next>0)result.set(k,next);
    delta.delete(k);
  }
  for(const [k,v] of delta){
    if(v>0)result.set(k,v);
  }
  // Excess reaching an already-running downstream river leaves the local
  // simulated pool. This is an explicit, accounted boundary outflow.
  let removed=removedOcean;
  for(const drain of drains){
    const k=pressureKey(drain.x,drain.z),volume=result.get(k)||0;
    if(volume<=0)continue;
    const out=Math.min(volume,Math.max(0,drain.rate??1)*dt);
    removed+=out;
    if(volume-out>0)result.set(k,volume-out);
    else result.delete(k);
  }
  // Small, explicitly accounted surface losses. Water resting in the natural
  // river is not consumed; only the EXTRA flood volume can seep or evaporate.
  const evaporationRate=Math.max(0,Number(losses.evaporationRate)||0);
  const infiltrationScale=Math.max(0,Number(losses.infiltrationScale)||0);
  const deepDrainRate=Math.max(0,Number(losses.deepDrainRate)||0);
  let evaporated=0,infiltrated=0,deepDrained=0;
  if(evaporationRate||infiltrationScale||deepDrainRate){
    for(const [k,volume] of result){
      const [x,z]=k.split(',').map(Number),cell=sample(x,z);
      if(!cell)continue;
      const evaporation=Math.min(volume,cell.roofed?0:evaporationRate*dt);
      const seepage=Math.min(volume-evaporation,
        Math.max(0,cell.permeability||0)*infiltrationScale*dt);
      const drainage=Math.min(volume-evaporation-seepage,volume*deepDrainRate*dt);
      const next=volume-evaporation-seepage-drainage;
      deepDrained+=drainage;
      evaporated+=evaporation;infiltrated+=seepage;
      if(next>0)result.set(k,next);
      else result.delete(k);
    }
  }
  removed+=evaporated+infiltrated+deepDrained;
  return {volumes:result,added,transferred,removed,
    removedOcean,evaporated,infiltrated,deepDrained};
}
