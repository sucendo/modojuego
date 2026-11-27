import {SHAPES,surfaceHeight,surfacePatches} from './constructionShapes.js';
import {mergeLiquidTiles} from './liquidShell.js';
const quad=(out,a,b,c,d)=>out.push(...a,...b,...c,...a,...c,...d);
/** Merge flat tops and suppress internal faces, including the invisible ice
 * top under powder. Work is proportional to visible covers, never world size. */
export function snowSurfaces(covers){
 const ice=[],powder=[],flat=[],byCell=new Map(covers.map(c=>[`${c.x},${c.z}`,c]));
 for(const c of covers){
  const frozen=Math.min(c.depth,c.ice||0);
  for(const [kind,bottom,top] of [['ice',0,frozen],['powder',frozen,c.depth]]){
   if(top-bottom<=.001)continue;
   const out=kind==='ice'?ice:powder,hiddenTop=kind==='ice'&&c.depth-frozen>.001;
   const shape=SHAPES.get(c.id);
   if(!shape||shape.kind==='slab'){
    const base=c.y+surfaceHeight(c.id)+.002,high=base+top;
    if(!hiddenTop)flat.push({x:c.x,z:c.z,top:high,kind});
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const neighbor=byCell.get(`${c.x+dx},${c.z+dz}`);
     let low=base+bottom;
     if(neighbor)low=Math.max(low,neighbor.y+surfaceHeight(neighbor.id,-dx*.5,-dz*.5)+.002+neighbor.depth);
     if(low>=high-.001)continue;
     if(dx){const x=c.x+dx*.5;quad(out,[x,low,c.z-.5],[x,high,c.z-.5],[x,high,c.z+.5],[x,low,c.z+.5]);}
     else {const z=c.z+dz*.5;quad(out,[c.x-.5,low,z],[c.x-.5,high,z],[c.x+.5,high,z],[c.x+.5,low,z]);}
    }
    continue;
   }
   const patches=surfacePatches(c.id);
   for(const patch of patches){
    const ps=patch.corners.map(([x,z,h])=>[c.x+x,c.y+h+.002,c.z+z]);
    if(!hiddenTop){
     if(patches.length===1&&patch.corners.every(p=>Math.abs(p[2]-patch.corners[0][2])<1e-8))flat.push({x:c.x,z:c.z,top:ps[0][1]+top,kind});
     else quad(out,...[0,3,2,1].map(i=>[ps[i][0],ps[i][1]+top,ps[i][2]]));
    }
    for(let i=0;i<4;i++){
     const a=ps[i],b=ps[(i+1)%4],mx=(a[0]+b[0])/2-c.x,mz=(a[2]+b[2])/2-c.z;
     let dx=0,dz=0;if(Math.abs(mx-.5)<1e-7)dx=1;else if(Math.abs(mx+.5)<1e-7)dx=-1;else if(Math.abs(mz-.5)<1e-7)dz=1;else if(Math.abs(mz+.5)<1e-7)dz=-1;
     let lowA=a[1]+bottom,lowB=b[1]+bottom;
     const neighbor=byCell.get(`${c.x+dx},${c.z+dz}`);
     if((dx||dz)&&neighbor){
      const na=neighbor.y+surfaceHeight(neighbor.id,a[0]-neighbor.x,a[2]-neighbor.z)+.002;
      const nb=neighbor.y+surfaceHeight(neighbor.id,b[0]-neighbor.x,b[2]-neighbor.z)+.002;
      // Opaque neighbouring cover or its supporting surface hides the seam.
      lowA=Math.max(lowA,na+neighbor.depth);lowB=Math.max(lowB,nb+neighbor.depth);
     }else if(!dx&&!dz&&SHAPES.has(c.id)){
      // The interior edge between patches of a stair/ridge has no duplicate
      // side where both sheets meet at the same physical elevation.
      const centerX=patch.corners.reduce((v,p)=>v+p[0],0)/4,centerZ=patch.corners.reduce((v,p)=>v+p[1],0)/4;
      const center=surfaceHeight(c.id,mx+(mx-centerX)*.0001,mz+(mz-centerZ)*.0001);
      if(center>=(a[1]+b[1])/2-c.y-.002-.0001)continue;
     }
     const highA=a[1]+top,highB=b[1]+top;
     if(lowA>=highA-.001&&lowB>=highB-.001)continue;
     quad(out,[a[0],Math.min(highA,lowA),a[2]],[a[0],highA,a[2]],[b[0],highB,b[2]],[b[0],Math.min(highB,lowB),b[2]]);
    }
   }
  }
 }
 for(const r of mergeLiquidTiles(flat)){
  const out=r.kind==='ice'?ice:powder,x=r.x-.5,z=r.z-.5,y=r.top;
  quad(out,[x,y,z],[x,y,z+r.depth],[x+r.width,y,z+r.depth],[x+r.width,y,z]);
 }
 return {ice,powder};
}
