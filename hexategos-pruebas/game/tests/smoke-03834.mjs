import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../js/production-0388.js',import.meta.url),'utf8');
assert.match(src,/const prospection=window\.HexategosProspection03831/);
assert.match(src,/!prospection\?\.hasKnowledge\?\.\(cell\)\)continue/,
  'AI must not use actual unknown mineral grades');
assert.match(src,/surveyChoice\.kind==='geo'/);
const keys=['window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel',
  'MAX_GAME_LEVEL3233','campaignSeconds3230','started3230','activeFactionCount3230',
  'saveGame3212','loadGame3212','resetGame3230','renderSystems3220','buildClassicActions3246',
  'handleContextAction3244','drawInfrastructure3212','document','modalBody3244','console',
  'aiNationalSamples3275','ports3212','localStorage','capitals','industryLevel3230',
  'industries3212','buildPortableFile3275','applyPortableFile3275','fnv1a3273'];
const owner=Array.from({length:50},(_,i)=>i<25?0:1);
const offsets=[0],edgeNbr=[];
for(let c=0;c<50;c++){for(let k=1;k<=6;k++)edgeNbr.push((c+k)%50);offsets.push(edgeNbr.length)}
let visited=0,exposedBeforeStudy=0;
const studied=new Set(),surveyStarts=[];
const win={
 HexategosTradeLogistics0370:{
  geography:()=>({type:'plain',food:.5,raw:.8,fuel:.8}),
  roadComponent:()=>0,resourceSummaryCached:()=>({coverage:[.2,.3,.3]})
 },
 HexategosNaturalPotential03829:{profile:()=>({mineral:1.8,energy:1.4,food:0,livestock:0,forest:0})},
 HexategosGeology03830:{deposit:(cell,kind)=>{visited++;if(!studied.has(cell))exposedBeforeStudy++;
   return {quality:kind==='iron'?1.8:0};}},
 HexategosProspection03831:{
  hasKnowledge:cell=>studied.has(cell),
  availability:(f,cell)=>({ok:f===1&&owner[cell]===f&&!studied.has(cell)}),
  begin:(f,cell)=>{surveyStarts.push({f,cell});return {ok:true}}
 },
 HexategosAgronomy03832:{isKnown:()=>false,availability:()=>({ok:false})}
};
const boot=new Function(...keys,"let simulationTime=0;"+src+
 "\nreturn {api:window.HexategosProduction0388,setTime:t=>{campaignSeconds3230=t}}");
const nodes=new Map(Array.from({length:50},(_,cell)=>[cell,{cell,f:owner[cell],comp:0,
 stock:[0,0,0,0,0],cap:[100,100,100,100,100]}]));
const game=boot(win,[{role:'balanced'},{role:'growth'}],owner,[0,3000],3000,
 ()=>({n:50,offsets,edgeNbr}),0,100,true,2,()=>true,()=>true,()=>true,
 ()=>{},()=>[],()=>{},()=>{}, {getElementById:()=>null},null,
 {info(){},warn(){}},[[],[25,26,27]],new Set(),
 {getItem:()=>null,setItem(){},removeItem(){}},[0,25],new Uint8Array(50),new Set(),
 ()=>({payload:{}}),()=>true,undefined);
game.api.tick({nodes,routes:[],dt:4});
assert.equal(visited,0,'AI must not query hidden deposits before prospecting');
assert.equal(exposedBeforeStudy,0);
assert.equal(surveyStarts.length,1,'AI needs to start geological prospecting');
assert.equal(surveyStarts[0].f,1);
studied.add(surveyStarts[0].cell);
game.setTime(300);
game.api.tick({nodes,routes:[],dt:4});
assert.ok(visited>0,'after discovery AI may evaluate resource grade');
assert.equal(exposedBeforeStudy,0,'AI must never query unstudied geology');
assert.ok(game.api.sites().some(x=>x.f===1&&x.kind==='iron'),
 'AI must eventually build a viable iron mine after studying it');
console.log('HEXATEGOS 0.38.34: AI studies by public hints, respects hidden deposits and builds only after discovery PASS');
