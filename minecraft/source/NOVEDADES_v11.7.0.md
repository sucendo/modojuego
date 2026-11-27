# Minecraft.js 11.7.0 · Nieve, hielo y escoba

Primera entrega de la evolución de superficies acordada: el material del suelo se conserva y cambia la capa que lo cubre.

## Nieve y heladas

El clima del juego calcula una temperatura por bioma, hora y altitud, mostrada en el HUD. Una nevada aporta nieve suelta; tras treinta segundos de exposición acumulada bajo cero comienza a formarse una costra de hielo. El hielo sustituye progresivamente parte del espesor de nieve, sin añadir altura ficticia. La nieve y el hielo se conservan mientras hace frío. El calor y la lluvia templada derriten primero la nieve suelta y deshacen la costra con más lentitud. El agua corriente sigue lavando las capas.

La capa helada se dibuja azul grisácea bajo la nieve blanca restante. La temperatura es un modelo del juego, no una previsión real. La evolución se procesa localmente con el presupuesto existente de 48 columnas por paso, solo mientras se juega; no se simulan noches fuera de línea ni todo el mundo.

## Escoba

Escoba visible en la mano, icono, traducciones y receta. En creativo está disponible en el selector de herramientas del inventario. En supervivencia requiere una mesa: tres hojas de árbol en una fila y dos palos debajo del centro. Cada barrido quita hasta seis centímetros de nieve suelta, sin atacar animales ni destruir bloques. La costra resiste la escoba y muestra un aviso para usar el pico. El primer golpe del pico quita la capa helada; otro golpe puede minar el suelo descubierto.

Las capas continúan siendo superficiales: no convierten la tierra en un bloque de agua congelada ni modifican la forma de colisión del suelo.

## Representación y guardado

La nieve y el hielo disponen de mallas separadas del agua subterránea. Las variaciones de exposición al frío no reconstruyen geometría y los cambios visibles de espesor se agrupan en intervalos de cuatro milímetros. La nieve ocupa como máximo dos mallas, una blanca y una helada.

Formato de guardado 18: conserva herramienta, espesor helado y tiempo de frío. Sigue leyendo formatos 1–17 y sus capas antiguas de cuatro valores. Valida que el hielo no exceda el espesor total y limita la exposición acumulada. Versiones anteriores del juego no pueden abrir las nuevas exportaciones.

## Vista de prueba

`clima.html` utiliza los mismos módulos de evolución y representación. No toca la partida. Permite nevar, helar, sacar el sol, elegir una loseta y probar ambas herramientas; el tiempo avanza a ×8 para facilitar la revisión. Vista adaptable a móvil, con rotación y zoom táctil.

## Validación y alcance

406 pruebas superadas y compilación de ambas páginas. Nuevas pruebas: clima de día/noche/altitud, congelación con demora y conservación de espesor, deshielo gradual, barrido y rotura del hielo sin modificar el suelo, pausa, round trip de formato 18 y lectura de 17, validación de datos, entrada real de clic, separación de mallas y conservación de la geometría del agua al barrer.

Esta primera entrega no incorpora aún hierba por humedad y luz, formas de escalera/medio bloque, tejas, oro y gemas ni lanza. La prueba WebGL y los FPS en el móvil deben confirmarse por separado.
