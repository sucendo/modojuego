import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const visuals=read('js/national-visuals-0378.js');
const css=read('css/trade-logistics-0370.css');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');
assert.doesNotThrow(()=>new Function(visuals),'national visuals must parse');

// Five physical resources.
assert.ok(trade.includes("RESOURCE_KEYS03720=['food','raw','fuel','goods','military']"),
  'five material resource keys missing');
assert.ok(trade.includes("RESOURCE_LABELS03720=['Alimentos','Materias primas','Energía/combustible','Bienes industriales','Material militar']"),
  'resource labels missing');

// Sparse node inventory, never per hex.
assert.ok(trade.includes('resourceNodes03720=new Map()'),'sparse material-node map missing');
assert.ok(trade.includes('function resourceNodeProfile03720'),'resource node profile missing');
assert.ok(trade.includes("kinds.push('capital')")&&trade.includes("kinds.push('city')")&&
          trade.includes("kinds.push('industry')")&&trade.includes("kinds.push('port')"),
  'capital/city/industry/port resource nodes missing');
assert.ok(trade.includes('const territory=Math.max(1,snap.territory[f]||1)'),
  'territorial primary production missing');

// Production, consumption and industrial conversion.
assert.ok(trade.includes('industryInput=n.ind?clamp(Math.min(rawRatio/.34,fuelRatio/.30)'),
  'industry must depend on raw materials and fuel');
assert.ok(trade.includes("if(i===3&&n.ind)production+=.105*n.ind*industryInput"),
  'industrial goods production missing');
assert.ok(trade.includes("if(i===4&&n.ind)production+=.046*n.ind*industryInput"),
  'military material production missing');
assert.ok(trade.includes('n.stock[i]=Math.max(0,n.stock[i]-n.demand[i]*dt)'),
  'material consumption missing');

// Physical logistics.
assert.ok(trade.includes('function redistributeRoadResources03720'),'road-stock redistribution missing');
assert.ok(trade.includes("const key=n.f+':'+n.comp"),'road redistribution must respect faction and component');
assert.ok(trade.includes('function transferRouteResources03720'),'physical route transfer missing');
assert.ok(trade.includes('src.stock[i]-=amount;dst.stock[i]+=amount'),
  'route must actually move stock between nodes');
assert.ok(trade.includes('r.cargo03720[i]=amount/Math.max(.1,dt)'),
  'route cargo by resource missing');
assert.ok(trade.includes('r.materialFactor03720=clamp(.45+total/Math.max(.08,perSec)*.70,.45,1.16)'),
  'route material throughput must influence value');
assert.ok(trade.includes('resourceTick03720(false)'),'material simulation must run inside existing trade tick');

// Economy and recruitment consequences.
assert.ok(trade.includes('s.economyFactor=clamp'),'national material economy factor missing');
assert.ok(trade.includes('s.recruitFactor=clamp'),'national material recruitment factor missing');
assert.ok(trade.includes('const baseTerritorialEconomy03720=territorialEconomy3261'),
  'territorial economy integration missing');
assert.ok(trade.includes('materialEconomyFactor:s.economyFactor'),'economic material result missing');
assert.ok(trade.includes('materialRecruitFactor:s.recruitFactor'),'recruitment material result missing');

// UI and route intensity.
assert.ok(trade.includes('function routeCargoText03720'),'route cargo text missing');
assert.ok(trade.includes("Carga: "),'route manager must display real cargo');
assert.ok(trade.includes('▦ Economía material'),'material economy dashboard missing');
assert.ok(trade.includes('Flujo físico de mercancías'),'physical flow metric missing');
assert.ok(trade.includes('const intensity=Number.isFinite(r.cargoTotal03720)?r.cargoTotal03720'),
  'commercial dots must use real cargo intensity');
assert.ok(css.includes('.resourceGrid03720'),'material stock grid styles missing');
assert.ok(css.includes('.tradeCargo03720'),'route cargo styles missing');

// Save compatibility/persistence.
assert.ok(trade.includes('version:2,nextRouteId'),'trade save version 2 missing');
assert.ok(trade.includes('resources03720:{'),'material save payload missing');
assert.ok(trade.includes('playerNodes:[...resourceNodes03720.values()]'),
  'player node stocks must persist');
assert.ok(trade.includes('nationCoverage:resourceNation03720.map'),
  'AI/national material coverage must persist');
assert.ok(trade.includes('restoredResources03720=data.resources03720'),
  'material restore must be backward compatible');

// Patrols visibly move and cannot remain stuck on stale Infinity.
assert.ok(trade.includes('for(let step=0;step<9;step++)'),'patrol excursion should be slightly larger');
assert.ok(trade.includes("!g._patrolAwaitingNext03719&&!Number.isFinite(g.patrolNext0371)"),
  'stale patrol Infinity recovery missing');
assert.ok(trade.includes("if(order==='patrol'){g.patrolNext0371=0;g._patrolAwaitingNext03719=false}"),
  'player patrol order must arm a sortie immediately');
assert.ok(!trade.includes('buildLocalPatrolRoute0371(g,nowCampaign)'),
  'obsolete patrol builder reference must be removed');
assert.ok(visuals.includes("const r=(zoom>32?4.65:4.05)+Math.min(1.20,Math.max(0,g.strength)/24)"),
  'fleet triangle must be slightly larger');
assert.ok(visuals.includes("if(!g||g.order==='patrol')return null"),
  'patrol route line must remain hidden for all fleets');

// Performance guardrails.
assert.equal((trade.match(/setInterval\(/g)||[]).length,1,
  'material economy must not add a second interval');
assert.ok(!trade.slice(trade.indexOf('function transferRouteResources03720'),trade.indexOf('function summarizeResources03720')).includes('findSeaPathCells3270'),
  'resource transfer must not pathfind per cargo type');

assert.ok(index.includes('v0.37.20</title>'),'visible version must be 0.37.20');
assert.ok(about.includes("version:'0.37.20'"),'About must include 0.37.20');

console.log('HEXATEGOS 0.37.20 material economy + active patrols smoke: OK');
