// Rendering only: never writes levels, volumes, sources or save data.
export const WATER_TRANSITION_SECONDS = .4;
export const WATER_JOIN_DROP = 1.01;
export const waterTime = () => (typeof performance==='undefined'?Date.now():performance.now())*.001;
const clamp01 = x => Math.max(0,Math.min(1,x));
export function transitionValue(record, time) {
  if(!record)return null;
  const u=record.duration>0?clamp01((time-record.start)/record.duration):1;
  const s=u*u*(3-2*u);
  return record.from+(record.to-record.from)*s;
}

/** Shared records give adjoining chunks exactly the same height and clock.
 * Owners release their records on rebuild/unload, so exploration is bounded. */
export class WaterTransitions {
  records=new Map(); owners=new Map(); aliases=new Map();
  begin(owner){this.pending=new Set();this.owner=owner;}
  target(key,to,time,initial=to,duration=WATER_TRANSITION_SECONDS){
    this.pending?.add(key);
    let r=this.records.get(key);
    if(!r){
      const alias=/^(surface|cave):[^:]+/.exec(key)?.[0];
      if(alias){
        let closest=null;
        for(const oldKey of this.aliases.get(alias)||[]){
          const old=this.records.get(oldKey);
          if(old&&Math.abs(old.to-to)<WATER_JOIN_DROP&&(!closest||Math.abs(old.to-to)<Math.abs(closest.to-to)))closest=old;
        }
        if(closest)initial=transitionValue(closest,time);
        if(!this.aliases.has(alias))this.aliases.set(alias,new Set());
        this.aliases.get(alias).add(key);
      }
      r={from:initial,to,start:time,duration,owners:new Set(),alias};this.records.set(key,r);
    }
    else if(Math.abs(r.to-to)>1e-7){r.from=transitionValue(r,time);r.to=to;r.start=time;r.duration=duration;}
    if(this.owner!==undefined)r.owners.add(this.owner);
    return r;
  }
  end(){
    const previous=this.owners.get(this.owner)||new Set();
    for(const key of previous)if(!this.pending.has(key))this.drop(key,this.owner);
    this.owners.set(this.owner,this.pending);this.pending=null;this.owner=undefined;
  }
  drop(key,owner){const r=this.records.get(key);if(r){r.owners.delete(owner);if(!r.owners.size){this.records.delete(key);if(r.alias){
      const keys=this.aliases.get(r.alias);keys?.delete(key);if(!keys?.size)this.aliases.delete(r.alias);
    }}}}
  release(owner){for(const k of this.owners.get(owner)||[])this.drop(k,owner);this.owners.delete(owner);}
  clear(){this.records.clear();this.owners.clear();this.aliases.clear();}
}

export function connectedWater(a,b){
  return !!a&&!!b&&a.open!==false&&b.open!==false&&!a.drying&&!b.drying&&a.kind!=='frozen'&&b.kind!=='frozen'&&a.kind!=='lava'&&b.kind!=='lava'&&
    Math.abs(a.top-b.top)<WATER_JOIN_DROP&&
    Math.min(a.top,b.top)>Math.max(a.bottom,b.bottom)+.001;
}

/** One deterministic height for a corner of a connected liquid sheet.
 * Only face-connected columns join: diagonal puddles, ice, ceilings and true
 * waterfalls remain separate. The component's world-space anchor is stable. */
export function continuousCorner(x,z,sx,sz,sample,cache=null){
  const vx=x+sx*.5,vz=z+sz*.5;
  const cacheKey=`${x},${z},${vx},${vz}`;
  if(cache?.has(cacheKey))return cache.get(cacheKey);
  const cells=[];
  for(const cz of [Math.floor(vz),Math.ceil(vz)])for(const cx of [Math.floor(vx),Math.ceil(vx)]){
    const water=sample(cx,cz);if(water)cells.push({x:cx,z:cz,water});
  }
  const origin=cells.findIndex(c=>c.x===x&&c.z===z);
  if(origin<0)return null;
  // At most four samples meet here. Keep references to the sampled columns:
  // spreading every physical column into temporary objects dominates rebuilds.
  let reached=1<<origin;const queue=[origin];
  for(const index of queue)for(let j=0;j<cells.length;j++){
    if(reached&(1<<j))continue;
    const a=cells[index],b=cells[j];
    if(Math.abs(a.x-b.x)+Math.abs(a.z-b.z)!==1||!connectedWater(a.water,b.water))continue;
    reached|=1<<j;queue.push(j);
  }
  let count=0,sum=0,floor=-Infinity,left=0,right=0,near=0,far=0,nl=0,nr=0,nn=0,nf=0,fx=0,fz=0;
  const sorted=[],flowSamples=[],keys=[];
  // Sampling order is already z then x, independent of the origin tile.
  for(let i=0;i<cells.length;i++)if(reached&(1<<i)){
    const c=cells[i],w=c.water;sorted.push(c);count++;sum+=w.top;floor=Math.max(floor,w.bottom+.001);
    if(c.x>vx){right+=w.top;nr++;}else{left+=w.top;nl++;}
    if(c.z>vz){far+=w.top;nf++;}else{near+=w.top;nn++;}
    fx+=w.flow?.[0]||0;fz+=w.flow?.[1]||0;
    flowSamples.push([c.x,c.z,w.bottom]);keys.push(`${c.x},${c.z}@${w.bottom}`);
  }
  const top=Math.max(floor,sum/count),dx=(nr?right/nr:top)-(nl?left/nl:top),dz=(nf?far/nf:top)-(nn?near/nn:top);
  const length=Math.hypot(dx,1,dz);
  const result={top,flow:[fx/count,fz/count],flowSamples,normal:[-dx/length,1/length,-dz/length],key:`${vx},${vz}:${keys.join(';')}`};
  if(cache)for(const c of sorted)cache.set(`${c.x},${c.z},${vx},${vz}`,result);
  return result;
}
