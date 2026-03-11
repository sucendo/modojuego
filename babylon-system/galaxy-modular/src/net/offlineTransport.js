// net/offlineTransport.js
// Transporte local/offline para GitHub Pages.
// Misma idea de API que un futuro WebSocket transport, pero sin servidor.

export function createOfflineTransport() {
  const listeners = new Map();
  const peers = new Map();
  let selfState = null;

  function emit(type, payload) {
    const set = listeners.get(type);
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch (_) {}
    }
  }

  function on(type, fn) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => listeners.get(type)?.delete(fn);
  }

  function connect() {
    emit('open', { mode: 'offline' });
  }

  function publishSelf(state) {
    selfState = Object.assign({}, state || {}, { ts: Date.now() });
    emit('self', selfState);
    return selfState;
  }

  function getSelf() {
    return selfState ? { ...selfState } : null;
  }

  function getPeers() {
    return Array.from(peers.values()).map(p => ({ ...p }));
  }

  // Útil para demos futuras sin backend real.
  function injectPeer(id, state) {
    if (!id) return null;
    const p = Object.assign({ id }, state || {}, { ts: Date.now() });
    peers.set(id, p);
    emit('peer', { ...p });
    return p;
  }

  function removePeer(id) {
    if (!id) return;
    peers.delete(id);
    emit('peer-left', { id });
  }

  return {
    mode: 'offline',
    connect,
    on,
    publishSelf,
    getSelf,
    getPeers,
    injectPeer,
    removePeer,
  };
}