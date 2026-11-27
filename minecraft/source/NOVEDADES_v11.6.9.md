# Minecraft.js 11.6.9 · Cascadas desde el inicio

El dibujo de las cortinas ya estaba compartido por las cascadas naturales y simuladas, pero la columna natural todavía redondeaba cualquier profundidad positiva al metro completo. Por ejemplo, el generador proporcionaba 0,75 m de agua y el dibujo mostraba 1 m. Ese paso seguía dando un aspecto cúbico antes de editar.

Los ríos naturales conservan ahora su profundidad parcial desde la primera carga y usan la misma construcción de superficie y cortina que el agua finita. Se mantiene el límite de un metro para los antiguos cauces naturales excesivamente profundos; una presa simulada puede seguir almacenando más altura. Los volúmenes finitos guardados no cambian y el formato sigue siendo 17.

El muestreo de un vecino aún sin cargar también conserva la profundidad que usa el generador de chunks. Antes omitía ese dato y reconstruía otra altura a partir de `y`, dejando una diferencia de un cuarto de metro al eliminar el redondeo. Cargar la zona vecina mantiene ahora la misma altura inicial.

No se inicia una simulación global de todos los ríos. La representación inicial se obtiene de los datos ya generados, sin un paso de asentamiento ni reconstrucciones periódicas adicionales.

Validación: 398 pruebas superadas y compilación de producción. Se comprueban profundidades naturales fraccionarias, la geometría completa de cascadas naturales y finitas con igual profundidad y caudal, y la carga real del terreno con Three.js y su generador de ruido real. El río real aparece fraccionario antes de ninguna edición y conserva sus alturas del borde al cargar el vecino, con cero columnas de simulación finita activadas. Se actualizan las antiguas expectativas de cubos completos para comprobar la nueva profundidad solicitada. Siguen pasando las pruebas de hielo, fuentes, presas, cascadas anchas, canales, acueductos y partidas guardadas.

La comprobación real de terreno y geometría no ejecuta WebGL ni mide los FPS del móvil. El aspecto final en el dispositivo queda por confirmar.
