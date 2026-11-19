import test from 'node:test';
import assert from 'node:assert/strict';
import {waterDepthColor,waterOpacity,applyWaterMotion,updateWaterAnimation} from '../scripts/waterVisuals.js';

test('water gets naturally darker with depth, including ocean and oasis palettes',()=>{
  for(const [kind,type] of [['river','classic'],['lake','jungle'],['lake','ocean'],['oasis','desert']]){
    const shallow=waterDepthColor(kind,type,.3);
    const deep=waterDepthColor(kind,type,12);
    assert.ok(deep.reduce((a,b)=>a+b,0)<shallow.reduce((a,b)=>a+b,0));
    assert.ok(shallow.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    assert.ok(deep.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    assert.deepEqual(waterDepthColor(kind,type,Infinity),shallow);
  }
  assert.notDeepEqual(waterDepthColor('oasis','desert',3),waterDepthColor('river','classic',3));
});

test('ice is still, lava is nearly opaque, and water stays translucent',()=>{
  assert.equal(applyWaterMotion({},'frozen').onBeforeCompile,undefined);
  assert.ok(waterOpacity('lava','lava')>waterOpacity('river','classic'));
  assert.ok(waterOpacity('frozen','snow')>waterOpacity('lake','classic'));
  assert.ok(waterOpacity('lake','classic')<1);
});

test('one shared animation uniform per frame and no per-chunk updates',()=>{
  const materialA=applyWaterMotion({},'river');
  const materialB=applyWaterMotion({},'lake');
  const materialLava=applyWaterMotion({},'lava');
  const source=()=>{
    const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
    return shader;
  };
  const a=source(),b=source(),lava=source();
  materialA.onBeforeCompile(a);
  materialB.onBeforeCompile(b);
  materialLava.onBeforeCompile(lava);
  assert.equal(a.uniforms.waterClock,b.uniforms.waterClock);
  assert.equal(a.uniforms.waterWaves,lava.uniforms.waterWaves);
  assert.match(a.vertexShader,/waterWorldPosition/);
  assert.match(a.fragmentShader,/fresnel/);
  assert.match(lava.fragmentShader,/sparkle/);
  assert.doesNotMatch(lava.fragmentShader,/fresnel/);
  updateWaterAnimation(2300,'high',false);
  assert.ok(Math.abs(a.uniforms.waterClock.value-2.3)<1e-9);
  assert.equal(a.uniforms.waterWaves.value,1);
  updateWaterAnimation(2500,'medium',false);
  assert.equal(b.uniforms.waterWaves.value,.55);
  updateWaterAnimation(2600,'low',false);
  assert.equal(a.uniforms.waterWaves.value,0);
  updateWaterAnimation(2700,'high',true);
  assert.equal(b.uniforms.waterWaves.value,0);
  assert.equal(a.uniforms.waterClock.value,2.6);
});
