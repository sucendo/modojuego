import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL('../'+path, import.meta.url),'utf8');
const map = read('js/map-icons-03812.js');
const production = read('js/production-0388.js');
const html = read('index.html');
assert.doesNotThrow(()=>new Function(map),'vector map icons syntax');
assert.match(production,/coal:\s*\{name:'Mina de carbón',\s*icon:'⛏'/);
assert.match(html,/js\/map-icons-03812\.js\?v=\d+/);
const palette=map.match(/  const COLORS=\{[\s\S]*?\n  \};/)?.[0];
const begin=map.indexOf('  function badge(x,y,type,scale=1){');
const end=map.indexOf('  // Capital =',begin);
assert.ok(palette&&begin>0&&end>begin,'vector badge source missing');
const symbols=[];
let lines=0,colors=[];
const ctx={
  save(){},restore(){},translate(){},scale(){},beginPath(){},closePath(){},
  arc(){},fill(){colors.push(this.fillStyle)},stroke(){},moveTo(){},lineTo(){lines++},
  fillRect(){},strokeRect(){},bezierCurveTo(){},quadraticCurveTo(){},
  ellipse(){},fillText(v){symbols.push(v)}
};
const render=new Function('ctx',palette+
  "\nconst finite=Number.isFinite, radius=()=>9;\n"+
  map.slice(begin,end)+'\nreturn badge;')(ctx);
render(20,30,'coal');
assert.deepEqual(symbols,['C'],'coal needs a recognizable C on the mining pictogram');
assert.ok(lines>=6,'coal must have the same pickaxe geometry as iron and copper');
assert.ok(colors.includes('#92989c'),'coal has its own stone-grey badge color');
symbols.length=0;lines=0;
render(20,30,'iron');assert.deepEqual(symbols,['Fe']);
assert.ok(lines>=6,'iron mining icon must keep original geometry');
symbols.length=0;lines=0;
render(20,30,'copper');assert.deepEqual(symbols,['Cu']);
assert.ok(lines>=6,'copper mining icon must keep original geometry');
console.log('HEXATEGOS 0.38.26: coal mine rendered in same vector style as iron/copper, separate charcoal color');
