// Orientation is encoded in the block ID, so shapes survive existing voxel
// storage, edits and chunk boundaries without a parallel rotation map.
export const SHAPES=new Map();
const box=(halfX,halfY,halfZ,offsetX=0,offsetY=0,offsetZ=0)=>({halfX,halfY,halfZ,offsetX,offsetY,offsetZ});
const rotate=(b,q)=>{
 let x=b.offsetX,z=b.offsetZ;for(let i=0;i<q;i++)[x,z]=[z,-x];
 return {...b,halfX:q%2?b.halfZ:b.halfX,halfZ:q%2?b.halfX:b.halfZ,offsetX:x,offsetZ:z};
};
for(const [id,material] of [[33,'stone'],[34,'wood'],[47,'stone'],[48,'wood']])SHAPES.set(id,{id,material,kind:'slab',q:0,upper:id>=47,boxes:[box(.5,.25,.5,0,id>=47?.25:-.25,0)]});
for(const [start,material,kind] of [[35,'stone','stairs'],[39,'wood','stairs'],[43,'tile','roof']])for(let q=0;q<4;q++){
 const boxes=kind==='stairs'?[box(.5,.25,.5,0,-.25,0),box(.5,.25,.25,0,.25,.25)]:Array.from({length:8},(_,i)=>box(.5,(i+1)/16,1/16,0,-.5+(i+1)/16,-.5+(i+.5)/8));
 SHAPES.set(start+q,{id:start+q,kind,q,material,boxes:boxes.map(b=>rotate(b,q))});
}
for(const id of [49,50])SHAPES.set(id,{id,kind:'ridge',q:id-49,material:'tile',boxes:Array.from({length:8},(_,i)=>{
 const u=-.5+(i+.5)/8,top=-Math.abs(u)+1/16;
 return rotate(box(.5,(top+.5)/2,1/16,0,(top-.5)/2,u),id-49);
})});
export const canonicalBlock=id=>id>=35&&id<=38?35:id>=39&&id<=42?39:id>=43&&id<=46?43:id===47?33:id===48?34:id===50?49:id;
export function placementVariant(id,direction={x:0,z:1},normal={y:1}){
 const base=canonicalBlock(id),q=((Math.round(Math.atan2(direction.x,direction.z)/(Math.PI/2))%4)+4)%4;
 if([35,39,43].includes(base))return base+q;
 if(base===49)return 49+q%2;
 if(base===33||base===34)return normal.y<0?base+14:base;
 return base;
}
const localU=(q,x,z)=>[z,x,-z,-x][q];
export function surfaceHeight(id,x=0,z=0){
 const s=SHAPES.get(id);if(!s)return .5;
 if(s.kind==='slab')return s.upper?.5:0;
 const u=localU(s.q,x,z);
 return s.kind==='stairs'?(u>=0?.5:0):s.kind==='roof'?u:-Math.abs(u);
}
export function surfacePatches(id){
 const s=SHAPES.get(id);
 if(!s)return [{corners:[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]}];
 const regions=s.kind==='stairs'||s.kind==='ridge'?[[-.5,0],[0,.5]]:[[-.5,.5]];
 return regions.map(([a,b])=>{
  const value=s.kind==='stairs'?(a<0?0:.5):null;
  const corners=[[-.5,a],[.5,a],[.5,b],[-.5,b]].map(([x,z])=>{
   let xx=x,zz=z;for(let i=0;i<s.q;i++)[xx,zz]=[zz,-xx];
   return [xx,zz,value??surfaceHeight(id,xx,zz)];
  });return {corners};
 });
}
function clipRay(planes,o,d){
 let low=0,high=Infinity,normal={x:0,y:0,z:0};
 for(const [nx,ny,nz,limit] of planes){
  const at=nx*o.x+ny*o.y+nz*o.z-limit,speed=nx*d.x+ny*d.y+nz*d.z;
  if(Math.abs(speed)<1e-10){if(at>1e-9)return null;continue;}
  const t=-at/speed;
  if(speed<0){if(t>low){low=t;normal={x:nx,y:ny,z:nz};}}else high=Math.min(high,t);
  if(low>high+1e-9)return null;
 }
 if(high<0)return null;
 const axis=Math.abs(normal.y)>=Math.max(Math.abs(normal.x),Math.abs(normal.z))?'y':Math.abs(normal.x)>Math.abs(normal.z)?'x':'z';
 return {distance:low,normal:{x:0,y:0,z:0,[axis]:Math.sign(normal[axis])}};
}
export function rayShape(id,origin,direction){
 const s=SHAPES.get(id);if(!s)return null;
 if(s.kind==='roof'||s.kind==='ridge'){
  const [nx,nz]=[[0,1],[1,0],[0,-1],[-1,0]][s.q];
  const planes=[[1,0,0,.5],[-1,0,0,.5],[0,0,1,.5],[0,0,-1,.5],[0,-1,0,.5]];
  if(s.kind==='roof')planes.push([-nx,1,-nz,0]);
  else planes.push([nx,1,nz,0],[-nx,1,-nz,0]);
  return clipRay(planes,origin,direction);
 }
 let nearest=null;
 for(const b of s.boxes){
  const o={x:origin.x-b.offsetX,y:origin.y-b.offsetY,z:origin.z-b.offsetZ};
  const hit=clipRay([[1,0,0,b.halfX],[-1,0,0,b.halfX],[0,1,0,b.halfY],[0,-1,0,b.halfY],[0,0,1,b.halfZ],[0,0,-1,b.halfZ]],o,direction);
  if(hit&&(!nearest||hit.distance<nearest.distance))nearest=hit;
 }return nearest;
}
