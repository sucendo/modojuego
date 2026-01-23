// src/planets/rings.js
// Ring material with per-fragment lighting + planet shadow (sphere occlusion).
// Keeps it cheap: one ShaderMaterial per ring.

function ensureRingShaders() {
  if (BABYLON.Effect.ShadersStore["ringShadowVertexShader"]) return;

  BABYLON.Effect.ShadersStore["ringShadowVertexShader"] = `
    precision highp float;

    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    uniform mat4 world;
    uniform mat4 view;
    uniform mat4 projection;

    varying vec3 vPosW;
    varying vec3 vNormalW;
    varying vec2 vUV;

    void main(void) {
      vec4 wp = world * vec4(position, 1.0);
      vPosW = wp.xyz;
      vNormalW = normalize(mat3(world) * normal);
      vUV = uv;
      gl_Position = projection * view * wp;
    }
  `;

  BABYLON.Effect.ShadersStore["ringShadowFragmentShader"] = `
    precision highp float;

    varying vec3 vPosW;
    varying vec3 vNormalW;
    varying vec2 vUV;

    uniform sampler2D ringTex;

    uniform vec3 sunPos;
    uniform vec3 planetPos;
    uniform float planetRadius;

    uniform vec3 baseTint;
    uniform float baseAlpha;
    uniform float shadowSoftness;
    uniform float shadowMin;

    float saturate(float x){ return clamp(x, 0.0, 1.0); }

    // Returns 0..1 where 0 = fully shadowed, 1 = fully lit
    float planetShadow(vec3 p, vec3 sun, vec3 c, float r) {
      vec3 dir = sun - p;
      float dist = length(dir);
      dir = dir / max(1e-6, dist);

      // Ray-sphere intersection: origin p, dir -> sun
      vec3 oc = p - c;
      float b = dot(oc, dir);
      float cc = dot(oc, oc) - r*r;
      float disc = b*b - cc;
      if (disc <= 0.0) return 1.0;

      float sdisc = sqrt(disc);
      float tHit = -b - sdisc;
      // If hit is behind origin or beyond the sun, no shadow
      if (tHit <= 0.0 || tHit >= dist) return 1.0;

      // Soften near tangent using normalized discriminant
      float dn = disc / max(1e-6, r*r);
      float soft = saturate( smoothstep(0.0, shadowSoftness, dn) );
      // soft=0 near tangent, soft->1 deeper in shadow
      return mix(1.0, shadowMin, soft);
    }

    void main(void) {
      vec4 tex = texture2D(ringTex, vUV);
      float a = tex.a * baseAlpha;
      if (a <= 0.002) discard;

      vec3 N = normalize(vNormalW);
      vec3 L = normalize(sunPos - vPosW);

      // Two-sided simple lighting (rings are thin)
      float ndl = abs(dot(N, L));
      float lit = 0.20 + 0.80 * ndl;

      float sh = planetShadow(vPosW, sunPos, planetPos, planetRadius);

      vec3 col = tex.rgb * baseTint * lit * sh;
      gl_FragColor = vec4(col, a);
    }
  `;
}

export function makeRings(scene, planetMesh, opts) {
  ensureRingShaders();

  const name = opts.name || (planetMesh.name + "_Rings");
  const ring = BABYLON.MeshBuilder.CreateDisc(
    name,
    { radius: opts.radius, tessellation: opts.tessellation || 128 },
    scene
  );
  ring.parent = planetMesh;
  ring.rotation.x = Math.PI / 2;
  if (typeof opts.tilt === "number") ring.rotation.z = opts.tilt;
  ring.isPickable = false;

  const mat = new BABYLON.ShaderMaterial(
    name + "_mat",
    scene,
    { vertex: "ringShadow", fragment: "ringShadow" },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: [
        "world",
        "view",
        "projection",
        "sunPos",
        "planetPos",
        "planetRadius",
        "baseTint",
        "baseAlpha",
        "shadowSoftness",
        "shadowMin",
      ],
      samplers: ["ringTex"],
      needAlphaBlending: true,
    }
  );

  mat.backFaceCulling = false;
  mat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
  // Don't write depth (transparent), but keep depth test on for proper occlusion.
  mat.disableDepthWrite = true;

  mat.setTexture("ringTex", opts.texture);
  mat.setColor3("baseTint", opts.tint || new BABYLON.Color3(0.95, 0.90, 0.80));
  mat.setFloat("baseAlpha", (typeof opts.alpha === "number") ? opts.alpha : 0.95);
  mat.setFloat("shadowSoftness", (typeof opts.shadowSoftness === "number") ? opts.shadowSoftness : 0.04);
  mat.setFloat("shadowMin", (typeof opts.shadowMin === "number") ? opts.shadowMin : 0.12);

  // init uniforms (updated per frame)
  mat.setVector3("sunPos", new BABYLON.Vector3(0, 0, 0));
  mat.setVector3("planetPos", new BABYLON.Vector3(0, 0, 0));
  mat.setFloat("planetRadius", opts.planetRadius || 1);

  ring.material = mat;

  // Keep depth from other bodies: same group as planet.
  ring.renderingGroupId = planetMesh.renderingGroupId || 0;
  ring.alphaIndex = 40;

  ring.metadata = ring.metadata || {};
  ring.metadata._planetRadius = opts.planetRadius || 1;

  return ring;
}

export function updateRings(ring, planetPos, sunPos, planetRadius) {
  if (!ring || !ring.material) return;
  const mat = ring.material;
  if (!mat.setVector3) return;
  mat.setVector3("sunPos", sunPos);
  mat.setVector3("planetPos", planetPos);
  mat.setFloat("planetRadius", planetRadius);
}
