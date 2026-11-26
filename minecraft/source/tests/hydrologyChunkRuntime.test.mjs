import {waterFlowVector,bindWaterFlow,refreshWaterFlowAttribute} from '../scripts/waterFlow.js';
import { continuousCorner, connectedWater, WaterTransitions, waterTime } from '../scripts/continuousWater.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {VoxelData} from '../scripts/voxelData.js';
import {DataStore} from '../scripts/dataStore.js';
import {pickVoxel,adjacentCell} from '../scripts/voxelPicking.js';
import {RNG} from '../scripts/rng.js';
import {advancedSurfaceHeight,isCave,geologyColumn,advancedUndergroundBlock,TERRAIN_V10,LEGACY_HEIGHT} from '../scripts/terrainV10.js';
import {TERRAIN_HYBRID,hybridSurfaceHeight,transitionWeight,protectionNearby} from '../scripts/hybridTerrain.js';
import {TERRAIN_V11,hydrologyColumn,waterTint} from '../scripts/hydrology.js';
import {TERRAIN_V112,hydrologyColumnV112,freezeColumn,waterfallFaces,ICE_THICKNESS} from '../scripts/hydrologyV112.js';
import {TERRAIN_HYBRID_V112,hybridHydrologyColumn,makeHybridContext} from '../scripts/hybridHydrology.js';
import {hydrographyDebugSources} from '../scripts/hydrographyV1140.js';
import {hydrographyDebugNetworkV1141} from '../scripts/hydrographyV1141.js';
import {hydrographyDebugNetworkV1142} from '../scripts/hydrographyV1142.js';
import {waterDepthColor,waterOpacity,applyWaterMotion} from '../scripts/waterVisuals.js';
import {waterCornerHeight,exposedBankFace} from '../scripts/waterGeometry.js';
import {voxelWaterColumn,exposedVoxelSide,isDownstreamWaterfallEdge,mergeCoplanarWaterSurfaces} from '../scripts/waterVoxelsV1134.js';
import {hydraulicBedAfterEdit} from '../scripts/hydraulicColumnV1147.js';
import {exposedLiquidIntervals,exposedLiquidTop} from '../scripts/liquidShell.js';
import {applyWorldPreset,biomeForType,terrainHeight} from '../scripts/worldTypes.js';

// Minimal 3D facade to exercise the *real* chunk code without loading WebGL.
class Group{constructor(){this.position={x:0,y:0,z:0};this.children=[];this.userData={};} add(obj){this.children.push(obj);}remove(obj){this.children=this.children.filter(x=>x!==obj);}clear(){this.children=[];}}
class Position{set(x,y,z){this.x=x;this.y=y;this.z=z;}}
class Matrix4{
 constructor(){this.identity();}
 identity(){this.tx=0;this.ty=0;this.tz=0;this.sx=1;this.sy=1;this.sz=1;return this;}
 makeScale(x,y,z){this.identity();this.sx=x;this.sy=y;this.sz=z;return this;}
 setPosition(x,y,z){this.tx=x;this.ty=y;this.tz=z;return this;}
 copy(m){Object.assign(this,{tx:m.tx,ty:m.ty,tz:m.tz,sx:m.sx,sy:m.sy,sz:m.sz});return this;}
 clone(){return new Matrix4().copy(this);}
}
class Mesh{
 constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new Position();this.scale=new Position();this.layers={set(layer){this.layer=layer;}};this.userData={};}
 rotateX(angle){this.rotationX=angle;}
}
class InstancedMesh extends Mesh{
 constructor(geometry,material,count){super(geometry,material);this.isInstancedMesh=true;this.count=count;this.matrices=[];this.instanceMatrix={count,needsUpdate:false};}
 setMatrixAt(i,m){this.matrices[i]=m.clone();}
 getMatrixAt(i,m){m.copy(this.matrices[i]);}
 computeBoundingSphere(){}
}
class Geometry{
 setAttribute(key,val){this[key]=val;}
 setIndex(indices){this.index=indices;}
 computeVertexNormals(){this.normals=true;}
}
class Material{constructor(data){Object.assign(this,data);}}
class SimplexNoise{
 constructor(rng){this.seed=(rng?.seed??37)|0;}
 noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);}
 noise3d(x,y,z){return Math.sin(x*1.37+y*.63+z*.92)*Math.cos(x*.42-y*1.17+z*.3);}
}
const THREE={Group,Mesh,InstancedMesh,Matrix4,BoxGeometry:Geometry,PlaneGeometry:Geometry,BufferGeometry:Geometry,
 Float32BufferAttribute:class{constructor(values,stride){this.array=values;this.itemSize=stride;}},
 MeshLambertMaterial:Material,DoubleSide:2};
const ids={empty:0,grass:1,dirt:2,stone:3,coalOre:4,ironOre:5,tree:6,leaves:7,sand:8,cloud:9,snow:10,
 cactus:11,jungleGrass:14,jungleTree:13,jungleLeaves:15,basalt:19,snowLeaves:16,glass:12,
 torch:21,bookshelf:22,bed:23,table:24,chest:25,stoneBricks:26,ice:28};
const blocks=Object.fromEntries(Object.entries(ids).map(([key,id])=>[key,{id,material:{}}]));
const resources=[{id:4,scarcity:.8,scale:{x:20,y:20,z:20}},{id:5,scarcity:.85,scale:{x:40,y:40,z:40}}];
const raw=readFileSync(new URL('../scripts/worldChunk.js',import.meta.url),'utf8')
 .replace(/^import .*;\s*$/gm,'').replace('export class WorldChunk','class WorldChunk')+'\nWorldChunk;';
const WorldChunk=vm.runInNewContext(raw,{waterFlowVector,bindWaterFlow,refreshWaterFlowAttribute,continuousCorner,connectedWater,WaterTransitions,waterTime,THREE,SimplexNoise,RNG,VoxelData,blocks,resources,
 makeFadeMaterial:()=>{},disposeFadeMaterial:()=>{},clampFade:a=>a,
 biomeForType,terrainHeight,advancedSurfaceHeight,isCave,geologyColumn,advancedUndergroundBlock,
 TERRAIN_V10,TERRAIN_HYBRID,TERRAIN_V11,TERRAIN_V112,TERRAIN_HYBRID_V112,LEGACY_HEIGHT,hybridSurfaceHeight,transitionWeight,hybridHydrologyColumn,makeHybridContext,
 hydrologyColumn,hydrologyColumnV112,freezeColumn,waterfallFaces,ICE_THICKNESS,waterTint,waterDepthColor,waterOpacity,applyWaterMotion,
 waterCornerHeight,exposedBankFace,voxelWaterColumn,exposedVoxelSide,
 isDownstreamWaterfallEdge,mergeCoplanarWaterSurfaces,
 hydraulicBedAfterEdit,exposedLiquidIntervals,exposedLiquidTop,
 landmarkForChunk:()=>null,paintLandmark:()=>{},Math,Map,Set});

function chunkAt(cx,cz,type='jungle',version=TERRAIN_V11,hybridContext=null){
 const params={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
  biomes:{scale:500,variation:{scale:50,amplitude:.2},tundraToTemperate:.25,temperateToJungle:.5,jungleToDesert:.75},
  trees:{frequency:0,trunk:{minHeight:4,maxHeight:7},canopy:{minRadius:3,maxRadius:3,density:.7}}};
 applyWorldPreset(params,type);params.trees.frequency=0;
 const chunk=new WorldChunk({width:32,height:80},params,{entriesForChunk(){return [];}},type,false,version,hybridContext);
 chunk.position.x=cx*32;chunk.position.z=cz*32;chunk.userData={x:cx,z:cz};
 chunk.initializeTerrain();chunk.generateAdvancedTerrain(new RNG(params.seed));
 return chunk;
}

test('real chunk generator places riverbed blocks and records water surfaces',()=>{
 let wetChunk=null;
 for(let cx=-5;cx<=5&&!wetChunk;cx++)for(let cz=-3;cz<=3&&!wetChunk;cz++){
  const candidate=chunkAt(cx,cz,'jungle',TERRAIN_V112);
  if(candidate.waterColumns?.some(Boolean))wetChunk=candidate;
 }
 assert.ok(wetChunk,'expected a hydrological chunk in this seeded landscape');
 const width=wetChunk.size.width;
 let underwater=0;
 for(let z=0;z<width;z++)for(let x=0;x<width;x++){
  const water=wetChunk.waterColumns[z*width+x];if(!water)continue;
  underwater++;
  assert.ok(wetChunk.getBlockId(x,0,z)!==0,'river has a solid foundation');
  const top=Array.from({length:80},(_,i)=>i).reverse().find(y=>wetChunk.getBlockId(x,y,z)!==0);
  assert.ok(top+.5<water.y,'riverbed lies below the water surface');
 }
 assert.ok(underwater>0);
 wetChunk.generateWater();
 const surfaces=wetChunk.children.filter(mesh=>mesh.userData?.waterSurface);
 assert.ok(surfaces.length>=1,'a fully voxelized river has at least one mesh');
 assert.ok(surfaces.length<=5,'batched by water type, not one mesh per block');
 assert.ok(surfaces.every(mesh=>mesh.layers.layer===1));
 assert.ok(surfaces.every(mesh=>mesh.material.depthWrite===false));
 const inland=surfaces;
 assert.ok(inland.every(mesh=>mesh.geometry.color.itemSize===3));
 assert.ok(inland.every(mesh=>mesh.geometry.color.array.length===mesh.geometry.position.array.length));
 let riverbankWalls=0;
 for(const mesh of inland){
   const p=mesh.geometry.position.array,flow=mesh.geometry.waterFall?.array||[];
   for(let i=0;i+3<p.length/3;i+=4){
     if(flow[i]!==0||flow[i+1]!==0||flow[i+2]!==0||flow[i+3]!==0)continue;
     const yTop=Math.max(p[i*3+1],p[(i+1)*3+1],p[(i+2)*3+1],p[(i+3)*3+1]);
     const yBottom=Math.min(p[i*3+1],p[(i+1)*3+1],p[(i+2)*3+1],p[(i+3)*3+1]);
     if(yTop-yBottom>=1)riverbankWalls++;
   }
 }
 assert.ok(riverbankWalls>0,'the water volume must have side walls down to the riverbed, not just a floating top plane');
});

test('the original generator remains untouched and produces no inland water geometry',()=>{
 const original=chunkAt(3,5,'classic',TERRAIN_V10);
 assert.equal(original.waterColumns,null);
 original.generateWater();
 assert.equal(original.children.filter(o=>o.userData?.waterSurface).length,1);
});

test('v11.3.4 ocean keeps sea water as physical voxels after removing the blanket plane',()=>{
  let sea=null;
  for(let cx=-2;cx<=2&&!sea;cx++)for(let cz=-2;cz<=2&&!sea;cz++){
    const chunk=chunkAt(cx,cz,'ocean',TERRAIN_V112);
    const index=chunk.waterColumns?.findIndex(cell=>cell?.kind==='lake'&&
      cell.y===chunk.params.terrain.waterOffset+.25&&cell.depth>=1);
    if(index>=0)sea={chunk,index};
  }
  assert.ok(sea,'the ocean preset must contain low-lying water');
  const {chunk,index}=sea;
  const water=chunk.waterColumns[index];
  const voxel=voxelWaterColumn(water,chunk.hydrologyGround[index]);
  assert.equal(voxel.top,chunk.params.terrain.waterOffset+.5);
  assert.ok(voxel.layers>=1);
  chunk.generateWater();
  const surfaces=chunk.children.filter(mesh=>mesh.userData?.waterSurface);
  assert.ok(surfaces.length>0);
  assert.ok(surfaces.every(mesh=>mesh.geometry.waterFall),
    'the sea is drawn from real voxel geometry, never an infinite flat plane');
});

test('v11.4 renders initially settled river voxels with a source and no sloping triangles',()=>{
  const p={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
    trees:{frequency:0,canopy:{density:.7}},clouds:{density:.3}};
  applyWorldPreset(p,'snow');
  const simplex=new SimplexNoise(new RNG(p.seed));
  const springs=hydrographyDebugSources(simplex,p,'snow',-300,-300,300,300);
  assert.ok(springs.length>0);
  const spring=springs[0],cx=Math.floor(spring.x/32),cz=Math.floor(spring.z/32);
  const metadata={sourceVersion:5,protectedChunks:['1,1'],blendBlocks:96,hydrographyVersion:1};
  const nearby=makeHybridContext(new Set(['1,1']),new Set(),metadata,cx,cz);
  const chunk=chunkAt(cx,cz,'snow',TERRAIN_HYBRID_V112,nearby);
  const x=spring.x-cx*32,z=spring.z-cz*32;
  const first=chunk.waterColumns[z*32+x];
  assert.ok(first?.stable,'spring river must be fully present before any player action');
  assert.equal(first.source,true,'the developer overlay pinpoints the exact source cell');
  assert.ok(first.depth>0);
  for(let i=0;i<chunk.waterColumns.length;i++){
    const cell=chunk.waterColumns[i];
    if(!cell?.stable)continue;
    const voxel=voxelWaterColumn(cell,chunk.hydrologyGround[i]);
    assert.equal(voxel.top-voxel.bottom,1,'natural channels contain one complete cubic voxel');
    assert.ok(voxel.bottom>=chunk.hydrologyGround[i]-.0001,'water sits on its solid floor');
  }
  chunk.generateWater();
  const meshes=chunk.children.filter(o=>o.userData?.waterSurface);
  assert.ok(meshes.length>0);
  for(const mesh of meshes){
    const positions=mesh.geometry.position.array;
    for(let i=0;i+11<positions.length;i+=12){
      const y=[positions[i+1],positions[i+4],positions[i+7],positions[i+10]];
      assert.ok(y.every(v=>v===y[0])||
        (y[0]===y[1]&&y[2]===y[3]),'every water face is flat or a vertical cube side');
    }
  }
});

test('v11.4.1 real 3D chunks paint the new precomputed rivers as full grounded cubes',()=>{
  const p={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
    trees:{frequency:0,canopy:{density:.7}},clouds:{density:.3}};
  applyWorldPreset(p,'snow');
  const simplex=new SimplexNoise(new RNG(p.seed));
  const routes=hydrographyDebugNetworkV1141(simplex,p,'snow',-500,-500,500,500);
  const source=routes.map(r=>r.source).find(s=>Math.hypot(s.x-48,s.z-48)>140);
  assert.ok(source);
  const cx=Math.floor(source.x/32),cz=Math.floor(source.z/32);
  const metadata={sourceVersion:5,protectedChunks:['1,1'],blendBlocks:96,hydrographyVersion:2};
  const context=makeHybridContext(new Set(['1,1']),new Set(),metadata,cx,cz);
  const chunk=chunkAt(cx,cz,'snow',TERRAIN_HYBRID_V112,context);
  const x=source.x-cx*32,z=source.z-cz*32;
  const sourceCell=chunk.waterColumns[z*32+x];
  assert.ok(sourceCell?.stable,'natural water exists immediately when its chunk is generated');
  assert.equal(sourceCell.source,true,'development marker matches the actual source voxel');
  for(let i=0;i<chunk.waterColumns.length;i++){
    const cell=chunk.waterColumns[i];
    if(!cell?.stable)continue;
    const voxel=voxelWaterColumn(cell,chunk.hydrologyGround[i]);
    assert.equal(voxel.top-voxel.bottom,1);
    assert.ok(voxel.bottom>=chunk.hydrologyGround[i]-.0001);
  }
  chunk.generateWater();
  const meshes=chunk.children.filter(mesh=>mesh.userData?.waterSurface);
  assert.ok(meshes.length>0);
  for(const mesh of meshes){
    const positions=mesh.geometry.position.array;
    for(let i=0;i+11<positions.length;i+=12){
      const y=[positions[i+1],positions[i+4],positions[i+7],positions[i+10]];
      assert.ok(y.every(v=>v===y[0])||y[0]===y[1]&&y[2]===y[3],
        'water surfaces are horizontal tops or vertical square sides');
    }
  }
});

test('v11.4.2 3D chunks retain full cubic river and ice voxels while using waterfall meshes',()=>{
  const p={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
    trees:{frequency:0,canopy:{density:.7}},clouds:{density:.3}};
  applyWorldPreset(p,'snow');
  const simplex=new SimplexNoise(new RNG(p.seed));
  const routes=hydrographyDebugNetworkV1142(simplex,p,'snow',-500,-500,500,500);
  const spring=routes.map(r=>r.source).find(s=>Math.hypot(s.x-48,s.z-48)>150);
  assert.ok(spring);
  const cx=Math.floor(spring.x/32),cz=Math.floor(spring.z/32);
  const metadata={sourceVersion:5,protectedChunks:['1,1'],blendBlocks:96,hydrographyVersion:3};
  const context=makeHybridContext(new Set(['1,1']),new Set(),metadata,cx,cz);
  const chunk=chunkAt(cx,cz,'snow',TERRAIN_HYBRID_V112,context);
  const x=spring.x-cx*32,z=spring.z-cz*32;
  assert.ok(chunk.waterColumns[z*32+x]?.stable);
  assert.equal(chunk.waterColumns[z*32+x].source,true);
  for(let i=0;i<chunk.waterColumns.length;i++){
    const cell=chunk.waterColumns[i];
    if(!cell?.stable)continue;
    const v=voxelWaterColumn(cell,chunk.hydrologyGround[i]);
    assert.equal(v.top-v.bottom,1);
    assert.ok(v.bottom>=chunk.hydrologyGround[i]-.0001);
  }
  chunk.generateWater();
  const meshes=chunk.children.filter(m=>m.userData?.waterSurface);
  assert.ok(meshes.length>0);
  assert.ok(meshes.every(m=>m.geometry.waterFall));
  assert.ok(meshes.every(m=>m.geometry.position.array.every(Number.isFinite)));
});

test('v11.4.4 steep lateral edges cannot create waterfall glass curtains',()=>{
  const metadata={sourceVersion:5,protectedChunks:['1,1'],blendBlocks:96,hydrographyVersion:3};
  const context=makeHybridContext(new Set(['1,1']),new Set(),metadata,0,0);
  const chunk=chunkAt(0,0,'snow',TERRAIN_HYBRID_V112,context);
  chunk.initializeTerrain(); // The synthetic river needs actual empty space.
  chunk.waterColumns=Array(1024).fill(null);
  chunk.hydrologyGround=new Float32Array(1024).fill(6.5);
  const put=(x,z,bed,flowX=0,flowZ=0)=>{
    const i=z*32+x;
    chunk.setBlockId(x,bed-.5,z,3);
    chunk.hydrologyGround[i]=bed;
    chunk.waterColumns[i]={kind:'river',depth:1,y:bed+.75,
      flowX,flowZ,stable:true,source:false};
  };
  put(10,10,16.5,1,0);
  put(11,10,12.5);
  put(10,11,12.5);
  chunk.generateWater();
  const mesh=chunk.children.find(m=>m.userData?.waterSurface);
  assert.ok(mesh,'the test river produced water geometry');
  const p=mesh.geometry.position.array,falls=mesh.geometry.waterFall.array;
  let longFalls=0,lateralLongFaces=0;
  for(let i=0;i<p.length/12;i++){
    const offset=i*12,y=[p[offset+1],p[offset+4],p[offset+7],p[offset+10]];
    const span=Math.max(...y)-Math.min(...y);
    if(span<2)continue;
    const xs=[p[offset],p[offset+3],p[offset+6],p[offset+9]];
    const zs=[p[offset+2],p[offset+5],p[offset+8],p[offset+11]];
    if(zs.every(n=>n===10.5))lateralLongFaces++;
    if(xs.every(n=>n===10.5)&&falls[i*4])longFalls++;
  }
  assert.equal(longFalls,1,'one true downstream edge creates the waterfall');
  assert.equal(lateralLongFaces,0,'steep sides beside the river have no tall curtain');
  assert.equal(mesh.material.forceSinglePass,true);
});

test('v11.2.1 hybrid chunk matches old v11 water, rocks and caves at a protected edge',()=>{
  const protectedSet=new Set(['0,0']);
  const metadata={sourceVersion:4,protectedChunks:['0,0'],blendBlocks:96};
  const near=makeHybridContext(protectedSet,new Set(),metadata,1,0);
  const old=chunkAt(1,0,'snow',TERRAIN_V11);
  const hybrid=chunkAt(1,0,'snow',TERRAIN_HYBRID_V112,near);
  for(let z=0;z<32;z++){
    const i=z*32;
    assert.equal(hybrid.waterColumns[i]?.y,old.waterColumns[i]?.y);
    for(let y=0;y<80;y++)assert.equal(hybrid.getBlockId(0,y,z),old.getBlockId(0,y,z),`x=32,z=${z},y=${y}`);
  }
});

test('v11.2.1 far untouched chunks match v11.2 cascades and breakable ice',()=>{
  const metadata={sourceVersion:4,protectedChunks:['0,0'],blendBlocks:96};
  const near=makeHybridContext(new Set(['0,0']),new Set(),metadata,6,2);
  const original=chunkAt(6,2,'snow',TERRAIN_V112);
  const hybrid=chunkAt(6,2,'snow',TERRAIN_HYBRID_V112,near);
  for(let z=0;z<32;z++)for(let x=0;x<32;x++){
    const a=original.waterColumns[z*32+x],b=hybrid.waterColumns[z*32+x];
    assert.equal(b?.y,a?.y);
    for(let y=0;y<80;y++)assert.equal(hybrid.getBlockId(x,y,z),original.getBlockId(x,y,z));
  }
});

test('the old v10.1 blended geology also joins unchanged at a migrated border',()=>{
  const legacySet=new Set(['0,0']);
  const metadata={sourceVersion:3,protectedChunks:['0,0'],legacyChunks:['0,0'],blendBlocks:96};
  const original=chunkAt(1,0,'classic',TERRAIN_HYBRID,protectionNearby(legacySet,1,0));
  const migrated=chunkAt(1,0,'classic',TERRAIN_HYBRID_V112,
    makeHybridContext(new Set(metadata.protectedChunks),legacySet,metadata,1,0));
  for(let z=0;z<32;z++)for(let y=0;y<80;y++)
    assert.equal(migrated.getBlockId(0,y,z),original.getBlockId(0,y,z),`edge block y=${y},z=${z}`);
});

test('v11.2 creates walkable ice voxels, and a saved removal reveals water below',()=>{
  const p={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
    trees:{frequency:0,canopy:{density:.7}},clouds:{density:.3}};
  applyWorldPreset(p,'snow');
  const simplex=new SimplexNoise(new RNG(p.seed));
  const surface=(x,z)=>advancedSurfaceHeight(simplex,p,'snow',x,z,80);
  let found=null;
  for(let z=-420;z<=420&&!found;z+=5)for(let x=-420;x<=420&&!found;x+=5){
    const h=hydrologyColumnV112(simplex,p,'snow',x,z,p.seed,surface);
    if(h.ice)found={x,z,h};
  }
  assert.ok(found,'expected natural surface ice in a snowy basin');
  const cx=Math.floor(found.x/32),cz=Math.floor(found.z/32);
  const chunk=chunkAt(cx,cz,'snow',TERRAIN_V112);
  const lx=found.x-cx*32,lz=found.z-cz*32;
  const y=Math.floor(voxelWaterColumn(chunk.waterColumns[lz*32+lx],chunk.hydrologyGround[lz*32+lx]).top);
  assert.equal(chunk.getBlockId(lx,y,lz),blocks.ice.id);
  assert.ok(chunk.waterColumns[lz*32+lx]);
  chunk.dataStore={entriesForChunk(){return [[lx,y,lz,0]];}};
  chunk.loadPlayerChanges();
  assert.equal(chunk.getBlockId(lx,y,lz),0);
  assert.ok(chunk.waterColumns[lz*32+lx],'water must remain beneath the removed ice');
  const old=chunkAt(cx,cz,'snow',TERRAIN_V11);
  assert.notEqual(old.getBlockId(lx,y,lz),blocks.ice.id,'existing v11 worlds have no new ice');
});

test('v11.2.2 ice starts at the water surface, extends downward and remains editable',()=>{
  const p={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
    trees:{frequency:0,canopy:{density:.7}},clouds:{density:.3}};
  applyWorldPreset(p,'snow');
  const simplex=new SimplexNoise(new RNG(p.seed));
  const surface=(x,z)=>advancedSurfaceHeight(simplex,p,'snow',x,z,80);
  let target=null;
  for(let z=-420;z<=420&&!target;z+=5)for(let x=-420;x<=420&&!target;x+=5){
    const h=hydrologyColumnV112(simplex,p,'snow',x,z,p.seed,surface);
    if(h.ice)target={x,z,h};
  }
  assert.ok(target,'snowy water should produce a stationary ice cap');
  const cx=Math.floor(target.x/32),cz=Math.floor(target.z/32);
  const chunk=chunkAt(cx,cz,'snow',TERRAIN_V112);
  const x=target.x-cx*32,z=target.z-cz*32;
  const y=Math.floor(voxelWaterColumn(chunk.waterColumns[z*32+x],chunk.hydrologyGround[z*32+x]).top);
  chunk.generateMeshes();
  const iceMesh=chunk.children.find(m=>m.isInstancedMesh&&m.name===String(blocks.ice.id));
  assert.ok(iceMesh,'ice must still be an instanced, selectable block');
  const index=iceMesh.userData.blockIndices.indexOf(chunk.voxels.index(x,y,z));
  assert.ok(index>=0);
  const matrix=iceMesh.matrices[index];
  assert.equal(ICE_THICKNESS,1,'natural ice is now one full block thick');
  assert.ok(Math.abs(matrix.sy-ICE_THICKNESS)<1e-7,'ice geometry must occupy a full cube');
  assert.equal(matrix.sx,1);
  assert.equal(matrix.sz,1);
  const waterTop=voxelWaterColumn(chunk.waterColumns[z*32+x],chunk.hydrologyGround[z*32+x]).top;
  assert.ok(Math.abs(matrix.ty+matrix.sy/2-(waterTop+.003))<1e-6,
    'upper surface must align with the complete voxel top');
  assert.ok(matrix.ty-matrix.sy/2<waterTop,'ice thickness extends downward from the voxel top');
  const worldSource=readFileSync(new URL('../scripts/world.js',import.meta.url),'utf8')
    .replace(/^import .*;\s*$/gm,'').replace('export class World','class World')+'\nWorld;';
  const World=vm.runInNewContext(worldSource,{THREE:{Group},blocks,ICE_THICKNESS});
  const world=Object.create(World.prototype);
  world.chunkSize={width:32,height:80};
  world.chunkIndex=new Map([[`${cx},${cz}`,chunk]]);
  chunk.loaded=true;
  const hitbox=world.getBlockHitbox(target.x,y,target.z,blocks.ice.id);
  assert.ok(hitbox,'the same cap must provide physical collision');
  assert.ok(Math.abs(y+hitbox.offsetY+hitbox.halfY-waterTop)<1e-6,
    'player feet should stand at the snapped voxel top');
  const lastEncoded=iceMesh.userData.blockIndices.at(-1);
  const edits=[];
  chunk.loaded=true;chunk.dataStore={set(...args){edits.push(args);}};
  assert.equal(chunk.removeBlock(x,y,z),true);
  assert.equal(chunk.getBlockId(x,y,z),0);
  assert.equal(iceMesh.count,iceMesh.userData.blockIndices.length);
  assert.equal(edits.length,1);
  if(lastEncoded!==chunk.voxels.index(x,y,z)){
    const tz=lastEncoded%chunk.size.width,t=(lastEncoded-tz)/chunk.size.width;
    const ty=t%chunk.size.height,tx=(t-ty)/chunk.size.height;
    assert.equal(chunk.getBlock(tx,ty,tz).instanceId,index,
      'swapped ice instances must still point to the correct saved voxel');
  }
});

test('11.4.5: el hielo se pica y se construye sobre él en el vóxel que se ve',()=>{
  let target=null;
  for(let cz=-12;cz<=12&&!target;cz++)for(let cx=-12;cx<=12&&!target;cx++){
    const chunk=chunkAt(cx,cz,'snow',TERRAIN_V112);
    for(let z=0;z<32&&!target;z++)for(let x=0;x<32&&!target;x++){
      const water=chunk.waterColumns?.[z*32+x];
      if(!water)continue;
      const y=Math.floor(voxelWaterColumn(water,chunk.hydrologyGround[z*32+x]).top);
      if(chunk.getBlockId(x,y,z)===blocks.ice.id)target={chunk,cx,cz,x,z,y};
    }
  }
  assert.ok(target,'hay hielo natural en el mundo nevado');
  const {chunk,cx,cz,x,z,y}=target;
  const wx=cx*32+x,wz=cz*32+z;
  const world={getBlockId:(ax,ay,az)=>ax===wx&&az===wz?chunk.getBlockId(x,ay,z):0};
  const hit=pickVoxel(world,{x:wx,y:y+3,z:wz},{x:0,y:-1,z:0},6);
  assert.equal(hit?.y,y,'pico selecciona la altura real del hielo');
  assert.deepEqual(adjacentCell(hit),{x:wx,y:y+1,z:wz},'el bloque superior queda apoyado');
  assert.equal(chunk.getBlockId(x,y+1,z),0,'el espacio encima del hielo está libre');
});

test('11.4.5: un agujero de hielo guardado con coordenadas antiguas se migra sin cerrarse',()=>{
  let target=null;
  for(let cz=-12;cz<=12&&!target;cz++)for(let cx=-12;cx<=12&&!target;cx++){
    const chunk=chunkAt(cx,cz,'snow',TERRAIN_V112);
    for(let z=0;z<32&&!target;z++)for(let x=0;x<32&&!target;x++){
      const water=chunk.waterColumns?.[z*32+x];
      if(!water)continue;
      const y=Math.floor(voxelWaterColumn(water,chunk.hydrologyGround[z*32+x]).top);
      if(chunk.getBlockId(x,y,z)===blocks.ice.id&&Math.ceil(water.y+.25)!==y)
        target={chunk,cx,cz,x,z,y,oldY:Math.ceil(water.y+.25)};
    }
  }
  assert.ok(target);
  const {chunk,cx,cz,x,z,y,oldY}=target;
  const store=new DataStore();
  const oldKey=`${cx*32},${cz*32},${x},${oldY},${z}`;
  const newKey=`${cx*32},${cz*32},${x},${y},${z}`;
  store.data[oldKey]=0;
  store.legacyIceEdits.add(oldKey);
  chunk.dataStore=store;
  chunk.loadPlayerChanges();
  assert.equal(chunk.getBlockId(x,y,z),0,'el hielo roto no reaparece');
  assert.equal(store.data[newKey],0,'la eliminación queda en la coordenada nueva');
  assert.equal(Object.hasOwn(store.data,oldKey),false);
  assert.equal(store.legacyIceEdits.has(oldKey),false);
  const reopened=chunkAt(cx,cz,'snow',TERRAIN_V112);
  reopened.dataStore=store;
  reopened.loadPlayerChanges();
  assert.equal(reopened.getBlockId(x,y,z),0,'el agujero sobrevive a una segunda carga');
});

test('v11.3.4 real river chunk exposes only vertical indexed voxel sides',()=>{
  const p={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
    trees:{frequency:0,canopy:{density:.7}},clouds:{density:.3}};
  applyWorldPreset(p,'classic');
  const simplex=new SimplexNoise(new RNG(p.seed));
  const surface=(x,z)=>advancedSurfaceHeight(simplex,p,'classic',x,z,80);
  let location=null;
  for(let z=-270;z<270&&!location;z+=3)for(let x=-270;x<270&&!location;x+=3){
    const a=hydrologyColumnV112(simplex,p,'classic',x,z,p.seed,surface);
    const b=hydrologyColumnV112(simplex,p,'classic',x,z+1,p.seed,surface);
    if(a.kind==='river'&&b.kind==='river'&&
       Math.abs(a.waterY-b.waterY)>=1.05)
      location={x,z};
  }
  assert.ok(location,'expected stepped rivers in a seeded mountain world');
  const chunk=chunkAt(Math.floor(location.x/32),Math.floor(location.z/32),'classic',TERRAIN_V112);
  chunk.generateWater();
  const inland=chunk.children.filter(o=>o.geometry?.waterFall);
  assert.ok(inland.length>=1);
  assert.ok(inland.every(mesh=>mesh.geometry.waterFall.array.length===
    mesh.geometry.position.array.length/3));
  let verticalSides=0;
  for(const mesh of inland){
    const p=mesh.geometry.position.array,f=mesh.geometry.waterFall.array;
    for(let i=0;i+3<f.length;i+=4){
      const x=[p[i*3],p[(i+1)*3],p[(i+2)*3],p[(i+3)*3]];
      const y=[p[i*3+1],p[(i+1)*3+1],p[(i+2)*3+1],p[(i+3)*3+1]];
      const z=[p[i*3+2],p[(i+1)*3+2],p[(i+2)*3+2],p[(i+3)*3+2]];
      if(Math.max(...y)-Math.min(...y)<.9)continue;
      assert.ok(Math.max(...x)-Math.min(...x)<1e-6||Math.max(...z)-Math.min(...z)<1e-6,
        'voxel side face must be vertical, never tilted along the terrain');
      assert.ok(y[0]>=y[3]&&y[1]>=y[2]&&Math.max(y[0],y[1])>Math.min(y[2],y[3])&&
        x[0]===x[3]&&z[0]===z[3]&&x[1]===x[2]&&z[1]===z[2],
        'side vertices descend vertically from their continuous top edge');
      assert.ok(f[i]===f[i+1]&&f[i+1]===f[i+2]&&f[i+2]===f[i+3],
        'foam markers apply to whole faces, never individual corners');
      verticalSides++;
    }
  }
  assert.ok(verticalSides>0,'banks and steps need vertical voxel faces');
});

test('v11.5.1 a roofed, stone-lined full conduit draws only its open mouth',()=>{
  const metadata={sourceVersion:5,protectedChunks:[],blendBlocks:96,hydrographyVersion:3};
  const context=makeHybridContext(new Set(),new Set(),metadata,0,0);
  const c=chunkAt(0,0,'classic',TERRAIN_HYBRID_V112,context);
  c.initializeTerrain();c.waterColumns=Array(1024).fill(null);
  c.hydrologyGround=new Float32Array(1024).fill(4.5);
  c.setBlockId(10,4,10,3);c.setBlockId(10,6,10,16);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])c.setBlockId(10+dx,5,10+dz,16);
  c.waterColumns[10*32+10]={kind:'river',y:5.25,depth:1,dynamic:true};
  c.generateWater();assert.equal(c.children.filter(m=>m.userData?.waterSurface).length,0,
    'no water sheet inside the touching roof or behind opaque walls');
  c.setBlockId(10,5,11,0);c.generateWater();
  const mesh=c.children.find(m=>m.userData?.waterSurface);assert.ok(mesh);
  assert.equal(mesh.geometry.position.array.length,12,'one visible mouth quad');
  assert.ok(mesh.geometry.position.array.filter((_,i)=>i%3===2).every(z=>z===10.5));
  c.cavityLiquidLookup=()=>[{bottom:4.5,top:5.5,roof:7.5}];
  c.loaded=true;c.refreshWater();
  assert.equal(c.children.filter(m=>m.userData?.waterSurface).length,0,
    'a flooded neighboring cave removes the surface/cave internal interface too');
});

function syntheticSheet(x0=0){
  const c=new WorldChunk({width:4,height:16},{seed:1,terrain:{waterOffset:0}},new DataStore(),'classic',false,TERRAIN_V112);
  c.position.x=x0;c.loaded=true;c.voxels=new VoxelData(4,16);
  c.hydrologyGround=new Float32Array(16).fill(.5);c.waterColumns=Array(16).fill(null);
  c.hybridNearby=null;
  return c;
}
const fill=(c,x,z,depth)=>{c.waterColumns[z*4+x]={kind:'river',bed:.5,y:.5+depth-.25,depth,dynamic:true};};

test('continuous dynamic sheet has identical shared vertices and no internal vertical wall',()=>{
  const c=syntheticSheet();fill(c,1,1,.5);fill(c,2,1,.8);
  const before=JSON.stringify(c.waterColumns);c.generateWater();
  assert.equal(JSON.stringify(c.waterColumns),before,'presentation never changes physical water');
  const mesh=c.children.find(m=>m.userData.waterSurface),p=mesh.geometry.position.array;
  const topA=p.slice(0,12),topB=p.slice(12,24);
  assert.equal(topA[4],topB[1]);assert.equal(topA[7],topB[10]);
  assert.ok(Math.abs(topA[4]-1.15)<1e-6);
  for(let i=24;i<p.length;i+=12){
    const xs=[p[i],p[i+3],p[i+6],p[i+9]];
    assert.ok(!xs.every(x=>x===1.5),'no transparent partition inside connected water');
  }
  assert.equal(mesh.geometry.waterHeightMotion.array.length,p.length);
  assert.equal(mesh.geometry.waterAlphaMotion.array.length,p.length/3*4);
  assert.ok(mesh.geometry.waterHeightMotion.array.every(Number.isFinite));
});

test('a visible waterfall shares its lower endpoint transition with the receiving river',()=>{
  const c=syntheticSheet();c.hybridNearby={hybrid:{hydrographyVersion:3},protectedSet:new Set(),legacySet:new Set()};
  c.terrainVersion=TERRAIN_HYBRID_V112;
  c.waterColumns[5]={kind:'river',bed:4.5,y:5.25,depth:1,flowX:1,flowZ:0};c.hydrologyGround[5]=4.5;
  c.waterColumns[6]={kind:'river',bed:.5,y:1.25,depth:1,flowX:1,flowZ:0};
  c.hydrologyLookup=()=>null;c.hydrologyGroundLookup=()=>.5;
  c.generateWater();
  const mesh=c.children.find(m=>m.geometry?.waterFall),f=mesh.geometry.waterFall.array;
  const p=mesh.geometry.position.array,m=mesh.geometry.waterHeightMotion.array;
  let falling=0;
  for(let i=0;i<f.length;i+=4)if(f[i]===1){
    falling++;assert.ok(p[(i+2)*3+1]<p[i*3+1]);
    assert.ok(m[(i+2)*3+2]>0,'receiving level interpolates along with the waterfall');
  }
  assert.ok(falling>0);
});

test('neighboring chunks share the complete interpolation on rising and falling water',()=>{
  const left=syntheticSheet(),right=syntheticSheet(4),timeline=new WaterTransitions();
  left.waterTransitions=right.waterTransitions=timeline;
  for(const c of [left,right]){
    c.hydrologyLookup=(x,z)=>{
      const other=x>=4?right:left,lx=x-other.position.x;
      return lx>=0&&lx<4&&z>=0&&z<4?other.waterColumns[z*4+lx]:null;
    };
    c.hydrologyGroundLookup=()=>.5;
  }
  fill(left,3,1,.6);fill(right,0,1,.8);
  const endpoints=c=>{
    const g=c.children.find(m=>m.userData.waterSurface).geometry,p=g.position.array,h=g.waterHeightMotion.array;
    const result=[];
    for(let i=0;i<4;i++)if(p[i*3]+c.position.x===3.5)result.push([p[i*3+2],p[i*3+1],...h.slice(i*3,i*3+3)]);
    return result.sort((a,b)=>a[0]-b[0]);
  };
  for(const [a,b] of [[.6,.8],[.9,.7],[.2,.4]]){
    fill(left,3,1,a);fill(right,0,1,b);
    const physical=JSON.stringify([left.waterColumns,right.waterColumns]);
    left.refreshWater();right.refreshWater();
    assert.deepEqual(endpoints(left),endpoints(right));
    assert.equal(JSON.stringify([left.waterColumns,right.waterColumns]),physical);
  }
  timeline.release(left);timeline.release(right);assert.equal(timeline.records.size,0);
});

test('finite lake discharge draws a narrow falling sheet rather than a full-width water cube',()=>{
  const c=syntheticSheet();c.hybridNearby={hybrid:{hydrographyVersion:3},protectedSet:new Set(),legacySet:new Set()};
  c.terrainVersion=TERRAIN_HYBRID_V112;
  c.waterColumns[5]={kind:'lake',bed:4.5,y:4.35,depth:.1,finite:true,dynamic:true,flowX:.01,flowZ:0,fallRate:.01,fallEdges:[.01,0,0,0]};c.hydrologyGround[5]=4.5;
  c.waterColumns[6]={kind:'lake',bed:.5,y:.45,depth:.2,finite:true,dynamic:true};
  c.hydrologyLookup=()=>null;c.hydrologyGroundLookup=()=>.5;c.generateWater();
  const mesh=c.children.find(m=>m.geometry?.waterFall),f=mesh.geometry.waterFall.array,p=mesh.geometry.position.array;
  let found=false;
  for(let i=0;i<f.length;i+=4)if(f[i]===1){
    found=true;assert.ok(Math.abs(p[(i+2)*3+2]-p[(i+3)*3+2])<.5);
    assert.ok(p[i*3+1]-p[(i+2)*3+1]>1);
  }
  assert.ok(found);
  assert.ok(voxelWaterColumn({kind:'river',bed:.5,y:.27,depth:.02,finite:true,dynamic:true},.5));
});


test('water meshing samples each external column once per rebuild',()=>{
  const c=syntheticSheet();
  for(let z=0;z<4;z++)for(let x=0;x<4;x++)fill(c,x,z,1);
  const calls=new Map();
  c.hydrologyLookup=(x,z)=>{const key=`${x},${z}`;calls.set(key,(calls.get(key)||0)+1);return null;};
  c.hydrologyGroundLookup=()=>.5;c.generateWater();
  assert.ok(calls.size>0);
  assert.ok([...calls.values()].every(n=>n===1),'corner smoothing and side clipping share cached boundary samples');
  c.generateWater();assert.ok([...calls.values()].every(n=>n===2),'cache expires between geometry rebuilds');
});

test('a suspended aqueduct keeps both upper water tiles above a lower water layer',()=>{
 const c=syntheticSheet();c.hydrologyLookup=()=>null;c.hydrologyGroundLookup=()=>.5;
 for(const x of [1,2]){
  c.setBlockId(x,7,1,3);
  c.waterColumns[4+x]={kind:'river',bed:7.5,y:7.85,depth:.6,dynamic:true,finite:true,flowX:.1};
  assert.equal(c.hydrologyGround[4+x],.5,'a suspended deck does not replace the terrain floor');
 }
 c.cavityLiquidLookup=()=>[{bottom:.5,top:1.5,roof:6.5}];
 c.generateWater();const p=c.children.find(m=>m.userData.waterSurface).geometry.position.array;
 const topQuads=[];
 for(let i=0;i<p.length;i+=12)if([p[i+1],p[i+4],p[i+7],p[i+10]].every(y=>Math.abs(y-8.1)<1e-6))topQuads.push(p.slice(i,i+12));
 assert.equal(topQuads.length,2,'both aqueduct cells retain a visible upper surface');
 assert.ok(p.filter((_,i)=>i%3===1).every(y=>y>=7.5),'upper water is never drawn below its deck');
 const attr=c.children.find(m=>m.userData.waterSurface).geometry.waterFlow;
 assert.equal(attr.array.length,p.length/3*2);assert.ok(attr.array.every(Number.isFinite));
 c.waterColumns[5]=null;c.refreshWater();
 for(const mesh of c.children.filter(m=>m.userData.waterSurface))assert.ok(mesh.geometry.position.array.filter((_,i)=>i%3===1).every(y=>y>=7.5),'drying water stays at the upper deck while fading');
});

test('changing current updates velocity attributes without replacing aqueduct geometry',()=>{
 const c=syntheticSheet();c.hydrologyLookup=()=>null;c.hydrologyGroundLookup=()=>.5;
 for(const x of [1,2])c.waterColumns[4+x]={kind:'river',bed:7.5,y:7.85,depth:.6,dynamic:true,finite:true,flowX:.12};
 c.generateWater();const mesh=c.children.find(m=>m.userData.waterSurface),geometry=mesh.geometry;
 const positions=[...geometry.position.array],indices=[...geometry.index],heights=[...geometry.waterHeightMotion.array];
 for(const x of [1,2])c.waterColumns[4+x].flowX=-.12;
 c.refreshWaterFlow();assert.equal(c.children.find(m=>m.userData.waterSurface),mesh);assert.equal(mesh.geometry,geometry);
 assert.deepEqual([...geometry.position.array],positions);assert.deepEqual([...geometry.index],indices);assert.deepEqual([...geometry.waterHeightMotion.array],heights);
 assert.ok(geometry.waterFlow.array.filter((_,i)=>i%2===0).every(v=>v<0));
 assert.equal(geometry.waterFlow.needsUpdate,true);
});
