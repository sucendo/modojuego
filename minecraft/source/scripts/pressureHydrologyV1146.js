/**
 * v11.4.6: conservative, shallow-water pressure above an already settled
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
 * sample(x,z) -> {bed,baseTop,dammed?} or null (closed/unloaded cell).
 * inlets -> iterable of {damX,damZ,upstream:[{x,z}],rate,headLimit}.
 * Values in `volumes` are fluid above the resting water column, NOT a height.
 */
export function stepPressureV1146(volumes,inlets,sample,dt=PRESSURE_STEP,drains=[]) {
  if (!(volumes instanceof Map) || !Number.isFinite(dt) || dt <= 0)
    return {volumes:new Map(volumes),added:0,transferred:0,removed:0};
  const current=new Map(volumes),delta=new Map();
  const add=(k,n)=>delta.set(k,(delta.get(k)||0)+n);
  let added=0,transferred=0;
  // A dam captures the continual upstream supply. It does not turn all
  // downstream river blocks into infinite sources.
  for(const inlet of inlets){
    const dam=sample(inlet.damX,inlet.damZ);
    if (!dam?.dammed) continue;
    const sources=inlet.upstream||[];
    for(const {x,z} of sources){
      const cell=sample(x,z);
      if(!cell||cell.dammed)continue;
      const k=pressureKey(x,z),previous=current.get(k)||0;
      const room=clamp((inlet.headLimit ?? dam.bed+.75)-cell.baseTop-previous,0,PRESSURE_MAX);
      const supply=Math.min(room,Math.max(0,inlet.rate??.8)*dt/sources.length);
      if(supply<=0)continue;
      current.set(k,previous+supply);
      added+=supply;
    }
  }
  // Calculate every transfer against one snapshot. Only the extra water is
  // mobile, and the total outgoing flux cannot exceed its actual volume.
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
      const threshold=next.dammed?next.bed+.55:next.bed;
      const nextHead=Math.max(next.baseTop+nextVolume,threshold);
      const difference=head-nextHead;
      if(difference>.025)candidates.push({key:nextKey,difference});
    }
    if(!candidates.length)continue;
    const available=volume*.78;
    const totalPotential=candidates.reduce((sum,c)=>sum+c.difference,0);
    const budget=Math.min(available,totalPotential*.52*dt);
    for(const candidate of candidates){
      const transfer=budget*candidate.difference/totalPotential;
      if(transfer<=0)continue;
      add(k,-transfer);add(candidate.key,transfer);
      transferred+=transfer;
    }
  }
  const result=new Map();
  for(const [k,v] of current){
    const next=clamp(v+(delta.get(k)||0),0,PRESSURE_MAX);
    if(next>PRESSURE_MIN)result.set(k,next);
    delta.delete(k);
  }
  for(const [k,v] of delta){
    if(v>PRESSURE_MIN && result.size<PRESSURE_LIMIT)result.set(k,Math.min(v,PRESSURE_MAX));
  }
  // Excess reaching an already-running downstream river leaves the local
  // simulated pool. This is an explicit, accounted boundary outflow.
  let removed=0;
  for(const drain of drains){
    const k=pressureKey(drain.x,drain.z),volume=result.get(k)||0;
    if(volume<=0)continue;
    const out=Math.min(volume,Math.max(0,drain.rate??1)*dt);
    removed+=out;
    if(volume-out>PRESSURE_MIN)result.set(k,volume-out);
    else result.delete(k);
  }
  return {volumes:result,added,transferred,removed};
}
