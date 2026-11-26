import { liquidOccluder } from './liquidShell.js';
import { voxelWaterColumn } from './waterVoxelsV1134.js';

export const BASIN_COLUMNS = 4096;
export const BASIN_NODES = 16384;
export const BASIN_STEP = .1;
const SIDES=[[1,0],[-1,0],[0,1],[0,-1]];
const ck=(x,z)=>`${x},${z}`;
const nk=c=>`${c.x},${c.z},${c.bottom}`;
const eps=1e-9;
const capacity=c=>Math.max(0,c.roof-c.bottom);
export function fallWidth(rate){return Math.max(.08,Math.min(1,Math.sqrt(Math.max(0,rate)/.6)));}

/** Lake pressure settles across an already wetted, unobstructed free
 * surface. This conservative relaxation avoids minutes of lattice diffusion
 * in a short blind canal, without bypassing a roofed or restricted opening. */
function settleLakePools(nodes,edges,dt){
  const links=new Map(),eligible=c=>(c.kind==='lake'||c.kind==='oasis')&&c.volume>1e-8&&c.volume<capacity(c)-.001;
  for(const e of edges){
    const a=nodes.get(e.a),b=nodes.get(e.b),ha=a.bottom+a.volume,hb=b.bottom+b.volume;
    if(!eligible(a)||!eligible(b)||Math.min(ha,hb)<=e.sill+.001||Math.max(ha,hb)>=e.roof-.001)continue;
    if(!links.has(e.a))links.set(e.a,[]);if(!links.has(e.b))links.set(e.b,[]);
    links.get(e.a).push(e.b);links.get(e.b).push(e.a);
  }
  const seen=new Set(),alpha=1-Math.exp(-dt/1.2);
  for(const key of links.keys()){
    if(seen.has(key))continue;
    const pool=[key];seen.add(key);
    for(const k of pool)for(const other of links.get(k)||[])if(!seen.has(other)){seen.add(other);pool.push(other);}
    if(pool.length<2)continue;
    const cells=pool.map(k=>nodes.get(k)),volume=cells.reduce((s,c)=>s+c.volume,0);
    let low=Infinity,high=-Infinity,bottoms=0,minimumRoof=Infinity;
    for(const c of cells){low=Math.min(low,c.bottom);high=Math.max(high,c.bottom+c.volume);bottoms+=c.bottom;minimumRoof=Math.min(minimumRoof,c.roof);}
    // The usual fully wetted lake has an exact O(n) solution. Only pools
    // which expose a floor or meet a ceiling need the bounded search.
    const level=(volume+bottoms)/cells.length;
    const maximumBottom=Math.max(...cells.map(c=>c.bottom));
    if(level>=maximumBottom&&level<=minimumRoof)low=high=level;
    else for(let pass=0;pass<32;pass++){
      const level=(low+high)/2,total=cells.reduce((s,c)=>s+Math.max(0,Math.min(capacity(c),level-c.bottom)),0);
      if(total>volume)high=level;else low=level;
    }
    const target=cells.map(c=>Math.max(0,Math.min(capacity(c),(low+high)/2-c.bottom)));
    let remainder=volume-target.reduce((a,b)=>a+b,0);
    for(let i=0;i<cells.length&&Math.abs(remainder)>1e-14;i++){
      const change=Math.max(-target[i],Math.min(capacity(cells[i])-target[i],remainder));target[i]+=change;remainder-=change;
    }
    cells.forEach((c,i)=>{c.volume+=(target[i]-c.volume)*alpha;});
  }
}

// Geometry changes only when a column is added, edited, loaded or unloaded.
// Reuse this graph for the many volume-only steps between those changes.
function basinTopology(nodes){
  const byColumn=new Map(),edges=[],adjacency=new Map(),covered=[];
  for(const [k,c] of nodes){
    const group=ck(c.x,c.z);if(!byColumn.has(group))byColumn.set(group,[]);byColumn.get(group).push(k);
    adjacency.set(k,[]);if(!c.outdoor)covered.push([k,c]);
  }
  for(const [k,c] of nodes)for(const [dx,dz] of [[1,0],[0,1]])for(const other of byColumn.get(ck(c.x+dx,c.z+dz))||[]){
    const n=nodes.get(other),sill=Math.max(c.bottom,n.bottom),roof=Math.min(c.roof,n.roof);
    if(roof>sill+.001){const e={a:k,b:other,dx,dz,sill,roof};edges.push(e);adjacency.get(k).push([other,e]);adjacency.get(other).push([k,e]);}
  }
  return {edges,adjacency,covered};
}

/** Finite volumes in real air spans. A lake is stored water, never a source.
 * All edge proposals debit one node and credit another. A filled opening can
 * transmit pressure above its roof; it never stores water inside the wall. */
export function stepBasinWater(nodes,dt=BASIN_STEP,{evaporation=0,infiltration=0,topology=null}={}){
  dt=Math.min(BASIN_STEP,Math.max(0,Number(dt)||0));
  const volumes=new Map(),heads=new Map();
  let supplied=0,evaporated=0,infiltrated=0;
  for(const [k,c] of nodes){
    let v=Math.max(0,c.volume);
    const supply=Math.min(Math.max(0,(c.sourceHead??c.bottom)-c.bottom-v),Math.max(0,c.sourceRate||0)*dt,Math.max(0,capacity(c)-v));
    v+=supply;supplied+=supply;volumes.set(k,v);heads.set(k,c.bottom+v);
    c.flowX=0;c.flowZ=0;c.fallRate=0;c.fallEdges=[0,0,0,0];
  }
  const {edges,adjacency,covered}=topology||basinTopology(nodes);
  // Hydrostatic pressure in filled spans is determined by connected heads,
  // not by treating the top of a plugged column as its only possible outlet.
  for(let pass=0;pass<8;pass++)for(const [k,c] of covered){
    if(c.outdoor||volumes.get(k)<capacity(c)-1e-6)continue;
    let sum=0,weights=0;
    for(const [other,e] of adjacency.get(k)){
      const w=e.roof-e.sill;sum+=Math.max(e.sill,heads.get(other))*w;weights+=w;
    }
    if(weights)heads.set(k,Math.max(c.roof,sum/weights));
  }
  const requests=[],out=new Map(),incoming=new Map();
  for(const e of edges){
    let from=e.a,to=e.b,dx=e.dx,dz=e.dz;
    if(heads.get(from)<heads.get(to)){[from,to]=[to,from];dx=-dx;dz=-dz;}
    const head=heads.get(from),difference=head-Math.max(heads.get(to),e.sill);
    const opening=Math.max(0,Math.min(e.roof,head)-e.sill);
    if(difference<1e-7||opening<1e-7||volumes.get(from)<=eps)continue;
    const wanted=Math.min(difference*.16*dt/BASIN_STEP,1.6*opening*Math.sqrt(difference)*dt);
    const r={from,to,dx,dz,amount:wanted};requests.push(r);
    out.set(from,(out.get(from)||0)+wanted);
  }
  for(const r of requests){
    r.amount*=Math.min(1,volumes.get(r.from)*.55/(out.get(r.from)||1));
  }
  // Receiving capacity includes simultaneous outflow, so a full, open hole
  // can carry water steadily without alternately emptying and refilling.
  for(let pass=0;pass<12;pass++){
    out.clear();incoming.clear();
    for(const r of requests){out.set(r.from,(out.get(r.from)||0)+r.amount);incoming.set(r.to,(incoming.get(r.to)||0)+r.amount);}
    let adjusted=false;
    for(const r of requests){
      const room=Math.max(0,capacity(nodes.get(r.to))-volumes.get(r.to)+(out.get(r.to)||0));
      const demand=incoming.get(r.to)||0;
      if(demand>room+1e-10){r.amount*=room/demand;adjusted=true;}
    }
    if(!adjusted)break;
  }
  const delta=new Map();
  for(const r of requests){
    delta.set(r.from,(delta.get(r.from)||0)-r.amount);delta.set(r.to,(delta.get(r.to)||0)+r.amount);
    const c=nodes.get(r.from),n=nodes.get(r.to),rate=dt?r.amount/dt:0;
    c.flowX+=r.dx*rate;c.flowZ+=r.dz*rate;
    if(c.bottom>n.bottom+.5){c.fallRate+=rate;c.fallEdges[r.dx>0?0:r.dx<0?1:r.dz>0?2:3]+=rate;}
    if(r.amount>0&&volumes.get(r.to)<1e-7)n.kind=c.kind;
  }
  for(const [k,c] of nodes){
    let v=Math.max(0,volumes.get(k)+(delta.get(k)||0));
    // Do not remove tiny remainders by a visual visibility threshold.
    const dry=Math.min(v,c.outdoor?evaporation*dt:0);v-=dry;evaporated+=dry;
    const soak=Math.min(v,(c.permeability||0)*infiltration*dt);v-=soak;infiltrated+=soak;
    c.volume=v;
  }
  settleLakePools(nodes,edges,dt);
  return {supplied,evaporated,infiltrated,transferred:requests.reduce((s,r)=>s+r.amount,0)};
}

/** Activated by edits only. Outside the bounded loaded domain is a closed
 * boundary; inaccessible water is neither discarded nor replenished. */
export class BasinHydrology {
  constructor(engine){this.engine=engine;this.world=engine.world;this.clear();}
  clear(){this.columns=new Map();this.nodes=new Map();this.restored=new Map();this.displaced=new Map();this.dirty=new Set();this.accumulator=0;this.visualElapsed=0;this.meshQueue=new Set();this.active=null;this.topology=null;this.activeChunks=new Set();this.activation=[];this.ledger={initial:0,supplied:0,evaporated:0,infiltrated:0,exchangeIn:0,exchangeOut:0};}
  supported(){return typeof this.world?.getBlockId==='function'&&Number.isInteger(this.world.chunkSize?.height);}
  ownsColumn(x,z){return this.columns.has(ck(x,z))||this.restored.has(ck(x,z));}
  total(){let v=0;for(const c of this.nodes.values())v+=c.volume;for(const c of this.restored.values())for(const n of c)v+=n.volume;for(const n of this.displaced.values())v+=n;return v;}
  balanceError(){const l=this.ledger;return this.total()-(l.initial+l.supplied+l.exchangeIn-l.exchangeOut-l.evaporated-l.infiltrated);}
  chunkAt(x,z){const w=this.world.chunkSize.width;const c=this.world.getChunk(Math.floor(x/w),Math.floor(z/w));return c?.loaded?c:null;}
  readSpans(x,z){
    const w=this.world,height=w.chunkSize.height,spans=[];let start=null,top=0;
    for(let y=1;y<height;y++){
      if(liquidOccluder(w.getBlockId(x,y,z))){
        top=y;if(start!==null){spans.push({x,z,bottom:start-.5,roof:y-.5,outdoor:false});start=null;}
      }else if(start===null)start=y;
    }
    if(start!==null)spans.push({x,z,bottom:start-.5,roof:height-.5,outdoor:true});
    for(const c of spans){const id=w.getBlockId(x,Math.round(c.bottom-.5),z);c.permeability=id===8?.0012:[1,2,10,14].includes(id)?.00035:0;}
    return {spans,top};
  }
  seedColumn(x,z){
    const id=ck(x,z);if(this.columns.has(id))return this.columns.get(id);
    const chunk=this.chunkAt(x,z);if(!chunk||this.columns.size>=BASIN_COLUMNS)return null;
    const {spans,top}=this.readSpans(x,z);if(this.nodes.size+spans.length>BASIN_NODES)return null;
    const width=this.world.chunkSize.width,ix=x-chunk.position.x,iz=z-chunk.position.z,index=iz*width+ix;
    const wasRestored=this.restored.has(id),saved=this.restored.get(id);
    const current=chunk.waterColumns?.[index];
    const bed=current?.dynamic?current.bed:chunk.naturalWaterGround?.[index]??chunk.hydrologyGround?.[index];
    const water=!wasRestored?voxelWaterColumn(current,bed):null;
    const env=this.engine.environment,existing=[];
    if(water){
      let ice=0;
      for(let y=Math.floor(water.bottom+.5);y<water.top+.5;y++)if(this.world.getBlockId(x,y,z)===28)
        ice+=Math.max(0,Math.min(water.top,y+.5)-Math.max(water.bottom,y-.5));
      const volume=Math.max(0,water.top-water.bottom-ice);
      if(volume>0)existing.push({bottom:water.bottom,volume,kind:current.kind});
    }
    for(const [key,v] of env.water)if(key.startsWith(id+',')){
      if(!wasRestored&&v>0)existing.push({bottom:Number(key.split(',')[2]),volume:v,kind:'river'});
      if(!env.columns.get(id)?.basinOwned)env.ledger.displaced+=v;env.water.delete(key);
    }
    const original=chunk.naturalWaterColumns?.[index]??current;
    const sourceWater=voxelWaterColumn(original,chunk.naturalWaterGround?.[index]??bed);
    const column={x,z,chunk,index,top,nodes:[]};this.columns.set(id,column);
    for(const span of spans){
      const c={...span,finite:true,kind:current?.kind||original?.kind||'river',volume:0,sourceRate:0,sourceHead:0};
      // Only actual river springs, or a declared river inlet entering from an
      // unloaded upstream chunk, replenish water. Lakes never self-refill.
      if(original?.kind==='river'&&sourceWater&&c.bottom<=sourceWater.bottom+.001&&c.roof>sourceWater.bottom+.001){
        const fx=original.flowX||0,fz=original.flowZ||0;
        const inlet=SIDES.some(([dx,dz])=>fx*dx+fz*dz<-.2*Math.hypot(fx,fz)&&!this.chunkAt(x+dx,z+dz));
        if(original.source||inlet){c.sourceRate=.25;c.sourceHead=sourceWater.top+1;}
      }
      this.nodes.set(nk(c),c);column.nodes.push(c);this.active=null;
    }
    for(const record of saved||existing){
      const remaining=this.assignVolume(column,record.bottom,record.volume,record.kind);
      if(remaining)this.displaced.set(id,(this.displaced.get(id)||0)+remaining);
      if(!wasRestored)this.ledger.initial+=record.volume;
    }
    this.restored.delete(id);
    this.engine.flowCells.delete(id);this.engine.pressureVolumes.delete(id);
    this.engine.pressureInlets.delete(id);this.engine.pressureDrains.delete(id);
    this.dirty.add(id);return column;
  }
  assignVolume(column,bottom,volume,kind=null){
    let remaining=volume;
    const spans=[...column.nodes].sort((a,b)=>Math.abs(a.bottom-bottom)-Math.abs(b.bottom-bottom));
    for(const c of spans){const add=Math.min(remaining,Math.max(0,capacity(c)-c.volume));c.volume+=add;if(add>0&&kind)c.kind=kind;remaining-=add;if(remaining<eps)break;}
    return remaining;
  }
  edit(x,y,z){
    if(!this.supported())return false;
    const id=ck(x,z),old=this.columns.get(id);
    if(old){
      const records=old.nodes.map(c=>({bottom:c.bottom,volume:c.volume,kind:c.kind}));
      for(const c of old.nodes)this.nodes.delete(nk(c));this.columns.delete(id);this.active=null;
      this.restored.set(id,records);this.seedColumn(x,z);
    }
    const queue=this.activation.splice(0),seen=new Set();
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      const wx=x+dx,wz=z+dz,chunk=this.chunkAt(wx,wz);if(!chunk)continue;
      const width=this.world.chunkSize.width,index=(wz-chunk.position.z)*width+wx-chunk.position.x;
      if(this.ownsColumn(wx,wz)||chunk.waterColumns?.[index])queue.push([wx,wz]);
    }
    let i=0;const initialSize=this.columns.size;
    for(;i<queue.length&&this.columns.size<BASIN_COLUMNS;i++){
      if(this.columns.size-initialSize>=64)break;
      const [wx,wz]=queue[i],k=ck(wx,wz);if(seen.has(k))continue;seen.add(k);
      const c=this.seedColumn(wx,wz);if(!c)continue;
      if(!c.nodes.some(n=>n.volume>.00001))continue;
      for(const [dx,dz] of SIDES){
        const next=this.seedColumn(wx+dx,wz+dz);
        if(next?.nodes.some(n=>n.volume>.00001))queue.push([wx+dx,wz+dz]);
      }
    }
    this.activation.push(...queue.slice(i));
    // The edited dry cell becomes a candidate as soon as its bank opens.
    if(queue.length)this.seedColumn(x,z);
    this.publish();return true;
  }
  expand(){
    if(this.columns.size>=BASIN_COLUMNS){this.activation.length=0;return;}
    let added=0,processed=0;
    while(this.activation.length&&added<24&&processed++<64){
      const [x,z]=this.activation.shift(),before=this.columns.size;
      const column=this.seedColumn(x,z);added+=this.columns.size-before;
      if(column?.nodes.some(c=>c.volume>.00001))for(const [dx,dz] of SIDES){
        if(!this.ownsColumn(x+dx,z+dz))this.activation.push([x+dx,z+dz]);
      }
    }

    for(const c of [...this.nodes.values()]){
      if(c.volume<.002||this.chunkAt(c.x,c.z)!==this.columns.get(ck(c.x,c.z))?.chunk)continue;
      const head=c.bottom+c.volume;
      for(const [dx,dz] of SIDES){
        const x=c.x+dx,z=c.z+dz;if(this.ownsColumn(x,z))continue;
        if(added>=24)return;
        const chunk=this.chunkAt(x,z);if(!chunk)continue;
        const bed=chunk.hydrologyGround?.[(z-chunk.position.z)*this.world.chunkSize.width+x-chunk.position.x];
        if(Number.isFinite(bed)&&bed>=head&&c.outdoor)continue;
        if(this.seedColumn(x,z))added++;
      }
    }
  }
  update(dt){
    this.flushMeshes();
    if(!this.columns.size)return;
    this.accumulator=Math.min(.3,this.accumulator+Math.max(0,dt));
    if(this.accumulator>=BASIN_STEP){
      this.expand();this.releaseDisplaced();
      const chunks=new Set();
      for(const column of this.columns.values())if(this.chunkAt(column.x,column.z)===column.chunk)chunks.add(column.chunk);
      if(!this.active||chunks.size!==this.activeChunks.size||[...chunks].some(c=>!this.activeChunks.has(c))){
        this.activeChunks=chunks;
        this.active=new Map([...this.nodes].filter(([,c])=>chunks.has(this.columns.get(ck(c.x,c.z))?.chunk)));
        this.topology=basinTopology(this.active);
      }
      const active=this.active;
      const result=stepBasinWater(active,BASIN_STEP,{evaporation:.00008,infiltration:1,topology:this.topology});
      for(const k of ['supplied','evaporated','infiltrated'])this.ledger[k]+=result[k];
      for(const c of active.values())if(Math.abs(c.volume-(c.renderedVolume??-1))>.002||Math.abs((c.fallRate||0)-(c.renderedFallRate||0))>Math.max(.0005,(c.renderedFallRate||0)*.15)||((c.fallRate||0)>1e-7)!==((c.renderedFallRate||0)>1e-7))this.dirty.add(ck(c.x,c.z));
      this.accumulator-=BASIN_STEP;
    }
    this.visualElapsed+=dt;if(this.visualElapsed>=.25){this.publish();this.visualElapsed=0;}
  }
  releaseDisplaced(){
    for(const [id,v] of this.displaced){
      const [x,z]=id.split(',').map(Number);let remaining=v;
      for(const [dx,dz] of [[0,0],...SIDES]){
        const c=this.columns.get(ck(x+dx,z+dz));if(c&&this.chunkAt(c.x,c.z)===c.chunk){remaining=this.assignVolume(c,-Infinity,remaining);this.dirty.add(ck(c.x,c.z));}
      }
      if(remaining>0)this.displaced.set(id,remaining);else this.displaced.delete(id);
    }
  }
  publish(){
    if(!this.dirty.size)return;
    const env=this.engine.environment,refresh=new Set();let caveChanged=false;
    for(const id of this.dirty){
      const column=this.columns.get(id);if(!column||this.chunkAt(column.x,column.z)!==column.chunk)continue;
      const {chunk,index,x,z}=column;
      // Delete only this column's old spans, never scan the whole water map.
      const oldCavities=env.columns.get(id)?.cavities||[];
      for(const c of oldCavities)env.water.delete(nk(c));
      const outdoor=column.nodes.find(c=>c.outdoor),wet=outdoor?.volume>.00001?outdoor:null;
      chunk.waterColumns[index]=wet?{kind:wet.kind,bed:wet.bottom,y:wet.bottom+wet.volume-.25,depth:wet.volume,
        dynamic:true,finite:true,stable:false,source:wet.sourceRate>0,flowing:true,
        flowX:wet.flowX||0,flowZ:wet.flowZ||0,fallRate:wet.fallRate||0,fallEdges:wet.fallEdges,fallWidth:fallWidth(wet.fallRate||0)}:null;
      const cavities=column.nodes.filter(c=>!c.outdoor);
      env.columns.set(id,{x,z,chunk,top:column.top,cavities,basinOwned:true});
      if(oldCavities.some(c=>(c.renderedVolume||0)>.001)||cavities.some(c=>c.volume>.001))caveChanged=true;
      for(const c of cavities)env.water.set(nk(c),c.volume);
      for(const c of column.nodes){c.renderedVolume=c.volume;c.renderedFallRate=c.fallRate||0;}
      const width=this.world.chunkSize.width;
      // Only vertices on a shared border can affect a neighbouring mesh.
      const lx=x-chunk.position.x,lz=z-chunk.position.z;
      const xs=[0],zs=[0];if(lx===0)xs.push(-1);if(lx===width-1)xs.push(1);
      if(lz===0)zs.push(-1);if(lz===width-1)zs.push(1);
      for(const dz of zs)for(const dx of xs){
        const n=this.world.getChunk(Math.floor(x/width)+dx,Math.floor(z/width)+dz);if(n?.loaded)refresh.add(n);
      }
    }
    this.dirty.clear();if(caveChanged)env.revision++;
    for(const chunk of refresh)this.meshQueue.add(chunk);this.engine.onChange();
  }
  flushMeshes(){
    // A slow frame must not trigger a burst of whole-chunk allocations, nor
    // multiple catch-up simulation steps. Heights still interpolate on GPU.
    for(const chunk of this.meshQueue){
      this.meshQueue.delete(chunk);
      if(chunk.loaded){chunk.refreshWater();break;}
    }
  }
  exchange(x,z,bottom,amount){
    const column=this.columns.get(ck(x,z));if(!column)return 0;
    const node=column.nodes.find(c=>Math.abs(c.bottom-bottom)<.001);if(!node)return 0;
    const moved=amount>0?Math.min(amount,Math.max(0,capacity(node)-node.volume)):-Math.min(-amount,node.volume);
    node.volume+=moved;if(moved>0)this.ledger.exchangeIn+=moved;else this.ledger.exchangeOut-=moved;
    this.dirty.add(ck(x,z));return moved;
  }
  snapshot(){return {columns:[...this.columns.values()].map(c=>[c.x,c.z,c.nodes.map(n=>[n.bottom,n.volume,n.kind])]).concat([...this.restored].map(([id,nodes])=>[...id.split(',').map(Number),nodes.map(n=>[n.bottom,n.volume,n.kind||'river'])])),displaced:[...this.displaced].map(([id,v])=>[...id.split(',').map(Number),v])};}
  restore(raw){
    for(const [x,z,nodes] of raw?.columns||[])this.restored.set(ck(x,z),nodes.map(([bottom,volume,kind])=>({bottom,volume,kind})));
    for(const [x,z,v] of raw?.displaced||[])this.displaced.set(ck(x,z),v);
    this.ledger.initial=this.total();
  }
  reconcileChunk(chunk){
    for(const id of [...this.restored.keys()]){
      const [x,z]=id.split(',').map(Number),width=this.world.chunkSize.width;
      if(Math.floor(x/width)===chunk.position.x/width&&Math.floor(z/width)===chunk.position.z/width)this.seedColumn(x,z);
    }
    for(const [id,c] of [...this.columns])if(c.chunk!==this.chunkAt(c.x,c.z)&&this.chunkAt(c.x,c.z)===chunk){
      this.restored.set(id,c.nodes.map(n=>({bottom:n.bottom,volume:n.volume,kind:n.kind})));
      for(const n of c.nodes)this.nodes.delete(nk(n));this.columns.delete(id);this.active=null;this.seedColumn(c.x,c.z);
    }
    this.publish();
  }
}
