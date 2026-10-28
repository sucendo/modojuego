# Logos vectoriales en los carteles del simulador

- Verde: Team Equipalia (diseño racing con icono tricolor real, letras blancas
  y diagonales lima/blancas sobre verde oscuro).
  Vista frontal de 24 m: [team-equipalia-wall-24m.svg](../assets/sponsors/team-equipalia-wall-24m.svg).
- Azul: SCT Telecom. La publicidad usa **un único mural maestro SVG de 24 m**,
  no tres logos repetidos cada 8 m. De izquierda a derecha: marca SCT grande,
  franja diagonal a altura completa, SCT mediano, segunda banda diagonal y
  SCT pequeño; se conservan rombos azules y letras vectoriales originales.
  [Ver el mural real de 24 metros](../assets/sponsors/sct-wall-24m.svg).
- Blanco: MDTel.

Los SVG de `assets/sponsors/` tienen contornos vectoriales, letras trazadas y
exterior transparente: no contienen fotografías incrustadas, rectángulo de
fondo, tipografías externas ni filtros. Las curvas grises de MDTel y los rombos
azules de SCT forman parte del logo y se conservan. Se han limpiado las sombras
y se ha reconstruido la rotulación pequeña para que pueda escalarse. Las
rotulaciones reconstruidas emplean contornos de DejaVu Sans Bold; licencia en
`docs/licenses/helmet-lettering.txt`, aplicable también a estos contornos.

Los paneles publicitarios predeterminados alternan los tres colores en sectores
de 72 m. Team Equipalia utiliza un módulo SVG transparente de **8 m**, que
se repite **tres veces por cada 24 m** de valla verde; la referencia completa
de 24 m contiene exactamente ese módulo repetido tres veces, con fondo
verde oscuro. SCT usa un mural completo de 24 m que se repite a partir de
la distancia longitudinal acumulada en cada muro continuo, respetando
las uniones entre segmentos. MDTel mantiene su logo independiente cada 24 m.

Los logos de Team Equipalia y sus bandas diagonales cubren el 100 % de la altura
publicitaria del muro verde, como en la referencia. El patrón se mide en metros
físicos acumulados por tramo continuo de valla SVG (no en el tamaño de cada
triángulo/proyección). El segmento de muro sólo muestra su recorte del módulo
8 m, sin márgenes ni pegatinas centradas; las juntas, curvas y segmentos
desiguales comparten la misma fase gráfica y mantienen la continuidad.
El vector SVG incluye la marca en blanco, icono tricolor y diagonales que van
desde el pie hasta la coronación, todas recortadas en la geometría original.

Los diseños SCT (24 m) y Equipalia (8 m) se pretriangulan en build y el recorte de cada muro se cachea en
WeakMap por tramo, con versiones normal e invertida para respetar lectura
del logotipo cuando se mira desde el otro sentido. Canvas2D y WebGL reutilizan
el mismo resultado; solo se proyectan los triángulos realmente visibles.
Los diagonales ligeros conservan preferencia incluso si el presupuesto de
logotipos limita los textos lejanos. Se mantienen los límites de triángulos
por fotograma y se siguen respetando cortes, accesos y tramos sin publicidad.
Los carteles independientes mantienen un logo centrado de su patrocinador.

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
- Los módulos completos de SCT ocupan cada panel físico con fase continua,
  sin logotipos flotantes ni márgenes; los carteles independientes reutilizan
  el SCT clásico. Se respeta el presupuesto compartido de triángulos.
- Máximo por fotograma: 12 logos / 5200 triángulos en escritorio;
  6 logos / 2600 triángulos en móvil.
- El texto fino sólo aparece a partir de 100 px de alto en escritorio.
- Las estaciones de muro se cachean por el array visual del circuito; Equipalia
  tiene una cuadrícula adicional de 8 m, sin búsquedas espaciales por fotograma.
- Las franjas diagonales y el emblema tricolor de Equipalia son contornos SVG
  con sus triángulos precalculados, sin nuevas texturas ni llamadas de dibujo.
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
