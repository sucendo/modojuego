# Minecraft.js 11.7.2

Publicado en GitHub Pages con controles táctiles para móviles.

- Joystick izquierdo: desplazarse.
- Arrastrar sobre el mundo: mirar alrededor.
- Saltar: salto. Acción: usar herramienta o colocar el bloque de la barra.
- Pico: volver a minar. Usar / colocar: interactuar o colocar el objeto elegido en el inventario.
- Inventario y Menú: abren sus paneles y detienen el movimiento.
- La barra inferior permite seleccionar objetos con un toque.

Código editable en `source/`: `npm ci`, `npm test`, `npm run build`; copiar `source/dist/` a esta carpeta para actualizar la publicación.

Los controles táctiles usan la misma física y formato de guardado que el escritorio.

Pantalla completa: al pulsar Jugar desde un dispositivo táctil se solicita la pantalla completa. El botón ⛶ permite entrar o salir; también está disponible desde el menú. Si el navegador no lo permite, el juego continúa en la vista normal.

Agua 11.6.0: superficies conectadas con alturas y normales compartidas; transiciones de nivel y aparición/desaparición graduales. La representación no modifica los volúmenes ni el formato de las partidas.

Física del agua 11.6.0: lagos con reserva finita, canales ciegos que se nivelan, presas con aberturas reales, secado por material y cascadas de anchura variable según caudal.

Se conservan las partidas anteriores. Las nuevas exportaciones usan el formato 17 para guardar los volúmenes finitos; las versiones antiguas del juego no pueden abrirlas. Los formatos anteriores, incluido el 16, siguen siendo legibles.

Rendimiento 11.6.1: conexiones hidráulicas reutilizadas, activación gradual de lagos grandes y reconstrucción de una sola malla de agua por fotograma. Solo se actualizan los chunks que comparten vértices afectados; las variaciones de superficie no fuerzan a regenerar todas las cuevas y la nieve.

Canales 11.6.2: las excavaciones tienen prioridad frente a la activación de grandes lagos. Las zonas lejanas se conservan en reposo cuando hace falta liberar simulación, y la exploración automática del lago permanece cerca de la obra. Un canal elevado con fondo y paredes recibe agua por una abertura real y la conserva sobre el terreno vacío.

Cascadas 11.6.3: se conserva el aporte del tramo natural de río situado aguas arriba cuando el manantial queda fuera del dominio local, incluso si ese terreno está cargado. Las entradas se recalculan después de cambiar el cauce; una presa real corta el aporte y su reapertura lo restablece. Los lagos continúan siendo reservas finitas.

Representación 11.6.4: el agua finita de un acueducto usa la altura de su propio fondo, sin desplazarse hacia el terreno o el agua inferiores. Se mantienen separadas las capas al dibujar y detectar inmersión. Las estelas superficiales muestran el sentido de la corriente calculada y las de las cascadas descienden.

Corriente 11.6.5: estelas más largas y contrastadas, con movimiento visual amplificado para corrientes lentas y actualización de direcciones que antes quedaban bajo el umbral. Cuando cesa el flujo se borra su vector anterior. No modifica el caudal ni el volumen físicos.

Rendimiento 11.6.6: los cambios de corriente actualizan atributos de velocidad sin reconstruir las mallas del agua o de las cuevas. El patrón superficial usa dos ondas y evita superponer el cálculo completo de ondulaciones ambientales sobre agua que ya corre. Se reducen las manchas blancas y se mantiene la separación de alturas de los acueductos.

Cascadas y móvil 11.6.7: las caídas naturales ya llegan al nivel inferior como cortinas continuas antes de editar el terreno; solo se estrechan los bordes exteriores de una caída ancha. En juego táctil se muestran las diez casillas en una sola fila y se compactan los controles y relojes en horizontal.

Agua 11.6.8: se restaura la descarga del exceso de agua al mar, contabilizada en el balance. Los lagos estables y los canales siguen teniendo volumen finito. Se reducen las asignaciones temporales al unir superficies y se evita el parpadeo de las cortinas pegadas a las rocas.

Cascadas 11.6.9: el río natural conserva su profundidad parcial desde la primera carga, en lugar de redondearla a cubos completos. El muestreo de las zonas vecinas utiliza la misma profundidad, sin esperar a editar el terreno ni activar simulación adicional.


Evolución 11.7.0, primera entrega: nieve suelta y costra de hielo reversibles sobre el bloque, frío sostenido, deshielo con calor y lluvia, temperatura del clima en el HUD y escoba equipada. En creativo está en Inventario → Herramientas; en supervivencia se fabrica en la mesa con una fila de tres hojas y dos palos debajo del centro. El pico rompe primero la costra y conserva el suelo.

Vista interactiva: `clima.html`. Usa el mismo modelo de capas y el mismo dibujo del juego; permite alternar nieve, helada y sol, seleccionar losetas y probar escoba/pico. El tiempo de esa vista avanza a ×8 y no modifica ninguna partida.

Los guardados nuevos usan formato 18 para conservar hielo y exposición al frío; se siguen importando los formatos 1–17. Esta entrega aún no incluye crecimiento de hierba, escaleras/medios bloques, tejas, nuevos minerales ni lanza.

Vista de prueba 11.7.1: si el navegador no puede crear WebGL, se abre una vista isométrica Canvas con el mismo modelo de nieve y las mismas acciones de escoba/pico. El juego completo mantiene su renderer WebGL.

Nieve 11.7.2: las cantidades todavía invisibles se conservan entre actualizaciones, de modo que los copos se acumulan también con pasos pequeños.
