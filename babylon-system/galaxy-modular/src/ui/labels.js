// labels.js
// Elite-like HUD (DOM) anchored to the selected target (closest to screen center),
// Orbitron + teal glow styling, AU distance, and scanner ring that auto-resizes
// based on the target's apparent size (projected bounding sphere).
//
// Performance: single DOM element (no per-object DOM nodes).
// Units: uses mesh.metadata.kmPerUnit; fallback 1e6 km/unit.

export function createLabels({ scene, camera, engine }) {
  const labelsById = new Map(); // key -> { kind, mesh, text, system, planet, enabled }
  let showLabels = true;
  let lastBestKey = null;

  // Pointer selection mode:
  // - "ray": Elite-like (what you aim at). Uses a forward ray from the camera center and respects occlusion.
  // - "project": legacy (closest to screen center by projection).
  const POINTER_PICK_MODE = "ray";

  // Ray-pick throttle (ms). 33ms ≈ 30Hz
  const RAY_PICK_INTERVAL_MS = 33;

  // Keep last accepted target briefly to avoid flicker when crossing edges (ms)
  const POINTER_HOLD_MS = 160;

  let lastRayPickMs = 0;
  let lastRayPickKey = null;
  let lastAcceptMs = 0;
  
  // Category preference: when a child target is visually indistinguishable from its parent,
  // promote the pointer label to the parent category (MOON→PLANET→STAR).
  // IMPORTANT: do NOT promote STAR -> SYSTEM for distance readout, so interstellar
  // targets always use a real body (star) instead of the system anchor/baricenter.
  // Tune these thresholds to taste (pixels).
  const CATEGORY_PREFS = {
    moon:   { parent: "planet", minChildDiamPx: 7, overlapMarginPx: 10 },
    planet: { parent: "star",   minChildDiamPx: 7, overlapMarginPx: 12 },
  };

  // Index for fast parent lookup: `${group}|${system}|${nameLower}` -> meta
  const labelIndex = new Map();
  const _prefProjA = new BABYLON.Vector3();
  const _prefProjB = new BABYLON.Vector3();
const HUD_ID = "sciHud";
  const STYLE_ID = "sciHudStyle";

  const AU_KM = 149597870.7;

  function formatAU(au) {
    if (!isFinite(au)) return "—";
    const v = Math.abs(au);
    if (v >= 1000) return au.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " AU";
    if (v >= 100)  return au.toFixed(1) + " AU";
    if (v >= 10)   return au.toFixed(2) + " AU";
    return au.toFixed(3) + " AU";
  }

  function ensureHud() {
    let root = document.getElementById(HUD_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = HUD_ID;
      document.body.appendChild(root);
    }

    if (!document.getElementById(STYLE_ID)) {
      const st = document.createElement("style");
      st.id = STYLE_ID;
      st.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap");

:root{
  --ui-color:#00ffcc;
  --glow: 0 0 5px #00ffcc, 0 0 10px #00ffcc, 0 0 15px #008080, 0 0 20px #008080;
}

#${HUD_ID}{
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  pointer-events: none;
  user-select: none;
  width: 0;
  height: 0;
  display: block;
}
#${HUD_ID}[data-hidden="1"]{ display:none; }

#${HUD_ID} .anchor{
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  will-change: transform;
  animation: sciHudPulse 4s infinite ease-in-out;
}

#${HUD_ID} .scanner{
  position: absolute;
  left: 0;
  top: 0;
  width: var(--scannerSize, 160px);
  height: var(--scannerSize, 160px);
  border: 2px solid rgba(0, 255, 204, 0.18);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
}

#${HUD_ID} .scanner::before{
  content:'';
  position:absolute;
  inset: 0;
  border: 4px solid transparent;
  border-left-color: var(--ui-color);
  border-top-color: var(--ui-color);
  border-radius:50%;
  box-shadow: var(--glow);
  transform: rotate(-45deg);
  box-sizing: border-box;
}

/* Ticks around the ring (no central cross) */
#${HUD_ID} .ticks{
  position:absolute;
  inset:0;
  pointer-events:none;
}
#${HUD_ID} .t{
  position:absolute;
  background: rgba(255,255,255,0.95);
  box-shadow: var(--glow);
  opacity: 0.95;
}

/* Length and thickness scale with scanner size */
#${HUD_ID}{
  --tickLen: clamp(14px, calc(var(--scannerSize,160px) * 0.22), 90px);
  --tickTh:  clamp(1px,  calc(var(--scannerSize,160px) * 0.006), 3px);
}

/* North / South: horizontal ticks on the ring */
#${HUD_ID} .tN, #${HUD_ID} .tS{
  width: var(--tickLen);
  height: var(--tickTh);
  left: 39.25%;
  transform: translateX(-50%);
  transform: rotate(90deg);
}
#${HUD_ID} .tN{ top: -1px; }
#${HUD_ID} .tS{ bottom: -1px; }

/* East / West: vertical ticks on the ring */
#${HUD_ID} .tE, #${HUD_ID} .tW{
  width: var(--tickTh);
  height: var(--tickLen);
  top: 39.25%;
  transform: translateY(-50%);
  transform: rotate(90deg);
}
#${HUD_ID} .tE{ right: -1px; }
#${HUD_ID} .tW{ left: -1px; }
#${HUD_ID} .connector{
  position: absolute;
  left: calc(var(--scannerSize, 160px) * 0.5);
  top: 0;
  width: clamp(160px, 22vw, 320px);
  height: 0;
  border-top: 2px solid rgba(0,255,204,0.75);
  box-shadow: var(--glow);
  transform: translateY(-50%);
}
#${HUD_ID} .connector::before{
  content:'';
  position:absolute;
  left: 0;
  top: -18px;
  width: 2px;
  height: 36px;
  background: rgba(0,255,204,0.85);
  box-shadow: var(--glow);
}

#${HUD_ID} .info{
  position: absolute;
  left: calc(var(--scannerSize, 160px) * 0.5 + 18px);
  top: 0;
  transform: translateY(-50%);
  color: var(--ui-color);
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 0.4px;
  text-shadow: var(--glow);
  min-width: 200px;
}

#${HUD_ID} .info .frame{
  position: relative;
  padding-left: 6px; /* tighter */
}

#${HUD_ID} .name{
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
  /*overflow: hidden;*/
  text-overflow: ellipsis;
  max-width: 300px;
  display: inline-block;
  margin-top: 10px;
}

#${HUD_ID} .dist{
  font-size: 10px;
  display: block;
  letter-spacing: 0.4px;
  opacity: 0.95;
  margin-top: 6px;
}

#${HUD_ID} .kind{
  font-size: 10px;
  opacity: 0.8;
  margin-top: 4px;
  letter-spacing: 0.6px;
}


@keyframes sciHudPulse{
  0%{ opacity: 1; }
  50%{ opacity: .72; }
  100%{ opacity: 1; }
}
      `;
      document.head.appendChild(st);
    }

    if (!root.dataset.ready) {
      root.innerHTML = `
        <div class="anchor" id="${HUD_ID}_anchor">
          <div class="scanner" id="${HUD_ID}_scanner">
            <div class="ticks">
              <span class="t tN"></span><span class="t tS"></span>
              <span class="t tE"></span><span class="t tW"></span>
            </div>
          </div>
          <div class="connector" id="${HUD_ID}_connector"></div>
          <div class="info" id="${HUD_ID}_info">
            <div class="frame">
              <div class="name" id="${HUD_ID}_name">—</div>
              <div class="dist" id="${HUD_ID}_dist">—</div>
              <div class="kind" id="${HUD_ID}_kind">—</div>
            </div>
          </div>
        </div>
      `;
      root.dataset.ready = "1";
    }

    return {
      root,
      name: document.getElementById(`${HUD_ID}_name`),
      dist: document.getElementById(`${HUD_ID}_dist`),
      kind: document.getElementById(`${HUD_ID}_kind`),
    };
  }

  // Some registrations may pass TransformNodes. For sizing we want an AbstractMesh with bounding info.
  function resolveSizingMesh(node) {
    if (!node) return null;
    if (typeof node.getBoundingInfo === "function") return node;
    try {
      if (typeof node.getChildMeshes === "function") {
        const kids = node.getChildMeshes(false);
        for (const k of kids) {
          if (k && !k.isDisposed?.() && typeof k.getBoundingInfo === "function") return k;
        }
      }
    } catch (_) {}
    return null;
  }



  function tagMeshForPointerPick(node, key) {
	try {
		const m = resolveSizingMesh(node) || node;
		if (!m) return;
	
		// Prevent system dots from stealing ray-pick targeting.
		// We still tag metadata.labelKey, but keep them unpickable.
		const k0 = String(key || "").split(":")[0].toLowerCase();
		const allowPick = !(k0 === "system" || k0 === "sys");
	
		// Only AbstractMesh has isPickable; resolveSizingMesh() should return a mesh when possible.
		if (typeof m.isPickable !== "undefined") {
		m.isPickable = allowPick;
		m.metadata = m.metadata || {};
		m.metadata.labelKey = key;
		} else if (typeof m.getChildMeshes === "function") {
		const kids = m.getChildMeshes(false);
		for (const k of kids) {
			if (k && typeof k.isPickable !== "undefined") {
			k.isPickable = allowPick;
			k.metadata = k.metadata || {};
			k.metadata.labelKey = key;
			}
		}
		}
	} catch (_) {}
  }

  function parseLabelKey(key) {
    const parts = String(key || "").split(":");
    if (parts.length >= 4) {
      return { kind: parts[0] || "", sys: parts[1] || "", pl: parts[2] || "", id: parts.slice(3).join(":") };
    }
    return { kind: parts[0] || "", sys: parts[1] || "", pl: parts[2] || "", id: parts[3] || "" };
  }

  function kindGroup(kind) {
    const k = String(kind || "").toLowerCase();
    if (k === "system" || k === "sys") return "system";
    if (k === "sun" || k === "star") return "star";
    if (k === "planet") return "planet";
    if (
      k === "moon" || k === "luna" ||
      k === "satellite" || k === "sat" ||
      // tus satélites artificiales vienen como labelKind="artSat"
      k === "artsat" || k === "artificialsatellite"
    ) return "moon";
    return null;
  }

  function indexMeta(meta) {
    try {
      const group = kindGroup(meta.kind);
      if (!group) return;
      const sys = String(meta.system || "");
      const textLower = String(meta.text || "").toLowerCase();
      const parsed = parseLabelKey(meta.key);
      const idLower = String(parsed.id || "").toLowerCase();
      if (textLower) labelIndex.set(`${group}|${sys}|${textLower}`, meta);
      if (idLower)   labelIndex.set(`${group}|${sys}|${idLower}`, meta);
      if (group === "system" && sys) labelIndex.set(`${group}|${sys}|${sys.toLowerCase()}`, meta);
    } catch (_) {}
  }

  function getMetaByGroupName(group, sys, name) {
    const g = String(group || "");
    const s = String(sys || "");
    const n = String(name || "").toLowerCase();
    if (!g || !n) return null;
    const k = `${g}|${s}|${n}`;
    const hit = labelIndex.get(k);
    if (hit && hit.enabled !== false) return hit;

    // Fallback scan (covers cases where text differs from id or index isn't populated yet)
    for (const m of labelsById.values()) {
      if (m && m.enabled === false) continue;
      if (kindGroup(m.kind) !== g) continue;
      if (String(m.system || "") !== s) continue;
      const t = String(m.text || "").toLowerCase();
      if (t === n) return m;
      const id = String(parseLabelKey(m.key).id || "").toLowerCase();
      if (id === n) return m;
    }
    return null;
  }

  function getWorldPos(node) {
    const sizing = resolveSizingMesh(node) || node;
    if (!sizing) return null;
    if (typeof sizing.getAbsolutePosition === "function") return sizing.getAbsolutePosition();
    if (typeof node.getAbsolutePosition === "function") return node.getAbsolutePosition();
    return sizing.position || node.position || null;
  }

  function shouldPromoteToParent(childMeta, parentMeta, w, h, prefs) {
    try {
      const childNode = childMeta.mesh;
      const parentNode = parentMeta.mesh;
      if (!childNode || !parentNode) return false;

      const childSizing = resolveSizingMesh(childNode) || childNode;
      const parentSizing = resolveSizingMesh(parentNode) || parentNode;

      const childPos = getWorldPos(childNode);
      const parentPos = getWorldPos(parentNode);
      if (!childPos || !parentPos) return false;

      const childDiam = computeProjectedDiameterPx(childSizing, childPos);
      const minDiam = (prefs && prefs.minChildDiamPx) ? prefs.minChildDiamPx : 0;
      if (childDiam < minDiam) return true;

      const parentDiam = computeProjectedDiameterPx(parentSizing, parentPos);
      const vp = camera.viewport.toGlobal(w, h);
      BABYLON.Vector3.ProjectToRef(childPos, BABYLON.Matrix.IdentityReadOnly, scene.getTransformMatrix(), vp, _prefProjA);
      BABYLON.Vector3.ProjectToRef(parentPos, BABYLON.Matrix.IdentityReadOnly, scene.getTransformMatrix(), vp, _prefProjB);

      if (!isFinite(_prefProjA.x) || !isFinite(_prefProjA.y) || _prefProjA.z < 0 || _prefProjA.z > 1) return false;
      if (!isFinite(_prefProjB.x) || !isFinite(_prefProjB.y) || _prefProjB.z < 0 || _prefProjB.z > 1) return false;

      const dx = _prefProjA.x - _prefProjB.x;
      const dy = _prefProjA.y - _prefProjB.y;
      const dist = Math.hypot(dx, dy);

      const rChild = childDiam * 0.5;
      const rParent = parentDiam * 0.5;
      const margin = (prefs && prefs.overlapMarginPx) ? prefs.overlapMarginPx : 0;
      return dist < (rChild + rParent + margin);
    } catch (_) {
      return false;
    }
  }

  function applyCategoryPreference(bestMeta, w, h) {
    if (!bestMeta) return bestMeta;
    let cur = bestMeta;

    for (let step = 0; step < 3; step++) {
      const group = kindGroup(cur.kind);
      const rule = group ? CATEGORY_PREFS[group] : null;
      if (!rule || !rule.parent) break;

      const parentGroup = rule.parent;
      let parentName = null;
      const node = cur.mesh;
      const sizing = resolveSizingMesh(node) || node;

      if (parentGroup === "planet") {
        // moons/satellites: prefer their parent planet until visually separable
        parentName = cur.planet || sizing?.metadata?.orbits || node?.metadata?.orbits;
      } else if (parentGroup === "star") {
        // planets: prefer the star they orbit until visually separable
        parentName = sizing?.metadata?.orbits || node?.metadata?.orbits;
      } else if (parentGroup === "system") {
        // stars: prefer the system label at long range / when indistinguishable
        parentName = cur.system;
      }

      const sys = cur.system || "";
      const parentMeta = getMetaByGroupName(parentGroup, sys, parentName);
      if (!parentMeta) break;

      if (shouldPromoteToParent(cur, parentMeta, w, h, rule)) {
        cur = parentMeta;
        continue;
      }
      break;
    }

    return cur;
  }

  function registerLabel(id, text, kind, mesh, extra) {
    if (!mesh) return null;
    let key = String(id || "");
    if (!key) return null;

    if (!key.includes(":")) {
      const sys = extra && extra.system ? extra.system : "";
      const pl  = extra && extra.planet ? extra.planet : "";
      key = `${kind}:${sys}:${pl}:${key}`;
    }

    let meta = labelsById.get(key);
    if (!meta) {
      meta = {
        key,
        kind,
        mesh,
        text: String(text || ""),
        system: extra && extra.system,
        planet: extra && extra.planet,
        enabled: true,
      };
      labelsById.set(key, meta);
    } else {
      meta.key = key;
      meta.kind = kind || meta.kind;
      meta.mesh = mesh || meta.mesh;
      meta.text = String(text || meta.text || "");
      if (extra && typeof extra.system !== "undefined") meta.system = extra.system;
      if (extra && typeof extra.planet !== "undefined") meta.planet = extra.planet;
      if (typeof meta.enabled === "undefined") meta.enabled = true; // preserve disabled state
    }
    tagMeshForPointerPick(mesh, key);
    indexMeta(meta);


    return key;
  }

  function setShowLabels(v) {
    showLabels = !!v;
    const hud = ensureHud();
    if (hud && hud.root) hud.root.dataset.hidden = showLabels ? "0" : "1";
  }

  function setLabelEnabled(key, enabled) {
    const k = String(key || "");
    if (!k) return false;
    const meta = labelsById.get(k);
    if (!meta) return false;

    meta.enabled = !!enabled;

    // Clear sticky pointers if we just disabled the active target
    if (!meta.enabled) {
      if (lastBestKey === k) lastBestKey = null;
      if (lastRayPickKey === k) lastRayPickKey = null;
    }
    return true;
  }


  
  function computeProjectedDiameterPx(sizingMesh, worldPos) {
    try {
      if (sizingMesh && sizingMesh.computeWorldMatrix) sizingMesh.computeWorldMatrix(true);
      const bi = (sizingMesh && typeof sizingMesh.getBoundingInfo === "function") ? sizingMesh.getBoundingInfo() : null;
      const bs = bi && bi.boundingSphere ? bi.boundingSphere : null;
      let rWorld = 0;
      if (bs) {
        rWorld = bs.radiusWorld || 0;
      } else {
        // Fallback: physical nodes (TransformNode) carry radiusWorld in metadata
        const md  = sizingMesh && sizingMesh.metadata ? sizingMesh.metadata : null;
        const mdP = sizingMesh && sizingMesh.parent && sizingMesh.parent.metadata ? sizingMesh.parent.metadata : null;
        rWorld = Number(md?.radiusWorld || mdP?.radiusWorld || 0);
      }
      if (!(rWorld > 0)) return 0;

      const camPos = camera.globalPosition || camera.position;
      const d = BABYLON.Vector3.Distance(camPos, worldPos);
      if (d <= 1e-6) return 1e9;

      const vh = engine.getRenderHeight(true);
      const fov = (typeof camera.fov === "number") ? camera.fov : 0.8;
      const tanHalf = Math.tan(fov * 0.5);

      const projR = (rWorld / (d * tanHalf)) * (vh / 2);
      return Math.max(0, projR * 2);
    } catch (_) {
      return 0;
    }
  }

  function computeScannerPx(sizingMesh, worldPos) {
    const BASE = 50;
    const MINP = 20;
    const MAXP = 420;
    let px = BASE;

    try {
      if (sizingMesh && sizingMesh.computeWorldMatrix) sizingMesh.computeWorldMatrix(true);

      const bi = (sizingMesh && typeof sizingMesh.getBoundingInfo === "function") ? sizingMesh.getBoundingInfo() : null;
      const bs = bi && bi.boundingSphere ? bi.boundingSphere : null;
      if (bs) {
        const rWorld = bs.radiusWorld || 0;
        const camPos = camera.globalPosition || camera.position;
        const d = BABYLON.Vector3.Distance(camPos, worldPos);

        const vh = engine.getRenderHeight(true);
        const fov = (typeof camera.fov === "number") ? camera.fov : 0.8;
        const tanHalf = Math.tan(fov * 0.5);

        if (d > 1e-6 && rWorld > 0) {
          const projR = (rWorld / (d * tanHalf)) * (vh / 2);
          const margin = 28;
          px = (projR * 2) + margin;
        }
      }
    } catch (_) {}

    return Math.max(MINP, Math.min(MAXP, px));
  }


  function pickTargetByRay(nowMs) {
    if (POINTER_PICK_MODE !== "ray") return null;

    // Throttle expensive picking
    if (nowMs - lastRayPickMs < RAY_PICK_INTERVAL_MS) {
      return lastRayPickKey ? labelsById.get(lastRayPickKey) : null;
    }
    lastRayPickMs = nowMs;

    lastRayPickKey = null;

    try {
      const len = (camera && isFinite(camera.maxZ)) ? camera.maxZ : 1e9;
      const ray = camera.getForwardRay(len);

      const hit = scene.pickWithRay(
        ray,
        (m) => {
          if (!m || !m.metadata || !m.metadata.labelKey) return false;
          const lk = m.metadata.labelKey;
          const lmeta = labelsById.get(lk);
          if (lmeta && lmeta.enabled === false) return false;
          const lkind = String(lmeta?.kind || lk.split(":")[0] || "").toLowerCase();
          if (lkind === "system" || lkind === "sys") return false;

          // If the label is disabled, do not allow picking it.
          const k = m.metadata.labelKey;
          const meta = labelsById.get(k);
          if (meta && meta.enabled === false) return false;

          if (typeof m.isDisposed === "function" && m.isDisposed()) return false;
          if (typeof m.isEnabled === "function" && !m.isEnabled()) return false;
          if (typeof m.isVisible === "boolean" && !m.isVisible) return false;
          return true;
        },
        false
      );

      if (hit && hit.hit && hit.pickedMesh) {
        let m = hit.pickedMesh;

        // Climb parents (in case the picked mesh is a child under a labeled TransformNode)
        for (let i = 0; i < 10 && m; i++) {
          const k = m.metadata && m.metadata.labelKey;
          if (k) {
            const meta = labelsById.get(k);
            if (meta && meta.enabled === false) {
              // ignore disabled label
            } else if (meta) {
              lastRayPickKey = k;
              break;
            }
          }
          m = m.parent;
        }
      }
    } catch (_) {}

    return lastRayPickKey ? labelsById.get(lastRayPickKey) : null;
  }

  function update(_debugFlag) {
    if (!camera || !engine || !scene) return;

    const hud = ensureHud();
    if (!hud || !hud.root) return;

    if (!showLabels) {
      hud.root.dataset.hidden = "1";
      return;
    }
    hud.root.dataset.hidden = "0";

    const w = engine.getRenderWidth(true);
    const h = engine.getRenderHeight(true);
    if (w <= 2 || h <= 2) return;

    const centerX = w * 0.5;
    const centerY = h * 0.5;

    const nowMs = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();

    let best = null;
    let bestD2 = Infinity;
    let bestDepth = Infinity;

    // If a non-system target is visually "big" (>=5px diameter), prefer it over the system pointer.
    let bestBig = null;
    let bestBigD2 = Infinity;

    // Track nearest system label (used when all bodies are tiny)
    let bestSystem = null;
    let bestSystemD2 = Infinity;

    // Track nearest non-system + its apparent diameter
    let bestNonSystem = null;
    let bestNonSystemD2 = Infinity;
    let bestNonSystemDiam = 0;

    // Reuse temps to avoid allocations
    const proj = new BABYLON.Vector3();
    const forward = new BABYLON.Vector3();
    const toObj = new BABYLON.Vector3();
    const camPos = camera.globalPosition || camera.position;

    if (typeof camera.getDirectionToRef === "function") {
      camera.getDirectionToRef(BABYLON.Axis.Z, forward);
    } else {
      forward.copyFrom(camera.getForwardRay().direction);
    }

    // ---- ELITE MODE: ray-pick from camera center (occlusion-aware) ----
    const rayMeta = pickTargetByRay(nowMs);
    const pickedByRay = !!rayMeta;
    if (pickedByRay) {
      best = rayMeta;
      bestD2 = 0;
      bestDepth = 0;
    } else {
      for (const meta of labelsById.values()) {
        if (meta && meta.enabled === false) continue;
        const node = meta && meta.mesh;
        if (!node) continue;

        const sizingMesh = resolveSizingMesh(node) || node;

        if (sizingMesh && sizingMesh.isDisposed?.()) continue;
        const enabledOK = (typeof sizingMesh.isEnabled === "function") ? sizingMesh.isEnabled() : true;
        const visibleOK = (typeof sizingMesh.isVisible === "boolean") ? sizingMesh.isVisible : true; // TransformNode => true
        if (!enabledOK || !visibleOK) continue;

        const wp = (sizingMesh && typeof sizingMesh.getAbsolutePosition === "function")
          ? sizingMesh.getAbsolutePosition()
          : ((typeof node.getAbsolutePosition === "function")
              ? node.getAbsolutePosition()
              : (node.position || sizingMesh?.position));

        if (!wp) continue;

        // ---- FRONT CHECK (discard behind camera) ----
        wp.subtractToRef(camPos, toObj);
        const depth = BABYLON.Vector3.Dot(toObj, forward);
        if (!(depth > (camera.minZ || 0))) continue;

        BABYLON.Vector3.ProjectToRef(
          wp,
          BABYLON.Matrix.IdentityReadOnly,
          scene.getTransformMatrix(),
          camera.viewport.toGlobal(w, h),
          proj
        );

        if (!isFinite(proj.x) || !isFinite(proj.y) || proj.z < 0 || proj.z > 1) continue;
        if (proj.x < 0 || proj.x > w || proj.y < 0 || proj.y > h) continue;

        const dx = proj.x - centerX;
        const dy = proj.y - centerY;
        const d2 = dx * dx + dy * dy;

        // Prefer closer-to-center; if very close, prefer nearer depth
        const EPS = 1.0; // px^2
        if (d2 + EPS < bestD2 || (Math.abs(d2 - bestD2) <= EPS && depth < bestDepth)) {
          bestD2 = d2;
  		bestDepth = depth;
          best = meta;
        }

        // Track nearest system / non-system and apply size-based preferences
        const kind = String(meta.kind || "").toLowerCase();

        if (kind === "system" || kind === "sys") {
          if (d2 < bestSystemD2) {
            bestSystemD2 = d2;
            bestSystem = meta;
          }
        } else {
          const diamPx = computeProjectedDiameterPx(sizingMesh, wp);

          // Far away: ignore tiny bodies so the SYSTEM label wins,
          // BUT allow selecting tiny bodies if you're aiming almost exactly at them.
          const TINY_MIN_PX = 1;
          const TINY_AIM_PX = 24; // within 24px of center => allow (helps tiny bodies)
          if (diamPx < TINY_MIN_PX && d2 > (TINY_AIM_PX * TINY_AIM_PX)) {
            continue;
          }

          // nearest non-system (only if >=1px)
          if (d2 < bestNonSystemD2) {
            bestNonSystemD2 = d2;
            bestNonSystem = meta;
            bestNonSystemDiam = diamPx;
          }

          // big-enough non-system preference (close-range)
          if (diamPx >= 5 && d2 < bestBigD2) {
            bestBigD2 = d2;
            bestBig = meta;
          }
        }
      }


      if (!best) {
        hud.root.dataset.hidden = "1";
        return;
      }

      // Selection rules:
      // 1) If something non-system is closest to center, respect it.
      // 2) If the closest-to-center is the SYSTEM, prefer a real body whenever one exists.
      // 3) Only use SYSTEM if there is literally no selectable non-system body.

      const bestKind = String(best.kind || "").toLowerCase();
      const bestIsSystem = (bestKind === "system" || bestKind === "sys");

      if (bestIsSystem) {
        // Unify criteria: for distance readout, prefer real bodies over system labels.
        // This avoids mixing star distances with system-anchor/baricenter distances.
        if (bestBig) {
          best = bestBig;
        } else if (bestNonSystem) {
          best = bestNonSystem;
        } else if (bestSystem) {
          best = bestSystem;
        }
      } else {
        // best is already a body (star/planet/moon). Do NOT override it with bestBig.
        // This allows a centered planet to win even if the star is large.
      }

      // ---- HYSTERESIS: keep last target unless new is clearly better ----
      if (best && best.key && lastBestKey && best.key !== lastBestKey) {
        const lastMeta = labelsById.get(lastBestKey);
        if (lastMeta && lastMeta.mesh) {
          const lastNode = lastMeta.mesh;
          const lastSizing = resolveSizingMesh(lastNode) || lastNode;
          const lastWp = (lastSizing && typeof lastSizing.getAbsolutePosition === "function")
            ? lastSizing.getAbsolutePosition()
            : (lastNode.getAbsolutePosition ? lastNode.getAbsolutePosition() : lastNode.position);

          if (lastWp) {
            lastWp.subtractToRef(camPos, toObj);
            const lastDepth = BABYLON.Vector3.Dot(toObj, forward);
            if (lastDepth > (camera.minZ || 0)) {
              BABYLON.Vector3.ProjectToRef(
                lastWp,
                BABYLON.Matrix.IdentityReadOnly,
                scene.getTransformMatrix(),
                camera.viewport.toGlobal(w, h),
                proj
              );
              if (isFinite(proj.x) && isFinite(proj.y) && proj.z >= 0 && proj.z <= 1 && proj.x >= 0 && proj.x <= w && proj.y >= 0 && proj.y <= h) {
                const ldx = proj.x - centerX, ldy = proj.y - centerY;
                const lastD2 = ldx*ldx + ldy*ldy;
                const HYST_PX = 18; // cambio mínimo para “saltar”
                const HYST_D2 = HYST_PX * HYST_PX;
                if (bestD2 > (lastD2 - HYST_D2)) {
                  best = lastMeta;
                }
              }
            }
          }
        }
      }
    
    }


    // Category preference (MOON→PLANET→STAR) when child is not visually separable
    best = applyCategoryPreference(best, w, h);
    if (!best) {
      hud.root.dataset.hidden = "1";
      return;
    }

    // ---- TIME HOLD (extra stability) ----
    if (best && best.key) {
      if (lastBestKey && best.key !== lastBestKey) {
        const lastMeta = labelsById.get(lastBestKey);
        if (lastMeta && (nowMs - lastAcceptMs) < POINTER_HOLD_MS) {
          best = lastMeta;
        } else {
          lastAcceptMs = nowMs;
        }
      } else if (!lastBestKey) {
        lastAcceptMs = nowMs;
      }

      if (best && best.key) lastBestKey = best.key;
    }

    const node = best.mesh;
    const sizingMesh = resolveSizingMesh(node) || node;

    const wp = (sizingMesh && typeof sizingMesh.getAbsolutePosition === "function")
        ? sizingMesh.getAbsolutePosition()
        : ((typeof node.getAbsolutePosition === "function")
            ? node.getAbsolutePosition()
            : (node.position || sizingMesh?.position));

    BABYLON.Vector3.ProjectToRef(
      wp,
      BABYLON.Matrix.IdentityReadOnly,
      scene.getTransformMatrix(),
      camera.viewport.toGlobal(w, h),
      proj
    );

    hud.root.style.left = `${proj.x}px`;
    hud.root.style.top  = `${proj.y}px`;

    const scannerPx = computeScannerPx(sizingMesh, wp);
    hud.root.style.setProperty("--scannerSize", `${scannerPx.toFixed(1)}px`);

    const name = String(best.text || "—").toUpperCase();
    const kind = String(best.kind || "—").toUpperCase();

    const dUnits = BABYLON.Vector3.Distance(camPos, wp);
    const kmPerUnit = (sizingMesh?.metadata?.kmPerUnit ?? node?.metadata?.kmPerUnit) || 1e6;
    const au = (dUnits * kmPerUnit) / AU_KM;

    if (hud.name) hud.name.textContent = name;
    if (hud.dist) hud.dist.textContent = formatAU(au);
    if (hud.kind) hud.kind.textContent = kind;
  }


  return { registerLabel, setLabelEnabled, setShowLabels, update, labelsById };
}