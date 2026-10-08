import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deflateSync,inflateSync} from 'node:zlib';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const storageCode=read('js/save-storage-03827.js');
const integrityCode=read('js/save-integrity-03827.js');
const tradeCode=read('js/trade-logistics-0370.js');
const industryCode=read('js/production-0388.js');
const html=read('index.html');
const saved=new Map(),limits=8500;
const localStorage={
  setItem(k,v){const projected=[...saved].filter(x=>x[0]!==k).reduce((a,x)=>a+x[1].length,0)+v.length;
    if(projected>limits)throw new Error('QuotaExceededError');saved.set(k,v)},
  getItem:k=>saved.get(k)||null,removeItem:k=>saved.delete(k)
};
const window={pako:{
  deflate:s=>new Uint8Array(deflateSync(Buffer.from(s))),
  inflate:(bytes,options)=>inflateSync(Buffer.from(bytes)).toString('utf8')
}};
new Function('window','localStorage','toast',storageCode)(window,localStorage,()=>{});
const codec=window.HexategosSaveStorage03827;
const bigState={routes:Array.from({length:135},(_,i)=>({id:i,type:'sea',path:Array.from({length:40},(_,j)=>j+i),name:'Puerto Internacional de prueba'}))};
assert.equal(codec.set('routes',bigState),true,'compressed route save must fit the storage quota');
assert.ok(saved.get('routes').startsWith('HXZ1:'),'route snapshot must be compressed on disk');
assert.deepEqual(codec.get('routes'),bigState,'compressed routes must round-trip');
saved.set('oldRoutes',JSON.stringify({routes:[{id:42,type:'land'}]}));
assert.deepEqual(codec.get('oldRoutes'),{routes:[{id:42,type:'land'}]},'old JSON sidecars must remain readable');
const special={v:2,sites:[{cell:2,kind:'textile',level:3,stock:4.2,output:7},{cell:7,kind:'coal',level:1,stock:12}]};
assert.equal(codec.set('industries',special),true);
assert.deepEqual(codec.get('industries'),special,'textile sites, levels and stock must survive');
assert.equal(codec.set('tooBig',{payload:'x'.repeat(12000)}),true,'compressible saves should not fail solely from size');
assert.equal(codec.set('bad',{payload:Array.from({length:12000},(_,i)=>String.fromCharCode(33+i%83)).join('')}),true); // may compress well
assert.equal(codec.get('industries').sites[0].kind,'textile');
let prior={payload:{main:{owner:[0,0]}}};
const trades={routes:[{id:1,type:'sea',from:10,to:11}],fleets:[]};
const industries={v:2,sites:[{kind:'textile',cell:2,level:3}]};
window.HexategosTradeLogistics0370={snapshot:()=>trades};
window.HexategosProduction0388={snapshot:()=>industries};
const hash=s=>s.length;
const boot=new Function('window','fnv1a3273','buildPortableFile3275',integrityCode+
  '\nreturn {exportFile:buildPortableFile3275,api:window.HexategosSaveIntegrity03827}');
const exp=boot(window,hash,()=>structuredClone(prior));
const file=exp.exportFile();
assert.deepEqual(file.payload.tradeLogistics0370,trades,'portable exports must contain current route data');
assert.deepEqual(file.payload.production0388,industries,'portable exports must contain current textile plant data');
assert.equal(file.checksum,JSON.stringify(file.payload).length,'checksum must be recomputed');
assert.equal(exp.api.inspect().routes,1);
assert.equal(exp.api.inspect().industrySites,1);
window.HexategosProduction0388.snapshot=()=>null;
assert.throws(()=>exp.exportFile(),/Exportación incompleta/,'never export silent incomplete files');
window.HexategosProduction0388.snapshot=()=>industries;
const warned=[];
const saveHarness=new Function(
  'window','fnv1a3273','buildPortableFile3275','saveGame3212',
  'started3230','SAVE_KEY3230','owner6','campaignSeconds3230',
  'localStorage','toast','setTimeout',
  integrityCode+';return {save:saveGame3212,diagnostic:window.HexategosSaveIntegrity03827.inspect};'
)(window,hash,()=>({payload:{main:{owner:[0,0]}}}),()=>{},true,'missingMainKey',
  [0,0],41,localStorage,text=>warned.push(text),cb=>cb());
saveHarness.save();
assert.ok(saveHarness.diagnostic().mainError,'main save failure must be detected');
assert.ok(warned.some(x=>x.includes('NO se ha guardado')),'player should see explicit save failure');

assert.match(tradeCode,/read0370\(\)/,'trade must read compact or legacy route saves');
assert.match(tradeCode,/lastPeriodicSaveWall03827/,'automatic trade routes must be persisted');
assert.match(tradeCode,/snapshot:serialize0370/,'trade export must read live routes');
assert.match(industryCode,/readProduction03827\(\)/,'production load must read compact or legacy data');
assert.match(industryCode,/snapshot:saveState/,'production export must read live factories');
assert.ok(html.indexOf('save-storage-03827.js')<html.indexOf('trade-logistics-0370.js'));
assert.ok(html.indexOf('save-integrity-03827.js')>html.indexOf('production-0388.js'));
console.log('HEXATEGOS 0.38.27: browser save old/new, compressed routes/textile, portable integrity PASS');
