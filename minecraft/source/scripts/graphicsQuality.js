/** Rendering-only presets. Never alters a world's blocks or save format. */
export const GRAPHICS_QUALITY = Object.freeze({
  low: Object.freeze({pixelRatio:1, shadowMapSize:512, shadowRadius:1, precipitation:.35}),
  medium: Object.freeze({pixelRatio:1.25, shadowMapSize:768, shadowRadius:2, precipitation:.7}),
  high: Object.freeze({pixelRatio:1.5, shadowMapSize:1024, shadowRadius:null, precipitation:1})
});
export function normalizeGraphicsQuality(value) {
  return Object.hasOwn(GRAPHICS_QUALITY,value) ? value : 'high';
}
export function graphicsProfile(value, devicePixelRatio=1){
  const p=GRAPHICS_QUALITY[normalizeGraphicsQuality(value)];
  return {...p,pixelRatio:Math.min(Math.max(.5,devicePixelRatio||1),p.pixelRatio)};
}
