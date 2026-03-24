// representation/repFactories.js
// Mesh factory helpers for different representations.

function _asColor3(c, fallback) {
  try {
    if (c && c.r !== undefined) return c;
  } catch (_) {}
  return fallback;
}

function _hexToColor3(hex, fallback = new BABYLON.Color3(1, 1, 1)) {
  try {
    return BABYLON.Color3.FromHexString(String(hex || '#ffffff'));
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

export function createAtmosphereHaloRep({
  scene,
  name,
  parent = null,
  radiusWorld,
  colorHex = '#88bbff',
  segments = 20,
  renderingGroupId = 2,
}) {
  const atmoR = Math.max(1e-6, Number(radiusWorld || 0));
  const seg = Math.max(8, Math.floor(Number(segments || 20)));
  const meshName = String(name || 'rep_atmo_halo');

  const m = BABYLON.MeshBuilder.CreateSphere(
    meshName,
    { diameter: 2, segments: seg },
    scene
  );

  if (parent) m.parent = parent;
  m.position.set(0, 0, 0);
  m.scaling.set(atmoR, atmoR, atmoR);
  m.isPickable = false;
  m.alwaysSelectAsActiveMesh = false;
  m.renderingGroupId = renderingGroupId;

  const mat = new BABYLON.StandardMaterial(`${meshName}_mat`, scene);
  mat.backFaceCulling = false;
  mat.disableLighting = true;
  mat.diffuseColor = new BABYLON.Color3(0, 0, 0);
  mat.specularColor = new BABYLON.Color3(0, 0, 0);
  mat.alpha = 0.08;
  mat.emissiveColor = _hexToColor3(colorHex).scale(1.15);

  try { mat.alphaMode = BABYLON.Engine.ALPHA_ADD; } catch (_) {}
  try { mat.disableDepthWrite = true; } catch (_) {}

  try {
    const op = new BABYLON.FresnelParameters();
    op.bias = 0.05;
    op.power = 4.5;
    op.leftColor = BABYLON.Color3.Black();
    op.rightColor = BABYLON.Color3.White();
    mat.opacityFresnelParameters = op;
  } catch (_) {}

  try {
    const em = new BABYLON.FresnelParameters();
    em.bias = 0.00;
    em.power = 5.5;
    em.leftColor = BABYLON.Color3.Black();
    em.rightColor = mat.emissiveColor.clone();
    mat.emissiveFresnelParameters = em;
  } catch (_) {}

  m.material = mat;
  try { m.setEnabled(false); } catch (_) { m.isVisible = false; }

  return { mesh: m, material: mat };
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