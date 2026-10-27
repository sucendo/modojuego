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
