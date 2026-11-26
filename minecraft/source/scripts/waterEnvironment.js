// Local cavity water and snow. No renderer dependency; all rates use game
// seconds. Solid geometry is authoritative, including player-built seals.
import { voxelWaterColumn } from './waterVoxelsV1134.js';

export const ENVIRONMENT_LIMIT = 16384;
export const CAVITY_STEP = .25;
const SIDES = [[1,0],[-1,0],[0,1],[0,-1]];
const OPEN = new Set([0,9,21]);
const SNOW_SUPPORT = new Set([1,2,3,4,5,8,10,14,15,16,17,18,19,26,27,28]);
const key = (x,z) => `${x},${z}`;
const nodeKey = c => `${c.x},${c.z},${c.bottom}`;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export function permeability(id) {
  if(id===8)return .035;
  if([1,2,10,14].includes(id))return .009;
  // Compact rock and construction blocks seal the layer.
  return 0;
}

export function surfaceWater(world,x,z) {
  const width=world.chunkSize?.width??32;
  const chunk=world.getChunk?.(Math.floor(x/width),Math.floor(z/width));
  if(!chunk?.loaded)return null;
  const lx=x-chunk.position.x,lz=z-chunk.position.z,i=lz*width+lx;
  const column=chunk.waterColumns?.[i];
  const water=voxelWaterColumn(column,chunk.hydrologyGround?.[i]);
  return water ? {...water,x,z,chunk,index:i,column}:null;
}

export function waterAtPoint(world,position) {
  const x=Math.floor(position.x+.5),z=Math.floor(position.z+.5);
  const y=Math.floor(position.y+.5);
  if(!OPEN.has(world.getBlockId(x,y,z)))return null;
  const surface=surfaceWater(world,x,z);
  if(surface&&position.y>=surface.bottom&&position.y<surface.top-.015)
    return {...surface,depth:surface.top-position.y};
  const model=world.hydrology?.environment;
  for(const c of model?.columns.get(key(x,z))?.cavities??[]){
    const volume=model.water.get(nodeKey(c))??0;
    const top=c.bottom+Math.min(c.roof-c.bottom,volume);
    if(position.y>=c.bottom&&position.y<top-.015)
      return {bottom:c.bottom,top,depth:top-position.y,kind:'underground'};
  }
  return null;
}

// Equal-sized 1x1 cavity columns, separated by their REAL floors and roofs.
// A full tunnel transmits head from connected higher water without creating
// extra volume or rendering water through its roof. No compressible springs.
export function stepCavities(nodes,volumes,dt=CAVITY_STEP,drainScale=1) {
  dt=clamp(Number(dt)||0,0,CAVITY_STEP);
  const delta=new Map(),heads=new Map(),spent=new Map();
  const add=(k,v)=>delta.set(k,(delta.get(k)||0)+v);
  const columns=new Map();
  for(const [k,c] of nodes){
    const ck=key(c.x,c.z);
    if(!columns.has(ck))columns.set(ck,[]);
    columns.get(ck).push([k,c]);
    const volume=volumes.get(k)||0;
    heads.set(k,Math.max(c.bottom+volume,
      volume>=c.roof-c.bottom-.001?(c.boundaryHead??-Infinity):-Infinity));
  }
  const edges=[];
  for(const [k,c] of nodes)for(const [dx,dz] of [[1,0],[0,1]])
    for(const [nk,n] of columns.get(key(c.x+dx,c.z+dz))??[]){
      const sill=Math.max(c.bottom,n.bottom),roof=Math.min(c.roof,n.roof);
      if(roof>sill+.02)edges.push({k,nk,sill,roof});
    }
  // Highest head first, transmitted only through already flooded cells.
  // A dry air pocket cannot carry pressure to another chamber.
  const adjacency=new Map([...nodes.keys()].map(k=>[k,[]]));
  for(const e of edges){adjacency.get(e.k).push([e.nk,e]);adjacency.get(e.nk).push([e.k,e]);}
  const queue=[...nodes.keys()].sort((a,b)=>heads.get(b)-heads.get(a));
  for(let i=0;i<queue.length&&i<nodes.size*8;i++){
    const k=queue[i],head=heads.get(k);
    for(const [nk,e] of adjacency.get(k)){
      const n=nodes.get(nk);
      if((volumes.get(nk)||0)<n.roof-n.bottom-.001||head<=e.sill+.02)continue;
      if(head>heads.get(nk)+.001){heads.set(nk,head);queue.push(nk);}
    }
  }
  // Propose every edge from one snapshot, then scale all outgoing edges
  // together. Rotating iteration order cannot multiply a cell's water.
  const proposals=[],requested=new Map();
  for(const e of edges){
    let from=e.k,to=e.nk;
    if(heads.get(from)<heads.get(to))[from,to]=[to,from];
    const head=heads.get(from),diff=head-Math.max(heads.get(to),e.sill);
    if(diff<=.003||head<=e.sill+.003)continue;
    const amount=Math.min(.35*dt,diff*.55*dt);
    proposals.push({from,to,amount});requested.set(from,(requested.get(from)||0)+amount);
  }
  for(const {from,to,amount} of proposals){
    const donor=volumes.get(from)||0,n=nodes.get(to);
    const available=donor*.45;
    const scaled=amount*Math.min(1,available/(requested.get(from)||1));
    const room=Math.max(0,n.roof-n.bottom-(volumes.get(to)||0)-(delta.get(to)||0));
    const moved=Math.min(scaled,room,Math.max(0,donor-(spent.get(from)||0)));
    add(from,-moved);add(to,moved);spent.set(from,(spent.get(from)||0)+moved);
  }
  let drained=0;
  const result=new Map(volumes);
  for(const [k,c] of nodes){
    let v=Math.max(0,(volumes.get(k)||0)+(delta.get(k)||0));
    // Explicit off-domain drainage represents deeper aquifers, not another
    // visible cave. A sealed construction floor has no such natural drain.
    const loss=Math.min(v,(c.drain??0)*v*dt*drainScale);
    v-=loss;drained+=loss;result.set(k,v);
  }
  return {volumes:result,drained,heads};
}

export class WaterEnvironment {
  constructor(world,onChange=()=>{}){this.world=world;this.onChange=onChange;this.clear();}
  clear(){
    this.water=new Map();this.snow=new Map();this.columns=new Map();
    this.elapsed=0;this.seconds=0;this.cursor=0;this.scanCenter='';this.scan=[];this.revision=(this.revision??0)+1;
    this.epoch=-1;this.ledger={initial:0,inflow:0,drainage:0,displaced:0};
  }
  invalidate(x,z){this.columns.delete(key(x,z));this.revision++;}
  balanceError(){
    const total=[...this.water].filter(([k])=>{const [x,z]=k.split(',').map(Number);return !this.world.hydrology?.basins?.ownsColumn(x,z);}).reduce((s,[,v])=>s+v,0),l=this.ledger;
    return total-(l.initial+l.inflow-l.drainage-l.displaced);
  }
  readColumn(x,z){
    const w=this.world,width=w.chunkSize?.width??32;
    const chunk=w.getChunk?.(Math.floor(x/width),Math.floor(z/width));
    if(!chunk?.loaded)return null;
    const old=this.columns.get(key(x,z));
    const managed=w.hydrology?.basins?.columns.get(key(x,z));
    if(managed?.chunk===chunk){
      const result={x,z,chunk,top:managed.top,cavities:managed.nodes.filter(c=>!c.outdoor),basinOwned:true};
      this.columns.set(key(x,z),result);
      for(const c of result.cavities)this.water.set(nodeKey(c),c.volume);
      return result;
    }
    if(old?.chunk===chunk)return old;
    let cavities=[];const height=w.chunkSize.height;
    let start=null,top=-1;
    for(let y=1;y<height;y++){
      const id=w.getBlockId(x,y,z);
      if(!OPEN.has(id)){
        top=y;
        if(start!==null){
          const bottom=start-.5,roof=y-.5;
          cavities.push({x,z,bottom,roof,drain:permeability(w.getBlockId(x,start-1,z))*.9+
            ([3,4,5,19,27].includes(w.getBlockId(x,start-1,z))?.004:0)});
          start=null;
        }
      }else if(start===null)start=y;
    }
    const surface=surfaceWater(w,x,z);
    // A roof over an existing river does not create a second water domain.
    // Underground water needs a separate physical floor below that river.
    if(surface)cavities=cavities.filter(c=>
      !(surface.bottom<=c.bottom+.001&&surface.top>c.bottom+.001));
    const result={x,z,chunk,cavities,top};
    // Transfer saved volume into the surviving free space after an edit.
    // Solid placement displaces water explicitly rather than burying it.
    const records=[...this.water].filter(([k])=>k.startsWith(`${x},${z},`));
    for(const [k,v] of records){
      if(cavities.some(c=>nodeKey(c)===k))continue;
      const bottom=Number(k.split(',')[2]);
      const recipient=cavities.find(c=>c.bottom<bottom+v+.001&&c.roof>bottom);
      if(recipient){const rk=nodeKey(recipient);this.water.set(rk,(this.water.get(rk)||0)+v);}
      else this.ledger.displaced+=v;
      this.water.delete(k);
    }
    for(const c of cavities){
      const k=nodeKey(c);
      let edited=false;
      for(let y=Math.ceil(c.bottom);y<c.roof;y++)
        if(w.dataStore?.get?.(chunk.position.x,chunk.position.z,x-chunk.position.x,y,z-chunk.position.z)===0){edited=true;break;}
      const table=Math.max(5,(w.params.terrain.waterOffset??4)+2)+
        1.7*Math.sin((x+(w.params.seed%157))/43)+1.2*Math.cos(z/51);
      c.natural=!edited&&c.bottom<20?Math.min(.65,Math.max(0,table-c.bottom)):0;
      if(!this.water.has(k)&&this.water.size<ENVIRONMENT_LIMIT){
        // Shallow, deterministic natural streams in EXISTING hollow caves.
        // They never carve away a player's blocks or flood whole caverns.
        const v=c.natural;
        this.water.set(k,v);this.ledger.initial+=v;
      }
      const current=this.water.get(k)||0;
      if(current>c.roof-c.bottom){this.ledger.displaced+=current-(c.roof-c.bottom);this.water.set(k,c.roof-c.bottom);}
    }
    this.columns.set(key(x,z),result);this.revision++;
    return result;
  }
  update(dt,position,weather={},active=true){
    if(!active||!position||this.world.type==='lava')return;
    this.seconds+=Math.max(0,dt);
    if(this.epoch!==this.world.terrainEpoch){for(const [k,c] of this.columns)if(!this.world.hydrology?.basins?.ownsColumn(c.x,c.z))this.columns.delete(k);this.scanCenter='';this.epoch=this.world.terrainEpoch;this.revision++;}
    const cx=Math.round(position.x/8)*8,cz=Math.round(position.z/8)*8;
    if(this.scanCenter!==key(cx,cz)){
      this.scanCenter=key(cx,cz);this.scan=[];this.cursor=0;
      for(let dz=-20;dz<=20;dz++)for(let dx=-20;dx<=20;dx++)
        if(dx*dx+dz*dz<=400)this.scan.push([cx+dx,cz+dz]);
      this.scan.sort((a,b)=>(a[0]-cx)**2+(a[1]-cz)**2-((b[0]-cx)**2+(b[1]-cz)**2));
      for(const [k,c] of this.columns)if((Math.abs(c.x-cx)>32||Math.abs(c.z-cz)>32)&&!this.world.hydrology?.basins?.ownsColumn(c.x,c.z))this.columns.delete(k);
    }
    this.elapsed=Math.min(.5,this.elapsed+Math.max(0,dt));
    if(this.elapsed<CAVITY_STEP)return;
    this.elapsed-=CAVITY_STEP;
    // Fixed work budget: no flood fill of the entire world on a frame.
    for(let i=0;i<48&&this.scan.length;i++){
      const [x,z]=this.scan[this.cursor++%this.scan.length];
      const c=this.readColumn(x,z);
      if(c){
        this.updateSnow(c,weather,Math.max(0,this.seconds-(c.snowTime??this.seconds)));
        c.snowTime=this.seconds;
      }
    }
    this.step(CAVITY_STEP);
  }
  step(dt){
    const nodes=new Map();
    for(const column of this.columns.values()){
      if(!column.chunk.loaded||this.world.getChunk(Math.floor(column.x/32),Math.floor(column.z/32))!==column.chunk)continue;
      if(this.world.hydrology?.basins?.ownsColumn(column.x,column.z))continue;
      for(const c of column.cavities)if(this.water.has(nodeKey(c)))nodes.set(nodeKey(c),c);
    }
    let inflow=0,inletBudget=.25*dt;
    for(const [k,c] of nodes){
      let v=this.water.get(k)||0;
      const shared=surfaceWater(this.world,c.x,c.z);
      if(shared&&shared.bottom<=c.bottom+.001&&shared.top>c.bottom+.001){
        // Reconcile saves made before domains were separated. These are
        // duplicate volumes, not another spring beneath a covered channel.
        this.ledger.displaced+=v;this.water.set(k,0);nodes.delete(k);continue;
      }
      // Recharge stops at the shallow natural channel level. The matching
      // deep-aquifer drain balances it at rest; no unlimited cave sources.
      const target=c.natural||0;
      const recharge=Math.min(Math.max(0,target-v),(c.drain??0)*target*dt);
      v+=recharge;inflow+=recharge;
      let incoming=0;
      const requests=[];
      c.boundaryHead=null;
      const own=surfaceWater(this.world,c.x,c.z);
      if(own&&own.bottom>=c.roof-.001){
        let conductance=Infinity;
        for(let y=Math.ceil(c.roof);y<own.bottom;y++)
          conductance=Math.min(conductance,permeability(this.world.getBlockId(c.x,y,c.z)));
        if(Number.isFinite(conductance)&&conductance>0)
          requests.push([own,Math.min(.03,conductance)*dt]);
      }
      // Open side entrances connect cave water to real surface water. Each
      // boundary inlet is capped; the natural surface is a declared reservoir.
      for(const [dx,dz] of SIDES){
        const s=surfaceWater(this.world,c.x+dx,c.z+dz);
        if(!s||s.top<=c.bottom+.01||s.bottom>=c.roof)continue;
        const sill=Math.max(c.bottom,s.bottom),head=c.bottom+v;
        const openingY=Math.floor(sill+.51);
        if(!OPEN.has(this.world.getBlockId(c.x,openingY,c.z))||
          !OPEN.has(this.world.getBlockId(c.x+dx,openingY,c.z+dz)))continue;
        if(s.top>head+.01){
          requests.push([s,Math.min(.12,(s.top-Math.max(head,sill))*.22)*dt]);
          c.boundaryHead=Math.max(c.boundaryHead??-Infinity,s.top);
        }else if(head>s.top+.01&&head>sill){
          const out=Math.min(v*.25,.12*dt,(head-Math.max(s.top,sill))*.22*dt);
          const returned=this.world.hydrology?.basins?.ownsColumn(s.x,s.z)
            ?this.world.hydrology.basins.exchange(s.x,s.z,s.bottom,out):out;
          v-=returned;this.ledger.drainage+=returned;
        }
      }
      for(const [source,wanted] of requests){
        const request=Math.min(wanted,Math.max(0,c.roof-c.bottom-v-incoming),inletBudget);
        const admitted=this.takeSurface(source,request);
        incoming+=admitted;inletBudget-=admitted;
      }
      v+=incoming;inflow+=incoming;this.water.set(k,v);
    }
    const before=[...nodes.keys()].reduce((s,k)=>s+(this.water.get(k)||0),0);
    const result=stepCavities(nodes,this.water,dt);
    this.water=result.volumes;this.ledger.inflow+=inflow;this.ledger.drainage+=result.drained;
    for(const [k,c] of nodes){
      const volume=this.water.get(k)||0;
      if(Math.abs(volume-(c.surfaceRenderVolume??-1))<.035)continue;
      c.surfaceRenderVolume=volume;
      for(const [dx,dz] of SIDES){
        const x=c.x+dx,z=c.z+dz;
        if(surfaceWater(this.world,x,z))
          this.world.hydrology?.pressureDirtyChunks?.add(key(Math.floor(x/32),Math.floor(z/32)));
      }
    }
    if(inflow||result.drained||before){this.revision++;this.onChange();}
  }
  takeSurface(source,requested){
    const engine=this.world.hydrology;
    if(!requested)return 0;
    if(engine?.basins?.ownsColumn(source.x,source.z))return -engine.basins.exchange(source.x,source.z,source.bottom,-requested);
    // Legacy/synthetic worlds have only a prescribed surface reservoir.
    if(!(engine?.pressureVolumes instanceof Map))return requested;
    const k=key(source.x,source.z),extra=engine.pressureVolumes.get(k)||0;
    const baseline=source.chunk.naturalWaterColumns?.[source.index]||engine.flowCells.get(k);
    const admitted=baseline?requested:Math.min(requested,extra);
    const debit=Math.min(extra,admitted);
    if(debit){
      if(extra>debit)engine.pressureVolumes.set(k,extra-debit);else engine.pressureVolumes.delete(k);
      engine.pressureDirtyChunks.add(key(Math.floor(source.x/32),Math.floor(source.z/32)));
    }
    return admitted;
  }
  updateSnow(c,weather,dt){
    if(c.top<0)return;
    const {x,z}=c,w=this.world,k=key(x,z),y=c.top,id=w.getBlockId(x,y,z);
    const water=surfaceWater(w,x,z),wet=water&&water.top>y+.505&&water.bottom<=y+.51;
    let record=this.snow.get(k);
    if(record&&record.y!==y){this.snow.delete(k);record=null;this.revision++;this.onChange();}
    if(wet){
      if(record){this.snow.delete(k);this.revision++;this.onChange();}
      if(id===10){w.washSnowBlock?.(x,y,z);this.onChange();}
      return;
    }
    if(!SNOW_SUPPORT.has(id))return;
    const snow=Math.max(0,weather.snow||0);
    let depth=record?.depth||0;
    const previous=depth;
    if(snow>.12)depth=Math.min(.18,depth+snow*.0025*Math.min(dt,8));
    else if(weather.rain>.1)depth=Math.max(0,depth-weather.rain*.005*Math.min(dt,8));
    if(Math.abs(previous-depth)<1e-7)return;
    if(depth>.001&&(record||this.snow.size<ENVIRONMENT_LIMIT))this.snow.set(k,{x,z,y,depth});
    else this.snow.delete(k);
    this.revision++;this.onChange();
  }
  snapshot(){return {water:[...this.water].filter(([k])=>{const [x,z]=k.split(',').map(Number);return !this.world.hydrology?.basins?.ownsColumn(x,z);}).map(([k,v])=>[...k.split(',').map(Number),v]),
    snow:[...this.snow.values()].map(c=>[c.x,c.z,c.y,c.depth])};}
  restore(raw){
    if(!raw)return;
    for(const [x,z,bottom,v] of raw.water??[])this.water.set(`${x},${z},${bottom}`,v);
    for(const [x,z,y,depth] of raw.snow??[])this.snow.set(key(x,z),{x,z,y,depth});
    this.ledger.initial=[...this.water.values()].reduce((s,v)=>s+v,0);this.revision++;
  }
}
