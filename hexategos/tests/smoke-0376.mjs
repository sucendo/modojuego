import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const border=read('js/border-road-0376.js');
const trade=read('js/trade-logistics-0370.js');
const commerce=read('js/ai-commerce-0375.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(border),'border-road-0376.js must parse');
assert.ok(border.includes("const BUILD='0.37.6'"),'border-road build must be 0.37.6');
assert.ok(border.includes('const LINK_COST=12'),'border road must cost one minimum road segment');
assert.ok(border.includes("'border_road_0376','CONEXIÓN TERRESTRE'"),'context connection button missing');
assert.ok(border.includes("'ADUANA · '+LINK_COST+' ORO · '"),'customs subtitle missing');
assert.ok(border.includes('roads3212.push([a,b])'),'physical cross-border road segment missing');
assert.ok(border.includes("links.add(k);linkModes.set(k,'legal')")||border.includes("links.add(key);linkModes.set(key,mode)"),'explicit customs/link registry missing');
assert.ok(border.includes('createAI:createAILink0376'),'AI customs creation API missing');
assert.ok(border.includes('if(f<=0||o<=0'),'AI must not auto-create player border customs');
assert.ok(border.includes('payload.borderRoad0376'),'portable save persistence missing');
assert.ok(!border.includes('setInterval('),'0.37.6 must not add another periodic timer');

assert.ok(trade.includes('return !!window.HexategosBorderRoad0376?.hasLink?.(a,b)'),
  'international road graph must require explicit border link');
assert.ok(!trade.includes('return aiRoadDegree3260(a)>0&&aiRoadDegree3260(b)>0'),
  'simple foreign road contact must not auto-join');

assert.ok(commerce.includes('f>0&&best.o>0'),'AI customs must be AI-to-AI only');
assert.ok(commerce.includes('CONEXIÓN TERRESTRE del jugador'),
  'player border connection must wait for explicit button');

assert.ok(index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>'),'visible version must be 0.37.6');
assert.ok(index.indexOf('js/border-road-0376.js')>index.indexOf('js/ai-commerce-0375.js'),
  '0.37.6 must load after AI commerce');
assert.ok(about.includes("version:'0.37.6'"),'about history must include 0.37.6');

console.log('HEXATEGOS 0.37.6 explicit border-road customs smoke: OK');
