import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyWorldPreset} from '../scripts/worldTypes.js';
import {advancedSurfaceHeight} from '../scripts/terrainV10.js';
import {TERRAIN_V11,hydrologyColumn,riverCenterX,waterTint} from '../scripts/hydrology.js';

const simplex={noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);}};
const config=(type,seed=873)=>{
 const p={seed,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}};
 applyWorldPreset(p,type);return p;
};
const sample=(p,type,x,z,seed=p.seed)=>hydrologyColumn(simplex,p,type,x,z,seed,
 (a,b)=>advancedSurfaceHeight(simplex,p,type,a,b,80));
const source=name=>readFileSync(new URL(`../scripts/${name}`,import.meta.url),'utf8');

test('v11 generator is a separate version: old worlds can retain their terrain',()=>{
 assert.equal(TERRAIN_V11,4);
 const save=source('saveManager.js');
 assert.match(save,/TERRAIN_V11/);
 assert.match(save,/\[1,TERRAIN_V10,TERRAIN_HYBRID,TERRAIN_V11,TERRAIN_V112,TERRAIN_HYBRID_V112\]/);
 assert.match(save,/world\.terrainVersion = normalized\.world\.terrainVersion \|\| 1/);
 assert.match(save,/const SAVE_VERSION = 19/);
});

test('hydrology is deterministic per seed and independent of chunk coordinates',()=>{
 for(const type of ['classic','jungle','ocean','desert','snow','lava']){
  const p=config(type);
  for(const [x,z] of [[32,32],[31,87],[32,87],[-32,-16],[-33,-16],[1024,-222]]){
   const a=sample(p,type,x,z),b=sample(p,type,x,z);
   assert.deepEqual(a,b,`${type}: ${x}, ${z}`);
   assert.ok(Number.isInteger(a.height) && a.height>=1 && a.height<80);
   assert.ok(a.height<=advancedSurfaceHeight(simplex,p,type,x,z,80));
  }
 }
});

test('spawn area is dry and cannot be cut by lakes or rivers',()=>{
 for(const type of ['classic','ocean','jungle','desert','snow','lava']){
  const p=config(type);
  for(const [x,z] of [[32,32],[48,33],[31,17]]){
    const out=sample(p,type,x,z);
    assert.equal(out.waterY,null);
    assert.equal(out.kind,null);
  }
 }
});

test('rivers meander continuously and never jump a chunk boundary',()=>{
 const p=config('classic');
 for(let line=-4;line<=4;line++)for(let z=-200;z<=200;z+=11){
   const a=riverCenterX(line,z,p.seed,165),b=riverCenterX(line,z+1,p.seed,165);
   assert.ok(Math.abs(a-b)<2,`river jumped ${Math.abs(a-b)} at ${z}`);
 }
});

test('rivers and inland lakes are present and lie above carved riverbeds',()=>{
 const p=config('classic');let river=0,lake=0;
 for(let x=-350;x<350;x+=5)for(let z=-350;z<350;z+=5){
  const s=sample(p,'classic',x,z);
  if(s.waterY!==null){
    assert.ok(s.height+.5<s.waterY,`water below solid ground ${x},${z}`);
    assert.ok(Number.isFinite(s.waterY));
    river+=s.kind==='river'?1:0;
    lake+=s.kind==='lake'?1:0;
  }
 }
 assert.ok(river>100,`too few river cells: ${river}`);
 assert.ok(lake>10,`too few lake cells: ${lake}`);
});

test('world types vary water abundance: desert stays dry; jungle and ocean have more water',()=>{
 const total=(type)=>{
  const p=config(type);let wet=0;
  for(let x=-420;x<420;x+=8)for(let z=-420;z<420;z+=8)wet+=Number(sample(p,type,x,z).waterY!==null);
  return wet;
 };
 const desert=total('desert'),classic=total('classic'),jungle=total('jungle'),ocean=total('ocean');
 assert.ok(desert<classic,`desert ${desert} classic ${classic}`);
 assert.ok(jungle>desert*2,`jungle ${jungle} desert ${desert}`);
 assert.ok(ocean>classic,`ocean ${ocean} classic ${classic}`);
});

test('snow, desert and volcanic lakes have distinct surface treatments',()=>{
 const kinds=new Set();
 for(const type of ['snow','desert','lava']){
  const p=config(type);
  for(let x=-500;x<500;x+=9)for(let z=-500;z<500;z+=9){
   const h=sample(p,type,x,z);if(h.waterY!==null)kinds.add(h.kind);
  }
 }
 assert.ok(kinds.has('frozen'));
 assert.ok(kinds.has('oasis'));
 assert.ok(kinds.has('lava'));
 assert.notEqual(waterTint('frozen','snow'),waterTint('oasis','desert'));
 assert.notEqual(waterTint('oasis','desert'),waterTint('lava','lava'));
});

test('map and voxel chunks use the same deterministic hydrographic sample',()=>{
 const world=source('worldChunk.js'),map=source('mapTerrain.js'),distant=source('distantTerrain.js');
 assert.match(world,/hydrology\(simplex,this\.params,this\.type,wx,wz/);
 assert.match(map,/sampleHydro\(this\.simplex,p,this\.world\.type,x,z/);
 assert.match(map,/hydro\.height/);
 assert.match(distant,/sample\.waterY/);
 assert.match(distant,/sample\.waterKind/);
 assert.match(world,/new THREE\.BufferGeometry\(\)/);
 assert.match(world,/this\.waterColumns/);
});

test('water rendering is visual-only and does not change the voxel picking layer',()=>{
 const chunk=source('worldChunk.js'),player=source('player.js');
 assert.match(chunk,/surface\.layers\.set\(1\)/);
 assert.match(player,/raycaster\.layers\.set\(0\)/);
 assert.match(chunk,/surface\.userData\.waterSurface=true/);
 assert.match(chunk,/group\.indices\.push/);
});

test('hydrology never emits NaN or infinite surfaces at distant negative positions',()=>{
 const p=config('snow',9999);
 for(const [x,z] of [[-20000,10000],[20000,-32000],[-1,-1],[-200,-160],[1e5,-1e5]]){
  const h=sample(p,'snow',x,z);
  assert.ok(Number.isFinite(h.height));
  assert.ok(h.waterY===null||Number.isFinite(h.waterY));
 }
});
