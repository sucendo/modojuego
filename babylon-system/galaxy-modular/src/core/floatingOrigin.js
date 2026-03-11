export function createFloatingOrigin({ scene, camera, worldRoot, thresh, rebaseGrid }){
  const originOffset = new BABYLON.Vector3(0,0,0);
  const _shiftTmp = new BABYLON.Vector3(0,0,0);
  const _absTmp = new BABYLON.Vector3(0,0,0);

  // PERF: HUD doesn't need 60fps, and toLocaleString is expensive.
  const HUD_MS = 120;
  let _hudLastT = 0;
  let _lastTh = '';
  let _lastOff = '';
  let _lastCam = '';
  let _lastAbs = '';

  // More stable defaults for large scenes:
  // - Higher threshold -> fewer rebases -> less perceived jitter
  // - Larger grid -> fewer tiny rebases
  let THRESH = (Number.isFinite(thresh) && thresh > 0) ? thresh : 100;
  let REBASE_GRID = (Number.isFinite(rebaseGrid) && rebaseGrid > 0) ? rebaseGrid : 20;

  // Optional URL params: ?thresh=20000&grid=1000 (values in scene units)
  try{
    const u = new URL(location.href);
    const t = Number(u.searchParams.get("thresh"));
    const g = Number(u.searchParams.get("grid"));
    if (Number.isFinite(t) && t > 0) THRESH = t;
    if (Number.isFinite(g) && g > 0) REBASE_GRID = g;
  }catch(_){}

  // HUD elements are optional; they might be created later by the UI module.
  let thEl  = document.getElementById("th");
  let offEl = document.getElementById("off");
  let camEl = document.getElementById("cam");
  let absEl = document.getElementById("abs");

  function ensureHudEls(){
    if (!thEl)  thEl  = document.getElementById("th");
    if (!offEl) offEl = document.getElementById("off");
    if (!camEl) camEl = document.getElementById("cam");
    if (!absEl) absEl = document.getElementById("abs");
  }

  function updateHud(){
	ensureHudEls();

    const now = performance.now();
    if ((now - _hudLastT) < HUD_MS) return;
    _hudLastT = now;

    const th = `${THRESH.toLocaleString("es-ES")} (grid ${REBASE_GRID.toLocaleString("es-ES")})`;
    const off = `${originOffset.x.toFixed(0)}, ${originOffset.y.toFixed(0)}, ${originOffset.z.toFixed(0)}`;
    const cam = `${camera.position.x.toFixed(0)}, ${camera.position.y.toFixed(0)}, ${camera.position.z.toFixed(0)}`;
    const a = getCameraAbsoluteToRef(_absTmp);
    const abs = `${a.x.toFixed(0)}, ${a.y.toFixed(0)}, ${a.z.toFixed(0)}`;

    if (thEl && th !== _lastTh) { thEl.textContent = th; _lastTh = th; }
    if (offEl && off !== _lastOff) { offEl.textContent = off; _lastOff = off; }
    if (camEl && cam !== _lastCam) { camEl.textContent = cam; _lastCam = cam; }
    if (absEl && abs !== _lastAbs) { absEl.textContent = abs; _lastAbs = abs; }
  }

  function apply(){
    // Decide using ABS camera position (camera + originOffset)
    const a = getCameraAbsoluteToRef(_absTmp);
    const len = a.length();
    if (len < THRESH) return;

    // Snap shift to grid (like many "infinite world" demos)
    // BUT avoid micro-oscillations when the camera is near a rounding boundary.
    // We only rebase an axis when it exceeds a "dead zone" inside the grid cell.
    const GRID = REBASE_GRID;
    const DEAD = GRID * 0.75; // axis must exceed this to trigger a shift

    // Shift is based on camera LOCAL, but decision uses ABS.
    const p = camera.position;
    let sx = 0, sy = 0, sz = 0;

    if (Math.abs(p.x) >= DEAD) sx = Math.trunc(p.x / GRID) * GRID;
    if (Math.abs(p.y) >= DEAD) sy = Math.trunc(p.y / GRID) * GRID;
    if (Math.abs(p.z) >= DEAD) sz = Math.trunc(p.z / GRID) * GRID;

    _shiftTmp.set(sx, sy, sz);
    if (_shiftTmp.lengthSquared() < 1e-9) return;

    originOffset.addInPlace(_shiftTmp);
    // Move all children instead of shifting the parent root.
    // This keeps CHILD LOCAL positions small, reducing float jitter when far from origin.
    const kids = worldRoot.getChildren ? worldRoot.getChildren() : null;
    if (kids && kids.length) {
      for (let i = 0; i < kids.length; i++) {
        const n = kids[i];
        if (n && n.position && typeof n.position.subtractInPlace === 'function') n.position.subtractInPlace(_shiftTmp);
      }
    }
    camera.position.subtractInPlace(_shiftTmp);
  }

  function getCameraAbsoluteToRef(ref){
    ref = ref || new BABYLON.Vector3();
    ref.copyFrom(camera.position);
    ref.addInPlace(originOffset);
    return ref;
  }

  // Back-compat: keep the old name, but avoid allocations.
  function getCameraAbsolute(){
    return getCameraAbsoluteToRef(new BABYLON.Vector3());
  }

  return {
    originOffset,
    apply,
    updateHud,
    getCameraAbsolute,
    getCameraAbsoluteToRef,
    get thresh(){ return THRESH; },
    get rebaseGrid(){ return REBASE_GRID; },
  };
}