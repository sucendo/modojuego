#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../parts/part-026.txt'),'utf8');
function fn(name){
 const start=src.indexOf('function '+name+'(');assert(start>=0,name+' missing');
 let i=src.indexOf('{',start),depth=0,quoted=null,escape=false;
 for(;i<src.length;i++){const c=src[i];
  if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quoted)quoted=null;continue;}
  if(c==='"'||c==="'"||c==='\x60'){quoted=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&!--depth)return src.slice(start,i+1);
 }throw Error('Unclosed '+name);
}
const L=1000,plan={serviceSafe:true,entryTrackS:0,exitTrackS:120,entryPitS:0,exitPitS:100,
 primaryStart:0,primaryEnd:100,routeLength:100,dir:1,speedMps:18,serviceSeconds:2.8,
 entry:{x:0,z:0},exit:{x:100,z:0}};
const rv={team:'A',s:0,lat:0,speed:12,total:0,driveNetwork:'TRACK',tyres:{compound:'SOFT'},
 pitStop:{active:true,phase:'REQUESTED',compound:'HARD'},pitStops:0};
let nInstall=0,nLap=0,clock=0;
const ctx={
 raceT:0,player:{},rivals:[rv],trackData:{km:1},currentSession:'race',
 apexPitRoutePlan:()=>plan,apexPitBoxForCar:()=>({pitS:55,slotId:'A'}),
 envProfile:()=>({half:5}),apexPitSafeSpeed:()=>18,apexPitPointAtS:p=>({x:p,z:0,y:0,tx:1,tz:0,nx:0,nz:1,pitS:p}),
 renderRibbonFrameAt:s=>({x:s*(100/120),z:0,tx:1,tz:0,nx:0,nz:1}),
 trackSurfacePoseAt:(s)=>({x:s*(100/120),z:0,y:0}),
 clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),mod:(x,m)=>(x%m+m)%m,
 apexPitServiceBegin:(car,st,now,duration)=>{if(st.serviceStarted!=null)return false;st.phase='SERVICE';st.serviceStarted=now;st.serviceUntil=now+duration;return true;},
 apexPitServiceComplete:(car,st,now)=>{if(st.serviced||now<st.serviceUntil)return false;st.serviced=true;st.phase='EXITING';car.tyres={compound:st.compound};car.pitStops++;nInstall++;return true;},
 apexPitServiceExit:(car,st,now)=>{st.exitedAt=now;},
 apexTyreStep:()=>{},updateRivalLapTiming:()=>nLap++
};vm.createContext(ctx);
vm.runInContext(fn('rivalWorld')+'\n'+fn('apexRivalPitLeadGap')+'\n'+fn('apexRivalPitBoxOccupied')+'\n'+fn('apexRivalPitDrive'),ctx);
let prevTotal=0,completed=false;
for(let i=0;i<1300;i++){
 clock+=.1;ctx.raceT=clock;
 assert.equal(ctx.apexRivalPitDrive(rv,.1,L),true);
 assert(Number.isFinite(rv.s)&&Number.isFinite(rv.total)&&Number.isFinite(rv.speed));
 assert(rv.total>=prevTotal-1e-8,'progress regressed');
 assert(rv.speed<=18+1e-8,'pit speed');
 prevTotal=rv.total;
 if(rv.pitStop.phase==='DONE'){completed=true;break;}
}
assert(completed,'pit roundtrip did not complete');
assert.equal(nInstall,1,'tyres installed once');
assert.equal(rv.tyres.compound,'HARD');
assert.equal(rv.pitStops,1);
assert.equal(rv.driveNetwork,'TRACK');
assert(nLap>0);
// Two simultaneous pit users: the trailing rival must keep physical clearance.
const leader={driveNetwork:'PIT',pitS:45,team:'A'};
const follower={driveNetwork:'PIT',pitS:30,team:'B'};
ctx.rivals=[leader,follower];
assert.equal(ctx.apexRivalPitLeadGap(follower,plan),15);
assert.equal(ctx.apexRivalPitLeadGap(leader,plan),Infinity);
assert.equal(ctx.apexRivalPitBoxOccupied(follower,plan,{pitS:45}),true);
leader.pitS=80;
assert.equal(ctx.apexRivalPitBoxOccupied(follower,plan,{pitS:45}),false);
console.log('8D.1 two-rival pit spacing and box occupancy guards passed');
console.log('8D.1 synthetic rival pit traversal passed; real-circuit validation pending');
