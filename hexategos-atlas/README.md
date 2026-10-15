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
