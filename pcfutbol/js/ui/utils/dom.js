/**
 * Helpers DOM reutilizables.
 * Mantén aquí cosas que hoy están duplicadas en ui.js.
 */

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function show(el) {
  if (!el) return;
  el.hidden = false;
}

export function hide(el) {
  if (!el) return;
  el.hidden = true;
}

export function setText(el, text) {
  if (!el) return;
  el.textContent = text == null ? '' : String(text);
}

export function setHTML(el, html) {
  if (!el) return;
  el.innerHTML = html == null ? '' : String(html);
}

export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, String(v));
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

/**
 * Delegación de eventos: listener único por contenedor.
 * Ej: delegate(table, 'click', 'button[data-action]', (e, btn)=>{...})
 */
export function delegate(root, eventName, selector, handler) {
  if (!root) return () => {};
  const listener = (e) => {
    const target = e.target?.closest?.(selector);
    if (!target || !root.contains(target)) return;
    handler(e, target);
  };
  root.addEventListener(eventName, listener);
  return () => root.removeEventListener(eventName, listener);
}

/**
 * Escape básico para usar con innerHTML cuando no queda otra.
 */
export function escapeHtml(value) {
  const str = value == null ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}