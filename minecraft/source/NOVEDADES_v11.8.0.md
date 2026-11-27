# Minecraft.js 11.8.0 · Evolución y construcción

## Suelo vivo

La tierra expuesta acumula humedad con la lluvia y desarrolla hierba con luz y temperatura positiva. La hierba vecina acelera el proceso (unos 75 segundos activos frente a 240 sin vecinos). La nieve, los techos y la inundación impiden crecer; una sequía prolongada con calor puede devolver la hierba a tierra. El deshielo aporta humedad. Se conservan humedad y progreso al guardar, y las transformaciones cambian únicamente el material, sin activar de nuevo toda la física del agua.

La evolución usa el presupuesto local existente de 48 columnas por paso. No procesa fuera de línea todo el mapa; los registros están limitados a 16.384 columnas.

## Piezas de construcción

Losas inferiores/superiores y escaleras de piedra o madera; teja de terracota, pendientes y cumbreras. La orientación se codifica en IDs de bloque, sin mapas de rotación paralelos ni cambios al almacenamiento compacto de cinco bytes por voxel. Las piezas usan instancias compartidas y solo hay lotes de tipos presentes en cada chunk.

La selección respeta el espacio vacío y las caras reales de las piezas. La colisión de las escaleras tiene dos escalones; se suben medios bloques automáticamente si hay espacio para la cabeza. Las pendientes se dibujan con su plano real y usan ocho tramos de colisión. Las normales de las caras exteriores se verifican con el descarte normal de caras traseras.

Las escaleras y tejas se orientan según la mirada. La cara inferior coloca losas superiores. Dos losas compatibles, colocadas sobre su cara abierta, completan el bloque de piedra/madera. Las cumbreras se colocan un nivel por encima de los extremos altos de las pendientes, uniendo sus dos vertientes sin junta de medio bloque. La nieve, la costra de hielo y la escoba siguen los peldaños y planos inclinados.

El agua finita sobre losas inferiores utiliza su suelo real, a media altura; se conservan los volúmenes y sus alturas al guardar/cargar. Las escaleras y pendientes siguen siendo barreras de columna para el solver hidráulico: no se simula circulación subvoxel por sus huecos laterales.

## Recursos y herramientas

Vetas deterministas bajo la capa de tierra: oro hasta Y=24, esmeralda hasta Y=16 y diamante hasta Y=10. Nunca cambian alturas ni excavaciones guardadas; los cambios del jugador se aplican después del generador. Se añade una sola consulta de ruido en una cuarta parte de regiones profundas.

El oro entrega oro en bruto, fundible en el horno. Las gemas necesitan pico de hierro para obtener el recurso. Nueve lingotes o gemas se comprimen en un bloque y se pueden recuperar. Los bloques y objetos tienen texturas/iconos y nombres en español, inglés y francés.

Lanza de cuerpo a cuerpo, modelo en la mano, receta con un lingote de hierro y dos palos, y alcance de 4,5 frente a 2,6 de la espada para animales. No se lanza como proyectil. La escoba conserva su funcionamiento y no ataca animales.

En creativo todo se encuentra en el inventario. En supervivencia las recetas aparecen en la guía: losas con tres bloques en una fila; escaleras con seis en escalera; tejas con arena y tierra, pendientes con tejas en escalera y cumbreras con tres tejas en forma de arco.

## Rendimiento

Las superficies planas de nieve se fusionan y las caras internas, incluida la del hielo bajo la nieve, no se dibujan. En el caso uniforme de 32×32: 30.720 → 774 vértices; mediana local de reconstrucción de 8,07 → 3,14 ms. En nieve irregular las ganancias dependen de la superficie.

Un Map indexado por columna conserva su API y evita copiar/filtrar todo el registro subterráneo cada vez que se lee una columna nueva. En una prueba con 16.000 registros ajenos, veinte consultas nuevas pasan de 68,7 a 0,095 ms (sin incluir la creación inicial del índice). No son medidas de FPS ni del teléfono del usuario.

## Guardado y validación

Formato 19: nuevos IDs, lanza, humedad/progreso del suelo y suelos de agua a medias unidades. Se importan los formatos 1–18. Versiones anteriores del juego no abren exportaciones nuevas.

427 pruebas superadas: geometría real de Three.js contra selección analítica en las 18 variantes, orientación, unión de losas, paso por huecos, escalones sin atravesar techos, cumbreras, nieve sobre las nuevas formas, cultivo y sombra/inundación, recetas y herramientas, generación real de minerales, obtención de recursos, agua sobre losas, persistencia y validación. Se mantiene la suite de agua, presas y acueductos. Compilación de producción de juego y vista de clima.

La prueba final WebGL y los FPS en móvil quedan pendientes. La vista de clima conserva su alternativa isométrica si no hay WebGL.
