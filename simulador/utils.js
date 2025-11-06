export const rad = (d) => d * Math.PI / 180;
export const deg = (r) => r * 180 / Math.PI;
export const wrap360 = (d) => ((d % 360) + 360) % 360;
export const wrap180 = (d) => ((d + 180) % 360) - 180;

// γ desde la VELOCIDAD (no desde el forward). Signo: γ>0 si subes.
export function sinGammaFromVelocity(position, planeVelocity) {
  const V = Cesium.Cartesian3.magnitude(planeVelocity);
  if (V < 0.1) return 0;
  const enu4 = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const enu  = Cesium.Matrix4.getMatrix3(enu4, new Cesium.Matrix3());
  const UP   = Cesium.Matrix3.getColumn(enu, 2, new Cesium.Cartesian3());
  const flightDir = Cesium.Cartesian3.normalize(planeVelocity, new Cesium.Cartesian3());
  return Cesium.Cartesian3.dot(flightDir, UP);
}

// Rumbo 0=N, 90=E, ajustable con offset
export function computeCompassFromForward(position, forward, offsetDeg = 0) {
  const enu4 = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const enu  = Cesium.Matrix4.getMatrix3(enu4, new Cesium.Matrix3());
  const EAST  = Cesium.Matrix3.getColumn(enu, 0, new Cesium.Cartesian3());
  const NORTH = Cesium.Matrix3.getColumn(enu, 1, new Cesium.Cartesian3());
  const x = Cesium.Cartesian3.dot(forward, EAST);
  const y = Cesium.Cartesian3.dot(forward, NORTH);
  return wrap360(deg(Math.atan2(x, y)) + offsetDeg);
}

export function sinGammaFromForward(forward, surfaceNormal) {
  return Cesium.Math.clamp(Cesium.Cartesian3.dot(forward, surfaceNormal), -0.999, 0.999);
}

export function hdgErr(desired, current) {
  return Cesium.Math.negativePiToPi(desired - current);
}
