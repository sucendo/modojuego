/**
 * UI entrypoint (fachada).
 *
 * Objetivo:
 * - No romper nada hoy: seguimos usando ui.js (legacy).
 * - Permitir migración incremental: mover pantalla a pantalla a /ui/*.js
 *
 * Más adelante: aquí coordinaremos initNavigation/initTactics/initSquad...
 */

import { initUI as legacyInitUI } from '../ui.js';

export function initUI() {
  // De momento delegamos al monolito.
  legacyInitUI();
}

// Export opcional (por si en el futuro quieres importar helpers desde fuera)
export * from './utils/dom.js';
export * from './utils/format.js';
export * from './utils/players.js';
export * from './utils/events.js';