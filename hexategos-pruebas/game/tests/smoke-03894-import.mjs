import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('js/game.js');
const archive=read('js/portable-hxz2-03844.js');
const dialogs=read('js/game-dialogs-03851.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(game));
assert.doesNotThrow(()=>new Function(archive));
assert.doesNotThrow(()=>new Function(dialogs));
assert.match(index,/game\.js\?v=03894-hxz2-import/);
assert.match(index,/portable-hxz2-03844\.js\?v=03894-hxz2-import/);
assert.match(index,/game-dialogs-03851\.js\?v=03894-hxz2-import/);
assert.match(archive,/jsonHeader=text\.slice\(0,2048\)/);
assert.doesNotMatch(archive,/JSON\.parse\(text\)/,'HXZ2 translation must not parse large JSON');
assert.match(dialogs,/approvedInputs\.get\(input\)===current\.name/,'synthetic HXZ2 translation must not request a second confirmation');
assert.doesNotMatch(archive,/setInterval\(/);

function snippet(start,after){
 const i=game.indexOf(start);
 assert(i>=0,'Missing import wrapper '+start);
 const end=game.indexOf(after,i);
 assert(end>i,'Missing wrapper end '+start);
 return game.slice(i,end+after.length);
}
const primary=snippet("importGameText3273=function(text,filename='partida.hexategos'){", '\n};');
const geo=snippet('const _importGeoBase3290=importGameText3273;', '\n};');
assert.match(primary,/typeof text==='string'\?JSON\.parse\(text\):text/);
assert.match(geo,/return _importGeoBase3290\(file,filename\)/);
assert.doesNotMatch(geo,/JSON\.stringify\(file\)/);

const rows=510762;
const fixture={magic:'OPENFRONT_SAVE',schema:2,
 payload:{main:{owner:Array(rows).fill(-1),campaignSeconds:120},naval:{groups:[]}},campaignSeconds:120};
let parses=0,imports=0,question=0;
const fn=new Function('parseFn','applyFn','confirmFn','record',`
 let importGameText3273;
 const JSON={parse:parseFn};
 const validatePortablePayload3275=f=>{if(f?.payload?.main?.owner?.length!==510762)throw Error('bad map');};
 const geoValidatePayload3290=f=>f;
 const applyPortableFile3275=applyFn;
 const confirm=confirmFn;
 const toast=()=>{};
 let portableStatus3275='',sysTab3220='government';
 const renderSystems3220=()=>{};
 ${primary}
 ${geo}
 return importGameText3273;
`)((s)=>{parses++;return JSON.parse(s)},
  ()=>{imports++;return true},
  ()=>{question++;return true},()=>{});
const text=JSON.stringify(fixture);
assert.equal(fn(text,'large.hexategos'),true);
assert.equal(parses,1,'510k-cell saved data must be parsed exactly once');
assert.equal(imports,1);
assert.equal(question,1,'one import approval');
console.log('HEXATEGOS 0.38.94: 510,762-cell JSON parsed once, HXZ2 skips extra parse, confirmation not repeated PASS');
