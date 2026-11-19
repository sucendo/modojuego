import test from 'node:test';
import assert from 'node:assert/strict';
import { DayNightClock, DAY_MS, MORNING_HOUR, freshDayNight, validateDayNight, formatGameTime } from '../scripts/dayNight.js';
import { ProgressTracker, freshProgress, validateProgress } from '../scripts/progress.js';

test('world clock starts at day 1 08:00 and has a twenty-minute day',()=>{
  const clock=new DayNightClock();
  assert.equal(clock.day,1);assert.equal(formatGameTime(clock.snapshot()),'08:00');
  clock.restore({day:3,timeMs:Math.floor(DAY_MS*.5)});
  assert.equal(formatGameTime(clock.snapshot()),'12:00');
  clock.tick(200);assert.equal(clock.day,3);
  assert.equal(Math.floor(clock.timeMs),600200);
});
test('world clock advances only when ticked; frame stalls cannot jump the day',()=>{
  const clock=new DayNightClock(),start=clock.snapshot();
  assert.deepEqual(clock.snapshot(),start); // Pause/menu: no ticking.
  clock.tick(1000000);
  assert.equal(clock.timeMs,start.timeMs+250);
  clock.restore({day:4,timeMs:DAY_MS-70});
  clock.tick(100);
  assert.equal(clock.day,5);assert.equal(clock.timeMs,30);
});
test('bed may skip night to morning, but not daytime',()=>{
  const clock=new DayNightClock();
  assert.equal(clock.sleep(),false);assert.equal(clock.day,1);
  clock.restore({day:2,timeMs:DAY_MS*22/24});
  assert.equal(clock.isNight,true);assert.equal(clock.sleep(),true);
  assert.equal(clock.day,3);assert.equal(clock.hour,MORNING_HOUR);
  clock.restore({day:8,timeMs:DAY_MS*3/24});
  assert.equal(clock.sleep(),true);assert.equal(clock.day,8);assert.equal(clock.hour,MORNING_HOUR);
});
test('clock state and statistics strictly validate imported saves',()=>{
  assert.deepEqual(validateDayNight(undefined),freshDayNight());
  assert.deepEqual(validateProgress(undefined),freshProgress());
  assert.throws(()=>validateDayNight({day:2,timeMs:-1}),/invalidFile/);
  assert.throws(()=>validateProgress({...freshProgress(),animalsHarvested:NaN}),/invalidFile/);
});
test('movement counts horizontal travel, ignores teleports and resets on world switch',()=>{
  let changed=0;const stats=new ProgressTracker(()=>changed++);
  stats.observeMovement({x:10,z:10});
  stats.observeMovement({x:11,z:11});
  stats.observeMovement({x:500,z:500});
  assert.ok(Math.abs(stats.snapshot().distanceMeters-Math.SQRT2)<.001);
  stats.restore(freshProgress());
  stats.observeMovement({x:250,z:250});
  assert.equal(stats.snapshot().distanceMeters,0);
  assert.ok(changed>0);
});
test('statistics track unique discovered species and protect data encapsulation',()=>{
  const stats=new ProgressTracker();
  assert.equal(stats.spotSpecies('sheep'),true);
  assert.equal(stats.spotSpecies('sheep'),false);
  assert.equal(stats.spotSpecies('dragon'),false);
  stats.increment('blocksPlaced',3);
  stats.increment('nightsSlept');
  const snap=stats.snapshot();snap.speciesSeen.push('cow');
  assert.deepEqual(stats.snapshot().speciesSeen,['sheep']);
  assert.equal(stats.snapshot().blocksPlaced,3);
  assert.equal(stats.snapshot().nightsSlept,1);
});
