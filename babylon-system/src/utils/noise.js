// src/utils/noise.js
// Deterministic 3D value-noise + FBM (0..1), compatible with Babylon global usage.

export function lerp(a, b, t) { return a + (b - a) * t; }
export function smooth(t) { return t * t * (3 - 2 * t); }

export function hash3(x, y, z) {
  x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = smooth(xf), v = smooth(yf), w = smooth(zf);

  const n000 = hash3(xi, yi, zi),     n100 = hash3(xi + 1, yi, zi);
  const n010 = hash3(xi, yi + 1, zi), n110 = hash3(xi + 1, yi + 1, zi);
  const n001 = hash3(xi, yi, zi + 1), n101 = hash3(xi + 1, yi, zi + 1);
  const n011 = hash3(xi, yi + 1, zi + 1), n111 = hash3(xi + 1, yi + 1, zi + 1);

  const x00 = lerp(n000, n100, u), x10 = lerp(n010, n110, u);
  const x01 = lerp(n001, n101, u), x11 = lerp(n011, n111, u);
  const y0  = lerp(x00, x10, v),   y1  = lerp(x01, x11, v);
  return lerp(y0, y1, w);
}

export function fbm3(x, y, z, oct = 6, pers = 0.5, lac = 2.0) {
  let total = 0, f = 1, a = 1, maxV = 0;
  for (let i = 0; i < oct; i++) {
    total += noise3(x * f, y * f, z * f) * a;
    maxV += a;
    a *= pers;
    f *= lac;
  }
  return total / Math.max(1e-6, maxV);
}
