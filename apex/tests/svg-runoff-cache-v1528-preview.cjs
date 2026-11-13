'use strict';
// APEX V15.2.8: authored runoff material ownership and terrain-cache
// invalidation after changing visible track/pit/plate boundaries.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('parts/part-024-bridgefull-preview.txt');
const world=read('parts/part-025-bridgefull-trees3d-preview.txt');
const preview=read('perf6a-preview.html'),production=read('apex.html');
assert.match(preview,/part-024-bridgefull-preview\.txt/);
assert.doesNotMatch(production,/part-024-bridgefull-preview\.txt/);
function slice(s,start,end){const i=s.indexOf(start),j=s.indexOf(end,i);
 assert.ok(i>=0&&j>i,'not found '+start);const b=s.slice(i,j);new vm.Script(b);return b;}
const policy=slice(core,'function apexSvgRunoffFallbackV1528(', 'function envProfile(');
const snippet=slice(core,'function envProfile(', 'function finalizeEnvForTrack(');
const base={ '01-australia':{environment:{surfaces:{runoffSurface:'ASPHALT'}}} };
const mock=(cw,json={},user=null)=>{
 const td={spec:{dir:'01-australia'},customWorld:cw};
 return new Function('trackData','readStoredCircuitJson','authoredStructureZoneAtS',
  'trackRoadWidthAt','APEX_BASE_CIRCUIT_JSON_BY_ID','apexReadUserCircuitJson',
  policy+snippet+'return envProfile;')(
  td,()=>json,()=>null,()=>12,base,()=>user);
};
const active={authoritative:true,surfaceZones:[{kind:'SAND',points:[[0,0],[1,0],[1,1]]}]};
const inherited={environment:{surfaces:{runoffSurface:'ASPHALT',offSurface:'GRASS'}}};
const svg=mock(active,inherited);
assert.equal(svg(50).runoffSurface,'GRASS',
 'inherited BASE asphalt is NOT an explicit SVG shoulder material');
assert.equal(svg(50).offSurface,'GRASS');
assert.equal(mock({authoritative:true,surfaceZones:[]},inherited)(50).runoffSurface,'ASPHALT',
 'without authored zones retain legacy fallback');
assert.equal(mock({authoritative:false,surfaceZones:[{}]},inherited)(50).runoffSurface,'ASPHALT');
assert.equal(mock(active,{environment:{surfaces:{runoffSurface:'GRAVEL'}}},{
 environment:{surfaces:{runoffSurface:'GRAVEL'}}})(50).runoffSurface,'GRAVEL',
 'explicit different user JSON material remains authoritative');
assert.equal(mock(active,inherited,{
 environment:{surfaces:{runoffSurface:'ASPHALT'}}})(50).runoffSurface,'GRASS',
 'a copied baseline JSON does not silently force all margins to be paved');
assert.equal(mock(active,inherited,{
 environment:{surfaces:{runoffSurface:'ASPHALT'},runoffFallbackPolicy:'JSON'}})(50).runoffSurface,'ASPHALT',
 'an explicit user opt-in can preserve generic asphalt');
assert.match(core,/if\(left!==null\)paint\(left,cL\)/);
assert.match(core,/if\(right!==null\)paint\(right,cR\)/);
const revision=Number(world.match(/const APEX_CIRCUIT_COMPILE_REV=(\d+);/)?.[1]);
assert.ok(revision>=230694,'old persisted terrain polygons MUST be invalidated');
assert.match(world,/cached\.revision===APEX_CIRCUIT_COMPILE_REV/);
assert.match(world,/cached\.fingerprint===fingerprint/);
assert.match(world,/\$\{APEX_CIRCUIT_COMPILE_REV\}\|\$\{dir\}/);
assert.match(core,/compileRevision:trackData\._compileStats\?\.revision/);
console.log(JSON.stringify({test:'svg-runoff-cache-v1528-preview',grassyUnpaintedMargins:true,
 explicitSvgSurfacesPreserved:true,legacyUnaffected:true,explicitJsonOverride:true,
 terrainCacheRevision:revision,previewOnly:true,ok:true}));
