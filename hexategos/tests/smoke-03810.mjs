import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/production-0388.js');
const css=read('css/production-0388.css');
const html=read('index.html');
assert.doesNotThrow(()=>new Function(js),'productive module syntax');
assert.ok(css.includes('.industryChoice0388'),'unified dialog colors missing');
assert.ok(!css.includes('color:#112c3d!important'),'dialog text contrast regression');
const start=js.indexOf('  function industryContext0388(');
const end=js.indexOf('  // Distribución de símbolos por hexágono:',start);
assert.ok(start>0&&end>start,'new unified industry menu missing');
const ui=js.slice(start,end);
assert.ok(ui.includes('closeModal3244();'),'normal modal close missing');

const mapOwner=Array(16).fill(0),sites=new Map(),types={
  gas:{name:'Pozo de gas',icon:'🔥',group:'extract',cost:100},
  gasplant:{name:'Planta de gas',icon:'🏭',group:'factory',cost:140}
};
const listeners=(name)=>({
  innerHTML:'',hooks:{},addEventListener(type,fn){this.hooks[type]=fn},
  fire(type,data){this.hooks[type]?.(data)}
});
const body=listeners('body'),actionsPanel=listeners('actions');
const overlay={classList:{set:new Set(),add(x){this.set.add(x)},remove(x){this.set.delete(x)},contains(x){return this.set.has(x)}},
  setAttribute(k,v){this[k]=v}};
const title={textContent:''};
const st={contextDialog:'open',contextData:{kind:'cell',cell:8,own:true},availableActions:[],modal:null,selectedCell:-1};
const industries=new Set();const levels=Array(16).fill(0);let closeCount=0,buildCount=0;
const args=[
 'owner6','uiInteractionState3244','cellContext3244','canIndustry3244',
 'closeContextDialog3244','closeModal3244','modal3244','modalTitle3244',
 'modalBody3244','modalActions3244','buildClassicActions3246','classicAction3246',
 'handleContextAction3244','sites','TYPES','gold3212','MAX_SITES',
 'MAX_PER_NATION','MAX_PER_CELL','MAX_PLAYER_SITES','sitesOnCell','availability','countNation','potential','esc','placeDisplayName3271',
 'build','saveGame3212','updateUI3230','sysTab3220','renderSystems3220',
 'selected','MAX_GAME_LEVEL3233','contextBuildPermit3282',
 'industryLevel3230','industries3212','build3212','performance','toast',
 'needsRender'
];
const value=[
 mapOwner,st,cell=>({kind:'cell',cell,own:true,industry:levels[cell]}),
 c=>c.own&&c.industry<3,()=>{st.contextData=null;st.contextDialog=null},
 ()=>{closeCount++;st.modal=null;overlay.classList.remove('open3244');overlay.setAttribute('aria-hidden','true')},
 overlay,title,body,actionsPanel,
 ()=>[{id:'build_road',enabled:true},{id:'build_industry',enabled:true}],
 (id,label,icon,sub,enabled,cls)=>({id,label,icon,sub,enabled,cls}),()=>{},
 sites,types,1500,3200,18,3,160,cell=>[...sites.values()].filter(s=>s.cell===cell),
 ()=>({ok:true,reason:'Disponible'}),()=>sites.size,()=>1,s=>s,s=>'Lugar 8',
 (f,cell,kind)=>{sites.set(cell,{f,cell,kind,level:1});buildCount++;return true},
 ()=>{},()=>{},'dip',()=>{},null,5,null,levels,industries,
 type=>{assert.equal(type,'industry');industries.add(8);levels[8]++;return true},
 {now:()=>500},()=>{},false
];
const sampleUI=new Function(...args,ui+
  '\nreturn {actions:buildClassicActions3246,handle:handleContextAction3244,modalState:()=>uiInteractionState3244.modal};');
const module=sampleUI(...value);
function target(selector,button){
 return {preventDefault(){},target:{closest(q){return q===selector?button:null}}};
}
let list=module.actions({kind:'cell',cell:8,own:true});
assert.equal(list.filter(x=>x.id==='production0388').length,1,'duplicate industry action');
assert.ok(!list.some(x=>x.id==='build_industry'),'old industry option still visible');
st.availableActions=list.filter(x=>x.enabled).map(x=>x.id);
module.handle('production0388');
assert.equal(module.modalState()?.type,'production0388');
assert.ok(body.innerHTML.includes('Construir industria general'));
assert.ok(body.innerHTML.includes('Producción especializada'));
body.fire('click',target('[data-industry-view0388]',{dataset:{industryView0388:'specialized'}}));
assert.ok(body.innerHTML.includes('Explotaciones primarias'),'specialized submenu did not open');
body.fire('click',target('[data-industry-build0388]',{dataset:{industryBuild0388:'gas'},disabled:false}));
assert.equal(buildCount,1);
assert.equal(closeCount,1,'native modal close not called after productive build');
assert.equal(module.modalState(),null,'stuck modal blocks hexagon selection');
assert.equal(overlay.classList.contains('open3244'),false,'overlay not closed');
assert.equal(overlay['aria-hidden'],'true');

// Select same or another hexagon immediately after productive construction.
st.contextDialog='open';
st.contextData={kind:'cell',cell:8,own:true};
list=module.actions(st.contextData);
st.availableActions=list.map(x=>x.id);
module.handle('production0388');
assert.equal(module.modalState()?.type,'production0388','second territory selection still blocked');
body.fire('click',target('[data-industry-general0388]',{disabled:false}));
assert.equal(closeCount,2,'normal close missing for general industry');
assert.equal(module.modalState(),null);
assert.equal(levels[8],1,'general industry build path not reached');
console.log('HEXATEGOS 0.38.10 industry menu, map unlock, general/specialized levels: OK');
