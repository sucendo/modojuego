// js/ui/saveLoadUI.js

import { applyLoadedState } from '../state.js';
import { importGameFromFile } from '../saveLoad.js';

/**
 * Importa una partida desde un <input type="file"> (evento change).
 * Aplica el estado y luego llama a onAfterLoad() para que ui.js refresque vistas.
 *
 * Firma compatible con la antigua: (event, startScreen, dashboardScreen, ctx, onAfterLoad)
 */
export function handleFileInput(event, startScreen, dashboardScreen, ctx, onAfterLoad) {
  const input = event?.target;
  const file = input?.files?.[0];
  if (!file) return;

  importGameFromFile(
    file,
    (rawState) => {
      try {
        applyLoadedState(rawState);
        if (typeof onAfterLoad === 'function') {
          onAfterLoad({ startScreen, dashboardScreen, ctx, rawState });
        }
      } catch (err) {
        console.error(err);
        alert('El archivo no parece ser una partida válida.');
      } finally {
        if (input) input.value = '';
      }
    },
    (error) => {
      console.error(error);
      alert('Error al cargar la partida: ' + (error?.message || error));
      if (input) input.value = '';
    }
  );
}