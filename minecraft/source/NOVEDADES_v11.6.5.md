# Minecraft.js 11.6.5 · Movimiento del agua más visible

Las estelas de 11.6.4 eran demasiado estrechas y tenían muy poco contraste tras mezclarse con el terreno a través del agua transparente. En corrientes lentas la diferencia entre fotogramas podía ser imperceptible. Además, el umbral de publicación de 0,025 bloques/s podía mantener un vector visual a cero aunque hubiese comenzado una corriente lenta.

Se sustituyen por estelas curvas más amplias, con crestas claras y valles de mayor contraste. La opacidad aumenta localmente en las crestas. El desplazamiento visual se amplifica para corrientes lentas: no representa una medición exacta de velocidad física. La dirección sigue procediendo del flujo calculado y la visibilidad se atenúa cerca del reposo. El cambio no mueve la geometría ni modifica volúmenes, caudales o niveles.

El umbral mínimo de cambio del vector visual pasa de 0,025 a 0,003 bloques/s, conservando una tolerancia relativa del 20 %. Una parada limpia explícitamente el vector anterior incluso si está por debajo de esa tolerancia. La publicación y la cola de reconstrucción existentes siguen acotando las actualizaciones. No se añaden partículas, texturas ni pasadas de render.

## Comprobación visual aislada

Se compiló, enlazó y renderizó el GLSL generado por `applyWaterMotion` en OpenGL ES mediante Mesa/EGL por software. El plano de prueba representa ocho por cuatro bloques, mide 640 por 320 píxeles, muestra el agua sobre un fondo uniforme y utiliza calidad baja, sin ondulaciones ambientales. Se compararon imágenes separadas por un segundo con la misma configuración para 11.6.4 y 11.6.5.

| Velocidad de entrada | Cambio medio RGB de 11.6.4 | Cambio medio RGB de 11.6.5 |
| --- | ---: | ---: |
| 0 | 0 | 0 |
| 0,006 | 0 | 4,328 |
| 0,03 | 0,007 | 6,952 |
| 0,3 | 0,514 | 11,453 |

Las diferencias se expresan en niveles de canal de 0 a 255. Esta comprobación confirma que el patrón ahora tiene movimiento y contraste detectables en ese plano, incluso con corriente lenta. No representa el juego completo: no incluye su iluminación, niebla, geometría del canal o FPS del dispositivo del jugador.

## Validación

384 pruebas superadas y compilación de producción correcta. La nueva prueba cubre el refresco de una corriente lenta, la tolerancia a variaciones diminutas y la limpieza del vector cuando se detiene el agua. Se mantienen las pruebas de dirección, conservación, acueductos elevados, capas superpuestas y cascadas.

El formato de partidas sigue siendo el 17. La revisión de la apariencia dentro de la partida real sigue pendiente.
