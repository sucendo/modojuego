import test from 'node:test';
import assert from 'node:assert/strict';
import { voxelWaterColumn, exposedVoxelSide, isDownstreamWaterfallEdge,
  mergeCoplanarWaterSurfaces } from '../scripts/waterVoxelsV1134.js';
import { hydrologyColumnV1134 } from '../scripts/hydrologyV1134.js';
import { hydrologyColumnV112 } from '../scripts/hydrologyV112.js';
import { hybridHydrologyColumn, makeHybridContext, validateHydrologyHybrid } from '../scripts/hybridHydrology.js';
import { advancedSurfaceHeight } from '../scripts/terrainV10.js';
import { applyWorldPreset } from '../scripts/worldTypes.js';

test('a river is exactly one whole water voxel, resting on its ground', () => {
  const river = voxelWaterColumn({ y: 19.1, depth: 4.3, kind: 'river' }, 16.5);
  assert.deepEqual(river, {kind:'river',bottom:16.5,top:17.5,layers:1});
  assert.equal(river.top-river.bottom,1);
  const pool = voxelWaterColumn({y:19.1,depth:2.4,kind:'lake'},16.5);
  assert.equal(pool.bottom,16.5);
  assert.equal(pool.top,19.5);
  assert.equal(pool.layers,3);
  const dynamicallyFlooded=voxelWaterColumn({y:19.1,depth:2.4,kind:'river',dynamic:true},16.5);
  assert.equal(dynamicallyFlooded.layers,3,'the player can later impound several full blocks');
  assert.equal(voxelWaterColumn({y:16.5,depth:0,kind:'river'},16.5),null);
});

test('moving water renders fractional volumes without swelling to full cubes',()=>{
  const base={y:16.5,kind:'river',dynamic:true};
  const quarter=voxelWaterColumn({...base,depth:.25},16.5);
  assert.equal(quarter.bottom,16.5);
  assert.equal(quarter.top,16.75);
  assert.equal(quarter.layers,1);
  assert.equal(voxelWaterColumn({...base,depth:.125},16.5).top,16.625);
  assert.equal(voxelWaterColumn({...base,depth:.74},16.5).top,17.24);
  assert.equal(voxelWaterColumn({...base,depth:.04},16.5).top,16.54);
  assert.equal(voxelWaterColumn({...base,depth:1.48},16.5).top,17.98);
});

test('exposed sides are straight and stop against solid banks or adjacent water', () => {
  const upper={top:12.5,bottom:11.5};
  assert.equal(exposedVoxelSide(upper,null,12.5),null);
  assert.equal(exposedVoxelSide(upper,{top:12.5,bottom:11.5},0),null);
  assert.deepEqual(exposedVoxelSide(upper,null,11.5),{top:12.5,bottom:11.5,waterfall:false});
  const cliff={top:17.5,bottom:11.5};
  assert.deepEqual(exposedVoxelSide(cliff,{top:11.5,bottom:10.5},0,true),
    {top:17.5,bottom:11.5,waterfall:true});
  assert.deepEqual(exposedVoxelSide(cliff,{top:11.5,bottom:10.5},0,false),
    {top:17.5,bottom:11.5,waterfall:true},
    'el indicador histórico permanece, pero no se extiende la cara');
  assert.equal(exposedVoxelSide({top:11.5,bottom:10.5},cliff,0),null,
    'the higher column alone owns their vertical face');
  const upperShort={top:18.5,bottom:17.5},lowerShort={top:13.5,bottom:12.5};
  assert.deepEqual(exposedVoxelSide(upperShort,lowerShort,0,false),
    {top:18.5,bottom:17.5,waterfall:true});
  assert.deepEqual(exposedVoxelSide(upperShort,lowerShort,0,true),
    {top:18.5,bottom:13.5,waterfall:true});
});

test('solo la caída aguas abajo conecta alturas mediante una cascada larga',()=>{
  const eastRiver={kind:'river',flowX:4,flowZ:1};
  const next={kind:'river'};
  assert.equal(isDownstreamWaterfallEdge(eastRiver,next,1,0),true);
  assert.equal(isDownstreamWaterfallEdge(eastRiver,next,0,1),false);
  assert.equal(isDownstreamWaterfallEdge(eastRiver,next,-1,0),false);
  assert.equal(isDownstreamWaterfallEdge({kind:'lake'},next,1,0),false);
  assert.equal(isDownstreamWaterfallEdge({...eastRiver,dynamic:true},next,1,0),false);
  assert.equal(isDownstreamWaterfallEdge(eastRiver,null,1,0),false);
  assert.equal(isDownstreamWaterfallEdge(eastRiver,{kind:'river',dynamic:true},1,0),true);
});

test('un lago plano se renderiza como una sola superficie sin cuadrícula interna',()=>{
  const cells=Array.from({length:16},()=>({kind:'lake',top:7.5}));
  assert.deepEqual(mergeCoplanarWaterSurfaces(4,cells),
    [{x:0,z:0,width:4,depth:4,top:7.5,kind:'lake',sourceDebug:false}]);
  cells[5]={kind:'lake',top:6.5};
  const quads=mergeCoplanarWaterSurfaces(4,cells);
  assert.equal(quads.reduce((sum,q)=>sum+q.width*q.depth,0),16);
  assert.ok(quads.length<16,'las celdas compatibles se fusionan');
  cells[0]={kind:'lake',top:7.5,sourceDebug:true};
  const source=mergeCoplanarWaterSurfaces(4,cells).find(q=>q.sourceDebug);
  assert.deepEqual(source,{x:0,z:0,width:1,depth:1,top:7.5,kind:'lake',sourceDebug:true});
});

const simplex={noise(x,z){return Math.sin(x*1.7+z*.92)*Math.cos(x*.81-z*1.13);}};
const params={seed:873,terrain:{scale:100,magnitude:8,offset:6,waterOffset:4},
  trees:{frequency:.005,canopy:{density:.7}},clouds:{density:.3}};
applyWorldPreset(params,'snow');
const surface=(x,z)=>advancedSurfaceHeight(simplex,params,'snow',x,z,80);
const original=(x,z)=>hydrologyColumnV112(simplex,params,'snow',x,z,params.seed,surface);
const newColumn=(x,z)=>hydrologyColumnV1134(simplex,params,'snow',x,z,params.seed,surface);

test('new river generation fills one voxel of water at every sampled active channel', () => {
  let rivers=0,lakes=0;
  for(let z=-180;z<=180;z+=4)for(let x=-180;x<=180;x+=4){
    const c=newColumn(x,z);
    if(c.kind==='river'){
      rivers++;
      assert.equal(c.waterY,c.height+1.25);
      assert.equal(voxelWaterColumn({y:c.waterY,depth:c.waterY-c.height-.5,kind:'river'},c.height+.5).layers,1);
    }
    if(c.kind==='lake'){
      lakes++;
      assert.equal((c.waterY-.25)%1,0);
    }
  }
  assert.ok(rivers>50,`insufficient test river samples: ${rivers}`);
  assert.ok(lakes>0,`no lake samples: ${lakes}`);
});

test('existing explored v11.2 chunks remain precisely preserved while the unvisited ones rebuild', () => {
  const hybrid={sourceVersion:5,protectedChunks:['0,0'],blendBlocks:96};
  assert.equal(validateHydrologyHybrid(hybrid,6).sourceVersion,5);
  const protectedSet=new Set(['0,0']);
  const context=makeHybridContext(protectedSet,new Set(),hybrid,0,0);
  const old=original(16,16), kept=hybridHydrologyColumn(simplex,params,'snow',16,16,context);
  assert.equal(kept.height,old.height);
  assert.equal(kept.waterY,old.waterY);
  const remote=makeHybridContext(protectedSet,new Set(),hybrid,18,18);
  const newSample=hybridHydrologyColumn(simplex,params,'snow',576,576,remote);
  const independent=newColumn(576,576);
  assert.equal(newSample.height,independent.height);
  assert.equal(newSample.waterY,independent.waterY);
});
