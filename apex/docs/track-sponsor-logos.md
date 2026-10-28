# Logos vectoriales en los carteles del simulador

- Verde: Team Equipalia.
- Azul: SCT Telecom.
- Blanco: MDTel.

Los SVG de `assets/sponsors/` tienen contornos vectoriales, letras trazadas y
exterior transparente: no contienen fotografías incrustadas, rectángulo de
fondo, tipografías externas ni filtros. Las curvas grises de MDTel y los rombos
azules de SCT forman parte del logo y se conservan. Se han limpiado las sombras
y se ha reconstruido la rotulación pequeña para que pueda escalarse. Las
rotulaciones reconstruidas emplean contornos de DejaVu Sans Bold; licencia en
`docs/licenses/helmet-lettering.txt`, aplicable también a estos contornos.

Los paneles publicitarios predeterminados alternan los tres colores en sectores
de 72 m. Dentro de los muros existentes se seleccionan estaciones nominales de
24 m, con una sola marca por estación y lado. La posición se adapta al segmento
visual disponible: no se añaden muros, se cubren accesos ni se reconstruye el
circuito. En los huecos sin muro no se crea un cartel flotante. Los carteles
independientes existentes también reciben el logo de su color.

Se respetan `advertising.enabled=false`, paneles `blank`, muros con
`advertising=false`, rangos y lados personalizados. Los colores de publicidad
personalizada se clasifican como verde, azul o blanco cuando corresponde; los
otros colores conservan su publicidad. No se modifican carteles de frenada,
cronometraje, semáforos, colisiones, trazados ni física.

## Rendimiento y renderizado

`track-sponsor-vectors.js` contiene la triangulación precalculada de los tres
SVG. Se carga una vez y comparte arrays de vértices entre todas las apariciones.
No hay trazado de imágenes, lectura de SVG, triangulación ni subida de texturas
por fotograma. WebGL utiliza el lote de geometría existente y su profundidad por
vértice: los logos siguen la perspectiva y la oclusión de los muros. Canvas 2D
utiliza los mismos triángulos, agrupados por color.

- Se omiten logos de menos de 7 px de alto o 12 px de ancho y los que están
  fuera de pantalla o cruzan el plano cercano.
- Distancia máxima: 260 m en escritorio, 180 m en móvil.
- Máximo por fotograma: 12 logos / 5200 triángulos en escritorio;
  6 logos / 2600 triángulos en móvil.
- El texto fino sólo aparece a partir de 100 px de alto en escritorio.
- Las estaciones de muro se cachean por el array visual del circuito.
- No se crean recursos GPU adicionales; la recuperación de contexto utiliza
  el mismo lote que el resto del escenario.

Diagnóstico: `window.ApexTrackSponsors.stats` expone logos, triángulos y tiempo
CPU de la última imagen, máximos observados y número de vectores compartidos.
Los tiempos de las pruebas con Chromium/SwiftShader son orientativos y no
sustituyen una medición de FPS en un móvil físico.

## Regeneración y pruebas

`python3 apex/tools/compile-sponsor-vectors.py` regenera la malla desde los SVG.
Requiere Shapely >= 2.1 sólo al compilar. No se necesita Python en el navegador.

`node apex/tests/track-sponsors-audit.cjs` valida vectores, presupuestos,
clasificación de colores, configuración y sintaxis del HTML ensamblado.

Con el repositorio servido en el puerto 8765:
`node apex/tests/track-sponsors-browser.cjs` comprueba WebGL en las tres cámaras,
fallback Canvas, límites, llamadas de dibujo y concordancia visual SVG/malla.
`APEX_AUDIT_DEVICE=mobile` ejecuta la variante móvil.
