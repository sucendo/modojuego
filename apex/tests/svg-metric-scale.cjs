'use strict';
// APEX: one physical metre per world unit for all imported SVG circuits,
// regardless of authoring canvas, nested scale or viewBox.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'circuits/manifest.json'),'utf8'));
const importer=fs.readFileSync(path.join(root,'parts/part-023.txt'),'utf8');
assert.match(importer,/const scale=\(km\*1000\)\/\(plen\|\|1\)/,
 'All circuits must calibrate the whole SVG against their physical lap length');
assert.match(importer,/const toWorld=p=>\[\(p\[0\]-origin\[0\]\)\*scale,-\(p\[1\]-origin\[1\]\)\*scale\]/,
 'Authoring scale must be applied to all SVG geometry, not only the centerline');
assert.match(importer,/window\.apexSvgMetricScaleInfo/,
 'Require an introspectable metre-per-SVG-unit scale');

function metricPerimeter(svg){
 const tag=svg.match(/<path\b[^>]*\bid="track_centerline"[^>]*>/);
 assert.ok(tag,'Authoritative track_centerline path missing');
 const d=(tag[0].match(/\bd="([^"]*)"/)||[])[1];
 assert.ok(d&&d.includes(' L '),'The saved circuit needs a polyline track centerline');
 const coords=[...d.matchAll(/(?:M|L)\s+([-+\d.]+)[,\s]+([-+\d.]+)/g)]
   .map(a=>[Number(a[1]),Number(a[2])]);
 assert.ok(coords.length>200,'The sampled centreline must be detailed');
 let len=0;
 for(let i=0;i<coords.length;i++){
  const a=coords[i],b=coords[(i+1)%coords.length];
  len+=Math.hypot(b[0]-a[0],b[1]-a[1]);
 }
 const ownScale=tag[0].match(/\btransform="scale\(([-+\d.eE]+)\)"/);
 const localScale=ownScale?Number(ownScale[1]):1;
 assert.ok(Number.isFinite(localScale)&&localScale>0);
 return len*localScale;
}
const lengths={'01-australia':5278,'14-spain':5414};
const info={};
for(const [id,metres] of Object.entries(lengths)){
 const entry=manifest.circuits[id];
 assert.ok(entry&&entry.exactSvg,'Authoritative saved edition absent: '+id);
 const svg=fs.readFileSync(path.join(root,'circuits',entry.svg),'utf8');
 assert.equal((svg.match(/<image\b/g)||[]).length,0,'Simulator SVG must be vector-only: '+id);
 const nativeUnits=metricPerimeter(svg);
 const metresPerSvgUnit=metres/nativeUnits;
 const worldPerimeter=nativeUnits*metresPerSvgUnit;
 assert.ok(Number.isFinite(metresPerSvgUnit)&&metresPerSvgUnit>.1);
 assert.ok(Math.abs(worldPerimeter-metres)<1e-7,'Physical scale drift: '+id);
 info[id]={svgPerimeterUnits:Number(nativeUnits.toFixed(2)),
  metresPerSvgUnit:Number(metresPerSvgUnit.toFixed(5)),
  physicalMetres:metres};
}
assert.ok(info['01-australia'].metresPerSvgUnit>3.5,
 'Melbourne SVG uses smaller native authoring units than Madrid');
assert.ok(Math.abs(info['14-spain'].metresPerSvgUnit-1)<.01,
 'Madrid is the ~1 metre per SVG unit calibration reference');
const newSvg=fs.readFileSync(path.join(root,'circuits',manifest.circuits['01-australia'].svg),'utf8');
assert.equal((newSvg.match(/data-apex-role="grandstand"/g)||[]).length,30,
 'Latest Melbourne SVG contains 29 active grandstands and one library template');
assert.equal((newSvg.match(/data-apex-role="pedestrian-bridge"/g)||[]).length,9,
 'All 8 active footbridges and one library template must remain');
assert.equal((newSvg.match(/data-apex-role="city-road-polyline"/g)||[]).length,3,
 'Both new city roads and the library example must remain');
console.log(JSON.stringify({test:'svg-metric-scale',worldScale:'1 metre per world metre',
 authoringScaleDifferent:true,info,ok:true}));
