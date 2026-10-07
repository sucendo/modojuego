import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

assert.ok(trade.includes('const portLimit=b===a?24:8'),'own-port candidate scan must be wider');
assert.ok(trade.includes("if(b!==0&&!tradeRelation0370(0,b))"),'foreign route rights validation must remain');
assert.ok(trade.includes("owner6[from]!==a||owner6[to]!==b||from===to"),'same-nation sea route must retain physical port validation');

assert.ok(trade.includes('if(ap!==bp)return bp-ap'),'player domestic traffic must be prioritized over AI');
assert.ok(trade.includes("d.faction===0?(path.length>3?2:1)"),'player domestic road runs must get visible dot allocation');
assert.ok(trade.includes('const maxDots=coarsePointer3255?50:adaptiveDetail3255>=2?66:126'),'global dot budget must remain bounded');

assert.ok(trade.includes('function domesticSeaSupplyNetwork03713'),'domestic sea supply network cache missing');
assert.ok(trade.includes('function domesticSeaSupplyFloor03713'),'domestic sea supply floor missing');
assert.ok(trade.includes('if(net.endpoints[f]?.has(cell))return 64'),'domestic route endpoints must receive supply');
assert.ok(trade.includes('net.componentsByFaction[f]?.has(comp)?58:0'),'road network attached to own port must receive island supply');
assert.ok(trade.includes('return Math.max(base,domesticSeaSupplyFloor03713(f,cell))'),'domestic sea logistics must raise structure supply floor');
assert.ok(trade.includes('domesticSeaSupply:(f,cell)=>'),'domestic supply diagnostic API missing');
assert.ok(!trade.includes('setInterval(domestic'),'domestic logistics must not add a new timer');

assert.ok(index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>'),'visible version must be 0.37.13 or compatible successor');
assert.ok(about.includes("version:'0.37.13'"),'about history must include 0.37.13');

console.log('HEXATEGOS 0.37.13 domestic sea logistics + player traffic smoke: OK');
