import test from 'node:test';
import assert from 'node:assert/strict';
import {ExplorationTracker,validateExploration,freshExploration,CELL_SIZE} from '../scripts/exploration.js';
import {AchievementTracker,ACHIEVEMENTS,validateAchievements,freshAchievements} from '../scripts/achievements.js';
import {landmarkForChunk,landmarksInArea,paintLandmark,candidateForCell} from '../scripts/landmarks.js';
import {freshProgress} from '../scripts/progress.js';

test('exploration reveals only a small vicinity and preserves grid positions',()=>{
  const tracker=new ExplorationTracker();
  assert.equal(tracker.observe({x:20,z:20}),true);
  assert.equal(tracker.data.explored.length,9);
  assert.equal(tracker.observe({x:22,z:22}),false);
  assert.equal(tracker.isExplored(20,20),true);
  assert.equal(tracker.isExplored(200,200),false);
  tracker.observe({x:34,z:34});
  assert.equal(tracker.data.explored.length,14);
  assert.equal(tracker.isExplored(55,55),true);
});
test('markers can be set, removed, restored and do not alias snapshots',()=>{
  let changes=0;const m=new ExplorationTracker(()=>changes++);
  const place=m.addMarker('Mi casa',-123,234,'home');
  assert.equal(place.x,-123);assert.equal(place.kind,'home');
  assert.equal(m.addMarker(' ',0,0),null);
  const dump=m.snapshot();dump.markers[0].name='Fake';
  assert.equal(m.data.markers[0].name,'Mi casa');
  const m2=new ExplorationTracker();m2.restore(m.snapshot());
  assert.equal(m2.data.markers[0].name,'Mi casa');
  assert.equal(m2.deleteMarker(place.id),true);
  assert.equal(m2.deleteMarker(place.id),false);
  assert.equal(changes,1);
});
test('exploration rejects malformed and oversized input; old saves migrate',()=>{
  assert.deepEqual(validateExploration(undefined),freshExploration());
  assert.throws(()=>validateExploration({...freshExploration(),explored:['0,0','0,0']}),/invalidFile/);
  assert.throws(()=>validateExploration({...freshExploration(),explored:['__proto__']}),/invalidFile/);
  assert.throws(()=>validateExploration({...freshExploration(),visitedPois:['evil']}),/invalidFile/);
  assert.throws(()=>validateExploration({...freshExploration(),nextMarkerId:-1}),/invalidFile/);
  const big=freshExploration();big.explored=Array.from({length:12001},(_,i)=>`${i},0`);
  assert.throws(()=>validateExploration(big),/invalidFile/);
  const m=new ExplorationTracker();assert.equal(m.visitPoi('poi:3:-12:ruin'),true);
  assert.equal(m.visitPoi('poi:3:-12:ruin'),false);
  assert.equal(m.snapshot().visitedPois.length,1);
});
test('achievements unlock once and keep meaningful timestamps in exports',()=>{
  const p=freshProgress(),e=freshExploration();let changed=0,unlocked=[];
  const a=new AchievementTracker(()=>changed++,key=>unlocked.push(key));
  p.blocksPlaced=1;p.blocksBroken=51;p.itemsCrafted=3;
  assert.equal(a.update(p,e).length,3);
  assert.equal(a.update(p,e).length,0);
  assert.equal(Object.keys(a.snapshot().unlocked).length,3);
  e.visitedPois.push('poi:2:3:camp');p.speciesSeen=['sheep','cow','pig','chicken'];
  p.nightsSlept=1;p.distanceMeters=600;p.blocksPlaced=100;
  assert.equal(a.update(p,e).length,5);
  assert.equal(changed,2);assert.equal(unlocked.length,ACHIEVEMENTS.length);
  assert.deepEqual(validateAchievements(a.snapshot()),a.snapshot());
});
test('achievement import validation protects IDs and date formats',()=>{
  assert.deepEqual(validateAchievements(undefined),freshAchievements());
  assert.throws(()=>validateAchievements({unlocked:{dragon:'2026-11-12T10:00:00Z'}}),/invalidFile/);
  assert.throws(()=>validateAchievements({unlocked:{miner:'not a date'}}),/invalidFile/);
});
test('landmark positions repeat for a seed and align with chunk lookups',()=>{
  const p=candidateForCell(1234,-2,3);
  assert.ok(p);assert.deepEqual(p,candidateForCell(1234,-2,3));
  assert.deepEqual(landmarkForChunk(1234,p.cx,p.cz),p);
  assert.equal(landmarkForChunk(1234,p.cx+1,p.cz),null);
  const area=landmarksInArea(1234,p.x-1,p.z-1,p.x+1,p.z+1);
  assert.equal(area.length,1);assert.deepEqual(area[0],p);
  assert.notDeepEqual(candidateForCell(1234,5,5),candidateForCell(5678,5,5));
});
test('landmark voxel structures use bounded local sets and recognizable blocks',()=>{
  const points=[];
  for(const type of ['ruin','tower','camp']){
    points.length=0;
    paintLandmark((x,y,z,id)=>points.push([x,y,z,id]),16,13,16,type);
    assert.ok(points.length>10);
    assert.ok(points.every(([x,y,z,id])=>x>=11&&x<=21&&z>=11&&z<=21&&y>=11&&y<=20&&[15,16,21].includes(id)));
    assert.ok(points.some(([,,,id])=>id===15||id===16));
  }
});
