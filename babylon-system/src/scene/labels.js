// scene/labels.js
// Paso 3: extraer labels (GUI) + visibilidad throttled + toggle UI

export function createLabelsSystem({ scn, ui, bodies }) {
  // GUI labels (optional)
  const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui", true, scn);

  function createLabel(id, text, mesh) {
    const rect = new BABYLON.GUI.Rectangle("lbl_" + String(id));
    rect.background = "rgba(0,0,0,0.35)";
    rect.thickness = 1;
    rect.color = "rgba(255,255,255,0.25)";
    rect.cornerRadius = 8;
    rect.height = "22px";
    rect.width = "120px";
    rect.isHitTestVisible = false;

    const tb = new BABYLON.GUI.TextBlock();
    tb.text = text;
    tb.color = "#fff";
    tb.fontSize = 12;
    rect.addControl(tb);

    gui.addControl(rect);
    rect.linkWithMesh(mesh);
    rect.linkOffsetY = -20;

    // Devuelve también el TextBlock para poder actualizarlo si cambia el displayName
    rect._tb = tb;
    return rect;
  }

  // ============================================================
  // Labels: registro + visibilidad (throttle)
  // - Estrellas siempre visibles
  // - Planetas y lunas: solo los cercanos (por ranking + distancia)
  // - Permite apagar/encender desde UI
  // ============================================================
  const labelsById = new Map(); // id -> { rect, tb, kind, mesh, name }
  let showLabels = true;

  function registerLabel(id, name, kind, mesh) {
    if (!mesh) return null;
    const key = String(id || "");
    if (!key) return null;

    let meta = labelsById.get(key);
    if (!meta) {
      const rect = createLabel(key, name, mesh);
      meta = { rect, tb: rect._tb || null, name, kind, mesh };
      labelsById.set(key, meta);
    } else {
      meta.kind = kind || meta.kind;
      meta.mesh = mesh || meta.mesh;
      meta.name = name || meta.name;
      // Re-link y actualiza el texto (por si cambió el displayName)
      try { meta.rect && meta.rect.linkWithMesh && meta.rect.linkWithMesh(mesh); } catch (e) {}
      try { (meta.tb || meta.rect._tb) && ((meta.tb || meta.rect._tb).text = meta.name); } catch (e) {}
    }
    return meta.rect;
  }

  const LABEL_NEAREST_BODIES = 10;   // cuántos planetas/lunas mostrar como "cercanos"
  const LABEL_MAX_DIST = 1200;       // además, muestra cuerpos dentro de esta distancia
  const LABEL_UPDATE_MS = 220;       // throttle del cálculo

  function setAllLabelsVisible(v) {
    for (const { rect } of labelsById.values()) rect.isVisible = !!v;
  }

  function updateLabelVisibility(force = false) {
    if (!showLabels) { setAllLabelsVisible(false); return; }
    const cam = scn.activeCamera;
    if (!cam) return;

    const now = performance.now();
    if (!force && scn._lblTick && (now - scn._lblTick) < LABEL_UPDATE_MS) return;
    scn._lblTick = now;

    const camPos = cam.position;
    const maxD2 = LABEL_MAX_DIST * LABEL_MAX_DIST;

    // 1) estrellas siempre visibles
    for (const meta of labelsById.values()) {
      if (meta.kind === "sun") meta.rect.isVisible = true;
    }

    // 2) ranking de cercanos (planetas + lunas)
    const ranked = [];
    for (const [id, b] of bodies.entries()) {
      if (!b || !b.def || !b.farMesh) continue;
      const k = b.def.kind;
      if (k !== "planet" && k !== "moon") continue;
      const p = b.farMesh.getAbsolutePosition();
      const d2 = BABYLON.Vector3.DistanceSquared(camPos, p);
      ranked.push({ id, d2 });
    }
    ranked.sort((a,b)=>a.d2-b.d2);

    const visible = new Set();

    // Siempre visible: el seleccionado (si existe)
    try {
      const selId = ui && ui.planetSelect ? ui.planetSelect.value : null;
      if (selId) visible.add(selId);
    } catch(e) {}

    for (let i=0; i<ranked.length && i<LABEL_NEAREST_BODIES; i++) visible.add(ranked[i].id);
    for (const r of ranked) {
      if (r.d2 <= maxD2) visible.add(r.id);
      else break;
    }

    // 3) aplica visibilidad (todo lo que no sea estrella => depende del set)
    for (const [id, meta] of labelsById.entries()) {
      if (meta.kind === "sun") continue;
      meta.rect.isVisible = visible.has(id);
    }
  }

  function setShowLabels(v) {
    showLabels = !!v;
    if (ui && ui.labelsPill) ui.labelsPill.textContent = showLabels ? "ON" : "OFF";
    updateLabelVisibility(true);
  }

  // UI hook
  if (ui && ui.toggleLabels) {
    setShowLabels(!!ui.toggleLabels.checked);
    ui.toggleLabels.addEventListener("change", () => setShowLabels(!!ui.toggleLabels.checked));
  }

  return {
    gui,
    labelsById, // <-- lo dejamos expuesto para compatibilidad con el código actual (LOD relink)
    registerLabel,
    updateLabelVisibility,
    setShowLabels,
  };
}