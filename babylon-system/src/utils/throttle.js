// src/utils/throttle.js
// Ejecuta fn como máximo cada X ms (ideal para UI/LOD/ajustes visuales “aproximados”).
export function throttleMs(fn, ms = 200) {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last < ms) return;
    last = now;
    fn(...args);
  };
}