# Logos vectoriales en los carteles del simulador

- Verde: Team Equipalia (diseño racing con icono tricolor real, letras blancas
  y diagonales lima/blancas sobre verde oscuro).
  Vista frontal de 24 m: [team-equipalia-wall-24m.svg](../assets/sponsors/team-equipalia-wall-24m.svg).
- Azul: SCT Telecom. La publicidad usa **un único mural maestro SVG de 24 m**,
  no tres logos repetidos cada 8 m. De izquierda a derecha: marca SCT grande,
  franja diagonal a altura completa, SCT mediano, segunda banda diagonal y
  SCT pequeño; se conservan rombos azules y letras vectoriales originales. Los rombos, de tres capas azules, envuelven completamente las letras SCT (incluida la T) en los tres tamaños, sin tocar TELECOM ni las bandas diagonales.
  [Ver el mural real de 24 metros](../assets/sponsors/sct-wall-24m.svg).
- Blanco: MDTel.

Los logos aislados de `assets/sponsors/` tienen contornos vectoriales, letras
trazadas y exterior transparente. Los murales incluyen su propio fondo de
color como geometría vectorial. No contienen fotografías incrustadas,
tipografías externas ni filtros. Las curvas grises de MDTel y los rombos
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
WeakMap por tramo, con orientación física estable por cada recorrido de muro. SCT no cambia su fase
ni su composición al mover o girar la cámara; Equipalia conserva sus dos versiones. Canvas2D y WebGL reutilizan
el mismo resultado; solo se proyectan los triángulos realmente visibles.
Equipalia mantiene su política de diagonales y texto. SCT reserva el presupuesto
para bloques visibles completos de 24 m, sin descartar letras por segmento. Se mantienen los límites de triángulos
por fotograma y se siguen respetando cortes, accesos y tramos sin publicidad.
Los carteles independientes mantienen un logo centrado de su patrocinador.

Se respetan `advertising.enabled=false`, paneles `blank`, muros con
`advertising=false`, rangos y lados personalizados. Los colores de publicidad
personalizada se clasifican como verde, azul o blanco cuando corresponde; los
otros colores conservan su publicidad. No se modifican carteles de frenada,
cronometraje, semáforos, colisiones, trazados ni física.

## Rendimiento y renderizado

`track-sponsor-vectors.js` contiene la triangulación precalculada de los tres
logos y del mural SCT. Se carga una vez y comparte arrays de vértices entre todas las apariciones.
No hay trazado de imágenes, lectura de SVG, triangulación de contornos ni subida
de texturas por fotograma. Los recortes de intervalos físicos se cachean; los
intervalos nuevos sólo necesitan clipping de triángulos ya compilados. WebGL utiliza el lote de geometría existente y su profundidad por
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


## Corrección final: recorte estable y regiones planas

Base revisada: `e59b232` de main. Se conserva el maestro completo `1440 × 80`
para los **24 metros** de SCT, con posiciones y escalas grande / mediana /
pequeña ya fijadas en él. `sct-wall.svg` y `sct-wall-24m.svg` contienen exactamente
la misma composición. No se ajusta ningún logo a la longitud de un panel.
TELECOM se separa del extremo derecho de cada rombo y las tres sombras se eliminan.

Los fallos tenían varias causas independientes:

1. La separación por colores convertía el fondo azul en una capa de texto:
   podía volver a cubrir diagonales y rombos. Además, las capas solapadas se
   disputaban muestras del depth buffer.
2. El presupuesto se consumía por **segmento**. Una palabra que atravesaba
   varias juntas podía perder fragmentos, aunque su escala SVG fuera correcta.
3. Los segmentos procedurales se recrean por frame: cachear sólo por objeto no
   aprovecha los nodos fijos. El cálculo anterior usaba además el signo inverso
   de `wrapDeltaS`, por lo que podía rechazar intervalos procedurales válidos.
4. La orientación basada en la proyección de cada segmento podía invertir la
   fase al girar la cámara. SCT utiliza ahora la orientación física del recorrido.

El compilador resta de cada región las superficies que se pintan después en
el SVG. El resultado son **1749 triángulos con regiones interiores disjuntas**, frente
a los 2590 del maestro anterior (un 32,5 % menos):
la superficie total es una cara completa, sin huecos ni doble pintura. La
simplificación geométrica previa tiene tolerancia de 0,12 unidades SVG (2 mm
horizontales en el mural de 24 m). No afecta a Equipalia, MDTel ni al SCT aislado.
Todas las regiones del mural usan la misma cara, con bias de cámara de 0,06 m
respecto al muro. Al no existir superficies superpuestas entre letras, rombos
y diagonales, no necesitan competir con offsets distintos. El orden de envío
de los colores puede invertirse sin alterar las letras.

Las vallas exactas conservan sus metros acumulados y reciben orientación e
identidad estables por recorrido continuo. Las procedurales obtienen metros
de pared a partir de los nodos fijos de la cinta, con distancias acumuladas de
sus posiciones físicas; no utilizan el ancho proyectado ni el fragmento visible
para escalar el mural. Ambos caminos usan `sctMuralSlices`, que sólo recorta el
maestro. La clave de caché incluye intervalo y sentido, con un máximo de 2048
intervalos por fuente; no se reutiliza un recorte de otra longitud.

Antes de dibujar, ambos renderizadores agrupan los recortes visibles por bloque
de 24 m y calculan su coste completo. Priorizan los bloques cercanos y reservan
su coste dentro de los límites existentes de 2600/5200 triángulos. Cuando
hay otras marcas, deja al menos 400/800 triángulos disponibles para sus
rótulos existentes; SCT no monopoliza el presupuesto compartido. Si no cabe,
se omite el bloque distante entero: no se mutilan letras en una junta. El
recorte contra el plano cercano también opera sobre la geometría existente.
La proyección reutiliza constantes de cámara por segmento y envía coordenadas
escalares, evitando consultas de FOV y vectores temporales por vértice. La
publicidad de cada muro se resuelve una sola vez por frame y se comparte entre
planificación y dibujo. No añade llamadas de dibujo ni recursos GPU. Los presupuestos publicados son
límites compartidos, no un incremento añadido a los anteriores.

Las pruebas comprueban cobertura y ausencia de solapamiento entre regiones,
T dentro de cada rombo, TELECOM separado, escalas y posiciones fijas al dividir
el muro en segmentos desiguales, juntas normales/invertidas y repetición a
24 m. El navegador compara un mural entero con sus recortes exactos y
procedurales en varios ángulos y distancias, alterando el orden de colores para
detectar interferencias. Se validan ambas interfaces de render, las tres
cámaras y la emulación móvil.

Los pasos de cebra ya traían la corrección de orientación en main. Se conserva
esa implementación y se amplía `crosswalk-orientation.cjs`: barras paralelas a
la marcha, repetidas transversalmente, en calles giradas, sentido inverso y
fallback geométrico lejos de la pista. `URBAN_STRIPES` no cambia.
