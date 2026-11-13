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
const snippet=slice(core,'function envProfile(', 'function finalizeEnvForTrack(');
const mock=(cw,json={})=>new Function('trackData','readStoredCircuitJson','authoredStructureZoneAtS','trackRoadWidthAt',snippet+
 'return envProfile;')({spec:{dir:'01-australia'},customWorld:cw},()=>json,()=>null,()=>12);
const svg=mock({authoritative:true,surfaceZones:[{kind:'SAND',points:[[0,0],[1,0],[1,1]]}]});
assert.equal(svg(50).runoffSurface,'GRASS','unpainted SVG margin must not be asphalt by default');
assert.equal(svg(50).offSurface,'GRASS');
assert.equal(mock({authoritative:true,surfaceZones:[]})(50).runoffSurface,'ASPHALT',
 'without authored surface evidence the legacy material is unchanged');
assert.equal(mock({authoritative:false,surfaceZones:[{}]})(50).runoffSurface,'ASPHALT');
assert.equal(mock({authoritative:true,surfaceZones:[{}]},{
 environment:{surfaces:{runoffSurface:'GRAVEL',offSurface:'DIRT'}}})(50).runoffSurface,'GRAVEL',
 'explicit circuit profile remains authoritative');
assert.equal(mock({authoritative:true,surfaceZones:[{}]},{
 environment:{surfaces:{runoffSurface:'ASPHALT'}}})(50).runoffSurface,'ASPHALT',
 'explicit paved shoulders remain intact');
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
