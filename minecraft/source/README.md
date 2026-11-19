# Minecraft.js v11.4.7 — Puentes, túneles y equilibrio hidráulico

- Las piezas colocadas por encima del agua dejan de elevar el fondo del río:
  ahora un puente o una cubierta conserva el cauce inferior.
- Los muros solo actúan como presas cuando cierran físicamente el paso; al
  excavar la base de una pared se puede abrir un túnel de agua.
- La presión del embalse respeta la cara inferior de las cubiertas y evita
  representar agua dentro de los bloques sólidos.
- Los caudales evacuados al mar no elevan la cota global fija del océano.
- Filtración leve según material y evaporación de agua embalsada expuesta;
  todas las pérdidas del nuevo cálculo se contabilizan explícitamente.
- Se conserva el volumen cuando la simulación alcanza el límite de celdas.
- Nuevas pruebas de regresión para techos, muros, canales, desembocaduras y
  límites de almacenamiento. Se mantienen las partidas guardadas v11.4.6.

## Versión anterior

# Minecraft.js v11.4.6 — Acumulación hidráulica y desagües

- **El agua se embalsa con el tiempo.** Al levantar una presa se activa una
  simulación local que almacena volumen adicional detrás del obstáculo.
  El nivel sube paulatinamente y puede superar el borde de una orilla.
- **Las nuevas zanjas son salidas reales.** El volumen se traslada entre
  columnas en función de su altura y puede pasar por un hueco lateral recién
  excavado. La transferencia conserva agua: el caudal no se multiplica.
- **Desbordamiento y desagüe.** Si el nivel supera la cresta, parte del agua
  puede desbordar por arriba. El exceso que vuelve al cauce inferior sale
  del embalse local mediante un desagüe contabilizado.
- **Solo trabaja cerca de cambios del terreno.** El cálculo se limita a
  regiones activas y dos pasos breves por fotograma. El mundo original no
  realiza simulaciones completas cuando el jugador simplemente se desplaza.
- **Partidas anteriores.** Se conservan las correcciones del hielo, los
  bloques existentes y la hidrografía inicial. Se guardan volúmenes, puntos
  de alimentación y desagües de los embalses activos.
- **Límites conocidos.** Es un modelo hidráulico de columnas simplificado;
  no simula turbulencia tridimensional ni presión dentro de tuberías cerradas.

---

# Minecraft.js v11.4.5 — Presas, desvíos de ríos e hielo interactivo

- **El agua cambia de curso al modificar el terreno.** Tras colocar una presa,
  el tramo del río que pierde conexión con el agua que llega de aguas arriba
  deja de mostrarse como una fuente independiente. Abrir un paso alternativo
  permite recuperar los tramos conectados.
- **Manantiales y lagos permanentes.** Una cascada no consume un depósito
  limitado; el agua que llega desde su origen sigue suministrando el cauce.
  La reconstrucción de los cauces modificados es local y se calcula cuando
  el jugador cambia bloques, para mantener el rendimiento.
- **Hielo exactamente en el vóxel visible.** El pico, la selección y la
  colocación sobre una placa de hielo comparten ahora la misma altura.
- **Partidas anteriores.** Las eliminaciones antiguas de hielo se migran a
  su nueva coordenada al cargar ese terreno; las obstrucciones y desvíos se
  guardan junto con el resto del estado hídrico.
- **Pruebas de regresión.** Incluyen cortar y reabrir un río, derivar agua
  por una zanja, guardar el tramo seco y excavar/edificar sobre hielo.

---

# Minecraft.js v11.4.4 — Cascadas orientadas y agua continua

Esta actualización corrige los artefactos observados en el vídeo del 19 de
noviembre sin modificar el mapa natural ni agotar las fuentes permanentes:

- **Cascadas solo aguas abajo.** El salto largo entre dos columnas de río
  aparece únicamente en el sentido de circulación del cauce; los desniveles
  laterales muestran una pared corta de un bloque de agua, no cortinas enormes.
- **Lagos visualmente unidos.** Los bloques contiguos de igual altura y tipo
  comparten rectángulos de superficie, con un tinte uniforme. Se reducen los
  vértices y las superposiciones que marcaban cuadrículas y diagonales.
- **Transparencia en una pasada.** Se evita la doble representación de las
  caras transparentes de la misma superficie, manteniendo la vista submarina.
- **Desbordamientos activados por excavación.** Un cambio de bloque no
  provoca que todas las orillas bajas del entorno empiecen a inundarse. El
  flujo sale por un hueco realmente excavado y se propaga desde él.
- **Ocho niveles reales.** Los cambios físicos de 1/8 de bloque se representan
  con esa misma precisión, sin redondearlos a saltos de 1/4.
- **Compatibilidad.** Se conservan orografía, bloques, partidas y manantiales.
  Las regiones previamente descubiertas no se regeneran.

---

# Minecraft.js v11.4.3 — Fuentes permanentes y agua por niveles

Esta entrega cambia el comportamiento del agua natural cuando el jugador
modifica bloques, sin alterar la generación ni la orografía del mundo:

- **Ríos, lagos y cascadas inagotables.** La hidrografía generada es un mapa
  de fuentes permanentes: no se transfiere a la simulación de volumen finito
  ni se evapora al abrir una orilla. El punto original del manantial sigue
  marcado en azul oscuro solo con `?waterDebug=1`.
- **Propagación local por ocho niveles.** Al quitar o colocar un bloque junto
  al agua, esta ocupa el hueco accesible, pierde altura al extenderse por
  suelo plano y recupera la altura de un cubo al descender. Se recalcula
  inmediatamente, sin tiempos de espera ni pequeñas piezas individuales.
- **Presas y construcciones.** Un bloque sólido que ocupe un manantial puede
  interrumpirlo; retirarlo restaura su suministro. Un tejado alto sobre un
  río no desplaza el agua hacia arriba ni elimina el cauce inferior.
- **Partidas anteriores.** Se conserva el terreno, los bloques editados y
  las regiones exploradas. Las viejas celdas físicas transitorias no se
  reactivan en mundos con hidrografía estable; los nuevos desbordamientos
  locales se incluyen en exportaciones y partidas guardadas.
- **Rendimiento.** Las actualizaciones ocurren solo después de un cambio de
  bloque, en una región acotada. El agua natural no realiza pasos de física
  en cada fotograma.

---

# Minecraft.js v11.4.2 — Lagos nivelados, cascadas y afluentes conectados

Esta revisión continúa la hidrografía de **terreno aún no descubierto**:

- **Lagunas con superficie uniforme.** Los lagos de cuenca cerrada tienen
  una sola cota horizontal, apoyada sobre un lecho tallado en tierra. La
  superficie del lago coincide con la del último bloque del río entrante:
  se ha eliminado el antiguo escalón de agua que subía 1 m al desembocar.
- **Más conexiones fluviales.** Los ríos suficientemente largos pueden
  recibir dos afluentes independientes, con posiciones reproducibles. Cada
  afluente llega a un bloque real del cauce principal sin remontarlo, y el
  ancho del río aumenta únicamente desde el punto de confluencia.
- **Cascadas continuas.** En desniveles de dos o más bloques se representa
  una caída visual vertical hasta el siguiente curso de agua. El agua en
  el mundo sigue formada por cubos completos, asentados sobre tierra; la
  cascada se representa con una cara vertical coloreada y animada, sin añadir
  agua física en el aire ni pendientes triangulares.
- **Orografía protegida.** Los afluentes no atraviesan montañas creando
  trincheras artificiales. La erosión de las orillas es gradual y el cauce
  no se modifica al acercarse o cargar nuevas regiones.
- **Mapa de diagnóstico.** Con `?waterDebug=1` y tecla `M`, los puntos blancos
  señalan saltos de agua; se mantienen los manantiales oscuros, flechas de
  descenso, salidas al mar, confluencias y lagunas.
- **Compatibilidad de partidas v11.4.1 y anteriores.** El generador v11.4.2
  se aplica solamente a zonas vírgenes; las ya visitadas conservan sus
  versiones de hidrografía, su transición original con los terrenos antiguos,
  las construcciones, los cambios manuales y los datos guardados.

**Alcance:** los cursos de agua siguen siendo cuencas locales generadas
de manera determinista, no una simulación hidráulica en tiempo real. La
redistribución física se activa tras cambios realizados por el jugador.

---

# Minecraft.js v11.4.1 — Red de ríos, afluentes y relieve coherente

Esta fase desarrolla la hidrografía de las **zonas todavía no descubiertas**
y conserva los terrenos explorados con su generador original:

- **Cauces definidos antes de llegar.** Cada río nace en un manantial
  reproducible, busca descensos en el terreno y termina en el mar o en una
  depresión real. Cuando hay un obstáculo suave puede tallarse un pequeño
  paso, pero la superficie del agua nunca remonta una montaña.
- **Afluentes y anchura variable.** Se generan cabeceras laterales que
  desembocan en un río principal; los tramos bajos y los situados después de
  una confluencia son más anchos. La red no se modifica cuando se cargan
  otras zonas o aparece otro curso de agua en el horizonte.
- **Orillas más integradas en el relieve.** El terreno alrededor del cauce
  se degrada gradualmente hacia el lecho, con una anchura adaptable al desnivel.
  Agua y hielo siguen siendo cubos completos apoyados en bloques sólidos.
- **Cartografía de desarrollo.** Abre el juego con `?waterDebug=1` y pulsa
  `M`: los manantiales se señalan en azul oscuro, los trazos indican el cauce,
  las flechas la dirección del descenso y los puntos de colores representan
  desembocaduras en mar, confluencias, lagunas y límites de recorrido. El mapa
  normal mantiene los manantiales reales sin mostrar la red de diagnóstico.
- **Partidas existentes protegidas.** Al abrir v11.4.0 se congelan también
  las zonas conocidas que usaban el primer generador de ríos; sus construcciones,
  ediciones, aguas, exploración, tiempo y progreso no se reconstruyen. Solo las
  áreas vírgenes usan v11.4.1. Las anteriores versiones siguen migrando.

**Nota:** se trata de un drenaje local, no del cálculo de una cuenca fluvial
continental. El motor físico solo redistribuye agua después de una intervención
del jugador; los cursos naturales llegan ya distribuidos.

---

# Minecraft.js v11.4.0 — Cuencas naturales, manantiales y agua ya distribuida

**Actualización de hidrografía para terrenos aún no explorados.** El agua natural
no se calcula al llegar el jugador, sino durante la generación determinista del
mundo: los ríos empiezan en manantiales identificables, buscan los vecinos de
menor altura, tallan cauces sobre el relieve y concluyen en pequeñas lagunas si
no existe una continuación descendente. Nunca se crea un río porque la cámara
se acerque al terreno.

- **Sin inundación por proximidad.** El agua natural es estable desde que
  aparece; el motor de redistribución solo se despierta después de un cambio
  real de bloques cerca de ella y su actividad se detiene tras 30 s. Los
  mundos anteriores que se migren dejan de redistribuir agua espontáneamente
  incluso dentro del terreno ya visitado.
- **Cubos completos, pegados al fondo.** Cada bloque natural de río ocupa
  exactamente un volumen de 1×1×1 sobre un lecho de tierra. Las superficies
  son planas y las paredes verticales; se unifica el color de los vértices de
  cada cara para evitar diagonales visibles. Los lagos tranquilos conservan el
  hielo cúbico en zonas frías.
- **Sin multiplicación visual.** Si el jugador cambia el cauce, el agua
  simulada conserva su cantidad y el relleno visible se cuantiza a cuartos
  de altura (por ejemplo, 0,25 no se dibuja como un cubo completo). **No se
  crean 64 objetos por cada bloque**, lo que mantendría un coste de renderizado
  innecesario.
- **Manantiales identificados para desarrollo.** Añade `?waterDebug=1` a la
  dirección del juego para resaltar el bloque fuente en azul oscuro tanto en
  la escena como en el mapa. Sin ese parámetro se usa el color natural.
- **Compatibilidad con partidas.** La migración automática de una partida
  v11.3.5 (o anterior) conserva las construcciones, edición de bloques,
  progreso, zonas exploradas y el terreno protegido existente. Las áreas
  inexploradas pasan al generador nuevo con un borde de transición, sin
  necesitar reiniciar ni perder la partida. Los ríos de áreas ya conocidas
  mantienen su trazado anterior.
- **Todos los tipos de mundo.** Los terrenos no volcánicos usan la red de
  drenaje; el mundo de lava conserva su generador previo. El mapa y el terreno
  lejano usan las mismas muestras del cauce que los bloques 3D.

Estas cuencas son **locales y deterministas**, no una simulación hidrológica
global de cientos de kilómetros. Las corrientes avanzan hacia cotas iguales
o inferiores; una depresión puede formar una laguna sin desembocar al mar.
El sistema dinámico se activa al editar y no pretende simular océanos completos.

---

# Minecraft.js v11.3.5 — El agua fluye sola, con gravedad y cubos completos

Esta versión corrige una decisión equivocada de v11.3.4: el agua natural había
quedado inmóvil hasta que el jugador modificase algún bloque. **Ahora se
distribuye automáticamente** cuando el jugador se acerca a un río o lago, y
continúa cambiando aunque se quede quieto.

- La observación del agua activa las columnas que ya existían de forma
  procedimental y sus bancos inmediatos, sin inyectar agua extra. El lecho
  sigue medido sobre tierra real (no sobre árboles), los ríos naturales se
  inicializan con como máximo un cubo de volumen y el solver conserva la masa.
- El cálculo vuelve a observar periódicamente la zona (cada 2 segundos o
  tras desplazarse unos 5 bloques), para incluir nuevos sectores cargados,
  pero **no reinicia** los caudales activos ni duplica su agua.
- La física avanza por sí sola mientras existe agua activa, aunque nadie
  cave, coloque bloques ni se mueva. Las caras visibles siguen siendo cubos
  completos de 1×1×1, sin láminas inclinadas o medias alturas.
- Las modificaciones del jugador continúan alterando el cauce, las presas y
  la redistribución local. Se mantienen las protecciones del terreno explorado
  y la reconstrucción de zonas nuevas introducidas en v11.3.4.

Pruebas nuevas de v11.3.5: movimiento autónomo sin ediciones, continuidad
de la distribución con el jugador inmóvil y ausencia de subida artificial al
activarse un río bajo los árboles. **No equivale aún a una simulación global
de todas las cuencas**: el cálculo sigue limitado a los sectores activos.

---

# Minecraft.js v11.3.4 — Agua en cubos completos, sin subida al acercarse

Revisión independiente de v11.3.3 tras reproducir las cortinas y torres de agua
del río nevado. **No incluye natación.** El formato de partida y los bloques
construidos siguen siendo compatibles.

### Reglas de agua visibles

- Cada columna natural de **río** tiene exactamente **un cubo 1×1×1** encima
  de su lecho. No se dibujan medios bloques, pendientes diagonales ni agua
  suspendida. Los lagos pueden tener varios cubos apilados sobre el fondo.
- El agua dibuja solo la cara superior y las caras laterales realmente
  expuestas, cortadas contra el suelo o la columna de agua contigua. Se elimina
  la antigua lámina horizontal de agua que se superponía a las columnas.
- La congelación respeta el cubo completo: el hielo es un bloque de espesor
  completo, con geometría y colisión alineadas a la superficie.
- Acercarse, explorar o girar la cámara **ya no pone en marcha una simulación**.
  El agua estática se mantiene a su altura. La física local se activa al
  modificar bloques próximos al agua (romper un dique, cavar, construir).
- Una vez activada, la redistribución del agua reparte el caudal entre las
  salidas disponibles según su pendiente, sin favorecer una dirección por el
  orden interno de iteración. Sigue conservando el volumen computado.

### Mundo explorado frente a territorio nuevo

- Los **mundos nuevos** usan terreno híbrido `terrainVersion:6` con el nuevo
  generador v11.3.4 fuera de la zona de inicio. Los cauces nuevos regeneran
  el lecho de forma que el agua se apoya en él con exactamente un bloque de
  profundidad; los lagos tienen superficie alineada a la cuadrícula.
- Las **partidas anteriores** se actualizan conservando los bloques editados,
  las construcciones y los sectores explorados como área protegida. Las zonas
  sin explorar se generan con los cauces nuevos, con una transición de 96
  bloques en el límite protegido. No se borran construcciones.
- **Corrección necesaria de partidas antiguas:** el estado *temporal* de la
  simulación del agua v11.3.3 (`hydrology.version:1`) se reinicia una vez,
  porque almacenaba riadas artificiales al acercarse; de otro modo volverían
  las columnas absurdamente altas aunque la representación estuviese reparada.
  Esto **no elimina bloques, inventario, edificios ni exploración**, pero sí
  reinicia aguas embalsadas por simulaciones antiguas. Los estados de agua
  guardados a partir de esta versión (`hydrology.version:2`) sí se conservan.

### Verificación y límite actual

`npm test` ejecuta también los casos `hydrologyVoxelsV1134.test.mjs`
(cubo completo, costados, generador nuevo y protección de terreno), además de
las pruebas de guardado, continuidad entre chunks y conservación. Esta entrega
no sustituye todavía la hidrología regional por una simulación de cuencas
completas; el motor dinámico es local y se activa mediante obras del jugador.

---

# Minecraft.js v11.3.3 — Agua voxelizada, sin superficies triangulares flotantes

Revisión de la v11.3.2 sobre copia independiente. El comportamiento de
natación sigue excluido. Se conservan las partidas del formato existente.

### Qué causaba el agua que parecía subir al acercarse

El motor local de la v11.3.2 activaba las columnas al explorar y a veces
interpretaba **un tronco o construcción por encima del río como si fuese el
lecho**. Al colocar encima el volumen líquido inicial, provocaba súbitas
columnas altas junto a los árboles. Ahora la altura procede de los bloques
del terreno que contienen el cauce. Se ignoran troncos y hojas, y una columna
tapada por una construcción no vuelve a llenarse por encima automáticamente.

Además, el suavizado de esquinas había formado cuadriláteros inclinados que,
al dibujarse con dos triángulos transparentes, parecían láminas flotantes.

### Cómo se dibuja ahora

- Cada casilla de agua ocupa **exactamente 1×1 bloques en horizontal**, con
  sus cuatro vértices superiores a la misma altura, sin pendientes diagonales.
- Cuando dos casillas tienen niveles diferentes, se dibuja un escalón
  **vertical y recto**. Solo las diferencias mayores de 1,05 bloques se
  consideran cascadas animadas.
- Se mantiene el hielo completo de la v11.3.2 (1×1×1 hacia abajo) y el
  recorte de caras de agua ocultas por las orillas de tierra.
- La física sigue conservando los volúmenes y la filtración subterránea; no
  se cambia el generador de relieve ni se altera el formato de guardado.

### Límites actuales

No hemos sustituido todavía el motor regional de cuencas: una corriente
procedimental puede reequilibrarse al entrar en simulación activa, aunque
ya no debería elevarse por confundir árboles con lechos. La verificación
visual en la partida concreta de la captura sigue siendo recomendable.

Regresión adicional: `tests/hydrologyVoxelV1133.test.mjs` (tronco sobre río,
suelo con y sin caché, barrera superior y superficies cuadradas).

---

# Minecraft.js v11.3.2 — Cauces continuos, hielo completo y orillas corregidas

Revisión conservadora de **v11.3.1**, con la simulación hidrológica aún en fase
experimental. **No incluye natación**. Se entrega como versión independiente;
las partidas guardadas y los tipos de terreno anteriores siguen siendo válidos.

### Ajustes visibles y de rendimiento

- **Agua continua en pendientes suaves:** las esquinas de la superficie se
  suavizan entre columnas del mismo cauce; los pequeños cambios de cota ya no
  producen cortinas verticales. Solo una diferencia de al menos 1,05 bloques
  se representa como cascada, con caída estrictamente vertical.
- **Orillas sin paredes fantasma:** se comprueba la altura real del suelo
  contiguo. No se dibuja un muro transparente de agua contra una orilla sólida;
  los laterales auténticamente expuestos se recortan a su profundidad útil.
- **Hielo de bloque entero:** cada placa natural ocupa 1×1 bloques de superficie
  y **un bloque completo de espesor**, colocado hacia abajo desde el nivel de
  agua. Su colisión coincide con su geometría. Las cascadas y corrientes de río
  no se congelan; únicamente las masas de agua calma en las zonas frías.
- **Menos reconstrucciones de mallas:** se acumulan variaciones inferiores a
  0,035 bloques y solo se vuelve a generar la geometría cuando el cambio ya
  es visible, la superficie desaparece/aparece o cambia su tipo.
- **Coloración de las riberas:** el antiguo generador pintaba un corredor
  adicional de hasta seis bloques alrededor de los ríos con piedra o arena.
  Ahora se conserva el material de superficie del bioma donde no haya habido
  una excavación real del terreno.

### Por qué cambia tanto el terreno junto a los ríos

La forma del río **ya estaba tallada por el generador**: además del cauce,
modifica el relieve en una transición lateral de hasta seis bloques, con
lechos unos dos bloques bajo el agua y bordes que pueden ser mucho más altos.
Cuando la simulación redistribuye el agua, queda a la vista ese lecho excavado,
que puede parecer que el terreno está cambiando. El agua no altera la tierra
por sí sola.

**Compatibilidad:** esta revisión no modifica las cotas del cauce generadas
para las partidas ya existentes. Rehacer la pendiente natural de las orillas
debe ser una evolución versionada del generador para no desplazar construcciones
ni terrenos guardados. Se corrigen ahora la representación y los materiales.

### Pruebas de regresión

El archivo `tests/hydrologyScenarioV1132.test.mjs` comprueba balsa elevada,
canal inferior, presa cerrada/abierta, conservación de volumen, juntas entre
superficies, cascadas verticales, paredes ocultas, hielo completo y limitación
de refrescos de agua. Ejecutar todas las pruebas con `npm test`.

### Limitación conocida

El motor sigue calculando solo una zona local con un número limitado de
columnas. Las fuentes son puntuales, la infiltración pasa al acuífero y las
regiones aún no cargadas no actúan como desagües. **No se garantiza todavía el
caudal constante de un río global a largo plazo**; eso requerirá conectar
fuentes, tramos y sumideros en un modelo regional de cuenca. Este ajuste mejora
la apariencia y el rendimiento, sin fingir que la hidráulica global está lista.

---

# Minecraft.js v11.3.1 — Gravedad y propagación natural del agua

Actualización de la **v11.3.0 experimental**, que se conserva como copia
independiente. Se mantiene la base v11.2.2 y **no se recupera la natación**.

- **Activación al explorar:** acercarse a una balsa, río o lago activa la
  simulación local aunque no se rompa ni coloque ningún bloque.
- **Gravedad visible:** el motor redistribuye el agua de los niveles altos a
  los bajos, y extiende el frente hacia columnas secas o excavadas. Se han
  aumentado los caudales de transporte, con límite en el volumen disponible.
- **Continuidad entre chunks cargados:** el agua puede cruzar la frontera
  de dos zonas de 32×32 bloques. Cuando llega a un lugar seco en otra zona,
  la superficie y sus cortinas de caída se vuelven a dibujar allí.
- **Sin desapariciones invisibles:** los bordes todavía no cargados quedan
  cerrados temporalmente. El líquido espera hasta que exista una zona vecina
  cargada donde calcular su movimiento. El contador de entradas/salidas
  mantiene trazabilidad y los guardados v15 siguen siendo compatibles.
- **Límite de simulación:** se sigue utilizando un máximo de 8192 columnas
  activadas para proteger el rendimiento. No equivale a una simulación física
  global de todos los ríos del mundo: fuera de las zonas recorridas se muestra
  el agua procedimental; el motor se activa al aproximarse.

### Cómo probar los cambios

1. Carga un mundo y acércate a un río elevado, **sin editar bloques**.
2. Espera unos segundos para ver cómo empieza a extenderse hacia los terrenos
   bajos accesibles. Comprueba la continuidad al pasar entre chunks.
3. Abre o cierra un desagüe con bloques: la corriente debe adaptarse a la nueva
   altura y conservar el agua, excepto la evaporación y filtración declaradas.
4. Guarda la partida y vuelve a cargarla para verificar que el cauce y las
   modificaciones no se pierden.

---

# Minecraft.js v11.3.0 — Primer motor de hidrología dinámica (experimental)

Esta versión parte de la **v11.2.2**, sin recuperar la natación de la antigua
rama v11.3. Conserva exactamente los tipos de mundo, los bloques construidos,
las cascadas, la lámina de hielo y la migración automática de zonas inexploradas.

## Lo que ya funciona

- **Puntos de manantial reales:** el mapa muestra posiciones deterministas y
  caudal en m³/s. Solo esas posiciones aportan agua nueva; un tramo de río
  transfiere el agua que recibe, nunca la multiplica.
- **Zonas modificadas por el jugador:** al colocar o retirar bloques junto a
  una superficie de agua, se activa una malla local de celdas hidrológicas.
  Cada celda tiene un volumen líquido y una cota física de lecho. El agua
  intenta redistribuirse por desnivel, rodear obstáculos y ocupar las áreas
  excavadas; una barrera elevada la retiene hasta que puede rebasarla.
- **Filtración diferenciada:** arena, tierra, roca y materiales de construcción
  tienen coeficientes distintos. El volumen filtrado se guarda en un acuífero
  simplificado, desde el que puede circular lateralmente y reaparecer si la
  reserva se satura. La evaporación se contabiliza aparte como pérdida real.
- **Contabilidad conservativa:** agua inicial + manantiales + entradas desde
  terreno aún no simulado − salidas − evaporación = agua superficial y freática
  almacenada. Existe un límite de profundidad local (24 bloques), cuyo
  excedente se registra como salida del dominio simulado.
- **Guardado e importación:** el formato v15 almacena las celdas activas y sus
  reservas con validación estricta. Al abrir una partida anterior sin estos
  datos se inicia el motor vacío, sin cambiar sus bloques ni mostrar permisos.
- **Rendimiento:** solo se simulan celdas en torno a cauces modificados (radio
  11 bloques por intervención, máximo 8192 celdas), dos pasos por segundo;
  las mallas de agua se actualizan agrupadas y limitadas en frecuencia.

## Alcance actual — importante

**Es una primera fase integrada, no el sistema global terminado.** Los cauces
fuera de zonas intervenidas siguen siendo el terreno hidrológico de la
v11.2.2. Los intercambios entre la zona activa y la parte aún no simulada se
registran como entradas/salidas de frontera, pero todavía no provocan cambios
visuales aguas arriba a kilómetros de distancia. El acuífero es una reserva
somera por columna, aún no una malla tridimensional de cavernas inundables.
Pendientes para las siguientes fases: continuidad global entre regiones,
presas y cuencas persistentes a escala de mundo, cavidades subterráneas con
nivel freático, lluvia/deshielo como entradas, evaporación dependiente del
clima, hielo dinámico y pruebas visuales con el navegador real.

### Prueba recomendada

1. Explora un cauce elevado y abre el mapa con `M` para ver manantiales y
   caudales presentes en el área (puntos azules `+`).
2. Construye una pequeña barrera transversal, dejando pasar un tiempo de
   simulación, y observa la acumulación en la zona modificada.
3. Retira bloques junto al agua y comprueba que puede extenderse localmente.
4. Guarda, sal y vuelve: el volumen superficial y el almacenamiento
   subterráneo deben conservarse sin volver a cargar la natación.

---

# Minecraft.js v11.2.2 — Cauces completos, cascadas verticales y hielo a nivel

Esta revisión parte exclusivamente de la **v11.2.1**. No incluye natación,
buceo ni oxígeno de la línea v11.3.

- **Ríos:** cada sección transversal usa una sola cota de agua, sin ajustarla
  individualmente a la altura de los bloques del borde. Los laterales visibles
  se cierran hasta el lecho, formando un volumen continuo de agua.
- **Cascadas:** las cortinas de cada desnivel están construidas con caras
  estrictamente verticales, desde el nivel superior hasta el inferior, sin
  inclinarse con el relieve. Mantienen la animación de flujo líquido.
- **Hielo:** las plataformas naturales se representan como una lámina de
  0,26 bloques de grosor que comienza en la superficie y crece **hacia abajo**.
  Las colisiones coinciden con esa lámina; siguen siendo transitables y
  rompibles. Los bloques mantienen las mismas coordenadas de guardado, de
  modo que los huecos rotos previamente siguen siendo compatibles.
- **Congelación:** se permite en aguas quietas y se excluye de todos los
  cauces de río con corriente; las caras de cascada siempre son agua líquida.
- **Rendimiento:** los nuevos laterales se añaden a las mismas mallas por tipo
  de agua y los hielos conservan su renderizado por instancias. No se añaden
  materiales independientes ni mallas individuales por bloque de agua.
- **Partidas:** mantiene el formato de guardado y la actualización automática
  de territorios inexplorados de la v11.2.1, sin alterar ediciones del jugador.

---

# Minecraft.js v11.2.1 — Generación automática en partidas antiguas

La v11.2.1 mantiene cascadas, lagos elevados e hielo rompible de la v11.2,
y aplica automáticamente esas novedades al explorar terrenos nuevos en
**cualquier partida antigua**. No aparece un botón ni una confirmación de
migración: sucede al cargar, abrir o importar la partida.

- Los chunks explorados, modificados, con estructuras guardadas o próximos al
  jugador/reaparición quedan registrados en una lista permanente inmutable.
- Cada zona registrada conserva el algoritmo con el que nació, incluso los
  mundos v10.1 que ya mezclaban dos generadores (original y v10).
- El relieve de los nuevos chunks se aproxima gradualmente a la geografía
  anterior en una franja de 96 bloques (3 chunks), y los ríos nuevos se
  introducen fuera de la unión. Las corrientes v11 antiguas enlazan con las
  nuevas sin perder de golpe su nivel de agua.
- El mapa y el LOD usan las mismas reglas. Los agujeros abiertos en el hielo
  siguen siendo ediciones persistentes. La migración se guarda **antes** de
  generar nuevos chunks; si falla la escritura, se abre el mundo original.
- Formato de guardado v14. Generador 5 para mundos nuevos, 6 para partidas
  antiguas migradas automáticamente. Sigue leyendo formatos anteriores.

**Límite histórico:** los guardados muy antiguos no registraban todas las
zonas recorridas y no es posible reconstruir visitas sin ningún rastro guardado.
Se protegen todas las zonas registradas, los cambios y una zona de seguridad
alrededor del jugador y de su punto de reaparición.

## Novedades de la v11.2

## Novedades

- **Ríos escalonados y cascadas:** las láminas de agua se enlazan verticalmente
  en los descensos del cauce. Las caras verticales se incluyen en el mismo
  mesh indexado y comparten los reflejos animados de la v11.1, sin aumentar las
  llamadas de dibujo por tipo de agua.
- **Continuidad entre chunks:** los desniveles de las fronteras se evalúan
  utilizando la misma semilla y las mismas coordenadas globales. Se asigna
  un único responsable de cada cara vertical para evitar duplicados.
- **Lagos elevados:** conservan su altura local; no se ven obligados a bajar
  hasta el nivel del mar. El mapa y el LOD consultan el nuevo muestreador.
- **Hielo sólido y parcial:** en mundos nevados y algunas masas de agua de
  gran altitud se forman placas de hielo contiguas y zonas descubiertas.
  Son bloques sólidos de ID 28: se puede caminar por encima y romperlos
  con la herramienta de minería. Bajo las placas está la superficie líquida.
- **Agujeros persistentes:** las modificaciones en el hielo se registran
  como cambios normales del mundo y se guardan/exportan junto al resto de
  construcciones. El hielo natural no da objetos al romperlo en supervivencia.
- **Compatibilidad:** formato de guardado v14 en la revisión 11.2.1; admite
  los formatos anteriores. El inventario incorpora hielo como bloque creativo opcional.

## Límites actuales

Los ríos y cascadas siguen siendo una representación visual determinista,
sin simulación de caudales ni corrientes físicas; la dirección exacta del flujo
no se resuelve todavía. El jugador puede romper el hielo y caer a la cuenca,
pero **flotabilidad, natación y oxígeno** quedan para la v11.3. Aún no hay
congelación/deshielo meteorológicos en tiempo real ni cascadas volumétricas
completas dentro de las cuevas. Es necesario comprobar los efectos en WebGL
y medir FPS reales en el navegador.

---

# Minecraft.js v11.1 — Agua con profundidad y movimiento suave

Esta fase mejora exclusivamente la representación del agua en las partidas
existentes y nuevas. No cambia la generación v11, el formato de las partidas ni
el sistema de LOD de hasta 18 chunks.

- **Profundidad:** los ríos y lagos muestran colores más claros cerca de las
  orillas y más profundos en el centro; océanos, oasis, hielo y lava tienen
  gamas propias. El tinte se calcula al generar cada malla, sin trabajo extra
  por fotograma.
- **Movimiento:** ondas de luz y pequeños reflejos se desplazan suavemente por
  las superficies. La lava tiene un pulso lento y el hielo permanece inmóvil.
  No hacen falta texturas externas ni una simulación física.
- **Transparencia:** las superficies líquidas permiten entrever el lecho y
  evitan escribir profundidad sobre los bloques. Las orillas incluyen un
  aclarado sutil sin añadir capas de espuma ni más llamadas de dibujo.
- **Rendimiento:** el reloj de animación es compartido por todos los chunks.
  En calidad baja (F3) las ondas se desactivan; en media son más discretas;
  en alta se ven completas. Se mantienen las mismas mallas agrupadas.
- **Compatibilidad:** mundos antiguos, mundos v11, inventarios, construcciones,
  mapa y archivos exportados/importados siguen funcionando sin migraciones.

**Pendiente de fases futuras:** nadar, empuje de corrientes, cascadas físicas,
líquidos en bloques editados y cambios volumétricos. Los efectos v11.1 son
visuales. Para validar visualmente los colores y FPS usa el navegador con WebGL.

---

# Minecraft.js v11.0 — Ríos, lagos y paisajes acuáticos

La v11.0 amplía la **v10.5.1** sin modificar los controles de construcción,
los mundos guardados, el ciclo día/noche ni el sistema de horizonte LOD de 18 chunks.

## Novedades de esta versión

- **Mundos nuevos:** la generación v11 (`terrainVersion:4`) incorpora ríos
  sinuosos, orillas y cuencas lacustres procedurales. Son reproducibles por
  semilla y se continúan entre chunks, incluso con coordenadas negativas.
- **Biomas:** selvas con más cauces, océanos con canales y lagunas, desiertos con
  oasis ocasionales, regiones de nieve con superficies de tono helado y mundos
  volcánicos con cuencas de lava. En clásico se mezclan ríos y lagos normales.
- **Mapa, terreno y LOD:** el mapa 2D, el suelo físico y las mallas lejanas
  consultan el mismo cálculo hidrográfico; los cauces se muestran a distancia.
- **Rendimiento:** un único mesh indexado por tipo de agua dentro de cada chunk
  cercano, sin generar cubos independientes para el agua. No se incrementa el
  radio de chunks físicos ni se altera el horizonte LOD configurable.
- **Partidas antiguas:** los mundos v1–v10.5.1 conservan su generador y sus
  construcciones. Para probar la nueva geografía se debe crear un mundo v11.
  Este primer lanzamiento no migra automáticamente las zonas inexploradas de
  mundos previos, ya que no existe un registro completo de cada chunk generado.
- **Guardado:** versión de formato 12, compatible con importaciones de
  partidas anteriores. Los controles de un solo botón y el inventario siguen
  funcionando igual.

### Límites conocidos

El agua y la lava de los ríos son **superficies visuales**: todavía no simulan
corrientes, natación, cascadas volumétricas, inundaciones ni congelación física.
Tampoco se sustituyen automáticamente los bloques colocados por el jugador al
editar la orilla. Estos sistemas están previstos para v11.1 y v11.2.

### Pruebas

Ejecuta `node --test tests/*.test.mjs` en la carpeta `minecraft` para las
pruebas de generación, continuidad, biomas y persistencia. Para jugar y medir
FPS reales hace falta instalar las dependencias (`npm install`) y lanzar
`npm run dev`. La validación visual en un navegador con WebGL es recomendable,
especialmente junto a riberas y límites entre niveles LOD.

---

# Minecraft.js v10.5.1 — Horizonte atmosférico y alcance experimental de 18 chunks

Esta entrega parte de **v10.5**. El LOD medio conserva su detalle y el LOD
lejano se integra gradualmente en el color del cielo mediante un shader **sin
mallas, partículas ni texturas adicionales**. La bruma solo afecta al relieve
LOD (suavemente en el intermedio, más en el lejano): **los bloques cercanos
siguen nítidos**. El cielo controla el color del efecto durante el día, la
noche, el amanecer, el atardecer y las tormentas. El mundo de nieve incorpora
un tinte más frío; desierto y volcánico, tonos acordes con sus atmósferas.

- En **F3 → Bruma del horizonte**: Automática (predeterminada), Desactivada,
  Suave, Natural o Intensa. Este ajuste se guarda en el navegador, no en la
  partida.
- **F3 → Horizonte LOD** admite ahora **18 chunks** como opción experimental
  de calidad alta. Se mantiene **12** por defecto y el ajuste adaptativo puede
  reducir el alcance si bajan los FPS. Radio 18 representa un cuadrado de
  aproximadamente **1184 × 1184 bloques**, sin cargar terreno voxel extra.
- El degradado comienza en el paisaje lejano y se funde progresivamente en el
  horizonte; los sectores siguen teniendo transición de entrada y salida. No
  se modifica el terreno, los controles, las construcciones ni los guardados.

**Nota de pruebas:** los tests automatizados no miden FPS reales ni permiten
juzgar el degradado WebGL a simple vista; probar desde una montaña con F3 y
comparar 16/18 chunks para medir la carga y detectar bordes visibles.

---

# Minecraft.js v10.5 — Horizonte 12–16 chunks, LOD en tres niveles

Esta versión está basada en **v10.4**. Las partidas antiguas, el terreno
híbrido, las construcciones, las herramientas y la meteorología permanecen
compatibles. No cambia el formato de guardado ni la lógica de colisiones.

## Qué ha cambiado

- **Cercano:** radio habitual de **3 chunks** (49 chunks completos), con
  construcción, colisiones, árboles reales, animales y cuevas.
- **Intermedio:** hasta **8 chunks**, mallas con muestras del relieve cada
  **4 bloques**, vegetación simplificada por bioma y siluetas de ruinas,
  torres y campamentos cuando estén habilitados.
- **Lejano:** desde el noveno chunk hasta un máximo de **16 chunks**, mallas
  que muestrean el relieve cada **8 bloques**. Se agrupan en sectores de hasta
  8×8 chunks y no generan bloques físicos.

Con **3 chunks completos + 16 de horizonte** se representan 49 chunks con
voxel completo, 240 equivalentes intermedios y 800 equivalentes lejanos. El
alcance horizontal es de aproximadamente **1056×1056 bloques**. La cantidad
de mallas es mucho menor que la cantidad de chunks representados.

El terreno lejano se construye **por lotes de 4 a 8 tiles por fotograma**,
para evitar que aparezca todo de golpe. Los sectores entran y salen con un
**fundido tramado progresivo**, y sus bordes llevan faldones pequeños para
reducir grietas entre distintas resoluciones. La cámara ahora puede ver
hasta 900 bloques, necesarios para abarcar las esquinas lejanas del horizonte.

**Limitación deliberada:** la vegetación de LOD intermedio es una aproximación
visual y no tiene colisiones; los árboles y construcciones exactos aparecen al
entrar en el anillo de chunks completos. Los bloques editados en la distancia
no se reproducen individualmente en el LOD, pero los guardados se conservan.

## Cómo configurarlo

Con **F3**, elige **6, 8, 10, 12, 14 o 16 chunks** de horizonte. Por defecto,
la v10.5 empieza con **12 chunks**, como opción inicial prudente.

- Calidad baja: máximo 8 chunks de horizonte.
- Calidad media: máximo 12 chunks.
- Calidad alta: máximo 16 chunks.
- Con distancia automática activada, FPS bajos contraen antes el horizonte
  lejano que los chunks completos; la recuperación es gradual y con pausas
  entre cambios para evitar oscilaciones.
- En condiciones de tormenta y precipitación intensa el horizonte efectivo
  se reduce porque el clima impide ver lejos de todos modos.
- F3 muestra ahora el detalle medio/lejano, trabajos pendientes y el percentil
  95 del tiempo de fotograma, además de FPS, memoria y llamadas de dibujo.

Las preferencias de gráficos se guardan en **este navegador**, no en el JSON
exportado de la partida. Los mundos anteriores no se convierten ni modifican.

## Cómo probar el rendimiento

Prueba primero 12 chunks en calidad alta con F3, caminando durante unos minutos.
Si los FPS y el percentil 95 de fotograma se mantienen estables, prueba 14 y
16. Compara en el mismo mundo y desde el mismo lugar para obtener una referencia
útil. No se han medido FPS reales en WebGL en este entorno: la prueba gráfica
debe realizarse en un navegador que cargue Three.js y Vite.

Para ejecutar:

```bash
cd minecraft
npm ci
npm run dev
node --test tests/*.test.mjs
```

---

# Minecraft.js v10.4 — Horizonte de 6–8 chunks con LOD

Esta versión continúa sobre la **v10.3**, conservando los controles, los seis
mundos, la generación híbrida de v10.1, la meteorología y los archivos JSON.

## Nuevo paisaje lejano (LOD)

- El terreno **cercano** sigue representado por los chunks voxel completos de
  la versión anterior (por defecto, radio 3: **49 chunks**), con colisiones,
  cuevas, construcciones, minería, herramientas y todas las interacciones.
- Fuera de ese anillo aparece un **relieve de baja resolución** que sigue la
  misma semilla, biomas, montañas y algoritmo híbrido del mundo actual.
  Es una representación gráfica; **no se crean chunks físicos ni objetos
  para cada bloque lejano**.
- En el perfil **Alto** puedes contemplar hasta **8 chunks de radio**,
  equivalentes a una zona de **544×544 bloques** centrada aproximadamente
  en el jugador. Dentro de esa área, los chunks próximos siguen teniendo
  máximo detalle y los exteriores se visualizan mediante LOD.
- Los **240 chunks exteriores** de un horizonte de radio 8 y un área detallada
  de radio 3 se agrupan en **hasta 25 mallas**, con aproximadamente **30.720
  triángulos** (8×8 celdas de superficie por chunk) en lugar de millones
  de bloques completos. La cantidad exacta cambia al moverte.
- Las montañas lejanas pueden carecer de árboles, casas, cuevas visibles y
  bloques editados: cuando te acercas, se sustituyen por sus chunks voxel
  reales. Es deliberado para que el LOD sea ligero.
- La niebla meteorológica sigue reduciendo la visibilidad durante nieve,
  lluvia, polvo y tormentas. En tiempo despejado, el horizonte se abre para
  poder ver las montañas. La zona exterior se desvanece suavemente.

## F3: rendimiento y ajustes

Abre **F3** para consultar FPS, tiempos de fotograma, memoria, número de
chunks completos y de sectores LOD, triángulos lejanos y tiempo de generación.

- **Horizonte LOD:** elige 6, 7 u 8 chunks (preferencia del navegador).
- **Calidad Baja:** máximo 6 chunks LOD.
- **Calidad Media:** máximo 7 chunks LOD.
- **Calidad Alta:** máximo 8 chunks LOD.
- **Distancia automática:** primero se reduce 8 → 7 → 6 si los FPS son bajos
  durante varios segundos; solo después se reduce, si hace falta, el radio
  de chunks completos. Al recuperarse los FPS ocurre lo contrario.
- Los cambios son **de renderizado exclusivamente**: no alteran el terreno,
  la semilla, la lista de zonas exploradas ni los guardados de cada mundo.
- Una distancia completa elegida manualmente inferior a 2 también desactiva
  temporalmente el LOD lejano para evitar mostrar terreno sin colisiones.

## Controles y compatibilidad

Sin cambios respecto a v10.3: `0` + clic izquierdo para picar, `1–9` + clic
izquierdo para construir, botón derecho para colocar/interactuar con objetos
seleccionados desde `E`; `M` mapa, `F3` diagnóstico, `U` opciones.

**Partidas:** los archivos exportados mantienen el formato de la v10.3. No se
reescriben ni cambian automáticamente los mundos antiguos. Las zonas
protegidas de mundos mixtos se respetan tanto en el LOD como cerca.

## Ejecutar y comprobar

```bash
cd minecraft
npm ci
npm run dev
node --test tests/*.test.mjs
```

Se han añadido pruebas para el control de FPS, la niebla, los sectores de
superficie, las coordenadas negativas y la separación de chunks completos y
LOD. Las pruebas automatizadas no miden FPS reales ni reemplazan verificar
la apariencia del horizonte en un navegador con Three.js/WebGL.

---

# Minecraft.js v10.3 — Visibilidad adaptativa, atmósfera y mundos híbridos

Esta actualización mantiene todos los controles y elementos de la v10 y añade una
**ampliación opcional para mundos antiguos**. Las partidas existentes no se
modifican automáticamente al abrir el juego.

## Cómo se actualiza ahora un mundo antiguo

En la **v11.2.1** basta con abrir el mundo desde **Mis mundos**: la migración
se efectúa automáticamente, sin botón, aviso de confirmación ni pérdida de los
chunks registrados. Si deseas una copia anterior a la actualización, puedes
exportar el JSON original *antes de abrirlo en la nueva versión*.

El antiguo botón manual «Ampliar con terreno v10» de v10.1 ya no aparece.

## Cómo protege los mundos antiguos

- Se congela una lista de chunks originales a partir del mapa explorado, de
  todos los bloques editados (incluso en lugares lejanos), cofres/hornos,
  marcadores y puntos de reaparición. En v10.1 también se capturaban los chunks visibles al pulsar su botón; ahora se guardan al cargar el mundo.
- Los chunks de esa lista siguen generándose con el mismo algoritmo y
  límite natural de **32 niveles**, pero una vez migrado el mundo podrás
  construir también encima hasta el límite de **80 niveles**.
- Los chunks nunca descubiertos y sin ediciones utilizan la generación v11.2
  en la revisión actual (anteriormente utilizaban la generación v10).
  El relieve se fusiona progresivamente durante **96 bloques (tres chunks)**
  cerca de cada zona original. Las cuevas nuevas empiezan fuera de los bordes
  próximos a las construcciones.
- La decisión sobre qué chunks son originales queda **fija en la partida**:
  volver a visitar o explorar una región no cambia su generador.
- El mapa 2D y el terreno 3D consultan la misma generación híbrida; no se
  calcula geometría adicional para dibujar el mapa.
- Los archivos JSON v1–v10 siguen importándose. El formato de guardado v11
  añade `world.terrainVersion: 3` y `world.hybrid.legacyChunks`.

**Límite de los guardados antiguos:** en versiones muy antiguas no se
registraban todas las regiones por las que se había pasado. Por ello, la
protección garantiza las zonas *registradas*, editadas y próximas al jugador,
  pero no puede reconstruir visitas antiguas que nunca se guardaron.

## Versiones de terreno

| Tipo | Código | Altura de mundo | Cómo se utiliza |
|---|---:|---:|---|
| Original | 1 | 32 | Mundos antiguos sin convertir |
| v10 | 2 | 80 | Mundos nuevos |
| Mixto v10.1 | 3 | 80 | Mundos originales convertidos voluntariamente |
| Ríos y lagos v11 | 4 | 80 | Mundos creados con v11.0/11.1 |
| Cascadas y hielo v11.2 | 5 | 80 | Mundos nuevos |
| Mixto automático v11.2.1 | 6 | 80 | Partidas antiguas abiertas con esta versión |

**Pruebas:** `node --test tests/*.test.mjs`. La inspección de FPS en WebGL
continúa pendiente de realizarse en un navegador con Three.js. El panel **F3**
puede usarse para comprobar chunks y fluidez al cruzar la zona de transición.

---

# Minecraft.js v10 — Montañas, cuevas y geología

Esta versión parte de **v9.5**, conservando sus controles, menú, inventario, animales, mobiliario, meteorología, mapa, logros y calidad gráfica.

## Cambios del terreno (solo mundos creados con v10)

- **Montañas y valles:** generador reproducible a partir de la semilla, con grandes formas continentales, crestas y pequeñas colinas; cada tipo de mundo (clásico, selva, nieve, desierto, islas y lava) conserva su identidad.
- **80 niveles verticales** en los mundos v10 (32 en los mundos antiguos), con altura de montañas variable y espacio reservado para árboles y construcciones.
- **Cuevas tridimensionales:** galerías y cámaras bajo tierra, con algunas entradas naturales en laderas. Se protege el entorno del punto de aparición frente a bocas de cueva.
- **Geología:** capa superficial de tierra o arena, piedra intermedia, pizarra profunda (nuevo bloque n.º 27) y fondo de basalto. El carbón y el hierro se distribuyen en vetas por profundidad.
- **Mapa sincronizado:** el mapa 2D y los chunks 3D usan la misma función de altura para los mundos v10.
- **Posición inicial adaptada** a la superficie del terreno de cada partida.
- **Rendimiento:** arrays compactos de v9.4, generación de chunks progresiva y panel F3. En v10 se precalculan parámetros geológicos por columna y se evitan capas superiores vacías al construir mallas.

## Compatibilidad y guardado

**Nota histórica de la v10 (actualizada en v11.2.1):** los chunks descubiertos
conservan su terreno, pero las zonas nuevas pueden utilizar un generador más
reciente. El campo `world.terrainVersion` nació en el JSON v10:

- `1`: terreno original, 32 niveles; compatible con las partidas anteriores.
- `2`: terreno v10, 80 niveles; geología y cuevas.

Las partidas antiguas sin ese campo se interpretan como versión 1 al leerlas.
Desde v11.2.1 se convierten automáticamente a la modalidad híbrida 6 al abrirlas,
manteniendo intactos los chunks protegidos. Los JSON anteriores siguen admitidos.

## Controles conservados

- `0` y **clic izquierdo**: herramienta equipada / picar.
- `1–9` y **clic izquierdo**: colocar bloques sobre caras de otros bloques (puentes y techos sin pilares).
- **Clic derecho**: colocar el objeto elegido en `E` o interactuar con mesas, cofres y hornos.
- `E`: inventario; `M`: mapa; `F3`: diagnóstico; `U`: opciones; `F1`: guardar; `F2`: cargar.

## Instalación y pruebas

Desde la carpeta `minecraft/`:

```bash
npm ci
npm run dev
```

Pruebas automatizadas, sin navegador: `node --test tests/*.test.mjs`.

La v10 mantiene los fluidos como superficies visuales (no simulación volumétrica). Los FPS deben verificarse en WebGL tanto en mundos antiguos como nuevos: la mayor profundidad exige más CPU/GPU, aunque se han reducido cálculos. La generación mediante Web Workers y el *greedy meshing* siguen pendientes.

---

# Minecraft.js v9.3 — Nubes voxel sin apariciones repentinas

La v9.3 continúa desde la v9.2, con nubes conectadas y seleccionables desde **U → Mundo → Nubes → Estilo de nubes**.

- **Rápidas:** una capa de nubes planas y pixeladas, sin sombras.
- **Detalladas:** nubes 3D con caras claras y oscuras, una capa.
- **Avanzadas (por defecto):** dos capas de altura, volumen escalonado y sombras condicionadas a la meteorología.

**Sin popping al moverse ni al girar:** los grupos tienen coordenadas estables en el mundo calculadas con la semilla; la opacidad se reduce gradualmente antes de abandonar el anillo externo y varía suavemente con la nubosidad. Se amplía la distancia de dibujado de primera persona para evitar cortes debidos al plano lejano de la cámara.

**Rendimiento:** una o dos mallas instanciadas, hasta 1450 instancias por capa y actualizaciones limitadas a unos 6,7 Hz. No se crean colisiones ni se regeneran chunks al cambiar densidad o escala. El estilo se guarda individualmente por mundo en el JSON v9; las partidas anteriores adoptan el estilo avanzado.

Las pruebas automatizadas no sustituyen una comprobación visual ni una medición de FPS reales en WebGL.

---

# Minecraft.js v9.2 — Atmósfera y meteorología

Esta versión continúa directamente desde **v9.1**. No cambia los controles de construcción, las recetas, los mundos temáticos, las partidas guardadas ni el formato JSON **v9**.

## Nuevas funciones de v9.2

- **Nubes voxel dinámicas:** dos capas de distinta altura, grupos con formas y tamaños variados y desplazamiento progresivo según el viento. Son **elementos visuales**, no bloques sólidos que impidan construir ni que el jugador pueda seleccionar.
- **Clima cambiante:** cielo despejado, nubosidad, lluvia, tormentas con destellos breves de relámpagos, nieve, polvo del desierto y ceniza del mundo volcánico. Las probabilidades dependen del tipo de mundo. El clima pasa gradualmente de un estado a otro.
- **Cielo e iluminación:** la nubosidad reduce la luz solar, modifica los tonos del cielo y oculta las estrellas y los astros en cielos muy cubiertos. Las nubes siguen adoptando tonos rosados al amanecer y dorados al atardecer.
- **Lluvia/nieve/polvo/ceniza:** partículas locales alrededor del jugador, con viento. Cuando hay techo sobre el jugador, su visibilidad se reduce para no llenar las casas de lluvia.
- **Sombras de nubes:** la capa inferior proyecta sombras en días parcialmente nubosos si la meteorología está activada. Se evitan en temporales cerrados para ahorrar trabajo gráfico.
- **Indicador de clima:** aparece debajo del reloj del mundo, traducido a español, inglés y francés.
- **Rendimiento:** la nube usa dos `InstancedMesh` y la lluvia/nieve como máximo dos sistemas de partículas reutilizables; se eliminó la generación de nubes de las matrices de voxeles en cada chunk.
- **Configuración:** en **U → Mundo → Efectos meteorológicos** se puede activar o desactivar el clima. Esta preferencia se guarda por mundo y se incluye al exportar la partida. Al abrir partidas v1–v9.1 los efectos empiezan activados.

El pronóstico se calcula a partir de la **semilla y la hora del propio mundo**, de modo que se conserva tras cargar, cambiar de mundo o exportar/importar. El tiempo y el movimiento del viento se detienen en los menús.

### Compatibilidad y notas

Los guardados v1–v9 mantienen sus construcciones, objetos, cofres, hornos, mapa, logros y registros de tiempo. El formato JSON sigue en **v9** porque el clima no introduce un nuevo modelo obligatorio de partida. Las nubes antiguas generadas por chunks se sustituyen por el sistema visual independiente, pero **las modificaciones manuales guardadas** siguen aplicándose.

La meteorología actual es **visual**: no hay acumulación de nieve en el suelo, agua física, daños por rayos, truenos sonoros ni cambios de cultivos. Las sombras y las partículas deben comprobarse visualmente en un navegador con Three.js/WebGL; las pruebas automatizadas no constituyen una medición de FPS.

### Ejecutar

```bash
npm ci
npm run dev
```

Para ejecutar la batería automatizada: `node --test tests/*.test.mjs`.

---

# Minecraft.js v9 — Mapa, logros y lugares para explorar

Continúa desde la v8 con las funciones originales intactas: **0 y clic izquierdo** utilizan la herramienta equipada; **1–9 y clic izquierdo** construyen por caras; el **botón derecho** coloca el objeto preseleccionado desde **E**.

## Novedades v9

- Pulsa **M** para abrir el mapa del mundo. También hay un minimapa en la esquina superior derecha y un botón en el menú.
- El terreno se va revelando al caminar. El mapa reproduce los biomas y las alturas de la semilla mediante Canvas 2D; no genera chunks 3D para mostrarlo.
- Crea hasta **50 marcadores por mundo**, desde tu posición actual o pulsando sobre una zona explorada. Elige casa/construcción/otro, recentra el mapa sobre uno, o elimínalo.
- En mundos nuevos v9 hay **ruinas, campamentos y miradores** construidos con bloques; su posición es reproducible desde la semilla, y al acercarte quedan registrados como descubiertos.
- En mundos anteriores, los lugares se mantienen **desactivados por defecto** para proteger las construcciones existentes. Puedes activar su generación desde el mapa, con aviso; se respetan los bloques editados por el jugador, pero puede cambiar el aspecto de regiones no editadas. Es recomendable exportar primero una copia de seguridad.
- Se incluyen **ocho logros por mundo**, en el menú, con fecha de desbloqueo.
- El formato JSON ahora es **v9**, compatible con archivos v1–v8. Guarda mapa explorado, marcadores, lugares visitados, logros y los datos anteriores. Duplicar un mundo reinicia logros y exploración como también reinicia estadísticas.

## Rendimiento

El minimapa se actualiza como máximo cada 850 ms, los lugares se detectan cada 500 ms y el mapa grande solo se redibuja cuando cambias su vista. La geometría de las nuevas estructuras se genera únicamente dentro de los chunks cargados. Los tests no miden FPS reales.

## Ejecutar y verificar

En `minecraft`: `npm ci` y `npm run dev`. Ejecuta los tests con `node --test tests/*.test.mjs`. También es posible servir la carpeta en HTTP con conexión a CDN por el importmap; no abras `index.html` directamente con `file://`.

---

# Minecraft.js v8 — Ciclo día/noche y progreso por mundo

Juego voxel con Three.js. Esta versión parte de la v5 y usa el proyecto original como referencia de los controles. Conserva los mundos temáticos, el inventario, muebles, cofres, hornos, animales y las partidas anteriores.

## Cómo jugar

En la carpeta `minecraft`:

```bash
npm ci
npm run dev
```

Abre la dirección que anuncie Vite. Alternativa sin Vite: `python -m http.server 8080` y visita `http://localhost:8080` con conexión a Internet para cargar Three.js desde jsDelivr. No abras el fichero directamente con `file://`.

| Entrada | Acción |
|---|---|
| **0 + clic izquierdo** | Utilizar el pico, sierra o espada equipada en **E**. Con el pico puedes eliminar también muebles, camas, antorchas, cofres y hornos vacíos. |
| **1–9 + clic izquierdo** | Colocar el bloque seleccionado sobre **una cara de otro bloque**, como en el original. Puedes extender techos y puentes sin pilares, pero no crear un cubo aislado a mitad del vacío. |
| **Botón derecho** | Colocar el **objeto preseleccionado en E** sin cambiar el material de 1–9. |
| **Botón derecho sobre mesa de trabajo, cama, cofre u horno** | Usar el objeto (fabricar, fijar reaparición o acceder al contenido). **Mayús + clic derecho** intenta colocar otro objeto junto a él. |
| **E** | Abrir inventario: selección de herramienta del 0 y del objeto del botón derecho, además de mochila, fabricación y catálogo creativo. |
| **Rueda / 1–9** | Cambiar material de construcción, sin modificar el objeto derecho ni la herramienta del 0. |
| **WASD**, **Espacio**, **Mayús** | Caminar, saltar y correr. |
| **F1 / F2** | Guardar / cargar mundo actual. |
| **ESC** | Menú principal. |

### Herramientas

- **Pico normal**: virtual, disponible siempre en 0; permite quitar bloques y muebles. En supervivencia no recupera todos los minerales.
- **Pico de madera / piedra / hierro**: se fabrican, se eligen en E, tienen distinta capacidad para obtener recursos minerales. El hierro requiere lingotes procesados en el horno.
- **Sierra**: rompe troncos y ramas de madera, retirando hasta ocho segmentos consecutivos de tronco sobre el golpe inicial. No se usa para minería de piedra.
- **Espada**: destinada a los animales; permite obtener más carne. No destruye bloques.

Las herramientas no tienen desgaste aún. En creativo pueden elegirse directamente; en supervivencia deben estar en el inventario. Las nuevas partidas creativas empiezan con **nueve bloques de construcción** en 1–9, y el mobiliario se elige en E para el clic derecho. Los mundos anteriores mantienen su distribución de inventario.

### Objetos

Desde E puedes elegir **mesa de trabajo, antorcha, estantería, cama, mesa decorativa, cofre y horno** para el botón derecho. Los cofres tienen 27 casillas; el horno cocina carne y funde hierro, arena y madera con combustible. Antes de romper un cofre u horno, vacíalo. La colocación necesita una cara existente y algunos muebles requieren suelo.

### Mundos y partidas

Puedes crear mundos **clásico, océano e islas, selva, desierto, nieve y volcánico**. Los mundos anteriores se conservan; cada mundo guarda inventario, construcciones, animales, estaciones, posición, selección de herramientas, objeto de la derecha y tiempo total jugado. Los archivos JSON nuevos usan formato `minecraftjs-save` **v8**, compatible con v1–v7. Hay autoguardado cada 45 segundos y exportación/importación en el menú.

### Mejoras de rendimiento

- Selección de bloques mediante recorrido voxel DDA (en vez de raycasting contra todas las instancias de los chunks).
- Acceso O(1) a chunks con índice `Map`, y actualización de la corona visible solo cuando cambia el chunk del jugador o la distancia de visión.
- Generación diferida limitada a un chunk por callback inactivo, con el chunk de aparición listo de forma síncrona.
- Física predeterminada a 120 Hz, con límite de pasos de recuperación, sin crear geometrías de depuración cuando están ocultas, y paso recalculado cuando cambia la frecuencia en ajustes.
- Meshes instanciadas solo para tipos de bloque presentes; se crean dinámicamente si construyes otros. Menos sombras de hojas y antorchas, resolución máxima de píxel de 1,5 y mapa de sombras 1024².
- Reutilización de vectores temporales de cámara y modelos de herramientas.

## Pruebas

```bash
node --test tests/*.test.mjs
```

Las pruebas unitarias verifican inventario, recetas, guardados, migración, objetos, controles, selección por cuadrícula y tipos de mundo. No equivalen a pruebas gráficas reales: hay que comprobar el resultado en el navegador con WebGL para evaluar FPS y errores de renderizado.

## Próximas mejoras sugeridas

Herramientas con durabilidad, indicador FPS/chunks/meshes, elección de calidad gráfica, cuevas, mejores animales y fluidos volumétricos.


## Novedades de v7

- **Espada y sierra en primera persona**: ambas tienen un agarre propio, casi vertical, visible abajo a la derecha y una animación de golpe desde la empuñadura. El pico conserva su posición original.
- **Cronómetro superior**: muestra el nombre del mundo, tiempo total acumulado y duración de la sesión actual. Usa formato `HH:MM:SS` (puede superar las 24 horas).
- **Pausas correctas**: solo cuenta tiempo mientras estás controlando al personaje (ratón capturado y pestaña visible). Se detiene al pulsar `ESC`, abrir `E` o cambiar de pestaña. Reanuda al volver a jugar.
- **Registro por mundo**: abre `Registro de juego` en el menú para consultar los últimos registros con fecha/hora de inicio, fecha/hora de fin y duración. Se conservan los últimos 80 registros detallados, además del total histórico.
- **Guardado**: el contador y sus fechas se incluyen en F1, autoguardado, duplicación/importación/exportación en JSON. Los mundos existentes de versiones 1–6 comienzan con 0 horas registradas, sin perder su progreso previo; no es posible recuperar tiempos jugados antes de esta versión. Duplicar un mundo copia la construcción pero inicia su contador en cero.

Las fechas se muestran en el idioma/huso horario local del navegador; en el JSON se almacenan en formato ISO UTC para poder transferirlas correctamente entre equipos. No requiere servicios ni cuenta de usuario.

## Novedades de v8 — Ciclo día/noche y estadísticas

- **Reloj del mundo:** marcador superior con día y hora. El día completo dura 20 minutos reales **de juego activo**. El sol recorre el cielo, aparecen la luna y las estrellas, y cambian la luz ambiente, las sombras y el color del cielo y la niebla. De noche las antorchas siguen iluminando alrededor de las construcciones. Se utiliza un único sol, una luz lunar sin sombras y un campo de estrellas de una sola llamada de dibujo para mantener el rendimiento.
- **Pausa del mundo:** al entrar en un menú, abrir el inventario o cambiar de pestaña, el tiempo del mundo deja de avanzar. El contador de sesiones reales de v7 sigue siendo independiente.
- **Dormir en una cama:** haz clic derecho sobre una cama durante la noche (aproximadamente de 19:00 a 06:00 del juego). El reloj salta a las 07:00 y se registra una noche dormida. Durante el día, la cama únicamente actualiza el punto de reaparición.
- **Estadísticas por mundo:** en el menú, despliega **Estadísticas del mundo** para ver bloques colocados, bloques eliminados, distancia recorrida, objetos fabricados, animales recogidos, especies descubiertas (hasta cuatro) y noches dormidas. Los cambios de mundo y la reaparición no inflan la distancia recorrida.
- **Guardados compatibles:** partidas JSON v8. Se pueden abrir mundos anteriores v1–v7 sin perder construcciones, tiempo de sesión, inventario ni estaciones. Los mundos anteriores comienzan con día 1 a las 08:00 y contadores nuevos a cero (no se pueden reconstruir retroactivamente). El reloj y las estadísticas también se exportan en JSON y se mantienen separados entre mundos. Al duplicar un mundo, el calendario y las estadísticas se reinician, igual que el contador de tiempo jugado.

**Pruebas automatizadas:** `node --test tests/*.test.mjs` verifica guardado/importación, cambio de mundo, migración, fabricación, reloj, saltos nocturnos, movimiento y contadores. La revisión visual WebGL y los FPS reales requieren abrirlo en un navegador con las dependencias instaladas.

**Pendiente para otras fases:** logros, minimapa y puntos de interés/estructuras generadas; no forman parte de esta v8.

## Novedades v9.1 — Iluminación de las nubes

- Las nubes **cambian de color con el reloj del mundo**: gris azulado de noche, rosado al amanecer, blanco cálido durante el día, dorado/rosado al atardecer y oscuro de nuevo por la noche.
- Las transiciones entre franjas son progresivas y dependen de la misma hora guardada por mundo que utiliza la iluminación del cielo. Dormir en la cama actualiza inmediatamente su tonalidad.
- Se respetan matices por tipo de mundo (nubes más frías en nieve y océano, cálidas en desierto y gris ceniza en volcánico).
- **Rendimiento:** todas las nubes comparten el mismo material; se actualiza solo su color aproximadamente cinco veces por segundo. No se generan mallas, texturas ni luces nuevas.
- No cambia el formato de las partidas: la versión v9.1 mantiene la compatibilidad con los mundos y archivos JSON v9.

Pruebas: `node --test tests/*.test.mjs`.

## v9.4 — Rendimiento y diagnóstico

Esta versión mantiene **intacto el formato de las partidas (v9)** y los controles
originales. Para comparar el rendimiento, entra en un mundo y pulsa **F3**. Se
muestran FPS, tiempo medio de fotograma, chunks cargados/pendientes, memoria de
bloques, llamadas de dibujo, triángulos, instancias de nubes y tiempo de creación
del último chunk. La memoria JS global solo aparece en navegadores que la exponen.

El selector de calidad del panel F3 tiene tres perfiles:

| Perfil | Pixel ratio máximo | Resolución de sombras | Chunks con sombras | Precipitación |
|---|---:|---:|---:|---:|
| Baja | 1,0 | 512 px | Radio 1 | 35 % |
| Media | 1,25 | 768 px | Radio 2 | 70 % |
| Alta | 1,5 | 1024 px | Distancia completa | 100 % |

La calidad **Alta** es la predeterminada, para conservar la apariencia de v9.3.
El ajuste se guarda únicamente en el navegador, no dentro de la partida, para
que puedas utilizar otra calidad en un dispositivo más lento. La distancia de
visión sigue siendo configurable en **U → Mundo** y no cambia al elegir perfil.

### Optimizaciones implementadas

- Cada chunk utiliza un `Uint8Array` de tipos y un `Int32Array` de índices,
  **160 KiB por chunk** de datos voxel, sin un objeto JavaScript por bloque.
  En 49 chunks esto equivale a 7,66 MiB de matrices de datos voxel (sin contar
  geometría, texturas, cambios del jugador ni el resto del motor).
- La selección y las colisiones consultan directamente el tipo de bloque.
- Al cargar un mundo se aplican solo las celdas modificadas de cada chunk,
  sin recorrer todo el volumen buscando cambios.
- La generación de terreno evita recorrer alturas vacías por encima de la
  superficie, mantiene el chunk del jugador prioritario, y genera el resto
  en ventanas o turnos diferidos, incluido Safari (sin `requestIdleCallback`).
- Las nubes conservan posiciones continuas y reutilizan sus geometrías y formas;
  solo se reconstruyen si ha cambiado lo suficiente la posición o la nubosidad.
- Los perfiles bajo y medio limitan los bloques que proyectan sombras a
  chunks cercanos; la calidad alta conserva todas las sombras de v9.3.

**Limitaciones:** no se ha integrado todavía generación por Web Workers ni
*greedy meshing*. Son cambios grandes y se dejan para una fase posterior que
incluya validación gráfica y comparaciones de FPS reales. Las métricas F3 son
instrumentos para realizar esa comparación; no son resultados de benchmark.

## v9.5 — Menú mejorado

- Cabecera fija del menú con título **MINECRAFT.JS** siempre visible, botón principal **Jugar / Continuar** destacado y nombre del mundo activo.
- Desplazamiento dentro del menú en vez de centrar un panel más alto que la pantalla (la causa de que el título quedara cortado).
- Distribución de dos columnas en pantallas grandes: mundos/creación a la izquierda, mapa, inventario y gestión de partidas a la derecha. Diseño apilado en pantallas pequeñas.
- Estadísticas, registro de sesiones y logros plegables; controles accesibles bajo un desplegable para despejar el menú inicial.
- Conserva los IDs y acciones del menú, los tres idiomas y el formato **v9** de las partidas.
- Corregido el error de inicialización del panel F3 que intentaba utilizar `atmosphere` antes de crearlo y podía impedir que se iniciase la aplicación.
- Ejecutar pruebas: `node --test tests/*.test.mjs`. El entorno no permite abrir la página en Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`), por lo que el aspecto final en WebGL debe comprobarse en el navegador del usuario.


## v10.2 — Nieve en cuevas y niebla dinámica

- La nieve, la lluvia y la ceniza dejan de atravesar techos: cada columna de partículas comprueba si tiene cielo abierto hasta la **altura real** del mundo (32 bloques clásicos, 80 v10). Se mantiene la precipitación visible al otro lado de una entrada de cueva.
- Durante una lluvia, bajo una roca próxima pueden verse unas pocas gotas interiores, separadas de la lluvia exterior. No hay copos flotando bajo tierra.
- La niebla ya no comienza siempre a 50 bloques ni tapa todo a los 75: en días despejados mejora la visibilidad, más aún en las cumbres; cuando llueve, nieva intensamente o hay polvo/ceniza el horizonte se vuelve a cerrar de forma gradual.
- La transición lejana se conserva para ocultar los límites de chunks cargados. **U → Mundo → Inicio/Final de niebla** guarda los límites de referencia, no el valor temporal del clima. Los antiguos valores predeterminados 50/75 se migran automáticamente; los valores personalizados se respetan.
- No cambia el formato de guardado v11 ni los bloques del terreno híbrido, y el sistema de partículas usa consultas cacheadas de columnas para no recorrer el subsuelo cada fotograma.


## v10.3 — Visibilidad adaptativa y entrada/salida suave de chunks

- **F3 → Distancia de visión automática**: activada por defecto y guardada
  solo en este navegador. Reacciona a bajadas sostenidas (menos de 47 FPS durante
  6 s) reduciendo el radio un chunk; tras estabilidad (más de 57 FPS durante
  18 s) lo recupera. Hay pausas entre cambios para impedir oscilaciones.
- El **radio elegido en U → Mundo** sigue siendo el máximo configurado.
  No se modifica la distancia original ni el archivo JSON. El mínimo automático
  es 2 chunks salvo que hayas elegido manualmente una distancia menor.
- Los chunks nuevos del anillo externo aparecen suavemente con un tramado
  de fragmentos que mantiene la profundidad; los chunks que salen de visión
  se desvanecen antes de descargar sus datos y mallas. El anillo central aparece
  al instante para que nunca falte el suelo bajo el jugador.
- La niebla meteorológica utiliza la **distancia efectiva**, y cambia con
  suavidad cuando varía la vista; continúa respondiendo a altura, lluvia,
  nieve, polvo y ceniza. No se usa para ahorrar geometría: el ahorro real
  viene de descargar chunks y disminuir las llamadas a la GPU.
- La opción automática se detiene durante menús o pestañas ocultas.
  El panel F3 muestra radio efectivo/máximo, FPS y chunks cargados.
- Mantiene el mismo formato de guardado v11 que la v10.2; no altera
  construcciones, semillas, inventarios ni generación híbrida.

**Nota:** las mejoras son de código y se han comprobado con pruebas
funcionales. Se recomienda comparar FPS en el mismo mundo y hardware con F3;
no se han medido FPS reales en una escena WebGL en este entorno.
