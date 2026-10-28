# Carteles de frenada sujetos a la valla

Los circuitos urbanos y semiurbanos de Australia, Miami, Canadá, Mónaco,
Madrid, Azerbaiyán, Singapur y Las Vegas usan placas verticales blancas de
0,58 m de ancho, hasta 1,70 m de alto, con cifras apiladas (200, 150,
100 o 50; el 100 usa fondo turquesa y cifras blancas, como la referencia) y cuatro grapas metálicas. No tienen banda roja ni postes al suelo.
La altura se adapta al tramo vertical de la valla y parte de la coronación del
muro. **Uno de los bordes verticales se fija a la valla** (separación visual de
1 cm) y la placa estrecha sobresale 0,58 m **perpendicularmente a la valla**, hacia
la pista. La cara de los números mira hacia los coches que se aproximan en el
sentido de carrera, tanto a derecha como a izquierda y aunque el segmento SVG
esté definido con sus extremos en orden inverso.

El anclaje se calcula una vez por cartel y circuito. Busca el segmento de valla
SVG del mismo lado y del entorno longitudinal del cartel, interpola su altura
y utiliza la **normal real de ese segmento** para orientar la placa. La
dirección del segmento se conserva sólo para localizar y anclar la valla. Si sólo existe una valla del ribbon, utiliza esa geometría.
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
  geometría perpendicular, borde lateral junto a la valla, cara mirando al
  tráfico que se aproxima desde ambos lados, dimensiones, cifras, caché y
  circuitos permanentes.
- `node apex/tests/urban-distance-boards-browser.cjs` con HTTP en :8765:
  Madrid SVG, Mónaco, Monza, orientación y aproximación en WebGL y Canvas.
  `APEX_AUDIT_DEVICE=mobile` activa emulación móvil.
