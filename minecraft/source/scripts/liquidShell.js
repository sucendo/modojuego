// Visible boundary of a liquid volume. Internal water/water and water/solid
// interfaces are never transparent sheets. All coordinates remain voxel-aligned.
const SOLIDS=new Set([1,2,3,4,5,6,8,10,11,13,14,15,16,18,19,26,27,28,...Array.from({length:25},(_,i)=>i+29)]);
export const liquidOccluder=id=>SOLIDS.has(id);

export function exposedLiquidIntervals(bottom,top,covered=[],blockAt=null){
  if(!Number.isFinite(bottom)||!Number.isFinite(top)||top<=bottom)return [];
  const cuts=covered.map(c=>[c.bottom,c.top]);
  if(blockAt)for(let y=Math.floor(bottom+.5);y<top+.5;y++)
    if(liquidOccluder(blockAt(y))){
      const id=blockAt(y);cuts.push(id===33||id===34?[y-.5,y]:id===47||id===48?[y,y+.5]:[y-.5,y+.5]);
    }
  let spans=[[bottom,top]];
  for(const [low,high] of cuts){
    const next=[];
    for(const [a,b] of spans){
      if(high<=a||low>=b){next.push([a,b]);continue;}
      if(low>a)next.push([a,Math.min(low,b)]);
      if(high<b)next.push([Math.max(high,a),b]);
    }
    spans=next;
  }
  return spans.filter(([a,b])=>b-a>.001).map(([bottom,top])=>({bottom,top}));
}

export function exposedLiquidTop(top,blockAt){
  // Test both sides of a full-voxel interface, including ice occupying the
  // water voxel and a roof touching a completely full underground conduit.
  if(!blockAt)return true;
  const occupied=(y)=>{const id=blockAt(y);if(!liquidOccluder(id))return false;
    if(id===33||id===34)return top-y<=.0001;
    if(id===47||id===48)return top-y>=-.0001;
    return true;};
  return !occupied(Math.floor(top+.4999))&&!occupied(Math.floor(top+.5001));
}

export function mergeLiquidTiles(tiles){
  const planes=new Map(),rectangles=[];
  for(const tile of tiles){
    const top=Math.round(tile.top*10000)/10000;
    const plane=`${tile.kind??'river'},${top}`;
    if(!planes.has(plane))planes.set(plane,new Map());
    planes.get(plane).set(`${tile.x},${tile.z}`,{...tile,top});
  }
  for(const grid of planes.values()){
    for(const c of [...grid.values()].sort((a,b)=>a.z-b.z||a.x-b.x)){
      if(!grid.has(`${c.x},${c.z}`))continue;
      let width=1,depth=1;
      while(grid.has(`${c.x+width},${c.z}`))width++;
      outer:while(true){
        for(let dx=0;dx<width;dx++)if(!grid.has(`${c.x+dx},${c.z+depth}`))break outer;
        depth++;
      }
      for(let dz=0;dz<depth;dz++)for(let dx=0;dx<width;dx++)grid.delete(`${c.x+dx},${c.z+dz}`);
      rectangles.push({...c,width,depth});
    }
  }
  return rectangles;
}
