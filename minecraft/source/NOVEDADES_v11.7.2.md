# Minecraft.js 11.7.2 · Acumulación con pasos pequeños

La comprobación en el navegador de la vista isométrica detectó que no aumentaba la nieve: cada fotograma aportaba menos de un milímetro y el modelo eliminaba inmediatamente ese volumen todavía invisible. El juego actualiza columnas con pasos más largos y las pruebas anteriores solo cubrían esa ruta.

Se conservan los espesores positivos inferiores al umbral visual y se eliminan únicamente las capas agotadas. No se añade geometría hasta que tienen un espesor visible. Se añade una regresión que compara ocho segundos repartidos en 480 pasos con una actualización de ocho segundos, obteniendo la misma acumulación de nieve.

407 pruebas superadas y compilación de ambas páginas. Se mantienen los controles y el guardado de 11.7.0, la alternativa Canvas de 11.7.1 y el presupuesto de trabajo del juego.
