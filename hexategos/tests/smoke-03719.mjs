import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const visuals=read('js/national-visuals-0378.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');
assert.doesNotThrow(()=>new Function(visuals),'national visuals must parse');

// Patrol routes: internal only, never drawn for player or AI.
assert.ok(visuals.includes("if(!g||g.order==='patrol')return null"),
  'all patrol routes must be hidden regardless of faction');
assert.ok(trade.includes("if(g.order!=='patrol'||!Array.isArray(g.route)||!g.route.length)continue"),
  'legacy fleet renderer must also suppress patrol route arrays');

// Patrol must be a guaranteed closed cycle based at its home port.
assert.ok(trade.includes('function buildLocalPatrolRoute03719'),'closed patrol builder missing');
assert.ok(trade.includes('if(homeSea<0||g.cell!==homeSea)return false'),
  'patrol must only start from the home-port sea exit');
assert.ok(trade.includes('const route=outbound.concat(outbound.slice(0,-1).reverse())'),
  'patrol return must mirror outbound path');
assert.ok(trade.includes('route[0]!==homeSea||route[route.length-1]!==homeSea'),
  'patrol cycle must verify exact same start/end sea exit');
assert.ok(trade.includes('g._patrolPort03719=g.home'),'patrol must retain its home-port anchor');
assert.ok(trade.includes('if(g.route&&g.route.length)return'),
  'active patrol cycle must not be retargeted mid-route');

// Visual movement must be continuous across ticks.
assert.ok(visuals.includes('const NAVAL_VISUAL_STEP_MS03719=1400'),
  'visual duration must match 1.4 s naval tick');
assert.ok(visuals.includes('function visualVector03719'),'continuous visual-vector resolver missing');
assert.ok(visuals.includes('const visualBefore=visualVector03719(g,now,C).v'),
  'new movement segment must start from current rendered position');
assert.ok(visuals.includes('g._visualVecPath03719=vecPath'),
  'vector interpolation path missing');
assert.ok(visuals.includes('return {p:projectVec(v[0],v[1],v[2],R,cx,cy),moving:vis.moving}'),
  'fleet rendering must use continuous interpolated vector');

// Visually start/end at actual port while simulation remains on water.
assert.ok(visuals.includes("g?.order==='patrol'")&&visuals.includes('navalGroupAtHome3270(g)'),
  'idle patrol must visually anchor to home port');
assert.ok(visuals.includes('const patrolFinished=returningPatrol'),
  'patrol completion detection missing');
assert.ok(visuals.includes('const pv=cellVector03719(homePort,C)'),
  'completed patrol must append actual port position');
assert.ok(visuals.includes('g._patrolAwaitingNext03719=true'),
  'completed patrol must enter short port dwell');
assert.ok(visuals.includes("patrolRoutesHidden:true")&&visuals.includes("continuousVisualAnchor:true")&&visuals.includes("patrolPortAnchors:true"),
  'public diagnostics must expose patrol visual guarantees');

// Performance: no additional interval and no patrol A* return.
assert.ok(!visuals.includes('setInterval('),'visual layer must not add a periodic timer');
const builder=trade.slice(trade.indexOf('function buildLocalPatrolRoute03719'),trade.indexOf('function startInterceptExcursion0371'));
assert.ok(!builder.includes('findSeaPathCells3270'),'patrol return must not add A* pathfinding');

assert.ok(versionAtLeast(index,'0.37.19'),'visible game version must be 0.37.19 or newer');
assert.ok(about.includes("version:'0.37.19'"),'About must include 0.37.19');

console.log('HEXATEGOS 0.37.19 closed smooth naval patrol smoke: OK');
