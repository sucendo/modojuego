// sim/universeState.js
// Estado canónico del universo desacoplado del render.
// Babylon sigue pintando, pero aquí guardamos:
// - posición local orbital (scene units)
// - posición absoluta (km)
// - parentesco lógico
// - tiempo de simulación

const DEFAULT_DAYS_PER_REAL_SECOND = 1 / 86400;

function _num(v, fb = 0) {
  return Number.isFinite(Number(v)) ? Number(v) : fb;
}

function _vec3Like(v, fb = 0) {
  return {
    x: _num(v?.x, fb),
    y: _num(v?.y, fb),
    z: _num(v?.z, fb),
  };
}

export function sanitizeSimTimeState(state, defaults = {}) {
  const fallbackEpochUnixMs = _num(defaults?.epochUnixMs, 0);
  const fallbackEpochSimDays = _num(defaults?.epochSimDays, 0);
  const fallbackDaysPerRealSecond = _num(
    defaults?.daysPerRealSecond,
    DEFAULT_DAYS_PER_REAL_SECOND
  );
  const out = {
    v: 1,
    authority: String(state?.authority || defaults?.authority || 'local-absolute'),
    epochUnixMs: _num(state?.epochUnixMs, fallbackEpochUnixMs),
    epochSimDays: _num(state?.epochSimDays, fallbackEpochSimDays),
    daysPerRealSecond: _num(state?.daysPerRealSecond, fallbackDaysPerRealSecond),
    paused: !!(state?.paused ?? defaults?.paused ?? false),
    pausedSimDays: _num(state?.pausedSimDays, fallbackEpochSimDays),
    updatedAtUnixMs: _num(state?.updatedAtUnixMs, _num(state?.epochUnixMs, fallbackEpochUnixMs)),
  };

  if (!Number.isFinite(out.daysPerRealSecond) || out.daysPerRealSecond === 0) {
    out.daysPerRealSecond = fallbackDaysPerRealSecond || DEFAULT_DAYS_PER_REAL_SECOND;
  }

  if (out.paused) {
    out.pausedSimDays = _num(state?.pausedSimDays, out.epochSimDays);
  }

  return out;
}

export function resolveSimDaysAtUnixMs(timeState, nowUnixMs = Date.now()) {
  const s = sanitizeSimTimeState(timeState);
  if (s.paused) return _num(s.pausedSimDays, s.epochSimDays);
  const elapsedMs = _num(nowUnixMs, s.epochUnixMs) - s.epochUnixMs;
  return s.epochSimDays + ((elapsedMs / 1000) * s.daysPerRealSecond);
}

export function rebaseSimTimeState(timeState, simDays, atUnixMs = Date.now()) {
  const s = sanitizeSimTimeState(timeState);
  const out = sanitizeSimTimeState(s, s);
  out.epochUnixMs = _num(atUnixMs, out.epochUnixMs);
  out.epochSimDays = _num(simDays, resolveSimDaysAtUnixMs(out, out.epochUnixMs));
  out.updatedAtUnixMs = out.epochUnixMs;
  if (out.paused) out.pausedSimDays = out.epochSimDays;
  return out;
}

export function createCanonicalSimClock({
  persistedState = null,
  defaults = {},
  getNowMs = () => Date.now(),
} = {}) {
  const readNowMs = (typeof getNowMs === 'function') ? getNowMs : (() => Date.now());

  let state = sanitizeSimTimeState(persistedState, {
    authority: defaults?.authority || 'local-absolute',
    epochUnixMs: _num(defaults?.epochUnixMs, 0),
    epochSimDays: _num(defaults?.epochSimDays, 0),
    daysPerRealSecond: _num(defaults?.daysPerRealSecond, DEFAULT_DAYS_PER_REAL_SECOND),
    paused: !!defaults?.paused,
  });

  function getState() {
    return { ...state };
  }

  function getSimDays(atUnixMs = readNowMs()) {
    return resolveSimDaysAtUnixMs(state, atUnixMs);
  }

  function getSimDaysAtUnixMs(atUnixMs) {
    return resolveSimDaysAtUnixMs(state, atUnixMs);
  }

  function setState(nextState, { preserveCurrentSimDays = false } = {}) {
    const nowMs = readNowMs();
    const fallback = preserveCurrentSimDays
      ? rebaseSimTimeState(state, getSimDays(nowMs), nowMs)
      : state;
    state = sanitizeSimTimeState(nextState, fallback);
    return getState();
  }

  function rebase(simDays = getSimDays(), atUnixMs = readNowMs()) {
    state = rebaseSimTimeState(state, simDays, atUnixMs);
    return getState();
  }

  return {
    getNowMs: readNowMs,
    getState,
    setState,
    rebase,
    getSimDays,
    getSimDaysAtUnixMs,
  };
}

export function ensureSimMeta(node, defaults = {}) {
  if (!node) return null;
  const md = (node.metadata = Object.assign({}, node.metadata));
  const prev = md.sim || {};

  md.sim = Object.assign({
    bodyId: md.bodyId || node.name || '',
    kind: md.kind || 'body',
    systemName: md.systemName || '',
    parentBodyId: null,
    kmPerUnit: _num(md.kmPerUnit, 1e6),
    radiusKm: _num(md.radiusKm, 0),
    localU: _vec3Like(node.position, 0), // scene units
    absKm: { x: 0, y: 0, z: 0 },         // canonical absolute position
    simDays: 0,
    updatedAt: 0,
  }, prev, defaults || {});

  md.sim.localU = _vec3Like(md.sim.localU, 0);
  md.sim.absKm = _vec3Like(md.sim.absKm, 0);
  md.sim.kmPerUnit = _num(md.sim.kmPerUnit, 1e6);
  md.sim.radiusKm = _num(md.sim.radiusKm, 0);
  md.sim.simDays = _num(md.sim.simDays, 0);

  return md.sim;
}

export function setSimLocalU(node, posU, simDays = 0) {
  const sim = ensureSimMeta(node);
  if (!sim) return null;
  sim.localU = _vec3Like(posU, 0);
  sim.simDays = _num(simDays, sim.simDays || 0);
  sim.updatedAt = Date.now();
  return sim;
}

export function setSimAbsKm(node, posKm, simDays = 0) {
  const sim = ensureSimMeta(node);
  if (!sim) return null;
  sim.absKm = _vec3Like(posKm, 0);
  sim.simDays = _num(simDays, sim.simDays || 0);
  sim.updatedAt = Date.now();
  return sim;
}

export function snapshotBodyNode(node) {
  const sim = ensureSimMeta(node);
  if (!sim) return null;
  return {
    bodyId: sim.bodyId,
    kind: sim.kind,
    systemName: sim.systemName,
    parentBodyId: sim.parentBodyId || null,
    kmPerUnit: sim.kmPerUnit,
    radiusKm: sim.radiusKm,
    localU: { ...sim.localU },
    absKm: { ...sim.absKm },
    simDays: sim.simDays,
    updatedAt: sim.updatedAt || 0,
  };
}

export function collectUniverseSnapshots(scene) {
  const out = [];
  const nodes = Array.isArray(scene?.transformNodes)
    ? scene.transformNodes
    : (typeof scene?.getTransformNodes === 'function' ? scene.getTransformNodes() : []);

  for (const n of nodes) {
    if (!n?.metadata?.sim) continue;
    const snap = snapshotBodyNode(n);
    if (snap) out.push(snap);
  }
  return out;
}