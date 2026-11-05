'use strict';
// Saved Madrid line and the production SVG exporter share the same semantic
// racing-line role. It is an editable illustration, never a track edge/wall.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const svg=fs.readFileSync(path.join(base,'circuits/svg/apex26_14-madrid-spain_2026-11-03.svg'),'utf8');
const source=fs.readFileSync(path.join(base,'parts/part-023.txt'),'utf8');
const getPath=id=>{
 const p=svg.match(new RegExp('<path\\b[^>]*\\bid="'+id+'"[^>]*>'));
 assert.ok(p,'Missing SVG path '+id);
 const d=p[0].match(/\bd="([^"]+)"/);assert.ok(d,'Missing path d for '+id);
 return [...d[1].matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],+m[2]]);
};
const track=getPath('track_centerline'),line=getPath('apex_ideal_racing_path');
assert.equal(line.length,track.length,'SVG ideal route must cover every centreline sample');
assert.ok(line.length>900);
let offsetMax=0,offsetSum=0;
for(let i=0;i<line.length;i++){
 const d=Math.hypot(line[i][0]-track[i][0],line[i][1]-track[i][1]);
 assert.ok(Number.isFinite(d)&&d<=4.205,'Ideal line escaped the safe track corridor at '+i);
 offsetMax=Math.max(offsetMax,d);offsetSum+=d;
}
assert.ok(offsetSum/line.length>.25,'Racing reference must actually seek the faster line instead of copying the centreline');
const paths=svg.match(/data-apex-role="racing-line"/g)||[];
assert.equal(paths.length,2,'One live line plus one Elements-library sample');
const group=svg.match(/<g id="apex_ideal_racing_line"[^>]*>/)?.[0]||'';
assert.match(group,/data-apex-visual-only="true"/);
assert.match(svg,/data-apex-library-label="TRAZADA IDEAL"/);
assert.match(svg,/data-apex-library-category="TRACK"/);
assert.match(svg,/data-apex-racing-line-authoritative="true"/);
assert.ok(!/data-apex-type="(?:track|trackEdge|wall)"/.test(svg.match(/<path[^>]*id="apex_ideal_racing_path"[^>]*>/)?.[0]||''),'Ideal line is not asphalt or a collision edge');
assert.match(source,/function apexRuntimeIdealRacingLineSvg\(svgCtx=null\)/,'Runtime exporter must use the actual AUT reference');
assert.match(source,/trackData&&trackData\.model&&trackData\.model\.driver/);
assert.match(source,/apexRuntimeIdealRacingLineSvg\(terrainExportCtx\)/);
assert.match(source,/!apexExportHasRole\(root,'racing-line'\)/,'Preserve manually edited lines');
assert.match(source,/String\(el\.getAttribute\('data-apex-role'\)\|\|''\)\.toLowerCase\(\)!=='racing-line'/,'Racing layer must never be imported as a 3D landmark');
console.log(JSON.stringify({test:'svg-ideal-racing-line',points:line.length,maxLateralDeviationM:Number(offsetMax.toFixed(3)),meanLateralDeviationM:Number((offsetSum/line.length).toFixed(3)),librarySample:true,preservedAuthored:true,passed:true}));
