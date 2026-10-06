HEXATEGOS 0.35.4 · CAPITALES NAVEGABLES + CIUDADES REALES

Base:
- HEXATEGOS 0.35.3 Paneles Movibles.
- HEXATEGOS 0.35.2 Mapa Geopolítico.
- HEXATEGOS 0.35.0 Doctrina Geopolítica.

Novedades 0.35.4:

1. CLASIFICACIÓN NAVEGABLE
- Cada fila de nación de la clasificación se puede pulsar.
- Al pulsarla, el globo gira hasta la capital actual de esa nación.
- Se aplica un zoom adecuado para situarse sobre la capital.
- La capital queda seleccionada y el modo Geopolítica puede actualizar su foco.
- Las filas admiten teclado (Enter / Espacio).

2. ATLAS DE LOCALIDADES REALES
- Atlas offline de 140.607 localidades.
- Fuente: GeoNames cities1000, a través del snapshot público w3c/cities.
- Datos conservados: nombre, latitud, longitud, población y país.
- Datos divididos en 12 franjas de 30° de longitud.
- Dentro de cada franja hay un índice por teselas de 1°.
- Los datos no se cargan en el arranque: se descargan bajo demanda y se cachean.

3. NOMBRE REAL AL CONSTRUIR CIUDAD
- Al crear una nueva ciudad se consulta el atlas.
- Se comprueba geométricamente si una localidad real cae dentro del hexágono/pentágono seleccionado.
- Si existen varias, se muestran hasta seis propuestas.
- Se priorizan las localidades más pobladas dentro del mismo hexágono.
- Si no hay ninguna localidad del atlas dentro del hexágono, se muestran localidades reales cercanas indicando la distancia.
- El jugador puede construir sin asignar nombre real y seguir usando el sistema de renombrado existente.
- Las mejoras de una ciudad ya construida conservan su nombre.

4. INTERFAZ
- El selector de localidad utiliza el modal común.
- Ese modal se registra en HexategosMovablePanels0353, por lo que puede reposicionarse.
- La clasificación muestra visualmente que una fila permite navegar a su capital.

FUENTE Y LICENCIA
- GeoNames: CC BY 4.0.
- Atribución incluida en data/cities-0354/ATTRIBUTION.txt.
- El snapshot utilizado se transforma a un formato compacto específico de HEXATEGOS.
- Una localidad cercana nunca se presenta como si estuviera dentro del hexágono: ambas situaciones se distinguen expresamente.

DIAGNÓSTICO
- HexategosRealCities0354.suggest(cell)
- HexategosRealCities0354.focusCapital(faction)
- HexategosRealCities0354.validate()
- HexategosRealCities0354.cachedBands()

Ramas estables:
- hexategos-stable-0.33-r8
- hexategos-stable-0.34.2
- hexategos-stable-0.35.1
- hexategos-stable-0.35.2
- hexategos-stable-0.35.3
