import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../src/model/schema.js',import.meta.url),'utf8');
let id=0;const sandbox={window:{SystemForgeCore:{}},crypto:{randomUUID:()=>`id-${++id}`}};vm.createContext(sandbox);vm.runInContext(code,sandbox);const C=sandbox.window.SystemForgeCore;
assert.equal(C.SCHEMA_VERSION,22);
const old={schema:'system-forge',schemaVersion:11,visualScale:.5,tagDefinitions:[{id:'lore',label:'Lore'}],bodies:[{name:'Earth',kind:'planet'}]};
const m=C.migrateProject(old);assert.equal(m.schemaVersion,22);assert.equal(m.visualScale,.625);assert.equal(m.tagDefinitions[0].label,'CF');
const v21={schema:'system-forge',schemaVersion:21,visualScale:.25,bodies:[{id:'craft',name:'Probe',kind:'spacecraft'}]};
const c=C.migrateProject(v21);assert.equal(c.visualScale,.25,'v21 scale must not be remapped');assert.equal(c.bodies[0].spacecraftClass,'other');assert.equal(c.bodies[0].missionStatus,'planned');assert.equal(c.bodies[0].characteristicSizeM,10);
console.log('migration-smoke OK');
