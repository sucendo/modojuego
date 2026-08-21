import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
global.window={SystemForgeCore:{}};
require('../src/renderer/frame-sync.js');
const {FrameSynchronizer}=window.SystemForgeCore;
const order=[];
const sync=new FrameSynchronizer({
  camera:{updateMatrixWorld:force=>order.push(`camera:${force}`)},
  updateMeasurement:()=>order.push('measure'),
  markerLayer:{update:()=>{order.push('markers');return 2}},
  labelLayer:{update:()=>{order.push('labels');return 3}},
  updateBarycenterMarker:()=>order.push('bary')
});
assert.deepEqual(sync.syncScreenOverlays(),{markers:2,labels:3});
assert.deepEqual(order,['camera:true','measure','markers','labels','bary']);
console.log('frame-sync-smoke OK');
