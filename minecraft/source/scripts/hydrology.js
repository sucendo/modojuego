// v11.0: deterministic, chunk-independent rivers, lakes and oasis basins.
// Pure data only. Legacy generators are never altered: terrain version 4 opts in.
import { advancedSurfaceHeight, V10_HEIGHT } from './terrainV10.js';

export const TERRAIN_V11 = 4;
const CONFIG = Object.freeze({
  classic:{spacing:165,width:4.3,lakeChance:.34,lakeRadius:18},
  ocean:{spacing:112,width:6.4,lakeChance:.70,lakeRadius:26},
  jungle:{spacing:120,width:5.7,lakeChance:.56,lakeRadius:22},
  desert:{spacing:350,width:2.7,lakeChance:.11,lakeRadius:12},
  snow:{spacing:175,width:4.2,lakeChance:.37,lakeRadius:18},
  lava:{spacing:180,width:4.5,lakeChance:.38,lakeRadius:19}
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
// 32-bit hash: handles negative grid coordinates and stays seed deterministic.
function hash(a,b,seed,salt=0){
  let h=Math.imul(a,0x45d9f3b)^Math.imul(b,0x27d4eb2d)^Math.imul(seed|0,0x165667b1)^Math.imul(salt,0x9e3779b1);
  h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);
  return (h^(h>>>16))>>>0;
}
const random=(a,b,seed,salt)=>hash(a,b,seed,salt)/4294967296;

export function riverCenterX(line,z,seed,spacing){
  const phase=random(line,0,seed,7)*Math.PI*2;
  const drift=Math.sin(z/97+phase)*21+Math.sin(z/203+phase*.71)*15;
  return line*spacing+spacing*.43+(random(line,0,seed,13)-.5)*spacing*.28+drift;
}

/** Return the height and surface water data for a single world-space column.
 * Pass a consistent surface() function to preserve chunk/LOD/map agreement.
 * `waterY` is the water plane in world units; `height` is the solid riverbed.
 */
export function hydrologyColumn(simplex,params,type,wx,wz,seed=params.seed,surface=null,originalHeight=undefined){
  const baseHeight=Number.isFinite(originalHeight)?originalHeight:surface ? surface(wx,wz) : advancedSurfaceHeight(simplex,params,type,wx,wz,V10_HEIGHT);
  const noWater={height:baseHeight,waterY:null,kind:null,bank:false};
  // Keep a generous dry playable area around the initial spawn in all presets.
  if(Math.hypot(wx-32,wz-32)<39)return noWater;
  const config=CONFIG[type]||CONFIG.classic;
  const spacing=config.spacing;
  const index=Math.floor(wx/spacing);
  let closest=null;
  for(let line=index-1;line<=index+1;line++){
    const center=riverCenterX(line,wz,seed,spacing);
    const distance=Math.abs(wx-center);
    const width=config.width*(.83+.30*random(line,0,seed,29));
    if(distance>width+6|| (closest&&distance>=closest.distance))continue;
    closest={line,center,distance,width};
  }
  let river=null;
  if(closest){
    const {distance,width,center}=closest;
    // A slowly changing water profile, shared by all columns across the river.
    // This is a terrain channel with visual water, not a dynamic fluid solver.
    const centerHeight=surface?surface(center,wz):advancedSurfaceHeight(simplex,params,type,center,wz,V10_HEIGHT);
    const surfaceLevel=clamp(centerHeight-1.9,params.terrain.waterOffset+.75,V10_HEIGHT-11);
    river={kind:type==='lava'?'lava':'river',distance,width,waterY:surfaceLevel};
  }
  const grid=232;
  const gx=Math.floor(wx/grid),gz=Math.floor(wz/grid);
  let lake=null;
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const cx=gx+dx,cz=gz+dz;
    if(random(cx,cz,seed,41)>=config.lakeChance)continue;
    const centerX=(cx+.18+random(cx,cz,seed,43)*.64)*grid;
    const centerZ=(cz+.18+random(cx,cz,seed,47)*.64)*grid;
    const rx=config.lakeRadius*(.76+.48*random(cx,cz,seed,53));
    const rz=rx*(.82+.34*random(cx,cz,seed,59));
    if(Math.abs(wx-centerX)>rx*1.32+3 || Math.abs(wz-centerZ)>rz*1.32)continue;
    const distortion=2.4*Math.sin((wz-centerZ)/10+random(cx,cz,seed,61)*6.28);
    const d=Math.hypot((wx-centerX+distortion)/rx,(wz-centerZ)/rz);
    if(d>=1.32||lake&&d>=lake.distance)continue;
    const originHeight=surface?surface(centerX,centerZ):advancedSurfaceHeight(simplex,params,type,centerX,centerZ,V10_HEIGHT);
    lake={kind:type==='desert'?'oasis':type==='lava'?'lava':type==='snow'?'frozen':'lake',
      distance:d,width:1,waterY:clamp(originHeight-2,params.terrain.waterOffset+.6,V10_HEIGHT-12)};
  }
  // Prefer rivers where they enter lakes; keep one well-defined water height.
  let water=null;
  if(lake?.distance<.96)water=lake;
  else if(river&&river.distance<river.width+6)water=river;
  else if(lake)water=lake;
  if(!water)return noWater;
  const isLake=water===lake;
  const inner=isLake?water.distance<=1:water.distance<=water.width;
  const transition=isLake?clamp((water.distance-1)/.32,0,1):clamp((water.distance-water.width)/6,0,1);
  const bed=isLake?water.waterY-2.9:water.waterY-2.25;
  const rim=water.waterY+(isLake?4:5);
  // Contoured riverbanks never raise the original landscape. The bottom is
  // at least two blocks below the surface of the water.
  const target=inner?bed:bed+(rim-bed)*smooth(transition);
  const height=Math.max(1,Math.min(baseHeight,Math.floor(target)));
  const flooded=inner && height+.5<water.waterY;
  return {height,waterY:flooded?water.waterY:null,kind:flooded?water.kind:null,bank:true};
}

export function waterTint(kind,type){
  if(kind==='lava'||type==='lava')return 0xf25b18;
  if(kind==='frozen')return 0xb3dfe8;
  if(kind==='oasis')return 0x36aaa4;
  return type==='ocean'?0x398ac1:type==='jungle'?0x328eaa:0x429fc9;
}
