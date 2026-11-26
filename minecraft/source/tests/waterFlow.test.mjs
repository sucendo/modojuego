import test from 'node:test';
import assert from 'node:assert/strict';
import {waterFlowVector,waterFlowChanged} from '../scripts/waterFlow.js';
import {stepBasinWater} from '../scripts/basinHydrology.js';
import {applyWaterMotion,updateWaterAnimation} from '../scripts/waterVisuals.js';

test('current direction follows finite discharge, including reversal and still reservoirs',()=>{
 const cell={kind:'lake',finite:true,volume:.5,flowX:.2,flowZ:0};
 assert.deepEqual(waterFlowVector(cell),[.4,0]);
 assert.deepEqual(waterFlowVector({...cell,flowX:-.2}),[-.4,0]);
 assert.deepEqual(waterFlowVector({...cell,flowX:0}),[0,0]);
 assert.deepEqual(waterFlowVector({...cell,volume:0}),[0,0]);
 assert.deepEqual(waterFlowVector({kind:'lake',flowX:1}),[0,0]);
 assert.deepEqual(waterFlowVector({kind:'river',flowX:50,flowZ:0}),[.3,0]);
 assert.ok(Math.hypot(...waterFlowVector({...cell,flowX:1e8}))<=1.5);
 for(const kind of ['frozen','lava'])assert.deepEqual(waterFlowVector({...cell,kind}),[0,0]);
 assert.equal(waterFlowChanged({...cell,renderedFlow:[.4,0]}),false);
 assert.equal(waterFlowChanged({...cell,flowX:-.2,renderedFlow:[.4,0]}),true);
});

test('receiving cells record incoming direction without altering conserved water',()=>{
 const node=(x,v)=>({x,z:0,bottom:.5,roof:10.5,outdoor:true,kind:'river',volume:v});
 const nodes=new Map([['a',node(0,1)],['b',node(1,0)]]);
 stepBasinWater(nodes,.1);
 assert.ok(nodes.get('a').flowX>0);assert.ok(nodes.get('b').flowX>0);
 assert.ok(Math.abs([...nodes.values()].reduce((s,c)=>s+c.volume,0)-1)<1e-9);
});

test('flow streaks use the shared unwrapped clock and waterfalls animate downward',()=>{
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
 const flowing=applyWaterMotion({},'river',true,true,true);flowing.onBeforeCompile(shader);
 assert.match(shader.vertexShader,/attribute vec2 waterFlow/);
 assert.match(shader.fragmentShader,/dot\(waterWorldPosition.xz,currentDirection\)-waterAnimationTime\*visualSpeed/);
 assert.match(shader.fragmentShader,/waterWorldPosition.y\*5.2\+waterClock\*4.5/);
 assert.match(shader.fragmentShader,/currentSpeed>0.0005&&waterSurfaceMix>0.6/);
 updateWaterAnimation(8300000,'low',false);assert.equal(shader.uniforms.waterAnimationTime.value,8300);
 assert.notEqual(flowing.customProgramCacheKey(),applyWaterMotion({},'river',true,true).customProgramCacheKey());
});


test('slow current changes refresh their visual data and stopping clears them',()=>{
 const c={kind:'lake',finite:true,volume:1,flowX:.006,flowZ:0,renderedFlow:[0,0]};
 assert.equal(waterFlowChanged(c),true,'a slow but visible current must not keep a stale zero vector');
 assert.equal(waterFlowChanged({...c,flowX:.0061,renderedFlow:[.006,0]}),false,'tiny changes do not churn geometry');
 assert.equal(waterFlowChanged({...c,flowX:0,renderedFlow:[.002,0]}),true,'a stopped current clears its previous animation');
});
