HEXATEGOS 0.35.9 · ENTIDADES POLÍTICAS UNIVERSALES

Objetivo:
- El jugador no distingue categorías técnicas de nación.
- Todas las entidades visibles pueden relacionarse, guerrear, comerciar, pactar y desarrollar economía e infraestructura.
- La diferencia entre unas y otras reside únicamente en la estrategia y frecuencia de decisión de su IA.

Integración:
- Diplomacia completa del jugador con entidades dinámicas.
- Economía, tropas, ciudades, industria, puertos y fortificaciones propias.
- Conquista bidireccional jugador ↔ entidades dinámicas.
- Comercio integrado en los ingresos del jugador.
- Infraestructura dibujada con la misma familia visual del juego.
- Persistencia local y en archivos .hexategos.

Rendimiento:
- Snapshot territorial compartido cada 10 s de campaña.
- Muestras limitadas a 24 celdas por entidad para desarrollo y decisiones.
- IA escalonada: solo 1/4 de las entidades revisa decisiones en cada pasada.
- Sin una matriz diplomática global adicional de cientos × cientos.
- La capa territorial compacta de 0.35.8 se conserva como almacenamiento eficiente, pero deja de limitar las capacidades visibles.

HEXATEGOS 0.35.8 · ENTIDADES POLÍTICAS UNIFICADAS

Cambios sobre 0.35.7:
- Las entidades adicionales aparecen en la misma clasificación que el resto de naciones.
- La clasificación no muestra si una nación pertenece a una categoría interna u otra.
- Los nombres visibles dejan de usar prefijos como Pueblo, Comunidad, Estado menor o Estado regional.
- Las capitales usan el mismo símbolo visual que las demás naciones.
- El color político usa el mismo tratamiento gráfico que las naciones completas.
- Se elimina de Sistemas → Intel cualquier bloque que revele la jerarquía interna.
- El selector vuelve a llamarse simplemente NACIONES.
- En partidas antiguas se fuerza un arranque territorial en pequeños bloques incluso si la partida carga en pausa, para que las nuevas entidades sean visibles desde el principio sin congelar el navegador.
- La clasificación permite pulsar también cualquiera de estas naciones para centrar el mapa en su capital.
- El objetivo global sigue siendo ≈97,5 % de tierra ocupada tras unos 5 minutos de simulación desde que la capa se activa.

HEXATEGOS 0.35.7 · IA JERÁRQUICA + MOSAICO POLÍTICO

Base:
- HEXATEGOS 0.35.6 Infraestructura combinada + desarrollo IA.
- HEXATEGOS 0.35.5 Atlas sin barrios + nombres históricos.

Novedades 0.35.7:

1. NACIONES PRINCIPALES
- Las 16/25/35/50 plazas configurables siguen reservadas a IA completa.
- No se aumenta la matriz diplomática ni el coste O(N²) de la geopolítica.
- El selector se aclara como «NACIONES PRINCIPALES».

2. ENTIDADES POLÍTICAS SECUNDARIAS
- Nueva capa independiente para rellenar los espacios neutrales.
- Tipos disponibles: Pueblo, Ciudad-Estado, Estado menor y Estado regional.
- Cantidad variable aproximada: 105–245 según escala y semilla de la partida.
- Cada entidad recibe una personalidad: conformista, comercial, defensiva, oportunista o localista.
- El tipo y la personalidad alteran su facilidad de expansión y, por tanto, el tamaño final emergente.

3. OCUPACIÓN DEL PLANETA
- La densidad política objetivo crece con el tiempo de campaña.
- A los 300 segundos el objetivo es aproximadamente 97,5 % de tierra ocupada entre naciones principales y entidades menores.
- Las entidades menores solo ocupan terreno neutral: nunca pisan una casilla ya propiedad de una nación principal.
- Si una nación principal conquista una casilla con entidad menor, la nación principal prevalece automáticamente.

4. RENDIMIENTO
- Int16Array para propiedad secundaria: ~1 MB con la malla actual.
- Int32Array para la cola de expansión: ~2 MB.
- Cero matrices diplomáticas nuevas y cero IA táctica individual por pueblo.
- La expansión reutiliza economyTick3212; no añade setInterval ni un nuevo reloj periódico.
- Presupuesto máximo de 4.200 reclamaciones por tick para evitar picos de CPU.
- Render político: una consulta O(1) al array secundario por celda ya visible.
- Los nombres/capitales secundarios proyectan solo unas centenas de puntos y únicamente con zoom cercano.

5. PARTIDAS EXISTENTES Y GUARDADO
- Compatible con campañas ya empezadas.
- Los metadatos de entidades menores se guardan de forma compacta.
- Los archivos portables incluyen semilla, capitales menores, tipo, nombre, color y personalidad; no se serializa el mapa completo de cientos de miles de celdas.
- Al cargar, el mosaico se reconstruye determinísticamente alrededor del territorio principal existente.

6. DIAGNÓSTICO
- HexategosMinorPolities0357.stats()
- HexategosMinorPolities0357.entityAt(cell)
- HexategosMinorPolities0357.entities()
- Sistemas → Intel muestra cantidad, tipos y porcentaje de ocupación.

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
