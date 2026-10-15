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
