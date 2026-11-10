'use strict';
// Verify the manifest selects the latest user-authored Madrid proposal; hidden raster reference images are stripped.
// This is a static smoke test; WebGL/Canvas rendering is covered separately.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=require('node:path');
const crypto=require('node:crypto');
const base=p.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(p.join(base,'circuits/manifest.json'),'utf8'));
const entry=manifest.circuits['14-spain'];
assert.equal(entry.svg,'svg/apex26_14-spain_circuito-propuesta-20261110.svg');
const current=fs.readFileSync(p.join(base,'circuits',entry.svg),'utf8');
assert.equal((current.match(/data-apex-role="distance-board"/g)||[]).length,72);
for(const id of ['APEX_PIT_WORK_AREA','APEX_PIT_DIVIDER','APEX_PIT_SERVICE','APEX_PIT_GARAGES','APEX_START_GRID'])assert.ok(current.includes('id="'+id+'"'));
assert.equal((current.match(/data-apex-ferris-axis="true"/g)||[]).length,2);
assert.equal(entry.exactSvg,true);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.join(base,'circuits',entry.previousEditionSvg))).digest('hex'),'c6324f9027f0c7a0a323fac8c834bf9482795ed6e5474b79959109d4f13d6c0a');
assert.equal(entry.sourceFileName,'apex26_14-spain_circuito-propuesta-20261110.svg');
assert.equal(crypto.createHash('sha256').update(current).digest('hex'),'48884a22e7a209b5e9687dd4669e385f806f365ede6495c6d9270e64eab7532c','Loaded Madrid SVG must match the new user-provided vector edition');
assert.ok(current.includes('data-apex-role="drivable-area"'),'Madrid drivable polygon missing');
assert.ok(current.includes('id="APEX_BRAKING_MARKERS"'),'Authoritative braking-markers layer missing');
assert.ok(current.includes('viewBox="0 0 512 512"'),'Preserve the Boxy-authored coordinate system');
assert.equal((current.match(/<image\b/g)||[]).length,0,'Hidden raster source references must not be loaded into the simulator');
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

assert.equal(entry.previousEditionSvg,'svg/apex26_14-madrid-spain_2026-11-06-boxes.svg');
const edition16='svg/apex26_14-madrid-spain_2026-11-03.svg';
assert.equal(entry.editionDate,'2026-11-10');
assert.ok(fs.existsSync(p.join(base,'circuits',entry.previousEditionSvg)),'Previous (16) edition must be kept');
assert.equal(entry.basePreserved,true);
assert.notEqual(entry.svg,entry.previousSvg);
const svg=fs.readFileSync(p.join(base,'circuits',edition16),'utf8');
const count=role=>(svg.match(new RegExp('data-apex-role="'+role+'"','g'))||[]).length;
assert.match(svg,/<svg\b/);
assert.match(svg,/<\/svg>\s*$/);
assert.equal(count('curb-left'),12,'SVG edition 16 left kerbs changed');
assert.equal(count('curb-right'),4,'SVG edition 16 right kerbs changed');
assert.ok(count('runoff-asphalt')>=18,'Authored asphalt runoff zones missing');
assert.equal(count('distance-board'),38,'Edition 16 has 34 active signs and 4 library templates');
assert.ok(svg.includes('data-apex-brake-boards-authoritative="true"'),'Edited distance boards must override procedural generation');
const stripPitMarks=source=>source.replace(/^ *<line id="pit_speed_limit_(?:start|end)"[^\n]*\n/gm,'').replace(/^ *<g id="pit_speed_limit_legend"[^\n]*\n(?:[^\n]*\n){2} *<\/g>\n/m,'');
for(const file of [edition16,'svg/apex26_14-madrid-spain.svg']){
  const raw=fs.readFileSync(p.join(base,'circuits',file),'utf8');
  for(const role of ['pit-speed-limit-start','pit-speed-limit-end']){
    const matching=raw.split('\n').filter(line=>line.includes(`data-apex-role="${role}"`));
    assert.equal(matching.length,2);
    assert.equal(matching.filter(line=>line.includes('data-apex-library-item="1"')).length,1);
  }
  assert.equal(raw.split('id="pit_speed_limit_legend"').length-1,1);
}
// The author's November 3 geometry, curbs and signage must remain byte-for-byte
// unchanged. The ideal racing reference is a separate non-physical SVG layer
// and a single new Elements-library sample; ignore only these intentional edits.
const stripIdealLine=source=>source
 .replace(/ data-apex-racing-line-authoritative="true" data-apex-racing-line-model="[^"]+"/,'')
 .replace(/\n    <g id="apex_ideal_racing_line"[\s\S]*?<\/g>/,'')
 .replace(/      <g data-apex-library-item="1" data-apex-library-label="TRAZADA IDEAL">[\s\S]*?<\/g>\n    /,'')
 .replace('data-apex-library-version="6"','data-apex-library-version="5"')
 .replace(/(<rect id="APEX_ELEMENT_LIBRARY_ZONE"[^>]*?)height="1080"/,'$1height="1010"')
 .replace(/(data-apex-library-category="TRACK">[\s\S]*?<rect class="library-section"[^>]*?)height="324"/,'$1height="270"')
 .replace('data-apex-library-category="SIGNAGE" transform="translate(0, 52)"','data-apex-library-category="SIGNAGE"');
assert.equal(crypto.createHash('sha256').update(stripPitMarks(stripIdealLine(svg))).digest('hex'),'a4c13b9bd80bd2e12ab353ac2db5803b777b83c58efb99eb72709e32a6d77a86','Saved SVG must preserve all edition 16 authored geometry outside the new racing-line layer and Elements tile');
assert.ok(count('track-centerline')>=1&&count('drivable-area')>=1,'Driving geometry missing');
for(const rgb of ['rgb(45, 80, 172)','rgb(207, 40, 48)','rgb(224, 230, 94)']){
  assert.ok(svg.includes(rgb),'Painted asphalt runoff color missing: '+rgb);
}
console.log(JSON.stringify({test:'madrid-saved-svg',svg:entry.svg,kerbs:count('curb-left')+count('curb-right'),runoffAsphalt:count('runoff-asphalt'),ok:true}));
