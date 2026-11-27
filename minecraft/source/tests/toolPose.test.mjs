import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_VIEW_POSES, viewPoseFor } from '../scripts/toolPose.js';
import { TOOL_PROFILES } from '../scripts/toolProfiles.js';

test('sword and saw have their own camera-relative grips and preserve the original pickaxe pose',()=>{
  assert.deepEqual(viewPoseFor('pickaxe').position,[0.6,-0.3,-0.5]);
  assert.equal(viewPoseFor('pickaxe').rotation[2],Math.PI/2);
  for(const kind of ['sword','saw','broom','spear']) {
    const pose=viewPoseFor(kind);
    assert.ok(pose.position[0]>0.5 && pose.position[0]<0.9);
    assert.ok(pose.position[2]<-.7 && pose.position[2]>-1.4);
    assert.ok(Math.abs(pose.rotation[2])<.7,'blade should remain upright in camera space');
    assert.notDeepEqual(pose.rotation,viewPoseFor('pickaxe').rotation);
  }
  assert.equal(TOOL_PROFILES.sword.kind,'sword');
  assert.equal(TOOL_PROFILES.saw.kind,'saw');
  assert.equal(Object.keys(TOOL_VIEW_POSES).length,5);
});
