# Carteles de frenada sujetos a la valla

Los circuitos urbanos y semiurbanos de Australia, Miami, Canadá, Mónaco,
Madrid, Azerbaiyán, Singapur y Las Vegas usan placas verticales blancas de
0,58 m de ancho, hasta 1,70 m de alto, con cifras apiladas (200, 150,
100 o 50; el 100 usa fondo turquesa y cifras blancas, como la referencia) y cuatro grapas metálicas. No tienen banda roja ni postes al suelo.
La altura se adapta al tramo vertical de la valla y parte de la coronación del
muro; el cartel queda 10 cm hacia pista para evitar interferencias con la malla.

El anclaje se calcula una vez por cartel y circuito. Busca el segmento de valla
SVG del mismo lado y del entorno longitudinal del cartel, interpola su altura
y sigue su dirección. Si sólo existe una valla del ribbon, utiliza esa geometría.
Si no existe valla mantiene el cartel independiente, sin inventar un soporte.
Se conservan las distancias, lado y curva de referencia de cada definición,
incluidos los carteles importados y el borrado autoritativo en SVG.

La decoración CITY/NIGHT por sí sola no altera los carteles de circuitos
permanentes como Shanghai, México, Lusail o Yas Marina. El JSON puede indicar
`walls.distanceBoardMount: "FENCE"` o `"POSTS"` para elegir explícitamente.
Los circuitos personalizados sin identificador de calendario pueden utilizar
su familia URBAN/NIGHT como valor inicial.

WebGL y Canvas comparten los polígonos vectoriales de placa, cifras y grapas.
En WebGL cada vértice conserva su profundidad en el mundo; cifras y marco usan
un sesgo estable. No se añaden texturas, fuentes, recursos GPU ni draw calls.
Los polígonos de pintura y los anclajes se reutilizan, con culling de distancia
y de tamaño en pantalla adaptado al formato estrecho.

Pruebas:

- `node apex/tests/urban-distance-boards.cjs`: anclajes SVG/procedurales,
  dimensiones, cifras, caché y circuitos permanentes.
- `node apex/tests/urban-distance-boards-browser.cjs` con HTTP en :8765:
  Madrid SVG, Mónaco, Monza, aproximación en WebGL y Canvas.
  `APEX_AUDIT_DEVICE=mobile` activa emulación móvil.
