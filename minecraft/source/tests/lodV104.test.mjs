import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {HorizonVisibility,needsLod,sectorCoord,QUALITY_HORIZON_CAP,weatherHorizonRadius,lodTier,LOD_LEVELS} from '../scripts/lodHorizon.js';
import {fogTarget,DEFAULT_FOG} from '../scripts/fogAtmosphere.js';
import {hazeTarget,hazeTintHex,normalizeHazeMode} from '../scripts/horizonHaze.js';
const text=name=>readFileSync(new URL(`../scripts/${name}`,import.meta.url),'utf8');
const feed=(controller,fps,seconds,cap=8,active=true,canGrow=true)=>{
  let changed=null;
  for(let i=0;i<Math.ceil(fps*seconds);i++){
    const next=controller.sample(1/fps,active,cap,canGrow);
    if(next!==null)changed=next;
  }
  return changed;
};

test('6–8 LOD: FPS bajos reducen horizonte lejano antes que terreno cercano',()=>{
  const horizon=new HorizonVisibility(8);
  assert.equal(feed(horizon,42,5),null);
  assert.equal(horizon.radius,8);
  assert.equal(feed(horizon,42,4),7);
  assert.equal(horizon.radius,7);
  feed(horizon,42,22);assert.equal(horizon.radius,6);
  feed(horizon,30,40);assert.equal(horizon.radius,6,'el horizonte no debe caer bajo 6');
  feed(horizon,62,35);assert.ok(horizon.radius>=7,'recupera distancia si vuelve la fluidez');
  assert.equal(QUALITY_HORIZON_CAP.low,8);
  assert.equal(QUALITY_HORIZON_CAP.medium,12);
  assert.equal(QUALITY_HORIZON_CAP.high,18);
});

test('menús, inactividad y cambios de pestaña no cuentan como FPS lentos',()=>{
  const horizon=new HorizonVisibility(8);
  feed(horizon,39,4);feed(horizon,39,10,8,false);
  feed(horizon,39,4);
  assert.equal(horizon.radius,8);
  assert.equal(horizon.sample(2,true),null);
  assert.equal(horizon.radius,8);
});

test('la distancia LOD no reemplaza los chunks completos ni sus colisiones',()=>{
  assert.equal(needsLod(7,0,0,0,3,8),true);
  assert.equal(needsLod(9,0,0,0,3,8),false);
  assert.equal(needsLod(1,0,0,0,3,8,{loaded:true,fade:1,fadeTarget:1}),false);
  assert.equal(needsLod(1,0,0,0,3,8,{loaded:true,fade:.3,fadeTarget:1}),true);
  assert.equal(needsLod(1,0,0,0,3,8,{loaded:true,fade:1,fadeTarget:0}),true);
  assert.equal(needsLod(1,0,0,0,3,8,{loaded:false}),true);
  assert.equal(sectorCoord(-1),-1);assert.equal(sectorCoord(-5),-2);
});

test('el horizonte LOD se mantiene fuera del formato de guardado',()=>{
  const w=text('world.js'),s=text('saveManager.js');
  assert.match(w,/getHorizonDistance\(\)/);
  assert.match(w,/horizonDistance = 12/);
  assert.match(w,/horizonQualityCap = 18/);
  assert.match(w,/setAdaptiveHorizonDistance\(radius\)/);
  assert.doesNotMatch(s,/adaptiveHorizonDistance|horizonQualityCap|horizonDistance/);
  assert.match(text('main.js'),/scene.add\(distantTerrain\)/);
});

test('la niebla de buen tiempo permite ver las montañas LOD a 6–8 chunks',()=>{
  const world={params:{terrain:{waterOffset:8}},getRenderDistance(){return 3;},getHorizonDistance(){return 8;}};
  const weather={rain:0,snow:0,storm:0,dust:0,ash:0};
  const clear=fogTarget(weather,{y:65},world,DEFAULT_FOG);
  const snow=fogTarget({...weather,snow:1},{y:65},world,DEFAULT_FOG);
  assert.ok(clear.far>250,'no queda oculta por la antigua niebla de 130 bloques');
  assert.ok(snow.far<clear.far);
});

function fakeRendererWorld(){
  class Group {
    constructor(){this.children=[];this.userData={};}
    add(mesh){mesh.parent=this;this.children.push(mesh);}
    remove(mesh){this.children=this.children.filter(m=>m!==mesh);mesh.parent=null;}
  }
  class Geo {
    setAttribute(key,val){this[key]=val;}
    setIndex(indices){this.index={array:indices,count:indices.length};}
    computeVertexNormals(){this.normalsComputed=true;}
    computeBoundingSphere(){this.sphereComputed=true;}
    dispose(){this.disposed=true;}
  }
  class Attr {constructor(array,size){this.array=array;this.itemSize=size;}}
  class Material {
    constructor(opts){this.options=opts;}
    dispose(){this.disposed=true;}
  }
  class Mesh {constructor(geo,material){this.geometry=geo;this.material=material;}}
  class V2 {set(x,z){this.x=x;this.y=z;}}
  class Color {
    constructor(hex=0){this.setHex(hex);}
    setHex(hex){this.r=((hex>>16)&255)/255;this.g=((hex>>8)&255)/255;this.b=(hex&255)/255;return this;}
    lerp(other,a){this.r+=(other.r-this.r)*a;this.g+=(other.g-this.g)*a;this.b+=(other.b-this.b)*a;return this;}
  }
  const THREE={Group,BufferGeometry:Geo,Float32BufferAttribute:Attr,MeshLambertMaterial:Material,Mesh,Vector2:V2,Color,DoubleSide:2};
  const w={terrainEpoch:1,chunkSize:{width:32},generationCount:0,chunkIndex:new Map(),params:{terrain:{waterOffset:4}},
    getRenderDistance(){return 3;},getHorizonDistance(){return this.far??8;},
    getChunk(x,z){return Math.max(Math.abs(x),Math.abs(z))<=3?{loaded:true,fade:1,fadeTarget:1}:null;}};
  let clock=500;
  class MapTerrain{
    constructor(world){this.world=world;}
    refresh(){}
    sample(x,z){return {height:15+Math.round(Math.sin(x/25)*4+Math.cos(z/20)*3),biome:'Temperate',water:false};}
  }
  const script=text('distantTerrain.js').replace(/^import .*;\s*$/gm,'').replace('export class DistantTerrain','class DistantTerrain')+'\nDistantTerrain;';
  const DistantTerrain=vm.runInNewContext(script,{THREE,MapTerrain,LOD_LEVELS,LOD_SECTOR_SIZE:4,LOD_SAMPLE_STEP:4,
    sectorCoord,needsLod,lodTier,weatherHorizonRadius,hazeTarget,hazeTintHex,normalizeHazeMode,landmarkForChunk:()=>null,performance:{now:()=>clock},Math,Map,Set,Number});
  return {DistantTerrain,w,advance:()=>{clock+=45;}};
}

test('LOD 8 renderiza 240 chunks distantes en <=25 mallas y no genera voxels',()=>{
  const {DistantTerrain,w,advance}=fakeRendererWorld();
  const lod=new DistantTerrain(w);
  for(let i=0;i<180;i++){advance();lod.update({x:0,z:0},.016);}
  assert.ok(lod.sectors.size<=25);
  assert.ok(lod.sectors.size>=20);
  assert.ok(lod.triangles>=240*(128+64),'8x8 topología por chunk, faldones y vegetación simplificada');
  assert.equal(w.chunkIndex.size,0,'el LOD no genera chunks físicos');
  for(const entry of lod.sectors.values()){
    assert.ok(entry.mesh.geometry.normalsComputed);
    assert.equal(entry.mesh.castShadow,false);
  }
  const material=lod.material;
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <dithering_fragment>'};
  material.onBeforeCompile(shader);
  assert.ok(shader.fragmentShader.includes('smoothstep'));
  assert.ok(shader.vertexShader.includes('lodWorldXZ'));
  assert.equal(shader.uniforms.lodHorizon,lod.fadeRange);
  lod.dispose();assert.equal(lod.sectors.size,0);
  assert.equal(material.disposed,true);
});

test('las tormentas reducen solo el LOD visual, sin cambiar la configuración ni las partidas',()=>{
  const {DistantTerrain,w,advance}=fakeRendererWorld();
  const lod=new DistantTerrain(w);advance();
  w.far=12;lod.update({x:0,z:0},.02,{storm:1});
  assert.equal(lod.activeRadius,8);
  assert.equal(w.getHorizonDistance(),12);
});
