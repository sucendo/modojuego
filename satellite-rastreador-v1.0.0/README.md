# Satellite Rastreador 1.0.0

Aplicación web estática para GitHub Pages orientada al seguimiento de satélites artificiales mediante SGP4. Es una refactorización completa del proyecto original de una sola página, manteniendo el mapa 2D y ampliándolo con catálogo OMM, predicción de pasos, geometría de observación, iluminación y meteorología.

## Funciones implementadas

- Mapa Leaflet con OSM, CARTO claro/oscuro y Esri World Imagery.
- Propagación SGP4/SDP4 con **satellite.js 7.1.0**, fijado por versión.
- Soporte de **OMM/JSON** mediante `json2satrec()` y soporte TLE manual mediante `twoline2satrec()`.
- Catálogo y búsqueda por nombre o NORAD ID.
- Categorías: estaciones, brillantes, meteorológicos, observación terrestre, GPS, Galileo, radioafición, ciencia y Starlink.
- Persistencia de satélites, vista, colores, iconos y preferencias en `localStorage`.
- TLE manual con validación de estructura y checksum.
- Posición geodésica, **velocidad real devuelta por SGP4**, inclinación, excentricidad, periodo, perigeo y apogeo.
- Epoch y edad de los elementos orbitales.
- Trazas **pasado + futuro**, separadas al cruzar el antimeridiano para evitar líneas falsas de ±180°.
- Huella configurable por elevación mínima: 0°, 5°, 10°, 20° o 30°.
- Geolocalización continua con `watchPosition()` y círculo de precisión.
- Azimut, elevación y distancia respecto al observador.
- Predicción de pasos durante 48 h con AOS, máximo, LOS, elevación máxima, azimuts, distancia y duración.
- Cálculo de iluminación: Sol, penumbra y umbra usando `sunPos()` + `shadowFraction()`.
- Criterio de visibilidad geométrica: satélite iluminado + observador al menos en crepúsculo civil nocturno (Sol ≤ −6°).
- Condiciones meteorológicas del observador mediante Open-Meteo: nubosidad, precipitación y visibilidad, con puntuación orientativa de observación.
- Radar de precipitación de RainViewer.
- Nubes globales **casi en tiempo real** mediante una textura alfa de nubes reales actualizada aproximadamente cada 3 horas. La capa contiene sólo nubes, sin la falsa paleta de temperatura del producto anterior, y se reproyecta en el navegador de equirectangular a Web Mercator.
- Sombra nocturna y terminador sincronizados con el reloj simulado; la noche usa una máscara negra fija con intensidad suave.
- Mapa mundial continuo: `worldCopyJump` para vectores y wrapping de teselas, de modo que la información no desaparece al desplazar el mapa más allá del antimeridiano.
- Reloj real/manual, reproducción, avance y retroceso acelerado.
- Modo bajo consumo y pantalla completa. En móvil: navegación inferior Mapa/Satélites/Ficha/Capas/Tiempo, pantalla completa accesible desde el encabezado, bottom sheet gestual, panel de capas táctil y ficha de situación optimizada.
- PWA instalable (`manifest.webmanifest` + `sw.js`).
- API externa segura `window.simTime`, definida dentro del módulo que posee el estado temporal.
- GitHub Action para generar snapshots orbitales y desplegar Pages sin backend.

## Experiencia móvil 1.0.0

La interfaz móvil sigue un enfoque **mapa primero**. La navegación inferior agrupa **Mapa, Satélites, Ficha, Capas y Tiempo**. El botón `☰` únicamente muestra u oculta esa navegación; la pantalla completa tiene un botón dedicado en el encabezado.

**Satélites** contiene las pestañas Seguidos y Catálogo. La ficha se abre como bottom-sheet ampliable. Una tarjeta compacta aparece solamente cuando el satélite seleccionado está dentro del mapa visible y puede deslizarse hacia arriba para abrir la ficha. También se muestra un contador independiente con el número de satélites presentes en el viewport.

La ubicación del observador queda accesible mediante un botón flotante y puede proceder del navegador, coordenadas manuales o un punto elegido sobre el mapa.

## Qué significa “catálogo online al buscar”

La aplicación puede llevar un **snapshot local** del catálogo generado durante el despliegue. Si ese snapshot no existe, está vacío o no contiene lo que se busca, no descarga todo el catálogo al iniciar: consulta CelesTrak únicamente cuando el usuario realiza una búsqueda, abre una categoría o solicita actualizar un satélite. Esto reduce la carga inicial y permite que la aplicación siga funcionando aunque el snapshot no esté disponible.

## Estructura

```text
index.html
css/app.css
js/
  app.js               orquestación
  catalog.js           CelesTrak + snapshot/caché
  config.js            configuración
  map.js               Leaflet, wrapping mundial y capas de satélites
  orbit.js             SGP4, OMM/TLE, huellas y trazas
  overlays.js          sombra nocturna, radar RainViewer y nubes alfa casi en tiempo real
  passes.js            AOS / máximo / LOS
  storage.js           persistencia
  time-controller.js   reloj y scrubber
  ui.js                renderizado DOM seguro y selector de iconos
  utils.js             utilidades
  icons.js             catálogo de iconos de satélite
  weather.js           Open-Meteo
assets/satellite-icons/
  32/*.png
  64/*.png
data/
  catalog.json
  catalog-meta.json
  groups/*.json
scripts/
  update-catalog.mjs
  check-project.mjs
.github/workflows/pages.yml
manifest.webmanifest
sw.js
```

## Despliegue recomendado en GitHub Pages

1. Copia el contenido del proyecto a la raíz del repositorio.
2. Haz `commit` y `push` a `main`.
3. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions** como Source.
4. Ejecuta manualmente el workflow **Deploy Satellite Rastreador** la primera vez si no se lanza automáticamente.
5. El workflow genera snapshots OMM y publica la aplicación. También se ejecuta cada 6 horas.

La Action no hace commits automáticos: los datos generados existen únicamente en el artefacto que se publica en GitHub Pages.

## Desarrollo local

Los módulos ES no deben abrirse con `file://`. Arranca un servidor HTTP desde la carpeta del proyecto:

```bash
python -m http.server 8080
```

Abre `http://localhost:8080`.

Para generar los snapshots orbitales localmente, con Node.js 22 o superior:

```bash
npm run catalog:update
```

Para comprobar la estructura:

```bash
npm run check
```

## Política de datos orbitales

La aplicación prioriza snapshots locales generados desde CelesTrak. Si un snapshot no está disponible, la búsqueda puede consultar un objeto o grupo bajo demanda y guarda el resultado durante al menos dos horas. El actualizador no reintenta automáticamente respuestas 403/404 para evitar ciclos de peticiones contra CelesTrak.

Los datos orbitales de catálogo se guardan como OMM/JSON, no como TLE clásico, para admitir identificadores NORAD modernos de más de cinco cifras.

## Precisión y alcance

Es una herramienta educativa/de observación. SGP4 predice a partir de los elementos orbitales disponibles; la calidad de una predicción depende especialmente de la edad y calidad de esos elementos. La puntuación meteorológica y el indicador de visibilidad son orientativos y no sustituyen herramientas operacionales.

## Dependencias de red

- Leaflet 1.9.4 (CDN)
- satellite.js 7.1.0 (CDN ESM)
- CelesTrak (OMM/JSON)
- Open-Meteo
- RainViewer (radar)
- Live Cloud Maps / EUMETSAT (textura alfa global de nubes)
- OSM / CARTO / Esri para cartografía

No requiere claves API para las funciones incluidas en esta versión.

## Iconos de satélite

La versión 2.2 conserva los iconos recuperados en 2.1 (`iss`, `sat1`…`sat9`) y añade ocho variantes derivadas de las imágenes 512 px suministradas (`sat10`…`sat17`). Cada satélite puede cambiar de imagen desde la lista de seguidos; los TLE manuales permiten elegirla antes de añadirlos.

## Nota sobre las nubes

RainViewer se usa únicamente para radar. Las nubes se obtienen como una textura alfa global procesada a partir de datos de EUMETSAT y actualizada aproximadamente cada tres horas. La aplicación la reproyecta por tiles a Web Mercator y siempre muestra la imagen más reciente disponible, independientemente del reloj simulado.


## Mejoras 2.2

- El halo/panel de cada icono toma automáticamente el color elegido para ese satélite, tanto en el mapa como en la lista y en la ficha.
- Las trayectorias, huellas y marcadores se replican en todas las copias visibles del mundo de Leaflet. Esto evita que al centrar América, Asia u otra copia del mapa aparezcan teselas sin información orbital.
- El terminador se replica también en las copias visibles del mundo; la máscara nocturna ya se repetía por teselas.
- La capa de nubes deja de usar Cloud Top Temperature coloreado. Ahora usa una textura alfa de nubes casi en tiempo real y la remuestrea correctamente a Web Mercator en cada tile.
- Las nubes representan siempre el estado más reciente disponible y no siguen el reloj simulado. El radar sí conserva el tiempo manual cuando hay frames disponibles.
- Fuente principal de nubes: Live Cloud Maps (datos modificados de EUMETSAT), con actualizaciones aproximadas cada tres horas y dos fuentes de respaldo.

## Ajustes visuales 2.4

La versión 2.4 cambia la representación de la noche a una máscara vectorial SVG uniforme basada en el terminador real. Esto evita que la sombra dependa del render de teselas canvas y hace que la diferencia entre día y noche sea visible incluso sobre OSM/Claro.

Las nubes se adaptan automáticamente al mapa base: en mapa oscuro tienen menor opacidad y contraste; en OSM/Claro se oscurecen ligeramente para no desaparecer sobre las zonas blancas; en satélite mantienen un blanco más natural. Los iconos de satélite conservan el color elegido mediante un halo más ancho y difuso.


## Experiencia móvil y ficha 1.0.0

La interfaz móvil prioriza el mapa y utiliza una barra inferior con cinco destinos: Mapa, Seguidos, Ficha, Capas y Tiempo. El panel de satélites funciona como una hoja inferior ampliable. Al seleccionar un satélite desde el mapa aparece primero una tarjeta compacta, evitando cubrir inmediatamente la cartografía.

La ficha se ha convertido en un panel de situación: posición, rumbo aproximado sobre la superficie, altitud, velocidad, cobertura, iluminación, relación con el horizonte del observador, próximo paso y condiciones meteorológicas. Si existe una ubicación de observación, se calcula automáticamente una previsión inicial de pasos durante 24 horas; el cálculo manual de 48 horas sigue disponible.
