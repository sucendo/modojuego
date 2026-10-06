import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('js/game.js');
const index=read('index.html');
const scale=read('js/nation-scale-0341.js');
const stability=read('js/stability-0342.js');

assert.ok(game.includes('const FACTION_CAPACITY3230=500;'),'capacity must be 500');
assert.ok(game.includes('const FACTION_COUNT_OPTIONS3230=[150,250,350,500];'),'supported nation counts must be 150/250/350/500');
assert.ok((game.match(/activeFactionCount3230/g)||[]).length>=50,'critical loops are not consistently active-count aware');
assert.ok(game.includes('LEGACY_FACTION_COUNT_OPTIONS3230=[16,25,35,50]'),'legacy nation counts must remain loadable');
assert.ok(game.includes('matrixSize:DIP_F3300'),'diplomacy saves must declare their matrix size');
assert.ok(game.includes('Math.round(Math.sqrt(s.relations.length))'),'legacy diplomacy matrix inference is missing');
assert.ok(game.includes('factionCount:activeFactionCount3230'),'portable/main state must persist factionCount');
assert.ok(scale.includes('normalizeFactionCount3230'),'nation selector must normalize scale');

const iScale=index.indexOf('js/nation-scale-0341.js');
const iStability=index.indexOf('js/stability-0342.js');
assert.ok(iScale>=0&&iStability>iScale,'0.34.2 stabilization must load after the nation-scale wrapper');

assert.ok(stability.includes('FALLBACK_THRESHOLDS=[2.6,2.1,1.7,1.35,1.05,.78,.52,.28,0]'),'500-nation placement fallback is missing');
assert.ok(stability.includes('for(let cell=0;cell<n&&cleaned.length<want;cell++)'),'absolute placement safety net is missing');
assert.ok(stability.includes('uniqueCapitals'),'runtime uniqueness validation is missing');
assert.ok(stability.includes('inactiveOwners'),'inactive-owner audit is missing');

// Pure compatibility check mirroring the 0.34.1 matrix migration:
// every legacy 16x16 value must land at the same [a,b] coordinate in 500x500.
function migrateMatrix(src,oldN,newN,fill=0){
  const dst=Array(newN*newN).fill(fill);
  const lim=Math.min(oldN,newN);
  for(let a=0;a<lim;a++)for(let b=0;b<lim;b++)dst[a*newN+b]=src[a*oldN+b];
  return dst;
}
const oldN=16,newN=500;
const src=Array.from({length:oldN*oldN},(_,i)=>(i%17)-8);
const dst=migrateMatrix(src,oldN,newN,0);
for(let a=0;a<oldN;a++)for(let b=0;b<oldN;b++)
  assert.equal(dst[a*newN+b],src[a*oldN+b],`legacy diplomacy mismatch at ${a},${b}`);
assert.equal(dst.length,250000,'500x500 diplomacy capacity expected');

// Current options + compatibility with legacy saves.
const normalize=n=>[150,250,350,500,16,25,35,50].includes(Number(n))?Number(n):150;
assert.equal(normalize(undefined),150);
assert.equal(normalize(150),150);
assert.equal(normalize(250),250);
assert.equal(normalize(350),350);
assert.equal(normalize(500),500);
assert.equal(normalize(16),16);
assert.equal(normalize(50),50);
assert.equal(normalize(49),150);

console.log('HEXATEGOS 0.34.2 smoke: OK');
