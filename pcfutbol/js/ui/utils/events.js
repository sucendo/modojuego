/**
 * Mini EventBus para desacoplar módulos UI.
 * Útil para: "state:changed", "view:changed", etc.
 */

const listeners = new Map(); // eventName -> Set(fn)

export function on(eventName, fn) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(fn);
  return () => off(eventName, fn);
}

export function off(eventName, fn) {
  const set = listeners.get(eventName);
  if (!set) return;
  set.delete(fn);
  if (set.size === 0) listeners.delete(eventName);
}

export function emit(eventName, payload) {
  const set = listeners.get(eventName);
  if (!set) return;
  // copiar para evitar issues si alguien se desuscribe durante el emit
  [...set].forEach((fn) => {
    try { fn(payload); } catch (e) { console.error(e); }
  });
}