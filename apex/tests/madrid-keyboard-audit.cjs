'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const part=n=>fs.readFileSync(path.join(__dirname,'../parts/part-'+n+'.txt'),'utf8');
const controls=part('027'),physics=part('026');
function slice(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a);
 return source.slice(a,b);
}
const context=vm.createContext({
 keys:{},player:{},mode:'race',paused:false,demoMode:false,apexInputDevice:'',
 apexControls:{},apexControlActions:[],apexControlTypingTarget:()=>false,
 apexInspectionActive:()=>false,handleDiagSequence(){},
 $:()=>({classList:{remove(){}}})
});
vm.runInContext(
 slice(controls,'let apexKeyboardSteerPending=','function apexResetSessionControls(')+
 slice(controls,'function apexHandleControlKeydown(','function apexInitControls(')+
 'function readPhysicsInput(){'+
 slice(physics,' const keyboardSteer=',' const gamepad=!demoMode?')+
 'return [Number(Boolean(rawLeft)),Number(Boolean(rawRight))]}',context);
const event=(code,repeat=false)=>({code,repeat,preventDefault(){}});
const down=(code,repeat)=>context.apexHandleControlKeydown(event(code,repeat));
const up=code=>context.apexHandleControlKeyup(event(code));
const sample=()=>Array.from(context.readPhysicsInput());

down('ArrowLeft');up('ArrowLeft');
assert.deepEqual(sample(),[1,0],'a tap between physics steps is delivered');
assert.deepEqual(sample(),[0,0],'the tap is delivered once');
down('ArrowRight');
assert.deepEqual(sample(),[0,1]);
assert.deepEqual(sample(),[0,1],'held steering persists');
up('ArrowRight');
assert.deepEqual(sample(),[0,0]);
down('ArrowRight');down('ArrowRight',true);up('ArrowRight');
assert.deepEqual(sample(),[0,1],'key repeat does not enqueue extra taps');
assert.deepEqual(sample(),[0,0]);
down('ArrowLeft');up('ArrowLeft');down('ArrowRight');
assert.deepEqual(sample(),[0,1],'a held direction wins against a queued opposite tap');
context.apexReleaseInputs();
assert.deepEqual(sample(),[0,0],'blur and pause clear held and queued inputs');
down('ArrowLeft');up('ArrowLeft');context.apexReleaseInputs();
assert.deepEqual(sample(),[0,0],'a queued tap is cleared even when its key is up');
console.log('PASS: manual steering taps, holds, repeat, opposite direction and reset');
