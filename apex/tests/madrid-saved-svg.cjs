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
assert.equal(entry.svg,'svg/apex26_14-madrid-spain_2026-10-29.svg');
assert.equal(entry.sourceFileName,'apex26_14-spain_circuito_completo (15).svg');
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

assert.equal(entry.previousEditionSvg,'svg/apex26_14-madrid-spain_2026-10-28.svg');
assert.equal(entry.editionDate,'2026-10-29');
assert.ok(fs.existsSync(p.join(base,'circuits',entry.previousEditionSvg)),'Previous (14) edition must be kept');
assert.equal(entry.basePreserved,true);
assert.notEqual(entry.svg,entry.previousSvg);
const svg=fs.readFileSync(p.join(base,'circuits',entry.svg),'utf8');
const count=role=>(svg.match(new RegExp('data-apex-role="'+role+'"','g'))||[]).length;
assert.match(svg,/<svg\b/);
assert.match(svg,/<\/svg>\s*$/);
assert.ok(count('curb-left')>=12&&count('curb-right')>=5,'Authored kerbs missing in edition 15');
assert.ok(count('runoff-asphalt')>=18,'Authored asphalt runoff zones missing');
assert.equal(count('distance-board'),96,'New edition (15) braking boards must be preserved');
assert.equal(crypto.createHash('sha256').update(svg).digest('hex'),'bf93d151333a784457c1a85ab236abc8413bbbb54fe52ed22a0bdba0b12146ad','Saved SVG must be byte-for-byte identical to user upload');
assert.ok(count('track-centerline')>=1&&count('drivable-area')>=1,'Driving geometry missing');
for(const rgb of ['rgb(45, 80, 172)','rgb(207, 40, 48)','rgb(224, 230, 94)']){
  assert.ok(svg.includes(rgb),'Painted asphalt runoff color missing: '+rgb);
}
console.log(JSON.stringify({test:'madrid-saved-svg',svg:entry.svg,kerbs:count('curb-left')+count('curb-right'),runoffAsphalt:count('runoff-asphalt'),ok:true}));
