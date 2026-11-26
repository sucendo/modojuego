import { WaterTransitions } from '../scripts/continuousWater.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AdaptiveVisibility, boundedRadius} from '../scripts/adaptiveVisibility.js';
import {fogTarget,DEFAULT_FOG} from '../scripts/fogAtmosphere.js';
import {clampFade,makeFadeMaterial,disposeFadeMaterial} from '../scripts/chunkFade.js';
const source=name=>readFileSync(new URL(`../scripts/${name}`,import.meta.url),'utf8');
const feed=(controller,fps,seconds,maximum=3,active=true)=>{
  const dt=1/fps;let changed=null;
  for(let n=0;n<Math.ceil(seconds*fps);n++){
    const result=controller.sample(dt,active,maximum);
    if(result!==null)changed=result;
  }
  return changed;
};

test('adaptive view only reduces after sustained slow FPS and restores after stability',()=>{
  const a=new AdaptiveVisibility(3);
  assert.equal(feed(a,42,5),null);
  assert.equal(a.radius,3);
  assert.equal(feed(a,42,4),2);
  assert.equal(a.radius,2);
  assert.equal(feed(a,60,12),null,'12 s of smooth play is not yet enough');
  assert.equal(feed(a,60,8),3,'sustained stable FPS restores distance');
});

test('safe radius is 2, except for a manually chosen smaller distance',()=>{
  assert.equal(boundedRadius(0,3),2);
  assert.equal(boundedRadius(5,3),3);
  assert.equal(boundedRadius(5,1),1);
  const a=new AdaptiveVisibility(3);
  feed(a,30,35);
  assert.equal(a.radius,2);
  assert.equal(feed(a,30,20),null,'cannot shrink below safe ring');
  assert.equal(a.radius,2);
  assert.equal(a.sample(1/60,true,1),1,'manual view distance still wins');
});

test('tab gaps and menus never falsely reduce visibility',()=>{
  const a=new AdaptiveVisibility(4);
  feed(a,38,4,4);
  feed(a,60,5,4,false);
  feed(a,38,4,4);
  assert.equal(a.radius,4,'partial low-fps runs around a pause do not combine');
  assert.equal(a.sample(2,true,4),null,'tab-resume delay is ignored');
  assert.equal(a.radius,4);
});

test('adaptive radius changes only runtime visibility, not serialized world settings',()=>{
  const world=source('world.js');const save=source('saveManager.js');
  assert.match(world,/getRenderDistance\(\)/);
  assert.match(world,/setAdaptiveDrawDistance\(radius\)/);
  assert.match(world,/updateTransitions\(dt\)/);
  assert.match(world,/chunk\.fadeTarget=0/);
  assert.match(world,/chunk\.fadeTarget=1/);
  assert.match(world,/Math\.max\(0,Math\.min\(requested/);
  assert.match(save,/drawDistance:\s*world\.drawDistance/);
  assert.doesNotMatch(save,/adaptiveDrawDistance/);
});

test('fog follows effective radius while retaining weather and height variation',()=>{
  const world={drawDistance:3,getRenderDistance(){return 2;},params:{terrain:{waterOffset:8}}};
  const fair={rain:0,snow:0,storm:0,dust:0,ash:0};
  const low=fogTarget(fair,{y:70},world,DEFAULT_FOG);
  const far=fogTarget(fair,{y:70},{...world,getRenderDistance(){return 3;}},DEFAULT_FOG);
  assert.ok(low.far<far.far);
  assert.ok(fogTarget({...fair,storm:1},{y:70},world,DEFAULT_FOG).far<low.far);
});

test('fade material patches shader but leaves source material and textures untouched',()=>{
  let disposed=false;
  const src={map:{name:'blockTexture'},onBeforeCompile(){},clone(){return {...this}},customProgramCacheKey(){return 'basic'},dispose(){disposed=true;}};
  const uniform={value:.4};
  const mat=makeFadeMaterial(src,uniform);
  const shader={uniforms:{},fragmentShader:'void main() {\n#include <dithering_fragment>\n}'};
  mat.onBeforeCompile(shader,{});
  assert.equal(shader.uniforms.chunkFade,uniform);
  assert.match(shader.fragmentShader,/gl_FragCoord/);
  assert.match(shader.fragmentShader,/discard/);
  assert.equal(src.map,mat.map);
  assert.notEqual(src,mat);
  assert.ok(mat.customProgramCacheKey().includes('voxelChunkFade'));
  assert.equal(clampFade(-1),0);assert.equal(clampFade(2),1);
  disposeFadeMaterial(mat);assert.equal(disposed,true);
});

test('F3 has an on/off switch and uses active in-game frame measurements',()=>{
  const perf=source('performanceUI.js');const main=source('main.js');
  assert.match(perf,/adaptive-visibility/);
  assert.match(perf,/autoCheck\.addEventListener\('change'/);
  assert.match(perf,/adaptive\.sample\(dt,active,world\.drawDistance\)/);
  assert.match(main,/performancePanel\.sample\(dt,player\.controls\.isLocked&&!document\.hidden\)/);
  assert.match(main,/world\.updateTransitions\(dt\)/);
});

// Exercise the actual World class against small stand-ins for the renderer and
// terrain generator. No npm download/WebGL required to verify transition logic.
function loadWorldWithStubs(){
  const vm=requireVm();
  const fakeSource=source('world.js').replace(/^import .*;\s*$/gm,'').replace('export class World','class World')+'\nWorld;';
  class Group{
    constructor(){this.children=[];this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}};}
    add(item){item.parent=this;this.children.push(item);}
    remove(item){this.children=this.children.filter(x=>x!==item);item.parent=null;}
    clear(){for(const item of this.children)item.parent=null;this.children=[];}
  }
  class FakeChunk extends Group{
    constructor(){super();this.loaded=false;this.fade=1;this.fadeTarget=1;this.fadeUniform={value:1};this.nearShadows=true;}
    setNearShadows(v){this.nearShadows=v;}
    setFade(v){this.fade=v;this.fadeUniform.value=v;}
    generate(){this.loaded=true;}
    disposeInstances(){this.disposed=true;}
  }
  return vm.runInNewContext(fakeSource,{
    WaterTransitions,THREE:{Group},WorldChunk:FakeChunk,DataStore:class {clear(){}},
    normalizeWorldType:x=>x,LEGACY_HEIGHT:32,V10_HEIGHT:80,
    TERRAIN_V10:2,TERRAIN_HYBRID:3,TERRAIN_HYBRID_V112:6,
    generatorForChunk:()=>1,protectionNearby:()=>null,
    performance:{now:()=>0},setTimeout,clearTimeout,
    Math,Map,Set,Number
  });
}
function requireVm(){return nodeVm;}
import * as nodeVm from 'node:vm';

test('World keeps the player floor and fades out old terrain before disposal',()=>{
  const World=loadWorldWithStubs();const world=new World();
  world.asyncLoading=false;
  world.generate(false,{x:0,y:30,z:0});
  assert.equal(world.chunkIndex.size,49);
  assert.equal(world.getChunk(0,0).fade,1);
  assert.equal(world.getChunk(1,1).fade,1);
  assert.equal(world.getChunk(3,3).fade,0);
  world.updateTransitions(.1);
  assert.ok(world.getChunk(3,3).fade>0,'distant terrain reveals progressively');
  world.setAdaptiveDrawDistance(2);
  assert.equal(world.drawDistance,3,'manual world preference unchanged');
  world.update({position:{x:0,y:30,z:0}});
  assert.equal(world.getChunk(3,3).fadeTarget,0);
  assert.ok(world.getChunk(0,0).loaded);
  for(let n=0;n<9;n++)world.updateTransitions(.1);
  assert.equal(world.chunkIndex.size,25);
  world.setAdaptiveDrawDistance(null);
  world.update({position:{x:0,y:30,z:0}});
  assert.equal(world.chunkIndex.size,49);
  assert.equal(world.getChunk(3,3).fade,0);
});

test('World transitions survive movement and can reverse a retirement',()=>{
  const World=loadWorldWithStubs();const world=new World();
  world.asyncLoading=false;world.generate(false,{x:0,y:20,z:0});
  for(let i=0;i<9;i++)world.updateTransitions(.1); // chunk visible before retirement
  world.setAdaptiveDrawDistance(2);
  world.update({position:{x:0,y:20,z:0}});
  const candidate=world.getChunk(3,3);
  assert.equal(candidate.fadeTarget,0);
  world.updateTransitions(.1);
  world.setAdaptiveDrawDistance(3);
  world.update({position:{x:0,y:20,z:0}});
  assert.equal(candidate.fadeTarget,1);
  for(let i=0;i<10;i++)world.updateTransitions(.1);
  assert.equal(world.getChunk(3,3),candidate,'same chunk and terrain data reused');
  assert.equal(candidate.fade,1);
  world.update({position:{x:64,y:20,z:0}});
  assert.equal(world.getChunk(2,0).loaded,true,'terrain under player ready after crossing chunk border');
});
