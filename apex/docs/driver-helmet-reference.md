# Casco de competición y personalización (estudio v2)

Referencia visual aportada por Samuel: `cascos-2026-soymotor.jpeg`.
El casco se interpreta en SVG en vista de tres cuartos: calota curva, mentonera,
base de goma, ventilaciones, pequeño deflector trasero, junta de visera y
fijaciones laterales. No utiliza los patrocinadores ni reproduce los cascos
individuales de los pilotos de la fotografía.

## Pintura y visera

La forma del casco permanece fija. Las once decoraciones son: franja de
competición, chevron, bandas, dos tonos, minimalista, diagonales, ondas,
líneas orgánicas, paneles geométricos, estrellas y damero. Todas se recortan
al contorno de la calota antes de aplicar su iluminación transparente.

Se conservan principal, secundario, detalles y color de visera. Los cuatro
acabados de visera (iridio, ahumada, espejo plata y espejo dorado) añaden
reflejos sobre el color seleccionado. Número y nombre siguen los datos del
perfil, con escape XML y colores validados antes de generar el SVG.

El editor, el avatar, el icono del menú y el avatar SVG descargado comparten
`ApexDriverProfile9F.helmetSvg`. Sus recursos tienen identificadores separados
por contexto para que gradientes y recortes del casco no se mezclen.

## Persistencia y recuperación

Se mantiene `apex26.driverProfile.v1`; los perfiles antiguos conservan sus
colores y diseños. La propiedad opcional `helmet.visorFinish` toma `iridium`
cuando falta o no es válida. Las cinco decoraciones anteriores conservan sus
claves. No se modifica la identidad PLAYER ni la simulación.

«Recuperar guardado» recupera únicamente el casco del último perfil guardado;
«Restablecer casco» recupera sus valores predeterminados. Ninguna opción borra
nombre, datos del piloto o mono personalizado, ni sobrescribe el guardado hasta
pulsar «Guardar perfil». Cancelar y recargar conservan el comportamiento previo.

## Validación

`driver-profile-9f-browser.cjs` comprueba los 44 pares decoración/acabado, una
única geometría física, diferencias reales de píxeles entre decoraciones y
cuatro acabados de visera visibles. Comprueba perfiles antiguos, color de visera,
actualización del avatar, exportación con el mismo casco, guardado/recarga,
recuperación/restablecimiento, independencia del mono y continuidad del menú.
Se valida escritorio y móvil horizontal/vertical, sin desbordamiento lateral.

Esta mejora se aplica al editor de Perfil y sus imágenes SVG; no sustituye
el casco del piloto en el render de carrera. El resultado es una ilustración
vectorial con volumen, no una reproducción fotográfica de la referencia.

## Afinado de forma y materiales (v3)

Se rebaja la cúpula de la calota y se perfila el saliente de la mentonera.
La zona de ventilación frontal tiene un rebaje sombreado, labios de entrada
y una rejilla inferior discreta; se recolocan las entradas superiores dentro
del nuevo contorno. El cuello incorpora un borde de goma separado.

La visera añade curvatura óptica con sombreado lateral y reflejos de estudio
más contenidos, junta más fina y fijaciones de las láminas protectoras.
El deflector trasero pasa a un acabado translúcido. Los reflejos y contornos
siguen siendo capas transparentes sobre las pinturas, sin filtros ni imágenes.

No se cambia el formato del perfil, las once decoraciones, los cuatro acabados
ni los controles. El renderer compartido actualiza también avatar, icono y
exportación. Se repite la validación de los 44 pares, guardado/recuperación y
escritorio/móvil sobre esta nueva geometría.

## Silueta Sainz/Lawson y rotulación en trazados (v4)

La referencia muestra cascos más verticales, con mentonera recogida bajo la
visera y una parte lateral visible detrás de la bisagra. Se reconstruyen el
contorno frontal y trasero, el cierre de la base y el hueco de visera; se
adelantan bisagra y fijaciones, y se adapta el rebaje de ventilación frontal.
La proyección horizontal se estrecha manteniendo registrados pintura y piezas.
Se comprueba la proporción del contorno y el alcance de la visera en el test.

Dorsal, nombre y marca APEX se generan ahora como contornos `<path>`, con una
marca original APEX en el lateral. El nombre del casco se presenta en mayúsculas;
los datos y el nombre visible del perfil conservan su escritura original.
Los símbolos geométricos de las decoraciones ya eran trazados SVG.

`helmet-lettering-9f.js` contiene un repertorio de contornos derivado de DejaVu
Sans Bold: latín básico y extendido, cifras y signos habituales. Incluye tildes,
ñ, diéresis y otras letras europeas. Para caracteres fuera del repertorio se
intenta su descomposición latina y, si no existe, se utiliza un signo de
interrogación; la etiqueta accesible y los datos del perfil conservan el nombre
completo. La licencia y atribución están en `licenses/helmet-lettering.txt`.

El recurso se carga una vez antes del perfil. El render y el SVG descargado no
necesitan fuentes instaladas, canvas, servicios externos ni fuentes incrustadas:
la descarga contiene directamente los contornos. Se mantiene el formato de
perfil y las 44 combinaciones de decoración/acabado. Las pruebas verifican
rotulación sin `<text>` en el casco y nombre/dorsal vectoriales en la exportación.
