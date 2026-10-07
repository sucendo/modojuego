import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const visuals=read('js/national-visuals-0378.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade-logistics-0370.js must parse');
assert.doesNotThrow(()=>new Function(visuals),'national-visuals-0378.js must parse');

assert.ok(trade.includes('const TRAFFIC_ZOOM=25'),'traffic dots must start at zoom 25');
assert.ok(trade.includes('faction:g.f')||trade.includes('faction:runFaction'),'domestic traffic must retain faction identity');
assert.ok(trade.includes('ctx.fillStyle=factionTrafficColor0378(d.faction)'),'domestic dots must use faction color');
assert.ok(trade.includes('function routeDotFaction0378'),'international route dots must resolve a nation');
assert.ok(trade.includes("ctx.strokeStyle='rgba(99,206,226,.30)'"),'sea trade route must keep light-blue dashed style');
assert.ok(trade.includes("if(zoom>3.15)"),'sea route line must remain visible before zoom 25');
assert.ok(!trade.includes("if(r.type==='sea'&&(r.a===0||r.b===0)&&zoom>3.15)"),
  'AI-to-AI sea routes must no longer be player-only');
assert.ok(trade.includes('todo transporte COMERCIAL es un punto')&&trade.includes("ctx.beginPath();ctx.arc(p[0],p[1],rr,0,Math.PI*2)"),'sea commerce must render as a commercial point');

assert.ok(visuals.includes("const BUILD='0.37.8'"),'national visuals build must be 0.37.8');
assert.ok(visuals.includes('function factionColor0378'),'faction color resolver missing');
assert.ok(visuals.includes('drawTransportColor0378'),'transport recolor layer missing');
assert.ok(visuals.includes('drawNavalGroupsColor0378'),'military fleet recolor layer missing');
assert.ok(visuals.includes('drawBlueSeaPath0378')&&visuals.includes("rgba(99,206,226,'+alpha+')"),'naval route must use light-blue dashed style');
assert.ok(visuals.includes("if(g.order==='patrol')return null"),'patrol route must be completely hidden');
assert.ok(visuals.includes('const NAVAL_MIN_ZOOM0378=15'),'military fleets must start at zoom 15');
assert.ok(visuals.includes('const NAVAL_VISUAL_STEP_MS0378=1320'),'smooth naval interpolation duration missing');
assert.ok(visuals.includes('const baseNavalAdvance0378=navalAdvanceGroup3270'),'naval movement interpolation hook missing');
assert.ok(visuals.includes('_visualSegment0378'),'fleet visual segment interpolation state missing');
assert.ok(visuals.includes('navalVisualPosition0378'),'continuous naval position renderer missing');
assert.ok(visuals.includes('if(animate)needsRender=true'),'moving fleets must request continuous rendering');
assert.ok(visuals.includes('trafficMinZoom:TRAFFIC_MIN_ZOOM0378'),'public visual status must expose zoom 25');
assert.ok(visuals.includes('navalMinZoom:NAVAL_MIN_ZOOM0378'),'public visual status must expose zoom 15');
assert.ok(!visuals.includes('setInterval('),'0.37.8 must not add another periodic timer');

assert.ok(index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>'),'visible version must be 0.37.8 or compatible successor');
assert.ok(index.indexOf('js/national-visuals-0378.js')>index.indexOf('js/trade-geopolitics-0377.js'),
  '0.37.8 must load after trade geopolitics');
assert.ok(about.includes("version:'0.37.8'"),'about history must include 0.37.8');

console.log('HEXATEGOS 0.37.8 national traffic/naval visuals smoke: OK');
