import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../js/ai-expansion-03876.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.match(html,/js\/ai-expansion-03876\.js\?v=03877/);
assert.doesNotMatch(src,/setInterval\(|setTimeout\(/);
assert.doesNotMatch(src,/Geology03830|deposit\(/,'no hidden mineral deposits');
let budget=0,worldDirty=0;
const owner=new Int16Array([-1,1,-1,-1,2,-1,0,-1,-1]);
const land=new Int8Array(9).fill(1);
const edgeNbr=[1,2,0,2,3,0,1,3,1,2,4,3,5,4,6,5,7,6,8,7,6];
const offsets=[0,2,5,8,11,13,15,17,19,21];
const L={n:9,land,offsets,edgeNbr};
const window={HexategosNaturalPotential03829:{profile:c=>({food:c===2?2.3:.8,forest:c===2?1.2:.2})}};
const scaffold = [
  'let campaignSeconds3230=0,paused3230=false,started3230=true,gameSpeed3212=1;',
  'let aiSnapshotDirty3260=false,cacheDirty=false,supplyDirty3220=false,needsRender=false;',
  'function aiTick3212(){ return true }',
  'function resetGame3230(){return true}',
  src,
  'return {api:window.HexategosExpansion03876,tick:()=>aiTick3212(),',
  'now:t=>campaignSeconds3230=t,owner:()=>[...owner6],',
  'gold:()=>[...botGold3230],troops:()=>[...troops3230],',
  'dirty:()=>aiSnapshotDirty3260,reset:()=>resetGame3230()};'
].join('\n');
const env=new Function('window','owner6','loadLevel','MAX_GAME_LEVEL3233',
  'FACTIONS3230','activeFactionCount3230','capitals','botGold3230',
  'troops3230','isCoastal3212','terrainKey3250','mountainTier3212','performance',
  'aiSnapshot3260','markEconomyDirty3261',scaffold)(
  window,owner,()=>L,8,[{}, {},{}],3,
  [6,1,4],new Float64Array([0,70,70]),new Float64Array([0,40,40]),
  c=>c===3,c=>c===2?'plain':c===0?'desert':'forest',new Uint8Array(9),
  {now:()=>0},{frontier:[[],[1],[4]],territory:[1,1,1]},
  ()=>{worldDirty++}
);
assert.ok(env.api);
assert.equal(env.api.version,'0.38.77','territory calibration revision');
assert.ok(env.api.priority(1,2,L)>env.api.priority(1,0,L),
 'fertile territory gets higher priority');
assert.equal(env.api.priority(1,4,L),-1e9,'foreign territory never selectable');
assert.equal(env.api.priority(1,8,L),-1e9,'noncontiguous territory cannot be claimed');
assert.equal(env.api.preview(1),2,'sensible initial neutral target');
env.now(8);
env.tick();
assert.equal(env.owner()[2],1,'neutral settlement should change ownership');
assert.ok(env.gold()[1]<70&&env.troops()[1]<40,'settlement spends real budget and escort reserve');
assert.ok(env.dirty(),'AI snapshot must be invalidated after territory changes');
assert.ok(worldDirty>0,'economy cache invalidated after conquest');
assert.equal(env.owner()[4],2,'foreign sovereign territory never annexed');
console.log('HEXATEGOS 0.38.76: selective neutral expansion, capacity, resources, adjacency, treasury, shared scheduling PASS');
