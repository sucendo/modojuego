import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {
  LOD_LEVELS,LOD_MAX_RADIUS,LOD_MIDDLE_RADIUS,QUALITY_HORIZON_CAP,
  HorizonVisibility,clampHorizonRadius,sectorCoord,lodTier,needsLod,weatherHorizonRadius
} from '../scripts/lodHorizon.js';
import {hazeTarget,hazeTintHex,normalizeHazeMode} from '../scripts/horizonHaze.js';
const read=name=>readFileSync(new URL(`../scripts/${name}`,import.meta.url),'utf8');

function fakeLOD(){
  class Group{
    constructor(){this.children=[];}
    add(mesh){this.children.push(mesh);mesh.parent=this;}
    remove(mesh){this.children=this.children.filter(c=>c!==mesh);mesh.parent=null;}
  }
  class Geo{
    setAttribute(key,val){this[key]=val;}
    setIndex(indices){this.index={array:indices,count:indices.length};}
    computeVertexNormals(){this.normalsComputed=true;}
    computeBoundingSphere(){this.sphereComputed=true;}
    dispose(){this.disposed=true;}
  }
  class Attr{constructor(data,size){this.array=data;this.itemSize=size;}}
  class Mat{constructor(config){this.config=config;}dispose(){this.disposed=true;}}
  class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;}}
  class V2{set(x,y){this.x=x;this.y=y;}}
  class Color {
    constructor(hex=0){this.setHex(hex);}
    setHex(hex){this.r=((hex>>16)&255)/255;this.g=((hex>>8)&255)/255;this.b=(hex&255)/255;return this;}
    lerp(other,a){this.r+=(other.r-this.r)*a;this.g+=(other.g-this.g)*a;this.b+=(other.b-this.b)*a;return this;}
  }
  const THREE={Group,BufferGeometry:Geo,Float32BufferAttribute:Attr,MeshLambertMaterial:Mat,Mesh,Vector2:V2,Color,DoubleSide:2};
  const world={params:{seed:123,terrain:{waterOffset:4}},chunkSize:{width:32,height:80},terrainEpoch:0,
    type:'classic',landmarksEnabled:true,generationCount:0,chunkIndex:new Map(),getRenderDistance(){return 3;},
    getHorizonDistance(){return this.horizon??16;},
    getChunk(cx,cz){return Math.max(Math.abs(cx),Math.abs(cz))<=3?{loaded:true,fade:1,fadeTarget:1}:null;}
  };
  class MapTerrain{
    constructor(world){this.world=world;}
    refresh(){}
    sample(x,z){return {height:18+Math.round(Math.sin(x/37)*6+Math.cos(z/45)*4),biome:'Temperate',water:false};}
  }
  let now=0;
  const script=read('distantTerrain.js').replace(/^import .*;\s*$/gm,'').replace('export class DistantTerrain','class DistantTerrain')+'\nDistantTerrain;';
  const Ctor=vm.runInNewContext(script,{THREE,MapTerrain,LOD_LEVELS,lodTier,sectorCoord,weatherHorizonRadius,
    hazeTarget,hazeTintHex,normalizeHazeMode,landmarkForChunk:()=>null,performance:{now:()=>now},Math,Map,Set,Number});
  return {lod:new Ctor(world),world,advance(){now+=50;}};
}

test('v10.5.1 horizon accepts up to 18, with 12 as a safe default and three quality caps',()=>{
  assert.equal(LOD_MAX_RADIUS,18);
  assert.equal(LOD_MIDDLE_RADIUS,8);
  assert.deepEqual(QUALITY_HORIZON_CAP,{low:8,medium:12,high:18});
  assert.equal(clampHorizonRadius(undefined),12);
  assert.equal(clampHorizonRadius('16'),16);
  assert.equal(clampHorizonRadius('18'),18);
  assert.equal(clampHorizonRadius(99,12),12);
  assert.equal(clampHorizonRadius(-3),6);
});

test('v10.5 has physical near chunks, 4-block medium and 8-block far LOD, no hidden collisions',()=>{
  assert.equal(LOD_LEVELS.medium.step,4);
  assert.equal(LOD_LEVELS.far.step,8);
  const full={loaded:true,fade:1,fadeTarget:1};
  assert.equal(lodTier(3,0,0,0,3,16,full),null);
  assert.equal(lodTier(4,0,0,0,3,16), 'medium');
  assert.equal(lodTier(8,0,0,0,3,16), 'medium');
  assert.equal(lodTier(9,0,0,0,3,16), 'far');
  assert.equal(lodTier(16,0,0,0,3,16), 'far');
  assert.equal(lodTier(17,0,0,0,3,16),null);
  assert.equal(lodTier(2,0,0,0,3,16,{loaded:true,fade:.3,fadeTarget:1}),'medium');
  assert.equal(needsLod(3,0,0,0,3,16,full),false);
  assert.equal(sectorCoord(-9,8),-2);
});

test('weather occludes distant LOD but cannot change user settings',()=>{
  assert.equal(weatherHorizonRadius(16,0),16);
  assert.equal(weatherHorizonRadius(16,.6),10);
  assert.equal(weatherHorizonRadius(16,1),8);
  assert.equal(weatherHorizonRadius(6,1),6);
});

test('slow FPS shrinks distant range first; healthy frame rate restores it without oscillation',()=>{
  const horizon=new HorizonVisibility(16);
  const feed=(fps,seconds)=>{for(let i=0;i<fps*seconds;i++)horizon.sample(1/fps,true,16);};
  feed(40,9);assert.equal(horizon.radius,14);
  feed(40,28);assert.ok(horizon.radius<14);
  const reduced=horizon.radius;
  feed(60,35);assert.ok(horizon.radius>reduced);
  assert.ok(horizon.radius<=16);
  const before=horizon.radius;
  horizon.sample(2,true,16);assert.equal(horizon.radius,before);
});

test('16-chunk terrain uses 49 physical, 240 medium and 800 far chunk-equivalents in <70 sector meshes',()=>{
  const {lod,world,advance}=fakeLOD();
  for(let i=0;i<280;i++){advance();lod.update({x:0,z:0},.016,{});}
  assert.equal(lod.pendingTiles,0);
  assert.ok(lod.sectors.size>30&&lod.sectors.size<70,`sector count ${lod.sectors.size}`);
  assert.ok(lod.tiers.medium>0&&lod.tiers.far>0);
  const expected=33**2-7**2;
  const covered=[...lod.sectors.values()].reduce((n,entry)=>n+entry.signature.split(';').length,0);
  assert.equal(covered,expected);
  assert.equal(lod.sectorsBuilt,lod.sectors.size);
  assert.equal(world.chunkIndex.size,0,'no full voxels or collision generated by LOD');
  assert.ok(lod.triangles<130000,`triangle budget ${lod.triangles}`);
  assert.equal(lod.activeRadius,16);
  lod.dispose();assert.equal(lod.sectors.size,0);
});

test('medium geometry carries more detail and silhouettes than far geometry',()=>{
  const {lod}=fakeLOD();
  const cell=[{cx:5,cz:5}];
  const medium=lod.buildSector(cell,'medium'),far=lod.buildSector(cell,'far');
  assert.ok(medium.index.count>far.index.count);
  assert.ok(far.index.count>0);
  assert.ok(medium.normalsComputed&&far.sphereComputed);
  medium.dispose();far.dispose();lod.dispose();
});

test('sector reveal is progressive and old meshes retire without abrupt release',()=>{
  const {lod,advance}=fakeLOD();
  for(let i=0;i<200;i++){advance();lod.update({x:0,z:0},.016,{});}
  const entry=[...lod.sectors.values()][0];
  assert.ok(entry.reveal.value>0&&entry.reveal.value<=1);
  lod.retire(entry);lod.sectors.delete([...lod.sectors.entries()].find(([,v])=>v===entry)[0]);
  lod.tickReveals(.1);
  assert.ok(entry.reveal.value<1);
  for(let i=0;i<20;i++)lod.tickReveals(.1);
  assert.equal(entry.mesh.geometry.disposed,true);
  assert.equal(entry.mesh.material.disposed,true);
  lod.dispose();
});

test('F3 supports 8–16 LOD, diagnostics and no save format changes',()=>{
  const ui=read('performanceUI.js'),world=read('world.js'),player=read('player.js'),save=read('saveManager.js');
  assert.match(ui,/\[6,8,10,12,14,16,18\]/);
  assert.match(ui,/frameHistory/);
  assert.match(ui,/pendingTiles/);
  assert.match(world,/horizonDistance = 12/);
  assert.match(world,/horizonQualityCap = 18/);
  assert.doesNotMatch(save,/adaptiveHorizonDistance|horizonQualityCap|horizonDistance/);
  const cameraFar=Number(player.match(/PerspectiveCamera\(70, window\.innerWidth \/ window\.innerHeight, 0\.1, (\d+)\)/)?.[1]);
  assert.ok(cameraFar>16*32*Math.SQRT2,'camera frustum must reach far corners of 16 chunks');
});
