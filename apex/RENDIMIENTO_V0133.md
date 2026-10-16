# APEX Formula 26 — v0.13.3 Rendimiento en circuitos muy cargados

## Objetivo
Optimización del coste por fotograma en circuitos con numerosos muros SVG, edificios, bosques, accesos, túneles y terreno detallado (Madrid y demás circuitos importados). Se mantiene la fidelidad geométrica; nada se elimina del circuito.

## Cambios
- **Muros:** índice espacial construido una vez en `apexBuildCircuitStaticRenderBatches`. Consulta por cámara con rango conservador y caché de celda, recorriendo solo los segmentos candidatos (fallback completo en inspector lejano).
- **Terreno:** clasificación `PORTAL`, `TUNNEL`, `TRACK`, `PAVED` y vacío se memoriza una vez por celda de malla. No cambia el recorte de bocas de túnel.
- **Portales:** influencia sobre celdas móviles memorizada por coordenada de malla.
- **Bosques:** árboles compilados con cota esférica conservadora, que se descartan solo si quedan fuera de cámara.
- **Métricas:** hits/misses de clasificación y muros; diagnósticos junto al perfilador de render existente.

## Funciones de diagnóstico (con Madrid cargado)
```js
apexHeavyCircuitPerfDiagnostics()
apexExactWallSpatialDiagnostics()
apexStaticBatchStatsSnapshot()
renderProfilerSnapshot()
```

## Criterios de aceptación
1. El SVG guardado con todos sus elementos sigue presentando edificios, túneles (incluida montaña superior y laterales), vallas, árboles, escapatorias y marcas correctamente.
2. Controles, pilotos, boxes, cronometraje y tres cámaras se mantienen intactos.
3. No se pierden muros al acercarse, al cambiar CAM/TV/EXT o al orbitar en el inspector.
4. FPS y tiempo CPU mejoran con respecto a v0.13.2 especialmente en un Madrid SVG completo; registrar mediciones en el mismo dispositivo/resolución.

## Límites
No ha sido posible reproducir aquí el guardado local específico del navegador del usuario. La mejora está aplicada en el motor genérico y validada por pruebas estáticas/de equivalencia aisladas; la comparación real de FPS y la revisión visual quedan pendientes.
