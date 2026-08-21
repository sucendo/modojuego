# System Forge — Arquitectura

## Principio de producto

System Forge tiene dos funciones de primer nivel sobre el mismo núcleo científico:

1. simulador astronómico independiente;
2. herramienta de autoría y validación para Voyastris.

Ninguna función de integración con Voyastris debe limitar las capacidades del simulador.

## Regla de modularización

Desde v1.9.4.0, toda función nueva de tamaño relevante debe nacer en `src/`. `index.html` conserva la composición de la aplicación y parte del núcleo histórico, pero no debe volver a convertirse en el destino por defecto de nuevos subsistemas.

## Módulos actuales

- `src/app/`: eventos y preferencias compartidas.
- `src/model/`: schema, referencias/baricentros y contrato base de vehículos espaciales (`spacecraft.js`).
- `src/physics/`:
  - `integrator.js`: N-body Velocity Verlet, energía y momento angular;
  - `fast-time.js`: selector full/reduced/Kepler y propagadores rápidos;
  - `structures.js`: gravedad/potencial de estructuras y sincronización con padres;
  - `encounters.js`, `resonance.js` y `tracer-integrator.js`: subsistemas especializados.
- `src/analysis/`: dinámica orbital, estabilidad, arquitectura, resultados y `relative-measurement.js` para magnitudes A↔B.
- `src/renderer/`:
  - `render-state.js`: caché/estado de render;
  - `orbit-layer.js`: geometría y refresco de órbitas;
  - `trajectory-layer.js`: historial y render de trayectorias N-body con cadencia cinemática adaptativa;
  - `frame-sync.js`: sincronización de matrices de cámara y overlays inmediatamente antes del render;
  - `orbit-controls.js`: interacción orbital ratón/táctil;
  - `camera-navigation.js`: viaje, seguimiento y centrado;
  - `overlay-priority.js`: prioridad jerárquica común;
  - `label-layer.js`: etiquetas y resolución de solapes;
  - `marker-layer.js`: anillos 1:1 y resolución de solapes.
- `src/ui/`: Ayuda/tour, hover astronómico, rendimiento, Vista y capas, inspector de vehículos y `measurement-controller.js`.
- `src/io/`: importación/exportación y serialización de proyecto.
- `src/catalog/`: catálogo base y catálogo Voyastris.

## EventBus

`appEvents` es el canal de desacoplamiento progresivo. Publica al menos:

- `body:selected`
- `reference:selected`

Medir A↔B ya consume `body:selected` para fijar A/B sin duplicar la selección del Explorador o del mapa 3D. Los instrumentos futuros (timeline, baseline, etc.) deben seguir el mismo patrón.

## Renderer y overlays

Desde v1.9.4.1, etiquetas e iconos 1:1 consumen `OverlayPriorityResolver`. La regla de solape se define una sola vez: seleccionado primero, después anfitriones/descendencia, tipo de cuerpo y masa. Cambiar la prioridad debe hacerse en ese resolver y no por separado en cada capa.

La navegación de cámara vive en `CameraNavigation`; el estado `cameraTravel` sigue formando parte del estado global por compatibilidad, pero su ciclo de vida ya no está repartido por el script principal.

## Preferencias

Las preferencias de interfaz viven fuera del proyecto astronómico. Cambiar de sistema no debe resetear Zoom móvil, panel de rendimiento, viaje de cámara, etc.

## Física modular desde v1.9.4.2

El integrador N-body, la gravedad de estructuras y el fast-time ya viven fuera del HTML. `index.html` conserva adaptadores finos para no forzar una reescritura simultánea de todos los consumidores históricos. Las mejoras futuras deben llamar directamente a los módulos nuevos siempre que sea posible.

La suite fija ahora tres referencias: órbita de dos cuerpos con conservación de energía/momento angular, campo de una cáscara esférica y umbrales del selector full/reduced/Kepler.

## Runtime modular desde v1.9.4.3

El bucle principal de simulación vive en `physics/runtime.js` y coordina el integrador, fast-time, estructuras, render y monitor de rendimiento. Órbitas, trayectorias, Vista y capas e IO también están fuera del HTML.


## Sincronización de frame desde v1.9.4.4

La proyección de etiquetas, iconos 1:1 y baricentro debe usar la misma pose de cámara que el frame WebGL. El orden de runtime es: física → posiciones 3D → navegación/controles → `camera.updateMatrixWorld(true)` → overlays de pantalla → render. No se deben reintroducir proyecciones de overlays dentro de `updateMeshes()`.

Las trayectorias separan dos conceptos: el histórico físico almacenado y el extremo vivo renderizado. La cadencia del histórico depende del periodo/cinemática y de la velocidad temporal; el extremo vivo puede refrescarse más a menudo sin inventar muestras históricas.

## Spacecraft I desde v1.9.5.0

`model/spacecraft.js` define taxonomía y campos de misión; la UI ya permite crear y editar `spacecraft`. Son cuerpos gravitacionales de masa normalmente despreciable en N-body completo y followers orbitales en el régimen reducido. El preview Kepler opera también sobre ellos.

El preset Solar usa ISS/Hubble/Parker/Voyager como casos de referencia. La procedencia temporal forma parte del registro: una condición inicial derivada de TLE o un vector/modelo aproximado no se presenta como una efeméride exacta.

Spacecraft I no ejecuta propulsión activa, maniobras, consumo dinámico de combustible, actitud, drag/reboost ni aerodinámica. Esas capacidades deben añadirse en módulos futuros sin alterar el contrato balístico actual.

## Instrumentos científicos I

`analysis/relative-measurement.js` calcula magnitudes físicas del par A↔B sin depender de UI. `ui/measurement-controller.js` gestiona selección, presentación y línea 3D. El instrumento se actualiza dentro de `FrameSynchronizer`, después de fijar la matriz final de cámara y antes del render, para compartir el mismo frame visual que los overlays.

## Próximas extracciones prioritarias

1. reducir/eliminar adaptadores históricos que ya solo delegan en módulos.
2. extraer composición de escena/cuerpos y parte del runtime de selección restante.
3. mantener nuevas funciones científicas exclusivamente modulares.

Con Medir A↔B ya implementado, la siguiente fase funcional puede ampliar baseline/timeline/momento angular visible y, después, dinámica avanzada y Spacecraft II.

## Testing

Cada módulo nuevo debe incluir una prueba mínima cuando sea posible. La suite cubre infraestructura, referencia orbital circular, prioridades/fade/easing del renderer, conservación de energía y momento angular, teorema de la cáscara, histéresis del fast-time, parser/escape de IO y runtime; desde v1.9.4.4 cubre además orden de frame, cadencia adaptativa de trayectorias, migración schema 22 y contrato de spacecraft; v1.9.5.0 añade medición relativa y el preset Solar con cinco misiones.
