'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Los módulos esenciales del Atlas conservan sintaxis válida',()=>{
 for(const name of ['atlas-core.js','atlas-ui.js','atlas-geography.js',
   'atlas-label-style-0399.js','atlas-macro-0396.js',
   'atlas-regions-0390.js','atlas-europe-straits-0397.js',
   'atlas-europe-secondary-0396.js','atlas-europe-lakes-0396.js',
   'atlas-iberia-edges-v2.js']){
  new vm.Script(read(name),{filename:name});
 }
});

test('Las costas siguen las aristas hexagonales; no hay litoral vectorial superpuesto',()=>{
 const html=read('index.html'),core=read('atlas-core.js');
 assert.ok(!html.includes('atlas-coast-0399.js'));
 assert.ok(!html.includes('atlas-coast-data-0399.js'));
 assert.ok(!core.includes('HexategosAtlasCoast0399'));
 assert.ok(!fs.existsSync(path.join(root,'atlas-coast-0399.js')));
 assert.ok(!fs.existsSync(path.join(root,'atlas-coast-data-0399.js')));
 assert.ok(core.includes('const coast=(geoA<0)!=(geoB<0)'));
 assert.ok(core.includes('drawTerrain3212(R,cx,cy);'));
});

test('Paleta uniforme: aguas azul, montañas marrón y tierras blanco cálido',()=>{
 const sandbox={window:{}};
 vm.runInNewContext(read('atlas-label-style-0399.js'),vm.createContext(sandbox));
 const api=sandbox.window.HexategosAtlasLabelStyle0399;
 const examples=[
  ['Mar Mediterráneo','natural','water'],['Golfo de Vizcaya','water','water'],
  ['Ría de Vigo','natural','water'],['Fiordo de Oslo','natural','water'],
  ['Lago de Sanabria','lake','water'],['Río Tajo','river','water'],
  ['Øresund','strait','water'],['Pirineos','natural','mountain'],
  ['Sierra Morena','natural','mountain'],['Macizo Central','natural','mountain'],
  ['Montes Escandinavos','natural','mountain'],['Selva Negra','natural','mountain'],
  ['Península Ibérica','land','land'],['Europa Oriental','region','land'],
  ['Submeseta Norte','natural','land'],['Selandia','island','land']
 ];
 for(const [name,kind,expected] of examples)
  assert.equal(api.category({name,kind}),expected,name);
 assert.notEqual(api.color({kind:'water'}),api.color({kind:'mountain'}));
 assert.notEqual(api.color({kind:'mountain'}),api.color({kind:'land'}));
 assert.match(api.color({kind:'land'}),/^rgba\\(246,245,237,/);
});

test('Los dos renderizadores usan una misma paleta y no pierden los halos',()=>{
 const macro=read('atlas-macro-0396.js'),regions=read('atlas-regions-0390.js');
 for(const src of [macro,regions]){
  assert.ok(src.includes('HexategosAtlasLabelStyle0399'));
  assert.ok(src.includes('labelStyle.color('));
  assert.ok(src.includes('ctx.strokeText('));
  assert.ok(src.includes('ctx.fillText('));
 }
});

test('Persiste el relevo entre macrotopónimos y nombres regionales',()=>{
 const macro=read('atlas-macro-0396.js'),regions=read('atlas-regions-0390.js'),html=read('index.html');
 assert.ok(macro.includes('handoffZoom=5.55'));
 assert.ok(macro.includes("toLocaleUpperCase('es-ES')"));
 assert.ok(regions.includes('zoom<handoffZoom'));
 assert.ok(regions.includes('lastBoxes.some('));
 assert.ok(html.indexOf('atlas-label-style-0399.js')<html.indexOf('atlas-macro-0396.js'));
 assert.ok(html.indexOf('atlas-label-style-0399.js')<html.indexOf('atlas-regions-0390.js'));
});

test('Las etiquetas de islas y estrechos se validan contra L8; sin costas externas',()=>{
 const s=read('atlas-europe-straits-0397.js');
 assert.ok(s.includes("loadLevel('8')"));
 assert.ok(s.includes('nearestDetailed('));
 assert.ok(s.includes("feature.kind==='strait'?land<0:land>=0"));
 assert.ok(!s.includes('HexategosAtlasCoast0399'));
});

test('Se mantienen ríos, desembocaduras, montañas y lagos con la malla previa',()=>{
 const html=read('index.html'),core=read('atlas-core.js');
 for(const name of ['atlas-iberia-edges-v2.js','atlas-europe-hydro-0395.js',
   'atlas-europe-mountains-0396.js','atlas-europe-secondary-0396.js',
   'atlas-europe-lakes-0396.js'])assert.ok(html.includes(name));
 assert.ok(read('atlas-europe-lakes-0396.js').includes('lakeRoute'));
 assert.ok(read('atlas-iberia-edges-v2.js').includes('riverMouthDiagnostics'));
 assert.ok(core.includes('HexategosEuropeLakes0396?.draw'));
});
