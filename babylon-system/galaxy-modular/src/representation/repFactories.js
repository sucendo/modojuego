// representation/repFactories.js
// Mesh factory helpers for different representations.

function _asColor3(c, fallback) {
  try {
    if (c && c.r !== undefined) return c;
  } catch (_) {}
  return fallback;
}

export function createDotRep({ scene, entry, profile }) {
  const { kind, systemName, bodyId } = entry;

  const m = BABYLON.MeshBuilder.CreatePlane(
    `rep_dot_${kind}_${systemName}_${bodyId}`,
    { width: 1, height: 1 },
    scene
  );
  m.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  m.isPickable = false;
  m.renderingGroupId = (kind === 'star') ? 2 : 1;

  const mat = new BABYLON.StandardMaterial(`repDotMat_${kind}_${systemName}_${bodyId}`, scene);
  mat.disableLighting = !!profile?.dotDisableLighting;
  mat.backFaceCulling = false;

  const base = _asColor3(entry.color, new BABYLON.Color3(1, 1, 1));
  // Always visible: emissive
  mat.emissiveColor = base;
  mat.diffuseColor = base.scale(0.05);
  mat.specularColor = new BABYLON.Color3(0, 0, 0);

  m.material = mat;
  return m;
}

export function createSphereRep({ scene, entry, profile, segments, repTag }) {
  const { kind, systemName, bodyId } = entry;

  const diameter = Math.max(0.001, Number(entry.radiusWorld || 0) * 2);
  const seg = Math.max(4, Number(segments || 12));

  const m = BABYLON.MeshBuilder.CreateSphere(
    `rep_${repTag}_${kind}_${systemName}_${bodyId}`,
    { diameter, segments: seg },
    scene
  );
  m.isPickable = false;
  m.renderingGroupId = (kind === 'star') ? 2 : 1;

  const mat = new BABYLON.StandardMaterial(`repMat_${repTag}_${kind}_${systemName}_${bodyId}`, scene);

  const base = _asColor3(entry.color, (kind === 'star') ? new BABYLON.Color3(1, 1, 1) : new BABYLON.Color3(0.5, 0.5, 0.5));

  if (kind === 'star') {
    mat.disableLighting = true;
    mat.emissiveColor = base;
    mat.diffuseColor = base.scale(0.15);
    mat.specularColor = new BABYLON.Color3(0, 0, 0);
  } else {
    mat.disableLighting = !!profile?.sphereDisableLighting;
    mat.diffuseColor = base;
    mat.emissiveColor = base.scale((kind === 'planet' || kind === 'moon') ? 0.02 : 0.12);
    mat.specularColor = new BABYLON.Color3(0.06, 0.06, 0.06);
  }

  m.material = mat;
  return m;
}