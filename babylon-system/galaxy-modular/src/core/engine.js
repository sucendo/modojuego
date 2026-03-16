import { APP_CONFIG } from '../config/appConfig.js';

export function createEngine(canvas){
  // Perf defaults:
  // - preserveDrawingBuffer is *very* expensive. Enable only when you really need captures.
  // - stencil is only needed for specific post-process / masking techniques.
  let preserve = APP_CONFIG.engine.preserveDrawingBuffer;
  let stencil = APP_CONFIG.engine.stencil;
  let antialias = APP_CONFIG.engine.antialias;
  let hardwareScale = null;

  try{
    const u = new URL(location.href);
    preserve  = (u.searchParams.get('preserve') === '1') || (u.searchParams.get('capture') === '1');
    stencil   = (u.searchParams.get('stencil') === '1');
    antialias = (u.searchParams.get('aa') !== '0');
    const s = Number(u.searchParams.get('scale'));
    if (Number.isFinite(s) && s > 0) hardwareScale = s;
  }catch(_){
    // ignore
  }

  const engine = new BABYLON.Engine(canvas, antialias, {
    preserveDrawingBuffer: preserve,
    stencil,
    powerPreference: 'high-performance',
  });

  // Improve depth precision dramatically for huge scenes
  engine.useReverseDepthBuffer = !!APP_CONFIG.engine.reverseDepthBuffer;

  if (hardwareScale != null && typeof engine.setHardwareScalingLevel === 'function') {
    engine.setHardwareScalingLevel(hardwareScale);
  }
  return engine;
}