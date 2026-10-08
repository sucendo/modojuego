import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const visuals=read('js/national-visuals-0378.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');
assert.doesNotThrow(()=>new Function(visuals),'national visuals must parse');

assert.ok(trade.includes('todo transporte COMERCIAL es un punto'),'commercial point convention missing');
assert.ok(trade.includes("ctx.beginPath();ctx.arc(p[0],p[1],rr,0,Math.PI*2)"),'commercial transports must render as circular points');
assert.ok(trade.includes("r.type==='sea'?(zoom>32?4.40:3.70):(zoom>32?3.20:2.70)"),'commercial point sizes missing');
assert.ok(!trade.includes('ctx.moveTo(p[0],p[1]-rr);'),'commercial sea traffic must not use triangular marker');

assert.ok(visuals.includes('ctx.lineTo(p[0]+r*.82,p[1])'),'troop transport diamond right vertex missing');
assert.ok(visuals.includes('ctx.lineTo(p[0],p[1]+r)'),'troop transport diamond bottom vertex missing');
assert.ok(visuals.includes('ctx.lineTo(p[0]-r*.82,p[1])'),'troop transport diamond left vertex missing');

assert.ok(visuals.includes('ctx.lineTo(p[0]+r*.85,p[1]+r*.65)'),'military fleet triangle right vertex missing');
assert.ok(visuals.includes('ctx.lineTo(p[0]-r*.85,p[1]+r*.65)'),'military fleet triangle left vertex missing');

assert.ok(index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>')||index.includes('v0.37.20</title>')||index.includes('v0.37.21</title>'),'visible version must be 0.37.12');
assert.ok(about.includes("version:'0.37.12'"),'about history must include 0.37.12');

console.log('HEXATEGOS 0.37.12 transport symbols smoke: OK');
