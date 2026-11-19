// Compact, versioned-per-world exploration. No Three.js dependency, so data
// remains testable and can be validated before loading untrusted JSON.
export const CELL_SIZE = 32;
export const MAX_CELLS = 12000;
export const MAX_MARKERS = 50;
const coordPattern = /^-?\d+,-?\d+$/;
const poiPattern = /^poi:-?\d+:-?\d+:(ruin|tower|camp)$/;
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const bad = () => { throw new Error('invalidFile'); };
export function freshExploration(){return {explored:[],markers:[],visitedPois:[],nextMarkerId:1};}
export function validateExploration(data, invalid=bad){
  if(data===undefined) return freshExploration();
  if(!isObj(data) || !Array.isArray(data.explored) || data.explored.length>MAX_CELLS ||
     !Array.isArray(data.markers) || data.markers.length>MAX_MARKERS ||
     !Array.isArray(data.visitedPois) || data.visitedPois.length>2000 ||
     !Number.isSafeInteger(data.nextMarkerId) || data.nextMarkerId<1 || data.nextMarkerId>1000000) return invalid();
  const visited = data.visitedPois;
  if(new Set(visited).size!==visited.length || !visited.every(id=>typeof id==='string'&&id.length<50&&poiPattern.test(id)&&id.split(':').slice(1,3).every(v=>Number.isSafeInteger(Number(v))&&Math.abs(Number(v))<=31250)))return invalid();
  const cells = data.explored;
  if(new Set(cells).size!==cells.length || !cells.every(cell=>{
    if(typeof cell!=='string'||!coordPattern.test(cell))return false;
    const [x,z]=cell.split(',').map(Number);
    return Number.isSafeInteger(x)&&Number.isSafeInteger(z)&&Math.abs(x)<=31250&&Math.abs(z)<=31250;
  }))return invalid();
  const ids = new Set();
  for(const marker of data.markers){
    if(!isObj(marker)||!Number.isInteger(marker.id)||marker.id<1||marker.id>=data.nextMarkerId||ids.has(marker.id)||
       typeof marker.name!=='string'||marker.name.length<1||marker.name.length>40||
       typeof marker.kind!=='string'||!['home','build','flag'].includes(marker.kind)||
       !Number.isFinite(marker.x)||!Number.isFinite(marker.z)||Math.abs(marker.x)>1000000||Math.abs(marker.z)>1000000) return invalid();
    ids.add(marker.id);
  }
  return {explored:[...cells],markers:data.markers.map(m=>({...m})),visitedPois:[...visited],nextMarkerId:data.nextMarkerId};
}
export class ExplorationTracker{
  constructor(onChange=()=>{}){this.onChange=onChange;this.restore();}
  restore(data){this.data=validateExploration(data);this.exploredSet=new Set(this.data.explored);this.visitedSet=new Set(this.data.visitedPois);this.lastCell=null;}
  snapshot(){return {explored:[...this.data.explored],markers:this.data.markers.map(m=>({...m})),visitedPois:[...this.data.visitedPois],nextMarkerId:this.data.nextMarkerId};}
  observe(position){
    if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return false;
    const cx=Math.floor(position.x/CELL_SIZE),cz=Math.floor(position.z/CELL_SIZE),key=`${cx},${cz}`;
    if(key===this.lastCell)return false;
    this.lastCell=key;
    let changed=false;
    // The local 3×3 area is visible without revealing the whole seed.
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
      const c=`${cx+dx},${cz+dz}`;
      if(!this.exploredSet.has(c)&&this.data.explored.length<MAX_CELLS){
        this.exploredSet.add(c);this.data.explored.push(c);changed=true;
      }
    }
    if(changed)this.onChange();
    return changed;
  }
  isExplored(x,z){return this.exploredSet.has(`${Math.floor(x/CELL_SIZE)},${Math.floor(z/CELL_SIZE)}`);}
  addMarker(name,x,z,kind='flag'){
    if(this.data.markers.length>=MAX_MARKERS || !Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>1e6||Math.abs(z)>1e6)return null;
    name=String(name||'').trim().slice(0,40);
    if(!name || !['home','build','flag'].includes(kind))return null;
    const marker={id:this.data.nextMarkerId++,name,kind,x:Math.round(x),z:Math.round(z)};
    this.data.markers.push(marker);this.onChange();return {...marker};
  }
  deleteMarker(id){const index=this.data.markers.findIndex(m=>m.id===id);if(index<0)return false;this.data.markers.splice(index,1);this.onChange();return true;}
  visitPoi(id){if(typeof id!=='string'||!poiPattern.test(id)||this.visitedSet.has(id)||this.data.visitedPois.length>=2000)return false;
    this.visitedSet.add(id);this.data.visitedPois.push(id);this.onChange();return true;
  }
}
