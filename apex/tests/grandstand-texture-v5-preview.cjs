'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const canvas=read('parts/part-024-bridgefull-preview.txt'),
 webgl=read('parts/part-025-bridgefull-trees3d-preview.txt'),
 preview=read('perf6a-preview.html'),production=read('apex.html'),
 sponsor=read('js/sponsor-textures.js');
assert.match(preview,/part-024-bridgefull-preview\.txt/);
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.doesNotMatch(production,/part-024-bridgefull-preview|part-025-bridgefull-trees3d-preview/);
assert.match(sponsor,/function registerCanvas\(key,canvas\)/);
assert.match(sponsor,/registerCanvas,ensureTexture/);
assert.match(sponsor,/gl\.LINEAR_MIPMAP_LINEAR/);
assert.match(webgl,/apexGrandstandTextureQueuePolyGl\(/);
assert.match(webgl,/apexGrandstandTextureQueuePolyGl\(strip,/);
assert.match(webgl,/if\(!textureCrowd\|\|!texturedStrips\)for\(const tile of apexGrandstandCrowdMosaic/);
assert.match(canvas,/apexGrandstandTextureDrawPolyCanvas\(/);
assert.match(canvas,/apexGrandstandTextureV5Keys\.crowd,pitch/);
assert.match(canvas,/apexGrandstandSeatTextureKeyV10\(prof\),pitch/);
const a=canvas.indexOf('const apexGrandstandTextureV5Keys='),b=canvas.indexOf('// 6A preview · Tribunas v3',a);
assert.ok(a>=0&&b>a,'Grandstand texture v5 functions must be shared before both render paths');
const snippet=canvas.slice(a,b);
const textureSource=sponsor.replace('(function(global){','(function(global){');
const textureWindow={},context={window:textureWindow,Image:undefined};
vm.runInNewContext(textureSource,context);
const tex=textureWindow.ApexSponsorTextures;
const originalSponsors=Object.keys(tex.assets);
assert.match(canvas,/function apexGrandstandRakedSeatV6\(band,frame,h,cam,offset=0,it=null,section=null\)/);
assert.match(canvas,/const raked3=prof\.hybridGrandstand&&frame\?apexGrandstandRakedSeatV6/);
assert.match(webgl,/const raked=prof\.hybridGrandstand&&frame\?apexGrandstandRakedSeatV6/);
assert.match(canvas,/for\(const face of apexGrandstandEnclosureV12\(frame,h,prof,cam,it\)\)/);
assert.match(webgl,/for\(const face of apexGrandstandEnclosureV12\(frame,h,prof,cam,it\)\)/);
assert.doesNotMatch(canvas,/if\(!prof\.hybridGrandstand\)for\(let j=0;j<backBand\.length/);
assert.doesNotMatch(webgl,/if\(!prof\.hybridGrandstand\)for\(let j=0;j<backBand\.length/);
assert.doesNotMatch(canvas,/if\(!prof\.hybridGrandstand\)\{polyCam\(leftWall/);
assert.doesNotMatch(webgl,/if\(!prof\.hybridGrandstand\)\{webglPushCamPoly\(leftWall/);
assert.match(canvas,/polyCam\(\[low3\[j\],low3\[k\],raked3\[k\],raked3\[j\]\]/,'Canvas steps cannot hide seats');
assert.match(webgl,/webglPushCamQuad\(low\[j\],low\[k\],raked\[k\],raked\[j\]/,'WebGL steps cannot hide seats');
assert.match(canvas,/apexGrandstandRakedSeatV6\(aisle,frame,h,cam,\.038,it,level\)/);
assert.match(webgl,/apexGrandstandRakedSeatV6\(aisle,frame,h,cam,\.038,it,level\)/);

// V13 front banners: deterministic varied cloth flags on the outer face.
// Geometry comes from one shared helper, so Canvas/WebGL cannot diverge.
assert.match(canvas,/for\(const banner of apexGrandstandHangingFlagsV13\(it,frame,h,gb,prof,cam\)\)/);
assert.match(webgl,/for\(const banner of apexGrandstandHangingFlagsV13\(it,frame,h,gb,prof,cam\)\)/);
assert.match(canvas,/polyCam\(banner\.poly,banner\.color,null,1,\.995\)/);
assert.match(webgl,/webglPushCamPoly\(banner\.poly,pitch,banner\.color,\.60,-\.021\)/);
const flagsStart=canvas.indexOf('// 6A V13: inexpensive, deterministic cloth banners'),
 flagsEnd=canvas.indexOf('// Preview 6A V12:',flagsStart);
assert.ok(flagsStart>=0&&flagsEnd>flagsStart,'Shared V13 banner helper missing');
const flagsWindow={};
let flagPressure=0,flagMobile=false;
const hash32=x=>(Math.imul((x|0)^((x|0)>>>16),0x9e3779b1)>>>0);
const standPhase=stand=>{
 const name=String(stand.sourceId||stand.name||'default');
 let n=0;for(let i=0;i<name.length;i++)n=Math.imul(n+name.charCodeAt(i),16777619)>>>0;
 return (n>>>0)/4294967296;
};
const flagFn=new Function('window','apexGrandstandWorldCam','apexGrandstandHashV8',
 'apexGrandstandStandPhaseV8','apexSceneDetailBudget','mobilePerformanceMode',
 canvas.slice(flagsStart,flagsEnd)+';return apexGrandstandHangingFlagsV13;')(
 flagsWindow,(fr,u,depth,y)=>({x:u*fr.span,y,z:depth}),
 hash32,standPhase,()=>({pressure:flagPressure}),()=>flagMobile);
const flagFrame={span:95,depth:18,edge:{a:[0,0],b:[95,0],tx:1,tz:0,nx:0,nz:1}},
 flagStand={sourceId:'front-grandstand-spain',anchor:{x:0,z:0}},
 flagProfile={hybridGrandstand:true,covered:true},
 nearFlags=flagFn(flagStand,flagFrame,14,{tier:2},flagProfile,{});
const kindCount=(items,kind)=>items.filter(x=>x.kind===kind).length;
assert.ok(kindCount(nearFlags,'fabric')>=6,'Several front cloth flags must be rendered');
assert.ok(kindCount(nearFlags,'fabric')<=18,'Avoid creating hundreds of flag panels');
assert.ok(kindCount(nearFlags,'hem')>=2,'Near spectator stands need visible hanging ties');
assert.ok(nearFlags.every(f=>f.poly.length===4&&f.poly.every(p=>[p.x,p.y,p.z].every(Number.isFinite))),
 'Banners must have valid projected quads');
assert.ok(nearFlags.every(f=>f.poly.every(p=>p.z<0)),
 'Flags must hang on the OUTSIDE of the front wall, never through spectators');
assert.ok(nearFlags.every(f=>f.poly.every(p=>p.y>=0&&p.y<14*.20)),
 'Front cloth must remain below the first row of fans');
assert.equal(flagsWindow.apexGrandstandFlagsV13Info().builds,1);
assert.deepEqual(flagFn(flagStand,flagFrame,14,{tier:2},flagProfile,{}),nearFlags,
 'Flag positions and colours must remain stable across frames');
assert.ok(flagsWindow.apexGrandstandFlagsV13Info().hits>=1,
 'World flag layout must be cached rather than regenerated every frame');
const midFlags=flagFn(flagStand,flagFrame,14,{tier:1},flagProfile,{});
const farFlags=flagFn(flagStand,flagFrame,14,{tier:0},flagProfile,{});
assert.ok(midFlags.length<=nearFlags.length&&farFlags.length<nearFlags.length,
 'Flag density should fall with distance');
flagPressure=3;flagMobile=true;
const busyFlags=flagFn(flagStand,flagFrame,14,{tier:2},flagProfile,{});
assert.ok(busyFlags.length<nearFlags.length&&busyFlags.length>0,
 'Mobile/low FPS requires fewer front flags but must not drop all of them');
assert.deepEqual(flagFn(flagStand,flagFrame,14,{tier:2},{hybridGrandstand:false},{}),[]);
assert.deepEqual(flagFn(null,flagFrame,14,{tier:2},flagProfile,{}),[]);
const palettes=new Set();
flagPressure=0;flagMobile=false;
for(const suffix of ['madrid','melbourne','jarama','monza','le-mans','nurburgring','singapore']){
 const out=flagFn({sourceId:suffix},flagFrame,14,{tier:2},flagProfile,{});
 for(const p of out)if(p.flag)palettes.add(p.flag);
}
assert.ok(palettes.size>=3,'Grandstands should not all hang the same national flag pattern');
assert.match(canvas,/if\(gb\.flags\)\{const flagPos=/,'Existing top pole flags must remain on near stands');
assert.match(webgl,/if\(gb\.flags\)\{const flagPos=/,'WebGL must preserve top pole flags');

// V12 enclosure geometry is shared by Canvas and WebGL. No plane is allowed
// to cut through seating at the previous inner u=.02-.10/.90-.98 strips.
const enclStart=canvas.indexOf('function apexGrandstandEnclosureV12('),
 enclEnd=canvas.indexOf('// 6A preview v5',enclStart);
assert.ok(enclStart>0&&enclEnd>enclStart,'Missing shared V12 closure helper');
const closureCode=canvas.slice(enclStart,enclEnd);
const enclosure=new Function('apexGrandstandWorldCam','apexStaticSceneryGroundY','worldToCamera',
 closureCode+';return apexGrandstandEnclosureV12;')(
 (frame,u,depth,y)=>({x:u*frame.span,y,z:depth}),()=>0,(x,y,z)=>({x,y,z}));
const encFrame={span:64,depth:16,edge:{a:[0,0],b:[64,0],tx:1,tz:0,nx:0,nz:1}};
const openEnclosure=enclosure(encFrame,14,{hybridGrandstand:true,covered:false},{});
const coveredEnclosure=enclosure(encFrame,14,{hybridGrandstand:true,covered:true},{});
assert.equal(openEnclosure.length,7,'Open tribune should close front, sides, rear and foundation without a roof');
assert.equal(coveredEnclosure.length,10,'Covered tribune should add roof side fascia and upper rear closure');
for(const [variant,faces] of [['open',openEnclosure],['covered',coveredEnclosure]]){
 const groups=kind=>faces.filter(p=>p.kind===kind);
 assert.equal(groups('frontWall').length,1,variant+' front is missing');
 assert.equal(groups('sideWall').length,2,variant+' side walls are missing');
 assert.equal(groups('rearWall').length,variant==='covered'?2:1,variant+' rear is missing');
 assert.equal(groups('skirt').length,3,variant+' lower foundation skirts are missing');
 assert.equal(groups('roofFascia').length,variant==='covered'?2:0,variant+' roof edges inconsistent');
 assert.ok(faces.every(f=>f.poly.length===4&&f.poly.every(p=>[p.x,p.y,p.z].every(Number.isFinite))),
  variant+' closure has invalid projected coordinates');
 const sides=groups('sideWall');
 assert.ok(sides.every(f=>f.poly.every(p=>p.x===0||p.x===64)),
  variant+' side walls must stay on the perimeter instead of hiding spectators');
 const rear=groups('rearWall')[0];
 assert.ok(rear.poly.every(p=>p.z>15.8),'Rear wall should stay flush with the rear of the stand');
 assert.ok(Math.max(...groups('frontWall')[0].poly.map(p=>p.y))<=14*.12+1e-8,
  'First row must remain unobstructed by the front wall');
}
assert.equal(enclosure(encFrame,14,{hybridGrandstand:false,covered:true},{}).length,0);
assert.equal(enclosure(null,14,{hybridGrandstand:true},{}).length,0);

// The actual outline of an irregular authored stand must be closed, not an
// approximate rectangle that protrudes beyond the polygon in corners.
const trapezoid={worldFootprint:[[0,0],[64,0],[54,16],[12,16]]};
const shapeFaces=enclosure(encFrame,14,{hybridGrandstand:true,covered:false},{},trapezoid);
const ends=shapeFaces.filter(f=>f.kind==='sideWall');
assert.equal(ends.length,2,'Irregular SVG should still have precisely two solid end walls');
assert.ok(ends.some(f=>f.poly.some(p=>p.x===54))&&ends.some(f=>f.poly.some(p=>p.x===12)),
 'Side wall endpoints must respect actual authored rear footprint vertices');
assert.ok(ends.every(f=>f.poly.every(p=>p.x>=0&&p.x<=64)),
 'Irregular SVG closures must not extend beyond the hand-drawn boundary');

assert.equal(originalSponsors.length,7,'Existing sponsor texture catalog must be unchanged');
assert.equal(tex.registerCanvas('invalid',null),null);
let drawCalls=0;
const mockCtx={
 fillStyle:null,beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},
 ellipse(){},fillRect(){drawCalls++;},scale(){},drawImage(){}
};
const document={createElement:()=>({width:0,height:0,getContext:()=>mockCtx})};
const deckClip=(poly,scalar,bound,above)=>{
 const inside=p=>above?scalar(p)>=bound-1e-8:scalar(p)<=bound+1e-8;
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],ain=inside(a),bin=inside(b);
  if(ain)out.push(a);
  if(ain!==bin){const t=(bound-scalar(a))/(scalar(b)-scalar(a));
   out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
 }
 return out;
};

const frame={span:64,depth:16,edge:{a:[0,0],b:[64,0],tx:1,tz:0,nx:0,nz:1}};
const seatTop=(h,p,g,t)=>h*(.2+.6*Math.ceil(Math.max(.001,t)*10)/10)+.10;
let pressure=0,mobile=false;
const factory=new Function('window','document','trackData','apexGrandstandSeatTopV4',
 'apexGrandstandWorldCam','apexSceneDetailBudget','mobilePerformanceMode','clamp',
 'apexGrandstandBand','apexClipWorldPolygonScalar','apexStaticSceneryGroundY','worldToCamera',
 snippet+'\nreturn {ready:apexGrandstandTexturesV5Ready,seat:apexGrandstandSeatTextureV5Vertices,crowd:apexGrandstandCrowdTextureV5Strips,deck:apexGrandstandCrowdDeckV8,deckStats:apexGrandstandDeckV8Stats,stats:apexGrandstandTextureV5Stats,keys:apexGrandstandTextureV5Keys,seatKey:apexGrandstandSeatTextureKeyV10};');
const trackData={spec:{dir:'01-australia'}};
const renderer=factory(textureWindow,document,trackData,seatTop,
 (frame,u,depth,y)=>({x:u*frame.span,y,z:depth}),()=>({pressure}),()=>mobile,(x,a,b)=>Math.max(a,Math.min(b,x)),
 (fp,anchor,side,lo,hi)=>deckClip(deckClip(fp,p=>p[1],lo*frame.depth,true),p=>p[1],hi*frame.depth,false),
 deckClip,()=>0,(x,y,z)=>({x,y,z}));
assert.equal(renderer.ready({}),false);
assert.equal(renderer.ready({hybridGrandstand:true,melbourne:false,seat:'#24333e'}),true);
assert.equal(renderer.ready({hybridGrandstand:true,melbourne:true}),true);
assert.equal(renderer.ready({hybridGrandstand:true,melbourne:true}),true);
assert.equal(renderer.stats.atlasBuilds,1,'The common crowd atlases must be generated only once');
assert.ok(tex.entry(renderer.seatKey({hybridGrandstand:true,madrid:true,seat:'#24333e'})),'Madrid should have its own tinted seat atlas');
assert.notEqual(renderer.seatKey({melbourne:true}),renderer.seatKey({madrid:true,seat:'#24333e'}));
assert.equal(renderer.seatKey({hybridGrandstand:true,seat:'rgb(61, 78, 99)'}),'apex-grandstand-seats-v10-3d4e63');
assert.ok(renderer.ready({hybridGrandstand:true,seat:'rgb(61, 78, 99)'}),'CSS RGB colours from SVG must receive a seat atlas');
assert.equal(renderer.ready({hybridGrandstand:true,seat:'#7c8c99'}),true,'Neutral circuit also textures');
assert.ok(drawCalls>100,'Real seat/crowd pixels must be rasterized');
assert.equal(Object.keys(tex.assets).length,originalSponsors.length);
for(const [kind,key] of Object.entries(renderer.keys)){
 const item=tex.entry(key);
 assert.equal(item.status,'ready');
 assert.equal(item.canvas.width,kind==='seats'?1024:2048);
 assert.equal(item.canvas.height,kind==='seats'?256:512);
 assert.equal(tex.load(key),item,'Dynamic texture should be cached');
}
assert.equal(Object.keys(renderer.keys).length,3,'Seats, crowd and full-deck crowd use three shared atlases');
assert.match(canvas,/for\(let row=0;row<4;row\+\+\)for\(let i=0;i<64;i\+\+\)/,'256 different spectator sprites in one crowd atlas');
assert.match(canvas,/const rows=30,columns=112/,'Crowd deck must tightly pack spectators in every row');
assert.match(canvas,/apexGrandstandStandPhaseV8\(it\)/,'Deck must vary UV phase by grandstand');
assert.match(webgl,/apexGrandstandTextureQueuePolyGl\(panel,apexGrandstandTextureV5Keys\.deck/);
assert.match(canvas,/apexGrandstandTextureDrawPolyCanvas\(panel,apexGrandstandTextureV5Keys\.deck/);
const band=[[0,8],[64,8],[64,9.6],[0,9.6]],top=band.map(p=>({x:p[0],y:10,z:p[1]}));
const textured=renderer.seat(band,top,frame,5,10);
const rakedSource=canvas.slice(canvas.indexOf('function apexGrandstandRakedSeatYV6('),canvas.indexOf('// 6A preview · Tribunas v3'));
const raked=new Function('clamp','apexStaticSceneryGroundY','worldToCamera',
 rakedSource+';return {ramp:apexGrandstandRakedSeatV6,height:apexGrandstandRakedSeatYV6};')(
 (x,a,b)=>Math.max(a,Math.min(b,x)),()=>0,(x,y,z)=>({x,y,z}));
const ramp=raked.ramp([[0,0],[64,0],[64,16],[0,16]],frame,14,{});
assert.equal(ramp.length,4);
assert.ok(Math.abs(ramp[0].y-(14*.20+.11))<.0001,'Front seating must begin near the track');
assert.ok(Math.abs(ramp[2].y-(14*.80+.11))<.0001,'Rear seating rises by full stand height');
assert.ok(ramp[2].y-ramp[0].y>8,'Seating is inclined, never a thin top strip');
assert.equal(textured.length,4);
assert.ok(textured.every(p=>Number.isFinite(p.u)&&p.v>=0&&p.v<=1),'UV must stay finite/in-bounds per tier');
assert.ok(textured[1].u>textured[0].u,'UV repeats along grandstand span');
const full={crowd:true,fill:1,label:'full'},empty={crowd:false,fill:0,label:'empty'},
 half={crowd:true,fill:.58,label:'half'};
assert.doesNotMatch(canvas,/const textureCrowd=apexGrandstandTexturesV5Ready\(prof\)&&gb\.tier<2/,
 'Canvas must layer near 3D spectators over rear texture rows');
assert.doesNotMatch(webgl,/const textureCrowd=apexGrandstandTexturesV5Ready\(prof\)&&gb\.tier<2/,
 'WebGL must layer near 3D spectators over rear texture rows');
assert.match(canvas,/rowDepth=dep\*\(tierRow\?tierRow\.depthFraction/,
 'Near 3D spectators must live in front of rear texture rows');
for(const isMobile of [false,true]){
 mobile=isMobile;
 for(let p=0;p<=3;p++){
  pressure=p;
  for(const tier of [0,1,2]){
   const strips=renderer.crowd(frame,14,{rows:10,hybridGrandstand:true},{tier},full,{});
   assert.ok(strips.length>=5&&strips.length<=13,
    'Race stands must use dense rows even under max pressure: '+JSON.stringify({tier,p,isMobile,count:strips.length}));
   assert.ok(new Set(strips.map(q=>q[0].v.toFixed(5))).size>=3,'Crowd rows must select different sprite bands');
   assert.ok(new Set(strips.map(q=>q[0].u.toFixed(4))).size>=3,'Crowd row UV offsets must differ');
   const depths=strips.map(s=>s[0].z);
   assert.ok(depths.every((z,i)=>z>0&&z<frame.depth&&(i===0||z>depths[i-1]+.1)),
    'Rows must be separated and distributed over the ramp');
   assert.ok(depths[depths.length-1]-depths[0]>frame.depth*(tier===2?.32:.42),
    'Crowd must span a substantial portion of the seating deck, not form a top strip');
   assert.ok(strips.every(s=>s.length===4&&s.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&Number.isFinite(q.z))),
    'No degenerate crowd quad');
   assert.ok(strips.every(s=>s[0].y>s[3].y),'Crowd silhouettes must extend above the raked deck');
   assert.ok(strips.every(s=>{
     const depth=s[3].z;
     const ramp=14*(.20+.60*depth/frame.depth)+.11;
     return s[3].y>ramp+.14&&s[3].y<ramp+.19;
   }),'The standing texture feet must clear the actual raked deck by a small deterministic lift');
   assert.ok(strips.every(s=>s[1].u>s[0].u),'Atlas pattern must repeat across grandstand width');
   assert.ok(Math.min(...depths)<frame.depth*.14,'Lower spectator rows must appear at all LOD/pressure modes');
  }
 }
}
pressure=0;mobile=false;
const near=renderer.crowd(frame,14,{rows:10,hybridGrandstand:true},{tier:2},full,{}),
 medium=renderer.crowd(frame,14,{rows:10,hybridGrandstand:true},{tier:1},full,{}),
 partial=renderer.crowd(frame,14,{rows:10,hybridGrandstand:true},{tier:1},half,{});
assert.ok(near.length>=9,'Near stands need dense rear rows behind the 3D crowd');
assert.ok(medium.length>=9,'Medium stands need substantial spectator depth');
assert.ok(partial.length>0&&partial.length<medium.length,'Practice occupancy must stay partial');
assert.equal(renderer.crowd(frame,14,{rows:10,hybridGrandstand:true},{tier:0},empty,{}).length,0);
pressure=3;mobile=true;
const lowPerf=renderer.crowd(frame,14,{rows:10,hybridGrandstand:true},{tier:0},full,{});
assert.ok(lowPerf.length>=5,'Pressure may trim density, never collapse to a few rows');
// Full-deck decal: only race/qualifying, two clipped pieces and a central aisle.
// Cached polygon clipping remains stable as the camera moves.
const stand={sourceId:'test-grandstand',anchor:{x:3,z:7},side:1,
 worldFootprint:[[0,0],[64,0],[64,16],[0,16]]};
pressure=0;mobile=false;
const panels=renderer.deck(stand,{hybridGrandstand:true},frame,14,full,{});
assert.match(canvas,/Math\.max\(\.015,level\.d0\),Math\.min\(\.985,level\.d1\),it\)/, 'Each tier crowd deck must cover its whole surface');
assert.match(canvas,/frontTop=h\*\.12/, 'Front enclosure must stay below the first spectator tier');
assert.match(canvas,/kind==='rearWall'\?rearTop:h\*\(\.19\+\.60\*d\)/,
 'Side and rear closure follow the underside of the seating ramp');
assert.match(canvas,/baseTop3=apexGrandstandGroundCam\(fp,prof\.hybridGrandstand\?h\*\.07:h\*\.18,cam\)/,
 'Canvas original foundation wall must not cover the new fascia');
assert.match(webgl,/bt=apexGrandstandGroundCam\(fp,prof\.hybridGrandstand\?h\*\.07:h\*\.18,cam\)/,
 'WebGL original foundation wall must not cover the new fascia');
assert.match(canvas,/crowdBase=seat\+lift/,'Crowd strip feet must not remain at the seat origin');
assert.match(canvas,/p2=apexGrandstandWorldCam\(frame,\.982,depth,crowdBase,cam\)/);
assert.match(canvas,/p3=apexGrandstandWorldCam\(frame,\.018,depth,crowdBase,cam\)/);
assert.match(canvas,/apexGrandstandTierHeightV14\(tierRow\.section,rowDepth\/dep\)/,
 'Individual 3D bodies must rise above the slope, with stable variation');
assert.match(canvas,/apexGrandstandRakedSeatV6\(region,frame,h,cam,\.18,it,level\)/,
 'Deck must be slightly raised to avoid sinking under the seats');
assert.match(canvas,/start=tier===2\?\.035:\.025,end=\.975/, 'LOD must place standing crowd into front rows');
assert.ok(Math.min(...panels.flat().map(v=>v.v))<.06, 'Front of grandstand requires spectator coverage');
assert.ok(Math.max(...panels.flat().map(v=>v.v))>.94, 'Grandstand rear remains populated');
assert.equal(panels.length,2,'Race grandstand deck must fill both sides of central aisle');
assert.ok(panels.every(a=>a.length>=3&&a.every(p=>Number.isFinite(p.u)&&p.v>=0&&p.v<=1)),'Deck UVs should follow the sloped footprint');
const leftMax=Math.max(...panels[0].map(v=>v.x)),rightMin=Math.min(...panels[1].map(v=>v.x));
assert.ok(rightMin-leftMax>=1.9,'Keep central staircase/aisle free of the crowd decal');
assert.ok(panels.some(a=>Math.max(...a.map(v=>v.y))-Math.min(...a.map(v=>v.y))>5),'Crowd must cover the height of the raked seating');
assert.ok(panels.every(poly=>poly.every(v=>Math.abs(v.y-(14*(.20+.60*v.v)+.11+.18))<.00001)),
 'Crowd deck must sit 0.18 m above the raked stand across its whole depth');
assert.equal(renderer.deck(stand,{hybridGrandstand:true},frame,14,full,{}).length,2);
assert.equal(renderer.deckStats.builds,1,'Clip geometry must be cached, not rebuilt every frame');
assert.ok(renderer.deckStats.hits>=1);
assert.equal(renderer.deck(stand,{hybridGrandstand:true},frame,14,empty,{}).length,0,'Empty grandstands must have no crowd decal');
assert.equal(renderer.deck(stand,{hybridGrandstand:true},frame,14,half,{}).length,0,'Practice should use partial LOD sprites, not fully occupied deck');
// V14: stadium-style independent amphitheatres, not one continuous ramp.
// SVG attributes are explicit; if not supplied, both SVG and generated
// grandstands remain single tier without changing legacy behaviour.
const sectionsStart=canvas.indexOf('// V14: real independent amphitheatre decks'),
 sectionsEnd=canvas.indexOf('// 6A preview · Tribunas v3',sectionsStart);
assert.ok(sectionsStart>=0&&sectionsEnd>sectionsStart,'Missing shared 1/2/3 tier builder');
const levelsFn=new Function('clamp','apexGrandstandWorldCam','apexStaticSceneryGroundY','worldToCamera',
 canvas.slice(sectionsStart,sectionsEnd)+';return {sections:apexGrandstandTierSectionsV14,structure:apexGrandstandTierStructureV14,forRow:apexGrandstandTierSectionForRowV14,ramp:apexGrandstandRakedSeatV6};')(
 (x,a,b)=>Math.max(a,Math.min(b,x)),(frame,u,depth,y)=>({x:u*frame.span,y,z:depth}),
 ()=>0,(x,y,z)=>({x,y,z}));
for(const n of [1,2,3]){
 const tiers=levelsFn.sections(18,{tierCount:n,tierOverhangM:1.5},frame);
 assert.equal(tiers.length,n,'Exactly one deck per amphitheatre');
 assert.ok(tiers.every(t=>t.y1>t.y0&&t.d1>t.d0),'Each tier must rise independently');
 for(let i=1;i<tiers.length;i++){
  assert.ok(tiers[i].y0>tiers[i-1].y1+.3,'Upper amphitheatre must stand structurally ABOVE previous deck');
  assert.ok(tiers[i].d0<tiers[i-1].d1,'Upper amphitheatre must have a genuine overhang');
 }
 const structure=levelsFn.structure({tierCount:n,tierOverhangM:1.5},frame,18,{});
 assert.equal(structure.length,(n-1)*5,'Every upper tier needs concourse, fascia, underside, rail and beam');
 assert.ok(structure.every(f=>f.poly.length===4&&f.poly.every(p=>[p.x,p.y,p.z].every(Number.isFinite))),
  'Upper-tier 3D panels should remain valid');
 if(n>1){
  const multiStand={sourceId:'tier-'+n,anchor:{x:1,z:1},side:1,tierCount:n,tierOverhangM:1.5,
   worldFootprint:[[0,0],[64,0],[64,16],[0,16]]};
  const decks=renderer.deck(multiStand,{hybridGrandstand:true},frame,18,full,{});
  assert.equal(decks.length,n*2,'Every amphitheatre gets both sides of the central aisle textured');
  assert.ok(decks.every(d=>d.every(v=>Number.isFinite(v.y))),
   'No stretched texturing between levels');
  const spectators=renderer.crowd(frame,18,{hybridGrandstand:true},{tier:2},full,{},multiStand);
  assert.ok(spectators.length>=8,'Audience must populate the separate 3D levels');
  const vals=tiers.map(t=>spectators.filter(row=>row[0].z/frame.depth>=t.d0-.001&&row[0].z/frame.depth<=t.d1+.001));
  assert.ok(vals.every(x=>x.length>0),'Each tier requires spectators of its own');
 }
}
assert.match(canvas,/for\(const level of tierLevels\)\{for\(let ri=0;ri<tierRows;ri\+\+\)/);
assert.match(webgl,/for\(const level of tierLevels\)\{for\(let ri=0;ri<tierRows;ri\+\+\)/);
assert.match(canvas,/apexGrandstandTierStructureV14\(it,frame,h,cam\)/);
assert.match(webgl,/apexGrandstandTierStructureV14\(it,frame,h,cam\)/);
const activeSvgFiles=[
 ['circuits/svg/apex26_14-spain_circuito-propuesta-20261110.svg',54],
 ['circuits/svg/apex26_01-australia_circuito-propuesta-20261111-v2.svg',30]
];
for(const [file,count] of activeSvgFiles){
 const xml=read(file);
 const stands=[...xml.matchAll(/<(?:rect|polygon|path|g)\b[^>]*data-apex-type="grandstand"[^>]*>/g)].map(m=>m[0]);
 assert.equal(stands.length,count,'Active saved SVG grandstand count changed for '+file);
 for(const stand of stands)for(const attr of ['data-apex-height','data-apex-grandstand-style',
 'data-apex-roof','data-apex-tier-count','data-apex-front-edge',
 'data-apex-facing-offset-deg','data-apex-tier-overhang']){
  assert.ok(stand.includes(attr+'='),'Missing '+attr+' in '+file);
 }
 assert.ok(stands.every(v=>/data-apex-tier-count="[123]"/.test(v)),
  'Tier-count must be 1/2/3 on every saved SVG grandstand');
}
assert.match(canvas,/node\.tierCount=Number\.isInteger\(tierAttribute\)/);
assert.match(canvas,/node\.frontEdgeIndex=frontEdgeAttribute!==null/);
assert.match(canvas,/node\.facingOffsetDeg=Number\.isFinite\(offsetAttribute\)/);
const orientationSource=canvas.slice(canvas.indexOf('function apexGrandstandOutlineV14('),canvas.indexOf('function apexGrandstandBand('));
const orientation=new Function('nearestTrackState',orientationSource+';return apexGrandstandFrontEdge;')(
 (x,z)=>({dist:Math.abs(z)+3}));
const samples=[];
for(let x=0;x<=60;x+=5)samples.push([x,0]);
for(let y=5;y<=16;y+=5)samples.push([60,y]);
samples.push([60,16]);
for(let x=55;x>=0;x-=5)samples.push([x,16]);
for(let y=11;y>=0;y-=5)samples.push([0,y]);
const testFront={worldFootprint:samples,frontEdgeIndex:0,facingOffsetDeg:0};
const chosen=orientation(testFront);
assert.ok(chosen.len>50,'SVG front-edge must identify a complete side, not one sampled 5m segment');
assert.equal(chosen.source,'svg-front-edge');
assert.equal(testFront.worldFootprint,samples,'Orientation metadata cannot rewrite authored SVG footprint');
const autoFront=orientation({worldFootprint:samples});
assert.ok(autoFront.len>10,'Automatic front-facing detection must use logical edges');

// Universal coverage: retain explicit user-drawn SVG footprints, but enrich
// older calendar and extra-circuit landmarks that only have an anchor.
const syntheticSource=canvas.slice(canvas.indexOf('function apexGrandstandEnsureFootprintV10('),canvas.indexOf('function apexGrandstandFrontEdge('));
const makeFootprint=new Function('clamp','poseAt',syntheticSource+';return apexGrandstandEnsureFootprintV10;')(
 (x,a,b)=>Math.max(a,Math.min(b,x)),()=>({tx:1,tz:0,nx:0,nz:1}));
const builtInCircuits=['01-australia','14-spain','02-china','03-japan','04-bahrain','05-saudi-arabia','06-miami','07-imola',
 '08-monaco','09-canada','10-austria','11-great-britain','12-belgium','13-hungary','15-netherlands','16-italy',
 '17-azerbaijan','18-singapore','19-united-states','20-mexico','21-brazil','22-las-vegas','23-qatar','24-abu-dhabi',
 'jarama','le-mans','nurburgring-nordschleife','nurburgring-gp'];
for(const [i,circuit] of builtInCircuits.entries()){
 const stand={type:'grandstand',sourceId:circuit,anchor:{x:i*200,z:25,s:i*120,
  q:{tx:1,tz:0,nx:0,nz:1}},side:1,length:70+i%5*4,depth:12+i%4*2,height:13};
 const fp=makeFootprint(stand);
 assert.equal(fp.length,4,'Legacy grandstand missing universal world footprint in '+circuit);
 assert.ok(fp.every(p=>p.length===2&&p.every(Number.isFinite)),'Invalid footprint in '+circuit);
 assert.equal(makeFootprint(stand),fp,'Generated footprints must be reused, never remade per frame');
 assert.ok(stand._apexGrandstandGeneratedV10);
}
const noNormal={type:'grandstand',anchor:{x:80,z:20,q:{tx:1,tz:0}},side:-1,length:50,depth:14};
assert.equal(makeFootprint(noNormal).length,4,'Legacy anchor without precomputed track normals must work');
assert.ok(noNormal.worldFootprint.some(q=>q[1]<20),'Side placement must follow circuit normal');
const styleStart=canvas.indexOf('function apexGrandstandStyleProfile(it){');
const styleEnd=canvas.indexOf('// 6A V13:',styleStart);
assert.ok(styleStart>=0&&styleEnd>styleStart);
const makeProfile=new Function('trackData','shadeColor',
 canvas.slice(styleStart,styleEnd)+';return apexGrandstandStyleProfile;')(trackData,(color)=>color);
trackData.spec.dir='14-spain';
const madridProfile=makeProfile({grandstandStyle:'grandstand_covered',seatColor:'#aabbcc'});
assert.ok(madridProfile.madrid&&madridProfile.hybridGrandstand&&madridProfile.covered);
assert.equal(madridProfile.seat,'#aabbcc','Madrid SVG seat colour must survive');
for(const key of ['frontWall','sideWall','rearWall','skirt','roofFascia'])
 assert.ok(madridProfile[key], 'Madrid style missing enclosure palette '+key);
trackData.spec.dir='01-australia';
const melbourneProfile=makeProfile({grandstandStyle:'grandstand_covered'});
assert.ok(melbourneProfile.melbourne&&melbourneProfile.hybridGrandstand);
assert.notEqual(melbourneProfile.sideWall,madridProfile.sideWall,'Circuit-specific wall colours must be preserved');
trackData.spec.dir='nurburgring-long';
const extraProfile=makeProfile({grandstandStyle:'grandstand_open'});
assert.ok(extraProfile.hybridGrandstand&&!extraProfile.covered,'Extra circuit open tribunes stay uncovered');
for(const key of ['frontWall','sideWall','rearWall','skirt','roofFascia'])
 assert.ok(extraProfile[key], 'Extra-circuit enclosure is missing '+key);
const proceduralProfile=makeProfile({_apexGrandstandGeneratedV10:true});
assert.ok(proceduralProfile.hybridGrandstand&&proceduralProfile.covered,'Legacy covered tribunes keep their roof');
trackData.spec.dir='01-australia';
const svgStand={type:'grandstand',anchor:{x:0,z:0},worldFootprint:[[0,0],[5,0],[5,4],[0,4]]};
const authored=svgStand.worldFootprint;
assert.equal(makeFootprint(svgStand),authored,'User-authored SVG grandstand footprint must remain untouched');
assert.equal(svgStand._apexGrandstandGeneratedV10,undefined);
assert.match(canvas,/if\(apexGrandstandEnsureFootprintV10\(it\)\?\.length>=3\)/,'Canvas should render generated stands through same SVG path');
assert.match(webgl,/if\(apexGrandstandEnsureFootprintV10\(it\)\?\.length>=3\)/,'WebGL should render generated stands through same SVG path');
assert.doesNotMatch(canvas,/trackData\?\.spec\?\.dir!=='01-australia'\)return false/,'Texture system cannot be gated on Melbourne');
assert.doesNotMatch(canvas,/if\(!it\|\|!prof\?\.melbourne\|\|!frame/,'Deck texture cannot be Melbourne-only');
for(const [source,start,end] of [
 [canvas,'}else if(it.type==="grandstand"){','}else if(it.type==="billboard"||it.type==="advertising"){'],
 [webgl,"}else if(it.type==='grandstand'){","}else if(it.type==='gantry'){"]
]){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i);
 new Function('for(let k=0;k<1;k++){if(false){}'+source.slice(i+1,j)+'}}');
}
console.log(JSON.stringify({test:'grandstand-texture-v14-svg-amphitheatres-preview',atlases:3,vertices:textured.length,
 crowdMedium:medium.length,pressureCap:lowPerf.length,previewOnly:true,ok:true}));
