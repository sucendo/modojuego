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
