# Minecraft.js 11.6.4 · Acueductos a varias alturas y corriente visible

## Huecos en el agua elevada

Se reproduce en código una causa de superficies ausentes sobre fondos suspendidos: `voxelWaterColumn` daba prioridad al suelo hidráulico del terreno, que permanece debajo de un puente, frente al fondo explícito del espacio de agua finita. Por ejemplo, agua con fondo 7,5 y profundidad 0,6 se dibujaba entre 0,5 y 1,1 si el terreno inferior estaba en 0,5, en vez de entre 7,5 y 8,1. Esto también afectaba a las consultas de superficie e inmersión y a la separación visual respecto al agua inferior.

Ahora los volúmenes finitos usan su fondo físico explícito. Se conserva el comportamiento anterior para las columnas antiguas sin volúmenes finitos. El desvanecimiento de una celda que se vacía conserva la altura de su superficie anterior, evitando que la película visual salte al terreno de debajo. La representación y las consultas no alteran los volúmenes almacenados.

## Dirección visible

Se añaden estelas claras desplazadas por la dirección horizontal del agua, usando un atributo de velocidad y el reloj compartido del shader. Los volúmenes finitos usan el caudal que cruza sus caras dividido por su profundidad; se promedian las caras de entrada y salida. Los ríos naturales aún no simulados usan su dirección procedural y una velocidad visual nominal. Los lagos quietos, el hielo y la lava no reciben una corriente ficticia.

Los vértices de agua conectada comparten el vector medio de corriente, incluso en bordes de chunk. El agua de capas separadas no se mezcla para este cálculo. Los cambios significativos de dirección o velocidad actualizan los datos durante la publicación existente; no hay reconstrucciones por fotograma ni partículas, mallas añadidas o nuevas pasadas de render. Las uniones planas solo se agrupan cuando la dirección de corriente es compatible. Las rayas de las cascadas cambian su fase para avanzar hacia abajo: antes avanzaban hacia arriba.

Las estelas permanecen activas en calidad baja, con un patrón sencillo. La velocidad visual de los volúmenes finitos se limita a 1,5 bloques/s por legibilidad. No es una medición exacta de velocidad hidráulica ni se han medido sus FPS en un dispositivo real.

## Validación

383 pruebas superadas y compilación de producción. Las nuevas comprobaciones incluyen dos superficies contiguas de un acueducto suspendido con agua a menor altura, ausencia de desplazamiento al vaciarse, inmersión en la capa superior e inferior sin inundar el espacio intermedio, separación de superficies subterráneas, vectores compartidos en las uniones, inversión de corriente, agua quieta, dirección en celdas receptoras sin alterar conservación y generación del shader con fase descendente en cascadas.

Se mantiene el formato 17 y la compatibilidad con las partidas existentes. No se ha recibido una exportación de la construcción concreta: la causa se ha reproducido y corregido en los escenarios de código, pero la desaparición de los dos huecos señalados y el aspecto de las nuevas estelas en esa partida deben verificarse visualmente. Este entorno no permite ejecutar WebGL.
