// Reusable, bounded sky-visibility lookup for particles and cave effects.
// A roof anywhere above a particle prevents outdoor precipitation there.
// No Three.js dependency: can be verified with synthetic 32- and 80-high worlds.
const PASS_THROUGH=new Set([0,9,21,23,24]); // air, legacy cloud, torch, bed, table
export function blocksPrecipitation(id){return !PASS_THROUGH.has(id ?? 0);}

export class SkyExposure {
  constructor(world){this.world=world;this.columns=new Map();}
  clear(){this.columns.clear();}
  roofHeight(x,z,now=0){
    const bx=Math.floor(x),bz=Math.floor(z),key=`${bx},${bz}`;
    const entry=this.columns.get(key);
    // Stagger roof refreshes across frames: do not rescan 500 columns at once.
    const ttl=425+((Math.imul(bx,73856093)^Math.imul(bz,19349663))&127);
    if(entry && now>=entry.time && now-entry.time<ttl)return entry.roof;
    const height=this.world.chunkSize?.height ?? 32;
    let roof=-1;
    for(let y=height-1;y>=0;y--){
      if(blocksPrecipitation(this.world.getBlockId(bx,y,bz))){roof=y;break;}
    }
    // Keep cache bounded while the player crosses many chunks.
    if(!entry && this.columns.size>=2048)this.columns.delete(this.columns.keys().next().value);
    this.columns.set(key,{roof,time:now});
    return roof;
  }
  skyVisible(x,y,z,now=0){return y>this.roofHeight(x,z,now)+.52;}
  // An immediate ceiling can shed a few droplets inside a wet cave.
  caveCeiling(x,y,z,maxDistance=7){
    const bx=Math.floor(x),bz=Math.floor(z);
    const start=Math.floor(y)+1;
    const limit=Math.min(this.world.chunkSize?.height ?? 32,start+maxDistance);
    for(let h=start;h<limit;h++)if(blocksPrecipitation(this.world.getBlockId(bx,h,bz)))return h;
    return null;
  }
}
