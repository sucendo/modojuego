# Hexategos · C0/C4 · Auditoría de CI y monitor de rendimiento (15/10/2026)

**Estado:** experimental; no certificado como estable. **Base:** main `3bd1a2985086530a89e2923e7a7fb82464e3abfb`.
**Rama:** `feat/hexategos-c4-perf-diagnostics-20261015`.

## C0: evidencia reproducible

GitHub Actions, `Hexategos stability checks`, run [38704304858](https://github.com/sucendo/modojuego/actions/runs/38704304858):
- `node --check` de todos los JS: **correcto**.
- **71 smoke ejecutados; 60 pasan y 11 fallan**.
- Nuevo `smoke-performance-monitor-0396.mjs`: **PASS**.
- Las 11 fallas preexistentes no se han corregido ni silenciado en este bloque.

### Clasificación preliminar de los once fallos

| Test | Evidencia del fallo CI | Hipótesis, pendiente de validar contrato |
| --- | --- | --- |
| smoke-0373.mjs | `decay build must be 0.37.3` | Versión literal |
| smoke-0387.mjs | `version missing` | Versión literal |
| smoke-0389.mjs | título `v0.38.9 / v0.38.1xx` | Versión literal |
| smoke-03813.mjs | `version number` | Versión literal |
| smoke-03814.mjs | título `v0.38.1x` | Versión literal |
| smoke-03815.mjs | título `v0.38.1x` | Versión literal |
| smoke-03817.mjs | título `v0.38.17–19` | Versión literal |
| smoke-03818.mjs | título `v0.38.18` | Versión literal |
| smoke-03839.mjs | requiere `game.js?v=03839` | Query string de versión literal |
| smoke-03851.mjs | exige cadena literal `tradeApi()?.closeRoute?.(Number(b.dataset.id))` | Comprobar función efectiva de cierre de ruta; no suprimir test |
| smoke-03836.mjs | `undefined !== 'Agr'` (línea 70) | Comprobar contrato geográfico/test de módulo natural |

`smoke-03827.mjs` **pasa**: el aviso de guardado incompleto se genera durante una prueba negativa prevista, no cuenta entre los once fallos.

**Siguiente tarea C0:** verificar qué requisitos cumplen los módulos actuales antes de sustituir las aserciones literales por pruebas funcionales. Investigar los dos casos de contrato/fixture `03836` y `03851` por separado. La CI no estará verde hasta superar todo el conjunto.

## C4: monitor de rendimiento de lectura

La rama agrega `js/performance-monitor-0396.js`, un panel CSS, su carga al final de `index.html`, y un smoke. El panel se abre desde **Opciones > Rendimiento y simulación (C4)**.

- Iniciar captura, jugar o simular, detener y descargar un JSON local.
- Una muestra por segundo **cuando se ejecuta el tick económico**; en pausa o carga pueden existir huecos temporales. Máximo 3600 muestras en memoria.
- IA CPU: tiempo total de las llamadas al tick público de IA dentro del intervalo, con número de llamadas.
- Economía CPU: tiempo total del tick económico **incluyente** (puede contener logística y diplomacia). No sumar estos tiempos como si fueran hilos de CPU distintos.
- Renderizado medio/máximo: valores ya publicados por el motor; no son métricas independientes de GPU ni FPS.
- Memoria JS: `performance.memory.usedJSHeapSize` solo donde Chromium la proporcione; **no mide toda la RAM del proceso**, y de lo contrario muestra N/D.
- Más contexto: naciones, celdas, ciudades, carreteras, momento de campaña, snapshot IA, decisiones diferidas y deriva temporal.
- La captura no registra nombres de jugador, recursos ni contenido de partida. No escribe `localStorage` ni añade timers de simulación. Un `requestAnimationFrame` refresca el panel **solo mientras está abierto**.

**Importante:** todavía no se han medido campañas reales ni probado visualmente el panel en navegadores. El CI smoke verifica contrato de wrappers, excepciones, muestra y ausencia de persistencia, no rendimiento real.

## Matriz C4 de aceptación pendiente (documento maestro, anexo D.6)

- 10 minutos de sesión por escala: **150, 250, 350, 500** naciones.
- 30 minutos adicionales con **500**, guardado intermedio, continuación y nueva exportación.
- Comparar CPU de IA y economía, renderizado, memoria, naciones vivas, ciudades, carreteras e incidencias.
- No aceptar regresión en guardados existentes; comparar invariantes antes/después, no solo el mensaje de «Guardado».
- Para prueba A/B, usar misma semilla, mismo equipo y mismo estado y medir versión sin observador y rama con observador. Registrar frecuencia de muestras y tiempo de campaña transcurrido.

## Límites y política de integración

No se ha migrado la malla geodésica ni añadido H3, Three.js, Node.js, Worker ni nuevos ticks. No se ha corregido la importación histórica de 14/10. No publicar como estable ni integrar en main hasta revisar regresiones, matrix de guardado y prueba visual. El observador se puede retirar eliminando sus dos referencias en HTML sin migrar partidas.
