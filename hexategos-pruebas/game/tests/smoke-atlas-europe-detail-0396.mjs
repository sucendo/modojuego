'use strict';
/* node hexategos-pruebas/game/tests/smoke-atlas-europe-detail-0396.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const atlas=name=>fs.readFileSync(new URL('../../../hexategos-atlas/'+name,import.meta.url),'utf8');
const data=name=>fs.readFileSync(new URL('../data/'+name,import.meta.url),'utf8');
const files={
 macro:atlas('atlas-macro-0396.js'), lakes:atlas('atlas-europe-lakes-0396.js'),
 mountains:atlas('atlas-europe-mountains-0396.js'),
 secondary:atlas('atlas-europe-secondary-0396.js'),
 regions:atlas('atlas-regions-0390.js'),
 rivers:data('geo-europe-secondary-0396.js'),
 detail:data('geo-europe-detail-0396.js')
};
for(const [name,source] of Object.entries(files))
 assert.doesNotThrow(()=>new Function(source),'Malformed JS '+name);
const w={};
for(const name of ['macro','lakes','rivers','detail'])new Function('window',files[name])(w);
const macro=w.HexategosAtlasMacro0396,lakes=w.HexategosEuropeLakes0396;
const secondary=w.HexategosEuropeSecondary0396,regions=w.HexategosEuropeDetail0396;
assert.equal(macro.features.length,36);
for(const name of ['Península Ibérica','Península Escandinava','Islas Británicas',
 'Península Itálica','Península Balcánica','Llanura Europea Oriental',
 'Mar del Norte','Mar Mediterráneo'])
 assert.ok(macro.features.some(x=>x.name===name),'Macro label missing: '+name);
assert.equal(lakes.lakes.length,53);
for(const name of ['Lago Lemán','Lago de Constanza','Lago de Neuchâtel',
 'Lago de Lucerna','Lago de Zúrich','Lago Mayor','Lago de Como','Lago de Garda',
 'Lago Balatón','Lago Ladoga','Lago Onega','Lago Vänern','Lago Vättern','Lago Saimaa'])
 assert.ok(lakes.lakes.some(x=>x.name===name),'Lake missing: '+name);
assert.equal(secondary.rivers.length,54);
assert.equal(new Set(secondary.rivers.map(x=>x.name)).size,54);
assert.equal(secondary.mountains.length,27);
assert.equal(regions.naturalRegions.length,87);
assert.ok(regions.naturalAt(48.7,11).some(x=>x.name==='Baviera'));
assert.ok(regions.naturalAt(41.45,21.7).some(x=>x.name==='Macedonia'));
for(const river of secondary.rivers){
 assert.ok(river.points.length>=2&&river.channelMeters.length>=2);
 assert.equal(river.channelMeters[0][0],0);
 assert.equal(river.channelMeters.at(-1)[0],1);
}
const mountainTest=new Function('script',String.raw`
 let mountainStroke3297=()=>({ow:2,iw:1,outer:'brown',inner:'beige'});
 const window={};eval(script);
 return {
  alps:mountainStroke3297({n:'Alpes'},1).ow,
  jura:mountainStroke3297({n:'Jura'},1).ow,
  ranges:window.HexategosEuropeMountains0396.ranges.length
 };
`);
const m=mountainTest(files.mountains);
assert.equal(m.ranges,16);
assert.ok(Number.isFinite(m.alps)&&Number.isFinite(m.jura));
assert.ok(m.alps>m.jura,'Higher, rugged Alpine skyline must be stronger than Jura');
const html=atlas('index.html'),core=atlas('atlas-core.js'),ui=atlas('atlas-ui.js');
assert.ok(html.includes('id="lakes"')&&ui.includes("$('lakes').onchange"));
assert.ok(html.indexOf('geo-europe-secondary-0396.js')<html.indexOf('atlas-europe-secondary-0396.js'));
assert.ok(html.indexOf('atlas-europe-lakes-0396.js')<html.indexOf('atlas-regions-0390.js'));
assert.ok(html.indexOf('atlas-macro-0396.js')<html.indexOf('atlas-regions-0390.js'));
assert.ok(core.indexOf('HexategosEuropeLakes0396?.draw')<core.indexOf('HexategosAtlasMacro0396?.draw'));
assert.ok(core.indexOf('HexategosAtlasMacro0396?.draw')<core.indexOf('HexategosAtlasRegions0390?.draw'));
assert.ok(files.secondary.includes('G.coastEdges.has(key(prev,end))'));
assert.ok(files.secondary.includes('G.coastalNodes.has(prev)'));
assert.ok(!/setInterval\s*\(/.test(files.secondary));
console.log('HEXATEGOS ATLAS Europa 0.39.6: 36 macro, 53 lakes, 54 rivers, 27 ridges, 87 regions: OK');
