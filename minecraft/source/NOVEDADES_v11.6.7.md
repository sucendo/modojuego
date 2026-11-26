# Minecraft.js 11.6.7 · Cascadas naturales y móvil horizontal

## Cascadas antes de editar

La cascada natural debe tener su representación de caída desde que se genera, sin necesitar una edición para activar el solver. Había dos rutas distintas: algunas caídas naturales solo prolongaban la cara de un voxel y el estrechamiento dependía del indicador de agua finita. Además se descartaba la marca `waterfall` del generador al construir las columnas visibles.

Se conserva esa marca en las columnas y en el muestreo de bordes. Las caídas naturales con un tramo receptor real utilizan el mismo cálculo de cortina y estrechamiento que las finitas, independientemente de la revisión de hidrografía del terreno. Los tramos antiguos sin dirección pueden inferir una caída hacia una superficie inferior contigua. Las cascadas naturales declaradas admiten ambas caras aguas abajo cuando el cauce es diagonal, manteniendo la protección histórica del eje dominante para orillas que no están marcadas como cascada.

En una caída ancha se conservan las uniones interiores: solo se estrechan sus bordes exteriores. Cada casilla ya no se contrae por separado, lo que podía dejar rendijas entre cortinas. Se animan como caída únicamente las caras correspondientes a una cascada, no cualquier desnivel lateral.

Esto es representación: no activa la simulación de todos los ríos al entrar en una zona y no altera sus niveles, volúmenes, terreno o manantiales. La anchura de una caída natural aún no simulada utiliza un caudal nominal; cuando se simula, usa su caudal calculado. Los lechos siguen estando formados por bloques. Se mantiene el formato 17 de las partidas.

## Interfaz táctil

La barra tiene un botón de herramienta y nueve casillas: diez en total. La regla táctil seguía reservando nueve columnas, enviando la última casilla a una segunda fila. Ahora son diez columnas dentro de un ancho acotado y se elimina el espacio sobrante.

En horizontal de poca altura se reducen los paneles superiores, se oculta la información redundante de sesión y se recolocan los controles. En pantallas suficientemente anchas los controles laterales bajan sin invadir la barra; en las estrechas permanecen por encima. Se oculta el mensaje de selección con instrucciones de clic derecho durante el juego táctil. El inventario y sus acciones siguen disponibles.

## Validación

392 pruebas superadas y compilación de producción. Se reproduce la cascada natural que no llegaba al nivel inferior sin editar; se comprueba que ahora forma una cortina sin modificar las columnas, que una caída ancha une sus bordes interiores y que una caída natural y una finita con caudal equivalente tienen la misma geometría. También se comprueban los dos ejes aguas abajo de una cascada diagonal declarada y se mantienen las pruebas contra cortinas laterales indebidas.

La revisión de CSS confirma la discrepancia de nueve columnas frente a diez botones y las reglas para horizontal. No se ha podido ejecutar Chromium en este entorno (falta el binario del navegador); la disposición y el uso real de los botones deben confirmarse en el móvil. La verificación visual de la cascada concreta de la captura sigue pendiente.
