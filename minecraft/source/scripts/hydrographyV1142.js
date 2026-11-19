// v11.4.2: deterministic tributary systems, level basin water, vertical
// waterfalls, and connected, gently graded banks. Compiled before first draw.
// No player movement or rendering pass changes the natural water volume.
import {advancedSurfaceHeight,V10_HEIGHT} from './terrainV10.js';
import {freezeColumn} from './hydrologyV112.js';

const TILE=176,STEP=6,BUCKET=16,SEARCH_TILES=5;
const MAX_STEPS=112,MAX_DISTANCE=780;
const BANK_MAX=24,WIDTH_MAX=9;
const CACHED_TILES_LIMIT=650,WORLD_LIMIT=3;
const WIDTH={classic:2.4,snow:2.3,jungle:2.7,desert:1.9,ocean:3.1};
const DIRS=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
const networks=new Map();
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const smooth=n=>{const t=clamp(n,0,1);return t*t*(3-2*t);};
const key=(x,z)=>`${x},${z}`;
function hash(a,b,seed,salt){
  let h=Math.imul(a|0,0x45d9f3b)^Math.imul(b|0,0x27d4eb2d)^
    Math.imul(seed|0,0x165667b1)^Math.imul(salt|0,0x9e3779b1);
  h=Math.imul(h^(h>>>16),0x7feb352d);
  h=Math.imul(h^(h>>>15),0x846ca68b);
  return (h^(h>>>16))>>>0;
}
const random=(a,b,seed,salt)=>hash(a,b,seed,salt)/4294967296;
const routeRank=r=>(r.end==='sea'?10000:0)-r.last.h*10+r.path.length*.001;

function createNetwork(simplex,params,type){
  const {seed}=params,sea=params.terrain.waterOffset;
  const heights=new Map(),buckets=new Map(),tiles=new Set(),routes=[];
  let dirty=false;
  const at=(x,z)=>{
    const k=key(x,z);
    if(heights.has(k))return heights.get(k);
    const h=advancedSurfaceHeight(simplex,params,type,x,z,V10_HEIGHT);
    heights.set(k,h);
    if(heights.size>90000)heights.clear();
    return h;
  };
  const index=(segment)=>{
    const reach=WIDTH_MAX+BANK_MAX+5;
    for(let bx=Math.floor((Math.min(segment.a.x,segment.b.x)-reach)/BUCKET);
      bx<=Math.floor((Math.max(segment.a.x,segment.b.x)+reach)/BUCKET);bx++)
      for(let bz=Math.floor((Math.min(segment.a.z,segment.b.z)-reach)/BUCKET);
        bz<=Math.floor((Math.max(segment.a.z,segment.b.z)+reach)/BUCKET);bz++){
        const k=key(bx,bz);
        if(!buckets.has(k))buckets.set(k,[]);
        buckets.get(k).push(segment);
      }
  };
  // A shallow saddle can be cut into a gentle channel. We do not allow the
  // WATER LINE to rise: only 1-2 high blocks of solid ground may be carved.
  // A deep closed bowl remains a lake instead of a fictitious uphill river.
  const spillFrom=(here,visited)=>{
    let best=null;
    for(let dx=-7;dx<=7;dx++)for(let dz=-7;dz<=7;dz++){
      const length=Math.max(Math.abs(dx),Math.abs(dz));
      if(length<2||length>7)continue;
      const target={x:here.x+dx*STEP,z:here.z+dz*STEP};
      const targetHeight=at(target.x,target.z);
      if(targetHeight>=here.h)continue;
      let rise=0,blocked=false;
      const trail=[];
      for(let i=1;i<=length;i++){
        const x=here.x+Math.round(dx*i/length)*STEP,
          z=here.z+Math.round(dz*i/length)*STEP;
        if(visited.has(key(x,z))){blocked=true;break;}
        const land=at(x,z);
        rise=Math.max(rise,land-here.h);
        if(rise>2){blocked=true;break;}
        trail.push({x,z,h:land});
      }
      if(blocked||!trail.length)continue;
      const score=rise*7+length*.6+targetHeight*.08+
        random(target.x,target.z,seed,89)*.04;
      if(!best||score<best.score)best={score,trail};
    }
    return best?.trail??null;
  };
  const addRoute=(id,path,end)=>{
    const start=path[0],last=path.at(-1);
    const source={x:start.x,z:start.z,top:start.h-.5};
    const route={id,source,path,last,end,segments:[],join:null,events:[]};
    for(let i=0;i<path.length-1;i++){
      const segment={a:path[i],b:path[i+1],route,index:i};
      route.segments.push(segment);index(segment);
    }
    if(end==='basin'){
      const around=DIRS.map(([dx,dz])=>at(last.x+dx*STEP,last.z+dz*STEP));
      const relief=around.reduce((sum,h)=>sum+h-last.h,0)/around.length;
      const radius=clamp(6.5+relief*.85,6.5,13);
      route.segments.push({a:last,b:last,route,index:path.length-1,
        // Last stream voxel and basin use exactly the SAME water elevation.
        // The old basin +0.5 sometimes made the river apparently climb 1m.
        radius,top:Math.round(last.h-1)+.5,kind:'lake'});
      index(route.segments.at(-1));
    }
    routes.push(route);dirty=true;
    return route;
  };
  const createHeadwaterTributary=(tx,tz,main,branch)=>{
    const path=main.path;
    const chance=branch===0?.86:.55;
    if(path.length<(branch===0?9:16)||random(tx,tz,seed,107+branch*17)>chance)return;
    const joinIndex=clamp(Math.round(path.length*(branch===0?.3:.7)),4,path.length-3);
    const join=path[joinIndex],prior=path[joinIndex-1];
    const dx=Math.sign(join.x-prior.x),dz=Math.sign(join.z-prior.z);
    if(!dx&&!dz)return;
    const side=random(tx,tz,seed,111+branch*17)>.5?1:-1;
    let best=null;
    for(let offset=3;offset<=7;offset++){
      const x=join.x+dz*side*offset*STEP,
        z=join.z-dx*side*offset*STEP,h=at(x,z);
      if(Math.hypot(x-32,z-32)<48||h<join.h+2)continue;
      if(!best||h>best.h)best={x,z,h};
    }
    if(!best)return;
    const length=Math.max(Math.abs((join.x-best.x)/STEP),Math.abs((join.z-best.z)/STEP));
    if(length<3)return;
    const tributary=[best],seen=new Set([key(best.x,best.z)]);
    for(let i=1;i<=length;i++){
      const x=best.x+Math.round(((join.x-best.x)/STEP)*i/length)*STEP,
        z=best.z+Math.round(((join.z-best.z)/STEP)*i/length)*STEP;
      if(seen.has(key(x,z)))return;
      const last=tributary.at(-1),land=at(x,z);
      if(land>last.h+2)return; // no deep artificial trench through a ridge
      const h=Math.min(last.h,land);
      if(Math.hypot(x-last.x,z-last.z)>STEP*1.415)return;
      tributary.push({x,z,h});seen.add(key(x,z));
    }
    // Joining a lower main channel must never raise the tributary's surface.
    if(tributary.at(-1).h<join.h)return;
    tributary[tributary.length-1]={...join};
    addRoute(`${main.id}:tributary:${branch}`,tributary,'tributary');
  };
  const traceTile=(tx,tz)=>{
    const tile=key(tx,tz);
    if(tiles.has(tile))return;
    tiles.add(tile);
    if(random(tx,tz,seed,41)>.60||type==='lava')return;
    const cx=tx*TILE+TILE*(.25+random(tx,tz,seed,43)*.5),
      cz=tz*TILE+TILE*(.25+random(tx,tz,seed,47)*.5);
    let start=null;
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      const x=Math.round((cx+dx*15)/STEP)*STEP,
        z=Math.round((cz+dz*15)/STEP)*STEP;
      const h=at(x,z);
      if(!start||h>start.h)start={x,z,h};
    }
    if(!start||start.h<sea+5||Math.hypot(start.x-32,start.z-32)<48)return;
    const path=[start],visited=new Set([key(start.x,start.z)]);
    let flat=0,distance=0,lastDirection=null,end='continuation';
    while(path.length<MAX_STEPS){
      const previous=path.at(-1);
      if(previous.h<=sea+1){end='sea';break;}
      let best=null;
      for(const [dx,dz] of DIRS){
        const x=previous.x+dx*STEP,z=previous.z+dz*STEP,h=at(x,z);
        if(visited.has(key(x,z))||h>previous.h||Math.hypot(x-32,z-32)<44)continue;
        const align=lastDirection?dx*lastDirection[0]+dz*lastDirection[1]:0;
        const score=h*8-align*.22+random(x,z,seed,59)*.04;
        if(!best||score<best.score)best={x,z,h,dx,dz,score};
      }
      // The lowest immediate neighbor does not always lead out of a valley.
      // Look for a shallow spillway before declaring a closed basin.
      const trail=!best||flat>=5?spillFrom(previous,visited):null;
      const next=trail??(best?[best]:null);
      if(!next){end='basin';break;}
      if(distance+next.length*STEP*1.415>MAX_DISTANCE){end='continuation';break;}
      let valid=true;
      for(const point of next){
        const old=path.at(-1),h=Math.min(old.h,point.h);
        if(visited.has(key(point.x,point.z))){valid=false;break;}
        const change=Math.hypot(point.x-old.x,point.z-old.z);
        if(change>STEP*1.415){valid=false;break;}
        const node={x:point.x,z:point.z,h};
        path.push(node);visited.add(key(node.x,node.z));distance+=change;
        flat=h===old.h?flat+1:0;
        lastDirection=[Math.sign(node.x-old.x),Math.sign(node.z-old.z)];
      }
      if(!valid){end='basin';break;}
    }
    if(path.length<3)return;
    const route=addRoute(tile,path,end);
    createHeadwaterTributary(tx,tz,route,0);
    createHeadwaterTributary(tx,tz,route,1);
  };
  const rebuildConfluences=()=>{
    const shared=new Map();
    for(const route of routes){
      route.join=null;route.events=[];
      for(let i=0;i<route.path.length;i++){
        const p=route.path[i],k=key(p.x,p.z);
        if(!shared.has(k))shared.set(k,[]);
        shared.get(k).push({route,index:i});
      }
    }
    for(const members of shared.values()){
      if(members.length<2)continue;
      for(const from of members)for(const to of members){
        // Only join the tributary deliberately generated for this river.
        // Linking two independent rivers when the player loads another tile
        // would alter already visible widths and recreate moving water.
        if(!from.route.id.startsWith(`${to.route.id}:tributary:`))continue;
        const old=from.route.join;
        if(!old||from.index<old.index)
          from.route.join={index:from.index,route:to.route,toIndex:to.index};
      }
    }
    // Water transported by a tributary contributes to the width of the
    // receiving river all the way downstream of its actual confluence.
    const ordered=[...routes].sort((a,b)=>routeRank(a)-routeRank(b)||b.id.localeCompare(a.id));
    for(const tributary of ordered){
      if(!tributary.join)continue;
      const incoming=1+tributary.events.reduce((n,e)=>
        n+(e.index<=tributary.join.index?e.flow:0),0);
      tributary.join.route.events.push({index:tributary.join.toIndex,flow:incoming});
    }
    dirty=false;
  };
  const active=segment=>!segment.route.join||segment.index<segment.route.join.index;
  const flowAt=(route,index)=>1+route.events.reduce((sum,e)=>
    sum+(e.index<=index?e.flow:0),0);
  const widthAt=(segment)=>segment.radius??clamp(
    (WIDTH[type]??2.4)+1.3*segment.index/Math.max(1,segment.route.path.length-2)+
    1.45*Math.log2(flowAt(segment.route,segment.index)),1.8,WIDTH_MAX);
  return {
    routes,
    widthAt,
    active,
    near(x,z){
      if(tiles.size>CACHED_TILES_LIMIT){
        tiles.clear();buckets.clear();heights.clear();routes.length=0;dirty=false;
      }
      const tx=Math.floor(x/TILE),tz=Math.floor(z/TILE);
      for(let i=-SEARCH_TILES;i<=SEARCH_TILES;i++)
        for(let j=-SEARCH_TILES;j<=SEARCH_TILES;j++)traceTile(tx+i,tz+j);
      if(dirty)rebuildConfluences();
      return (buckets.get(key(Math.floor(x/BUCKET),Math.floor(z/BUCKET)))??[])
        .filter(active);
    }
  };
}

function networkFor(simplex,params,type){
  const identity=JSON.stringify([3,params.seed,type,params.terrain]);
  if(networks.has(identity))return networks.get(identity);
  if(networks.size>=WORLD_LIMIT)networks.delete(networks.keys().next().value);
  const net=createNetwork(simplex,params,type);
  networks.set(identity,net);
  return net;
}

function nearest(wx,wz,segments,net){
  let winner=null;
  for(const segment of segments){
    const dx=segment.b.x-segment.a.x,dz=segment.b.z-segment.a.z,
      length=dx*dx+dz*dz;
    const t=length?clamp(((wx-segment.a.x)*dx+(wz-segment.a.z)*dz)/length,0,1):0;
    const x=segment.a.x+dx*t,z=segment.a.z+dz*t,
      distance=Math.hypot(wx-x,wz-z),width=net.widthAt(segment);
    if(distance>width+BANK_MAX)continue;
    // A basin is a coherent, level body rather than an overlapping circular
    // disc competing with the final river segment on distance alone.
    const basin=segment.kind==='lake'&&distance<=width;
    const winnerBasin=winner?.segment.kind==='lake'&&winner.distance<=winner.width;
    if(winner&&(winnerBasin&&!basin||winnerBasin===basin&&distance>=winner.distance))continue;
    winner={segment,distance,width,t};
  }
  return winner;
}

export function hydrographyColumnV1142(simplex,params,type,wx,wz,seed=params.seed,surface=null,originalHeight=undefined){
  const base=Number.isFinite(originalHeight)?originalHeight:
    surface?surface(wx,wz):advancedSurfaceHeight(simplex,params,type,wx,wz,V10_HEIGHT);
  const dry={height:base,waterY:null,kind:null,bank:false,ice:false,stable:true,source:false};
  if(type==='lava'||Math.hypot(wx-32,wz-32)<43)return dry;
  const net=networkFor(simplex,params,type);
  const nearestRiver=nearest(wx,wz,net.near(wx,wz),net);
  if(!nearestRiver)return dry;
  const {segment,distance,width,t}=nearestRiver;
  const lake=segment.kind==='lake';
  const top=lake?segment.top:
    Math.round(segment.a.h+(segment.b.h-segment.a.h)*t-1)+.5;
  const bed=Math.max(1,Math.round(top-1.5));
  const inner=distance<=width;
  const bankWidth=clamp(10+Math.max(0,base-bed)*.65,10,BANK_MAX);
  if(!inner&&distance>width+bankWidth)return dry;
  const carve=inner?bed:Math.round(bed+(base-bed)*smooth((distance-width)/bankWidth));
  const height=Math.max(1,Math.min(base,carve));
  if(!inner)return {...dry,height,bank:true};
  const localTop=Math.min(top,height+1.5);
  if(localTop<=height+.8)return {...dry,height,bank:true};
  const kind=lake?'lake':'river',waterY=localTop-.25;
  const source=!!segment.route.source&&segment.index===0&&
    Math.hypot(wx-segment.route.source.x,wz-segment.route.source.z)<.75;
  return {height,waterY,kind,bank:true,stable:true,source,
    ice:freezeColumn(type,seed,wx,wz,waterY,kind),
    flowX:lake?0:segment.b.x-segment.a.x,
    flowZ:lake?0:segment.b.z-segment.a.z,
    waterfall:!lake&&segment.a.h-segment.b.h>=2};
}

// Safe, read-only development interface. No mesh or fluid state is allocated.
export function hydrographyDebugNetworkV1142(simplex,params,type,minX,minZ,maxX,maxZ){
  const net=networkFor(simplex,params,type);
  net.near((minX+maxX)/2,(minZ+maxZ)/2);
  return net.routes.map(r=>{
    const path=r.join?r.path.slice(0,r.join.index+1):r.path;
    return {id:r.id,source:{...r.source},
      path:path.map((p,i)=>({...p,
        flow:net.widthAt(r.segments[Math.min(i,r.segments.length-1)]),
        fall:i>0&&r.path[i-1].h-p.h>=2?r.path[i-1].h-p.h:0})),
      end:r.join?'confluence':r.end,
      outlet:r.join?{x:r.path[r.join.index].x,z:r.path[r.join.index].z}:
        {x:r.last.x,z:r.last.z}};
  }).filter(r=>r.path.some(p=>p.x>=minX&&p.x<=maxX&&p.z>=minZ&&p.z<=maxZ));
}
