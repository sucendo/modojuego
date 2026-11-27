# Minecraft.js 11.8.1 · Oro y diamante

El oro y el diamante compartían exactamente el mismo motivo de cuatro manchas recoloreadas sobre una roca plana. Se sustituyen por dos diseños distintos, en pixel art de 32×32:

- Oro: agrupaciones irregulares conectadas por vetas, cavidades oscuras, sombras ocres y reflejos cálidos.
- Diamante: cristales agrupados, cavidades azul grisáceo y facetas de varios tonos turquesa.

Ambos utilizan la textura de piedra original como fondo. Se elimina el contorno claro uniforme que parecía una pegatina. Los bloques refinados de oro y diamante también se distinguen: panel metálico biselado frente a superficie cristalina facetada.

Las caras de las dos menas se diferencian rotando las UV del cubo. Se conserva un solo material por mineral y la misma cantidad de triángulos e instancias; no se añaden luces ni pequeños cristales como meshes individuales. No cambian generación, extracción, recetas ni IDs de guardado. Se mantiene el formato 19.

Los recursos v2 tienen nombres nuevos para evitar que la caché del navegador conserve las imágenes anteriores. Inventario y mundo utilizan las mismas imágenes.

`menas.html` muestra las texturas aplicadas a cubos CSS girables y permite alternar menas/bloques refinados. Es una vista de materiales sin WebGL, no una captura del juego con su iluminación.

Validación: render de comparación de las texturas a resolución nativa, suite existente y compilación de producción. Los FPS reales en móvil no se han medido; el cambio no incrementa pases de material ni complejidad geométrica de las menas.
