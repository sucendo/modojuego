import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ai=read('js/universal-polities-0359.js');
const base=read('js/minor-polities-0357.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(ai),'0.36.2 universal polity module must parse');
assert.doesNotThrow(()=>new Function(base),'political ownership module must parse');
assert.ok(ai.includes("const BUILD='0.36.2'"),'0.36.2 build marker missing');
assert.ok(base.includes('const totalTarget=clamp0357(500+jitter,460,540)'),'~500 nation target missing');
assert.ok(base.includes('return clamp0357(totalTarget-activeFactionCount3230,380,525)'),'dynamic nation count not derived from total world size');
assert.ok(ai.includes('majorMinorRelations0359'),'sparse major/dynamic diplomacy missing');
assert.ok(ai.includes('minorRelation0359'),'sparse dynamic/dynamic diplomacy missing');
assert.ok(ai.includes('maybeMinorDiplomacy0359'),'dynamic diplomatic behaviour missing');
assert.ok(ai.includes('maybeMajorMinorDiplomacy0359'),'major/dynamic political interaction missing');
assert.ok(ai.includes('attackMajorNeighbour0359'),'dynamic nations cannot fight principal AIs');
assert.ok(ai.includes('aiCampaignCellAllowed3280=function'),'principal AI campaign bridge missing');
assert.ok(ai.includes('universalRanking0362'),'scalable unified ranking missing');
assert.ok(ai.includes("age<300?.24:age<600?.085:.012"),'early AI interchange profile missing');
assert.ok(base.includes('rawOwnerIdAt(cell)'),'conquest cleanup owner hook missing');
assert.ok(index.includes('js/universal-polities-0359.js'),'universal polity module not loaded');

console.log('HEXATEGOS 0.36.2 ~500 universal nations smoke: OK');
