// ui/navGrid.js
// Ayuda de navegación (UI/debug) tipo "mundo 3D":
// - Lazy init: no crea nada hasta que el usuario activa el toggle
// - "Infinita" por snap: se recoloca alrededor de la cámara (muy barato)
// - Reconstrucción opcional a cierta distancia (muy infrecuente)
// - Incluye ejes X/Y/Z con colores (X rojo, Y verde, Z azul)

export function createNavigationGridController({ scene, worldRoot, camera, opts = {} }) {
  const STEP_DEFAULT = 100_000;
  const EXTENT_DEFAULT = 2_000_000;   // pequeño = barato
  const MAX_LINES_DEFAULT = 401;      // clamp de seguridad

  let step = (Number.isFinite(opts.step) && opts.step > 0) ? opts.step : STEP_DEFAULT;
  let extent = (Number.isFinite(opts.extent) && opts.extent > 0) ? opts.extent : EXTENT_DEFAULT;
  let maxLinesPerAxis = (Number.isFinite(opts.maxLinesPerAxis) && opts.maxLinesPerAxis > 10)
    ? Math.floor(opts.maxLinesPerAxis)
    : MAX_LINES_DEFAULT;

  const autoCenter = (opts.autoCenter !== false);          // default true
  const followY = (opts.followY !== false);                // default true (UI helper “pegado” a ti)
  const disposeOnDisable = (opts.disposeOnDisable !== false); // default true

  // Anclaje fijo (p.ej. al Sol): NO “sigue” cámara ni chunks; es una referencia del espacio
  const fixedAnchor = !!opts.fixedAnchor;
  const getAnchorPosition = (typeof opts.getAnchorPosition === "function") ? opts.getAnchorPosition : null;

  // Modo:
  // - "follow": sigue a cámara por snap (tu comportamiento actual)
  // - "chunk": NO sigue continuamente; solo se recentra al pasar un umbral (más “estable”)
  const mode = (opts.mode === "follow" || opts.mode === "chunk") ? opts.mode : "chunk";
  const includeYZ = (opts.includeYZ !== false); // default true

  // Posición de referencia (para floating origin: usa absoluta)
  const getReferencePosition = (typeof opts.getReferencePosition === "function") ? opts.getReferencePosition : null;
 
  // Snap: cada cuánto “salta” el grid al seguir la cámara
  let snap = (Number.isFinite(opts.snap) && opts.snap > 0) ? opts.snap : step;

  // Chunk size (solo en modo chunk). Por defecto = extent
  let chunk = (Number.isFinite(opts.chunk) && opts.chunk > 0) ? opts.chunk : extent;

  // Reconstrucción opcional (en unidades del mundo). 0 = nunca.
  // Recomendación: algo grande, p.ej. extent * 8
  let rebuildDistance = (Number.isFinite(opts.rebuildDistance) && opts.rebuildDistance >= 0)
    ? opts.rebuildDistance
    : (extent * 8);

  // Throttle opcional (ms). 0 = sin throttle.
  const throttleMs = (Number.isFinite(opts.throttleMs) && opts.throttleMs >= 0) ? opts.throttleMs : 0;

  const yLevel = (Number.isFinite(opts.yLevel)) ? opts.yLevel : -0.01;

  // Colores de ejes (estándar 3D: X rojo, Y verde, Z azul)
  const axisColors = opts.axisColors || {};
  const axisColorX = axisColors.x || new BABYLON.Color3(1.0, 0.20, 0.20);
  const axisColorY = axisColors.y || new BABYLON.Color3(0.20, 1.0, 0.20);
  const axisColorZ = axisColors.z || new BABYLON.Color3(0.35, 0.60, 1.0);
  const axisAlpha  = Number.isFinite(opts.axisAlpha) ? opts.axisAlpha : 0.30;
  const axisExtent = (Number.isFinite(opts.axisExtent) && opts.axisExtent > 0) ? opts.axisExtent : extent;

  // Grid con colores por eje (por defecto ON)
  const gridAxisColored = (opts.gridAxisColored !== false);
  const gridAlpha = Number.isFinite(opts.gridAlpha) ? opts.gridAlpha : 0.08;

  // Clamp para no volver a generar decenas de miles de líneas por accidente
  const maxExtent = Math.floor(((maxLinesPerAxis - 1) * 0.5) * step);
  if (extent > maxExtent) extent = maxExtent;
  if (!Number.isFinite(snap) || snap <= 0) snap = step;

  function makeLineMat(name, color3, alpha) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.disableLighting = true;
    mat.emissiveColor = color3.clone ? color3.clone() : color3;
    mat.alpha = (Number.isFinite(alpha) ? alpha : 0.1);
    return mat;
  }

  function buildGridXZ() {
    if (gridAxisColored){
      const linesZ = []; // líneas paralelas a Z (x fijo) -> color Z
      const linesX = []; // líneas paralelas a X (z fijo) -> color X
      for (let x = -extent; x <= extent; x += step) {
        linesZ.push([new BABYLON.Vector3(x, 0, -extent), new BABYLON.Vector3(x, 0, extent)]);
      }
      for (let z = -extent; z <= extent; z += step) {
        linesX.push([new BABYLON.Vector3(-extent, 0, z), new BABYLON.Vector3(extent, 0, z)]);
      }
      const mZ = BABYLON.MeshBuilder.CreateLineSystem("navGridXZ_Z", { lines: linesZ }, scene);
      const mX = BABYLON.MeshBuilder.CreateLineSystem("navGridXZ_X", { lines: linesX }, scene);
      for (const m of [mZ, mX]) {
        m.parent = worldRoot;
        m.isPickable = false;
        m.position.y = yLevel;
      }
      mZ.material = makeLineMat("navGridXZ_Z_Mat", axisColorZ, gridAlpha);
      mX.material = makeLineMat("navGridXZ_X_Mat", axisColorX, gridAlpha);
      return [mZ, mX];
    } else {
      const lines = [];
      for (let x = -extent; x <= extent; x += step) {
        lines.push([new BABYLON.Vector3(x, 0, -extent), new BABYLON.Vector3(x, 0, extent)]);
      }
      for (let z = -extent; z <= extent; z += step) {
        lines.push([new BABYLON.Vector3(-extent, 0, z), new BABYLON.Vector3(extent, 0, z)]);
      }
      const mesh = BABYLON.MeshBuilder.CreateLineSystem("navGridXZ", { lines }, scene);
      mesh.parent = worldRoot;
      mesh.isPickable = false;
      mesh.position.y = yLevel;
      mesh.material = makeLineMat("navGridXZMat", new BABYLON.Color3(0.45, 1.0, 0.55), 0.12);
      return mesh;
    }
  }

  function buildGridXY() {
    if (gridAxisColored){
      const linesY = []; // x fijo => líneas paralelas a Y -> verde
      const linesX = []; // y fijo => líneas paralelas a X -> rojo
      for (let x = -extent; x <= extent; x += step) {
        linesY.push([new BABYLON.Vector3(x, -extent, 0), new BABYLON.Vector3(x, extent, 0)]);
      }
      for (let y = -extent; y <= extent; y += step) {
        linesX.push([new BABYLON.Vector3(-extent, y, 0), new BABYLON.Vector3(extent, y, 0)]);
      }
      const mY = BABYLON.MeshBuilder.CreateLineSystem("navGridXY_Y", { lines: linesY }, scene);
      const mX = BABYLON.MeshBuilder.CreateLineSystem("navGridXY_X", { lines: linesX }, scene);
      for (const m of [mY, mX]) {
        m.parent = worldRoot;
        m.isPickable = false;
      }
      mY.material = makeLineMat("navGridXY_Y_Mat", axisColorY, gridAlpha * 0.8);
      mX.material = makeLineMat("navGridXY_X_Mat", axisColorX, gridAlpha * 0.8);
      return [mY, mX];
    } else {
      const lines = [];
      for (let x = -extent; x <= extent; x += step) {
        lines.push([new BABYLON.Vector3(x, -extent, 0), new BABYLON.Vector3(x, extent, 0)]);
      }
      for (let y = -extent; y <= extent; y += step) {
        lines.push([new BABYLON.Vector3(-extent, y, 0), new BABYLON.Vector3(extent, y, 0)]);
      }
      const mesh = BABYLON.MeshBuilder.CreateLineSystem("navGridXY", { lines }, scene);
      mesh.parent = worldRoot;
      mesh.isPickable = false;
      mesh.material = makeLineMat("navGridXYMat", new BABYLON.Color3(0.45, 0.75, 1.0), 0.08);
      return mesh;
    }
  }

  function buildGridYZ() {
    if (gridAxisColored){
      const linesY = []; // z fijo => líneas paralelas a Y -> verde
      const linesZ = []; // y fijo => líneas paralelas a Z -> azul
      for (let z = -extent; z <= extent; z += step) {
        linesY.push([new BABYLON.Vector3(0, -extent, z), new BABYLON.Vector3(0, extent, z)]);
      }
      for (let y = -extent; y <= extent; y += step) {
        linesZ.push([new BABYLON.Vector3(0, y, -extent), new BABYLON.Vector3(0, y, extent)]);
      }
      const mY = BABYLON.MeshBuilder.CreateLineSystem("navGridYZ_Y", { lines: linesY }, scene);
      const mZ = BABYLON.MeshBuilder.CreateLineSystem("navGridYZ_Z", { lines: linesZ }, scene);
      for (const m of [mY, mZ]) {
        m.parent = worldRoot;
        m.isPickable = false;
      }
      mY.material = makeLineMat("navGridYZ_Y_Mat", axisColorY, gridAlpha * 0.6);
      mZ.material = makeLineMat("navGridYZ_Z_Mat", axisColorZ, gridAlpha * 0.6);
      return [mY, mZ];
    } else {
      const lines = [];
      for (let z = -extent; z <= extent; z += step) {
        lines.push([new BABYLON.Vector3(0, -extent, z), new BABYLON.Vector3(0, extent, z)]);
      }
      for (let y = -extent; y <= extent; y += step) {
        lines.push([new BABYLON.Vector3(0, y, -extent), new BABYLON.Vector3(0, y, extent)]);
      }
      const mesh = BABYLON.MeshBuilder.CreateLineSystem("navGridYZ", { lines }, scene);
      mesh.parent = worldRoot;
      mesh.isPickable = false;
      mesh.material = makeLineMat("navGridYZMat", new BABYLON.Color3(1.0, 0.35, 0.35), 0.06);
      return mesh;
    }
  }

  function buildAxisX() {
    const mesh = BABYLON.MeshBuilder.CreateLines("navAxisX", {
      points: [
        new BABYLON.Vector3(-axisExtent, 0, 0),
        new BABYLON.Vector3(axisExtent, 0, 0),
      ]
    }, scene);
    mesh.parent = worldRoot;
    mesh.isPickable = false;
    mesh.material = makeLineMat("navAxisXMat", axisColorX, axisAlpha);
    return mesh;
  }

  function buildAxisY() {
    const mesh = BABYLON.MeshBuilder.CreateLines("navAxisY", {
      points: [
        new BABYLON.Vector3(0, -axisExtent, 0),
        new BABYLON.Vector3(0, axisExtent, 0),
      ]
    }, scene);
    mesh.parent = worldRoot;
    mesh.isPickable = false;
    mesh.material = makeLineMat("navAxisYMat", axisColorY, axisAlpha);
    return mesh;
  }

  function buildAxisZ() {
    const mesh = BABYLON.MeshBuilder.CreateLines("navAxisZ", {
      points: [
        new BABYLON.Vector3(0, 0, -axisExtent),
        new BABYLON.Vector3(0, 0, axisExtent),
      ]
    }, scene);
    mesh.parent = worldRoot;
    mesh.isPickable = false;
    mesh.material = makeLineMat("navAxisZMat", axisColorZ, axisAlpha);
    return mesh;
  }

  // --- Lazy state ---
  let gridXZ = null, gridXY = null, gridYZ = null, axisX = null, axisY = null, axisZ = null;
  let meshes = null;
  let enabled = false;
  let obs = null;
  let lastUpdateT = 0;

  let lastAnchorX = NaN, lastAnchorY = NaN, lastAnchorZ = NaN;
  let lastRootX = NaN, lastRootY = NaN, lastRootZ = NaN;
  let lastRebuildX = NaN, lastRebuildY = NaN, lastRebuildZ = NaN;

  function build() {
    gridXZ = buildGridXZ();
    gridXY = buildGridXY();
	if (includeYZ) gridYZ = buildGridYZ();
    axisX = buildAxisX();
    axisY = buildAxisY();
    axisZ = buildAxisZ();
    const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
    meshes = [
      ...toArr(gridXZ),
      ...toArr(gridXY),
      ...(includeYZ ? toArr(gridYZ) : []),
      axisX, axisY, axisZ
    ].filter(Boolean);
  }

  function disposeMeshes() {
    if (!meshes) return;
    for (const m of meshes) {
      if (m && !m.isDisposed()) m.dispose(false, true);
    }
    gridXZ = gridXY = gridYZ = axisX = axisY = axisZ = null;
    meshes = null;
  }

  function applyAnchorAbs(ax, ay, az) {
    // Convertir ABS -> LOCAL (porque cuelga de worldRoot y hay floating origin)
    const pAbs = worldRoot ? worldRoot.getAbsolutePosition() : null;
    const px = pAbs ? pAbs.x : 0;
    const py = pAbs ? pAbs.y : 0;
    const pz = pAbs ? pAbs.z : 0;

    // Early exit si no cambió ni el anchor ABS ni el worldRoot ABS
    if (
      ax === lastAnchorX && ay === lastAnchorY && az === lastAnchorZ &&
      px === lastRootX && py === lastRootY && pz === lastRootZ
    ) return;

    lastAnchorX = ax; lastAnchorY = ay; lastAnchorZ = az;
    lastRootX = px; lastRootY = py; lastRootZ = pz;

    const lx = ax - px;
    const ly = ay - py;
    const lz = az - pz;

    const each = (v, fn) => {
      if (!v) return;
      if (Array.isArray(v)) { for (const m of v) if (m) fn(m); }
      else fn(v);
    };

    each(gridXZ, (m) => {
      m.position.x = lx;
      m.position.z = lz;
      m.position.y = followY ? (ly + yLevel) : yLevel;
    });
    each(gridXY, (m) => {
      m.position.x = lx;
      m.position.z = lz;
      m.position.y = followY ? ly : 0;
    });
    each(gridYZ, (m) => {
      m.position.x = lx;
      m.position.z = lz;
      m.position.y = followY ? ly : 0;
    });
    if (axisX) {
      axisX.position.x = lx;
      axisX.position.z = lz;
      axisX.position.y = followY ? (ly + (yLevel + 0.001)) : (yLevel + 0.001);
    }
    if (axisY) {
      axisY.position.x = lx;
      axisY.position.z = lz;
      axisY.position.y = followY ? ly : 0;
    }
    if (axisZ) {
      axisZ.position.x = lx;
      axisZ.position.z = lz;
      axisZ.position.y = followY ? (ly + (yLevel + 0.001)) : (yLevel + 0.001);
    }
  }

  function rebuildAt(sx, sy, sz) {
    // Reconstrucción (dispose+build) infrecuente.
    disposeMeshes();
    build();
    applyAnchorAbs(sx, sy, sz);
    lastRebuildX = sx; lastRebuildY = sy; lastRebuildZ = sz;
  }

  function update() {
    if (!enabled || !camera || !meshes) return;

    if (throttleMs > 0) {
      const now = performance.now();
      if ((now - lastUpdateT) < throttleMs) return;
      lastUpdateT = now;
    }

    // 1) Modo anclado fijo: usa el anchor (Sol) y NO recientra por cámara
    if (fixedAnchor) {
      const a = getAnchorPosition ? getAnchorPosition() : null;
      const ax = a ? a.x : 0;
      const ay = a ? a.y : 0;
      const az = a ? a.z : 0;
      applyAnchorAbs(ax, ay, az);
      return;
    }

    // 2) Modos anteriores (follow/chunk) — requieren autoCenter
    if (!autoCenter) return;

    const p = getReferencePosition ? getReferencePosition() : camera.position;

    let ax, ay, az;
    if (mode === "follow") {
      ax = Math.round(p.x / snap) * snap;
      ay = Math.round(p.y / snap) * snap;
      az = Math.round(p.z / snap) * snap;
    } else {
      // modo chunk: estable, solo cambia al cruzar el umbral
      const half = chunk * 0.5;
      if (!Number.isFinite(lastAnchorX)) {
        ax = Math.round(p.x / chunk) * chunk;
        ay = Math.round(p.y / chunk) * chunk;
        az = Math.round(p.z / chunk) * chunk;
      } else {
        ax = lastAnchorX;
        ay = lastAnchorY;
        az = lastAnchorZ;
        if (Math.abs(p.x - ax) > half) ax = Math.round(p.x / chunk) * chunk;
        if (Math.abs(p.y - ay) > half) ay = Math.round(p.y / chunk) * chunk;
        if (Math.abs(p.z - az) > half) az = Math.round(p.z / chunk) * chunk;
      }
    }

    applyAnchorAbs(ax, ay, az);

    if (rebuildDistance > 0) {
      if (!Number.isFinite(lastRebuildX)) {
        lastRebuildX = ax; lastRebuildY = ay; lastRebuildZ = az;
      } else {
        const dx = Math.abs(ax - lastRebuildX);
        const dy = Math.abs(ay - lastRebuildY);
        const dz = Math.abs(az - lastRebuildZ);
        const d = Math.max(dx, dy, dz);
        if (d >= rebuildDistance) {
          // reconstrucción real (muy infrecuente)
          rebuildAt(ax, ay, az)
        }
      }
    }
  }

  function setEnabled(on) {
    on = !!on;
    if (on === enabled) return;
    enabled = on;

    if (enabled) {
      if (!meshes) build();
      for (const m of meshes) if (m) m.setEnabled(true);
      // fuerza anchor inicial
      lastRootX = lastRootY = lastRootZ = NaN;
      update();
    } else {
      if (disposeOnDisable) {
        disposeMeshes();
      } else if (meshes) {
        for (const m of meshes) if (m) m.setEnabled(false);
      }
    }
  }

  function dispose() {
    setEnabled(false);
    disposeMeshes();
  }

  return {
    get enabled() { return enabled; },
    get meshes() { return meshes || []; },
    setEnabled,
	update,
    dispose,
  };
}