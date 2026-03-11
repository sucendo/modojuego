// bodies/systems.js
// Construye los nodos de sistema (ancla + dot billboard + label)

import { ensureSimMeta, setSimLocalU, setSimAbsKm } from '../sim/universeState.js';

const LY_KM = 9.4607304725808e12; // km en 1 año-luz

function createSystemHintTexture(scene, name, opts = {}) {
  const size = Math.max(128, Number(opts.size || 256));
  const tex = new BABYLON.DynamicTexture(`sysHintTex_${name}`, { width: size, height: size }, scene, true);
  tex.hasAlpha = true;
  tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

  const ctx = tex.getContext();
  const cx = size * 0.5;
  const cy = size * 0.5;
  const r = size * 0.28;
  const hud = '0,255,204';

  ctx.clearRect(0, 0, size, size);

  // Núcleo suave para que siempre "se intuya algo" aunque el aro no se lea completo
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.16);
  coreGrad.addColorStop(0.0, `rgba(${hud},0.26)`);
  coreGrad.addColorStop(0.45, `rgba(${hud},0.14)`);
  coreGrad.addColorStop(1.0, `rgba(${hud},0.00)`);
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // Halo exterior suave
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${hud},0.10)`;
  ctx.lineWidth = size * 0.14;
  ctx.stroke();

  // Aro principal más legible
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${hud},0.42)`;
  ctx.lineWidth = Math.max(3, size * 0.05);
  ctx.stroke();

  // Segmento resaltado tipo HUD
  ctx.beginPath();
  ctx.arc(cx, cy, r, -0.75, 0.32);
  ctx.strokeStyle = `rgba(${hud},0.80)`;
  ctx.lineWidth = Math.max(3, size * 0.06);
  ctx.stroke();

  // Cuatro mini ticks cardinales
  const tickOuter = r + size * 0.075;
  const tickInner = r + size * 0.005;
  const tickAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  ctx.strokeStyle = `rgba(${hud},0.35)`;
  ctx.lineWidth = Math.max(2, size * 0.028);
  for (const a of tickAngles) {
    const x1 = cx + Math.cos(a) * tickInner;
    const y1 = cy + Math.sin(a) * tickInner;
    const x2 = cx + Math.cos(a) * tickOuter;
    const y2 = cy + Math.sin(a) * tickOuter;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  tex.update();
  return tex;
}

export function buildSystemNodes({ scene, worldRoot, GALAXY, SYSTEMS, labelsApi }) {
  if (!scene || !worldRoot) throw new Error('[systems] scene/worldRoot required');

  const sysObj = (GALAXY && GALAXY.system) ? GALAXY.system : (SYSTEMS || {});
  const lyUnits = (typeof sysObj.__LY === 'number')
    ? sysObj.__LY
    : (typeof SYSTEMS?.__LY === 'number') ? SYSTEMS.__LY : 1_000_000;

  try { if (GALAXY?.system && typeof GALAXY.system === 'object') GALAXY.system.__LY = lyUnits; } catch (_) {}
  const kmPerUnitWorld = LY_KM / Math.max(1, lyUnits);

  const systemNodes = [];

  function toVector3(v) {
    if (!v) return null;
    if (v.clone && typeof v.clone === 'function') return v.clone();
    if (typeof v.x === 'number' && typeof v.y === 'number' && typeof v.z === 'number') return new BABYLON.Vector3(v.x, v.y, v.z);
    return null;
  }

  for (const name of Object.keys(sysObj)) {
    if (name === '__LY') continue;
    const def = sysObj[name];
    if (!def?.posLY) continue;
    const posLY = toVector3(def.posLY);
    if (!posLY) continue;
    const posWorld = posLY.scale(lyUnits);

    const sys = new BABYLON.TransformNode(`sys_${name}`, scene);
    sys.parent = worldRoot;
    sys.position.copyFrom(posWorld);
	
    sys.metadata = Object.assign({}, sys.metadata, {
      kmPerUnit: kmPerUnitWorld,
      systemName: name,
      bodyId: `system:${name}`,
      kind: 'system',
    });

    ensureSimMeta(sys, {
      bodyId: `system:${name}`,
      kind: 'system',
      systemName: name,
      parentBodyId: null,
      kmPerUnit: kmPerUnitWorld,
    });
    setSimLocalU(sys, posWorld, 0);
    setSimAbsKm(sys, {
      x: posLY.x * LY_KM,
      y: posLY.y * LY_KM,
      z: posLY.z * LY_KM,
    }, 0);

    const dot = BABYLON.MeshBuilder.CreatePlane(`sysDot_${name}`, { width: 1, height: 1 }, scene);
    dot.parent = sys;
    dot.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    dot.isPickable = false;
    dot.renderingGroupId = 1;
    dot.metadata = Object.assign({}, dot.metadata, { kmPerUnit: kmPerUnitWorld });

    const dmat = new BABYLON.StandardMaterial(`sysDotMat_${name}`, scene);
    dmat.disableLighting = true;
    dmat.backFaceCulling = false;
    dmat.emissiveColor = new BABYLON.Color3(0.10, 1.00, 0.84);
    dmat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    dmat.specularColor = new BABYLON.Color3(0, 0, 0);
    dmat.alpha = 1.0;
    dmat.useAlphaFromDiffuseTexture = true;
    dmat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    const hintTex = createSystemHintTexture(scene, name, { size: 128 });
    dmat.diffuseTexture = hintTex;
    dmat.opacityTexture = hintTex;
    dot.material = dmat;

    if (labelsApi?.registerLabel) labelsApi.registerLabel(`system:${String(name)}`, String(name), 'system', dot, { system: name });

    systemNodes.push({ system: sys, dot, name, stars: [], primaryStar: null });
  }

  return { systemNodes, kmPerUnitWorld, lyUnits };
}