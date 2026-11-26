# Minecraft.js 11.6.0 · Lagos finitos, canales y presas

## Cambio de simulación

En las zonas modernas de agua modificadas se sustituye la propagación por ocho niveles decrecientes por volúmenes finitos en espacios de aire reales. Un lago no se considera una fuente infinita: al llenar una excavación, entrega parte de su reserva y baja su nivel. Una relajación hidrostática conservativa nivela las superficies de lago ya conectadas sin saltarse un estrechamiento o un techo.

Las columnas pueden contener varias cavidades superpuestas. Las transferencias usan el fondo, la altura de la abertura y el desnivel del agua, por lo que un hueco bajo en una presa funciona aunque haya bloques encima. Una presa sellada bloquea el paso hasta que el agua alcanza su coronación. Los manantiales reales y las entradas de río desde terreno no cargado son aportes explícitos y contabilizados; los lagos no se rellenan solos.

El agua de una cavidad gestionada no vuelve a cargarse mediante el antiguo sistema subterráneo. Se contabilizan evaporación, infiltración e intercambios con las cavidades externas. El agua desplazada por una construcción conserva su volumen en el espacio libre disponible o en una reserva pendiente; no se descarta por el límite visual.

## Representación

Se mantienen las superficies continuas y las transiciones de 11.5.4. Se admiten películas de agua finita por debajo de 2,5 cm. La cortina de una cascada se estrecha cuando disminuye el caudal calculado y se ensancha con un caudal mayor; no se fuerza a todo el agua en movimiento a ocupar un cubo completo.

## Guardado y límites

Las exportaciones pasan al formato 16, que incluye los volúmenes de los lagos y los canales secos gestionados, evitando rellenarlos al recargar. Los formatos anteriores, incluido el 15, siguen siendo legibles; las versiones antiguas no pueden abrir una exportación 16. Los canales y embalses guardados con la lógica anterior se incorporan al cálculo finito al cargar sus chunks. Los bloques y las construcciones se mantienen.

El dominio es local y acotado: hasta 4096 columnas y 16384 cavidades. Las fronteras no cargadas y los límites de capacidad son cerrados; el agua no desaparece por salir del dominio. No es una simulación global completa de fluidos ni se ha medido todavía el rendimiento en un dispositivo real.

## Validación

362 pruebas superadas y compilación de producción correcta. Escenarios: lago y canal cerrado que se nivelan sin añadir agua; aberturas de distinta altura bajo una presa y presa sellada; evaporación/infiltración gradual; fuentes explícitas; edición repetida de paredes; cavidades presurizadas dentro de su capacidad; guardado y recarga sin rellenar el lago; migración de canales antiguos; manantial bajo techo y cascada estrecha con caudal bajo. Se conserva el balance de volumen dentro de la tolerancia numérica.

La revisión visual del resultado en la partida real sigue pendiente: el navegador disponible en este entorno no permite WebGL.
