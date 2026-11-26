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
