# Cobertura de Satellite Rastreador 1.0.0

Este archivo sirve como lista de comprobación de la refactorización.

## Correcciones sobre la versión original

- [x] Velocidad mostrada tomada del vector de velocidad SGP4 real.
- [x] Trazas partidas al cruzar el antimeridiano ±180°.
- [x] `window.simTime` expuesto desde el mismo módulo que posee el estado temporal, sin referencias fuera de ámbito.
- [x] Geolocalización continua mediante `watchPosition()`.
- [x] Nombres y datos de usuario renderizados con nodos DOM/textContent en lugar de interpolarlos en `innerHTML`.
- [x] `satellite.js` fijado en 7.1.0.
- [x] PWA con manifest, iconos y service worker.
- [x] Código separado por responsabilidades en módulos ES.

## Funciones añadidas

- [x] OMM/JSON moderno y NORAD ID de hasta 9 cifras.
- [x] Búsqueda por nombre o NORAD ID.
- [x] Categorías de catálogo.
- [x] Snapshots orbitales para GitHub Pages mediante GitHub Actions.
- [x] Cacheo de consultas CelesTrak por un mínimo de dos horas.
- [x] Ficha orbital ampliada: posición, velocidad, inclinación, excentricidad, periodo, perigeo, apogeo y epoch.
- [x] Edad de los elementos orbitales con indicador de frescura.
- [x] Trazas de pasado y futuro.
- [x] Huella de cobertura en función de la elevación mínima seleccionada.
- [x] Toggle de huella.
- [x] Azimut, elevación y rango desde la posición del observador.
- [x] Predicción de pasos AOS / máximo / LOS durante 48 horas.
- [x] Refinado de cruces de elevación mediante búsqueda binaria.
- [x] Cálculo de luz solar, penumbra y umbra.
- [x] Criterio de visibilidad del paso con observador en oscuridad y satélite iluminado.
- [x] Meteorología Open-Meteo y puntuación orientativa de observación.
- [x] Radar RainViewer sincronizado con los frames disponibles.
- [x] RainViewer queda reservado al radar; la capa de nubes de 2.1 fue sustituida en 2.2 por una textura alfa casi en tiempo real para evitar la paleta falsa de Cloud Top Temperature.
- [x] Nubes y radar desacoplados: un fallo del radar no bloquea la capa de nubes.
- [x] Sombra nocturna progresiva y configurable, no solo línea de terminador.
- [x] Wrapping mundial corregido (`worldCopyJump` + capas con wrap) para conservar overlays/vectores al cruzar ±180°.
- [x] Recuperados los iconos originales `iss` y `sat1`–`sat9`.
- [x] Catálogo ampliado con `sat10`–`sat17` a partir de las imágenes 512 px adjuntadas.
- [x] Selector de imagen por satélite y selector previo para TLE manual.
- [x] UI simplificada con pestañas Seguidos / Catálogo / Ficha.
- [x] Responsive móvil, bottom sheet y pantalla completa.
- [x] Edición de nombre y TLE de satélites seguidos.
- [x] Persistencia de preferencias y satélites.

## Excluido deliberadamente

- [ ] Modo Tierra 3D, por decisión del proyecto para esta fase.


## 2.2 — correcciones visuales y mundo continuo

- [x] Panel/halo del icono sincronizado con el color de cada satélite.
- [x] Marcadores duplicados en las copias visibles del mundo.
- [x] Trazas pasadas y futuras duplicadas en las copias visibles del mundo.
- [x] Huellas de cobertura duplicadas en las copias visibles del mundo.
- [x] Terminador duplicado en las copias visibles del mundo.
- [x] Capa de nubes reemplazada por una textura alfa de nubes reales, sin colores meteorológicos.
- [x] Reproyección equirectangular -> Web Mercator realizada en cliente por tiles.
- [x] Nubes siempre en el último estado disponible; no dependen del tiempo simulado.
- [x] Fallback de fuente/resolución si la textura principal de nubes no responde.


## 2.4 — contraste día/noche y adaptación de nubes

- [x] Máscara nocturna vectorial SVG, uniforme y replicada entre mundos.
- [x] Halo de satélites más difuso sin recuadro.
- [x] Nubes con tratamiento automático distinto para OSM/Claro, Oscuro y Satélite.


## 1.0.0 — móvil y experiencia de selección

- [x] Navegación inferior móvil y mapa libre de paneles por defecto.
- [x] Bottom sheet ampliable para listas y ficha.
- [x] Panel de capas táctil en cuadrícula.
- [x] Tarjeta compacta al seleccionar un satélite desde el mapa.
- [x] Ficha orientada a situación actual antes que a datos técnicos.
- [x] Rumbo aproximado calculado a partir del desplazamiento del subpunto durante 30 segundos.
- [x] Cobertura mostrada como diámetro aproximado para la elevación mínima elegida.
- [x] Predicción automática inicial de pasos con observador.
- [x] Meteorología y geometría de observación integradas en la misma ficha.
- [x] Selección de observador mediante geolocalización, coordenadas o punto del mapa.
- [x] Datos orbitales avanzados relegados a un bloque desplegable.
