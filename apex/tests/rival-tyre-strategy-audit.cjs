#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
function extract(name){
 const start=source.indexOf('function '+name+'(');assert(start>=0,name);
 let pos=source.indexOf('{',start),depth=0,quote=null,escape=false;
 for(;pos<source.length;pos++){const c=source[pos];
  if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"||c==='\x60'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&!--depth)return source.slice(start,pos+1);
 }throw Error(name);
}
const requests=[];
const ctx={raceT:80,currentSession:'race',trackData:{raceConfig:{totalLaps:40}},apexTyreEnvironment:{wetness:0},
 stableTrait:()=>.5,apexRivalPitRequest:(car,compound)=>{requests.push(compound);car.pitStop={active:true};return {ok:true}}};
vm.createContext(ctx);
vm.runInContext(extract('apexRivalTyreDecision')+'\n'+extract('apexRivalTyreStrategyTick'),ctx);
const car={uid:'A',total:8000,tyres:{compound:'SOFT',front:{wear:.85},rear:{wear:.81}}};
assert.equal(ctx.apexRivalTyreDecision(car,1000).compound,'HARD');
ctx.apexRivalTyreStrategyTick(car,1000);assert.deepEqual(requests,['HARD']);
ctx.raceT=100;assert.equal(ctx.apexRivalTyreDecision(car,1000),null);
car.pitStop={active:false};car.aiPitLastLap=8;assert.equal(ctx.apexRivalTyreDecision(car,1000),null);
car.total=9000;ctx.raceT=110;car.tyres={compound:'HARD',front:{wear:0},rear:{wear:0}};
assert.equal(ctx.apexRivalTyreDecision(car,1000),null);
ctx.apexTyreEnvironment.wetness=.8;assert.equal(ctx.apexRivalTyreDecision(car,1000).compound,'WET');
ctx.apexTyreEnvironment.wetness=.25;assert.equal(ctx.apexRivalTyreDecision(car,1000).compound,'INTERMEDIATE');
ctx.apexTyreEnvironment.wetness=0;car.tyres.compound='WET';assert.equal(ctx.apexRivalTyreDecision(car,1000).compound,'MEDIUM');
car.total=39000;assert.equal(ctx.apexRivalTyreDecision(car,1000),null);
ctx.trackData.raceConfig.totalLaps=2;assert.equal(ctx.apexRivalTyreDecision(car,1000),null);
console.log('8D.2: wear, wet, dry, cooldown, race-finish and duplicate-stop guards OK');
