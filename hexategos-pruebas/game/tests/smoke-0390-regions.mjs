'use strict';
/* Regresión de regiones compartidas. Ejecutar con:
 * node hexategos-pruebas/game/tests/smoke-0390-regions.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const shared=read('data/geo-regions-0390.js');
const names=read('js/regional-names-0389.js');
const globals={};
new Function('window',shared)(globals);
const api=globals.HexategosGeoRegions0390;
assert.ok(api,'shared regional catalog available');
assert.equal(api.politicalRegions.length,42,'original political region count unchanged');
assert.equal(api.physicalRegions.length,11,'new Iberian natural regions');
const fallback=names.match(/const REGIONS=window\.HexategosGeoRegions0390\?\.politicalRegions\|\|(\[[\s\S]*?\]);/);
assert.ok(fallback,'backwards-compatible region array in the game');
const legacy=new Function('return '+fallback[1])();
assert.deepEqual(api.politicalRegions,legacy,'saved games use the same political boundaries');
const sample=(lat,lon)=>api.regionsAt(lat,lon);
const includes=(lat,lon,label)=>sample(lat,lon).natural.some(x=>x.name===label);
assert.ok(includes(41.65,-4.72,'Tierra de Campos'));
assert.ok(includes(41.65,-4.72,'Submeseta Norte'));
assert.ok(includes(39.08,-3.03,'La Mancha'));
assert.ok(includes(41.63,-.38,'Los Monegros'));
assert.ok(includes(37.40,-5.96,'Valle del Guadalquivir'));
assert.ok(includes(37.02,-7.93,'Algarve'));
assert.ok(includes(38.02,-7.87,'Alentejo'));
assert.ok(includes(39.47,-6.37,'Extremadura'));
assert.ok(!includes(40.42,-3.70,'La Mancha'),'Madrid is not La Mancha');
assert.ok(!includes(41.66,-.88,'Los Monegros'),'Zaragoza is not Los Monegros');
assert.equal(api.historicalAt(39.48,-6.37)?.name,'Portugal',
  'preserve legacy political naming (no changes to save semantics)');
assert.equal(api.regionsAt(39.48,-6.37).historical?.name,'Castilla',
  'Atlas omits overlap of approximate Portuguese political rectangle');
const atlasHTML=fs.readFileSync(new URL('../../../hexategos-atlas/index.html',import.meta.url),'utf8');
const atlasCore=fs.readFileSync(new URL('../../../hexategos-atlas/atlas-core.js',import.meta.url),'utf8');
const atlasUI=fs.readFileSync(new URL('../../../hexategos-atlas/atlas-ui.js',import.meta.url),'utf8');
assert.ok(atlasHTML.indexOf('geo-regions-0390.js')<atlasHTML.indexOf('atlas-regions-0390.js'),
  'shared data loads before Atlas overlay');
assert.ok(atlasHTML.includes('id="regions"')&&atlasHTML.includes('id="regionMode"'));
assert.ok(atlasCore.includes('HexategosAtlasRegions0390?.draw'));
assert.ok(atlasUI.includes('HexategosAtlasRegions0390?.cellInfo'));
const gameHTML=read('index.html');
assert.ok(gameHTML.indexOf('geo-regions-0390.js')<gameHTML.indexOf('regional-names-0389.js'),
  'game loads data before naming module');
console.log('HEXATEGOS regional geography 0.39.0 · shared catalog, legacy compatibility, Atlas integration: OK');
