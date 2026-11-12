'use strict';
// V15.1 preview-only road material regression. No browser/FPS claims.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const canvas=read('parts/part-024-bridgefull-preview.txt'),
 webgl=read('parts/part-025-bridgefull-trees3d-preview.txt'),
 preview=read('perf6a-preview.html'),production=read('apex.html');
const begin=canvas.indexOf('// 6A V15.1: asphalt colour'),end=canvas.indexOf('function apexWebglRoadBase(',begin);
assert.ok(begin>=0&&end>begin,'shared preview V15.1 material must precede the road renderer');
assert.match(preview,/part-024-bridgefull-preview\.txt/);
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.doesNotMatch(production,/part-024-bridgefull-preview|part-025-bridgefull-trees3d-preview/);
const source=canvas.slice(begin,end);
new vm.Script(source);
assert.match(canvas,/drawCamQuadTriangles\(V0\.l,V0\.r,V1\.r,V1\.l,pitch,apexRoadMaterialColorV15\(seg\)\)/);
assert.match(webgl,/function webglCircuitRoadColor\(seg\)\s*\{[\s\S]*?return apexRoadMaterialColorV15\(seg\)/);
assert.match(canvas,/apexPhase6QueueRoadBase\(seg,colors,road,cheap,show\)/,'phase-6 GPU batching must remain');
assert.match(webgl,/if\(s\.groupCount>=64\)/,'colour palette cannot escape its phase-6 limit');
const element=(attrs={},style={})=>({getAttribute:name=>attrs[name]??null,style});
const make=(svgRoot={},svgTrack=null,rawSvg='<svg/>')=>{
 let parsed=0,reads=0,wet=0,dark=0,baseRoad='#34383c';
 class DOMParserMock{parseFromString(){parsed++;return{documentElement:{
  getAttribute:name=>svgRoot[name]??null,
  querySelector:()=>svgTrack
 }}}}
 const context={
  trackData:{spec:{dir:'14-spain'}},
  readEffectiveTrackSvg:()=>{reads++;return rawSvg===null?null:{rawSvg}},
  DOMParser:DOMParserMock,
  apexWeatherWetFactor:()=>wet,apexWeatherDarkness:()=>dark,
  palette:()=>({road:baseRoad}),
  shadeColor:(base,n)=>base+':'+n
 };
 vm.runInNewContext(source+';this.materialV15={road:apexRoadSvgBaseColorV15,color:apexRoadMaterialColorV15,step:apexRoadTextureStepV15};',context);
 return {api:context.materialV15,context,stats:()=>({parsed,reads}),
  weather:(w,d=0)=>{wet=w;dark=d},setPalette:c=>{baseRoad=c}};
};
const seg=(x,z,dist=30)=>({a:{s:x,q:{x,z}},b:{s:x+2,q:{x:x+2,z}},z:dist});
const authored=make({'data-apex-road-color':'#345678'},element({'data-apex-color':'#ff0000'},{stroke:'#00ff00'}));
assert.equal(authored.api.road(),'#345678','root road colour must override track stroke');
assert.equal(authored.api.road(),'#345678');
assert.equal(authored.stats().parsed,1,'SVG parsed once per track, never per draw');
assert.equal(authored.stats().reads,1);
const fromStroke=make({},element({stroke:'rgb(51, 55, 59)'},{stroke:'rgb(51, 55, 59)'}));
assert.equal(fromStroke.api.road(),'#33373b','RGB from Boxy must be normalized for shadeColor');
assert.ok(fromStroke.api.color(seg(10,30)).startsWith('#33373b:'));
const fromAttribute=make({},element({'data-apex-color':'#789abc'},{stroke:'#ffff00'}));
assert.equal(fromAttribute.api.road(),'#789abc');
const fromShortHex=make({},element({stroke:'#abc'},{stroke:'#abc'}));
assert.equal(fromShortHex.api.road(),'#aabbcc');
const fallback=make({},null,null);
assert.equal(fallback.api.road(),null);
assert.ok(fallback.api.color(seg(10,20)).startsWith('#34383c:'),'non-SVG circuits retain the palette');
const bad=make({},element({stroke:'url(#gradient)'},{stroke:'none'}));
assert.equal(bad.api.road(),null,'SVG gradients must not turn the asphalt white');
const first=authored.api.color(seg(120,34,40));
assert.equal(first,authored.api.color(seg(120,34,40)),'world-anchored texture must be deterministic');
authored.weather(1,.5);
assert.notEqual(first,authored.api.color(seg(120,34,40)),'wet authored asphalt must darken');
const shades=new Set(),textures=new Set();
for(let x=0;x<150;x+=2)for(let z=0;z<70;z+=7){
 textures.add(authored.api.step(x,z));
 for(const d of [20,90,190,350])shades.add(fallback.api.color(seg(x,z,d)));
}
assert.ok(textures.size>=4&&textures.size<=5,'aggregate must have subtle, quantised variation');
assert.ok(shades.size*3+4<=64,'three asphalt bands and kerbs must fit GPU colour groups');
console.log(JSON.stringify({test:'asphalt-material-v15-preview',svgPriority:true,svgReadOnce:true,canvas:true,webgl:true,weather:true,textureLevels:textures.size,materialGroupsBudget:shades.size*3+4,ok:true}));
