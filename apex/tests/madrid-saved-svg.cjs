'use strict';
// Verify the saved Madrid selection points at the exact latest user-authored SVG.
// This is a static smoke test; WebGL/Canvas rendering is covered separately.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=require('node:path');
const crypto=require('node:crypto');
const base=p.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(p.join(base,'circuits/manifest.json'),'utf8'));
const entry=manifest.circuits['14-spain'];
assert.equal(entry.svg,'svg/apex26_14-madrid-spain_2026-11-03.svg');
assert.equal(entry.sourceFileName,'apex26_14-spain_circuito_completo (16).svg');
assert.equal(entry.json,'json/apex26_14-madrid-spain_2026-10-29.json');
const cfg=JSON.parse(fs.readFileSync(p.join(base,'circuits',entry.json),'utf8'));
assert.equal(cfg.schema,'APEX_CIRCUIT_JSON_V1');
assert.equal(cfg.circuit.id,'14-spain');
assert.deepEqual(cfg.visual.curbs.colors,['#f2c500','#d51f27']);
const monumental=cfg.banking.corners.find(c=>+c.turn===12);
assert.equal(monumental.name,'La Monumental');
assert.equal(monumental.bankDeg,13.4957);
assert.ok(Array.isArray(monumental.profile)&&monumental.profile.length>=6);
assert.deepEqual(monumental.profile[0],[0,0]);
assert.ok(monumental.profile[1][0]<=.03&&monumental.profile[1][1]>=1);
assert.ok(monumental.profile.find(([u,d])=>u<=.25&&d===13.4957),'Full Monumental banking is too late');
for(let i=1;i<monumental.profile.length;i++)assert.ok(monumental.profile[i][0]>monumental.profile[i-1][0],'Banking control points must increase');
const old=fs.readFileSync(p.join(base,'parts/part-023.txt'),'utf8');
assert.ok(old.includes('function apexAuthoredBankAt(s)'),'Banking engine missing');

assert.equal(entry.previousEditionSvg,'svg/apex26_14-madrid-spain_2026-10-29.svg');
assert.equal(entry.editionDate,'2026-11-03');
assert.ok(fs.existsSync(p.join(base,'circuits',entry.previousEditionSvg)),'Previous (14) edition must be kept');
assert.equal(entry.basePreserved,true);
assert.notEqual(entry.svg,entry.previousSvg);
const svg=fs.readFileSync(p.join(base,'circuits',entry.svg),'utf8');
const count=role=>(svg.match(new RegExp('data-apex-role="'+role+'"','g'))||[]).length;
assert.match(svg,/<svg\b/);
assert.match(svg,/<\/svg>\s*$/);
assert.equal(count('curb-left'),12,'SVG edition 16 left kerbs changed');
assert.equal(count('curb-right'),4,'SVG edition 16 right kerbs changed');
assert.ok(count('runoff-asphalt')>=18,'Authored asphalt runoff zones missing');
assert.equal(count('distance-board'),38,'Edition 16 has 34 active signs and 4 library templates');
assert.ok(svg.includes('data-apex-brake-boards-authoritative="true"'),'Edited distance boards must override procedural generation');
const stripPitMarks=source=>source.replace(/^ *<line id="pit_speed_limit_(?:start|end)"[^\n]*\n/gm,'').replace(/^ *<g id="pit_speed_limit_legend"[^\n]*\n(?:[^\n]*\n){2} *<\/g>\n/m,'');
for(const file of [entry.svg,'svg/apex26_14-madrid-spain.svg']){
  const raw=fs.readFileSync(p.join(base,'circuits',file),'utf8');
  for(const role of ['pit-speed-limit-start','pit-speed-limit-end'])assert.equal(raw.split(`data-apex-role="${role}"`).length-1,1);
  assert.equal(raw.split('id="pit_speed_limit_legend"').length-1,1);
}
assert.equal(crypto.createHash('sha256').update(stripPitMarks(svg)).digest('hex'),'a4c13b9bd80bd2e12ab353ac2db5803b777b83c58efb99eb72709e32a6d77a86','Saved SVG must preserve edition 16 except for authoritative board metadata and the pit speed marks');
assert.ok(count('track-centerline')>=1&&count('drivable-area')>=1,'Driving geometry missing');
for(const rgb of ['rgb(45, 80, 172)','rgb(207, 40, 48)','rgb(224, 230, 94)']){
  assert.ok(svg.includes(rgb),'Painted asphalt runoff color missing: '+rgb);
}
console.log(JSON.stringify({test:'madrid-saved-svg',svg:entry.svg,kerbs:count('curb-left')+count('curb-right'),runoffAsphalt:count('runoff-asphalt'),ok:true}));
