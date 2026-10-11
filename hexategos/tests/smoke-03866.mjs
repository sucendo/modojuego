import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/hex-inspector-03817.js');
const css=read('css/hex-inspector-03817.css');
const html=read('index.html');
assert.doesNotThrow(()=>new Function(js),'inspector syntax');
assert.match(html,/hex-inspector-03817\.js\?v=03866/);
assert.match(html,/hex-inspector-03817\.css\?v=03865/);

// Run the actual routing functions with simple, distinguishable views.
function extract(from,to){
  const begin=js.indexOf(from);
  const end=js.indexOf(to,begin+from.length);
  assert(begin>=0&&end>begin,'missing source block '+from);
  return js.slice(begin,end);
}
const tabsSource=extract('  const tabsFor=ctx=>{','  // Small vector');
const tabsFor=new Function(tabsSource+'\nreturn tabsFor;')();
assert.deepEqual(tabsFor({city:0,port:false}).map(v=>v[1]),
  ['Acciones','Industria','Terreno']);
assert.deepEqual(tabsFor({city:1,port:true}).map(v=>v[1]),
  ['Acciones','Industria','Gobierno','Puerto','Terreno']);

const viewSource=extract('  function renderDetails(ctx){','  const tabsFor=ctx=>');
const makeView=tab=>new Function('tab','industry','government','portRoutes',
  'naturalStudies03834','materialsSummary',
  viewSource+'\nreturn renderDetails;')(
  tab,()=>'<INDUSTRIA>',()=>'<GOBIERNO>',()=>'<PUERTO>',
  ()=>'<ESTUDIOS>',()=>'<RECURSOS>');
const sample={cell:9};
assert.equal(makeView('summary')(sample),'','Acciones cannot show accordions below');
assert.equal(makeView('industry')(sample),'<INDUSTRIA>');
assert.equal(makeView('government')(sample),'<GOBIERNO>');
assert.equal(makeView('port')(sample),'<PUERTO>');
assert.equal(makeView('terrain')(sample),'<ESTUDIOS><RECURSOS>');

assert.match(js,/actions\.hidden=tab!=='summary'/,'native action buttons hidden off Acciones');
assert.match(js,/details\.hidden=tab==='summary'/,'other tab content hidden on Acciones');
assert.match(js,/ranges\.hidden=!ctx\.own\|\|tab!=='summary'/,'military sliders belong to actions');
assert.match(js,/role="tablist"/,'tab semantics missing');
assert.match(js,/aria-controls/);
assert.match(js,/const requested=nav\.dataset\.inspectTab03817/);
assert.match(js,/document\.addEventListener\('hexategos:electricity-updated'/);
assert.match(js,/if\(tab!=='summary'\)refreshLiveDetails03864\(ctx\)/,
  'live industrial updates must continue while viewing a tab');
assert.doesNotMatch(viewSource,/<details|openSection03858/,'accordion logic must not return');
assert.match(css,/#ctxActions3244\[hidden\]/,'specific hidden CSS must override grid!important');
assert.match(css,/#ctxDetails03817\[hidden\]/,'tab view must fully replace actions');
assert.match(css,/ctxTabContent03865 \.ctxForeign3246/,'foreign action block must also hide');
assert.doesNotMatch(js,/setInterval\(/,'no new polling interval');
console.log('HEXATEGOS 0.38.66 tabs: actions, industry, government, port, terrain, live scroll guards OK');
