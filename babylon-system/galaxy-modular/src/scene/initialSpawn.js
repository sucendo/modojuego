function findFirstNodeByNames(map, names = []) {
  for (const name of names) {
    const node = map?.get?.(name);
    if (node) return node;
  }
  return null;
}

export function spawnCameraInEarthOrbit({
  camera,
  camCtrl,
  orbitAnchor,
  planetMeshById,
  starMeshById,
  getSunAnchorNode,
  initialSpawn = {},
}) {
  const earthNames = initialSpawn.earthNames || ['Tierra', 'Earth', 'Terra'];
  const sunNames = initialSpawn.sunNames || ['Sol', 'Sun', 'Solis'];

  const earth = findFirstNodeByNames(planetMeshById, earthNames);
  if (!earth) return false;

  try { earth.computeWorldMatrix?.(true); } catch (_) {}

  const earthPos =
    (typeof earth.getAbsolutePosition === 'function')
      ? earth.getAbsolutePosition()
      : earth.position;

  if (!earthPos) return false;

  const radiusWorld = Number(earth?.metadata?.radiusWorld) || 0.01;

  const orbitalAltitude = Math.max(
    radiusWorld * (initialSpawn.orbitalAltitudeRadiusMul ?? 0.035),
    initialSpawn.orbitalAltitudeMin ?? 0.0016
  );
  const orbitalRadius = radiusWorld + orbitalAltitude;

  let sunNode = null;
  try {
    sunNode = getSunAnchorNode?.() || findFirstNodeByNames(starMeshById, sunNames);
  } catch (_) {
    sunNode = findFirstNodeByNames(starMeshById, sunNames);
  }

  let sunPos = null;
  if (sunNode) {
    try { sunNode.computeWorldMatrix?.(true); } catch (_) {}
    sunPos = (typeof sunNode.getAbsolutePosition === 'function')
      ? sunNode.getAbsolutePosition()
      : sunNode.position;
  }

  let sunDir = new BABYLON.Vector3(0, 0, 1);
  if (sunPos) {
    sunDir = sunPos.subtract(earthPos);
    if (sunDir.lengthSquared() > 1e-12) sunDir.normalize();
  }

  const worldUp = new BABYLON.Vector3(0, 1, 0);

  let northOnTerminator = worldUp.subtract(
    sunDir.scale(BABYLON.Vector3.Dot(worldUp, sunDir))
  );
  if (northOnTerminator.lengthSquared() < 1e-8) {
    northOnTerminator = BABYLON.Axis.Z.subtract(
      sunDir.scale(BABYLON.Vector3.Dot(BABYLON.Axis.Z, sunDir))
    );
  }
  northOnTerminator.normalize();

  let eastOnTerminator = BABYLON.Vector3.Cross(sunDir, northOnTerminator);
  if (eastOnTerminator.lengthSquared() < 1e-8) {
    eastOnTerminator = BABYLON.Vector3.Cross(sunDir, BABYLON.Axis.X);
  }
  eastOnTerminator.normalize();

  const spawnNormal = sunDir.scale(-0.20)
    .add(northOnTerminator.scale(0.30))
    .add(eastOnTerminator.scale(0.5))
    .normalize();

  const spawnPos = earthPos.add(spawnNormal.scale(orbitalRadius));
  camera.position.copyFrom(spawnPos);

  camera.rotationQuaternion = null;
  if (camera.rotation?.set) camera.rotation.set(0, 0, 0);

  let towardSunOnTangent = sunDir.subtract(
    spawnNormal.scale(BABYLON.Vector3.Dot(sunDir, spawnNormal))
  );
  if (towardSunOnTangent.lengthSquared() < 1e-8) {
    towardSunOnTangent = eastOnTerminator.clone();
  }
  towardSunOnTangent.normalize();

  let localRight = BABYLON.Vector3.Cross(towardSunOnTangent, spawnNormal);
  if (localRight.lengthSquared() < 1e-8) {
    localRight = eastOnTerminator.clone();
  }
  localRight.normalize();

  const localLeft = localRight.scale(-1);

  const lookDir = towardSunOnTangent.scale(0.72)
    .add(localLeft.scale(-0.05))
    .add(spawnNormal.scale(-0.52))
    .normalize();

  if (camCtrl?.setShipLookDirection) {
    camCtrl.setShipLookDirection(lookDir, spawnNormal);
  } else {
    const targetPos = camera.position.add(lookDir.scale(radiusWorld * 4.5));
    if (typeof camera.setTarget === 'function') {
      camera.setTarget(targetPos);
    } else if (typeof camera.lookAt === 'function') {
      camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
    }
  }

  try {
    camera.upVector = spawnNormal.clone();
  } catch (_) {}

  try { orbitAnchor?.syncOffsetFromCamera?.(camera); } catch (_) {}
  try { camera.computeWorldMatrix?.(true); } catch (_) {}

  return true;
}