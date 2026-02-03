// src/planets/jsonPlanet.js
// Build a planet mesh (and optional sea patch) from the JSON exported by generate-planet-js.

import { PlanetGenerator } from "./planetGenerator.js";

function clampInt(v, a, b) {
  v = (v | 0);
  if (v < a) return a;
  if (v > b) return b;
  return v;
}

function hashStringToSeed(str) {
  // simple, stable hash -> uint32
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deepClone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

function scaleIfNumber(v, s) {
  return (typeof v === "number" && Number.isFinite(v)) ? (v * s) : v;
}

export async function loadPlanetConfig(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
  const json = await r.json();
  if (!json || !json.params) throw new Error(`Config inválida en ${url}`);
  return json.params;
}

export function buildRuntimePlanetParams(baseParams, bodyDef, opts = {}) {
  const p = deepClone(baseParams || {});

  // Radius: prefer bodyDef.radius (galaxy definition) so all systems stay coherent.
  // BUT: some generator params are expressed in world-units and must be scaled when radius changes,
  // otherwise sea/coast/atmo won't match the generator look.
  const jsonRadius = (typeof p.radius === "number" && p.radius > 0) ? p.radius : null;
  if (typeof bodyDef?.radius === "number") {
    const newR = bodyDef.radius;
    if (jsonRadius && newR > 0 && Math.abs(newR - jsonRadius) > 1e-6) {
      const s = newR / jsonRadius;
      // These are "world-ish" tuning knobs in the generator. Scale them to preserve the look.
      p.seaHugBand = scaleIfNumber(p.seaHugBand, s);
      p.waveAmp    = scaleIfNumber(p.waveAmp, s);
      p.seaZOffset = scaleIfNumber(p.seaZOffset, s);
    }
    p.radius = newR;
  }

  // Sea: map babylon-system -> generator params
  if (typeof bodyDef?.ocean === "boolean") p.seaEnabled = bodyDef.ocean;
  if (typeof bodyDef?.seaLevel === "number") p.seaLevel = bodyDef.seaLevel;

  // Avoid absurd subdivision values in exported JSON (those were for UI / autoLOD).
  const maxSubdiv = (typeof opts.maxSubdiv === "number") ? opts.maxSubdiv : 6;
  const minSubdiv = (typeof opts.minSubdiv === "number") ? opts.minSubdiv : 2;
  p.subdivisions = clampInt(p.subdivisions ?? 4, minSubdiv, maxSubdiv);

  // Give variation to planets that reuse default.json
  if (opts.forceSeedFromName) {
    p.seed = hashStringToSeed(String(bodyDef?.name || "planet"));
  } else if (typeof bodyDef?.seed === "number") {
    p.seed = bodyDef.seed | 0;
  }

  // Defensive clamps (keep CPU under control)
  if (typeof p.craterCount === "number") p.craterCount = Math.min(Math.max(0, p.craterCount), 120);
  if (typeof p.octaves === "number") p.octaves = Math.min(Math.max(1, p.octaves), 6);
  if (typeof p.ridgeOctaves === "number") p.ridgeOctaves = Math.min(Math.max(1, p.ridgeOctaves), 7);

  // Babylon-system lighting is star-only. Make land a bit less "chalky" by default.
  p.wireframe = false;

  return p;
}

export function createJsonPlanet(scene, bodyDef, orbitNode, params) {
  const gen = new PlanetGenerator(scene);
  gen.generate(params);

  const land = gen.mesh;
  land.name = bodyDef.name + "_land";
  land.parent = orbitNode;
  land.position.set(bodyDef.orbitR || 0, 0, 0);
  land.isPickable = false;

  // Make PBR a bit more responsive to point lights
  const mat = land.material;
  if (mat && mat.getClassName && mat.getClassName() === "PBRMaterial") {
    mat.roughness = Math.min(0.92, Math.max(0.55, mat.roughness));
    mat.specularIntensity = Math.max(0.22, mat.specularIntensity || 0.0);
  }

  let ocean = null;
  if (gen.seaMesh && gen.seaMesh.isEnabled && gen.seaMesh.isEnabled()) {
    ocean = gen.seaMesh;
    ocean.name = bodyDef.name + "_ocean";
    // Parent to land so it follows rotation and orbit perfectly.
    ocean.parent = land;
    ocean.position.set(0, 0, 0);
    ocean.isPickable = false;
    // Asegura misma cola de render que el terreno (evita “x-ray water”)
    ocean.renderingGroupId = land.renderingGroupId || 0;
    // y que se dibuje después del terreno
    ocean.alphaIndex = (land.alphaIndex || 0) + 1;

    // Tune water from JSON if present
    const om = ocean.material;
    if (om && om.getClassName && om.getClassName() === "PBRMaterial") {
      if (typeof params.seaRoughness === "number") om.roughness = params.seaRoughness;
      if (typeof params.seaSpecular === "number") om.specularIntensity = params.seaSpecular;
      if (typeof params.seaAlpha === "number") om.alpha = params.seaAlpha;
      if (typeof params.seaZOffset === "number") om.zOffset = params.seaZOffset;
      // Keep the "no x-ray ocean" fix
      om.needDepthPrePass = true;
      if (typeof om.forceDepthWrite !== "undefined") om.forceDepthWrite = true;
    }
  }

  // Babylon-system expects this shape
  return { land, ocean, clouds: null, nightLights: null };
}


// Aplica el perfil de atmósfera exportado por el generador al post-process global (atmoPP).
// Úsalo cuando este planeta sea el "activo" / el que estás viendo de cerca.
export function applyJsonAtmosphereToPP(atmoPP, params, planetMesh, sunPos) {
  if (!atmoPP || !params || !planetMesh) return;
  const hexToVec3 = (hex) => {
    const c = BABYLON.Color3.FromHexString(hex || "#000000");
    return new BABYLON.Vector3(c.r, c.g, c.b);
  };

  atmoPP._enabled = !!params.atmoEnabled;
  atmoPP._useDepth = !!params.atmoUseDepth;
  atmoPP._atmoStrength = params.atmoStrength;
  atmoPP._mieStrength = params.mieStrength;
  atmoPP._upperStrength = params.upperStrength;
  atmoPP._steps = params.atmoSteps;
  atmoPP._c0 = hexToVec3(params.c0);
  atmoPP._c1 = hexToVec3(params.c1);
  atmoPP._c2 = hexToVec3(params.c2);

  atmoPP._cloudAlpha = params.cloudAlpha;
  atmoPP._cloudScale = params.cloudScale;
  atmoPP._cloudSharpness = params.cloudSharpness;
  atmoPP._cloudWind = new BABYLON.Vector3(params.cloudWindX || 0, 0.0, params.cloudWindZ || 0);
  const ct = BABYLON.Color3.FromHexString(params.cloudTint || "#ffffff");
  atmoPP._cloudTint = new BABYLON.Vector3(ct.r, ct.g, ct.b);

  const r = params.radius;
  const atmoR = r * (params.atmoRadiusMul || 1.15);
  AtmospherePP.setAtmosphereTarget(atmoPP, planetMesh, r, atmoR, sunPos);
  AtmospherePP.enableAtmospherePP(atmoPP, !!params.atmoEnabled);
}
