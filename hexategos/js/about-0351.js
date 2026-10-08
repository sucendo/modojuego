'use strict';

// HEXATEGOS 0.35.2 · Acerca de / historial de versiones.
(() => {
  const HISTORY=[
    {
      version:'0.38.1',
      date:'Octubre 2026',
      title:'Núcleo diplomático coherente y contrainteligencia',
      current:true,
      summary:'Se corrigen las incoherencias detectadas tras 0.38.0: los tratados dejan de ser un único estado, la IA ya no recibe doble penalización de suministro y embajadas/espionaje adquieren memoria, coste y defensa.',
      changes:[
        'Comercio, no agresión y alianza pasan a mantenerse como acuerdos independientes aunque el motor antiguo conserve un estado diplomático de compatibilidad.',
        'Puede suspenderse el comercio sin romper automáticamente un pacto de no agresión o una alianza.',
        'Las rutas comerciales y la IA comercial comprueban el acuerdo comercial explícito, no solo el estado diplomático legado.',
        'Las ciudades IA dejan de aplicar dos veces la escasez material al calcular estabilidad.',
        'Una embajada rechazada entra en un periodo de espera antes de poder solicitarse de nuevo.',
        'Las redes de espionaje tienen mantenimiento económico y pueden degradarse si no se financian.',
        'Se añade contrainteligencia nacional con niveles e inversión desde Inteligencia.',
        'La contrainteligencia reduce la velocidad de infiltración, el éxito de operaciones y aumenta el riesgo de detección.',
        'Las IA desarrollan también contrainteligencia y pueden añadir acuerdos comerciales aunque ya exista otro tratado político.',
        'Guardados antiguos migran automáticamente los tratados previos a la nueva estructura separada.'
      ]
    },
    {
      version:'0.38.0',
      date:'Octubre 2026',
      title:'Embajadas, inteligencia y estabilidad nacional',
      current:false,
      summary:'La diplomacia pasa a requerir contacto y embajadas, el comercio depende de consentimiento real, la inteligencia descubre recursos y la estabilidad interna reacciona a escasez, ocupación y operaciones clandestinas.',
      changes:[
        'Nueva ficha de nación contextual con Diplomacia, Comercio, Inteligencia, Militar y Rutas.',
        'Al seleccionar un territorio aparece acceso directo a la ficha de la nación propietaria.',
        'Los tratados positivos requieren una embajada previa; una nación puede aceptar o rechazar la apertura diplomática.',
        'Nuevo alcance diplomático progresivo mediante I+D, con mayor radio para establecer embajadas y relaciones formales.',
        'Las rutas internacionales requieren embajada y acuerdo comercial, y solo mueven recursos que la nación exportadora esté realmente dispuesta a vender.',
        'La ficha comercial muestra excedentes, déficits, restricciones y posibles reservas ocultas según la calidad de la inteligencia.',
        'Se pueden desplegar redes de espionaje y realizar operaciones abstractas de sabotaje alimentario, energético, industrial, agitación laboral y agitación nacionalista.',
        'Las operaciones tienen riesgo de fracaso y detección, con deterioro de opinión, confianza e incluso expulsión diplomática.',
        'Cada ciudad mantiene estabilidad, nacionalismo y acumulación de escasez sin añadir un barrido global por frame.',
        'La falta prolongada de suministro puede causar huelgas, disturbios y rebeliones; las ciudades conquistadas conservan un factor nacionalista más alto.',
        'Una ciudad ocupada con nacionalismo alto y estabilidad extrema puede restaurar a su nación de origen.',
        'Las IA usan la misma lógica de embajadas, comercio e inteligencia de forma muestreada.',
        'El nuevo estado se conserva en guardado local y en archivos portables .hexategos.'
      ]
    },
    {
      version:'0.37.24',
      date:'Octubre 2026',
      title:'Información enlazada al diagnóstico completo',
      current:false,
      summary:'La acción INFORMACIÓN del territorio abre correctamente la ficha completa de suministro en lugar de limitarse al porcentaje final.',
      changes:[
        'INFORMACIÓN · TERRENO Y SUMINISTRO se enlaza directamente con el diagnóstico completo.',
        'Se mantienen logística física, materiales, producción, consumo, balance, flujo comercial y recomendaciones.'
      ]
    },
    {
      version:'0.37.23',
      date:'Octubre 2026',
      title:'Diagnóstico desde Información',
      current:false,
      summary:'La ficha de suministro detallada se abre ahora directamente desde el botón INFORMACIÓN del territorio seleccionado.',
      changes:[
        'El botón INFORMACIÓN · TERRENO Y SUMINISTRO abre una ficha con estado, suministro combinado, logística física y material.',
        'La ficha muestra producción, consumo, balance, flujo comercial, rutas activas y rutas bloqueadas.',
        'Se mantiene el diagnóstico automático del cuello de botella y las recomendaciones concretas.',
        'No se añade un segundo botón ni un nuevo temporizador.'
      ]
    },
    {
      version:'0.37.22',
      date:'Octubre 2026',
      title:'Diagnóstico de suministro',
      current:false,
      summary:'Cada territorio explica ahora por qué está abastecido, en tensión, bajo o crítico y qué acción concreta puede corregir el problema.',
      changes:[
        'El suministro seleccionado muestra producción, consumo, balance y flujo comercial de su nodo o red conectada.',
        'Se distingue explícitamente logística física, disponibilidad material y suministro combinado.',
        'El diagnóstico identifica el cuello de botella principal: aislamiento, capacidad logística, escasez de alimentos, combustible o bienes, producción insuficiente o rutas bloqueadas.',
        'Las recomendaciones cambian según la causa real: mejorar carreteras, abrir rutas comerciales, aumentar industria, importar recursos o restablecer tránsito.',
        'El cálculo reutiliza los nodos y componentes logísticos existentes y solo agrega la red seleccionada, evitando barridos globales por frame.',
        'La API HexategosTradeLogistics0370 expone supplyDiagnosis(cell) para depuración y futuras decisiones de IA.'
      ]
    },
    {
      version:'0.37.21',
      date:'Octubre 2026',
      title:'Mapa de suministro material',
      current:false,
      summary:'El mapa de suministro existente pasa a combinar conectividad logística y disponibilidad real de recursos, mostrando de forma progresiva la degradación de islas, enclaves y redes aisladas.',
      changes:[
        'El mapa de suministro v3.25.3 se conserva como base; no se crea una capa paralela.',
        'El porcentaje final combina el suministro logístico físico con la disponibilidad material de la red local.',
        'Cada componente viario mantiene una cobertura agregada de alimentos, materias primas, combustible, bienes y material militar.',
        'Los nodos exactos usan su propio stock; el resto de celdas conectadas usa la cobertura de su red viaria.',
        'Las zonas sin red local usan la cobertura nacional como último nivel de referencia material.',
        'Alimentos, combustible y bienes actúan como cuellos de botella principales del suministro utilizable.',
        'Una ruta marítima bloqueada deja de reponer el puerto remoto; sus stocks bajan y el mapa cambia progresivamente de verde a amarillo, naranja y rojo.',
        'La leyenda del mapa de suministro pasa a cuatro estados: abastecido, tensión, bajo y crítico.',
        'Al seleccionar una zona propia en modo Suministro se muestra logística física, disponibilidad material y desglose de los cinco recursos.',
        'El contexto del mapa muestra además alimentos, combustible y bienes cuando la vista de suministro está activa.',
        'Los frentes usan el mismo porcentaje combinado, de modo que una escasez material real puede degradar operaciones militares.',
        'El cálculo sigue siendo cacheado y se limita a nodos/componente viario; no se añade ningún trabajo global por frame.'
      ]
    },
    {
      version:'0.37.20',
      date:'Octubre 2026',
      title:'Economía material física y patrullas navales visibles',
      current:false,
      summary:'Cinco recursos reales pasan a producirse, consumirse y transportarse por la red logística; las patrullas navales vuelven a salir de puerto de forma fiable y sus triángulos ganan presencia visual.',
      changes:[
        'Se añaden cinco recursos: alimentos, materias primas, energía/combustible, bienes industriales y material militar.',
        'Solo capitales, ciudades, industrias, puertos y extremos logísticos mantienen inventario; no existe stock por hexágono.',
        'El territorio genera producción primaria que se deposita entre los nodos logísticos de cada nación.',
        'Las industrias consumen materias primas y combustible para producir bienes y material militar.',
        'Las ciudades consumen alimentos, combustible y bienes; capitales y puertos añaden demanda y capacidad estratégica.',
        'Las carreteras redistribuyen stocks dentro de cada componente conectado sin crear nuevas entidades.',
        'Las rutas comerciales mueven excedentes reales hacia déficits y registran cargamento por tipo de recurso.',
        'El valor económico de una ruta depende también de su flujo material real.',
        'La escasez de recursos reduce producción económica y reclutamiento para jugador e IA.',
        'Economía muestra stock, capacidad y cobertura de los cinco recursos y cada ruta enseña su cargamento.',
        'Los puntos comerciales reflejan la intensidad de cargamento sin aumentar el límite global de puntos.',
        'Los stocks del jugador y la cobertura nacional se guardan de forma compatible con partidas anteriores.',
        'Se corrige el estado Infinity que podía impedir que una flota volviera a iniciar una patrulla.',
        'Las patrullas locales se amplían ligeramente y siguen siendo ciclos cerrados puerto → mar → puerto.',
        'El triángulo de las flotas aumenta ligeramente de tamaño, comparable al punto comercial marítimo.'
      ]
    },
    {
      version:'0.37.19',
      date:'Octubre 2026',
      title:'Patrullas navales cerradas y movimiento continuo',
      current:false,
      summary:'Las patrullas de jugador e IA dejan de mostrar su trayectoria, salen visualmente desde su puerto, recorren un ciclo local y regresan al mismo puerto sin saltos entre ticks.',
      changes:[
        'Las rutas internas de patrulla no se dibujan para ninguna nación.',
        'Cada patrulla se genera únicamente cuando la flota está en la salida marítima de su puerto base.',
        'La excursión de patrulla usa un recorrido de ida y regreso garantizado que termina exactamente en la misma salida del puerto.',
        'El retorno reutiliza el recorrido de ida en sentido inverso, evitando una búsqueda marítima adicional y protegiendo el rendimiento.',
        'Visualmente una flota en reposo de patrulla se dibuja en su puerto, aunque la simulación permanezca en la celda marítima adyacente.',
        'La salida se interpola puerto → mar y el regreso mar → puerto.',
        'La interpolación de cada tick parte de la posición visual actual, evitando saltos al actualizar la posición lógica.',
        'La duración visual se sincroniza con el tick naval de 1,4 s.',
        'Tras completar una patrulla hay una breve estancia en puerto antes de la siguiente salida.',
        'La lógica se aplica igual a flotas del jugador y de la IA.'
      ]
    },
    {
      version:'0.37.18',
      date:'Octubre 2026',
      title:'Salida de vista de ruta y persistencia aclarada',
      current:false,
      summary:'La vista de una ruta comercial en el mapa incorpora una salida explícita sin modificar la ruta ni su actividad.',
      changes:[
        'Ver en mapa reutiliza la barra contextual para mostrar origen y destino de la ruta enfocada.',
        'El botón de la barra cambia temporalmente de Cancelar a Salir.',
        'Salir elimina únicamente el resaltado visual y devuelve la barra a su estado normal.',
        'Cerrar una ruta enfocada limpia también el modo de visualización.',
        'Cargar o reiniciar una partida nunca conserva un foco visual obsoleto.',
        'El foco visual no se serializa: solo las rutas comerciales reales se guardan.',
        'Las rutas siguen persistiendo en el guardado local y en los archivos .hexategos.'
      ]
    },
    {
      version:'0.37.17',
      date:'Octubre 2026',
      title:'Gestor de rutas comerciales',
      current:false,
      summary:'Economía incorpora un gestor completo de rutas físicas con origen, destino, estado, flujo, riesgo, tránsito, suministro interior y navegación directa al mapa.',
      changes:[
        'La lista de Economía deja de truncarse a 12 rutas y muestra todas las rutas comerciales del jugador.',
        'Cada tarjeta muestra origen y destino reales, tipo marítima/terrestre, comercio interior o socio y estado operativo.',
        'Se muestran ingreso por segundo, flujo estimado de mercancías, distancia y riesgo naval cuando corresponde.',
        'Las rutas marítimas interiores indican si están aportando abastecimiento a su red logística.',
        'Los países de tránsito aparecen directamente en la ficha de ruta.',
        'Se mantienen las acciones de solicitar tránsito, contrabando y cerrar ruta.',
        'Nueva acción Ver en mapa: cierra Sistemas, centra el trazado y deja la ruta resaltada.',
        'El resaltado funciona tanto para rutas terrestres como marítimas y permanece hasta seleccionar otra ruta o cerrarla.',
        'La pestaña Naval incorpora también Ver en mapa para sus rutas marítimas.',
        'No se modifica la lógica de creación de rutas estabilizada en 0.37.16.'
      ]
    },
    {
      version:'0.37.16',
      date:'Octubre 2026',
      title:'Integración real de rutas comerciales con el controlador final',
      current:false,
      summary:'Se corrige la causa raíz que impedía seleccionar destinos: el comercio estaba conectado a un controlador de interacción antiguo y no obtenía el permiso exigido por el controlador táctil final.',
      changes:[
        'Se audita de extremo a extremo el flujo de rutas comerciales desde el menú hasta el guardado.',
        'El controlador v3.28.2 exige un permiso de destino emitido por beginTargetFromDialog3282; la ruta comercial ahora usa ese mismo flujo.',
        'La selección comercial deja de llamar directamente a setInteractionMode3244, que era rechazada por el controlador estricto.',
        'El destino comercial se integra en handleInteractionTarget3245, que es el manejador final realmente utilizado por pick3245.',
        'Se mantiene handleInteractionTarget3244 únicamente como alias de compatibilidad.',
        'El ajuste de clic al icono del puerto entrega el destino directamente al manejador 3245.',
        'Un destino inválido mantiene el modo comercial activo y muestra el motivo.',
        'Un destino válido reutiliza createPlayerSeaRoute0370, la misma lógica que ya funcionaba con el listado antiguo.',
        'La creación conserva ruta marítima, permisos, riesgo, guardado, caché económica, suministro interior y renderizado.',
        'No se modifica la IA comercial ni el tráfico terrestre.'
      ]
    },
    {
      version:'0.37.15',
      date:'Octubre 2026',
      title:'Selector comercial desbloqueado y ajuste exacto a puertos',
      current:false,
      summary:'Crear una ruta comercial deja de depender de una lista precalculada de destinos y el clic del mapa se ajusta al puerto real para evitar seleccionar una casilla vecina.',
      changes:[
        'RUTA COMERCIAL se habilita desde cualquier puerto propio mientras no se haya alcanzado el límite de rutas.',
        'Entrar en el modo de destino ya no depende de seaCandidates0370 ni de su caché de puertos.',
        'El puerto destino se valida únicamente cuando el jugador lo pulsa en el mapa.',
        'El selector permanece activo si se pulsa una casilla inválida.',
        'En modo comercial el clic se ajusta al puerto visible más cercano antes de usar la selección genérica del mapa.',
        'Esto evita que un icono de puerto termine resolviéndose como una celda terrestre vecina a zoom intermedio.',
        'Si la creación falla, el juego informa de límite global, límite nacional o falta de acceso marítimo navegable.',
        'Las rutas entre puertos propios y las rutas con socios comerciales siguen usando la misma lógica marítima y de suministro.',
        'No se añade trabajo por frame: la búsqueda del puerto cercano solo se ejecuta cuando el jugador hace clic durante el modo comercial.'
      ]
    },
    {
      version:'0.37.14',
      date:'Octubre 2026',
      title:'Selector comercial nativo y camiones origen-destino',
      current:false,
      summary:'La selección de destino comercial se integra en el modo nativo del mapa y el tráfico por carretera deja de recorrer tramos aislados para representar viajes completos entre nodos logísticos.',
      changes:[
        'RUTA COMERCIAL usa ahora el mismo interactionMode nativo que carreteras y transporte de tropas.',
        'El clic de destino se procesa directamente por handleInteractionTarget3244, sin observar cambios secundarios de updatePanel.',
        'Una casilla inválida mantiene activo el modo de selección y explica el motivo.',
        'Un puerto válido crea la ruta, cancela el modo de destino y conserva toda la lógica de tránsito y permisos.',
        'Los camiones domésticos ya no se generan a partir de cada array independiente de roads3212.',
        'Se identifican capitales, ciudades, industrias y puertos como nodos logísticos reales.',
        'Los nodos que comparten red viaria se conectan mediante caminos completos calculados sobre el grafo de carreteras.',
        'Los puntos comerciales recorren la ruta completa origen-destino atravesando todos los tramos necesarios.',
        'La nación del jugador mantiene prioridad visual y más rutas completas dentro del presupuesto.',
        'Las IA usan el mismo modelo origen-destino de forma acotada para proteger el rendimiento.',
        'No se añaden nuevos timers ni aumenta el presupuesto global de puntos.'
      ]
    },
    {
      version:'0.37.13',
      date:'Octubre 2026',
      title:'Logística interior y tráfico propio visible',
      current:false,
      summary:'Las rutas marítimas entre puertos propios funcionan como puentes de suministro y el tráfico doméstico del jugador deja de quedar oculto por el volumen de tráfico de cientos de IA.',
      changes:[
        'Las rutas marítimas pueden seguir creándose entre dos puertos de la misma nación.',
        'La selección de destinos propios amplía su exploración hasta 24 puertos por nación para no omitir islas o enclaves secundarios.',
        'Una ruta marítima interior activa abastece directamente sus dos puertos.',
        'Las ciudades e industrias conectadas por carretera a esos puertos reciben también un suelo de suministro marítimo.',
        'Esto permite mantener y desarrollar islas o territorios separados del núcleo continental mediante puertos y carreteras locales.',
        'El tráfico doméstico del jugador tiene prioridad dentro del presupuesto visual global.',
        'Con cientos de IA, sus carreteras ya no pueden expulsar los camiones del jugador de la lista de candidatos dibujables.',
        'Los tramos propios suficientemente largos muestran hasta dos puntos comerciales para mejorar su legibilidad.',
        'No aumenta el límite global de puntos ni se añaden nuevos temporizadores.'
      ]
    },
    {
      version:'0.37.12',
      date:'Octubre 2026',
      title:'Simbología clara de transportes',
      current:false,
      summary:'La forma del marcador identifica de inmediato el tipo de unidad o tráfico, independientemente de su nación.',
      changes:[
        'Todo transporte comercial se representa mediante puntos circulares.',
        'Los camiones y el tráfico comercial terrestre mantienen su representación como puntos.',
        'Los barcos comerciales pasan de triángulos a puntos circulares.',
        'Los transportes de tropas permanecen como rombos.',
        'Las flotas militares permanecen como triángulos.',
        'Los colores continúan identificando la nación propietaria u operadora.',
        'Las rutas marítimas comerciales siguen diferenciándose mediante su línea azul clara discontinua.',
        'No cambia ninguna lógica de simulación, velocidad, comercio, navegación ni rendimiento.'
      ]
    },
    {
      version:'0.37.11',
      date:'Octubre 2026',
      title:'Franjas comerciales maduras y destino de rutas en el mapa',
      current:false,
      summary:'Las rutas terrestres activas siguen consolidando territorio y generando desarrollo; las rutas comerciales marítimas del jugador eligen su puerto de destino directamente sobre el mapa y los marcadores comerciales ganan mucha más presencia.',
      changes:[
        'Una IA ya no deja de consolidar un corredor cuando la ruta terrestre entra en estado activo.',
        'Cada cierto número de servicios revisa el trazado físico real de sus rutas terrestres activas o de contrabando.',
        'La IA puede ocupar terreno neutral inmediatamente adyacente a la carretera comercial si existe apoyo territorial suficiente.',
        'La expansión lateral de consolidación no crea automáticamente una carretera en cada nuevo hexágono, evitando redes artificialmente densas.',
        'Las franjas comerciales maduras pueden generar nuevas ciudades o industria con la misma lógica de suministro, seguridad y separación de 0.37.9.',
        'El mantenimiento de rutas activas está muestreado y limitado para conservar rendimiento con cientos de naciones.',
        'Desde un puerto propio, RUTA COMERCIAL entra ahora en modo de selección de destino directamente sobre el mapa.',
        'El destino puede ser un puerto propio o un puerto de una nación con derechos comerciales compatibles.',
        'Si se pulsa una casilla inválida, el modo de selección permanece activo y muestra el motivo sin cancelar la orden.',
        'El botón Cancelar de la barra superior abandona la selección de ruta comercial.',
        'Los barcos comerciales y los puntos/camiones terrestres se han aumentado de tamaño de forma claramente visible.',
        'Las rutas visuales de patrulla siguen completamente ocultas; las rutas que aún se ven en flotas corresponden a órdenes activas como interceptación, regreso, bloqueo, escolta o traslado.'
      ]
    },
    {
      version:'0.37.10',
      date:'Octubre 2026',
      title:'Tráfico comercial legible y velocidad física constante',
      current:false,
      summary:'Las patrullas navales ya no dibujan su trayectoria; barcos y camiones comerciales son más visibles y su velocidad deja de depender de la longitud total de la ruta.',
      changes:[
        'Las flotas en orden de patrulla mantienen su movimiento y su ruta interna, pero no dibujan ninguna línea de trayectoria.',
        'Los marcadores de barcos comerciales aumentan de tamaño para ser legibles desde zoom 25.',
        'Los marcadores de camiones y tráfico terrestre comercial aumentan moderadamente de tamaño.',
        'El tráfico interior por carretera también gana algo de tamaño manteniendo los límites adaptativos de puntos.',
        'La velocidad visual deja de medirse como porcentaje de ruta por segundo.',
        'Los barcos comerciales usan una velocidad base constante expresada en hexágonos por segundo.',
        'Los camiones comerciales usan una velocidad base constante expresada en hexágonos por segundo.',
        'Una ruta larga tarda proporcionalmente más en recorrerse que una corta: la longitud ya no acelera artificialmente el vehículo.',
        'Se añade un punto de extensión para que futuras tecnologías modifiquen la velocidad por nación y tipo de transporte sin rehacer el sistema.',
        'El multiplicador tecnológico actual es 1.0 para todas las naciones; la progresión tecnológica queda para una versión futura.',
        'No se añaden nuevas entidades, pathfinding ni temporizadores; el cambio es visual y de parametrización del movimiento comercial.'
      ]
    },
    {
      version:'0.37.9',
      date:'Octubre 2026',
      title:'Corredores económicos consolidados',
      current:false,
      summary:'Las IA dejan de dibujar pasillos territoriales mínimos para comerciar: alternan avance y consolidación lateral y convierten los corredores largos en ejes con ciudades e industria.',
      changes:[
        'El proyecto comercial ya no premia únicamente avanzar por la línea más corta hacia el socio.',
        'Aproximadamente uno de cada tres microturnos de expansión neutral se dedica a ensanchar y consolidar el corredor.',
        'La consolidación prioriza hexágonos con apoyo de dos territorios propios o junto a una carretera existente.',
        'La IA evita desviarse demasiado del eje entre las dos capitales y penaliza montaña, alta montaña y hielo.',
        'Los corredores antiguos de una sola casilla también pueden ir rellenando flancos conforme vuelven a ser atendidos.',
        'Cada seis ciclos de corredor se reserva la posibilidad de crear un nodo económico en lugar de seguir conquistando.',
        'Las nuevas ciudades del corredor solo aparecen sobre carretera, con suministro suficiente, lejos de otras ciudades y fuera de contacto enemigo inmediato.',
        'Las industrias de corredor se apoyan preferentemente en ciudades del propio eje y respetan separación respecto a otros polos industriales.',
        'La construcción ordinaria de la IA puede seguir desarrollando después esos nuevos núcleos con el mismo sistema que el resto del país.',
        'Solo se realiza una conquista o una construcción relevante por servicio: nunca se expande una franja completa de golpe.',
        'Se reutilizan frontier, aiNationalSamples3275 y cachés existentes; no hay barridos globales nuevos ni setInterval adicional.',
        'Las partidas anteriores siguen siendo compatibles: el estado de fase del corredor es efímero y se recalcula al cargar.'
      ]
    },
    {
      version:'0.37.8',
      date:'Octubre 2026',
      title:'Tráfico, barcos y flotas con identidad nacional',
      current:false,
      summary:'El tráfico y las unidades navales usan el color real de cada nación; los puntitos aparecen solo desde zoom 25 y las rutas marítimas conservan la línea azul claro discontinua.',
      changes:[
        'Los puntitos de tráfico terrestre aparecen únicamente a partir de zoom 25.',
        'El tráfico interior ya no se calcula solo para el jugador: las carreteras de todas las naciones generan actividad visual de su propio color.',
        'Las rutas comerciales terrestres internacionales muestran tráfico usando los colores de las naciones implicadas.',
        'Los barcos comerciales marítimos usan el color de la nación operadora.',
        'Las flotas militares y los convoyes navales muestran el color propio de su nación en lugar del azul/rojo genérico.',
        'Las flotas y convoyes solo aparecen a partir de zoom 15.',
        'El avance naval discreto de 1,4 s se interpola visualmente por todos los hexágonos recorridos para eliminar saltos.',
        'Las rutas marítimas comerciales, incluidas IA↔IA, mantienen la línea azul claro discontinua.',
        'Las rutas de movimiento naval conservan el mismo azul claro discontinuo para mejorar legibilidad.',
        'Las patrullas siguen mostrando solo su tramo inmediato y no toda la ruta completa.',
        'El render prioriza elementos realmente visibles en pantalla y mantiene límites de rutas y puntos.',
        'No se añade ningún temporizador ni escaneo mundial adicional por frame.'
      ]
    },
    {
      version:'0.37.7',
      date:'Octubre 2026',
      title:'Corredores comerciales y geopolítica del tránsito',
      current:false,
      summary:'Las IA ya no esperan conexiones comerciales perfectas: intentan crear físicamente el corredor mediante expansión neutral, permisos de tránsito, alternativas, contrabando o escalada diplomática.',
      changes:[
        'Si dos IA quieren comerciar y existe espacio neutral entre ellas, intentan expandirse progresivamente hacia el socio comercial.',
        'La expansión comercial ocupa un único hexágono neutral por ciclo y prolonga la carretera cuando la red ya llega al frente de expansión.',
        'Si un tercer país bloquea el corredor, las IA solicitan permiso de tránsito usando el sistema diplomático existente.',
        'Con permiso concedido se construye físicamente el corredor por el territorio de tránsito y se crean las conexiones terrestres/aduanas necesarias.',
        'El corredor se construye paso a paso: como máximo una conquista, carretera o aduana relevante por servicio.',
        'Si se deniega el tránsito, primero se busca una ruta alternativa por otros Estados.',
        'Las personalidades oportunistas o agresivas pueden intentar contrabando, pero solo reutilizando carreteras ya existentes en el país intermedio.',
        'Las negativas repetidas deterioran opinión y confianza y pueden romper tratados.',
        'Solo después de varias negativas, y si existe suficiente superioridad estratégica, una IA agresiva puede escalar la disputa del corredor hasta la guerra.',
        'El jugador nunca recibe una declaración automática de guerra desde este subsistema de corredores; esa relación sigue bajo la diplomacia general.',
        'Las negativas y el estado estratégico se conservan en guardado local y en archivos .hexategos.',
        'El sistema reutiliza muestras de frontera, cachés viarias y el scheduler existente para proteger el rendimiento con hasta 500 naciones.'
      ]
    },
    {
      version:'0.37.6',
      date:'Octubre 2026',
      title:'Conexión terrestre y aduana fronteriza',
      current:false,
      summary:'Las carreteras de dos países distintos ya no se conectan automáticamente al tocarse: la unión fronteriza se construye de forma explícita mediante una conexión terrestre/aduana.',
      changes:[
        'Cuando una carretera propia llega a un hexágono fronterizo junto a una carretera extranjera compatible aparece CONEXIÓN TERRESTRE.',
        'El botón construye físicamente un tramo de carretera entre ambos hexágonos y establece la aduana fronteriza.',
        'La conexión cuesta 12 de oro, equivalente al coste mínimo de un tramo viario.',
        'Solo aparece con países que mantienen una relación cooperativa con derechos comerciales.',
        'El simple contacto visual de dos carreteras de países distintos ya no basta para formar una red comercial común.',
        'Jugador e IA: la IA puede llevar su carretera hasta tu frontera, pero espera a que el jugador construya la conexión terrestre.',
        'IA e IA: cuando ambas redes llegan al mismo paso fronterizo, una de las IA puede construir explícitamente la conexión y pagar su coste.',
        'Tras construir la aduana, el sistema intenta materializar inmediatamente la ruta comercial terrestre si el resto de requisitos se cumplen.',
        'Las conexiones se guardan de forma independiente y también dentro de archivos .hexategos.',
        'No se añade ningún temporizador ni escaneo global adicional.'
      ]
    },
    {
      version:'0.37.5',
      date:'Octubre 2026',
      title:'IA civil y comercio físico entre naciones',
      current:false,
      summary:'Las IA recuperan un desarrollo civil continuo y convierten los tratados comerciales en carreteras y rutas físicas reales, incluso cuando deben encontrarse en una frontera.',
      changes:[
        'La diplomacia recibe un microturno garantizado cada pocos segundos de campaña y ya no depende de que sobre tiempo del scheduler militar.',
        'Los acuerdos de comercio, no agresión y alianza mantienen derechos comerciales dentro del modelo diplomático de estado único.',
        'Una IA con tratado comercial detecta la frontera con su socio y puede prolongar su carretera hasta un paso común.',
        'Si el jugador lleva una carretera hasta la frontera de un socio comercial, la IA prioriza encontrarse con esa carretera desde su lado.',
        'Dos IA comerciales eligen de forma determinista un paso fronterizo compatible y convergen hacia él sin crear rutas mágicas.',
        'Cuando ambas redes quedan físicamente unidas se intenta crear inmediatamente la ruta terrestre comercial real.',
        'Antes de abrir nueva infraestructura, la IA intenta reconectar ciudades, industrias o puertos propios que hayan quedado sin carretera.',
        'Un watchdog civil solo actúa si una nación lleva unos 30 segundos de campaña sin progresar pese a tener déficit y recursos, relajando moderadamente los criterios de emplazamiento.',
        'El watchdog evita conteos globales en cada servicio: el diagnóstico más caro solo se ejecuta en IA realmente estancadas.',
        'No se añade ningún temporizador nuevo; se reutilizan el tick económico, el scheduler IA y las cachés existentes.'
      ]
    },
    {
      version:'0.37.4',
      date:'Octubre 2026',
      title:'Retirada manual de carreteras',
      current:false,
      summary:'Las carreteras propias pueden abandonarse directamente desde el hexágono para cortar la red viaria y provocar aislamiento logístico de forma deliberada.',
      changes:[
        'Al seleccionar un hexágono propio atravesado por carretera aparece ABANDONAR CARRETERA.',
        'La acción elimina todos los tramos de carretera que llegan al hexágono seleccionado y no devuelve oro.',
        'Si el hexágono era un nudo de varias carreteras, el corte afecta a todas las conexiones que pasan por ese punto y conserva los tramos válidos a ambos lados.',
        'La red viaria, suministro, comercio, economía y planificación IA se invalidan y recalculan inmediatamente.',
        'El sistema de degradación 0.37.3 se audita tras el corte, de modo que una ciudad, industria o puerto recién aislado empieza su ciclo normal de degradación.',
        'La representación sigue usando la misma estructura roads3212, por lo que el cambio queda guardado con total compatibilidad con las partidas existentes.',
        'No se añade ningún temporizador ni recorrido del mapa completo: la retirada solo procesa las rutas de carretera cuando el jugador ejecuta la acción.'
      ]
    },
    {
      version:'0.37.3',
      date:'Octubre 2026',
      title:'Degradación y abandono por aislamiento',
      current:false,
      summary:'Ciudades, industrias y puertos necesitan comunicaciones reales: si quedan aislados pierden actividad, se vuelven grises, se abandonan y finalmente desaparecen.',
      changes:[
        'Una infraestructura aislada dispone de 60 segundos de campaña de margen antes de empezar a degradarse.',
        'Entre 60 y 180 segundos pierde progresivamente color y rendimiento económico.',
        'Desde 180 segundos queda abandonada: gris y con una actividad residual mínima.',
        'A partir de 300 segundos se desvanece gradualmente y a los 360 segundos desaparece del mapa.',
        'Cualquier carretera conectada al hexágono de una ciudad, industria o puerto ya cuenta como ruta terrestre interna y evita su degradación; no necesita además una ruta comercial formal.',
        'Los puertos y complejos portuarios también pueden mantenerse comunicados mediante una ruta marítima activa.',
        'La capital está protegida como nodo básico de comunicaciones para no degradarse al comenzar una partida sin carreteras.',
        'Si las comunicaciones se restauran antes de la desaparición, la infraestructura recupera su estado y producción.',
        'Todas las naciones IA están sujetas exactamente a las mismas reglas.',
        'Si desaparece un puerto-base, sus flotas no se borran ni se teletransportan: quedan sin base hasta que el sistema naval asigne u ordene un traslado válido.',
        'El cálculo reutiliza los componentes de carretera ya cacheados por el sistema comercial y el reloj económico existente; no añade otro temporizador periódico.',
        'El estado de degradación se conserva en guardado local y en archivos .hexategos manteniendo compatibilidad con partidas anteriores.'
      ]
    },
    {
      version:'0.37.2',
      date:'Octubre 2026',
      title:'Tráfico terrestre visible y patrulla limpia',
      summary:'El tráfico terrestre se hace más visible y adopta el color del jugador, las carreteras se afinan y las flotas en patrulla solo enseñan el tramo inmediato de su recorrido.',
      changes:[
        'Los puntos terrestres aparecen desde un zoom más cercano y son más fáciles de distinguir.',
        'El tráfico propio utiliza el color de la nación del jugador, con un pequeño contorno para conservar contraste sobre cualquier terreno.',
        'Las rutas terrestres comerciales del jugador usan el mismo color que su nación.',
        'Las carreteras son ligeramente más estrechas para no dominar visualmente el mapa.',
        'Una flota en patrulla sigue moviéndose por su circuito local, pero en el mapa solo se dibuja el siguiente tramo inmediato y no toda la ruta prevista.',
        'Se mantienen los límites adaptativos de tráfico y el sistema de caché para no penalizar el rendimiento.'
      ]
    },
    {
      version:'0.37.1',
      date:'Octubre 2026',
      title:'Tráfico interior y movimiento naval visible',
      summary:'Las carreteras propias muestran circulación incluso antes de abrir comercio exterior, los puertos de una misma nación pueden enlazarse por mar y las flotas patrullan e interceptan de forma visible y coherente.',
      changes:[
        'El tráfico terrestre interior aparece sobre las carreteras propias que conectan la red de ciudades, industrias, capital y puertos.',
        'Los puntos de tráfico se interpolan suavemente entre hexágonos y solo se dibujan con zoom cercano, con límites adaptativos para proteger el rendimiento.',
        'Dos puertos propios pueden abrir una ruta comercial marítima interior, con un valor menor que el comercio exterior.',
        'Las rutas marítimas visuales empiezan y terminan en el propio icono/hexágono del puerto, no en la loseta de mar adyacente.',
        'Las IA también pueden abrir rutas marítimas interiores entre sus puertos, dentro de los mismos límites de rutas.',
        'Patrulla hace que la flota recorra un circuito corto alrededor de su puerto-base y vuelva, sin usar búsquedas A* globales.',
        'Interceptar busca transportes enemigos; si no hay uno cerca, la flota realiza una salida hacia una zona enemiga y regresa a su base.',
        'Las salidas de intercepción reutilizan la ruta de vuelta y limitan las búsquedas marítimas nuevas a una por intervalo naval.',
        'La hostilidad naval entre IA respeta ahora el estado diplomático real: una zona enemiga es una nación en guerra.'
      ]
    },
    {
      version:'0.37.0',
      date:'Octubre 2026',
      title:'Rutas físicas y puertos-base',
      summary:'El comercio deja de ser principalmente abstracto: los ingresos importantes necesitan rutas terrestres o marítimas reales, mientras que cada flota pertenece a un puerto-base concreto y puede trasladarse a otro.',
      changes:[
        'Las relaciones comerciales por sí solas mantienen un intercambio residual, pero el enriquecimiento importante exige infraestructura física.',
        'El comercio terrestre aparece cuando las redes de carreteras de dos socios quedan conectadas físicamente.',
        'Si una ruta terrestre cruza una tercera nación necesita permiso de tránsito; como alternativa puede abrirse contrabando con menos beneficio y riesgo diplomático.',
        'Las rutas marítimas se abren directamente entre puertos y comprueban tránsito, bloqueos, riesgo naval e incidentes con terceros.',
        'Desde cada puerto se puede transportar tropas, construir una flota y abrir una ruta comercial marítima.',
        'Cada flota conserva un puerto-base concreto; si lo pierde queda sin base hasta trasladarse a otro puerto propio.',
        'Las IA utilizan las mismas rutas, permisos, puertos y reglas de contrabando que el jugador.',
        'Con zoom cercano aparecen indicadores de tráfico moviéndose sobre carreteras y rutas marítimas sin crear vehículos simulados.',
        'El sistema limita rutas, búsquedas marítimas, reconstrucciones de carreteras y elementos animados para mantener el rendimiento con hasta 500 naciones.'
      ]
    },
    {
      version:'0.36.2',
      date:'Octubre 2026',
      title:'Construcción IA más humana',
      summary:'Las naciones dejan de sembrar industria por todo el territorio y pasan a desarrollar núcleos urbanos, polos industriales concentrados y corredores que se parecen mucho más a las decisiones de un jugador.',
      changes:[
        'Los objetivos industriales se reducen a una densidad proporcional al tamaño del país, calibrada contra el patrón de construcción humano.',
        'Una industria nueva necesita un emplazamiento urbano o logístico: ciudad, puerto o conexión viaria.',
        'Al alcanzar el número razonable de polos industriales, la IA mejora instalaciones existentes en lugar de abrir nuevas fábricas.',
        'Los planes regionales comprueban los objetivos reales justo antes de construir para evitar ejecutar tareas antiguas que ya han quedado cubiertas.',
        'Ciudades, puertos y carreteras mantienen objetivos limitados y coherentes con la extensión del país.',
        'Las partidas existentes no pierden edificios: las naciones ya sobreindustrializadas dejan de extender la alfombra y pasan a consolidar lo construido.',
        'La corrección conserva el scheduler y las optimizaciones de 500 naciones de la versión 0.36.1.'
      ]
    },
    {
      version:'0.36.1',
      date:'Octubre 2026',
      title:'Rendimiento para 500 naciones',
      summary:'La escala de 150/250/350/500 naciones mantiene todas las capacidades del motor, pero reparte el cálculo mediante presupuestos temporales, cachés compartidas y menos barridos globales.',
      changes:[
        'El scheduler de IA deja de basarse solo en número de países por tick y añade un presupuesto real de milisegundos adaptable al dispositivo y al coste de render.',
        'Las IA que no caben en el presupuesto se aplazan manteniendo rotación justa, sin perder sistemas ni capacidades.',
        'Los conteos territoriales y la condición de victoria reutilizan snapshots compartidos en lugar de recorrer 510.762 celdas una vez por nación.',
        'El desgaste diplomático deja de ejecutar una búsqueda cuadrática completa por cada país en cada tick económico.',
        'Comercio y número de guerras reutilizan la red diplomática activa en vez de revisar continuamente las 500 relaciones de cada nación.',
        'El snapshot económico agrupa cambios cercanos para no volver a recorrer el planeta tras cada conquista individual.',
        'La caché visual de propietario reutiliza buffers y elimina cientos de asignaciones temporales por celda LOD.',
        'La pestaña de diplomacia evita reconstruir cientos de filas DOM si no ha cambiado nada.'
      ]
    },
    {
      version:'0.36.0',
      date:'Octubre 2026',
      title:'150 / 250 / 350 / 500 naciones reales',
      summary:'HEXATEGOS amplía el propio motor de naciones hasta 500 actores completos. No hay entidades secundarias: todas utilizan el mismo territorio, capital, economía, diplomacia, infraestructura, guerra, frentes y flotas.',
      changes:[
        'El selector de nueva partida pasa a 150, 250, 350 o 500 naciones.',
        'Las 500 plazas son facciones reales del motor original y usan owner6, capitales y todos los sistemas existentes.',
        'Cinco perfiles internos de IA —conformista, comercial, defensiva, oportunista y localista— modifican únicamente la forma de decidir, nunca las capacidades disponibles.',
        'Los perfiles pueden evolucionar durante los primeros 60 minutos de campaña; los cambios son frecuentes al principio y progresivamente más raros.',
        'La IA completa se conserva para todas las naciones, pero su ejecución se reparte mediante un scheduler escalonado para evitar procesar 500 planificadores en el mismo tick.',
        'Los snapshots mundiales se comparten y se limitan los barridos globales repetidos.',
        'La red diplomática conserva las relaciones completas, pero limita el trabajo activo a contactos relevantes y usa guardado compacto para la escala 500.',
        'Las partidas antiguas de 16, 25, 35 o 50 naciones siguen siendo reconocidas al cargarse.'
      ]
    },
    {
      version:'0.35.6',
      date:'Octubre 2026',
      title:'Infraestructura combinada y desarrollo IA',
      summary:'Las ciudades pueden convivir visualmente con industria y puerto, desaparece el marcador de capital histórica y las naciones IA desarrollan una red urbana e industrial acorde a su tamaño.',
      changes:[
        'La capital histórica permanece en la lógica de nacionalismo, pero deja de dibujarse como una segunda estrella sobre el mapa.',
        'Ciudad, industria y puerto pueden coexistir en un mismo hexágono sin ocultarse al acercar el mapa.',
        'Con zoom pequeño prevalece el icono de ciudad para mantener la lectura territorial.',
        'Los objetivos de ciudades, industrias, carreteras y puertos de la IA escalan con el tamaño real de cada nación.',
        'Las naciones grandes dejan de quedar limitadas a 11 ciudades y 10 industrias.',
        'La fortificación deja de absorber el excedente económico cuando el país todavía está claramente infradesarrollado.',
        'Las partidas ya iniciadas invalidan sus planes de desarrollo y adoptan los nuevos objetivos sin reiniciar el mundo.'
      ]
    },
    {
      version:'0.35.4',
      date:'Octubre 2026',
      title:'Capitales navegables y ciudades reales',
      summary:'La clasificación se convierte en una herramienta de navegación y la construcción de ciudades empieza a usar topónimos reales según la geografía del hexágono.',
      changes:[
        'Pulsar una nación en la clasificación centra el globo en su capital actual.',
        'Las filas de clasificación son accesibles también con teclado.',
        'Atlas offline de 140.607 localidades reales basado en GeoNames cities1000.',
        'Al construir una ciudad se proponen localidades que caen realmente dentro del hexágono.',
        'Si el hexágono no contiene una localidad registrada, se muestran localidades reales cercanas con su distancia.',
        'El atlas se carga por franjas geográficas y queda en caché para no penalizar el arranque.',
        'El selector de nombre usa el diálogo común movible.'
      ]
    },
    {
      version:'0.35.3',
      date:'Octubre 2026',
      title:'Paneles movibles',
      summary:'Se establece como norma de interfaz que los diálogos y paneles flotantes nuevos puedan reposicionarse sin perderse fuera de la pantalla.',
      changes:[
        'El panel del mapa geopolítico ahora se puede arrastrar.',
        'La ventana Acerca de también puede reposicionarse.',
        'Las posiciones se recuerdan entre aperturas.',
        'El movimiento queda limitado al viewport para evitar paneles inaccesibles.',
        'Se crea una API reutilizable para que los próximos diálogos adopten el mismo comportamiento.'
      ]
    },
    {
      version:'0.35.2',
      date:'Octubre 2026',
      title:'Mapa geopolítico',
      summary:'La nueva inteligencia geopolítica se convierte en información visible y comprensible directamente sobre el mundo.',
      changes:[
        'Nuevo modo de mapa GEOPOLÍTICA junto a Político, Terreno y Suministro.',
        'Colores por relación con la nación observada: rival, guerra, alianza, no agresión, comercio y estado tapón.',
        'Visualización del radio de influencia de la nación seleccionada.',
        'Líneas estratégicas para rivalidad, contención de potencias, estados tapón y alianzas.',
        'Panel para jugadores con doctrina, esfera, rival y prioridades actuales.',
        'Seleccionar territorio de otra nación cambia inmediatamente el análisis geopolítico.',
        'Diagnóstico avanzado oculto para desarrollo, sin controles visibles para el jugador.'
      ]
    },
    {
      version:'0.35.1',
      date:'Octubre 2026',
      title:'Acerca de e historial',
      summary:'La portada incorpora una sección permanente para consultar la evolución del proyecto sin entrar en una partida.',
      changes:[
        'Nuevo botón «ACERCA DE…» junto a Opciones.',
        'Historial visual de versiones y mejoras destacadas.',
        'Panel adaptable a escritorio y móvil, con cierre por botón, Escape o clic exterior.',
        'La documentación de la evolución queda accesible desde el propio juego.'
      ]
    },
    {
      version:'0.35.0',
      date:'Octubre 2026',
      title:'Doctrina geopolítica',
      summary:'Las naciones dejan de reaccionar solo a oportunidades tácticas y empiezan a mantener intereses geopolíticos persistentes.',
      changes:[
        'Cinco doctrinas: expansionista, marítima, defensiva, comercial y continental.',
        'Rival estratégico, esfera de influencia y evaluación de amenazas.',
        'Equilibrio de poder frente a potencias dominantes y lógica de estados tapón.',
        'Memoria diplomática de guerras, rupturas y agravios.',
        'Objetivos explicables: salida al mar, contención, dominio regional, recuperación de capital o comercio.',
        'Lectura geopolítica integrada en Sistemas → Diplomacia.'
      ]
    },
    {
      version:'0.34.2',
      date:'Septiembre 2026',
      title:'Estabilización de escala',
      summary:'La ampliación a partidas grandes se convierte en una base fiable y comprobable.',
      changes:[
        'Generación exacta de 16, 25, 35 o 50 naciones.',
        'Recuperación determinista cuando faltan ubicaciones de capital.',
        'Auditoría de capitales, propietarios inactivos y capacidad diplomática.',
        'Métricas específicas para partidas de 50 naciones.',
        'Smoke tests automáticos y GitHub Actions para proteger compatibilidad.'
      ]
    },
    {
      version:'0.34.1',
      date:'Septiembre 2026',
      title:'Escala 16 / 25 / 35 / 50',
      summary:'HEXATEGOS deja de estar limitado a la escala clásica y permite elegir la densidad política de cada partida.',
      changes:[
        'Capacidad permanente de 50 plazas de nación.',
        'Selector de 16, 25, 35 o 50 naciones al crear partida.',
        'Los bucles de IA, economía y guerra trabajan solo con las naciones activas.',
        'Migración de partidas antiguas de 16 naciones.',
        'Migración de matrices diplomáticas 16×16 a la nueva capacidad 50×50.'
      ]
    },
    {
      version:'0.34.0',
      date:'Septiembre 2026',
      title:'Red diplomática escalable',
      summary:'La diplomacia empieza a tener en cuenta proximidad y relevancia geopolítica para poder crecer sin analizar todas las parejas constantemente.',
      changes:[
        'Contactos directos, regionales, estratégicos y activos.',
        'Prioridad para fronteras, distancia entre capitales, puertos y relaciones existentes.',
        'Límite de contactos neutrales relevantes por nación para controlar el coste de IA.',
        'Enemigos comunes y vecinos de vecinos amplían la red diplomática.',
        'Diagnóstico de contactos y coste de reconstrucción.'
      ]
    },
    {
      version:'0.33 · Stable Rebuild 8',
      date:'Septiembre 2026',
      title:'Reconstrucción estable',
      summary:'Se consolida una base estable después de varias iteraciones de interfaz y rendimiento.',
      changes:[
        'Mensajes y propuestas trasladados a la sección correcta de Sistemas.',
        'Aceptar y rechazar propuestas actúa sobre la diplomacia real.',
        'Opciones queda reservada a configuración.',
        'Reconstrucción por capas estables para reducir congelaciones y regresiones.',
        'Sin MutationObserver ni nuevos temporizadores periódicos en las capas de estabilidad.'
      ]
    },
    {
      version:'0.33 · Web Modular',
      date:'Septiembre 2026',
      title:'La base moderna de HEXATEGOS',
      summary:'Primera etapa pública del proyecto con la arquitectura modular que sirve de base a las versiones actuales.',
      changes:[
        'Pantalla de inicio ligera y carga del mundo bajo demanda.',
        'Configuración de nueva partida y elección de capital.',
        'HUD móvil y controles reposicionables.',
        'Clasificación movible y redimensionable.',
        'Notificaciones diplomáticas y de conflicto.',
        'Zoom móvil ampliado y núcleo táctil estabilizado hasta la rama interna v3.30.15.'
      ]
    },
    {
      version:'Etapa previa',
      date:'Antes de 0.33',
      title:'OpenFront → HEXATEGOS',
      summary:'El proyecto nace como un experimento de estrategia geopolítica global y evoluciona hasta adquirir identidad propia como HEXATEGOS.',
      changes:[
        'Mundo esférico dividido en celdas hexagonales/geodésicas.',
        'Expansión territorial, guerras y bots controlados por IA.',
        'Ríos y cordilleras ligados a la geometría del mapa.',
        'Puertos, barcos, economía, diplomacia y múltiples sistemas estratégicos.',
        'Guardado de partidas y trabajo continuo de rendimiento para mapas de gran detalle.',
        'El nombre HEXATEGOS consolida la mezcla de hexágonos, estrategia y geopolítica.'
      ]
    }
  ];

  function esc0351(v){
    return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function versionHTML0351(v){
    return '<article class="aboutVersion0351'+(v.current?' current0351':'')+'">'+
      '<div class="aboutVersionTop0351">'+
        '<h3>HEXATEGOS '+esc0351(v.version)+(v.current?'<span class="aboutBadge0351">ACTUAL</span>':'')+'</h3>'+
        '<time>'+esc0351(v.date)+'</time>'+
      '</div>'+
      '<p><b>'+esc0351(v.title)+'</b> · '+esc0351(v.summary)+'</p>'+
      '<ul>'+v.changes.map(x=>'<li>'+esc0351(x)+'</li>').join('')+'</ul>'+
    '</article>';
  }

  function ensurePanel0351(){
    let overlay=document.getElementById('aboutOverlay0351');
    if(overlay)return overlay;

    overlay=document.createElement('div');
    overlay.id='aboutOverlay0351';
    overlay.className='aboutOverlay0351';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=
      '<section class="aboutCard0351" role="dialog" aria-modal="true" aria-labelledby="aboutTitle0351">'+
        '<header class="aboutHead0351">'+
          '<div class="aboutHeadText0351">'+
            '<h2 id="aboutTitle0351">ACERCA DE HEXATEGOS</h2>'+
            '<p>Global Geopolitical Strategy · versión 0.37.3</p>'+
          '</div>'+
          '<button id="aboutClose0351" class="aboutClose0351" type="button" aria-label="Cerrar">×</button>'+
        '</header>'+
        '<div class="aboutBody0351">'+
          '<p class="aboutIntro0351">HEXATEGOS es un juego de estrategia geopolítica global sobre una esfera geodésica. Este historial resume las versiones públicas y los grandes hitos que han transformado el proyecto desde su etapa OpenFront hasta la IA geopolítica actual.</p>'+
          '<div class="aboutTimeline0351">'+HISTORY.map(versionHTML0351).join('')+'</div>'+
          '<div class="aboutFoot0351">Historial integrado en el juego · las ramas estables del repositorio se conservan como puntos de recuperación.</div>'+
        '</div>'+
      '</section>';

    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close0351()});
    overlay.querySelector('#aboutClose0351').addEventListener('click',close0351);
    return overlay;
  }

  let previousFocus0351=null;

  function open0351(){
    const overlay=ensurePanel0351();
    previousFocus0351=document.activeElement;
    overlay.classList.add('open0351');
    overlay.setAttribute('aria-hidden','false');
    const btn=document.getElementById('landingAbout0351');
    if(btn)btn.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>overlay.querySelector('#aboutClose0351')?.focus());
  }

  function close0351(){
    const overlay=document.getElementById('aboutOverlay0351');
    if(!overlay)return;
    overlay.classList.remove('open0351');
    overlay.setAttribute('aria-hidden','true');
    const btn=document.getElementById('landingAbout0351');
    if(btn)btn.setAttribute('aria-expanded','false');
    try{previousFocus0351?.focus()}catch(_){}
  }

  const button=document.getElementById('landingAbout0351');
  if(button){
    button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-expanded','false');
    button.addEventListener('click',open0351);
  }

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('aboutOverlay0351')?.classList.contains('open0351')){
      e.preventDefault();close0351();
    }
  });

  window.HexategosAbout0351={
    open:open0351,
    close:close0351,
    history:HISTORY.map(v=>({...v,changes:v.changes.slice()}))
  };

  console.info('[HEXATEGOS] historial actualizado para 0.37.3');
})();