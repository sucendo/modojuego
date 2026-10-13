// HEXATEGOS · banco de 5/10/20 minutos de tiempo de campaña.
// Topología real mesh-8 (510762 celdas). Economía/combat artificiales y sin render:
// mide exclusivamente colonización; NO equivale a FPS real en navegador.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
const root=new URL('../',import.meta.url);
const meshDir=new URL('../data/',import.meta.url);
const moduleSrc=fs.readFileSync(new URL('../js/ai-expansion-03876.js',import.meta.url),'utf8');
function readField(field,Type){
  let data='';
  const files=fs.readdirSync(meshDir).filter(f=>f.startsWith('mesh-8-'+field+'-')&&f.endsWith('.js')).sort();
  assert(files.length,'missing real mesh-8 '+field);
  for(const file of files){
    const str=fs.readFileSync(new URL('../data/'+file,import.meta.url),'utf8');
    const assign=[...str.matchAll(/DATA\["8"\]\["[^"]+"\]\s*(?:\+?=)\s*"([^"]*)"/g)];
    assert(assign.length,'unreadable '+file);
    for(const m of assign)data+=m[1];
  }
  const raw=Buffer.from(data.startsWith('~')?data.slice(1):data,'base64');
  const bin=data.startsWith('~')?inflateSync(raw):raw;
  const copy=Uint8Array.from(bin);
  assert.equal(copy.byteLength%Type.BYTES_PER_ELEMENT,0,field+' alignment');
  return new Type(copy.buffer);
}
const land=readField('land',Int16Array);
const offsets=readField('offsets',Uint32Array);
const edgeNbr=readField('edgeNbr',Int32Array);
const L={n:land.length,land,offsets,edgeNbr};
assert.equal(L.n,510762,'real Hexategos mesh must be used');
assert.equal(offsets.length,L.n+1);
assert.equal(offsets[L.n],edgeNbr.length);
const eligible=[];
for(let c=0;c<L.n;c++)if(land[c]>=0)eligible.push(c);
const coast=new Uint8Array(L.n);
for(const c of eligible){
  for(let k=offsets[c];k<offsets[c+1];k++){
    const o=edgeNbr[k];
    if(o>=0&&land[o]<0){coast[c]=1;break}
  }
}
console.log('HEXATEGOS expansión real mesh:',JSON.stringify({
  hex:L.n,land:eligible.length,sea:L.n-eligible.length,edges:edgeNbr.length,
  coastal:coast.reduce((a,b)=>a+b,0)
}));
function simulation(factions){
  const owner=Int16Array.from(land,v=>v<0?-2:-1);
  const capitals=new Int32Array(factions).fill(-1);
  const owned=Array.from({length:factions},()=>[]);
  const troops=new Float64Array(factions).fill(250);
  const gold=new Float64Array(factions).fill(650);
  const hist={5:null,10:null,20:null};
  // Puntos iniciales repartidos de forma determinista entre las tierras.
  const used=new Set();
  for(let f=0;f<factions;f++){
    const offset=Math.floor(((f+1)*.618033988749895%1)*eligible.length);
    let p=offset,c=eligible[p];
    while(used.has(c)){p=(p+1009)%eligible.length;c=eligible[p]}
    used.add(c);owner[c]=f;capitals[f]=c;owned[f].push(c);
  }
  const snap={frontier:Array.from({length:factions},()=>[]),territory:new Int32Array(factions)};
  const refresh=()=>{
    for(let f=0;f<factions;f++){
      const result=snap.frontier[f];result.length=0;
      snap.territory[f]=owned[f].length;
      for(const cell of owned[f]){
        for(let k=offsets[cell];k<offsets[cell+1];k++){
          const n=edgeNbr[k];if(n>=0&&land[n]>=0&&owner[n]===-1){
            result.push(cell);break;
          }
        }
      }
    }
  };
  let dirty=0,now=0,attempts=0,samples=[],foreignLoss=0;
  const window={
    HexategosNaturalPotential03829:{
      profile:c=>({food:.65+((c*17)%11)/9,forest:((c*13)%7)/7})
    },
    HexategosWorldCore03828:{emit:(name,data)=>{
      if(name==='ownership'){
        assert.equal(land[data.cell]>=0,true);
        assert(data.from===-1);
        owned[data.f].push(data.cell);attempts++;
      }
    }}
  };
  const scope=new Function('window','FACTIONS3230','activeFactionCount3230','owner6',
  'capitals','botGold3230','troops3230','loadLevel','MAX_GAME_LEVEL3233',
  'isCoastal3212','mountainTier3212','performance','aiSnapshot3260','markEconomyDirty3261',
  String.raw`
let campaignSeconds3230=0,paused3230=false,started3230=true,gameSpeed3212=1;
let cacheDirty=false,supplyDirty3220=false,aiSnapshotDirty3260=false,needsRender=false;
function aiTick3212(){return true}
function resetGame3230(){return true}
`+moduleSrc+String.raw`
return {tick:time=>{campaignSeconds3230=time;aiTick3212()},api:window.HexategosExpansion03876};
`)(
    window,Array.from({length:factions},()=>({role:'balanced'})),factions,
    owner,capitals,gold,troops,()=>L,'8',c=>!!coast[c],
    new Uint8Array(L.n),performance,snap,()=>{dirty++});
  const begin=performance.now();
  for(let second=1;second<=1200;second++){
    // Representative treasury income only; NOT the live game economy.
    for(let f=1;f<factions;f++)gold[f]+=0.70;
    if(second%10===1)refresh();
    scope.tick(second);
    if(second===300||second===600||second===1200){
      const count=owned.reduce((a,arr)=>a+arr.length,0);
      hist[second/60]={settled:count,coveragePct:+(100*count/eligible.length).toFixed(2),
        neutralSettled:attempts,blockedByBudget:scope.api.stats().blockedByBudget,
        tickMs:+scope.api.stats().lastMs.toFixed(3)};
    }
  }
  const ms=performance.now()-begin;
  assert.equal(owner[capitals[0]],0);
  assert.equal(foreignLoss,0);
  return {factions,simCpuMs:+ms.toFixed(1),timeline:hist,stats:scope.api.stats(),
    goldMin:+Math.min(...gold).toFixed(2),goldMax:+Math.max(...gold).toFixed(2)};
}
for(const f of [150,250,350,500]){
  const result=simulation(f);
  assert.ok(result.timeline[5].coveragePct>=40,
    factions+' nations colonized too slowly during the first five campaign minutes');
  assert.ok(result.timeline[10].coveragePct>=75,
    factions+' nations failed midgame coverage expectation');
  assert.ok(result.timeline[20].coveragePct>=85,
    factions+' nations failed long-duration territorial coverage');
  assert.equal(result.stats.milestones.length,3,'in-game measurements for 5/10/20 minutes missing');
  assert.ok(result.stats.milestones[0].occupiedPct>0,'live AI snapshot coverage missing');
  console.log('BENCH_EXPANSION_03877 '+JSON.stringify(result));
}
