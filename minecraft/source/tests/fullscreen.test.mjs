import test from 'node:test';
import assert from 'node:assert/strict';
import {enterFullscreen,toggleFullscreen,fullscreenSupported,isFullscreen} from '../scripts/fullscreen.js';

test('enter requests the document root and toggle exits fullscreen',async()=>{
  const doc={};doc.documentElement={async requestFullscreen(){assert.equal(this,doc.documentElement);doc.fullscreenElement=this;}};
  doc.exitFullscreen=async function(){assert.equal(this,doc);doc.fullscreenElement=null;};
  assert.equal(fullscreenSupported(doc),true);
  assert.equal(await enterFullscreen(doc),true);assert.equal(isFullscreen(doc),true);
  assert.equal(await toggleFullscreen(doc),true);assert.equal(isFullscreen(doc),false);
});
test('unsupported browsers and rejected requests leave gameplay unblocked',async()=>{
  assert.equal(fullscreenSupported({}),false);assert.equal(await enterFullscreen({}),false);
  const denied={documentElement:{requestFullscreen(){throw new Error('Denied');}}};
  assert.equal(await enterFullscreen(denied),false);
});
test('prefixed API works and repeated enter does not exit the current session',async()=>{
  let count=0;const doc={documentElement:{webkitRequestFullscreen(){count++;doc.webkitFullscreenElement=this;}},webkitExitFullscreen(){doc.webkitFullscreenElement=null;}};
  await enterFullscreen(doc);await enterFullscreen(doc);assert.equal(count,1);
  await toggleFullscreen(doc);assert.equal(isFullscreen(doc),false);
});
