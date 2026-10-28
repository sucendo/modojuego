/* Authored SVG kerbs: compile once, spatial queries and shared world quads. */
(function(global){
'use strict';
function compile(marks,height){
 const quads=[],segments=[],cells=new Map(),cellSize=32;
 for(const mark of marks){
  const width=Math.min(8,Math.max(.15,Number(mark.width)||1.25)),stripe=Math.min(12,Math.max(.25,Number(mark.curbStripeM)||2));
  for(const run of mark.curbRuns||[]){
   let distance=0;
   for(let i=0;i<run.length-1;i++){
    const a=run[i],b=run[i+1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<1e-5)continue;
    const nx=-dz/length*width/2,nz=dx/length*width/2,seg={x:a[0],z:a[1],dx,dz,length,width,sourceId:mark.sourceId};
    const idx=segments.push(seg)-1;
    for(let iz=Math.floor((Math.min(a[1],b[1])-width)/cellSize);iz<=Math.floor((Math.max(a[1],b[1])+width)/cellSize);iz++)
     for(let ix=Math.floor((Math.min(a[0],b[0])-width)/cellSize);ix<=Math.floor((Math.max(a[0],b[0])+width)/cellSize);ix++){
      const key=ix+':'+iz,list=cells.get(key)||[];list.push(idx);cells.set(key,list);
     }
    for(let at=0;at<length-1e-6;){
     const end=Math.min(length,(Math.floor((distance+at+1e-7)/stripe)+1)*stripe-distance),lo=at/length,hi=end/length;
     const x0=a[0]+dx*lo,z0=a[1]+dz*lo,x1=a[0]+dx*hi,z1=a[1]+dz*hi;
     const points=[[x0+nx,z0+nz],[x1+nx,z1+nz],[x1-nx,z1-nz],[x0-nx,z0-nz]].map(p=>[p[0],height(mark,p[0],p[1])+.018,p[1]]);
     quads.push({points,color:Math.floor((distance+at+1e-7)/stripe)%2?'#f4f5f6':'#d92b36',x:(x0+x1)/2,z:(z0+z1)/2,r:Math.hypot(x1-x0,z1-z0)/2+width,sourceId:mark.sourceId});
     at=end;
    }
    distance+=length;
   }
  }
 }
 return {quads,segments,cells,cellSize};
}
function contains(mesh,x,z){
 const list=mesh.cells.get(Math.floor(x/mesh.cellSize)+':'+Math.floor(z/mesh.cellSize))||[];
 for(const id of list){const s=mesh.segments[id],t=((x-s.x)*s.dx+(z-s.z)*s.dz)/(s.length*s.length);if(t<0||t>1)continue;
  if(Math.hypot(x-s.x-t*s.dx,z-s.z-t*s.dz)<=s.width/2)return true;
 }
 return false;
}
global.ApexSvgCurbs=Object.freeze({compile,contains});
})(window);
