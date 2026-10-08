import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const css=read('css/trade-logistics-0370.css');
const game=read('js/game.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

// Keep the existing supply map as the physical-logistics base.
assert.ok(game.includes('function supplyEdgeCost3253'),'legacy physical supply edge cost missing');
assert.ok(game.includes('function activateSeaLinks3253'),'legacy maritime logistics base missing');
assert.ok(game.includes('drawSupply3230=function(R,cx,cy)'),'existing supply map must exist');
assert.ok(trade.includes('const baseSupplyPct03721=supplyPct3220'),
  'material supply must wrap, not replace, physical logistics');

// Cached material coverage by road component.
assert.ok(trade.includes('resourceComponentCoverage03721=new Map()'),'component material cache missing');
assert.ok(trade.includes("const key=n.f+':'+n.comp"),'component cache must be faction-specific');
assert.ok(trade.includes('resourceComponentCoverage03721.set(key'),'component coverage build missing');
assert.ok(trade.includes('function materialCoverageForCell03721'),'cell material coverage resolver missing');
assert.ok(trade.includes('const exact=resourceNodes03720.get(cell)'),'exact logistics node must use exact stock');
assert.ok(trade.includes("resourceComponentCoverage03721.get(f+':'+comp)"),
  'road-connected cells must use local component material coverage');
assert.ok(trade.includes('return resourceNation03720[f].coverage.slice()'),
  'unattached cells need national material fallback');

// Material score and physical/material composition.
assert.ok(trade.includes('function materialSupplyScore03721'),'material supply score missing');
assert.ok(trade.includes('const w=[.30,.10,.27,.21,.12]'),'resource supply weights missing');
assert.ok(trade.includes('const bottleneck=Math.min('),'critical resource bottleneck missing');
assert.ok(trade.includes("if(logistic<=0||owner6[cell]!==0||!resourceNation03720[0])return logistic"),
  'physical disconnection must remain authoritative');
assert.ok(trade.includes("logistic*(.25+.75*detail.material/100)"),
  'material scarcity must progressively reduce usable supply');
assert.ok(trade.includes('Math.round(clamp('),'combined supply must remain bounded');

// Four-state map and selected breakdown.
assert.ok(trade.includes('RESOURCE_SUPPLY_COLORS03721'),'four-state supply colors missing');
assert.ok(trade.includes("return p>=75?'good':p>=55?'tension':p>=35?'low':'critical'"),
  'supply map thresholds missing');
assert.ok(trade.includes('Abastecido ≥75%')&&trade.includes('Tensión 55–74%')&&
          trade.includes('Bajo 35–54%')&&trade.includes('Crítico &lt;35%'),
  'four-state supply legend missing');
assert.ok(trade.includes('Suministro seleccionado'),'selected supply detail panel missing');
assert.ok(trade.includes('Logística física'),'physical logistics detail missing');
assert.ok(trade.includes('disponibilidad material'),'material availability detail missing');
assert.ok(trade.includes("RESOURCE_LABELS03720[i]"),'five-resource selected breakdown missing');
assert.ok(css.includes('.supplyResourceGrid03721'),'selected supply resource styles missing');

// Route depletion chain: active route transfer uses routeFactor, blocked route transfers none.
const transfer=trade.slice(trade.indexOf('function transferRouteResources03720'),trade.indexOf('function summarizeResources03720'));
assert.ok(transfer.includes('const k=routeFactor0370(r)'),'physical resource transfer must obey route operational factor');
assert.ok(transfer.includes('if(k<=0)return'),'blocked/suspended routes must move no resources');
assert.ok(transfer.includes('src.stock[i]-=amount;dst.stock[i]+=amount'),'active route must replenish remote stock');
assert.ok(trade.includes('n.stock[i]=Math.max(0,n.stock[i]-n.demand[i]*dt)'),
  'remote stocks must continue consuming when route stops');

// Military supply now consumes the combined percentage through the existing front hook.
assert.ok(game.includes('supply=src>=0?supplyPct3220(src):0'),
  'front logistics must read supplyPct3220 dynamically');
assert.ok(trade.includes('supplyPct3220=function(cell)'),
  'combined supply override missing');

// Performance and diagnostics.
assert.ok(trade.includes('materialSupply:(cell)=>materialSupplyDetail03721(Number(cell))'),
  'material supply API missing');
assert.ok(trade.includes('combinedSupply:(cell)=>supplyPct3220(Number(cell))'),
  'combined supply API missing');
assert.equal((trade.match(/setInterval\(/g)||[]).length,1,
  '0.37.21 must not add a new interval to trade logistics');
assert.ok(!trade.slice(trade.indexOf('function materialCoverageForCell03721'),trade.indexOf('function routeCargoText03720')).includes('findSeaPathCells3270'),
  'supply-map lookup must not pathfind');

assert.ok(index.includes('v0.37.21</title>'),'visible version must be 0.37.21');
assert.ok(about.includes("version:'0.37.21'"),'About must include 0.37.21');

console.log('HEXATEGOS 0.37.21 material supply map smoke: OK');
