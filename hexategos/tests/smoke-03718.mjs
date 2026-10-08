import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

assert.ok(trade.includes('function showTradeRouteFocusBar03718'),'route focus bar helper missing');
assert.ok(trade.includes("btn.textContent='Salir'"),'focus bar must expose Salir');
assert.ok(trade.includes("interactionBar3244.classList.add('show3244')"),'focus bar must be visible');
assert.ok(trade.includes('function hideTradeRouteFocusBar03718'),'focus bar cleanup helper missing');
assert.ok(trade.includes("btn.textContent='Cancelar'"),'generic cancel label must be restored');
assert.ok(trade.includes("document.getElementById('interactionCancel3244')?.addEventListener('click'"),'focus exit listener missing');
assert.ok(trade.includes('stopImmediatePropagation'),'focus exit must intercept generic destination cancel handler');
assert.ok(trade.includes('clearTradeRouteFocus03717(true)'),'Salir must clear only route focus');

const ser=trade.slice(trade.indexOf('function serialize0370'),trade.indexOf('function restore0370'));
assert.ok(ser.includes('routes:routes.filter'),'commercial routes must remain serialized');
assert.ok(!ser.includes('focusedTradeRoute03717'),'visual focus must not be serialized');
assert.ok(trade.includes("localStorage.setItem(SAVE_KEY,JSON.stringify(serialize0370()))"),'trade routes must persist in local storage');
assert.ok(trade.includes('file.payload.tradeLogistics0370=serialize0370()'),'trade routes must persist in portable saves');
assert.ok(trade.includes('restore0370(restoredPortable)'),'portable saves must restore trade routes');

assert.ok(index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>')||index.includes('v0.37.20</title>')||index.includes('v0.37.21</title>'),'visible version must be 0.37.18 or compatible successor');
assert.ok(about.includes("version:'0.37.18'"),'about history must include 0.37.18');

console.log('HEXATEGOS 0.37.18 route-view exit and persistence smoke: OK');
