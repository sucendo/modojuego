# Minecraft.js 11.6.2 · Transferencia hacia canales y acueductos

## Causa reproducida

La exploración automática de un gran lago podía consumir las 4096 columnas activas del dominio. Al excavar una orilla después, `seedColumn` rechazaba la nueva columna y el solver no tenía una conexión hacia el hueco. El resultado era una barrera invisible: el agua no entraba aunque la abertura estuviese por debajo del nivel del lago. La prueba de regresión falla en 11.6.1 y recibe agua con esta corrección. No se dispone de la partida exportada del vídeo para verificar que sea su única causa.

## Corrección

La columna editada entra antes que la exploración del lago. Esta exploración se limita a doce bloques alrededor de la obra. Cuando el dominio está concurrido, las zonas a más de veinte bloques se guardan en reposo para liberar espacio; las columnas de agua cercanas al jugador o a la nueva obra pueden volver a activarse. Un dominio pequeño conserva también sus conexiones lejanas, permitiendo transportar agua por un canal que cruza varios chunks cargados.

El agua en reposo mantiene su volumen, su propiedad sobre la columna y su representación. No vuelve a convertirse en una fuente natural al reactivarse. Al cargar un chunk se presentan también los volúmenes en reposo, sin tener que simularlos todos. Las consultas de agua subterránea de una importación se agrupan mediante un índice por columna.

Se mantiene un máximo de 4096 columnas y 16384 espacios de aire activos. El agua fuera del dominio activo queda en pausa: esta versión no simula al mismo tiempo una red ilimitada o terreno descargado. Se admiten hasta 65536 columnas y 262144 espacios de aire guardados. Los nuevos archivos usan el formato 17 para conservar también el centro de actividad; los formatos anteriores, incluido el 16 de 11.6.0/11.6.1, siguen siendo legibles. Los clientes anteriores no abren el formato 17.

## Validación

373 pruebas superadas y compilación de producción correcta. Escenarios nuevos:

- Dominio previo de 4096 columnas: se abre una salida y entra agua en la excavación sin alterar el balance de volumen.
- Guardado y recarga de más de 4096 columnas activas y en reposo, y retorno a una zona que estaba en pausa.
- Canal elevado de 40 bloques, con un fondo suspendido y paredes reales, que cruza un borde de chunk. Recibe agua de un lago finito, alcanza el extremo y se nivela con una diferencia menor de dos centímetros. El espacio bajo el fondo permanece seco.
- Entrada sellada y reapertura del acueducto: la pared bloquea la transferencia y el hueco la permite.
- Validación de archivos con 4200 columnas y conservación de su centro de actividad; lectura del formato 16.

Estas pruebas ejecutan la simulación con geometría voxel y las operaciones reales del motor en Node. No sustituyen una revisión visual con WebGL ni una medición de FPS en el equipo del jugador.
