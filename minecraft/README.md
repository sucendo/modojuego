# Minecraft.js 11.6.0

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

Se conservan las partidas anteriores. Las nuevas exportaciones usan el formato 16 para guardar los volúmenes finitos; las versiones antiguas del juego no pueden abrirlas.
