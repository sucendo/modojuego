import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('js/game.js');
const ai=read('js/nation-ai-0360.js');
const scale=read('js/nation-scale-0341.js');
const stable=read('js/stability-0342.js');
const dipnet=read('js/diplomatic-network-034.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(ai),'nation-ai-0360.js must parse');
assert.ok(game.includes('const FACTION_CAPACITY3230=500;'),'native faction capacity must be 500');
assert.ok(game.includes('const FACTION_COUNT_OPTIONS3230=[150,250,350,500];'),'new-game selector must be 150/250/350/500');
assert.ok(game.includes('LEGACY_FACTION_COUNT_OPTIONS3230=[16,25,35,50]'),'legacy scale compatibility missing');
assert.ok(game.includes('let owner6=new Int16Array(0)'),'owner6 must support faction IDs above 255');
assert.ok(game.includes('function claimInitialRing3302'),'all nations must use the normal initial territory system');
assert.ok(game.includes('capitals[f]=capital;historicCapital3230[f]=capital;'),'normal capital assignment missing');
assert.ok(game.includes('cities3212.add(capital);cityLevel3230[capital]=1;'),'normal capital city missing');
assert.ok(game.includes('const DIP_F3300=FACTIONS3230.length'),'diplomacy must scale with real faction capacity');

for(const m of ['conformist','commercial','defensive','opportunist','localist'])
  assert.ok(ai.includes(m),`missing AI mindset ${m}`);
assert.ok(ai.includes('const CHANGE_LIMIT=3600'),'AI profiles must be able to evolve until 60 campaign minutes');
assert.ok(ai.includes('aiNationalCampaignEval3280(f,false)'),'all scheduled nations must use the full campaign evaluator');
assert.ok(ai.includes('aiNationTactical3280(f)'),'all scheduled nations must use the full tactical AI');
assert.ok(ai.includes('botBuild3230(f)'),'all scheduled nations must use the same construction AI');
assert.ok(ai.includes('schedulerBudget0360'),'staggered AI scheduler missing');
assert.ok(ai.includes('diplomacyTick3300=function'),'scaled diplomacy scheduler missing');
assert.ok(ai.includes('activeFactionCount3230>=450?6'),'500-nation diplomacy review budget missing');
assert.ok(ai.includes('ensureSnapshot0360'),'shared snapshot throttle missing');
assert.ok(ai.includes('ownedCounts3220=function'),'single-pass/shared territorial counts missing');
assert.ok(ai.includes("format:'contact-sparse'"),'compact 500-nation diplomacy save missing');
assert.ok(dipnet.includes('REBUILD_PERIOD = 12'),'diplomatic contact throttle missing');
assert.ok(!dipnet.includes('for(let a=0;a<N;a++){\n      if(!alive(a,snap)) continue;\n      for(let m=0;m<N;m++){'),'old N^3 diplomacy propagation still present');
assert.ok(scale.includes("pendingCount===150?'escala amplia"),'150/250/350/500 selector descriptions missing');
assert.ok(stable.includes('FALLBACK_THRESHOLDS=[2.6,2.1,1.7,1.35,1.05,.78,.52,.28,0]'),'large-scale capital placement safety net missing');

const iAI=index.indexOf('js/nation-ai-0360.js');
const iInfra=index.indexOf('js/ai-infra-0356.js');
assert.ok(iInfra>=0&&iAI>iInfra,'0.36.0 scheduler must load after existing AI/infrastructure layers');
assert.ok(index.includes('v0.36.0</title>')||index.includes('v0.36.1</title>')||index.includes('v0.36.2</title>')||index.includes('v0.37.0</title>')||index.includes('v0.37.1</title>')||index.includes('v0.37.2</title>')||index.includes('v0.37.3</title>')||index.includes('v0.37.4</title>')||index.includes('v0.37.5</title>')||index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>'),'visible version must remain compatible with later Hexategos versions');

console.log('HEXATEGOS 0.36.0 native 500-nation adaptive AI smoke: OK');
