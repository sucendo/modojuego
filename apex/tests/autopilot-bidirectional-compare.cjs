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
function crossing(samples,distance){
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i];
  if(a.total<=distance&&b.total>=distance&&b.total>a.total)
   return a.t+(b.t-a.t)*(distance-a.total)/(b.total-a.total);
 }
 return null;
}
function lap(row){
 const first=crossing(row.samples||[],5414),second=crossing(row.samples||[],10828);
 return first!==null&&second!==null?second-first:null;
}
const old=rows.find(x=>x.variant==='baseline'),next=rows.find(x=>x.variant==='candidate');
assert.ok(old&&next,'Need both current main and candidate on Madrid saved SVG');
assert.equal(old.svgBoards,34,'Identical authoritative edited SVG boards');
assert.equal(next.svgBoards,34,'Identical authoritative edited SVG boards');
assert.equal(next.svgBoardAuthority,true,'Candidate must use saved SVG, not BASE');
const baseline=lap(old),candidate=lap(next);
assert.ok(Number.isFinite(baseline)&&Number.isFinite(candidate),'Two finish-line crossings required for both runs');
const delta=+(baseline-candidate).toFixed(3);
const result={test:'aut-bidirectional-pace-madrid-390s',baselineFlyingLapSeconds:+baseline.toFixed(3),
 candidateFlyingLapSeconds:+candidate.toFixed(3),savedSeconds:delta,
 physicalPacePlan:next.pacePlan||null,requiredSavingSeconds:.2};
console.log(JSON.stringify(result));
// A new racing line is a performance change, not just a prettier path.
// Require measured improvement and keep the branch experimental otherwise.
assert.ok(delta>=.20,'Bidirectional pace must save >=0.2s against the same main; gained '+delta+'s');
