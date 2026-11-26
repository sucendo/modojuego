// Render velocity in world X/Z. A finite cell uses measured face discharge;
// procedural river directions are unitless and get a modest nominal speed.
export function waterFlowVector(cell){
  if(!cell||cell.drying||cell.kind==='frozen'||cell.kind==='lava')return [0,0];
  let x=Number(cell.flowX)||0,z=Number(cell.flowZ)||0;
  if(!Number.isFinite(x)||!Number.isFinite(z))return [0,0];
  const length=Math.hypot(x,z);if(length<1e-7)return [0,0];
  if(cell.finite){
    const depth=Number.isFinite(cell.volume)?cell.volume:Number(cell.depth);
    if(!Number.isFinite(depth)||depth<=.001)return [0,0];
    const scale=Math.min(1/Math.max(.05,depth),1.5/length);
    x*=scale;z*=scale;
  }else{
    // Only declared natural rivers carry a nominal background current.
    if(cell.kind!=='river'||cell.dynamic)return [0,0];
    x*=.3/length;z*=.3/length;
  }
  return [x,z];
}

export function waterFlowChanged(cell){
  const now=waterFlowVector(cell),old=cell.renderedFlow||[0,0];
  const speed=Math.hypot(...now),previous=Math.hypot(...old);
  // A slow current can be visible before the level changes appreciably.
  // Stopping must clear its last visible direction even below the tolerance.
  if(speed<.0005&&previous>=.0005)return true;
  return Math.hypot(now[0]-old[0],now[1]-old[1])>Math.max(.003,previous*.2);
}

/** Cache which physical columns contribute to each rendered corner. */
export function bindWaterFlow(geometry,motion){
  const sourceIds=new Map(),sources=[],groups=new Map();
  for(let vertex=0;vertex<motion.length;vertex++){
    const samples=motion[vertex].flowSamples;if(!samples?.length)continue;
    const ids=samples.map(point=>{
      const key=point.join(',');
      if(!sourceIds.has(key)){sourceIds.set(key,sources.length);sources.push(point);}
      return sourceIds.get(key);
    });
    const key=ids.join(':');
    if(!groups.has(key))groups.set(key,{sources:ids,vertices:[]});
    groups.get(key).vertices.push(vertex);
  }
  geometry.userData??={};
  geometry.userData.waterFlowBindings={sources,groups:[...groups.values()],values:new Float32Array(sources.length*2)};
}

/** Update two numbers per vertex, never positions, topology or materials. */
export function refreshWaterFlowAttribute(geometry,sample){
  const attr=geometry.getAttribute?.('waterFlow')??geometry.waterFlow;
  const bindings=geometry.userData?.waterFlowBindings;if(!attr||!bindings)return false;
  const {sources,groups,values}=bindings;
  for(let i=0;i<sources.length;i++){
    const v=sample(...sources[i]);values[i*2]=v?.[0]||0;values[i*2+1]=v?.[1]||0;
  }
  let changed=false;
  for(const group of groups){
    let x=0,z=0;for(const id of group.sources){x+=values[id*2];z+=values[id*2+1];}
    x/=group.sources.length;z/=group.sources.length;
    for(const vertex of group.vertices){
      const i=vertex*2;
      if(Math.abs(attr.array[i]-x)>1e-5||Math.abs(attr.array[i+1]-z)>1e-5){attr.array[i]=x;attr.array[i+1]=z;changed=true;}
    }
  }
  if(changed)attr.needsUpdate=true;
  return changed;
}
