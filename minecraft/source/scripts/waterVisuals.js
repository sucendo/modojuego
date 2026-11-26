// v11.1: rendering only. No new blocks, physics, save fields or world generation.
// One shared clock drives every visible liquid surface, irrespective of chunk count.
const waterClock={value:0};
const waterAnimationTime={value:0};
const waterWaves={value:1};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));

const PALETTES=Object.freeze({
  river:{shallow:[.39,.72,.70],deep:[.085,.30,.45]},
  lake:{shallow:[.47,.75,.71],deep:[.09,.35,.49]},
  ocean:{shallow:[.34,.68,.77],deep:[.055,.22,.40]},
  jungle:{shallow:[.34,.70,.61],deep:[.065,.32,.33]},
  oasis:{shallow:[.49,.79,.67],deep:[.065,.42,.36]},
  frozen:{shallow:[.77,.88,.90],deep:[.52,.71,.81]},
  lava:{shallow:[1,.44,.11],deep:[.63,.11,.025]}
});

/** Pure depth tint: use this on the GPU vertex colors, not per frame on the CPU. */
export function waterDepthColor(kind,type,depth){
  const palette=PALETTES[kind==='river'&&type==='ocean'?'ocean':
    kind==='lake'&&type==='jungle'?'jungle':kind]||PALETTES.river;
  const mix=clamp((depth-.6)/5.6);
  const smooth=mix*mix*(3-2*mix);
  return palette.shallow.map((v,i)=>v+(palette.deep[i]-v)*smooth);
}

export function waterOpacity(kind,type){
  if(kind==='lava'||type==='lava')return .94;
  if(kind==='frozen')return .86;
  if(kind==='oasis')return .64;
  return type==='ocean'?.69:kind==='lake'?.58:.52;
}

/** Shader-local highlights: no extra geometry, render passes or texture fetches. */
export function applyWaterMotion(material,kind,withFalls=false,withTransition=false,withFlow=false){
  // Ice has a fixed surface. Its lighting and depth tint still respond to day/night.
  if(kind==='frozen')return material;
  const lava=kind==='lava';withFlow=withFlow&&!lava;
  material.onBeforeCompile=shader=>{
    shader.uniforms.waterClock=waterClock;
    shader.uniforms.waterWaves=waterWaves;
    if(withTransition||withFlow)shader.uniforms.waterAnimationTime=waterAnimationTime;
    shader.vertexShader=(withTransition?'attribute vec3 waterHeightMotion; attribute vec4 waterAlphaMotion; uniform float waterAnimationTime; varying float waterOpacityMix;\n':'')+'varying vec3 waterWorldPosition;\n'+
      (withFlow?'attribute vec2 waterFlow; varying vec2 waterCurrent; varying float waterSurfaceMix;\n'+(!withTransition?'uniform float waterAnimationTime;\n':''):'')+
      (withFalls?'attribute float waterFall; varying float waterfallMix;\n':'')+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n'+
      (withTransition?
        'float heightProgress=waterHeightMotion.z>0.0?clamp((waterAnimationTime-waterHeightMotion.y)/waterHeightMotion.z,0.0,1.0):1.0;\n'+
        'heightProgress=heightProgress*heightProgress*(3.0-2.0*heightProgress);\n'+
        'transformed.y=mix(waterHeightMotion.x,position.y,heightProgress);\n'+
        'float alphaProgress=waterAlphaMotion.w>0.0?clamp((waterAnimationTime-waterAlphaMotion.z)/waterAlphaMotion.w,0.0,1.0):1.0;\n'+
        'alphaProgress=alphaProgress*alphaProgress*(3.0-2.0*alphaProgress);\n'+
        'waterOpacityMix=mix(waterAlphaMotion.x,waterAlphaMotion.y,alphaProgress);\n':'')+
      'waterWorldPosition=(modelMatrix*vec4(transformed,1.0)).xyz;'+
      (withFlow?'\nwaterCurrent=waterFlow; waterSurfaceMix=abs(normal.y);':'')+
      (withFalls?'\nwaterfallMix=waterFall;':''));
    shader.fragmentShader=(withTransition?'varying float waterOpacityMix;\n':'')+'varying vec3 waterWorldPosition; uniform float waterClock; uniform float waterWaves;\n'+
      (withFalls?'varying float waterfallMix;\n':'')+
      (withFlow?'varying vec2 waterCurrent; varying float waterSurfaceMix; uniform float waterAnimationTime;\n':'')+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n'+
      (withTransition?'diffuseColor.a*=waterOpacityMix; if(diffuseColor.a<0.001)discard;\n':'')+
      (withFalls?
        'if(waterfallMix>0.01){\n'+
        ' float streak=sin(waterWorldPosition.y*5.2+waterClock*4.5+waterWorldPosition.x*.8+waterWorldPosition.z*.8);\n'+
        (lava?
          ' diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,.48,.13),waterfallMix*(.07+.18*waterWaves*max(0.0,streak)));\n':
          ' diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.73,.90,.99),waterfallMix*(.13+.26*waterWaves*max(0.0,streak)));\n')+
        '}\n':'')+
      (withFlow?
        'float currentSpeed=length(waterCurrent);\n'+
        'if(currentSpeed>0.0005&&waterSurfaceMix>0.6){\n'+
        ' vec2 currentDirection=waterCurrent/max(currentSpeed,0.0001);\n'+
        // Visually amplify slow motion; direction still comes from physics.
        ' float visualSpeed=max(currentSpeed,0.14+0.65*sqrt(currentSpeed));\n'+
        ' float along=dot(waterWorldPosition.xz,currentDirection)-waterAnimationTime*visualSpeed;\n'+
        ' float across=dot(waterWorldPosition.xz,vec2(-currentDirection.y,currentDirection.x));\n'+
        ' float bend=sin(along*1.35+across*0.85);\n'+
        ' float band=sin(along*2.8+sin(across*2.1)*2.0+bend*0.8);\n'+
        ' float lane=smoothstep(-0.25,0.7,sin(across*7.0+bend*1.5));\n'+
        ' float crest=pow(max(0.0,band),2.0);\n'+
        ' float motion=smoothstep(0.0005,0.008,currentSpeed)*smoothstep(0.6,0.95,waterSurfaceMix);\n'+
        ' float trace=lane*crest*motion;\n'+
        ' diffuseColor.rgb*=1.0-0.16*lane*max(0.0,-band)*motion;\n'+
        ' diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.88,0.98,1.0),trace*0.78);\n'+
        ' diffuseColor.a=mix(diffuseColor.a,max(diffuseColor.a,0.76),trace*0.8);\n'+
        '}\n':'')+
      'if(waterWaves>0.001){\n'+
      ` float w1=sin(waterWorldPosition.x*.57+waterWorldPosition.z*.31+waterClock*${lava?'.42':'.74'});\n`+
      ` float w2=sin(waterWorldPosition.z*.84-waterWorldPosition.x*.17-waterClock*${lava?'.34':'.53'});\n`+
      ' float ripples=w1*.62+w2*.38;\n'+
      ' float sparkle=pow(max(0.0,ripples-.28),3.0);\n'+
      (lava?
       ' diffuseColor.rgb*=1.0+waterWaves*(.085*ripples+.22*sparkle);\n':
       ' float fresnel=pow(1.0-abs(normalize(cameraPosition-waterWorldPosition).y),3.0);\n'+
       ' diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.71,.88,.96),waterWaves*(.038+.17*fresnel+.13*sparkle));\n'+
       ' diffuseColor.a*=1.0-waterWaves*.095*(1.0-fresnel);\n')+
      '}');
  };
  material.customProgramCacheKey=()=>`minecraft-water-v1165-${kind==='lava'?'lava':'liquid'}-${withFalls?'falls':'flat'}-${withTransition?'transition':'fixed'}-${withFlow?'current':'still'}`;
  return material;
}

/** Called once per animation frame. Low quality skips the expensive ripples. */
export function updateWaterAnimation(timestampMs,quality='high',hidden=false){
  waterWaves.value=hidden||quality==='low'?0:quality==='medium'?.55:1;
  if(!hidden)waterAnimationTime.value=(Number(timestampMs)||0)*.001;
  if(!hidden)waterClock.value=((Number(timestampMs)||0)*.001)%8192;
}
