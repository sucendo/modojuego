// js/saveLoad.js

import { GameState } from './state.js';

/**
 * Exporta la partida actual a un archivo JSON descargable.
 */
export function exportGameToFile() {
  // Actualiza la fecha de guardado
  GameState.meta.lastSavedAt = new Date().toISOString();

  const json = JSON.stringify(GameState, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `pcfutbol_save_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON, lo parsea y llama a los callbacks.
 * onSuccess(estadoParsed), onError(error)
 */
export function importGameFromFile(file, onSuccess, onError) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const text = reader.result;
      const parsed = JSON.parse(text);
      onSuccess(parsed);
    } catch (err) {
      onError(err);
    }
  };

  reader.onerror = () => {
    onError(reader.error || new Error('Error leyendo archivo'));
  };

  reader.readAsText(file);
}
