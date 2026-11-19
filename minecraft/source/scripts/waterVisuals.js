// v11.1: rendering only. No new blocks, physics, save fields or world generation.
// One shared clock drives every visible liquid surface, irrespective of chunk count.
const waterClock={value:0};
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
export function applyWaterMotion(material,kind,withFalls=false){
  // Ice has a fixed surface. Its lighting and depth tint still respond to day/night.
  if(kind==='frozen')return material;
  const lava=kind==='lava';
  material.onBeforeCompile=shader=>{
    shader.uniforms.waterClock=waterClock;
    shader.uniforms.waterWaves=waterWaves;
    shader.vertexShader='varying vec3 waterWorldPosition;\n'+
      (withFalls?'attribute float waterFall; varying float waterfallMix;\n':'')+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nwaterWorldPosition=(modelMatrix*vec4(position,1.0)).xyz;'+
      (withFalls?'\nwaterfallMix=waterFall;':''));
    shader.fragmentShader='varying vec3 waterWorldPosition; uniform float waterClock; uniform float waterWaves;\n'+
      (withFalls?'varying float waterfallMix;\n':'')+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n'+
      (withFalls?
        'if(waterfallMix>0.01){\n'+
        ' float streak=sin(waterWorldPosition.y*5.2-waterClock*4.5+waterWorldPosition.x*.8+waterWorldPosition.z*.8);\n'+
        (lava?
          ' diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,.48,.13),waterfallMix*(.07+.18*waterWaves*max(0.0,streak)));\n':
          ' diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.73,.90,.99),waterfallMix*(.13+.26*waterWaves*max(0.0,streak)));\n')+
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
  material.customProgramCacheKey=()=>`minecraft-water-v112-${kind==='lava'?'lava':'liquid'}-${withFalls?'falls':'flat'}`;
  return material;
}

/** Called once per animation frame. Low quality skips the expensive ripples. */
export function updateWaterAnimation(timestampMs,quality='high',hidden=false){
  waterWaves.value=hidden||quality==='low'?0:quality==='medium'?.55:1;
  if(!hidden)waterClock.value=((Number(timestampMs)||0)*.001)%8192;
}
