# Minecraft.js 11.6.8 · Desembocaduras y coste de las cascadas

La reconstrucción local de una partida real con el generador, semilla, bloques y volúmenes guardados mostró que su cascada ya estaba simulada. No bastaba con corregir la forma del agua natural.

## Desembocadura

El solver anterior reconocía como salida el agua natural de nivel del mar (lake sin stable ni source). El solver finito nuevo conservaba las entradas aguas arriba, pero había perdido esa salida. Ahora los tramos exteriores que originalmente eran mar descargan gradualmente solo el exceso sobre su nivel natural. El volumen descargado se registra en el balance. No se rellena agua consumida ni se crean salidas sobre terreno originalmente seco, lagos estables, conductos cubiertos o acueductos por encima del mar. La clasificación se reconstruye desde el terreno al cargar, sin cambiar el formato 17.

## Representación y coste

El cálculo de los vértices compartidos conserva referencias a las cuatro columnas y evita copiar sus propiedades y crear colecciones intermedias en cada consulta. Mantiene las mismas alturas, normales, corrientes y separaciones entre capas.

La publicación visual se espacia a 0,35 segundos, interpolada durante 0,4 segundos; la física sigue a 0,1 segundos. La tolerancia de nivel es de 4 mm y las caídas se invalidan por anchura de cada borde, incluyendo los cambios de dirección. La aparición de películas finas sigue actualizando geometría al cruzar el umbral visible. Las ediciones conservan su publicación inmediata. Se aplica un sesgo de profundidad a la superficie para evitar el parpadeo coplanar donde la cortina toca una pared de roca.

## Validación y límites

395 pruebas superadas y compilación de producción. Nuevas regresiones: descarga por encima del nivel marino, conservación incluyendo descarga, ausencia de relleno automático, lagos estables finitos, recarga de partidas y ausencia de desagües creados al inundar terreno seco. Continúan pasando las pruebas de canales nivelados, presas, acueductos, continuidad de vértices y caídas naturales.

La partida real se reconstruyó localmente en nueve chunks, sin incorporar sus datos al repositorio. Tras cuatro segundos simulados: 83 columnas marinas, descarga de 65,95 unidades y error de balance inferior a 1e-9. Se verificaron 233 bordes con caída y ninguno carecía de superficie receptora. El coste de reconstrucción de mallas descendió en las repeticiones locales; estas mediciones de CPU no representan los FPS de un teléfono. Se inspeccionó la geometría mediante un render de diagnóstico, con materiales simplificados. Queda por confirmar el resultado completo y los FPS en el navegador móvil.
