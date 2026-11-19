/** Screen-door fading on opaque voxel materials.
 * Unlike alpha blending, this keeps the depth buffer correct and does not make
 * the terrain look see-through when a chunk enters/leaves the rendered ring.
 * Materials are cloned PER CHUNK; common textures and geometry are not cloned.
 */
export function makeFadeMaterial(source, uniform){
  const clone=mat=>{
    const material=mat.clone();
    const previous=material.onBeforeCompile;
    material.onBeforeCompile=(shader,renderer)=>{
      previous.call(material,shader,renderer);
      shader.uniforms.chunkFade=uniform;
      shader.fragmentShader='uniform float chunkFade;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n'+
        'if (chunkFade < 0.998) {\n'+
        '  float threshold = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);\n'+
        '  if (threshold > chunkFade) discard;\n'+
        '}\n'
      );
    };
    const previousKey=material.customProgramCacheKey.bind(material);
    material.customProgramCacheKey=()=>`voxelChunkFade1|${previousKey()}`;
    return material;
  };
  return Array.isArray(source)?source.map(clone):clone(source);
}
export function disposeFadeMaterial(material){
  if(Array.isArray(material))material.forEach(m=>m.dispose());
  else material?.dispose();
}
export function clampFade(value){return Math.max(0,Math.min(1,Number(value)||0));}
