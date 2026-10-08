import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/hex-inspector-03817.js'),css=read('css/hex-inspector-03817.css');
const html=read('index.html'),trade=read('js/trade-logistics-0370.js');
const production=read('js/production-0388.js');
assert.doesNotThrow(()=>new Function(js));
assert.match(html,/v0\.38\.1[789]<\/title>/);
assert.match(html,/js\/hex-inspector-03817\.js\?v=\d+/);
assert.match(html,/css\/hex-inspector-03817\.css\?v=03817/);
assert.match(html,/js\/trade-logistics-0370\.js\?v=\d+/);
assert.match(html,/js\/production-0388\.js\?v=\d+/);
assert.ok(css.includes('var(--hex-ui-scale'),'context fonts must follow Options');
assert.ok(css.includes('.ctxDetails03817'),'inspector must scroll independently of map');
assert.ok(js.includes('original.apply(this,arguments)'),'legacy context buttons and actions preserved');
assert.ok(js.includes('productionCargoDetail03817'),'port manufacturing imports/exports missing');
assert.ok(trade.includes('r.cargoDirection03720[i]=src===a?1:-1'),'route commodity direction missing');
assert.ok(production.includes('r.productionCargoDetail03817.push'),'industrial cargo direction missing');
assert.ok(!js.includes('setInterval(')&&!js.includes('requestAnimationFrame('),
  'inspector must not add continuous simulation work');

const root={scrollTop:0,classList:{add(){},remove(){}},insertBefore(){},addEventListener(){}};
const actions={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},replaceChildren(){},appendChild(){}};
let contents='';
const details={scrollTop:0};
const panel={id:null,className:'',hidden:false,
  set innerHTML(v){contents=v;details.scrollTop=0},get innerHTML(){return contents},
  querySelector:s=>s==='.ctxDetails03817'?details:null};
const doc={
  getElementById:id=>id==='contextMenu3244'?root:
    id==='ctxActions3244'?actions:null,
  createElement:tag=>tag==='div'?panel:{className:'',innerHTML:'',appendChild(){},children:[],dataset:{}}
};
const L={n:18,land:Array(18).fill(1)};
L.land[17]=-1;
const owner=Array(18).fill(0);
const cityLevels=new Uint8Array(18);cityLevels[3]=2;cityLevels[4]=1;
const industryLevels=new Uint8Array(18);industryLevels[3]=2;
const cities=new Set([3,4]),industries=new Set([3]),ports=new Set([3]);
let gameTime=1200, supplyLevel=90;
const sites=[{cell:3,f:0,kind:'gas',level:2,pct:60,output:12},{cell:3,f:0,kind:'refinery',level:1,pct:90,output:7}];
const route={id:20,type:'sea',status:'active',from:3,to:7,a:0,b:0,
  mode:'legal',cargo03720:[.2,0,.4,0,0],cargoDirection03720:[1,0,-1,0,0],
  productionCargoDetail03817:[{kind:'gas',rate:.15,direction:-1}]};
const tradeApi={
  geography:cell=>cell===4?{type:'desert',food:.15,raw:.22,fuel:.12}:
    {type:'plain',food:1.6,raw:1.1,fuel:1.2},
  combinedSupply:()=>supplyLevel,
  resourceNode:cell=>cell===3?{stock:[7,8,9,2,1],cap:[20,20,20,10,10]}:null,
  materialSupply:()=>({resourcePct:[70,65,40,60,20]}),
  routes:()=>[route],
  focusRoute:()=>{}
};
const window={
  HexategosTradeLogistics0370:tradeApi,
  HexategosProduction0388:{
    types:{gas:{name:'Pozo de gas',icon:'⛽',sector:'energy',group:'extract'},
      refinery:{name:'Refinería',icon:'🏭',sector:'manufacturing',group:'factory'}},
    sitesOnCell:cell=>cell===3?sites:[],
    sector:()=>80,setPct:()=>true,intermediates:()=>({})
  },
  HexategosStatecraft0380:{governmentCity:cell=>cities.has(cell)?
    {stability:80,nationalism:20,scarcity:15,supply:88,active:{invest:true}}:null}
};
const args=['document','window','renderContextDialog3244','positionContextDialog3244',
  'openContextDialog3244','loadLevel','MAX_GAME_LEVEL3233','owner6','cities3212',
  'cityLevel3230','industries3212','industryLevel3230','ports3212','capitals',
  'relations3220','campaignSeconds3230','factionName3230','supplyAt3230',
  'uiInteractionState3244','navalGroups3270','fleets3212','placeDisplayName3271','console'];
const state={contextData:null};
const vals=[doc,window,()=>{root.scrollTop=0},()=>{},()=>{},()=>L,8,owner,cities,cityLevels,
  industries,industryLevels,ports,[3],Array(18).fill(0),gameTime,
  f=>'Nación '+f,()=>supplyLevel,state,
  [{id3270:9,f:0,home:3,strength:22,order:'patrol',targetPort:-1}],[],
  cell=>'Hex '+cell,{warn(){},info(){}}];
const boot=new Function(...args,js+
  '\nreturn {api:window.HexategosHexInspector03817,render:renderContextDialog3244,setTime:t=>campaignSeconds3230=t};');
const sim=boot(...vals);
assert.equal(sim.api.version,'0.38.17');
const rural=sim.api.population(2),urban=sim.api.population(3);
assert.ok(urban.value>rural.value,'city must be more populated than empty rural hex');
assert.equal(sim.api.population(17),null,'ocean hex should not gain population');
const initial=urban.value;sim.setTime(11000);
assert.ok(sim.api.population(3).value>initial,'population should evolve with game time');
supplyLevel=10;
assert.ok(sim.api.population(3).value<urban.value*1.2,'supply scarcity should lower the urban population');
supplyLevel=90;
const city={kind:'cell',cell:3,owner:0,own:true,neutral:false,enemy:false,
  port:true,city:2,industry:2,fort:0,capital:true,geo:'Hex 3'};
state.contextData=city;
sim.render(city);
assert.ok(contents.includes('Población estimada'),'missing demographic summary');
assert.ok(contents.includes('Recursos del terreno'),'resource potential missing');
assert.ok(contents.includes('Gobierno y estabilidad'),'government values missing');
assert.ok(contents.includes('Industrias y controles de producción'),'industry summary missing');
assert.ok(contents.includes('Puerto, comercio y flotas'),'port section missing');
assert.ok(contents.includes('↑ Exporta: Alimentos'),'outbound sea cargo not identified');
assert.ok(contents.includes('↓ Importa: Energía'),'inbound fuel not identified');
assert.match(contents,/↓ Importa:[^<]*Pozo de gas/,'inbound manufactured cargo not identified');
assert.ok(contents.includes('Flota 9'),'naval fleet based in port missing');
assert.deepEqual(sim.api.tabsFor(city),['summary','industry','government','port']);
root.scrollTop=29;details.scrollTop=77;
sim.render(city);
assert.equal(root.scrollTop,29,'inspector outer scroll jumped when same cell refreshed');
assert.equal(details.scrollTop,77,'inspector inner scroll jumped when same cell refreshed');
const ruralHex={kind:'cell',cell:2,owner:0,own:true,city:0,industry:0,fort:0,port:false};
assert.deepEqual(sim.api.tabsFor(ruralHex),['summary','industry']);
sim.render(ruralHex);
assert.equal(root.scrollTop,0,'new hexagon must start at top');
assert.equal(details.scrollTop,0,'new hexagon details must start at top');
assert.ok(contents.includes('Sin administración urbana local.'));
console.log('HEXATEGOS 0.38.17 population, resources, manufacturing controls, supply, government, port imports/exports, fleet and Options font: OK');
