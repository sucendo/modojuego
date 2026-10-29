'use strict';
// Madrid saved JSON must drive the ACTUAL corner banking code. Unit probe
// reconstructs the dynamic 12th corner region and samples the original
// simulator's interpolation, without approximating its output in test code.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=JSON.parse(fs.readFileSync('apex/circuits/json/apex26_14-madrid-spain_2026-10-29.json','utf8'));
const script=fs.readFileSync('apex/parts/part-023.txt','utf8');
const get=(a,b)=>{
 const i=script.indexOf(a),j=script.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'Missing bank function: '+a);
 return script.slice(i,j);
};
const region={turn:12,startS:2500,lengthM:240,centerS:2620,curveSign:1};
const sim={
 trackData:{km:5.4,authoredBanking:null,cornerRegions:[region]},
 profileSmooth01:t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);},
 mod:(n,m)=>((n%m)+m)%m,
 lerp:(a,b,t)=>a+(b-a)*t,
 curvatureAt:()=>.001
};
vm.createContext(sim);
vm.runInContext(get('function apexNormalizeAuthoredBanking(', 'function apexCircuitMetadataForExport(')+
 get('function apexContinuousCornerReference(', 'function apexCornerReferenceAtS(')+
 get('function apexAuthoredBankAt(', 'async function importEditableCircuitSvgText('),sim);
sim.trackData.authoredBanking=sim.apexNormalizeAuthoredBanking(cfg);
const deg=u=>sim.apexAuthoredBankAt(region.startS+u*region.lengthM)*180/Math.PI;
assert.equal(sim.trackData.authoredBanking.length,22);
assert.ok(Math.abs(deg(0))<.00001,'Bank should join the preceding straight smoothly');
assert.ok(deg(.03)>.5,'Monumental must start banking within its first 3%');
assert.ok(deg(.08)>4.7,'Monumental should already bank perceptibly at 8%');
assert.ok(deg(.16)>10,'Monumental should ramp before its midsection');
assert.ok(deg(.23)>13.4,'Full tilt must arrive by 23%');
assert.ok(Math.abs(deg(.7)-13.4957)<.01,'Maintain the original bank maximum');
assert.ok(Math.abs(deg(1))<.00001,'Bank should end smoothly');
assert.ok(fs.readFileSync('apex/parts/part-024.txt','utf8').includes('const authored=apexAuthoredBankAt(s);if(Number.isFinite(authored))return authored;'),
 'Active bankAt must honor authored JSON before automatic fallbacks');
const color=cfg.visual?.curbs?.colors;
assert.deepEqual(color,['#f2c500','#d51f27'],'Official saved Madrid palette changed');
console.log(JSON.stringify({test:'madrid-json-banking',monumental:{name:'La Monumental',peak:cfg.banking.corners.find(x=>x.turn===12).bankDeg,at3pct:deg(.03),at8pct:deg(.08),at16pct:deg(.16),at23pct:deg(.23)},curbColors:color,ok:true}));
