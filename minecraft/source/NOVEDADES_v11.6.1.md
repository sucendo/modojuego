# Minecraft.js 11.6.1 · Rendimiento del agua

Se corrige una regresión introducida al activar lagos finitos en 11.6.0. La publicación del agua recorría todas las cavidades por cada columna modificada y reconstruía las mallas del chunk y sus ocho vecinos, aunque el cambio estuviera en su interior.

Ahora se eliminan directamente los registros de las cavidades de la columna afectada. Solo se invalidan los chunks que comparten sus vértices, se agrupan peticiones repetidas y se reconstruye como máximo una malla de agua por fotograma. Los cambios exclusivamente superficiales no obligan a regenerar las mallas de cuevas y nieve. La publicación se agrupa cada 0,25 segundos y mantiene la interpolación de alturas en GPU.

La simulación reutiliza su grafo de conexiones hasta que cambia la geometría o el conjunto de chunks cargados. Los lagos completamente mojados resuelven su nivel común con una suma, reservando la búsqueda iterativa para fondos expuestos o techos. Los fotogramas lentos ejecutan como máximo un paso físico, evitando ráfagas de recuperación. Por debajo de diez fotogramas por segundo el tiempo simulado puede avanzar más despacio. La activación inicial importa como máximo unas 70 columnas y continúa en pasos acotados. El límite total sigue siendo de 4096 columnas y 16384 cavidades.

La generación de geometría comparte las muestras de agua, las consultas de bordes y los cálculos de vértices conectados dentro de una reconstrucción. Las cachés se descartan antes de la siguiente reconstrucción para respetar las ediciones del terreno.

## Mediciones de CPU

Escenario reproducible con 4096 columnas, 8192 espacios de aire, cuatro chunks mojados y vecinos cargados; 100 actualizaciones de 0,1 s. Las mallas se cuentan mediante una fachada, sin WebGL:

| Trabajo | 11.6.0 | 11.6.1 |
| --- | ---: | ---: |
| Primera publicación de las columnas | 338 ms | 9,5 ms |
| Actualización media | 32,6 ms | 11,1 ms |
| Reconstrucciones solicitadas/ejecutadas en la secuencia | 213 | 41 |
| Invalidaciones globales de cuevas y nieve por superficie | 14 | 0 |

La secuencia mantiene el mismo volumen final de agua dentro de la tolerancia numérica. Son medidas de este entorno, no FPS ni garantías de rendimiento en el dispositivo del jugador. Ejecutar `node benchmarks/waterPerformance.mjs` desde `source/` para repetir el escenario con la versión actual. Puede pasarse la ruta absoluta de otro `basinHydrology.js` como argumento para comparar.

## Validación y partidas

369 pruebas superadas y compilación de producción. Se comprueban además los vecinos afectados por un cambio interior, lateral o de esquina; la ausencia de barridos globales al publicar; la cola de mallas; la invalidación del grafo al descargar y recargar chunks; el límite de trabajo en un fotograma lento; la activación gradual de un lago grande sin duplicar su reserva; y el uso de muestras compartidas sin unir masas de agua desconectadas.

Se mantiene el formato de guardado 16 y los volúmenes finitos existentes. Las pruebas de canales cerrados, aberturas bajo presas, secado, desplazamiento y recarga siguen pasando. La verificación visual y la medición de FPS reales continúan pendientes porque este entorno no permite ejecutar WebGL.
