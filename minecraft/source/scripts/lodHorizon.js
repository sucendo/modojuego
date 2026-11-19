/** v10.5: the full voxel ring remains physical; middle and distant bands are
 * visual-only heightfields. Nothing here affects saved blocks or world seeds.
 */
export const LOD_MIN_RADIUS=6;
export const LOD_MAX_RADIUS=18;
export const LOD_MIDDLE_RADIUS=8;
export const LOD_SECTOR_SIZE=4; // Legacy medium-detail sector width in chunks.
export const LOD_SAMPLE_STEP=4; // Legacy medium-detail sample spacing in blocks.
export const LOD_LEVELS=Object.freeze({
  medium:Object.freeze({sectorSize:4,step:4}),
  far:Object.freeze({sectorSize:8,step:8})
});
export const QUALITY_HORIZON_CAP=Object.freeze({low:8,medium:12,high:18});

export function clampHorizonRadius(value,cap=LOD_MAX_RADIUS){
  const c=Number(cap),v=Number(value);
  const max=Math.min(LOD_MAX_RADIUS,Math.max(LOD_MIN_RADIUS,Number.isFinite(c)?Math.floor(c):LOD_MAX_RADIUS));
  return Math.min(max,Math.max(LOD_MIN_RADIUS,Number.isFinite(v)?Math.floor(v):12));
}
export function sectorCoord(chunkCoordinate,size=LOD_SECTOR_SIZE){return Math.floor(chunkCoordinate/size);}
export function chunkDistance(cx,cz,originX,originZ){return Math.max(Math.abs(cx-originX),Math.abs(cz-originZ));}
/** Never duplicate an opaque full-resolution surface. */
export function needsLod(cx,cz,originX,originZ,nearRadius,farRadius,fullChunk=null){
  const d=chunkDistance(cx,cz,originX,originZ);
  if(d>farRadius)return false;
  return d>nearRadius || !fullChunk?.loaded || (fullChunk.fade??1)<.995 || fullChunk.fadeTarget===0;
}
export function lodTier(cx,cz,originX,originZ,nearRadius,farRadius,fullChunk=null){
  if(!needsLod(cx,cz,originX,originZ,nearRadius,farRadius,fullChunk))return null;
  return chunkDistance(cx,cz,originX,originZ)>LOD_MIDDLE_RADIUS?'far':'medium';
}
/** Storms shorten the *drawn* horizon, never the setting persisted in the browser. */
export function weatherHorizonRadius(configured,severity=0){
  const radius=clampHorizonRadius(configured);
  if(severity>.80)return Math.min(radius,8);
  if(severity>.50)return Math.min(radius,10);
  return radius;
}
/** FPS hysteresis: far range shrinks before full voxel chunks are sacrificed. */
export class HorizonVisibility{
  constructor(maximum=12){this.reset(maximum);}
  reset(maximum=12){
    this.radius=clampHorizonRadius(maximum,maximum);
    this.elapsed=0;this.frames=0;this.slow=0;this.fast=0;this.cooldown=0;this.lastFps=0;
    return this.radius;
  }
  sample(dt,active,maximum=LOD_MAX_RADIUS,allowGrow=true){
    const cap=clampHorizonRadius(maximum,maximum);
    if(this.radius>cap){this.radius=cap;this.slow=0;this.fast=0;return this.radius;}
    if(!active||!Number.isFinite(dt)||dt<=0||dt>.35){
      this.elapsed=0;this.frames=0;this.slow=0;this.fast=0;return null;
    }
    this.elapsed+=dt;this.frames++;
    if(this.elapsed<2)return null;
    const seconds=this.elapsed,fps=this.frames/seconds;
    this.lastFps=fps;this.frames=0;this.elapsed=0;
    this.cooldown=Math.max(0,this.cooldown-seconds);
    if(fps<47){this.slow+=seconds;this.fast=0;}
    else if(fps>57){this.fast+=seconds;this.slow=0;}
    else{this.slow=0;this.fast=0;}
    if(!allowGrow)this.fast=0;
    if(this.cooldown>0)return null;
    if(this.slow>=6&&this.radius>LOD_MIN_RADIUS){
      // Reduce distant meshes more quickly when the extra 12–18 ring is too slow.
      this.radius=Math.max(LOD_MIN_RADIUS,this.radius-(this.radius>10?2:1));
      this.slow=0;this.cooldown=12;return this.radius;
    }
    if(allowGrow&&this.fast>=18&&this.radius<cap){
      this.radius++;this.fast=0;this.cooldown=14;return this.radius;
    }
    return null;
  }
}
