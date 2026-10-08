import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('js/production-0388.js'),com=read('js/systems-commerce-03815.js');
const html=read('index.html'),css=read('css/industry-catalog-03815.css');
assert.doesNotThrow(()=>new Function(src),'factory engine syntax');
assert.doesNotThrow(()=>new Function(com),'Commerce tab syntax');
assert.match(html,/v0\.38\.1\d<\/title>/);
assert.match(html,/js\/systems-commerce-03815\.js\?v=03815/);
assert.match(html,/css\/industry-catalog-03815\.css\?v=03815/);
assert.ok(src.includes("Nivel I · Industrias primarias")&&src.includes("Nivel V · Tecnologías futuras"),
  'unified level-based industry catalog not loaded');
assert.ok(com.includes("host.querySelector('.tradeManager03717')"),'real route manager must be reused');
assert.ok(com.includes('sysTab3220=')&&com.includes("tabs.insertBefore"),'Commerce must be its own Systems tab');

const owner=Array(35).fill(0),edges=[],offsets=[0];
for(let c=0;c<35;c++){edges.push((c+1)%35,(c+2)%35,(c+3)%35,(c+4)%35,(c+5)%35,(c+6)%35);offsets.push(edges.length)}
const storage=new Map();
const world={HexategosTradeLogistics0370:{
  geography:()=>({type:'plain',food:1.5,raw:1.6,fuel:1.8}),
  roadComponent:()=>1,resourceSummaryCached:()=>({coverage:[.4,.4,.3]})
}};
const names=['window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel',
  'MAX_GAME_LEVEL3233','campaignSeconds3230','started3230','activeFactionCount3230',
  'saveGame3212','loadGame3212','resetGame3230','renderSystems3220','buildClassicActions3246',
  'handleContextAction3244','drawInfrastructure3212','document','modalBody3244','console',
  'aiNationalSamples3275','ports3212','localStorage','capitals','industryLevel3230','industries3212'];
const industryLevels=new Uint8Array(35);industryLevels[7]=2;
const args=[world,[{role:'growth'}],owner,[0],6000,()=>({n:35,offsets,edgeNbr:edges}),
  0,100,true,1,()=>{},()=>{},()=>{},()=>{},()=>[],()=>{},()=>{},
  {getElementById:()=>null},null,{info(){},warn(){}},[[]],new Set(),
  {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),
    removeItem:k=>storage.delete(k)},[0],industryLevels,new Set([7])];
const get=new Function(...names,src+
  '\nreturn {api:window.HexategosProduction0388,save:saveGame3212,load:loadGame3212,reset:resetGame3230};');
const {api,save,load,reset}=get(...args);
for(const kind of ['civilian','machinery','arms','textile','chemical','electronics','thermal'])
  assert.ok(api.types[kind],kind+' industrial type missing');
for(const name of ['Central nuclear','Industria aeronáutica','Industria de armamento nuclear','Arsenal de misiles'])
  assert.ok(api.futureIndustries().some(t=>t.name===name),'future research preview missing: '+name);
assert.equal(api.availability(0,2,'nuclear').ok,false,'future nuclear industry must not be built prematurely');

const nodes=new Map(Array.from({length:35},(_,c)=>[c,{
  cell:c,f:0,comp:1,stock:[0,0,0,0,0],cap:[220,220,220,220,220]
}]));
assert.ok(api.build(0,7,'steel',false));
assert.ok(api.build(0,8,'civilian',false));
api.tick({nodes,routes:[],dt:4});
assert.equal(nodes.get(8).stock[3],0,'civilian factory produced without steel or lumber');

const constructions=[
 [1,'iron'],[2,'timber'],[3,'gas'],[4,'copper'],[5,'crops'],
 [6,'livestock'],[10,'oil'],[11,'refinery'],[12,'gasplant'],
 [13,'sawmill'],[14,'smelter'],[15,'foodplant'],[16,'textile'],
 [17,'machinery'],[18,'arms'],[19,'chemical'],[20,'electronics'],[9,'thermal']
];
for(const [cell,type] of constructions)
  assert.ok(api.build(0,cell,type,false),'construction failed '+type);
for(let i=0;i<18;i++)api.tick({nodes,routes:[],dt:4});
const station=api.sitesOnCell(9).find(s=>s.kind==='thermal');
const steel=api.sitesOnCell(7).find(s=>s.kind==='steel');
const gas=api.sitesOnCell(12).find(s=>s.kind==='gasplant');
assert.ok(station.output>0,'power station did not generate electricity from processed fuel');
assert.ok(steel.output>0&&gas.output>0,'primary conversion failed');
assert.ok(nodes.get(8).stock[3]>0,'civilian manufacturing not receiving processed materials');
assert.ok(nodes.get(17).stock[3]>0,'machinery not receiving steel/copper');
assert.ok(nodes.get(18).stock[4]>0,'military production not supplying material stocks');
assert.ok(nodes.get(16).stock[3]>0,'textile manufacturing not operating');
assert.ok(nodes.get(19).stock[3]>0,'chemical factory not producing');
assert.ok(nodes.get(20).stock[3]>0,'electronics not using copper/steel');
assert.ok(api.legacyManufacturingFactor(0)<1,'legacy abstract production did not taper');
save();
assert.ok(JSON.parse(storage.get('hexategos.production.0388')).sites.length>=18);
reset(false);
assert.equal(api.sites().length,0);
load();
assert.ok(api.sites().some(s=>s.kind==='arms'),'new recipes lost on saved-game load');
assert.ok(api.sites().some(s=>s.kind==='thermal'),'energy plant lost on saved-game load');
assert.ok(api.validate().ok);
// Commerce reutiliza el gestor real de rutas y no mezcla su listado con Economía.
const makeElement=(name='div')=>{
  const el={name,children:[],dataset:{},innerHTML:'',classList:{toggle(){}},
    setAttribute(){},removeAttribute(){},addEventListener(){}};
  el.appendChild=function(child){
    child.remove?.();this.children.push(child);child.parent=this;return child;
  };
  el.insertBefore=function(child,next){
    child.remove?.();const i=this.children.indexOf(next);
    if(i<0)return this.appendChild(child);
    this.children.splice(i,0,child);child.parent=this;return child;
  };
  el.replaceChildren=function(...children){
    for(const old of this.children)old.parent=null;
    this.children=[];
    for(const child of children)this.appendChild(child);
  };
  el.remove=function(){
    if(!this.parent)return;const i=this.parent.children.indexOf(this);
    if(i>=0)this.parent.children.splice(i,1);this.parent=null;
  };
  return el;
};
const tabs=makeElement('tabs'),economyButton=makeElement('button');
economyButton.dataset.tab='eco';tabs.appendChild(economyButton);
tabs.querySelector=selector=>selector.includes('commerce')?
  tabs.children.find(b=>b.dataset.tab==='commerce'):
  selector.includes('eco')?economyButton:null;
const panel=makeElement('panel'),commerceHost=makeElement('host');
panel.querySelector=selector=>selector==='.sysTabs3213'?tabs:
  selector.includes('commerce')?tabs.querySelector(selector):null;
panel.querySelectorAll=()=>tabs.children;
commerceHost.querySelector=selector=>selector==='.tradeManager03717'?
  commerceHost.children.find(x=>x.trade===true):
  selector.includes('nth-child(2)')?commerceHost.children[1]:null;
const doc={getElementById:id=>id==='systemsPanel3213'?panel:
  id==='sysContent3213'?commerceHost:null,createElement:tag=>makeElement(tag)};
const harness=
  "const document=doc;let sysTab3220='eco';"+
  "function renderSystems3220(){"+
  "const h=doc.getElementById('sysContent3213');"+
  "const summary=makeElement('summary');"+
  "summary.innerHTML='<br>⇄ Socios comerciales: <b>2</b><br>Comercio: <b>+4</b>';"+
  "const production=makeElement('production');"+
  "const routes=makeElement('routes');routes.trade=true;"+
  "h.replaceChildren(summary,production,routes);return 'rendered'}"+
  com+
  "return {renderSystems3220,choose:tab=>{sysTab3220=tab;renderSystems3220()},current:()=>sysTab3220};";
const factoryCommerce=new Function('doc','window','makeElement',harness);
const tradeWindow={};
const commerceRuntime=factoryCommerce(doc,tradeWindow,makeElement);
assert.ok(tradeWindow.HexategosSystemsCommerce03815.available(),'Commerce tab not created');
commerceRuntime.choose('commerce');
assert.equal(commerceRuntime.current(),'commerce');
assert.equal(commerceHost.children.length,2,'Commerce must show intro and original route manager only');
assert.ok(commerceHost.children[1].trade,'real route manager not retained');
commerceRuntime.choose('eco');
assert.equal(commerceHost.children.length,2,'Economy must retain summary and production');
assert.ok(!commerceHost.children.some(el=>el.trade),'route cards duplicated in Economy');

console.log('HEXATEGOS 0.38.15 manufacturing chains, electricity, future tech locks and saves: OK');
