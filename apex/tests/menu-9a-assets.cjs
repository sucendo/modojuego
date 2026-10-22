/* APEX 9A.1 · Static checks for approved local artwork */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../assets/9a');
const images=['logo-apex26','fondo-apex26','race-fast','race-gp','race-season','race-practice',
  'race-vehicle','race-monaco','prep-monaco','weather-clouds','track-state-bg','track-state-thumb',
  ...['soft','medium','hard','intermediate','wet'].map(t=>'tyre-'+t),
  ...Array.from({length:12},(_,i)=>'team-'+String(i+1).padStart(2,'0'))];
assert.equal(images.length,29,'All approved images must be enumerated');
let bytes=0;
for(const name of images){
 const file=path.join(root,name+'.webp');
 assert.ok(fs.existsSync(file),'Missing approved image: '+name);
 const b=fs.readFileSync(file);bytes+=b.length;
 assert.ok(b.length>500,'Empty approved image: '+name);
 assert.equal(b.toString('ascii',0,4),'RIFF','Invalid RIFF header: '+name);
 assert.equal(b.toString('ascii',8,12),'WEBP','Invalid WebP header: '+name);
}
assert.ok(bytes<3e6,'Image budget exceeded');
for(const source of ['menu-9a.js','preparation-9a.js']){
 const js=fs.readFileSync(path.resolve(__dirname,'../js',source),'utf8');
 assert.ok(js.includes('assets/9a/'),'Menu artwork must be local: '+source);
}
console.log(JSON.stringify({test:'apex-9a-approved-artwork',count:images.length,totalBytes:bytes,ok:true}));
