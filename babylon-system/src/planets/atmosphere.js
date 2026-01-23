// src/planets/atmosphere.js
// Physically-plausible (but still cheap) atmosphere shell.
// - Terminator is per-fragment (N·L)
// - Rim glow is view-dependent
// - Uses additive blending
// - Depth-tested so other bodies can occlude it
//
// v2: multi-layer shells for a more progressive/volumetric feel.
// We approximate thickness by stacking 2–3 shells with different radii and
// scattering parameters. This gives the impression of "layers" without a heavy
// volumetric shader.

function ensureAtmoShaders() {
  if (BABYLON.Effect.ShadersStore["atmoShellVertexShader"]) return;

  BABYLON.Effect.ShadersStore["atmoShellVertexShader"] = `
    precision highp float;

    // Attributes
    attribute vec3 position;
    attribute vec3 normal;

    // Uniforms
    uniform mat4 world;
    uniform mat4 view;
    uniform mat4 projection;

    // Varyings
    varying vec3 vPosW;
    varying vec3 vNormalW;

    void main(void) {
      vec4 worldPos = world * vec4(position, 1.0);
      vPosW = worldPos.xyz;
      vNormalW = normalize(mat3(world) * normal);
      gl_Position = projection * view * worldPos;
    }
  `;

  BABYLON.Effect.ShadersStore["atmoShellFragmentShader"] = `
    precision highp float;

    varying vec3 vPosW;
    varying vec3 vNormalW;

    uniform vec3 planetPos;
    uniform vec3 sunPos;
    uniform vec3 cameraPos;

    uniform vec3 atmoColor;
    uniform float baseAlpha;
    uniform float rimPower;
    uniform float terminatorSoftness;
    uniform float nightMin;
	
    uniform float miePower;
    uniform float mieStrength;
    uniform float pathPower;
    uniform float pathStrength;
    uniform float layerFade;
    uniform float time;
    uniform float noiseStrength;

    float saturate(float x){ return clamp(x, 0.0, 1.0); }
	
    // tiny hash noise to break perfect smoothness (banding/flat look)
    float hash31(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }

    void main(void) {
      vec3 N = normalize(vNormalW);

      // Sun direction: constant per planet (planet center -> sun)
      vec3 L = normalize(sunPos - planetPos);

      // View direction (fragment -> camera)
      vec3 V = normalize(cameraPos - vPosW);

      // Terminator (per fragment): -1..1
      float nl = dot(N, L);

      // Smooth day factor across terminator
      float t = terminatorSoftness;
      float day = smoothstep(-t, t, nl);

      // Rim glow (stronger near limb)
      float ndv = dot(N, V);
      float rim = pow(saturate(1.0 - ndv), rimPower);

      // Approximate optical path length (thicker near the limb)
      float path = pow(saturate(1.0 - abs(ndv)), pathPower) * pathStrength;

      // Forward scattering (Mie-ish) — stronger when looking toward the sun
      float vdl = dot(V, L);
      float mie = pow(saturate(vdl * 0.5 + 0.5), miePower) * mieStrength;
 

      // Keep a faint halo on night side, but much dimmer
      float side = mix(nightMin, 1.0, day);

      // Extra fade for outer layers so edges look progressive
      float lay = layerFade;

      // Subtle animated noise to avoid "solid band" feeling
      float n = (hash31(vPosW * 0.015 + vec3(time * 0.02)) - 0.5) * 2.0;
      float noise = 1.0 + n * noiseStrength;

      float glow = (rim + path + mie);

      float a = baseAlpha * glow * side * lay * noise;
      vec3  c = atmoColor * glow * side * lay * noise;

      gl_FragColor = vec4(c, a);
    }
  `;
}

function createAtmoShell(scene, planetMesh, radius, shellMul, shellAlpha, color, opts = {}) {
  ensureAtmoShaders();

  const name = (planetMesh?.name || "planet") + `_atmo_${Math.round(shellMul * 100)}`;
  const segments = (typeof opts.segments === "number") ? opts.segments : 32;

  const atmo = BABYLON.MeshBuilder.CreateSphere(name, { diameter: radius * 2 * shellMul, segments }, scene);

  // Follow planet transform perfectly.
  atmo.parent = planetMesh;
  atmo.position.set(0, 0, 0);
  atmo.isPickable = false;

  const mat = new BABYLON.ShaderMaterial(
    name + "_mat",
    scene,
    { vertex: "atmoShell", fragment: "atmoShell" },
    {
      attributes: ["position", "normal"],
      uniforms: [
        "world",
        "view",
        "projection",
        "planetPos",
        "sunPos",
        "cameraPos",
        "atmoColor",
        "baseAlpha",
        "rimPower",
        "terminatorSoftness",
        "nightMin",

        "miePower",
        "mieStrength",
        "pathPower",
        "pathStrength",
        "layerFade",
        "time",
        "noiseStrength",
      ],
      needAlphaBlending: true,
    }
  );

  // Additive blending for halo
  mat.alphaMode = BABYLON.Engine.ALPHA_ADD;
  mat.backFaceCulling = false;
  // Don't write depth (keeps correct blending), but DO depth-test so other bodies occlude it.
  mat.disableDepthWrite = true;

  // Defaults (tweakable)
  const rimPower = (typeof opts.rimPower === "number") ? opts.rimPower : 4.0;
  const terminatorSoftness = (typeof opts.terminatorSoftness === "number") ? opts.terminatorSoftness : 0.20;
  const nightMin = (typeof opts.nightMin === "number") ? opts.nightMin : 0.08;

  // Volumetric-ish feel knobs
  const miePower = (typeof opts.miePower === "number") ? opts.miePower : 7.0;
  const mieStrength = (typeof opts.mieStrength === "number") ? opts.mieStrength : 0.45;
  const pathPower = (typeof opts.pathPower === "number") ? opts.pathPower : 2.0;
  const pathStrength = (typeof opts.pathStrength === "number") ? opts.pathStrength : 0.25;
  const layerFade = (typeof opts.layerFade === "number") ? opts.layerFade : 1.0;
  const noiseStrength = (typeof opts.noiseStrength === "number") ? opts.noiseStrength : 0.06;

  mat.setColor3("atmoColor", color || new BABYLON.Color3(0.35, 0.55, 1.0));
  mat.setFloat("baseAlpha", shellAlpha);
  mat.setFloat("rimPower", rimPower);
  mat.setFloat("terminatorSoftness", terminatorSoftness);
  mat.setFloat("nightMin", nightMin);

  mat.setFloat("miePower", miePower);
  mat.setFloat("mieStrength", mieStrength);
  mat.setFloat("pathPower", pathPower);
  mat.setFloat("pathStrength", pathStrength);
  mat.setFloat("layerFade", layerFade);
  mat.setFloat("time", 0.0);
  mat.setFloat("noiseStrength", noiseStrength);

  // init uniforms (updated per frame)
  mat.setVector3("planetPos", new BABYLON.Vector3(0, 0, 0));
  mat.setVector3("sunPos", new BABYLON.Vector3(0, 0, 0));
  mat.setVector3("cameraPos", new BABYLON.Vector3(0, 0, 0));

  atmo.material = mat;

  // IMPORTANT: keep same rendering group as planet so depth is preserved.
  // We rely on alphaIndex to render after the opaque body.
  atmo.renderingGroupId = planetMesh.renderingGroupId || 0;
  atmo.alphaIndex = 50;

  atmo.metadata = atmo.metadata || {};
  atmo.metadata._atmoRadius = radius;
  atmo.metadata._atmoBaseAlpha = shellAlpha;
  atmo.metadata._atmoShellMul = shellMul;

  return atmo;
}

export function makeAtmosphere(scene, planetMesh, radius, color, alpha = 0.28, opts = {}) {
  // We return a TransformNode so callers can still do atmo.setEnabled()/isEnabled().
  // Each child mesh is a thin shell with slightly different params.
  const rootName = (planetMesh?.name || "planet") + "_atmo";
  const root = new BABYLON.TransformNode(rootName, scene);
  root.parent = planetMesh;
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.isPickable = false;

  // Default layer stack (inner → outer)
  const layers = Array.isArray(opts.layers) ? opts.layers : [
    // inner denser layer
    { mul: 1.018, aMul: 0.85, rimPower: 3.2, terminatorSoftness: 0.18, nightMin: 0.05, mieStrength: 0.25, pathStrength: 0.35, layerFade: 1.0 },
    // mid layer (main glow)
    { mul: 1.040, aMul: 1.00, rimPower: 4.4, terminatorSoftness: 0.22, nightMin: 0.08, mieStrength: 0.45, pathStrength: 0.25, layerFade: 0.85 },
    // outer faint haze
    { mul: 1.075, aMul: 0.55, rimPower: 5.8, terminatorSoftness: 0.28, nightMin: 0.10, mieStrength: 0.65, pathStrength: 0.12, layerFade: 0.65 },
  ];

  const shells = [];
  for (let i = 0; i < layers.length; i++) {
    const L = layers[i];
    const shell = createAtmoShell(
      scene,
      root,
      radius,
      L.mul,
      alpha * (typeof L.aMul === "number" ? L.aMul : 1.0),
      color,
      {
        ...opts,
        rimPower: (typeof L.rimPower === "number") ? L.rimPower : opts.rimPower,
        terminatorSoftness: (typeof L.terminatorSoftness === "number") ? L.terminatorSoftness : opts.terminatorSoftness,
        nightMin: (typeof L.nightMin === "number") ? L.nightMin : opts.nightMin,
        mieStrength: (typeof L.mieStrength === "number") ? L.mieStrength : opts.mieStrength,
        pathStrength: (typeof L.pathStrength === "number") ? L.pathStrength : opts.pathStrength,
        layerFade: (typeof L.layerFade === "number") ? L.layerFade : opts.layerFade,
      }
    );
    // Ensure render order is stable: inner first, outer last
    shell.alphaIndex = 50 + i;
    shells.push(shell);
  }

  root.metadata = root.metadata || {};
  root.metadata._atmoRoot = true;
  root.metadata._atmoShells = shells;
  root.metadata._atmoRadius = radius;
  root.metadata._atmoBaseAlpha = alpha;
  root.renderingGroupId = planetMesh.renderingGroupId || 0;
  root.alphaIndex = 50;

  return root;
}

// Update uniforms per frame so the terminator and rim react correctly.
export function updateAtmosphere(atmo, planetPos, sunPos, camPos) {
  if (!atmo) return;
  const t = performance.now() * 0.001;

  // If it's the v2 root, update all child shells.
  if (atmo.getChildMeshes) {
    const meshes = atmo.getChildMeshes(false);
    for (const m of meshes) {
      const mat = m.material;
      if (!mat || !mat.setVector3) continue;
      mat.setVector3("planetPos", planetPos);
      mat.setVector3("sunPos", sunPos);
      mat.setVector3("cameraPos", camPos);
      if (mat.setFloat) mat.setFloat("time", t);
    }
    return;
  }

  // Back-compat: single mesh
  if (!atmo.material) return;
  const mat = atmo.material;
  if (!mat.setVector3) return;
  mat.setVector3("planetPos", planetPos);
  mat.setVector3("sunPos", sunPos);
  mat.setVector3("cameraPos", camPos);
  if (mat.setFloat) mat.setFloat("time", t);
}
