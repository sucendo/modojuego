HEXATEGOS 0.35.6 · INFRAESTRUCTURA COMBINADA + DESARROLLO IA

Base:
- HEXATEGOS 0.35.5 Atlas sin barrios + nombres históricos.
- HEXATEGOS 0.35.4 Capitales navegables + ciudades reales.
- HEXATEGOS 0.35.3 Paneles Movibles.

Novedades 0.35.6:

1. CAPITAL HISTÓRICA
- Se conserva como dato estratégico para nacionalismo, recuperación y traslado de capital.
- Ya no se dibuja una segunda estrella sobre el mapa cuando no coincide con la capital actual.

2. CIUDAD + INDUSTRIA + PUERTO
- Una misma celda puede mostrar simultáneamente ciudad, industria y puerto.
- Con zoom pequeño la ciudad prevalece para mantener la lectura del mapa.
- Con zoom medio/alto los iconos se separan alrededor del centro del hexágono para evitar solapes.
- Las ciudades empiezan a verse antes al alejar el mapa.

3. DESARROLLO DE LAS NACIONES IA
- Los objetivos físicos dejan de tener el antiguo techo de 11 ciudades y 10 industrias.
- Ciudades, industrias, carreteras y puertos escalan con la raíz del tamaño territorial.
- Una nación de alrededor de 1.000 territorios tiende aproximadamente a 33 ciudades, 23 industrias, 24 corredores y hasta 7 puertos antes de modificadores de personalidad.
- Las personalidades crecimiento, naval, defensiva y agresiva conservan modificadores propios.
- Las fortificaciones dejan de ser un destino automático del excedente económico cuando la nación todavía tiene déficits urbanos o industriales importantes.
- Las defensas siguen teniendo prioridad cuando la capital está amenazada o existe un cerco.

4. PARTIDAS YA EMPEZADAS
- No cambia el schema de guardado.
- Al cargar una campaña existente se invalidan los planes nacionales/regionales de desarrollo para recalcularlos con los nuevos objetivos.
- No se regenera territorio, ciudades ni infraestructuras existentes.

5. PRUEBAS
- Nuevo smoke test tests/smoke-0356.mjs.
- GitHub Actions ejecuta también la comprobación 0.35.6.

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
- Atlas offline base de 140.607 registros.
- Fuente: GeoNames cities1000, a través del snapshot público w3c/cities.
- Se excluyen 5.428 registros PPLX (secciones/barrios de núcleos de población), quedando 135.179 propuestas utilizables.
- Datos base conservados: nombre, latitud, longitud, población y país. La población se usa internamente para ordenar propuestas, pero ya no se muestra en el selector.
- Datos divididos en 12 franjas de 30° de longitud.
- Dentro de cada franja hay un índice por teselas de 1°.
- Los datos no se cargan en el arranque: se descargan bajo demanda y se cachean.

3. NOMBRE REAL AL CONSTRUIR CIUDAD
- Al crear una nueva ciudad se consulta el atlas.
- Se comprueba geométricamente si una localidad real cae dentro del hexágono/pentágono seleccionado.
- Si existen varias, se muestran hasta seis propuestas.
- Los barrios/distritos PPLX nunca se proponen como ciudades.
- Se priorizan internamente las localidades más pobladas dentro del mismo hexágono, sin mostrar la cifra de población.
- Si existe información histórica conservadora para la localidad, se muestra una secuencia breve de nombres anteriores.
- Si no hay ninguna localidad del atlas dentro del hexágono, se muestran localidades reales cercanas indicando la distancia.
- El jugador puede construir sin asignar nombre real y seguir usando el sistema de renombrado existente.
- Las mejoras de una ciudad ya construida conservan su nombre.

4. INTERFAZ
- El selector de localidad utiliza el modal común.
- Ese modal se registra en HexategosMovablePanels0353, por lo que puede reposicionarse.
- La clasificación conserva su aspecto anterior; cada fila actúa como enlace a la capital actual de la nación.

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
