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

// Renderizador europeo en ejecución: todos los recorridos se preparan y
// restauran después del dibujo; el segundo fotograma debe ser idéntico.
const live=new Function('src','systems','edgeNodes','coastFlags',"\nconst MAP_RIVERS3242=systems,window={},MAX_GAME_LEVEL3233='8';\nconst L={faceCenters:new Int16Array(1021520*3)};\nfor(const sys of systems)for(const edgeId of sys.edges)\n for(const v of [edgeNodes[edgeId*2],edgeNodes[edgeId*2+1]]){\n  const k=v*3,t=v*.000019;\n  L.faceCenters[k]=Math.round(21000*Math.cos(t));\n  L.faceCenters[k+1]=Math.round(15000*Math.sin(t*.7));\n  L.faceCenters[k+2]=Math.round(25000*Math.cos(t*.8));\n }\nconst loadLevel=()=>L,\n physicalEdge3242=id=>({u:edgeNodes[id*2],v:edgeNodes[id*2+1],coast:!!coastFlags[id]}),\n edgeTouchesSea3295=id=>!!coastFlags[id];\nfunction edgePathNodes3242(sys){\n const es=sys.edges;if(!es.length)return [];\n const a=physicalEdge3242(es[0]),b=physicalEdge3242(es[1]);\n const out=b.u===a.u||b.v===a.u?[a.v,a.u]:[a.u,a.v];\n for(let i=1;i<es.length;i++){\n  const e=physicalEdge3242(es[i]),p=out[out.length-1];\n  out.push(e.u===p?e.v:e.v===p?e.u:-1);\n }\n return out;\n}\nconst riverMinZoom3297=()=>0,riverRenderCache3296=new Map();\nlet zoom=18,passes=0,strokes=0,masked=new Set();\nlet drawTerrain3212=()=>{passes++;\n for(const sys of MAP_RIVERS3242)if(!sys.edges.length)masked.add(sys.n);\n};\nconst $=()=>({checked:true}),projectVec=(x,y,z,R,cx,cy)=>[cx+x*R,cy+y*R,1];\nconst ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},\n stroke(){strokes++},set lineWidth(v){},set strokeStyle(v){},\n set lineCap(v){},set lineJoin(v){}};\nconst console={info(){},warn(...args){throw Error(args.join(' '))}};\neval(src);\ndrawTerrain3212(1000,0,0);\nconst first=strokes,diag=window.HexategosEuropeHydro0395.diagnostics();\ndrawTerrain3212(1000,0,0);\nreturn {rivers:diag.filter(x=>x.drawnEdges>0).length,\n coast:diag.filter(x=>x.skipsCoastalEdge).length,\n masked:masked.size,passes,stable:strokes===first*2,\n restored:MAP_RIVERS3242.every(x=>x.edges.length>0),strokes:first};\n")(
 hydro,rivers.filter(x=>nameList.includes(x.n)),edges,coast);
assert.equal(live.rivers,19,'all 19 systems must produce valid visible paths');
assert.equal(live.coast,16,'all 16 sea-mouth rivers clip before coastline');
assert.equal(live.masked,19,'canonical rivers must not be double-painted');
assert.equal(live.restored,true,'canonical data must be restored every frame');
assert.equal(live.stable,true,'cached rerender must remain deterministic');
assert.ok(live.strokes>0);
console.log('HEXATEGOS ATLAS Europe 0.39.5: 19 rivers, 16 coastal mouths, 48 regions, vegetation, LOD/UI: OK');
