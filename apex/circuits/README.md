# Circuitos APEX Formula 26

Esta carpeta conserva las versiones editadas de los circuitos. El archivo `manifest.json` es la referencia usada por el botón **CARGAR GUARDADO** del editor SVG; las versiones BASE internas no se sustituyen.

## Estructura

- `svg/`: geometría y elementos visuales/físicos en formato SVG.
- `json/`: metadatos estructurados (altimetría, peralte, neumáticos, boxes, anchura, etc.).
- `manifest.json`: selección de la edición guardada por identificador del circuito.

## SVG guardados vigentes · 11/11/2026

| Circuito | Identificador | SVG cargable |
| --- | --- | --- |
| Australia · Melbourne (Albert Park) | `01-australia` | `svg/apex26_01-australia_circuito-propuesta-20261111-v2.svg` |
| España · Madrid (MADRING) | `14-spain` | `svg/apex26_14-spain_circuito-propuesta-20261110.svg` |

La edición vigente de Melbourne es la **segunda actualización del 11/11/2026**, con **29 gradas activas** y **dos viales urbanos activos** adicionales. La copia cargable conserva la geometría vectorial aportada, omitiendo solo la imagen aérea incrustada de referencia (que no es geometría del simulador). La edición de Madrid sigue siendo la del 10/11/2026 y las versiones anteriores de ambos se conservan.

- **Madrid**: primero se carga `json/apex26_14-madrid-spain_2026-10-29.json` y después el SVG seleccionado, conservando colores de pianos y perfil de peralte. Contiene 68 carteles de distancia activos y cuatro plantillas dentro de la biblioteca.
- **Australia**: carga la edición **11/11/2026 v2** con los datos BASE JSON internos. Mantiene los dos trazados de barrera de hormigón autoritativos, las 8 pasarelas activas y las nuevas gradas y vías. La versión del 11/11 v1, la edición alineada del 10/11 y el original siguen archivados.
- Ambos usan `exactSvg: true` en el manifiesto, para respetar los elementos SVG dibujados y transformados sin regenerarlos.

### Escala métrica común a todos los circuitos

El tamaño del `viewBox` (habitualmente `0 0 512 512`) **no** es una unidad métrica. Melbourne y Madrid tienen escalas SVG de dibujo diferentes: la línea central de Melbourne recorre aproximadamente **1.403 unidades SVG** por su transformación local `scale(0.26575085)`, mientras que Madrid recorre **5.414 unidades SVG**. Sus longitudes físicas son **5.278 m** y **5.414 m**, respectivamente.

**El importador aplica la misma calibración universal para todos los circuitos**: `metrosPorUnidadSvg = longitudCircuitoMetros / perimetroSvgTransformado`; luego transforma conjuntamente pista, pianos, pit lane, barreras, vegetación y el resto de elementos. De este modo **un metro de mundo APEX equivale a un metro físico** en cualquier mapa, igual que Madrid. Reescalar por separado los elementos SVG o forzar el mismo `viewBox`/factor numérico rompería las posiciones relativas. El cálculo es inspeccionable con `apexSvgMetricScaleInfo()` tras cargar el SVG. La prueba `node apex/tests/svg-metric-scale.cjs` vigila las dos ediciones guardadas vigentes.
- Las versiones guardadas anteriores permanecen almacenadas y la BASE no cambia. **RESTAURAR BASE** revierte el override local.

## Uso

1. Abrir el editor SVG y elegir **Australia** o **Madrid**.
2. Pulsar **CARGAR GUARDADO**. El cargador consulta `manifest.json`, obtiene el SVG de `circuits/svg/` y aplica el override a ese circuito.
3. Si se desea comparar con la versión interna, pulsar **RESTAURAR BASE**.

La versión experimental **`perf6a-preview.html`** comparte este `circuits/manifest.json`: `CARGAR GUARDADO` selecciona el mismo SVG nuevo de Melbourne en APEX estable y en la prueba 6A. La opción `perf6a` solo modifica la proyección de las ruedas de los rivales.

## Pruebas

- `node apex/tests/madrid-saved-svg.cjs`: referencia del manifiesto, edición SVG de Madrid, su JSON y conservación de ediciones previas.
- `node apex/tests/madrid-saved-svg-browser.cjs`: integración del importador de Madrid con hidratación IndexedDB y renderizador.
- `node apex/tests/svg-import-materials-browser.cjs`: importación de pianos y materiales SVG.

Las referencias históricas a ediciones de principios de noviembre ya **no** son las que carga el botón «CARGAR GUARDADO», aunque se conservan como archivos independientes.

## Barreras laterales · corrección del 10/11/2026

El importador mantiene la geometría y colisiones autoritativas del SVG. En las versiones anteriores, una barrera larga podía quedar fuera de los sectores activos o del frustum al usar su ancla/centro. Ahora Canvas y WebGL seleccionan cada barrera con independencia del sector de su ancla y hacen el recorte por paquetes y segmentos visibles. Los muros físicos dibujados por el usuario siguen siendo los únicos obstáculos de colisión: no se generan barreras nuevas en las escapatorias ni en la entrada de boxes.

Prueba de regresión: `node apex/tests/svg-barrier-visibility.cjs`.

## Terreno, coche y escapatorias · corrección universal 10/11/2026

El relieve fino se apoya en `apexWorldGroundY()`: es la referencia de
cota natural del propio simulador. La física y `playerDriveSurfacePose()`
**no se modifican**.

El motor de terreno elimina el descarte por punto central de una celda
parcialmente pavimentada. El terreno grueso y fino comparten recortes exactos
en X/Z para el asfalto, los pianos, el pitlane y las `surfaceZone` SVG.

**Corrección posterior de los defectos vistos en Melbourne:** la resta de
polígonos nunca debe alterar la coordenada Y de los vértices residuales del
terreno. Antes se copiaba la cota de una escapatoria o carretera a un
triángulo de terreno, generando cuñas elevadas que podían ocultar el
monoplaza. El recorte permanece topológico, conservando las alturas del
terreno original. Además, ahora incluye en una máscara separada **todo el
corredor de la escapatoria de respaldo**, hasta el límite dibujado, no sólo
asfalto y pianos. Esa máscara adicional no modifica ni recorta el SVG
original de escapatorias. En túneles y puentes a distinto nivel el suelo
natural se preserva. El pequeño parche WebGL junto a la cámara sólo se
dibuja si el coche está en la pista principal.

El compilador invalida las mallas anteriores con
`APEX_CIRCUIT_COMPILE_REV = 230693`. Se conservan SVG, trazada,
altura física del vehículo, peralte, colisiones y configuración JSON.

Pruebas:
- `node apex/tests/terrain-surface-ownership.cjs`: recorte fino/grueso y
  contornos diagonales con cambios extremos de cota, sin cuñas.
- `node apex/tests/terrain-runoff-corridor.cjs`: escapatoria completa
  protegida de solapamiento con terreno, SVG intacto y puentes seguros.

Las pruebas geométricas pasan; queda pendiente verificar la imagen
real en WebGL y Canvas después de cargar la última versión de `main`.
