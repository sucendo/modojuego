import test from 'node:test';
import assert from 'node:assert/strict';
import { PlaytimeTracker, validatePlaytime, emptyPlaytime, formatDuration } from '../scripts/playtime.js';

function fakeTimer() {
  let ms=0;
  const origin = Date.parse('2026-11-06T10:00:00.000Z');
  const timer = new PlaytimeTracker({ monotonic:()=>ms, wallClock:()=>new Date(origin+ms) });
  return { timer, advance:n=>{ ms+=n; } };
}
test('clock counts only while playing, pauses on inventory/menu and resumes same session',()=>{
  const {timer,advance}=fakeTimer();
  timer.start(); advance(10355);
  assert.equal(timer.total(),10355);
  timer.pause(); advance(40000);
  assert.equal(timer.total(),10355);
  timer.start();advance(5100);timer.pause();
  const state=timer.snapshot();
  assert.equal(state.totalMs,15455);
  assert.equal(state.sessions.length,1);
  assert.equal(state.sessions[0].durationMs,15455);
  assert.equal(state.sessions[0].startedAt,'2026-11-06T10:00:00.000Z');
  assert.equal(state.sessions[0].endedAt,'2026-11-06T10:00:55.455Z');
});
test('save reload preserves accumulated time, but begins a new log entry',()=>{
  const {timer,advance}=fakeTimer();
  timer.start();advance(72000);timer.endSession();
  const state=validatePlaytime(JSON.parse(JSON.stringify(timer.snapshot())));
  const replay=new PlaytimeTracker({monotonic:()=>1000,wallClock:()=>new Date('2026-11-06T13:14:00.000Z')});
  replay.restore(state);
  assert.equal(replay.total(),72000);
  replay.start();
  assert.equal(replay.snapshot().sessions.length,1); // Zero-length sessions aren't logged.
  replay.endSession();
  assert.equal(replay.total(),72000);
});
test('invalid playtime JSON is rejected; old worlds start at zero',()=>{
  assert.deepEqual(validatePlaytime(undefined), emptyPlaytime());
  for(const raw of [
    {totalMs:-1,sessions:[]},
    {totalMs:1.5,sessions:[]},
    {totalMs:500,sessions:[{startedAt:'2026-11-06T10:00:00.000Z',endedAt:'2026-11-06T10:00:00.500Z',durationMs:2000}]},
    {totalMs:500,sessions:[{startedAt:'invalid',endedAt:'2026-11-06T10:00:00.500Z',durationMs:50}]},
    {totalMs:1000,sessions:new Array(81).fill({startedAt:'2026-11-06T10:00:00.000Z',endedAt:'2026-11-06T10:00:00.010Z',durationMs:1})}
  ]) assert.throws(()=>validatePlaytime(raw),/invalidFile/);
});
test('session journal retains latest 80 but accumulated total never decreases',()=>{
  const {timer,advance}=fakeTimer();
  for(let i=0;i<90;i++){timer.start();advance(1000);timer.endSession();}
  const state=timer.snapshot();
  assert.equal(state.totalMs,90000);
  assert.equal(state.sessions.length,80);
  assert.equal(validatePlaytime(state).totalMs,90000);
});
test('hours past 24 use total hours, not time of day',()=>{
  assert.equal(formatDuration(100*3600000+62000),'100:01:02');
  assert.equal(formatDuration(0),'00:00:00');
});
