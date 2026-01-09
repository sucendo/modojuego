// js/ui/modals/settingsModal.js
// Controles UI globales:
// - Botón de pantalla completa
// - Modal de configuración (por ahora: nombre del mánager)

import { GameState } from '../../state.js';

const $ = (id) => document.getElementById(id);

let _lastFocus = null;

function safeName(v) {
  return String(v ?? '').trim().slice(0, 24);
}

// No cachear nodos DOM: si esto corre antes de DOM listo, guardaríamos null y
// el modal nunca se engancha. Re-consultamos siempre (coste despreciable).
function getEls() {
  return {
    fullscreenBtn: $('btn-fullscreen'),

    openBtn: $('btn-settings'),
    modal: $('settings-modal'),
    backdrop: $('settings-modal-backdrop'),
    closeBtn: $('settings-modal-close'),
    cancelBtn: $('settings-modal-cancel'),
    saveBtn: $('settings-modal-save'),
    input: $('settings-manager-name'),

    hudManager: $('hud-manager'),
    startManager: $('start-manager-name'),
  };
}

function show(modal) {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-modal-open');
}

function hide(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-modal-open');
}

export function syncManagerNameUI({ name, persist = false } = {}) {
  const els = getEls();

  // Prioridad:
  // 1) name explícito
  // 2) GameState.user.name
  // 3) localStorage
  // 4) HUD / input existentes
  let v = safeName(name);

  if (!v) v = safeName(GameState?.user?.name);

  if (!v) {
    try {
      v = safeName(localStorage.getItem('pcf_manager_name'));
    } catch {
      // ignore
    }
  }

  if (!v) v = safeName(els.hudManager?.textContent);
  if (!v) v = safeName(els.startManager?.value);

  if (!v) return false;

  // HUD
  if (els.hudManager) els.hudManager.textContent = v;

  // Pantalla de inicio
  if (els.startManager) els.startManager.value = v;

  // Estado
  if (GameState?.user) GameState.user.name = v;

  // Persistencia (ligera)
  if (persist) {
    try {
      localStorage.setItem('pcf_manager_name', v);
    } catch {
      // ignore
    }
  }

  // Evento para otras partes
  try {
    window.dispatchEvent(
      new CustomEvent('pcf:managerNameChanged', { detail: { name: v } })
    );
  } catch {
    // ignore
  }

  return true;
}

export function openSettingsModal() {
  const els = getEls();
  if (!els.modal || !els.input) return;

  _lastFocus = document.activeElement;

  // Precargar input con el valor actual (sin persistir)
  const current = safeName(GameState?.user?.name) ||
    safeName(els.hudManager?.textContent) ||
    safeName(els.startManager?.value) ||
    '';

  els.input.value = current;

  show(els.modal);
  setTimeout(() => els.input?.focus?.(), 0);
}

export function closeSettingsModal() {
  const els = getEls();
  if (!els.modal) return;

  hide(els.modal);

  // Devolver el foco (mejora accesibilidad)
  try {
    if (_lastFocus && typeof _lastFocus.focus === 'function') _lastFocus.focus();
  } catch {
    // ignore
  }
  _lastFocus = null;
}

function saveFromModal() {
  const els = getEls();
  const v = safeName(els.input?.value);

  // Si está vacío, no machacamos el nombre actual.
  if (v) syncManagerNameUI({ name: v, persist: true });

  closeSettingsModal();
}

export function initFullscreenButton() {
  const els = getEls();
  const btn = els.fullscreenBtn;
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  const sync = () => btn.classList.toggle('is-active', !!document.fullscreenElement);
  sync();

  btn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // no romper
    } finally {
      sync();
    }
  });

  document.addEventListener('fullscreenchange', sync);
}

export function initSettingsModal() {
  const els = getEls();
  const { openBtn, modal, backdrop, closeBtn, cancelBtn, saveBtn, input } = els;

  // Si falta algún nodo (por timing o por cambios de HTML), reintento breve
  if (!openBtn || !modal || !input) {
    if (document.readyState !== 'complete') {
      setTimeout(() => {
        try { initSettingsModal(); } catch { /* ignore */ }
      }, 0);
    }
    return;
  }

  if (modal.dataset.bound === '1') return;
  modal.dataset.bound = '1';

  // Sincroniza el nombre si venimos de:
  // - un save cargado sin nombre
  // - o un localStorage previo
  syncManagerNameUI({ persist: false });

  openBtn.addEventListener('click', openSettingsModal);
  backdrop?.addEventListener?.('click', closeSettingsModal);
  closeBtn?.addEventListener('click', closeSettingsModal);
  cancelBtn?.addEventListener('click', closeSettingsModal);
  saveBtn?.addEventListener('click', saveFromModal);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveFromModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeSettingsModal();
    }
  });
}
