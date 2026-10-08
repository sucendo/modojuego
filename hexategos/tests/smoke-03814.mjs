import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('js/map-icons-03812.js');
const html=read('index.html');
assert.doesNotThrow(()=>new Function(src),'icon map syntax');
assert.match(html,/v0\.38\.1\d<\/title>/);
assert.match(html,/js\/map-icons-03812\.js\?v=\d+/);
assert.ok(!src.includes('frame.historic'),'old blue historic-capital markers must be absent');

const land=Array(9).fill(1),centers=[],offsets=[0],edgeNbr=[];
for(let i=0;i<9;i++){
  centers.push((i+1)*1000,0,0);
  edgeNbr.push((i+1)%9,(i+2)%9);
  offsets.push(edgeNbr.length);
}
const L={n:9,land,centers,offsets,edgeNbr};
const events=[];
const ctx={
  center:[0,0],save(){},restore(){},translate(x,y){this.center=[x,y];events.push({event:'translate',x,y})},
  beginPath(){},closePath(){},moveTo(){},lineTo(){},arc(x,y,r){events.push({event:'arc',x:this.center[0],r})},
  ellipse(){},fill(){events.push({event:'fill',x:this.center[0],color:this.fillStyle})},
  stroke(){},scale(){},fillRect(){},strokeRect(){},fillText(){},strokeText(){},
  bezierCurveTo(){},quadraticCurveTo(){}
};
const window={HexategosProduction0388:{drawCandidates:()=>[].values(),sitesOnCell:()=>[]}};
const nations=[{color:'#b34f9c'},{color:'#31bb64'}];
const owner=Array(9).fill(0);owner[7]=1;owner[8]=1;
const cities=new Set([2,3,7]),ports=new Set(),industries=new Set();
const order=[];
const params=[
  'window','FACTIONS3230','owner6','capitals','activeFactionCount3230',
  'historicCapital3230','cities3212','ports3212','industries3212','zoom',
  'globeIconScale3249','drawGlobeCityIcon3249','drawGlobePortIcon3249',
  'drawGlobeIndustryIcon3249','drawGlobeCapitalIcon3249','drawInfrastructure3212',
  'ctx','loadLevel','MAX_GAME_LEVEL3233','projectVec','currentKey','vw','vh','console','order'
];
const args=[
  window,nations,owner,[3,7],2,[5,8],cities,ports,industries,8,()=>8,
  ()=>{},()=>{},()=>{},()=>{},
  ()=>{},ctx,()=>L,5,
  (x,y,z)=>[(x*32767/1000)*25+40,100,.95],
  5,1000,700,{info(){}},order
];
const setup='drawInfrastructure3212=function(){'+
  "order.push('roads');"+
  'drawGlobeCityIcon3249(115,100,2,8);'+
  'drawGlobeCityIcon3249(140,100,3,8);'+
  'drawGlobeCityIcon3249(240,100,7,8);'+
  'drawGlobeCapitalIcon3249(140,100,true,8);'+
  'drawGlobeCapitalIcon3249(240,100,true,8);'+
  '};'+src+
  'return {draw:drawInfrastructure3212,api:window.HexategosMapIcons03812};';
const boot=new Function(...params,setup);
const simulation=boot(...args);
simulation.draw(100,500,500,0);
assert.equal(order[0],'roads','capital must appear after road infrastructure');

const moved=events.filter(e=>e.event==='translate');
assert.equal(moved.length,5,'one regular city and two double-layer capital cities, no historic star');
assert.equal(moved.filter(e=>e.x===140).length,2,'player capital must stay centered, not appear as second offset marker');
assert.equal(moved.filter(e=>e.x===240).length,2,'AI capital must be single centered composite icon');
assert.equal(moved.filter(e=>e.x===115).length,1,'normal city must remain one symbol');
assert.equal(events.filter(e=>e.event==='translate'&&e.x===190).length,0,'historic star at old capital must not reappear');
const fills=events.filter(e=>e.event==='fill');
assert.ok(fills.some(e=>e.x===140&&e.color==='#b34f9c'),'national star backing missing for player');
assert.ok(fills.some(e=>e.x===240&&e.color==='#31bb64'),'national star backing missing for AI');
assert.ok(!fills.some(e=>e.color==='#b4becd'),'historic blue star should not be painted');

const arcs=events.filter(e=>e.event==='arc');
const cityRadius=Math.max(...arcs.filter(e=>e.x===115).map(e=>e.r));
const capitalRadius=Math.max(...arcs.filter(e=>e.x===140).map(e=>e.r));
assert.ok(capitalRadius>cityRadius*1.13,'capital city must be visibly larger');
assert.equal(simulation.api.metrics().capital,2,'both capitals should be rendered once');
assert.equal(simulation.api.metrics().city,1,'ordinary city should render independently');
console.log('HEXATEGOS 0.38.14: no historic blue star, centered capital city, national star color, increased size and AI parity: OK');
