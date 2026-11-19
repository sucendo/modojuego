import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {hazeTarget,hazeTintHex,normalizeHazeMode,HAZE_MODES} from '../scripts/horizonHaze.js';
import {LOD_LEVELS,lodTier,sectorCoord,weatherHorizonRadius,QUALITY_HORIZON_CAP,clampHorizonRadius} from '../scripts/lodHorizon.js';
const text=name=>readFileSync(new URL(`../scripts/${name}`,import.meta.url),'utf8');

function fakeLOD(radius=18){
  class Group{
    constructor(){this.children=[];}
    add(mesh){this.children.push(mesh);mesh.parent=this;}
    remove(mesh){this.children=this.children.filter(child=>child!==mesh);mesh.parent=null;}
  }
  class Geometry{
    setAttribute(k,v){this[k]=v;}
    setIndex(v){this.index={count:v.length};}
    computeVertexNormals(){} computeBoundingSphere(){}
    dispose(){this.disposed=true;}
  }
  class Attribute{constructor(a,size){this.array=a;this.itemSize=size;}}
  class Material{
    constructor(config){this.config=config;}
    dispose(){this.disposed=true;}
  }
  class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;}}
  class Vector2{constructor(x=0,y=0){this.x=x;this.y=y;}set(x,y){this.x=x;this.y=y;return this;}}
  class Color{
    constructor(hex=0){this.setHex(hex);}
    setHex(hex){this.r=((hex>>16)&255)/255;this.g=((hex>>8)&255)/255;this.b=(hex&255)/255;return this;}
    lerp(other,a){this.r+=(other.r-this.r)*a;this.g+=(other.g-this.g)*a;this.b+=(other.b-this.b)*a;return this;}
  }
  const THREE={Group,BufferGeometry:Geometry,Float32BufferAttribute:Attribute,MeshLambertMaterial:Material,Mesh,Vector2,Color,DoubleSide:2};
  const world={type:'snow',params:{seed:1234,terrain:{waterOffset:4}},chunkSize:{width:32,height:80},
    terrainEpoch:0,landmarksEnabled:false,generationCount:0,chunkIndex:new Map(),
    getRenderDistance(){return 3;},getHorizonDistance(){return radius;},
    getChunk(cx,cz){return Math.max(Math.abs(cx),Math.abs(cz))<=3?{loaded:true,fade:1,fadeTarget:1}:null;}
  };
  class MapTerrain{
    constructor(w){this.world=w;}
    refresh(){}
    sample(x,z){return {height:22+Math.sin(x/28)*6+Math.cos(z/40)*7,water:false,biome:'Tundra'};}
  }
  let now=0;
  const source=text('distantTerrain.js').replace(/^import .*;\s*$/gm,'').replace('export class DistantTerrain','class DistantTerrain')+'\nDistantTerrain;';
  const DistantTerrain=vm.runInNewContext(source,{THREE,MapTerrain,landmarkForChunk:()=>null,
    hazeTarget,hazeTintHex,normalizeHazeMode,LOD_LEVELS,lodTier,sectorCoord,weatherHorizonRadius,
    performance:{now:()=>now},Math,Map,Set,Number});
  return {terrain:new DistantTerrain(world),world,THREE,advance(){now+=50;}};
}

test('v10.5.1: 18 chunks remains an optional high-quality horizon, 12 is default',()=>{
  assert.equal(clampHorizonRadius(18),18);
  assert.equal(clampHorizonRadius(19),18);
  assert.equal(clampHorizonRadius(null),6); // pre-existing clamp behavior
  assert.equal(QUALITY_HORIZON_CAP.high,18);
  const source=text('world.js');
  assert.match(source,/horizonDistance = 12/);
  assert.match(source,/setAdaptiveHorizonDistance\(radius\)/);
  assert.match(source,/Math\.min\(18,Math\.floor\(radius\)\)/);
  assert.match(text('performanceUI.js'),/\[6,8,10,12,14,16,18\]/);
  assert.doesNotMatch(text('saveManager.js'),/hazeMode|horizonDistance|adaptiveHorizonDistance/);
});

test('haze settings are validated and every profile keeps near terrain clear',()=>{
  assert.deepEqual(HAZE_MODES,['off','low','medium','high','auto']);
  assert.equal(normalizeHazeMode('__bad__'),'auto');
  for(const radius of [6,8,12,16,18]){
    const settings=HAZE_MODES.map(mode=>hazeTarget(radius,24,4,{},mode));
    for(const {near,far,strength} of settings){
      assert.ok(near>=128,`haze too close (${near})`);
      assert.ok(near<far,`${near} >= ${far}`);
      assert.ok(far<radius*32,`${far} too far`);
      assert.ok(strength>=0 && strength<=1);
    }
    assert.equal(settings[0].strength,0);
    assert.ok(settings[1].strength<settings[2].strength);
    assert.ok(settings[2].strength<settings[3].strength);
  }
});

test('mountains clear the middle distance while bad weather increases the haze',()=>{
  const clear=hazeTarget(18,65,4,{rain:0,snow:0,storm:0},'auto');
  const valley=hazeTarget(18,12,4,{},'auto');
  const storm=hazeTarget(18,12,4,{storm:1},'auto');
  assert.ok(clear.near>valley.near);
  assert.ok(clear.strength<valley.strength);
  assert.ok(storm.near<valley.near);
  assert.ok(storm.strength>valley.strength);
  assert.notEqual(hazeTintHex('snow'),hazeTintHex('desert'));
  assert.notEqual(hazeTintHex('lava'),hazeTintHex('ocean'));
});

test('shared shader uniforms blend distant LOD with the sky with no new meshes',()=>{
  const {terrain,THREE}=fakeLOD();
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',
    fragmentShader:'#include <fog_fragment>\n#include <dithering_fragment>'};
  const material=terrain.makeMaterial({value:1},'far');
  material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.lodHazeColor,terrain.hazeColor);
  assert.equal(shader.uniforms.lodHazeRange,terrain.hazeRange);
  assert.equal(shader.uniforms.lodHazeStrength,terrain.hazeStrength);
  assert.equal(shader.uniforms.lodHazeTier.value,1);
  assert.match(shader.fragmentShader,/gl_FragColor\.rgb=mix\(gl_FragColor\.rgb,lodHazeColor/);
  assert.match(shader.fragmentShader,/smoothstep\(lodHazeRange\.x,lodHazeRange\.y/);
  assert.ok(!material.config.transparent, 'no new transparent overdraw pass');
  const mediumShader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <fog_fragment>\n#include <dithering_fragment>'};
  terrain.makeMaterial({value:1},'medium').onBeforeCompile(mediumShader);
  assert.ok(mediumShader.uniforms.lodHazeTier.value<1);
  // Shader uses the sky color and updates only uniforms, not the heightfield.
  terrain.parent={fog:{color:new THREE.Color(0xffc79b)}};
  terrain.updateHaze({x:0,y:35,z:0},{},18,.25);
  const tinted={...terrain.hazeColor.value};
  terrain.parent.fog.color.setHex(0x050d25);
  terrain.updateHaze({x:0,y:35,z:0},{},18,.25);
  assert.ok(terrain.hazeColor.value.r<tinted.r);
  terrain.setHazeMode('off');
  terrain.updateHaze({x:0,y:35,z:0},{},18,.25);
  assert.ok(terrain.hazeStrength.value<.8);
  terrain.dispose();
});

test('18-chunk LOD covers 1320 chunk-equivalents, with no additional full voxel chunks',()=>{
  const {terrain,world,advance}=fakeLOD();
  for(let i=0;i<420;i++){advance();terrain.update({x:0,y:48,z:0},.016,{});}
  assert.equal(terrain.activeRadius,18);
  assert.equal(terrain.pendingTiles,0);
  const covered=[...terrain.sectors.values()].reduce((sum,e)=>sum+e.signature.split(';').length,0);
  assert.equal(covered,37*37-7*7);
  assert.ok(terrain.sectors.size<80,`too many sectors: ${terrain.sectors.size}`);
  assert.equal(world.chunkIndex.size,0);
  assert.equal(terrain.hazeMode,'auto');
  terrain.dispose();
});
