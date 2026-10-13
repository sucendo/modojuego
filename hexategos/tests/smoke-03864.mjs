import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const production=read('js/production-0388.js');
const inspector=read('js/hex-inspector-03817.js');
const html=read('index.html');

assert.doesNotThrow(()=>new Function(production),'production module must remain syntactically valid');
assert.doesNotThrow(()=>new Function(inspector),'inspector module must remain syntactically valid');
assert.match(html,/js\/production-0388\.js\?v=03872/,'mobile must load updated production logic');
assert.match(html,/js\/hex-inspector-03817\.js\?v=03871/,'mobile must load updated inspector logic');
assert.match(inspector,/const tabs=\[\['summary','Acciones'\],\['industry','Industria'\]\]/,
  'territorial first tab must say Acciones without changing summary key');

// Both views update existing nodes rather than resetting scroll containers.
assert.match(inspector,/function syncLiveNode03864/);
assert.match(inspector,/function refreshLiveDetails03864/);
assert.match(inspector,/details\.innerHTML=content;[\s\S]*?else if\(details\._content!==content\)refreshLiveDetails03864\(ctx\)/);
assert.match(inspector,/if\(tab!=='summary'\)refreshLiveDetails03864\(ctx\)/);
assert.match(inspector,/root\.classList\.toggle\('ctxTabContent03865',tab!=='summary'\)/,'tab changes must preserve a single content view');
assert.match(inspector,/focused&&current\.tagName==='INPUT'/,'active slider value must not be replaced');

assert.match(production,/function syncIndustryNode03864/);
assert.match(production,/if\(previous\)syncIndustryNode03864\(previous,wrapper\)/);
assert.match(production,/document\.addEventListener\?\.\('hexategos:electricity-updated'/);
assert.match(production,/lastStats=\{aiReviewed,[\s\S]*?dispatchEvent\(new CustomEvent\('hexategos:electricity-updated'\)\)/,
  'economy must publish after the new cycle metrics are calculated');
assert.doesNotMatch(production,/setInterval\(\s*economyPanel/,'do not add a second economy polling loop');
console.log('HEXATEGOS 0.38.64 live economy updates: syntax, refresh hooks, scroll & controls guards OK');
