import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('js/map-icons-03812.js'),production=read('js/production-0388.js');
const html=read('index.html');
assert.doesNotThrow(()=>new Function(src),'map icons syntax');
assert.match(html,/js\/map-icons-03812\.js\?v=03812/);
assert.ok(production.includes('HexategosMapIcons03812?.active'),'legacy productive emojis not disabled');
assert.ok(production.includes('drawCandidates:()=>sites.values()'),'specialized vector iterator missing');
const land=Array(9).fill(1);land[4]=-1;
const centers=Array(27).fill(0),offsets=[0],edgeNbr=[];
for(let i=0;i<9;i++){
  centers[i*3]=(i+1)*1000;
  const neighbors=i===3?[4,2,5,6,7,8]:[Math.max(0,i-1),Math.min(8,i+1)];
  edgeNbr.push(...neighbors);offsets.push(edgeNbr.length);
}
const L={land,centers,offsets,edgeNbr,n:9};
const ctxDraw=[],order=[];
const ctx={
  save(){},restore(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},
  arc(){},ellipse(){},stroke(){},fill(){},strokeRect(){},fillRect(){},
  bezierCurveTo(){},quadraticCurveTo(){},scale(){},strokeText(){},fillText(){},
  translate(x,y){ctxDraw.push([x,y]);order.push('icon')}
};
const owners=Array(9).fill(0),cities=new Set([3]),ports=new Set([3]),ind=new Set([3]);
const specialized=[{cell:3,kind:'gas',f:0}];
const ui={sitesOnCell:cell=>cell===3?specialized:[],drawCandidates:()=>specialized.values()};
const world={HexategosProduction0388:ui};
const names=['window','owner6','capitals','activeFactionCount3230','historicCapital3230',
  'cities3212','ports3212','industries3212','zoom','globeIconScale3249',
  'drawGlobeCityIcon3249','drawGlobePortIcon3249','drawGlobeIndustryIcon3249',
  'drawGlobeCapitalIcon3249','drawInfrastructure3212','ctx','loadLevel',
  'MAX_GAME_LEVEL3233','projectVec','currentKey','vw','vh','console'];
const params=[world,owners,[3],1,[],cities,ports,ind,10,()=>8,
  ()=>{},()=>{},()=>{},()=>{},()=>{},ctx,()=>L,5,
  (x,y,z,R,cx,cy)=>[100+(x*32767/1000-4)*35,100,.95],5,1000,700,
  {info(){}}];
const source='drawInfrastructure3212=function(R,cx,cy,now){'+
  "order.push('road');"+
  'if(zoom>2.15){'+
  'drawGlobeIndustryIcon3249(100,100,3,8);'+
  'drawGlobePortIcon3249(100,100,3,8);'+
  'drawGlobeCityIcon3249(100,100,3,8);'+
  '}'+
  '};'+src+
  'return {draw:drawInfrastructure3212,oldCapital:drawGlobeCapitalIcon3249,'+
  'setZoom:x=>zoom=x,api:window.HexategosMapIcons03812};';
const start=new Function(...names,'order',source);
const inst=start(...params,order);
inst.oldCapital(100,100,false,8);
assert.equal(ctxDraw.length,0,'legacy star must not cover roads before infrastructure');
inst.draw(100,100,100,0);
assert.equal(order[0],'road');
assert.equal(ctxDraw.length,5,'industry port city specialized capital markers expected');
const [industryPos,portPos,cityPos,gasPos,capitalPos]=ctxDraw;
assert.deepEqual(cityPos,[100,100],'city must be exactly centered');
assert.ok(portPos[0]>=118&&Math.abs(portPos[1]-100)<1,'port must face sea at coastal edge');
const keys=ctxDraw.map(p=>p.map(v=>v.toFixed(2)).join('/'));
assert.equal(new Set(keys).size,5,'infrastructure markers overlap');
assert.ok(order.indexOf('road')<order.lastIndexOf('icon'),'capital should be drawn after roads');
assert.equal(inst.api.metrics().capital,1);
assert.equal(inst.api.metrics().special,1);
const first=ctxDraw.length;
inst.setZoom(3.4);
inst.draw(100,100,100,0);
assert.equal(ctxDraw.length-first,1,'distant zoom must show city only');
assert.deepEqual(ctxDraw.at(-1),[100,100],'distant city must stay centered');
assert.equal(inst.api.metrics().port,0);
assert.equal(inst.api.metrics().special,0);
inst.setZoom(1.8);
const mid=ctxDraw.length;
inst.draw(100,100,100,0);
assert.equal(ctxDraw.length-mid,1,'very distant capital should appear as city, not star');
assert.deepEqual(ctxDraw.at(-1),[100,100]);
console.log('HEXATEGOS 0.38.12 city priority, shoreline port, road layering and vector styles: OK');
