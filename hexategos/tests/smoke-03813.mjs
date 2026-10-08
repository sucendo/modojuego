import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('js/map-icons-03812.js');
const html=read('index.html'),history=read('js/about-0351.js');
assert.doesNotThrow(()=>new Function(source),'icon renderer syntax');
assert.match(html,/v0\.38\.13<\/title>/,'version number');
assert.match(html,/js\/map-icons-03812\.js\?v=03813/,'browser must reload icon styling');
assert.ok(history.includes("version:'0.38.13'"),'missing changelog version');

const start=source.indexOf('  const COLORS=');
const end=source.indexOf('  const production=',start);
const sizeStart=source.indexOf('  function radius()');
const sizeEnd=source.indexOf('  function centerPoint(',sizeStart);
const badgeStart=source.indexOf('  function badge(');
const badgeEnd=source.indexOf('  function landIcon(',badgeStart);
assert.ok(start>0&&end>start&&sizeStart>0&&badgeStart>0,'renderer source extraction');
const palette=source.slice(start,end),radiusFn=source.slice(sizeStart,sizeEnd);
const badgeFn=source.slice(badgeStart,badgeEnd);
const fills=[],ctx={};
for(const method of ['save','restore','translate','beginPath','arc','fill',
  'stroke','scale','moveTo','lineTo','closePath','strokeRect','fillRect',
  'bezierCurveTo','quadraticCurveTo','ellipse','strokeText','fillText']){
    ctx[method]=()=>{};
  }
ctx.fill=function(){fills.push(this.fillStyle)};
const run=new Function('ctx','finite','globeIconScale3249',
  palette+radiusFn+badgeFn+'return {COLORS,radius,badge}');
const {COLORS,radius,badge}=run(ctx,Number.isFinite,()=>8.0);
const types=['city','capital','historic','port','industry','oil','gas',
  'iron','copper','quarry','timber','crops','livestock',
  'refinery','gasplant','steel','smelter','sawmill','cement','foodplant'];
assert.equal(Object.keys(COLORS).length,types.length,'unexpected missing or extra types');
assert.equal(new Set(types.map(type=>COLORS[type])).size,types.length,
  'all background fills should have unique colors');
assert.ok(radius()>=9.3&&radius()<=11.2,'symbols should be enlarged');
for(const type of types){
  fills.length=0;
  badge(100,100,type,1);
  assert.ok(fills.length>=2,type+' circle not drawn');
  assert.equal(fills[1],COLORS[type],type+' background must be filled in own color');
  assert.equal(ctx.strokeStyle,'#263440',type+' needs original dark icon style');
  assert.equal(ctx.fillStyle,'#263440',type+' interior glyph color must be consistent');
  assert.ok(fills[0].startsWith('rgba(2,10,17'),type+' missing dark outer halo');
}
assert.notEqual(COLORS.oil,COLORS.gas);
assert.notEqual(COLORS.city,COLORS.port);
assert.notEqual(COLORS.industry,COLORS.refinery);
console.log('HEXATEGOS 0.38.13 original circular background, 20 unique type colors and larger icons: OK');
