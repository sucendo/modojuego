'use strict';
/* Run: node hexategos-pruebas/game/tests/smoke-atlas-europe-0395.mjs
 * Assert canonical data/route integrity WITHOUT loading gameplay, mesh, or saves.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const fromGame=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const fromAtlas=p=>fs.readFileSync(new URL('../../../hexategos-atlas/'+p,import.meta.url),'utf8');
const canonical=fromAtlas('atlas-geography.js');
const hydro=fromAtlas('atlas-europe-hydro-0395.js');
const atlasRegions=fromAtlas('atlas-regions-0390.js');
const html=fromAtlas('index.html');
const regional=fromGame('data/geo-europe-regions-0395.js');
const europeCover=fromGame('data/geo-europe-landcover-0395.js');
const iberiaCover=fromGame('data/geo-landcover-0391.js');
const array=name=>{
 const marker='const '+name+'=',start=canonical.indexOf(marker);
 assert.ok(start>=0,'canonical array missing: '+name);
 const body=start+marker.length,end=canonical.indexOf('];',body);
 return JSON.parse(canonical.slice(body,end+1));
};
for(const code of [hydro,regional,europeCover,atlasRegions])
 assert.doesNotThrow(()=>new Function(code),'JavaScript syntax');
const rivers=array('MAP_RIVERS3242'),
 edges=array('PHYS_EDGE_NODES3242'),coast=array('PHYS_EDGE_COAST3242');
const nameList=['Támesis','Sena','Rin','Danubio','Ródano','Loira','Garona',
 'Vístula','Óder','Dniéper','Volga','Tíber','Po','Elba','Don','Ural','Inn','Tisza','Saona'];
let coastal=0;
for(const name of nameList){
 const sys=rivers.find(s=>s.n===name);
 assert.ok(sys,'river missing from canonical data: '+name);
 assert.ok(sys.edges.length>1);
 const edge=id=>[edges[2*id],edges[2*id+1]];
 const fst=edge(sys.edges[0]),sec=edge(sys.edges[1]);
 const nodes=sec.includes(fst[0])?[fst[1],fst[0]]:[fst[0],fst[1]];
 for(const id of sys.edges.slice(1)){
  const e=edge(id),last=nodes.at(-1);
  assert.ok(e.includes(last),'broken canonical river path: '+name);
  nodes.push(e[0]===last?e[1]:e[0]);
 }
 const firstCoast=sys.edges.findIndex(id=>coast[id]);
 if(sys.mouthExpected&&!sys.branch){
  assert.ok(firstCoast>0,'river lacks inland coast approach: '+name);
  const mouth=nodes[firstCoast];
  assert.ok(edge(sys.edges[firstCoast]).includes(mouth));
  assert.equal(coast[sys.edges[firstCoast-1]],0,'last drawn edge must be inland');
  coastal++;
 }else assert.equal(firstCoast,-1,'a tributary reaches the sea unexpectedly: '+name);
}
assert.equal(coastal,16,'all 16 main rivers stop before coastal edge');
const w={};
new Function('window',iberiaCover)(w);const original=w.HexategosLandCover0391;
new Function('window',europeCover)(w);const cover=w.HexategosLandCover0391;
new Function('window',regional)(w);
assert.equal(w.HexategosEuropeRegions0395.naturalRegions.length,48);
assert.equal(w.HexategosEuropeRegions0395.historicalLabels.length,24);
assert.equal(cover.types.length,17);
assert.equal(original.classify(42.7,-8.4,'mediterranean',0),
 cover.classify(42.7,-8.4,'mediterranean',0),'Iberian landcover must not change');
assert.ok(['rock','tundra','grass'].includes(cover.types[cover.classify(64.9,-18.8,'forest',0)].id),
 'Iceland must not be forested by default');
assert.equal(cover.types[cover.classify(62.4,16,'forest',0)].id,'conifers',
 'Sweden should exhibit boreal forest');
assert.ok(w.HexategosEuropeRegions0395.naturalAt(52.0,20).length,'Polish regions missing');
assert.ok(w.HexategosEuropeRegions0395.naturalAt(63.3,26).length,'Finnish regions missing');
assert.ok(html.indexOf('geo-europe-regions-0395.js')<html.indexOf('atlas-regions-0390.js'),
 'European regions must load before Atlas region renderer');
assert.ok(html.indexOf('geo-europe-landcover-0395.js')<html.indexOf('atlas-landcover-0391.js'),
 'European landcover must load before its renderer');
assert.ok(html.indexOf('atlas-iberia-edges-v2.js')<html.indexOf('atlas-europe-hydro-0395.js'),
 'Europe rivers must wrap the Iberian renderer, not replace it');
assert.ok(html.includes('id="europe"'));
assert.ok(fromAtlas('atlas-ui.js').includes("$('europe').onclick"));
assert.ok(!/setInterval\s*\(/.test(hydro));
console.log('HEXATEGOS ATLAS Europe 0.39.5: 19 rivers, 16 coastal mouths, 48 regions, vegetation, LOD/UI: OK');
