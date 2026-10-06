import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ai=read('js/universal-polities-0359.js');
const base=read('js/minor-polities-0357.js');
const about=read('js/about-0351.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(ai),'adaptive polity module must parse');
assert.doesNotThrow(()=>new Function(base),'political ownership module must parse');
assert.doesNotThrow(()=>new Function(about),'About module must parse');
assert.ok(ai.includes("const BUILD='0.36.0'")||ai.includes("const BUILD='0.36.1'")||ai.includes("const BUILD='0.36.2'"),'adaptive political build marker missing');
assert.ok(ai.includes('tryPeacefulExpansion0359'),'minimum peaceful expansion drive missing');
assert.ok(ai.includes('settlementFloor'),'minimum territorial ambition missing');
assert.ok(ai.includes('maybeMinorWar0359'),'wars between dynamic nations missing');
assert.ok(ai.includes('relocateOrEliminate0359'),'elimination/capital relocation missing');
assert.ok(ai.includes('minorWars0359'),'dynamic-nation war persistence missing');
assert.ok(ai.includes('maybeChangeMindset0359'),'adaptive dynamic AI missing');
assert.ok(ai.includes('maybeChangeMainDoctrine0359'),'adaptive principal AI missing');
assert.ok(ai.includes("age<180?.26:age<480?.10:.018"),'early-game personality volatility missing');
assert.ok(base.includes('ownerMinor0357[ent.seed]===cand'),'eliminated nations may respawn through fill reseeding');
assert.ok(index.includes('js/universal-polities-0359.js'),'adaptive module not loaded');

console.log('HEXATEGOS 0.36.0 adaptive political evolution smoke: OK');
