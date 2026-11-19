# Minecraft.js v11.5.0 — Inmersión, cavidades y nieve

Partida de código: ZIP MinecraftJS_v11.4.7_puentes_tuneles_equilibrio (1).zip.
Esta entrega parte exclusivamente de esa versión.

## Cambios

- Visión submarina azul verdosa, con menor visibilidad y más oscuridad según la profundidad. Se consulta el agua real en la posición de la cámara, incluidos los volúmenes subterráneos. Al salir se recuperan los valores atmosféricos anteriores: color, niebla, cielo y transparencia del fondo. No cambian movimiento, gravedad, salto ni controles.
- Cavidades con suelo y techo propios: puede existir un río superficial, roca entre medias y agua debajo. La roca compacta y los bloques de construcción impiden la filtración directa; la arena filtra más que la tierra. No se añade un material grava que el catálogo actual no contiene.
- Agua de las cavidades que circula entre columnas conectadas. Los conductos llenos transmiten presión y el agua puede subir al otro lado de un túnel hasta equilibrar niveles. Los caudales y el paso temporal están limitados.
- Cursos naturales poco profundos dentro de las cuevas existentes, según una cota freática determinista. Excavar una cavidad nueva no crea por sí mismo otra fuente.
- Entradas superficiales y subterráneas limitadas. Las cavidades drenan hacia un acuífero profundo representado por código; los suelos de construcción sellados no tienen ese drenaje natural. El agua que regresa a un río superficial sale del dominio local. El agua extra superficial tiene evaporación, filtración y una recesión programada. Los ríos naturales de la base mantienen su nivel de equilibrio.
- Las transferencias desde un embalse de presión descuentan volumen del embalse. Los volúmenes pequeños se conservan también al guardar; no se descartan silenciosamente.
- Nieve visual de hasta 18 cm sobre superficies expuestas. Se acumula durante nevadas, también en terreno normal; bajo un techo la capa queda sobre el techo. El agua corriente elimina esa capa y transforma el bloque de suelo nevado en hierba normal. La lluvia reduce la capa acumulada. Una nevada posterior puede cubrir de nuevo el terreno lavado.
- Agua subterránea y nieve se guardan y exportan con cada partida. Se conservan las construcciones y la compatibilidad de lectura de las partidas anteriores.

## Uso

Desarrollo: `npm ci`, después `npm run dev`.
Comprobaciones: `npm test` y `npm run build`.

Se incluye `dist/` ya compilado. Para WAMP u otro servidor estático, copiar **su contenido completo**, incluidos assets, textures, models y fonts, a una carpeta servida por HTTP. No abrir index.html mediante file://.

`CAMBIOS_v11.5.0.diff` contiene el diff de fuentes y pruebas respecto a la base adjunta.

## Comprobación manual recomendada

1. Entrar en un río o lago y sumergir la cámara; salir y comparar la visión con la base.
2. Desviar un río sobre suelo nevado; comprobar que aparece terreno normal. Durante una nevada, observar la formación gradual de nieve en superficies secas.
3. Abrir una entrada lateral a una cueva y observar la entrada progresiva del agua; sellarla y comprobar que se detiene el aporte.
4. Comparar arena, tierra y piedra entre río y cueva: la piedra debe sellar.
5. Guardar/exportar, volver a abrir la partida y comprobar agua, nieve y construcciones.

## Alcance y validación

Es una aproximación hidráulica para un juego de bloques, con reservas naturales de nivel establecido y drenajes profundos explícitos; no es una simulación completa de fluidos. El aire atrapado, la temperatura del agua, la erosión y la flotación del jugador quedan fuera de esta entrega. La nieve nueva es una capa visual, sin cambiar las colisiones.

La simulación adicional trabaja cerca del jugador y con presupuestos de procesamiento y almacenamiento; no ejecuta un llenado global del mundo. Las cámaras construidas con un suelo sellado pueden llenarse si les abrimos una entrada de agua. Los tramos fuera de la zona activa conservan su estado y reanudan su simulación al volver.

Se han añadido pruebas de equilibrio en conductos conectados, conservación de volumen, filtración estable en simulación prolongada, nieve, presión, importación/exportación y restauración exacta de la visión exterior. La suite completa y la compilación se verifican en esta entrega. La valoración visual interactiva sigue pendiente: el entorno de ejecución impidió arrancar Chromium.
