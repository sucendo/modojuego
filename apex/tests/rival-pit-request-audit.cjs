#!/usr/bin/env node
'use strict';
// 8D.1 early guard audit: no pit service or tyre changes until a real route exists.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
function extract(name){
 const start=src.indexOf('function '+name+'(');
 assert(start>=0,name+' missing');
 let i=src.indexOf('{',start),depth=0,quote=null,esc=false;
 for(;i<src.length;i++){
  const c=src[i];
  if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"||c==='\x60'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&!--depth)return src.slice(start,i+1);
 }
 throw new Error('Unclosed '+name);
}
const calls=[];
const ctx={currentSession:'race',raceT:12,player:{},apexTyreKey:x=>x||'MEDIUM',
 apexPitRoutePlan:()=>({serviceSafe:true}),apexPitBoxForCar:()=>({pitS:42,slotId:'TEAM'}),
 apexTyreInstall:()=>{calls.push('install')},};
vm.createContext(ctx);
vm.runInContext(extract('apexRivalPitEligibility')+'\n'+extract('apexRivalPitRequest'),ctx);
const rv={team:'test',finished:false,tyres:{compound:'MEDIUM'}};
assert.equal(ctx.apexRivalPitRequest(rv,'HARD').ok,true);
assert.equal(rv.pitStop.phase,'REQUESTED');
assert.equal(rv.tyres.compound,'MEDIUM');
assert.equal(rv.pitStop.serviced,false);
assert.equal(ctx.apexRivalPitRequest(rv,'SOFT').ok,false);
assert.equal(calls.length,0);
ctx.currentSession='fp';
assert.equal(ctx.apexRivalPitEligibility({finished:false}).reason,'NOT_RACING');
ctx.currentSession='race';
ctx.apexPitRoutePlan=()=>({serviceSafe:false});
assert.equal(ctx.apexRivalPitEligibility({finished:false}).reason,'UNSAFE_PIT_ROUTE');
console.log('8D.1 pit request guards passed (navigation/service not yet implemented)');
