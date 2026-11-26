# Minecraft.js 11.6.3 · Continuidad de las cascadas

## Fallo reproducido

Al modificar una cascada, el cauce cercano pasa a simulación finita. El manantial real puede quedar fuera del dominio local. La versión anterior solo reconocía un aporte de frontera si el chunk aguas arriba no estaba cargado; si estaba cargado pero fuera de la simulación, el aporte quedaba a cero y la cascada consumía su reserva inicial hasta secarse. La nueva prueba reproduce ese caso con una cascada cuyo manantial está más allá del radio local y dos chunks cargados.

## Cambio

Se distinguen la geometría cargada y el agua que está realmente bajo simulación. Un tramo natural de río situado aguas arriba y fuera del dominio representa la entrada de su red exterior. Se comprueban la dirección del río, el nivel real del agua y la abertura física en la cara contigua antes de admitir un aporte. Las columnas gestionadas o en reposo no se convierten en entradas externas y los lagos no son fuentes infinitas.

Las entradas se vuelven a comprobar en cada paso: al activarse el tramo vecino desaparece la entrada externa en esa interfaz y se utiliza la transferencia entre volúmenes; al sellarse físicamente el cauce se corta la conexión; al reabrirse vuelve a pasar agua. Los aportes siguen limitados en caudal y altura y se contabilizan en el balance. El estado natural inmutable determina los manantiales; una marca visual de entrada no se promociona a manantial persistente.

## Validación

376 pruebas superadas y compilación de producción. Se prueba una modificación en la base de una cascada, aporte sostenido desde un tramo natural aguas arriba que está cargado pero no simulado, continuidad de descarga en la coronación, cierre y reapertura de una presa, conservación del volumen atrapado bajo la presa y persistencia de la conexión tras guardar y recargar. Las pruebas de canales, acueductos, lagos finitos y fuentes bajo techo continúan pasando.

Se mantiene el formato 17 de las partidas. La simulación sigue siendo local: el río natural no gestionado actúa como condición de frontera para su red exterior; no se calcula toda esa red globalmente. No hay grabación ni partida exportada del nuevo incidente, de modo que la regresión reproducida no acredita resolver todos los posibles problemas visuales descritos como «se ha roto todo». La comprobación visual de la cascada editada y los FPS reales siguen pendientes porque este entorno no dispone de WebGL.
