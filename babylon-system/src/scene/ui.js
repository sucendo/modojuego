// scene/ui.js
// Centraliza referencias DOM y estado UI básico (Paso 1 del refactor)
export function initUI() {
  const ui = {
    camOrbitBtn: document.getElementById("camOrbit"),
    camFlyBtn: document.getElementById("camFly"),
    camSurfaceBtn: document.getElementById("camSurface"),
    speedRange: document.getElementById("speedRange"),
    speedVal: document.getElementById("speedVal"),
    planetSelect: document.getElementById("planetSelect"),
    approachBtn: document.getElementById("approachBtn"),
    debugInfo: document.getElementById("debugInfo"),
    modePill: document.getElementById("modePill"),
    toggleLabels: document.getElementById("toggleLabels"),
    labelsPill: document.getElementById("labelsPill"),
  };

  // Estado mínimo que antes vivía como variables sueltas en main.js
  const uiState = {
    timeScale: 1.0,
  };

  // Inicializa el texto del multiplicador de tiempo si existe
  try { if (ui.speedVal) ui.speedVal.textContent = uiState.timeScale.toFixed(1) + "x"; } catch (e) {}

  return { ui, uiState };
}