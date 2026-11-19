# Minecraft.js v11.5.1 — Agua continua y canales

Corrección sobre v11.5.0 a partir de los problemas observados en el vídeo de la construcción nevada. Conserva visión submarina, nieve, controles y formatos de partida de esa entrega.

## Cambios

- Un río cubierto por un puente o techo conserva un único volumen de agua: la simulación de cavidades deja de crear agua adicional en ese mismo espacio. Las cavidades separadas del río por roca conservan su propio volumen.
- Se eliminan las caras del agua ocultas contra paredes opacas, las superficies dentro del hielo y las láminas horizontales pegadas al techo de un conducto completamente lleno. El cristal permite seguir viendo el agua del tanque.
- Las interfaces entre agua superficial y subterránea también se ocultan cuando ambas masas están en contacto. Su malla se actualiza cuando cambia el agua de la cueva, aunque el nivel del río no haya cambiado.
- Las superficies subterráneas contiguas y al mismo nivel se agrupan en rectángulos. Se mantiene la forma de bloques en las orillas y las caídas reales, evitando divisiones internas y una doble pasada de transparencia.
- El nivel del agua dinámica sigue el volumen real, sin redondearlo a octavos de bloque. El equilibrio hidráulico admite diferencias menores y continúa drenando las láminas poco profundas.
- Agua de río y lago algo menos opaca; el agua subterránea utiliza el mismo movimiento visual suave. El mar y los bloques de hielo conservan su opacidad anterior.

## Comprobaciones

328 pruebas superadas y compilación de producción correcta.

Se ha probado un canal rectangular de ocho por tres celdas, con paredes cerradas: conserva su volumen, se nivela sin oscilaciones y drena al abrir una salida. Las pruebas de malla verifican un conducto cerrado que dibuja solo su boca abierta, la desaparición de esa cara al contactar con una cueva inundada, y una única superficie sobre columnas subterráneas contiguas.

Estas comprobaciones utilizan geometría y escenarios de prueba; no equivalen a una valoración visual de la partida del vídeo. No se ha modificado tu partida. El navegador de revisión no pudo conectar con el servidor local de esta ejecución, por lo que sigue pendiente comprobar el aspecto final en el juego.

## Uso

- Para WAMP u otro servidor HTTP: copiar todo el contenido de `dist/`, con sus subcarpetas, a la carpeta del juego.
- Para desarrollo: `npm ci` y `npm run dev`.
- Validación: `npm test` y `npm run build`.
- `CAMBIOS_v11.5.1.diff` contiene los cambios respecto a v11.5.0. El diff y las novedades de v11.5.0 se conservan como referencia histórica.
- `?waterDebug=1` sigue resaltando los puntos de origen. Para valorar el color normal del agua, abrir la dirección sin ese parámetro.

Primera revisión recomendada: recorrer la construcción desde el mismo ángulo del vídeo y comprobar el agua bajo el techo, contra los ladrillos y en los desniveles. Después abrir y cerrar una salida, y verificar el guardado y la recarga de la partida.
