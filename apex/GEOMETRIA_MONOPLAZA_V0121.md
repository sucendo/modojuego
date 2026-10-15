# APEX Formula 26 — v0.12.1 monoplaza maestro

Fecha: 15 octubre 2026. Proyecto: `sucendo/modojuego/apex`.

## Cambios en motor visual WebGL2

1. Morro de tres piezas contiguas: su punta acaba a ~0,14 unidades del centro del ala delantera, no muy por delante del ala.
2. Pontones del coche ensanchados manteniendo las tres variantes de parámetros originales A26, VXR y NOVA. Decoración ajustada en la superficie.
3. Suspensión y soportes oblicuos representados mediante prismas orientados (seis caras) en lugar de cajas alineadas con los ejes.
4. Aerodinámica LOD2: bocas laterales, hundimiento inferior de pontones, aletas de suelo, flaps y endplates delanteros, segundo grupo de triángulos de suspensión, halo refinado, aleta dorsal, soportes y beam wing, borde inferior del difusor.
5. API pública de diagnóstico en consola: `apexCarGeometryV0121SelfTest()` (11 escuderías + límites de dimensiones).

## Alcance y límites

- Cambios únicamente gráficos dentro de `apex/parts/part-026.txt` y versión/documentación. Se mantiene integración de v0.12.0 con catálogo compartido.
- LOD 0 intacto, LOD 1 conserva la geometría ligera excepto que se corrige proporción y tipo de barras; LOD 2 detalla coche cercano.
- No se generan sprites 2D nuevos, fotos ni texturas. Las imágenes del usuario continúan como referencia artística.
- No se cambian entradas de control, carreras, físicas, colisiones, guardados o circuitos.
- Falta validar gráficamente el aspecto en móvil/navegador real y comparar FPS con la parrilla de 22 coches.

## Checklist de pruebas

- Consola: `apexCarVisualPipelineSelfTest()` y `apexCarGeometryV0121SelfTest()` deben dar `ok: true`.
- Vista trasera, lateral y frontal de dos coches por chasis, sin soportes deformes, superficies flotantes ni sobreposición de neumáticos/pontones.
- Carreras en 23 circuitos, LOD bajo/medio/alto, espejos, ciclado de equipo, saved game e inspección.
- Telemetría FPS comparada con v0.12.0, especialmente modo móvil.
