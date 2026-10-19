# APEX v0.13.21 — primera etapa de auditoría y optimización

Base inspeccionada: `main`, `6f0cfb173db9a2112c51bdc595a75daa2ed32667` (consultado de nuevo antes de publicar). Versión `v0.13.21 · PRE-RELEASE`, build `2026.10.20.01`.

## Alcance y evidencia

Se han auditado las rutas de producción y ejecutado regresiones aisladas sobre sus funciones reales, comparadas con la base indicada. No se ha podido perfilar el Madrid completo en un navegador: Chrome se descargó, pero su arranque falló con `socket() failed: Operation not permitted`. Playwright tampoco disponía inicialmente de un navegador utilizable. No hay mediciones de FPS reales, tiempos GPU ni pruebas en Android físico. No se da por resuelto el objetivo de 30/60 FPS.

Esta entrega completa una primera etapa funcional. La selección de prioridades se apoya en trabajo repetido comprobado y contadores reproducibles; **no demuestra qué subsistema domina el tiempo del Madrid real**. No se han alterado SVG/JSON, datos guardados ni el HTML histórico. El simulador sigue ensamblando sus 28 fragmentos.

## Flujo y hallazgos

`requestAnimationFrame → loop → update a 100 Hz → webgl2RenderFrame → colección de pista → decorado → terreno de placas → terreno procedural/estructuras → SVG → cinta de pista/pianos → marcas/muros/túneles → rivales/jugador → webglSubmit → overlay Canvas/cockpit`.

| Ruta auditada | Trabajo actual / problema comprobado | Resultado de esta etapa |
|---|---|---|
| `webglCollectCircuitSegments`, `collectRoadBranch`, `roadStep` | Cada nodo recalculaba entorno, peralte, vértices y muros; además hacía nueve proyecciones Canvas que WebGL no consume. | `apexWebglRoadStep`: siete vértices de cámara, sin muros ni proyección de pantalla; geometría de mundo de nodos fijos cacheada. Extremos móviles sin cachear. |
| `apexCollectTerrainPlateCells` | Barrido local, objetos nuevos por selección, proyección de centros y ordenación por distancia/profundidad; móvil 2×2 se subdivide en zona cercana/portales/máscaras mixtas. | Sin cambiar su selección ni LOD; tiempo separado en `terrainSelectMs`. Sigue siendo un coste pendiente de perfilar. |
| `apexForEachTerrainPlateCell`, `apexTerrainFinePatch` | La malla fina ya estaba recortada y cacheada, pero todos sus vértices volvían a proyectarse y enviarse cada frame. Un portal puede contener 400 polígonos por celda. | Misma malla fina residente en el atlas GPU; cerca del ojo e inspección conservan clipping CPU. No se reconstruye ni aproxima el túnel. |
| `apexUnifiedTerrainCellPieces` | Recorte memoizado contra el propietario SVG; puede tener misses/evicciones. | Se preserva. Las claves de GPU distinguen tipo fino de celdas gruesas del mismo lugar, sin reutilizar geometría incompatible. |
| `apexPhase5PrepareGpuTerrain` | Consultaba la caché CPU antes de comprobar residencia GPU. Al crecer `bufferData`, invalidaba y retransmitía todos los paquetes residentes. El límite de entradas CPU no limitaba bytes. | Residencia primero; reserva única de atlas de 8/24 MiB; caché CPU de 4/12 MiB. Ordenación de celdas nuevas con índices numéricos, sin `split/map` dentro del comparador. |
| `apexPhase5DrawGpuTerrain` | Rangos contiguos de celdas seleccionadas; fragmentación puede aumentar draw calls. | Mantiene rangos exactos. No se absorben huecos, pues podrían contener versiones gruesas de una celda ahora fina. La reducción adicional de llamadas queda pendiente. |
| `apexPhase5PrepareGpuGround` / `DrawGpuGround` | SVG opaco estático residente; construcción inicial síncrona. Agrupa rangos con hasta 25 % de sobreenvío, con mínimo de 576 vértices. | Se conserva; se cuentan bytes de carga y triángulos realmente enviados, no sólo los de grupos considerados visibles. Su construcción inicial aún debe medirse. |
| `apexUnifiedGroundDrawCorridor` / `webglPushRoadSegment` | Asfalto, pianos, recortes y efectos todavía generan/proyectan geometría CPU. Materiales dependen también del clima y distancia. | Se reduce su preparación de nodos; **la cinta completa todavía no está en un VBO estático**. No se han quitado pianos, marcas ni peraltes. |
| Decorado y muros | Hay índices espaciales y cachés previas; numerosos objetos aún se proyectan/emiten por CPU. | Sin migración en esta etapa; se mantienen tiempos existentes de landmarks/vallas, a contrastar con la nueva separación de suelo y pista. |
| `webglSubmit` | Una subida dinámica por frame y pasadas intercaladas de terreno/SVG. El total usaba SVG visible en vez de enviado. | Orden conservado y probado; contadores de vértices dinámicos, bytes, reservas y triángulos enviados corregidos. |
| Contexto/cambio de circuito | Al pasar a un GP sin atlas/placa se retornaba antes de liberar la escena anterior. Recursos estáticos podían sobrevivir a pérdida de contexto con la misma identidad `gl`. | Liberación por identidad de `trackData`, al menú y ante pérdida de contexto; eliminación de marcas de fallo al restaurar. |
| Física/scheduler | Acumulador de 100 Hz, hasta 12 pasos de recuperación y clamp a 250 ms de tiempo de frame. En pausas grandes descarta tiempo. | Mismas reglas; nuevo `physicsClampedMs` informa del tiempo descartado. No se modifica integración, IA, cámara ni cronometraje. |
| HUD/minimapa/retrovisores/composición | Conviven Canvas y WebGL; existen tiempos y actualización adaptativa de espejos. | No se atribuye a GPU todo el coste de render ni se confunde tiempo de envío CPU con ejecución GPU. Pendiente medición real. |

Las cotas de visibilidad son conservadoras: ni `visibleTriangles` ni `culledChunks` equivalen a una medición exacta del porcentaje de triángulos fuera del frustum. No se hace readback ni consulta GPU síncrona en el bucle.

## Preparación, memoria y compatibilidad

Las celdas finas nuevas se admiten progresivamente: 2 por frame móvil, 4 escritorio. Las pendientes siguen dibujándose por CPU; ninguna se oculta mientras espera. Es un límite de cantidad, **no** una garantía de milisegundos. La selección normal y el detalle 1×1/2×2 siguen siendo los anteriores. No se añade otro suelo.

La reserva completa de 8/24 MiB evita crecimientos intermedios a cambio de reservar más VRAM desde el primer uso. Además se mantienen referencias CPU de los paquetes residentes, acotadas por el atlas, y una caché de paquetes de hasta 4/12 MiB; pueden compartir los mismos arrays. Al llenar el atlas sigue habiendo reciclado y subida de la selección actual: posible pico pendiente de medir. La geometría fuente de `fineCache` ya existía y no se contabiliza como memoria nueva GPU.

La caché de pista tiene 2048 nodos en móvil y 4096 en escritorio; excluye extremos que siguen al jugador y se invalida al preparar/recompilar el circuito o cambiar la lista de muestras. No contiene estado físico, datos persistidos ni material de clima.

## Comparación reproducible, sintética

Comando desde la raíz:

```sh
node apex/tests/render-audit.cjs
```

Requiere que el commit base exista localmente; también admite `--baseline-ref=<ref>`. No necesita dependencias npm.

| Caso controlado | Base v0.13.20 | v0.13.21 |
|---|---:|---:|
| 1000 nodos fijos × 10 frames: proyecciones Canvas | 90.000 | 0 |
| Mismo caso: cálculos de muro | 20.000 | 0 |
| Mismo caso: consultas de entorno directas en el stub | 10.000 | 1000 |
| Mismo caso: transformaciones mundo→cámara | 90.000 | 70.000 |
| 20 celdas de portal, 400 quads/celda, 12 frames: transformaciones CPU | 384.000 | 64.000 |
| Mismo terreno: polígonos emitidos por CPU | 96.000 | 16.000 |
| Mismo terreno: nuevas transferencias estáticas durante la incorporación | No usa la ruta GPU fina | 20, total 1.344.000 bytes, una reserva |
| Terreno después de residencia: transformaciones/subidas nuevas por frame estable | 32.000 transformaciones | 0 / 0 |

Los conteos proceden de funciones de producción con dependencias controladas y GL simulado; no se extrapolan a FPS ni a porcentajes de tiempo del Madrid real. Se verificó la igualdad de todos los floats subidos con la triangulación original. Se ejecutaron 900 comparaciones de ecuaciones de proyección/depth/pitch/roll (error máximo `4,44e-16`); esto no sustituye compilación GLSL ni verificación visual.

Regresiones adicionales aprobadas: máscaras 1×1/2×2 y alturas, extremos móviles, claves fino/grueso separadas, reutilización GPU tras evicción CPU, fallback CPU en el mismo frame ante fallo de reserva, clipping cercano, incorporación móvil, límites CPU/GPU, reciclado de atlas, liberación a otro circuito/menú, pérdida y restauración con la misma identidad GL, orden de pasadas, una sola subida dinámica y percentiles con ventana acotada de 600 frames. Se analizó la sintaxis de los cuatro scripts ensamblados y del runner de navegador. `git diff --check` limpio.

## Validación real pendiente

| Prueba requerida | Estado de esta entrega |
|---|---|
| Arranque completo del simulador | Sintaxis aprobada; navegador bloqueado. |
| Madrid SVG completo y recta de meta con todos sus elementos | Pendiente de navegador. El runner importa el SVG de `apex/circuits`; no dispone del almacenamiento privado del móvil del usuario. |
| Conducción en rectas/curvas | Runner preparado con autopiloto y física original; no ejecutado aquí. |
| Escapatorias/pianos | Equivalencia de nodos y recortes conservados; revisión visual pendiente. |
| Túneles/desniveles | Equivalencia de polígonos/proyección aprobada; revisión visual pendiente. |
| Tres cámaras | Ecuaciones contrastadas; ejecución visual pendiente. |
| Rivales | Código conservado; carrera real pendiente. |
| Móvil/escritorio | Ramas móviles de admisión y memoria probadas sintéticamente. Android físico y FPS pendientes. |
| Otros 22 circuitos | Datos conservados; runner incluye diagnósticos existentes de 23 bases, pendientes de ejecución. |
| Cambio de circuito/limpieza | Propiedad y liberación aprobadas con GL simulado; navegador pendiente. |
| Guardado/restauración | Esquemas/código de guardado conservados, sin prueba end-to-end; pendiente. |
| Errores JS/WebGL/contexto/memoria | Sintaxis, fallback y lifecycle aprobados aisladamente; no se certifican errores GL ni VRAM de un driver real. |

Para un entorno con Chrome/Playwright, servir la raíz y ejecutar:

```sh
python -m http.server 8765
# En otra terminal:
CHROME_EXECUTABLE=/ruta/a/chrome node apex/tests/browser-audit.cjs
```

El runner usa el scheduler real y emite JSON con el renderer/driver, tres cámaras, Madrid importado, otro circuito base y autopruebas de carga/cronometraje de los 23 circuitos. Incluye emulación móvil, que debe etiquetarse así y no como Android físico. Es un smoke test, no una vuelta completa ni una certificación visual o de guardado. No se ha podido ejecutar aquí; su sintaxis sí se ha verificado.

En un dispositivo real, abrir `?perf=1` y recoger `apexPerformanceSummary()`, `renderProfilerSnapshot()`, `apexPhase5TerrainDiagnostics()`, `apexPhase5GpuDiagnostics()` y `apexRoadPreparationDiagnostics()` en los mismos puntos/cámara/resolución, tras calentamiento, con al menos 30 s por tramo. Repetir sobre la base y la nueva rama usando el mismo SVG/JSON guardado. Los nuevos p50/p95/p99 cubren los últimos 600 frames; medias/peores tiempos y tráfico acumulado cubren la sesión. `webglSubmitMs` mide envío CPU, no tiempo GPU.

## Siguiente etapa

1. Medir Madrid real y resolver los mayores p95/p99 observados; completar la matriz visual y guardado.
2. Si domina la pista, migrar asfalto/pianos por sectores estáticos con el mismo muestreo, alturas, colores por clima, clipping y material; conservar extremos de rama y efectos dinámicos. Esta entrega no afirma haber completado esa migración.
3. Si dominan decorados, migrar sus lotes opacos estáticos antes de tocar resolución/calidad. Revisar fragmentación de rangos de terreno sin volver a dibujar celdas antiguas en huecos de túneles.
4. Revisar precompilación incremental del SVG GPU, estabilidad del LOD, composición/DPR y reciclado del atlas con datos de un dispositivo real. No se han reducido elementos esenciales ni frecuencia física.
