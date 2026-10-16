# Hexategos Atlas — geografía hexagonal y topónimos

El Atlas utiliza las mallas originales L3–L8 de Hexategos Pruebas. La costa se representa exclusivamente mediante las aristas hexagonales que separan celdas terrestres y marinas. No se superponen polígonos de costa real, máscaras vectoriales ni un segundo mapa de tierra/mar.

## Letreros

La paleta centralizada `atlas-label-style-0399.js` distingue:

- **Azul**: mares, océanos, ríos, lagos, rías, bahías, golfos, estrechos y fiordos.
- **Marrón**: cordilleras, sierras, macizos, montes y sistemas montañosos.
- **Blanco cálido**: penínsulas, regiones, valles, llanuras, mesetas, islas y archipiélagos.

Las macroetiquetas terrestres mantienen sus mayúsculas y ceden paso a nombres regionales al acercarse. Los rótulos conservan halos y prevención de colisiones. La existencia de una etiqueta no cambia la clasificación terrestre o marina del hexágono.

## Límites de la resolución

Cuando un canal, ría, fiordo, islote o estrecho no pueda distinguirse mediante los hexágonos L8, el Atlas conservará la representación propia de la malla en lugar de dibujar una línea de costa vectorial ajena a ella. La validez de las etiquetas de islas y estrechos se comprueba contra la tierra y el agua **de L8**.

Ríos y lagos continúan con sus trazados sobre aristas y vértices de la malla, respectivamente. El Atlas no altera partidas, mecanismos ni información topológica de Hexategos Pruebas.

## Regresiones

Ejecutar `node --test hexategos-atlas/tests/cartography-0399.test.cjs`. La prueba verifica los colores de letreros, ausencia de la capa vectorial de costa, control del zoom y conservación de las rutas y capas existentes.

## Asia · fase 1 (0.40.1)

La toponimia física asiática comparte `hexategos-pruebas/game/data/geo-asia-regions-0401.js` entre el Atlas y ambas versiones jugables. Contiene 52 macrotopónimos y 78 referencias geográficas regionales desde Oriente Próximo a Siberia, Japón, India, China y el sudeste asiático. En el Atlas usa el relevo de zoom, las cajas anticolisión y la paleta semántica: agua azul, cordilleras marrón y regiones terrestres blanco.

Las áreas de consulta regionales son aproximaciones rectangulares, **no fronteras ni costas**. Esta primera fase NO dibuja cauces, montañas o lagos asiáticos adicionales. Las capas físicas jugables existentes se conservan; no cambia la propiedad de ninguna casilla, las redes de rutas, los datos de recursos ni los guardados. La próxima fase será resolver cauces y cordilleras por aristas L8 y, donde la malla lo permita, lagos sin deformar la costa.

## Oriente Próximo · fase 1 de geografía física (0.40.3)

Datos compartidos: `hexategos-pruebas/game/data/geo-west-asia-physical-0403.js`.
Renderizador: `hexategos-atlas/atlas-west-asia-0403.js`. Se cargan desde
Atlas y las dos entradas de Hexategos Pruebas.

Se añaden **13 ríos secundarios o regionales** (Kızılırmak, Sakarya,
Ceyhan, Seyhan, Orontes, Jordán, Karún, Karkheh, Gran Zab, Pequeño Zab,
Diyala, Kura y Aras) y **10 sistemas montañosos secundarios**, entre
ellos montes Pónticos, Antitauro, Pequeño Cáucaso, Kopet Dag, Hiyaz,
Asir y Al Hajar. Las cuatro nuevas masas de agua candidatas son
Urmia, Seván, Tuz y Mar Muerto. Se respetan los cauces canónicos del
**Tigris y Éufrates** y las cordilleras **Cáucaso, Tauro, Zagros y
Elburz**, con estilos afinados sin volver a trazarlas. **Van ya se
dibuja en la capa europea y no se duplica.**

Las referencias son **aproximadas**. No se dibujan trazas cartesianas:
se proyectan a un grafo terrestre regional de **vértices y aristas reales L8**,
cargado bajo demanda tras filtro L5, con búsqueda y resultados cacheados
por accidente. Un segmento que no se pueda encaminar o acabe sobre una
arista litoral se omite. Los lagos son esquemas lineales sobre esas
aristas; un lago demasiado pequeño o no resoluble se omite. Esto **no
sustituye ni recorta los hexágonos como una nueva costa o masa de agua
persistente**.

No se alteran regiones de propiedad, geología, guardados, IA, logística,
rutas del juego ni simulación. Los datos y las etiquetas se comparten,
pero el juego sólo activa las capas de detalle en vistas de Europa y
Oriente Próximo. Se puede desactivar en la opción de Atlas físico de la
pantalla inicial.

Pruebas: `node --test hexategos-atlas/tests/*.test.cjs` incluye
integridad de archivos y orden de carga, grafo diferido, conexiones de
aristas hexagonales, seguridad de costa, caché y no mutación de malla.

## Asia Central: Caspio, Aral y cuencas endorreicas (0.40.4)

La malla original L8 ya contiene el **mar Caspio** como agua. Sus costas
siguen exclusivamente aristas tierra-mar originales, sin agregar polígonos
de costa ni cambiar conectividad. Una auditoría de los datos nativos L8
confirma que **Aral, Balkhash e Issyk-Kul** son casillas terrestres
originales. Por eso se han añadido sólo como **cobertura cromática
hexagonal (sin navegación, puertos ni reclasificación jugable)**.

Fuente física única: `hexategos-pruebas/game/data/geo-central-asia-physical-0404.js`.
Dos representaciones compartidas entre Atlas y Pruebas:
- `hexategos-atlas/atlas-central-asia-routes-0404.js`: red terrestre
  regional L8 construida bajo demanda; enrutamiento de 11 ríos, 7 cadenas
  menores, búsqueda de orillas hexagonales de las aguas interiores. No
  vuelve a trazar Volga, Ural, Irtish ni Pamir/Tian Shan/Altái canónicos.
- `hexategos-atlas/atlas-central-asia-water-0404.js`: agua visual en
  hexágonos L8 originales: Aral septentrional, remanente occidental del
  Aral, Balkhash, Issyk-Kul, Alakol y Sarykamysh. Solo mapa físico y
  político; no contamina mapas de suministro o potenciales naturales;
  sigue el interruptor de lagos y el interruptor del Atlas en el juego.

Las ubicaciones y contornos son **aproximaciones geométricas** destinadas
a la escala hexagonal, no superficies hidrográficas verificadas. El mar
de Aral fluctúa y se ha reducido mucho; el extremo del Amu Daria
representa su cuenca/desembocadura histórica y no garantiza descarga
permanente en el lago. Las corrientes endorreicas o intermitentes no
se convierten en rutas marítimas. Los nombres de aguas interiores
aparecen con el zoom suficiente, sin producir agua sin correspondencia
con la malla visual.

Las pruebas L8 con la malla de 510 762 celdas comprueban rutas
vértice-arista, no invasión de aristas costeras, enlace de Amu Daria,
Sir Daria, Ili y Karatal a orillas hexagonales, conteos de las masas
de agua dibujables, cachés, inmutabilidad de `L.land`, coexistencia en
Atlas y ambas entradas de Pruebas y aislamiento del modo suministro.

## Asia Central · consolidación del terreno y relieve (0.40.5)

La fase complementa las cuencas de agua 0.40.4 y deja Asia Central con
un modelo cromático local compartido entre **Atlas y ambas versiones de
Hexategos Pruebas**.

* `hexategos-pruebas/game/data/geo-central-asia-landcover-0405.js`
  ofrece colores continuos, deterministas y cacheados para Karakum,
  Kyzylkum, Ustyurt, Betpak-Dala, estepa kazaja, Ferganá, valle del Ili,
  cuenca de Zungaria, Tarim/Taklamakán y los sistemas montañosos de
  Pamir, Tian Shan, Kunlun y Altái. En los bordes con Europa y el terreno
  genérico, un peso continuo funde la paleta; **no hay rectángulos de
  color que formen cortes visibles**. Cambia solo el renderizador y la
  información del inspector cartográfico.
* `geo-central-asia-physical-0404.js` incluye cinco sierras menores
  adicionales: Boro-Horo, Dzungarian Alatau, Tarbagatai, Kyrgyz Ala-Too
  y Montes Saur. Junto con las siete anteriores son **12**, más los
  **11 ríos secundarios** que ya resolvía la fase 0.40.4.
* Los 23 recorridos se resuelven sobre el grafo original L8 y no deben
  atravesar aristas de costa ni de agua interior dibujada. Las
  desembocaduras del Amu Daria, Sir Daria, Ili y Karatal continúan
  alcanzando las orillas visuales de sus cuencas. Los seis cuerpos de
  agua que no existían en la máscara geográfica original se dibujan
  como agrupaciones conexas de celdas hexagonales, **sin navegabilidad**.
* Se incorporan unidades de terreno menores como Turán, Ustyurt,
  estepa kazaja, Betpak-Dala, Ferganá y valles de Ili. Los rótulos
  duplicados se eliminan y el nombre del Aral y de Balkhash hace
  un relevo de macroetiqueta a etiqueta local alrededor de zoom 8,6.
  El interruptor de lagos también suprime sus nombres.
* La caché cromática ocupa como máximo cuatro bytes por hexágono de
  cada nivel de detalle cargado; el grafo regional L8 se construye
  **una sola vez bajo demanda**. Sin temporizadores independientes,
  edición de `owner6` o `L.land`, cambios de recursos, IA o guardados.

**Limitaciones explícitas:** el modelo de biomas es orientativo y no
constituye una capa satelital. El mar de Aral ha cambiado mucho de
superficie; su representación es una aproximación de escala L8.
La validación automatizada comprueba geometría, continuidad de lagos,
rutas y desembocaduras, transiciones cromáticas deterministas,
invariancia del suelo, renderizado compartido y modo de suministro;
la inspección visual con navegador y el FPS de una partida con 500
naciones siguen siendo comprobaciones prácticas aparte.


## Himalaya y Tíbet · fase 0.40.6

La región Himalaya–Karakórum–Hindu Kush oriental–Tíbet occidental y
central está **implementada** sobre el `main` actual, compartiendo
datos entre `hexategos-atlas/`, `hexategos-pruebas/game/` y
`hexategos-pruebas/toponimos-game/`. Su versión cartográfica es
0.40.6, aunque el repositorio ya contiene fases posteriores del
subcontinente indio.

- `geo-himalaya-physical-0406.js` contiene 13 referencias montañosas,
  12 áreas geográficas, siete cabeceras hidrográficas y seis lagos.
- Las grandes cadenas canónicas no se trazan por segunda vez.
  `atlas-himalaya-graph-0406.js` y
  `atlas-himalaya-routes-0406.js` resuelven seis sierras secundarias
  sobre aristas reales L8 y se cachean después de cargarse bajo demanda.
- `atlas-himalaya-water-0406.js` representa Pangong Tso, Tso Moriri,
  Manasarovar, Rakshastal, Yamdrok y Namtso como grupos de celdas L8
  visuales. Todos fueron constatados en la malla original con al
  menos un hexágono y sin fragmentación. No son navegables ni cambian
  `L.land`, conectividad o partidas.
- `geo-himalaya-landcover-0406.js` aporta colores deterministas
  que distinguen llanuras agrícolas, Thar, bosque del piedemonte,
  meseta tibetana, roca y nieve de altura, con transición gradual.
- Las cabeceras de Indo, Ganges y Yarlung Tsangpo/Brahmaputra, más
  Sutlej, Yamuna, Karnali y Teesta, estaban preparadas en 0.40.6.
  La hidrografía del subcontinente ya se amplió posteriormente en
  0.40.7 y siguientes; **no debe duplicarse** en futuras fases.
- La pantalla de Atlas ofrece acceso a los seis lagos. La regresión
  de la malla real exige que estén presentes, sean conexos, obedezcan
  al interruptor de lagos y no aparezcan en el modo suministro.

La verificación automática es una prueba de integridad y compatibilidad,
no sustituye una inspección visual en escritorio y móvil ni la medición
de FPS con 350–500 naciones.


## Assam: Subansiri, Manas y Teesta (0.41.3)

Se auditaron los tres afluentes del Brahmaputra en la **malla L8 real**.
El río canónico ya pasa aproximadamente a 5,5 km de la confluencia del
Subansiri; en cambio, no alcanzaba el Manas y el Teesta, separados
de él unos **141 y 156 km** respectivamente, generando conectores
visuales anormalmente largos.

`geo-assam-confluences-0413.js` es la referencia geográfica compartida,
incluidas las curvas del Subansiri, Manas y Teesta. El módulo
`atlas-assam-corridor-0413.js` añade **solo cartografía visual** del
Brahmaputra occidental, resuelta sobre vértices/aristas terrestres
reales L8. Sus extremos empalman en vértices del río canónico; las
aristas originales no se vuelven a dibujar. El corredor sirve de
receptor geométrico solamente a esos tres afluentes, sin alterar el
`MAP_RIVERS3242` nativo ni influir en simulación, geología, navegación,
rutas, propietarios o guardados.

Las confluencias se comprueban sobre el grafo original, con umbral de
38 km desde su punto geográfico y sin cruces de costas o lagos. Las
conexiones del Manas y Teesta ya no deben terminar en el tramo erróneo
de la red canónica. El curso bajo hasta Bangladesh sigue siendo una
aproximación visual mientras no se revise íntegramente el Brahamaputra/
Jamuna y la red de Bangladesh. Ningún cauce representado equivale a
una digitalización hidrológica GPS exacta. El resto de los afluentes
y los delta-canales existentes se conservan sin cambios.


## Continuidad Indo–Ganges–Brahmaputra y Bangladesh (0.41.4)

La auditoría de la malla original L8 mostró desviaciones de ~132 km
en la confluencia **Kosi–Ganges** (Kursela, Bihar) y de ~109 km en
**Panjnad–Indo** (Mithankot). También faltaban conexiones cartográficas
coherentes en el **Jamuna–Padma** (Goalundo) y **Padma–Meghna**
(Chandpur), aunque los sistemas principales canónicos estaban dibujados.

Archivos compartidos en Atlas y ambas entradas de Pruebas:

- `hexategos-pruebas/game/data/geo-bengal-confluences-0414.js`:
  referencias aproximadas de Kursela, Mithankot, Goalundo y Chandpur,
  más rutas de control y nombres según el zoom.
- `hexategos-atlas/atlas-bengal-continuity-0414.js`:
  trazado cacheado y diferido de seis rutas sobre vértices/aristas
  **reales** L8: Ganges medio y Padma, Indo cerca de Mithankot,
  Jamuna, Padma, alto Meghna y Meghna inferior. El último concluye
  en un **vértice litoral nativo** cerca del estuario, sin prolongar
  una recta a mar abierto a través de hexágonos oceánicos.
- `atlas-indian-rivers-0407.js` conserva los 23 afluentes, pero
  el Kosi y el Panjnad ahora usan los vértices de la corrección local
  como receptores geométricos. El resto de cauces y los canales
  deltaicos ya existentes conservan sus reglas.
- El código descarta cualquier arista costera/lacustre indebida y
  evita volver a pintar bordes que pertenezcan a ríos canónicos.
  Las etiquetas Jamuna, Padma y Meghna requieren ruta L8 validada.

Los centros de Goalundo y Chandpur se comparten entre ramas: ambos
terminan/inician en **el mismo identificador de vértice L8**,
no solo en puntos cercanos proyectados en pantalla.

**Importante:** se trata de una corrección **cartográfica visual**,
no de una digitalización hidráulica precisa ni de una sustitución de
la red de ríos de la simulación. La topología jugable, propiedad,
geología, costas, navegación, guardados e IA no cambian. Los cauces
reales del delta son móviles y el Himalaya/L8 limita el detalle a
escala de hexágonos. Las pruebas de malla real requieren las seis
rutas, confluencias compartidas, arista costera terminal y ausencia
de mutaciones; queda pendiente la inspección visual manual y la
prueba de rendimiento con 500 naciones.

## Indochina · geografía física 0.41.5

Fase cartográfica para **Tailandia, Laos, Camboya y Vietnam**, integrada
en `hexategos-atlas/`, `hexategos-pruebas/game/` y
`hexategos-pruebas/toponimos-game/`.

* `geo-indochina-physical-0415.js`: cuatro cauces regionales principales,
  una continuación **visual** del Mekong bajo, diez afluentes,
  cuatro brazos de delta, ocho cordilleras secundarias, diecinueve
  unidades físicas, macroetiquetas para Indochina y ambos golfos y
  el lago Tonlé Sap. El **Mekong y el Salween existentes NO se redibujan**.
  La continuación del Mekong bajo parte de un vértice de su cauce
  canónico y sirve de receptor a Tonle Sap y a los brazos Tiền y Hậu
  (Bassac).
* `atlas-indochina-graph-0415.js`: grafo regional creado
  **solo cuando hace falta**, sobre vertices y aristas de la malla
  original L8 filtrados por L5, sin cruces de aristas costeras.
* `atlas-indochina-routes-0415.js`: resuelve confluencias en vértices
  compartidos y brazos hasta litoral **real L8**, sin dibujar líneas
  cartesianas libres. No pinta aristas del Mekong ya dibujadas
  desde los sistemas canónicos.
* `geo-indochina-landcover-0415.js`: paleta monzónica, bosque tropical,
  meseta seca de Khorat, arrozales del Chao Phraya y delta del Mekong,
  tierras altas de Laos y Annamita. Mezclas espaciales suaves, con
  cache dispersa solo para celdas L8 consultadas.
* `atlas-indochina-water-0415.js`: Tonlé Sap representado como
  **13 hexágonos L8 de tierra nativa recoloreados**, con conexión
  geométrica por vecindad y sin cambiar `L.land`. Es un lago
  **cartográfico visual**; su superficie y forma son esquemáticas,
  no se crean celdas navegables ni puertos.
* Se han integrado zoom/topónimos y controles de la capa física
  en Atlas y los dos juegos, y accesos rápidos a Laos, Mekong,
  Tonlé Sap, Chao Phraya, río Rojo y delta del Mekong.

Las pruebas de regresión de la **malla L8 original de 510 762 celdas**
exigen que los 5 cauces principales/continuación, los 10 afluentes,
los 4 brazos de delta y las 8 cordilleras sean válidos, que las
confluencias sean vértices comunes, que sus finales costeros sean
nativos y que Tonlé Sap tenga celdas contiguas y no navegables.
Ninguna fuente visual modifica geología, propietarios, IA, logística,
simulación o partidas antiguas; tampoco incorpora intervalos separados.

**Advertencias:** los ejes referenciales son aproximados y no datos
hidrológicos vectoriales oficiales; las dimensiones de las
desembocaduras, el Tonlé Sap estacional y los cursos monzónicos
requieren comprobación visual contra referencia cartográfica. La
validación automatizada no prueba por sí sola el FPS de una partida
grande con 350–500 naciones.


## Asia restante · ampliación conjunta física 0.41.6

Esta pasada cartográfica incorpora **Siberia occidental y oriental,
China y Mongolia, Corea y Japón, Sajalín y Kamchatka, Malasia, Indonesia
occidental, Filipinas, Célebes y Nueva Guinea occidental**, compartida
entre Atlas, Hexategos Pruebas y la variante de topónimos.

Se conservan íntegros los sistemas canónicos existentes: Yangtsé,
Huang He, Obi, Yeniséi, Lena, Amur, río de las Perlas, Mekong, entre
otros. No se duplican ni se cambian los datos de propiedad, geología,
recursos, economía, navegación, IA ni los archivos de partidas.

**Arquitectura añadida**
- `geo-asia-completion-0416.js`: 6 zonas físicas, 60 trazados
  secundarios (27 ríos, 33 sistemas montañosos), 49 regiones naturales
  y 6 lagos interiores de referencia, todos con datos geográficos
  aproximados. Se reutilizan los macro-topónimos asiáticos anteriores.
- `atlas-asia-completion-graph-0416.js`: 6 grafos terrestres
  independientes filtrados por grupos L5, creados **bajo demanda**;
  todas las rutas usan únicamente aristas y vértices de la malla
  hexagonal **L8 original**.
- `atlas-asia-completion-routes-0416.js`: rutas almacenadas en caché,
  solo visibles a zoom regional, nunca dibujadas si no se resuelve
  la topología L8. Los ríos han de alcanzar un vértice de litoral
  nativo y no cruzan aristas costeras ni lagos.
- `geo-asia-completion-landcover-0416.js`: paletas continuas,
  con transiciones suaves y caché de celdas consultadas: tundra/taiga
  siberiana, Gobi, estepa de Mongolia, llanuras cultivadas chinas,
  bosque de Corea y Japón, selva y suelos volcánicos tropicales.
- `atlas-asia-completion-water-0416.js`: representación de Baikal,
  Khövsgöl, Hulun, Qinghai, Biwa y Toba mediante la **recoloración
  visual de celdas L8 terrestres preexistentes**, sin crear mares,
  puertos ni vías navegables. Las seis manchas de agua son
  conexas sobre L8 a la escala actual.
- `atlas-regions-0390.js` añade nombres de las zonas naturales,
  relieves secundarios y lagos, con filtro de validación de las
  rutas y controles de visibilidad, sin forzar etiquetas sobre
  cauces que no están dibujados.

**Limitaciones y pendientes de revisión**:
De los 60 trazados, **58 se resuelven** sobre la malla original L8.
Quedan sin trazo cartográfico seguro **río Taz** (la máscara nativa de
la costa queda a cientos de kilómetros de su desembocadura
referencial) y **río Huai** (la hidrografía actual y sus conexiones a
canales/lagos no se deben modelar como una salida marítima directa).
No se han dibujado atajos para ocultar esas diferencias.

Esta actualización es una **primera cobertura continental amplia**
de las regiones restantes, NO un atlas físico totalmente verificado
a nivel local. Las costas siguen exactamente la malla anterior.
La forma de los lagos es aproximada y algunos ocupan solamente una
celda L8. Restan comparación visual por subregiones, ríos menores,
precisión regional de cuencas, rutas de islas pequeñas, mejora de
relieve y medida real de FPS bajo una partida de 500 naciones.


## Criterio uniforme de lagos Europa–Asia (0.41.7)

La revisión visual detectó que los lagos asiáticos 0.40.4–0.41.6
ocupaban hexágonos completos teñidos de azul: a la escala L8,
el lago podía parecer mayor de lo que realmente es.

**Solución:** `atlas-asian-lakes-0417.js` representa **19 lagos** de
Asia Central, Himalaya, Indochina y Siberia/China/Japón siguiendo el
**mismo criterio cartográfico de Europa** (`atlas-europe-lakes-0396.js`):

- Eje geográfico aproximado convertido en una secuencia continua de
  **aristas y vértices terrestres originales L8**.
- Anchura gráfica dependiente de su anchura orientativa en kilómetros,
  del zoom, con margen y límite de píxeles. No se rellenan hexágonos
  enteros, ni se crean polígonos libres ajenos a la malla.
- Los lagos que no alcanzan una arista L8 se marcan con un **punto muy
  pequeño en un vértice**, sin simular una costa que la malla no tiene.
- Cálculo *lazy* según zoom y visibilidad. Cada lago reutiliza su grafo
  local filtrado por agrupaciones L5 y su ruta guardada en caché.
- Etiquetas y la casilla **Lagos** se vinculan al nuevo dibujado;
  un lago no recibe el nombre local si no se ha dibujado.
- Las capas anteriores 0.40.4/0.40.6/0.41.5/0.41.6 conservan su API de
  consulta `isWater` para diagnósticos, pero al estar activa 0.41.7
  **ya no tiñen ningún hexágono completo**.
- El **Caspio** conserva el agua nativa L8 y no se redibuja.
  Todo cambio es estrictamente **visual**: sin alteración de
  `L.land`, rutas marítimas, propietarios, IA, recursos ni guardados.

Los ejes y anchuras son **aproximaciones de escala**, no digitalización
hidrográfica oficial. Una comprobación cartográfica visual en escritorio
y móvil sigue siendo recomendable para ajustar anchuras particulares.
