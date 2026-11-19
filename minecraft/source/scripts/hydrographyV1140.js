// v11.4: seeded, terrain-aware drainage for NEW/unexplored land only.
// The entire initial river/lake geometry is determined before it is drawn;
// the camera and local simulation never decide where a natural river starts.
import { advancedSurfaceHeight, V10_HEIGHT } from './terrainV10.js';
import { freezeColumn } from './hydrologyV112.js';

const TILE = 160;
const STEP = 6;
const BUCKET = 16;
const SEARCH_TILES = 3;
const TRACE_STEPS = 64;
const BANK_WIDTH = 6;
const WORLD_LIMIT = 3;
const CACHED_TILES_LIMIT = 700;
const networkCache = new Map();
const DIRECTIONS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
const WIDTH = {classic:3.4,ocean:4.4,jungle:3.8,desert:2.6,snow:3.3};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>{const a=clamp(t,0,1);return a*a*(3-2*a);};
const key=(x,z)=>`${x},${z}`;

function hash(a,b,seed,salt=0){
  let h=Math.imul(a|0,0x45d9f3b)^Math.imul(b|0,0x27d4eb2d)^Math.imul(seed|0,0x165667b1)^Math.imul(salt|0,0x9e3779b1);
  h=Math.imul(h^(h>>>16),0x7feb352d);
  h=Math.imul(h^(h>>>15),0x846ca68b);
  return (h^(h>>>16))>>>0;
}
const random=(a,b,seed,salt)=>hash(a,b,seed,salt)/4294967296;

function createNetwork(simplex,params,type){
  const {seed}=params;
  const heights=new Map(),buckets=new Map(),tiles=new Set(),sources=[],segments=[];
  const width=WIDTH[type]??WIDTH.classic;
  const at=(x,z)=>{
    const k=key(x,z);
    if(heights.has(k))return heights.get(k);
    const h=advancedSurfaceHeight(simplex,params,type,x,z,V10_HEIGHT);
    heights.set(k,h);
    if(heights.size>85000)heights.clear();
    return h;
  };
  const index=(item,radius)=>{
    segments.push(item);
    const minX=Math.floor((Math.min(item.a.x,item.b.x)-radius)/BUCKET),
      maxX=Math.floor((Math.max(item.a.x,item.b.x)+radius)/BUCKET);
    const minZ=Math.floor((Math.min(item.a.z,item.b.z)-radius)/BUCKET),
      maxZ=Math.floor((Math.max(item.a.z,item.b.z)+radius)/BUCKET);
    for(let bx=minX;bx<=maxX;bx++)for(let bz=minZ;bz<=maxZ;bz++){
      const k=key(bx,bz);
      if(!buckets.has(k))buckets.set(k,[]);
      buckets.get(k).push(item);
    }
  };
  const traceTile=(tx,tz)=>{
    const tileKey=key(tx,tz);
    if(tiles.has(tileKey))return;
    tiles.add(tileKey);
    // Every tile is deterministic; some produce no river at all. These are
    // genuine springs on high ground rather than the old infinite N/S lines.
    if(random(tx,tz,seed,41)>.66)return;
    const cx=tx*TILE+TILE*(.28+random(tx,tz,seed,43)*.44);
    const cz=tz*TILE+TILE*(.28+random(tx,tz,seed,47)*.44);
    let start=null;
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      const x=Math.round((cx+dx*15)/STEP)*STEP,
        z=Math.round((cz+dz*15)/STEP)*STEP;
      const h=at(x,z);
      if(!start||h>start.h)start={x,z,h};
    }
    if(!start||start.h<params.terrain.waterOffset+5||Math.hypot(start.x-32,start.z-32)<47)return;
    const source={x:start.x,z:start.z,top:start.h-.5};
    const visited=new Set([key(start.x,start.z)]);
    let previous=start,lastDirection=null,flatCount=0,steps=0;
    for(let i=0;i<TRACE_STEPS;i++){
      let best=null;
      for(const [dx,dz] of DIRECTIONS){
        const x=previous.x+dx*STEP,z=previous.z+dz*STEP;
        if(visited.has(key(x,z))||Math.hypot(x-32,z-32)<43)continue;
        const h=at(x,z);
        if(h>previous.h)continue; // NEVER run uphill
        const continuity=lastDirection?dx*lastDirection[0]+dz*lastDirection[1]:0;
        const tie=random(x,z,seed,59)*.05;
        const score=h*10-continuity*.25+tie;
        if(!best||score<best.score)best={x,z,h,dx,dz,score};
      }
      if(!best)break;
      flatCount=best.h===previous.h?flatCount+1:0;
      if(flatCount>=5)break;
      const next={x:best.x,z:best.z,h:best.h};
      const segment={a:previous,b:next,width,source:steps===0?source:null};
      index(segment,width+BANK_WIDTH+1);
      previous=next;lastDirection=[best.dx,best.dz];
      visited.add(key(next.x,next.z));steps++;
      if(next.h<=2)break;
    }
    if(!steps)return;
    sources.push(source);
    // Closed downhill end is a small lake, not a river suddenly flowing up
    // the other side of a hill. Other downhill traces can naturally join it.
    if(steps>=3){
      const sink={a:previous,b:previous,top:previous.h-.5,radius:7.5,kind:'lake'};
      index(sink,sink.radius+BANK_WIDTH);
    }
  };
  return {
    sources,segments,
    near(x,z){
      // The map is potentially infinite. Rebuild deterministic nearby tiles
      // after long-distance travel instead of retaining every visited river
      // mesh index in memory for the entire lifetime of the tab.
      if(tiles.size>CACHED_TILES_LIMIT){
        tiles.clear();buckets.clear();heights.clear();sources.length=0;segments.length=0;
      }
      const tx=Math.floor(x/TILE),tz=Math.floor(z/TILE);
      for(let i=-SEARCH_TILES;i<=SEARCH_TILES;i++)
        for(let j=-SEARCH_TILES;j<=SEARCH_TILES;j++)traceTile(tx+i,tz+j);
      return buckets.get(key(Math.floor(x/BUCKET),Math.floor(z/BUCKET)))??[];
    }
  };
}

function networkFor(simplex,params,type){
  const identity=JSON.stringify([params.seed,type,params.terrain]);
  if(networkCache.has(identity))return networkCache.get(identity);
  if(networkCache.size>=WORLD_LIMIT)networkCache.delete(networkCache.keys().next().value);
  const net=createNetwork(simplex,params,type);
  networkCache.set(identity,net);
  return net;
}

function nearestSegment(wx,wz,items){
  let nearest=null;
  for(const item of items){
    const dx=item.b.x-item.a.x,dz=item.b.z-item.a.z;
    const length=dx*dx+dz*dz;
    const t=length?clamp(((wx-item.a.x)*dx+(wz-item.a.z)*dz)/length,0,1):0;
    const px=item.a.x+dx*t,pz=item.a.z+dz*t;
    const distance=Math.hypot(wx-px,wz-pz);
    const radius=item.radius??item.width;
    if(distance>radius+BANK_WIDTH||nearest&&distance>=nearest.distance)continue;
    nearest={item,distance,t};
  }
  return nearest;
}

/** A whole voxel water column in an actual downhill channel, with optional
 * pre-carved banks. This is already the initial, settled state at first draw.
 * New geography is stable until a real block edit changes its hydraulic bed. */
export function hydrographyColumnV1140(simplex,params,type,wx,wz,seed=params.seed,surface=null,originalHeight=undefined){
  const baseHeight=Number.isFinite(originalHeight)?originalHeight:
    surface?surface(wx,wz):advancedSurfaceHeight(simplex,params,type,wx,wz,V10_HEIGHT);
  const dry={height:baseHeight,waterY:null,kind:null,bank:false,ice:false,stable:true,source:false};
  if(type==='lava'||Math.hypot(wx-32,wz-32)<43)return dry;
  const nearby=networkFor(simplex,params,type).near(wx,wz);
  const nearest=nearestSegment(wx,wz,nearby);
  if(!nearest)return dry;
  const {item,distance,t}=nearest;
  const lake=item.kind==='lake',width=item.radius??item.width;
  const top=lake?item.top:
    Math.round((item.a.h+(item.b.h-item.a.h)*t)-1)+.5;
  const bed=Math.max(1,Math.round(top-1.5));
  const inner=distance<=width;
  const carve=inner?bed:
    Math.round(bed+(baseHeight-bed)*smooth((distance-width)/BANK_WIDTH));
  const height=Math.max(1,Math.min(baseHeight,carve));
  if(!inner)return {...dry,height,bank:true};
  // An unexpectedly deeper land block never receives a hovering water top;
  // lower its local top instead. A genuine pond is filled from its own bed.
  const localTop=Math.min(top,height+1.5);
  if(localTop<=height+.8)return {...dry,height,bank:true};
  const source=!!item.source&&Math.hypot(wx-item.source.x,wz-item.source.z)<.75;
  const waterY=localTop-.25,kind=lake?'lake':'river';
  return {height,waterY,kind,
    bank:true,ice:freezeColumn(type,seed,wx,wz,waterY,kind),stable:true,source,
    flowX:lake?0:item.b.x-item.a.x,flowZ:lake?0:item.b.z-item.a.z};
}

// Exposed for deterministic terrain, gradient and runtime regression tests.
export function hydrographyDebugSources(simplex,params,type,minX,minZ,maxX,maxZ){
  const network=networkFor(simplex,params,type);
  network.near((minX+maxX)/2,(minZ+maxZ)/2);
  return network.sources.filter(s=>s.x>=minX&&s.x<=maxX&&s.z>=minZ&&s.z<=maxZ);
}

export function hydrographyDebugSegments(simplex,params,type,minX,minZ,maxX,maxZ){
  const network=networkFor(simplex,params,type);
  network.near((minX+maxX)/2,(minZ+maxZ)/2);
  return network.segments.filter(({a,b})=>
    Math.max(a.x,b.x)>=minX&&Math.min(a.x,b.x)<=maxX&&
    Math.max(a.z,b.z)>=minZ&&Math.min(a.z,b.z)<=maxZ);
}
