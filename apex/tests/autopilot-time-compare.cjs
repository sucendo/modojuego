'use strict';
// Assess real, complete flying-lap pace in the deterministic production replay.
// A geometric proxy is never accepted in place of A/B race timing.
const fs=require('node:fs'),assert=require('node:assert/strict');
const path=process.argv[2];
assert.ok(path&&fs.existsSync(path),'Expected Madrid 390s JSONL audit file');
const rows=[];
for(const line of fs.readFileSync(path,'utf8').split(/\r?\n/)){
 const p=line.indexOf('{"test":"autopilot-differential"');if(p<0)continue;
 try{const row=JSON.parse(line.slice(p));if(row.dir==='14-spain'&&!row.traffic&&row.session==='race'&&row.seconds>=390)rows.push(row)}catch(e){throw Error('Invalid A/B JSON sample: '+e.message)}
}
function flyingLaps(row){
 return (row.laps||[]).filter(lap=>!lap.firstLap&&Number.isFinite(lap.time));
}
const old=rows.find(x=>x.variant==='baseline'),next=rows.find(x=>x.variant==='candidate');
assert.ok(old&&next,'Need both current main and candidate on Madrid saved SVG');
assert.equal(old.svgBoards,34,'Identical authoritative edited SVG boards');
assert.equal(next.svgBoards,34,'Identical authoritative edited SVG boards');
assert.equal(next.svgBoardAuthority,true,'Candidate must use saved SVG, not BASE');
const before=flyingLaps(old),after=flyingLaps(next);
assert.ok(before.length&&after.length,'At least one officially timed flying lap required in both runs');
const baseline=before[0].time,candidate=after[0].time;
const delta=+(baseline-candidate).toFixed(3);
const result={test:'aut-madrid-390s',baselineFlyingLapSeconds:+baseline.toFixed(3),
 candidateFlyingLapSeconds:+candidate.toFixed(3),savedSeconds:delta,
 baselineSectors:before[0].sectors,candidateSectors:after[0].sectors,
 baselineMetrics:old.metrics,candidateMetrics:next.metrics,
 geometricSearch:next.lineOptimization||null};
console.log(JSON.stringify(result));
// CPU-only work must preserve pace. A dedicated pace PR can require a gain.
const requiredSaving=Number(process.env.APEX_AUTO_MIN_LAP_SAVING_SEC??0);
assert.ok(Number.isFinite(requiredSaving)&&delta>=requiredSaving,
 'Madrid flying-lap saving '+delta+'s is below '+requiredSaving+'s');
