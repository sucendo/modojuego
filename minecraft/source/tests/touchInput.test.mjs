import test from 'node:test';
import assert from 'node:assert/strict';
import { TouchInput } from '../scripts/touchInput.js';

test('movement and camera accept separate fingers simultaneously',()=>{
  const input=new TouchInput();
  assert.equal(input.beginMove(10,100,100),true);
  assert.equal(input.beginLook(11,300,100),true);
  input.move(10,100,52);
  assert.equal(input.forward,1);
  assert.deepEqual(input.look(11,325,90),{yaw:-.1,pitch:.04});
  input.end(11);
  assert.equal(input.forward,1);
  assert.equal(input.movePointer,10);
});

test('joystick clamps diagonal movement to walking speed and ignores other fingers',()=>{
  const input=new TouchInput();input.beginMove(1,0,0);
  assert.equal(input.beginMove(2,0,0),false);
  assert.equal(input.move(2,200,200),false);
  input.move(1,200,-200);
  assert.ok(Math.abs(Math.hypot(input.x,input.forward)-1)<1e-12);
  assert.ok(input.x>0 && input.forward>0);
  input.end(2);assert.equal(input.movePointer,1);
});

test('lifting or cancelling movement leaves camera drag active',()=>{
  const input=new TouchInput();input.beginMove(1,0,0);input.beginLook(2,50,50);
  input.move(1,0,-48);input.end(1);
  assert.equal(input.x,0);assert.equal(input.forward,0);
  assert.deepEqual(input.look(2,60,50),{yaw:-.04,pitch:-0});
  assert.equal(input.move(1,0,-48),false);
});

test('opening menus or hiding the app resets all active gestures',()=>{
  const input=new TouchInput();input.beginMove(1,0,0);input.beginLook(2,1,1);
  input.move(1,48,0);input.reset();
  assert.equal(input.x,0);assert.equal(input.forward,0);
  assert.equal(input.look(2,30,30),null);
  assert.equal(input.beginMove(3,0,0),true);
  assert.equal(input.beginLook(4,0,0),true);
});

test('joystick small resting movements do not cause drifting',()=>{
  const input=new TouchInput();input.beginMove(1,100,100);input.move(1,102,98);
  assert.equal(input.x,0);assert.equal(input.forward,0);
});
