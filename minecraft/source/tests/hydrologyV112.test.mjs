import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyWorldPreset} from '../scripts/worldTypes.js';
import {TERRAIN_V11,hydrologyColumn} from '../scripts/hydrology.js';
import {TERRAIN_V112,WATERFALL_DROP,freezeColumn,hydrologyColumnV112,waterfallFaces} from '../scripts/hydrologyV112.js';
import {advancedSurfaceHeight} from '../scripts/terrainV10.js';
import {applyWaterMotion} from '../scripts/waterVisuals.js';

const simplex={noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);}};
const params=type=>{
  const p={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
    trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}};
  applyWorldPreset(p,type);return p;
};
const column=(p,type,x,z,fn=hydrologyColumnV112)=>fn(simplex,p,type,x,z,p.seed,
  (a,b)=>advancedSurfaceHeight(simplex,p,type,a,b,80));
const source=name=>readFileSync(new URL(`../scripts/${name}`,import.meta.url),'utf8');

test('v11.2 is opt-in, while the previous v11 hydrology function stays unmodified',()=>{
  assert.equal(TERRAIN_V11,4);
  assert.equal(TERRAIN_V112,5);
  const p=params('classic');
  for(const [x,z] of [[-100,200],[52,-83],[102,47]]){
    assert.deepEqual(column(p,'classic',x,z,hydrologyColumn),
      column(p,'classic',x,z,hydrologyColumn));
  }
  assert.match(source('saveManager.js'),/terrainVersion = TERRAIN_HYBRID_V112/);
  assert.match(source('mapTerrain.js'),/gen===TERRAIN_V112/);
  assert.match(source('worldChunk.js'),/this\.terrainVersion===TERRAIN_V112/);
});

test('ice forms contiguous, partial covers in snow and high mountains only',()=>{
  let frozen=0,open=0;
  for(let x=-75;x<=75;x+=2)for(let z=-70;z<=70;z+=2){
    const ice=freezeColumn('snow',873,x,z,28,'lake');
    ice?frozen++:open++;
    assert.equal(ice,freezeColumn('snow',873,x,z,28,'lake'));
  }
  assert.ok(frozen>500 && open>200,`ice:${frozen} open:${open}`);
  assert.equal(freezeColumn('desert',873,12,20,60,'lake'),false);
  assert.equal(freezeColumn('lava',873,12,20,60,'lava'),false);
  assert.equal(freezeColumn('classic',873,12,20,15,'lake'),false);
  assert.equal(freezeColumn('snow',873,12,20,28,'river'),false,
    'moving rivers must never gain a solid ice cover');
  assert.equal(freezeColumn('snow',873,12,20,28,'lava'),false);
});

test('v11.2.2 river cross-sections have one water elevation independent of their banks',()=>{
  const p=params('snow');
  let checked=0;
  for(let z=-220;z<=220;z+=7)for(let x=-220;x<=220;x+=7){
    const a=column(p,'snow',x,z);
    if(a.kind!=='river')continue;
    const b=column(p,'snow',x+1,z);
    if(b.kind!=='river')continue;
    checked++;
    assert.equal(a.waterY,b.waterY,
      `cross-river water height must not vary with terrain at ${x},${z}`);
    assert.equal(a.ice,false);
    assert.equal(b.ice,false);
  }
  assert.ok(checked>10,'must sample actual flowing river cross-sections');
});

test('lakes remain at their own elevation and rivers have stepped waterfall candidates',()=>{
  const p=params('classic');
  let wet=0,highLake=0,changes=0;
  for(let z=-280;z<280;z+=3)for(let x=-280;x<280;x+=3){
    const a=column(p,'classic',x,z);
    if(a.waterY===null)continue;
    wet++;
    assert.ok(Number.isFinite(a.waterY)&&a.waterY>a.height+.5);
    if(a.kind==='lake'&&a.waterY>p.terrain.waterOffset+5)highLake++;
    if(a.kind==='river'){
      const next=column(p,'classic',x,z+1);
      if(next.kind==='river'&&Math.abs(a.waterY-next.waterY)>=WATERFALL_DROP)changes++;
    }
  }
  assert.ok(wet>200);
  assert.ok(highLake>0);
  assert.ok(changes>0,`No waterfall candidates on the sampled rivers: ${changes}`);
});

test('waterfall meshes stitch height changes and own positive chunk boundaries',()=>{
  const cells=Array(4).fill(null);
  cells[0]={y:18,kind:'river'};
  cells[1]={y:16,kind:'river'};
  const faces=waterfallFaces(cells,2,()=>null);
  assert.equal(faces.length,1);
  assert.deepEqual({...faces[0]},{x:0,z:0,axis:'x',high:18,low:16,kind:'river',drop:2,waterfall:true});
  const edge=Array(4).fill(null);
  edge[1]={y:12,kind:'river'};
  const outside=[];
  const crossing=waterfallFaces(edge,2,(x,z)=>{outside.push([x,z]);return {y:8,kind:'river'};});
  assert.deepEqual(outside,[[2,0]]);
  assert.equal(crossing.length,1);
  assert.equal(crossing[0].axis,'x');
  assert.equal(crossing[0].low,8);
  const gentle=waterfallFaces([{y:9,kind:'river'},{y:9.1,kind:'river'},null,null],2);
  assert.equal(gentle.length,1,'flat voxel tiles have a small vertical connecting face');
  assert.equal(gentle[0].waterfall,false,'the small connection is not a waterfall');
  const frozenFall=waterfallFaces([{y:18,kind:'frozen'},{y:16,kind:'lake'},null,null],2);
  assert.equal(frozenFall[0].kind,'river','a waterfall must be flowing water even next to inherited ice');
});

test('breaking ice is an ordinary saved 0 voxel and leaves the water surface intact',()=>{
  const block=source('worldChunk.js'),saved=source('saveManager.js'),player=source('player.js');
  assert.match(block,/blocks\.ice\.id/);
  assert.match(block,/this\.loadPlayerChanges\(\)/);
  assert.match(saved,/value > 53/);
  assert.match(saved,/blocks: \{ \.\.\.world\.dataStore\.data \}/);
  assert.match(player,/block\.id===28\?null/);
});

test('falling water has an animated vertical shader without another mesh pass',()=>{
  const material=applyWaterMotion({},'river',true);
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',
    fragmentShader:'#include <color_fragment>'};
  material.onBeforeCompile(shader);
  assert.match(shader.vertexShader,/waterfallMix=waterFall/);
  assert.match(shader.fragmentShader,/waterWorldPosition\.y\*5\.2\+waterClock\*4\.5/);
  assert.ok(shader.uniforms.waterClock);
  assert.match(source('worldChunk.js'),/geometry\.setAttribute\('waterFall'/);
  assert.match(source('worldChunk.js'),/group\.falls\.push\(animateFall\?1:0/);
});
