# Minecraft.js 11.6.6 · Coste de la corriente y patrón superficial

## Revisión

La corriente añadida en 11.6.4 y reforzada en 11.6.5 podía marcar una columna como visualmente modificada solo por cambiar su velocidad, aunque no cambiara apreciablemente su volumen o nivel. La publicación acababa reconstruyendo la malla completa de agua del chunk. Además, el shader de 11.6.5 evaluaba cuatro senos para la corriente y, en calidad media/alta, podía evaluar también el patrón completo de ondulaciones ambientales y sus reflejos. La mayor opacidad de las crestas producía manchas claras.

## Corrección

Se separan las modificaciones de geometría y las de corriente. Cada malla guarda qué columnas físicas contribuyen a sus vértices compartidos. Un cambio de dirección actualiza únicamente el atributo de dos componentes de velocidad, manteniendo posiciones, índices, normales, material y transiciones. Estos atributos se declaran de uso dinámico. Las mallas que ya esperan una reconstrucción por cambios de nivel no reciben además un refresco redundante de corriente.

Las cuevas utilizan una revisión de corriente separada: cambiar el flujo ya no obliga a regenerar su geometría ni la nieve. Las referencias incluyen el fondo físico, evitando mezclar el agua de un acueducto con otra capa inferior. Una edición real, una aparición/desaparición de agua o un cambio de nivel siguen reconstruyendo la superficie cuando corresponde.

El shader usa dos senos para el patrón de corriente, conserva la transparencia y sustituye las manchas blancas por ondulaciones de contraste más moderado. Las ondulaciones ambientales se reservan para agua prácticamente quieta, evitando duplicar el efecto en el agua que ya corre. La física, el formato de guardado 17 y las partidas se mantienen.

## Mediciones en este entorno

- Cambio de corriente en un chunk de 32 × 32 columnas y 4608 vértices, usando BufferGeometry real de Three.js: unos 34,13 ms por reconstrucción en 11.6.5 frente a 0,70 ms por actualización del atributo en 11.6.6, sobre 60 cambios. La nueva ruta conserva los objetos de geometría y sus posiciones.
- Plano de prueba de 640 × 320 píxeles, corriente 0,03 y calidad alta, compilando y renderizando el GLSL real mediante Mesa/EGL/OpenGL ES por software: mediana aproximada de 0,637 ms por dibujo en 11.6.5 y 0,414 ms en 11.6.6, con tres series de 80 dibujos tras calentamiento y sincronización.
- Prueba de simulación con 4096 columnas y 8192 espacios de aire: actualización media de unos 12,5 ms antes y 11,2 ms después en las ejecuciones observadas. Este escenario solicita cambios de nivel y conserva 41 reconstrucciones; la optimización no elimina geometría que sí necesita actualizarse.

Son comparaciones de componentes y no equivalen a FPS del juego, rendimiento de una GPU física ni una garantía de fluidez en el equipo del jugador.

## Validación

388 pruebas superadas y compilación de producción correcta. Nuevas regresiones: un cambio lento de corriente sin variación apreciable de nivel no encola una reconstrucción; invertir el flujo de un acueducto mantiene la identidad de la malla y conserva posiciones, índices y transiciones; cambiar la corriente de una cavidad mantiene la geometría existente. También se comprueba que la aparición de una película fina sobre el umbral visible sigue reconstruyendo su superficie. Se mantienen los escenarios de canales, presas, cascadas, conservación y capas superpuestas.

El shader se compiló, enlazó y renderizó por separado. El patrón conserva cambios entre fotogramas para corrientes lentas y no muestra advección cuando el vector es cero. La apariencia y los FPS dentro de la partida real siguen pendientes de comprobación.
