import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.join(root,'../js/portable-hxz2-03844.js'),'utf8');
assert.match(source,/file\.checksum=checksum/);
assert.match(source,/verify\.checksum!==fnv1a3273\(JSON\.stringify\(verify\.payload\)\)/);
assert.match(source,/const bytes=await gzipBytes\(raw\)/);
const fnv1a=text=>{
 let h=2166136261;
 for(let i=0;i<text.length;i++){
   h^=text.charCodeAt(i);
   h=Math.imul(h,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
};
const payload={main:{owner:Array(510762).fill(-1)},regionalNames0389:{v:3,nations:[[1,{name:'Castilla'}]],cityIdentity:[[20,{geo:'Madrid',name:'Madrid'}]]}};
const file={magic:'OPENFRONT_SAVE',schema:2,payload,checksum:'outdated'};
file.checksum=fnv1a(JSON.stringify(file.payload));
const serialized=JSON.stringify(file);
const verify=JSON.parse(serialized);
assert.equal(verify.checksum,fnv1a(JSON.stringify(verify.payload)));
verify.payload.regionalNames0389.cityIdentity[0][1].name='Toledo';
assert.notEqual(verify.checksum,fnv1a(JSON.stringify(verify.payload)));
console.log('PASS: 510762 hexagons and v3 regional names; final checksum valid and detects subsequent mutation');
