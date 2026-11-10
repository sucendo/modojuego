# Circuitos APEX Formula 26

Esta carpeta conserva las versiones editadas de los circuitos. El archivo `manifest.json` es la referencia usada por el botón **CARGAR GUARDADO** del editor SVG; las versiones BASE internas no se sustituyen.

## Estructura

- `svg/`: geometría y elementos visuales/físicos en formato SVG.
- `json/`: metadatos estructurados (altimetría, peralte, neumáticos, boxes, anchura, etc.).
- `manifest.json`: selección de la edición guardada por identificador del circuito.

## SVG guardados vigentes · 10/11/2026

| Circuito | Identificador | SVG cargable |
| --- | --- | --- |
| Australia · Melbourne (Albert Park) | `01-australia` | `svg/apex26_01-australia_circuito-propuesta-20261110-barriers-aligned.svg` |
| España · Madrid (MADRING) | `14-spain` | `svg/apex26_14-spain_circuito-propuesta-20261110.svg` |

Son los dos SVG proporcionados por el usuario el 10/11/2026. Para la carga se eliminaron **exclusivamente las dos imágenes raster ocultas de referencia** en cada SVG (no aportan geometría al simulador). Las líneas, rutas, transforms, contornos, grupos, barreras y demás elementos vectoriales se han preservado.

- **Madrid**: primero se carga `json/apex26_14-madrid-spain_2026-10-29.json` y después el SVG seleccionado, conservando colores de pianos y perfil de peralte. Contiene 68 carteles de distancia activos y cuatro plantillas dentro de la biblioteca.
- **Australia**: carga su SVG con los datos BASE JSON internos. Dos barreras de hormigón activas están alineadas con la pista mediante la transformación inversa de un desplazamiento de Boxy de (-220,681854, +14,552436). Se mantiene el SVG original de la propuesta sin corregir como edición previa. Las demás tipologías disponibles en la biblioteca siguen siendo plantillas, no objetos colocados.
- Ambos usan `exactSvg: true` en el manifiesto, para respetar los elementos SVG dibujados y transformados sin regenerarlos.
- Las versiones guardadas anteriores permanecen almacenadas y la BASE no cambia. **RESTAURAR BASE** revierte el override local.

## Uso

1. Abrir el editor SVG y elegir **Australia** o **Madrid**.
2. Pulsar **CARGAR GUARDADO**. El cargador consulta `manifest.json`, obtiene el SVG de `circuits/svg/` y aplica el override a ese circuito.
3. Si se desea comparar con la versión interna, pulsar **RESTAURAR BASE**.

## Pruebas

- `node apex/tests/madrid-saved-svg.cjs`: referencia del manifiesto, edición SVG de Madrid, su JSON y conservación de ediciones previas.
- `node apex/tests/madrid-saved-svg-browser.cjs`: integración del importador de Madrid con hidratación IndexedDB y renderizador.
- `node apex/tests/svg-import-materials-browser.cjs`: importación de pianos y materiales SVG.

Las referencias históricas a ediciones de principios de noviembre ya **no** son las que carga el botón «CARGAR GUARDADO», aunque se conservan como archivos independientes.

## Barreras laterales · corrección del 10/11/2026

El importador mantiene la geometría y colisiones autoritativas del SVG. En las versiones anteriores, una barrera larga podía quedar fuera de los sectores activos o del frustum al usar su ancla/centro. Ahora Canvas y WebGL seleccionan cada barrera con independencia del sector de su ancla y hacen el recorte por paquetes y segmentos visibles. Los muros físicos dibujados por el usuario siguen siendo los únicos obstáculos de colisión: no se generan barreras nuevas en las escapatorias ni en la entrada de boxes.

Prueba de regresión: `node apex/tests/svg-barrier-visibility.cjs`.
