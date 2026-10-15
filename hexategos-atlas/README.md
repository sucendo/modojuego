# Hexategos Atlas — geografía física independiente (0.39.9)

Atlas reproduce la esfera y las mallas L3–L8 de Hexategos Pruebas. Los datos, las decisiones y las partidas de la simulación no se modifican desde Atlas.

## Clasificación visual compartida

`atlas-label-style-0399.js` establece tres categorías únicas:

- **Agua:** azul para mares, océanos, rías, golfos, fiordos, estrechos, ríos y lagos.
- **Montañas:** marrón para cordilleras, sierras, macizos, montes y sistemas montañosos.
- **Tierra restante:** blanco cálido para regiones, penínsulas, islas, cuencas, valles, llanuras y submesetas.

Los renderizadores de macroetiquetas y de etiquetas regionales usan la misma función. El relevo al cambiar el zoom continúa en 5,55; los macrotopónimos terrestres siguen en mayúsculas y la eliminación de colisiones conserva las cajas ocupadas.

## Refinamiento litoral

- `atlas-coast-data-0399.js`: polígonos terrestres europeos 1:50m, recortados a **99 teselas de 5°** entre longitudes −15° y 50°, y latitudes 30° y 75°. Precisión almacenada: 0,0001°. Los datos originales proceden de **Natural Earth**, dominio público.
- `atlas-coast-0399.js`: representación complementaria exclusivamente visual a partir de zoom 7,4 cuando la malla actual es L8. La capa se dibuja después de los hexágonos y antes de los ríos, montañas y lagos. Los polígonos de mar se pintan solo sobre las celdas canónicamente terrestres y los polígonos de tierra solo sobre celdas canónicamente marítimas. Cada grupo se recorta a los hexágonos visibles.
- El litoral vectorial se traza evitando marcar como costa los bordes artificiales de las teselas.
- La geometría se carga una sola vez; el renderizador solamente reproyecta las teselas visibles cuando la cámara cambia. No hay sondeos globales por fotograma ni temporizadores nuevos.
- `atlas-europe-straits-0397.js`: puede utilizar la consulta geográfica de tierra o mar para validar etiquetas. Si Natural Earth no resuelve un accidente estrecho, su nombre se omite en vez de colocarlo sobre tierra.

**Muy importante:** ninguna conexión marítima dibujada por Atlas es automáticamente navegable en Hexategos Pruebas. No se cambia `L.land`, la vecindad, el relieve compartido, la política, los guardados, la IA ni las rutas del juego.

## Casos de referencia

**Dinamarca:** el Øresund separa Selandia de Escania en la capa de detalle; se preserva la tierra de Selandia. Jutlandia y Fionia siguen gobernadas por la malla original, con refinamiento costero únicamente visual.

**Corinto:** se mantiene continuidad marítima en la entrada desde el golfo de Patras hacia el golfo de Corinto. El istmo de Corinto continúa separando este golfo del Sarónico; no se crea artificialmente un canal.

**Rías:** Vigo y Arousa se representan con una entrada conectada con el Atlántico y del mismo color marino. Otras entradas de Galicia y Europa se resuelven solo cuando el contorno 1:50m las contiene.

**Fiordos:** se mejora el trazado allí donde hay geometría 1:50m suficiente. Algunos fiordos muy estrechos siguen sin resolverse y sus rótulos no se fuerzan.

## Limitaciones deliberadas

1. **Natural Earth 1:50m no es una carta costera de precisión.** Algunas rías, fiordos, estuarios, pequeños islotes y angosturas no se aprecian, especialmente a zoom muy cercano. Un refinamiento futuro debería utilizar recortes de 1:10m o fuentes hidrográficas más detalladas bajo el mismo contrato visual, sin tocar L8.
2. El relieve terrestre de las pequeñas áreas recuperadas sobre celdas marinas utiliza un tono general de tierra, no un inventario detallado de cobertura.
3. La selección y la identificación de hexágonos siguen correspondiendo a la celda L8 original, aunque el litoral visual sea más preciso.
4. Las líneas y el relleno pueden dejar de dibujarse en zonas muy próximas al horizonte del globo para evitar artefactos de proyección.
5. No se ha incorporado un modelo de profundidad ni de conectividad marítima de simulación.

## Pruebas

```bash
node --test hexategos-atlas/tests/cartography-0399.test.cjs
```

Se ejecutan asimismo en GitHub Actions al modificar `hexategos-atlas/**`: [Atlas cartographic regressions](../.github/workflows/atlas-cartography.yml).

Las regresiones comprueban sintaxis, carga de dependencias, colores semánticos, geometría acotada, separación de tierra y mar, máscaras independientes, continuidad marítima (Øresund, Corinto, Vigo y Arousa), conservación del istmo de Corinto y presencia de sistemas de ríos y lagos. **No sustituyen una revisión visual en navegadores de escritorio y móvil** sobre la web desplegada.

Fuente y licencia: [Natural Earth](https://www.naturalearthdata.com/) / [repositorio público](https://github.com/nvkelso/natural-earth-vector).
