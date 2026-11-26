# Minecraft.js 11.5.4 · Agua continua y gradual

- Los niveles cercanos y conectados comparten las alturas y normales de sus esquinas, también entre chunks. Se eliminan las paredes transparentes interiores de esos tramos.
- Las superficies planas conservan la unión en rectángulos. Las pendientes se dibujan con una malla conectada. Los saltos verticales, el hielo, los techos llenos y las masas separadas mantienen sus límites.
- La altura pasa progresivamente entre estados durante 0,32 s con un reloj compartido en la GPU. Una nueva actualización parte de la altura que ya se está mostrando, sin reiniciar desde el estado físico anterior.
- El agua que aparece o se seca cambia de opacidad gradualmente. Los extremos de las cascadas acompañan el nivel de sus masas conectadas.
- El agua subterránea utiliza las mismas transiciones y esquinas conectadas, respetando las cavidades superpuestas y sus techos.
- Se reduce la espera de publicación visual de 1,25 s a 0,15 s en la simulación antigua, y de 0,3 s a 0,15 s en presión. Se dejan de ignorar los cambios lentos de presión inferiores a 0,008 por paso. No se altera el paso físico ni se añade volumen para alisar el dibujo.
- Los estados visuales se liberan al descargar cada chunk y no se guardan en la partida.

Validación: 348 pruebas superadas y compilación de producción correcta. Incluye conservación del volumen, continuidad de esquinas, cambios de nivel, bordes entre chunks, cascadas, cavidades apiladas, límites físicos y limpieza de memoria visual.

Limitación: no se ha podido hacer una valoración visual interactiva con WebGL en este entorno. Pendiente comprobar el aspecto y rendimiento en un navegador con gráficos 3D.
