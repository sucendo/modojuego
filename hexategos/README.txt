HEXATEGOS 0.37.20 · ECONOMÍA MATERIAL FÍSICA

RECURSOS
- alimentos
- materias primas
- energía / combustible
- bienes industriales
- material militar

Nodos:
- capital
- ciudad
- industria
- puerto
- extremo logístico de ruta cuando sea necesario
- NO hay inventario por cada hexágono

Producción y consumo:
- el territorio genera alimentos, materias primas y energía de forma agregada;
- esa producción se deposita entre los nodos logísticos nacionales;
- las ciudades consumen alimentos, combustible y bienes;
- las industrias consumen materias primas y combustible;
- las industrias producen bienes industriales y material militar según disponibilidad de inputs;
- capitales y puertos añaden capacidad y demanda estratégica.

Logística interior:
- resourceRoadComp03720 enlaza cada nodo a la red viaria;
- redistributeRoadResources03720 redistribuye de forma limitada dentro de cada componente;
- el stock total se conserva durante la redistribución;
- no hay pathfinding adicional por mercancía.

Rutas:
- transferRouteResources03720 mueve excedentes hacia déficits;
- cada ruta registra cargo por los cinco recursos;
- la capacidad depende de tipo de ruta, valor base y factor operativo;
- bloqueos, riesgos y permisos siguen afectando al caudal;
- el valor monetario incorpora materialFactor03720;
- el gestor muestra la carga real de cada ruta;
- la intensidad visual de los puntos comerciales usa cargo real cuando existe.

Efectos:
- resourceNation03720 calcula cobertura nacional;
- alimentos, materias, combustible y bienes afectan al factor económico;
- alimentos, combustible, bienes y material militar afectan al reclutamiento;
- se aplica por igual a jugador e IA.

Persistencia:
- resources03720.version = 1;
- se guardan stocks exactos de nodos del jugador;
- se guarda cobertura agregada de todas las naciones;
- partidas antiguas sin resources03720 inicializan stocks de forma segura;
- el formato de rutas existente sigue siendo compatible.

PATRULLAS 0.37.20
- al ordenar Patrulla se limpia cualquier espera Infinity heredada;
- una patrulla de IA también recupera automáticamente un patrolNext válido;
- excursión local ampliada de 7 a 9 pasos de ida;
- se mantiene retorno inverso exacto al puerto;
- no se muestran líneas de patrulla;
- triángulo naval ligeramente mayor, similar al punto comercial marítimo.

Rendimiento:
- resourceTick03720 se ejecuta dentro del tick comercial existente;
- sin timers nuevos;
- nodos sparse;
- sin simulación por hexágono;
- sin A* por recurso;
- mismo límite global de puntos comerciales.

HEXATEGOS 0.37.19 · PATRULLAS NAVALES PUERTO → MAR → PUERTO

Visibilidad:
- una flota con order === 'patrol' nunca dibuja su ruta;
- se aplica por igual al jugador y a todas las IA;
- la ruta sigue existiendo internamente para simulación y combate.

Ciclo de patrulla:
- buildLocalPatrolRoute03719 solo se ejecuta desde la salida marítima del puerto base;
- la ida se genera con un máximo de 7 pasos locales;
- la vuelta reutiliza exactamente la ida en sentido inverso;
- primer y último nodo lógico = homeSea;
- no se usa A* adicional para el regreso;
- el ciclo siempre termina junto al mismo puerto del que salió.

Anclaje visual al puerto:
- en reposo de patrulla, el triángulo se dibuja sobre el puerto base;
- al salir: puerto → homeSea → patrulla;
- al volver: patrulla → homeSea → puerto;
- la simulación sigue manteniendo g.cell sobre agua para no romper combate/pathfinding.

Movimiento continuo:
- visualVector03719 calcula la posición interpolada actual;
- antes de cada tick se toma esa posición como origen del siguiente tramo;
- no se reinicia visualmente desde la celda lógica anterior;
- NAVAL_VISUAL_STEP_MS03719 = 1400, igual que el tick naval;
- al acabar una patrulla se programa una breve estancia en puerto.

Rendimiento:
- sin timers nuevos;
- sin A* adicional para patrullas;
- máximo 7 pasos de ida + retorno inverso;
- misma lógica para 150/250/350/500 naciones.

HEXATEGOS 0.37.18 · SALIR DE VER EN MAPA

Vista de ruta:
- al pulsar Ver en mapa, la barra contextual muestra:
  Ruta comercial · ORIGEN ↔ DESTINO
- el botón Cancelar pasa a llamarse Salir;
- Salir borra únicamente focusedTradeRoute03717;
- no cierra, suspende ni modifica la ruta comercial;
- la barra recupera después el texto Cancelar.

Persistencia:
- serialize0370 guarda las rutas comerciales reales;
- save0370 persiste ese bloque en localStorage;
- saveGame3212 queda envuelto para guardar también tradeLogistics;
- los archivos portables .hexategos incluyen payload.tradeLogistics0370;
- restore0370 recupera las rutas;
- focusedTradeRoute03717 NO se serializa porque es solo estado visual temporal.

HEXATEGOS 0.37.17 · GESTOR DE RUTAS COMERCIALES

Economía:
- listado completo de todas las rutas del jugador;
- sin corte a 12 elementos;
- ordenadas por estado operativo, tipo y valor;
- origen ↔ destino visibles;
- tipo marítima / terrestre;
- interior / socio comercial;
- estado;
- ingreso;
- mercancías estimadas;
- distancia;
- riesgo naval;
- tránsito;
- indicador de abastecimiento interior en rutas marítimas propias.

Acciones:
- Ver en mapa;
- Solicitar tránsito;
- Contrabando cuando procede;
- Cerrar ruta.

Ver en mapa:
- focusTradeRoute03717(id);
- cierra el panel Sistemas;
- usa el punto medio del trazado;
- centra mediante cellLonLat3302 + rotateToGeo3243;
- zoom 4.8 para mar y 6.0 para tierra;
- focusedTradeRoute03717 conserva la selección;
- drawFocusedTradeRoute03717 resalta el trazado;
- rutas marítimas: línea azul clara discontinua;
- terrestres: línea clara continua.

Pestaña Naval:
- las rutas marítimas también ofrecen Ver en mapa.

Rendimiento:
- no se añade ningún timer;
- el gestor solo se construye al renderizar Economía;
- el resaltado procesa una única ruta seleccionada;
- se mantiene intacto el presupuesto de tráfico comercial.

Compatibilidad:
- no cambia createPlayerSeaRoute0370 ni createSeaRoute0370;
- conserva la integración 0.37.16 con el controlador final de destinos.

HEXATEGOS 0.37.16 · REVISIÓN COMPLETA DEL FLUJO DE RUTA COMERCIAL

CAUSA RAÍZ ENCONTRADA

El motor contiene varias generaciones del controlador contextual.

El controlador final v3.28.2:
- arma destinos mediante beginTargetFromDialog3282();
- protege setInteractionMode3245() con contextTargetPermit3282;
- recibe los clics definitivos en handleInteractionTarget3245();
- pick3245 es el pick final asignado al canvas;
- los modos no reconocidos por el manejador final se cancelan.

Las versiones 0.37.14/0.37.15:
- intentaban armar select_trade_route_target mediante setInteractionMode3244();
- el controlador estricto rechazaba esa llamada al no existir contextTargetPermit3282;
- además interceptaban handleInteractionTarget3244;
- pero el pick final consumía destinos mediante handleInteractionTarget3245.

Resultado: el botón podía aparecer y el código de creación ser correcto, pero el destino del mapa nunca llegaba a createPlayerSeaRoute0370.

SOLUCIÓN 0.37.16

Entrada:
RUTA COMERCIAL
→ beginSeaTradeMapPick03716()
→ beginTargetFromDialog3282('select_trade_route_target', origen, 'sea_trade_0370')
→ permiso válido del controlador
→ setInteractionMode3245()
→ interactionMode activo.

Destino:
pointerup
→ pick final
→ pick3245 / wrapper comercial
→ puerto exacto si hay icono cercano
→ handleInteractionTarget3245()
→ handleSeaTradeTarget03716()
→ seaTradeTargetReason03711()
→ createPlayerSeaRoute0370()
→ createSeaRoute0370()
→ saveGame3212()
→ render.

CREACIÓN MARÍTIMA REVISADA

createSeaRoute0370:
- admite a===b para rutas interiores;
- exige que origen y destino sean puertos reales;
- valida propietarios;
- busca las celdas marítimas adyacentes;
- calcula un camino marítimo continuo;
- solicita permisos de tránsito cuando procede;
- crea ruta active;
- calcula valor y riesgo naval;
- marca caché comercial como dirty.

createPlayerSeaRoute0370:
- reutiliza exactamente esta lógica;
- mantiene confirmación de tránsito de riesgo;
- guarda partida y fuerza render.

HEXATEGOS 0.37.15 · SELECTOR COMERCIAL ROBUSTO

Entrada al modo:
- desde cualquier puerto propio se puede pulsar RUTA COMERCIAL;
- solo se bloquea si el jugador ha alcanzado su límite de rutas;
- ya no se usa seaCandidates0370() para decidir si el botón está habilitado;
- la lista precalculada queda únicamente como apoyo del modal/diagnóstico, no como requisito de interacción.

Selección del destino:
- usa interactionMode select_trade_route_target;
- el puerto se valida al hacer clic;
- puerto propio: permitido;
- puerto extranjero: exige relación comercial compatible;
- destino inválido: mantiene el modo activo.

Precisión:
- nearestPortScreen03715 proyecta los puertos a pantalla solo durante el clic;
- si el clic cae cerca de un icono de puerto, se usa la celda exacta de ese puerto;
- evita seleccionar la celda vecina por el LOD o por la resolución genérica del mapa.

Diagnóstico:
- límite global de rutas;
- límite comercial del jugador;
- límite del socio;
- puerto sin acceso marítimo navegable;
- imposibilidad de encontrar camino marítimo continuo.

Rendimiento:
- ningún escaneo extra por frame;
- el ajuste a puerto se evalúa únicamente durante un clic en modo comercial;
- sin timers nuevos.

HEXATEGOS 0.37.14 · SELECTOR COMERCIAL NATIVO + CAMIONES ORIGEN-DESTINO

Selector de ruta comercial:
- abandona el observador de updatePanel usado desde 0.37.11;
- usa setInteractionMode3244('select_trade_route_target', ...);
- el clic sobre el mapa llega al mismo handleInteractionTarget3244 que carreteras y transporte de tropas;
- destino válido = puerto propio o puerto extranjero con relación comercial compatible;
- un destino inválido no cancela el modo;
- Escape / Cancelar usan el mecanismo nativo de interacción.

Tráfico doméstico:
- deja de convertir cada elemento de roads3212 en un tráfico independiente;
- los nodos son capital, ciudad, industria y puerto;
- se agrupan por red de carreteras;
- para cada grupo se construye un árbol viario y se generan caminos completos hub -> nodo;
- cada marcador tiene origin y destination explícitos;
- el punto recorre la ruta completa aunque atraviese varios tramos de carretera;
- jugador: hasta 18 destinos por grupo;
- IA: máximo 2 destinos por grupo y número de grupos limitado;
- prioridad del jugador preservada.

Rendimiento:
- máximo 96 grupos viarios por reconstrucción en escritorio, 54 en puntero grueso;
- BFS limitado a 14.000 celdas para el jugador y 6.500 para IA;
- caminos visuales muestreados a máximo 160 celdas;
- mismo maxDots y mismo zoom mínimo 25;
- sin timers nuevos.

HEXATEGOS 0.37.13 · LOGÍSTICA INTERIOR Y TRÁFICO PROPIO

Rutas marítimas propias:
- se pueden crear entre dos puertos de la misma nación;
- sirven para conectar islas, enclaves o regiones sin continuidad terrestre;
- la selección de candidatos propios revisa hasta 24 puertos;
- el destino elegido directamente en el mapa sigue pudiendo ser cualquier puerto propio válido;
- una ruta interior activa funciona como puente logístico real.

Suministro marítimo:
- puerto extremo de una ruta interior activa: suelo de suministro 64;
- estructuras de la misma nación conectadas por carretera a cualquiera de esos puertos: suelo de suministro 58;
- el suministro base mayor se conserva: solo se eleva el mínimo cuando existe el puente marítimo;
- cerrar, romper o bloquear la ruta elimina ese apoyo al invalidarse la caché logística.

Camiones del jugador:
- los candidatos de tráfico doméstico de la nación del jugador se ordenan antes que los de las IA;
- así no desaparecen de la bolsa visual al jugar con 150/250/350/500 naciones;
- tramos propios de más de 3 celdas muestran hasta dos puntos;
- se mantiene zoom mínimo 25;
- no aumenta maxDots ni el número global de entidades dibujadas.

Rendimiento:
- se reutilizan componentes de carretera ya calculados;
- la red marítima de suministro se cachea por época de carreteras y revisión comercial;
- sin nuevos timers ni escaneos de mapa completo.

HEXATEGOS 0.37.12 · SIMBOLOGÍA DE TRANSPORTES

Convención visual:
- transporte comercial terrestre: punto circular;
- transporte comercial marítimo: punto circular;
- transporte de tropas: rombo;
- flota militar: triángulo;
- el color sigue identificando la nación.

La forma identifica el tipo de tráfico, no el medio:
- comercio = punto;
- tropas = rombo;
- militar = triángulo.

No cambia la simulación, las velocidades, el número de entidades visibles ni los umbrales de zoom.

HEXATEGOS 0.37.11 · FRANJAS COMERCIALES MADURAS + DESTINO EN MAPA

Rutas terrestres IA:
- una ruta comercial activa sigue siendo atendida estratégicamente;
- cada ~3 servicios de corredor se puede revisar su trazado físico;
- la IA busca hexágonos neutrales adyacentes a sus propias casillas de carretera dentro de esa ruta;
- solo ocupa terreno con apoyo territorial suficiente y sin contacto enemigo inmediato;
- la expansión lateral no extiende una carretera a cada hexágono conquistado;
- periódicamente una ruta madura puede generar ciudad o industria vinculada al eje comercial;
- por tanto una conexión ya terminada puede evolucionar hacia una franja territorial más ancha y económicamente útil.

Rutas comerciales del jugador:
- desde un puerto propio, RUTA COMERCIAL activa selección de destino en el mapa;
- se puede elegir otro puerto propio o uno extranjero con relación comercial compatible;
- seleccionar una casilla no válida no cancela el modo;
- la barra de interacción explica qué falta y permite Cancelar;
- la lógica física de puertos, tránsito, riesgo y pathfinding marítimo no cambia.

Marcadores:
- barcos comerciales: aumento notable de tamaño;
- tráfico comercial terrestre: aumento notable de tamaño;
- tráfico interior por carretera: también más legible;
- se mantienen el mismo número máximo de puntos y las mismas reglas de zoom.

Rutas de flotas:
- patrulla: ninguna ruta visual;
- interceptación, regreso, bloqueo, escolta o traslado sí pueden mostrar su trayectoria porque son órdenes activas no patrulleras.

Rendimiento:
- máximo 96 muestras del trazado de una ruta activa por revisión;
- mantenimiento territorial cada 3 ciclos aproximadamente;
- desarrollo económico maduro cada 6 ciclos aproximadamente;
- sin timers nuevos ni barridos globales adicionales.

HEXATEGOS 0.37.10 · TRÁFICO COMERCIAL Y VELOCIDAD CONSTANTE

Patrullas navales:
- una flota que patrulla sigue recorriendo su zona con la misma lógica de simulación;
- la ruta de patrulla deja de dibujarse por completo;
- la posición de la flota continúa visible e interpolada.

Visibilidad del comercio:
- barcos comerciales algo mayores;
- camiones/puntos de rutas comerciales terrestres algo mayores;
- tráfico interior por carretera ligeramente mayor;
- los umbrales se mantienen: tráfico fino desde zoom 25 y flotas desde zoom 15.

Velocidad:
- ya no se recorre un porcentaje fijo de la ruta por segundo;
- barco comercial base: velocidad constante en hexágonos/segundo;
- camión comercial base: velocidad constante en hexágonos/segundo;
- una ruta dos veces más larga tarda aproximadamente el doble en recorrerse;
- la distancia de la ruta no altera la velocidad física del vehículo.

Tecnología futura:
- existe un único multiplicador de velocidad por tipo de transporte y nación;
- actualmente devuelve 1.0 para todos;
- un futuro sistema tecnológico podrá aumentar la velocidad de todos los barcos o camiones de una nación sin modificar la lógica de rutas.

Rendimiento:
- no se crean entidades adicionales;
- no hay pathfinding nuevo;
- no hay temporizadores nuevos;
- se reutilizan los mismos puntos y rutas visuales existentes.

HEXATEGOS 0.37.9 · CORREDORES ECONÓMICOS CONSOLIDADOS

Objetivo:
- una IA que busca una conexión comercial ya no conquista una simple línea mínima de hexágonos;
- el corredor se trata como un eje territorial y económico que debe ser razonablemente defendible y útil.

Expansión:
- dos microturnos tienden a mantener el avance hacia el socio y aproximadamente uno de cada tres puede consolidar los flancos;
- la consolidación prefiere casillas neutrales apoyadas por territorio propio y carreteras;
- el sistema intenta rellenar estrechamientos y ensanchar corredores antiguos sin convertir la expansión en una mancha indiscriminada;
- la desviación respecto al eje entre capitales está limitada y el terreno difícil recibe penalización.

Desarrollo:
- cada cierto número de ciclos se puede sustituir la expansión por una inversión civil;
- las ciudades nuevas se sitúan sobre la carretera del corredor, con suministro, separación urbana y seguridad suficientes;
- la industria puede aparecer en ciudades del eje cuando no existe otro polo industrial demasiado cerca;
- esos nuevos núcleos pasan a formar parte del sistema normal de construcción IA, que puede seguir desarrollándolos.

Rendimiento:
- sin escaneos globales adicionales;
- máximo 180 muestras de frontera para consolidación;
- máximo 190 muestras territoriales para buscar nodos;
- una única conquista o construcción relevante por servicio;
- sin setInterval nuevo;
- compatible con guardados anteriores.

HEXATEGOS 0.37.8 · TRÁFICO, BARCOS Y FLOTAS POR COLOR NACIONAL

Zoom:
- los puntitos de tráfico terrestre y los pequeños barcos comerciales aparecen únicamente desde zoom 25;
- los convoyes navales y las flotas militares aparecen desde zoom 15;
- por debajo de zoom 25 no se dibuja ese tráfico fino, reduciendo carga y ruido visual;
- las rutas marítimas pueden seguir viéndose antes porque su línea es una referencia estratégica de bajo coste.

Colores:
- cada nación utiliza su propio color para su tráfico interior;
- el tráfico de rutas comerciales internacionales usa los colores de las naciones que participan;
- los pequeños barcos comerciales marítimos usan color nacional;
- los convoyes de transporte usan color nacional;
- las flotas militares usan color nacional;
- su simulación sigue avanzando en ticks navales, pero la posición visible se interpola continuamente por el tramo recorrido, eliminando los saltos entre hexágonos;
- desaparece la identificación genérica azul para jugador / roja para IA en los símbolos navales.

Rutas marítimas:
- se conserva el azul claro discontinuo que ya utilizaba el juego;
- ahora también se dibuja para rutas comerciales IA↔IA, no solo para rutas donde participa el jugador;
- las rutas de movimiento naval usan el mismo lenguaje visual azul claro;
- una patrulla sigue enseñando únicamente el tramo inmediato de su recorrido.

Rendimiento:
- el tráfico interior aprovecha el mismo barrido de roads3212 y separa los tramos por propietario;
- se mantiene un presupuesto máximo de puntos y rutas por frame;
- se descartan primero elementos fuera de pantalla;
- no se añade ningún timer adicional.

HEXATEGOS 0.37.7 · CORREDORES COMERCIALES GEOPOLÍTICOS

Principio:
Una relación comercial ya no es solo un modificador diplomático. Si dos IA quieren comerciar pero todavía no existe conexión física, intentan crearla dentro del propio mundo.

Espacio libre:
- si entre una IA y su socio existe territorio neutral útil, la IA puede orientar su expansión hacia ese corredor;
- cada servicio solo intenta conquistar un hexágono neutral, usando tropas y probabilidad de éxito similares a la expansión normal;
- si la carretera ya llega al frente de expansión y dispone de oro, se prolonga sobre el nuevo territorio;
- por tanto el corredor aparece poco a poco en el mapa y no de golpe.

Terceros países:
- cuando el camino razonable atraviesa uno o varios Estados, se busca una cadena fronteriza de hasta cinco países;
- cada país intermedio debe conceder permiso de tránsito;
- la solicitud utiliza opinión, confianza y relaciones diplomáticas reales;
- si el permiso se concede, se construye el corredor físico por el territorio intermedio;
- las carreteras interiores y las conexiones/aduanas fronterizas siguen siendo objetos físicos reales;
- el solicitante puede financiar la infraestructura acordada de tránsito.

Negativa:
1. se registra la negativa y se deterioran gradualmente opinión y confianza;
2. se busca una alternativa geográfica por otros países;
3. si no existe, una IA oportunista/agresiva puede intentar contrabando;
4. el contrabando solo funciona si ya hay una red viaria utilizable: no crea carreteras completas a escondidas;
5. varias negativas pueden romper relaciones cooperativas;
6. tras una escalada prolongada, una IA agresiva con superioridad suficiente puede declarar la guerra al Estado bloqueador.

Seguridad diplomática:
- esta escalada automática de corredores solo opera entre IA;
- el jugador no recibe una guerra automática desde este módulo;
- las relaciones del jugador siguen pasando por el sistema diplomático normal.

Rendimiento:
- el servicio de corredor está escalonado por nación;
- cada IA lo revisa aproximadamente cada 17 segundos de campaña;
- se evalúan como máximo cinco socios en una revisión;
- la búsqueda de países vecinos usa las muestras de frontera ya cacheadas por la IA;
- la profundidad máxima del recorrido entre Estados es cinco;
- solo se ejecuta una obra, conquista o conexión relevante por servicio;
- no existe un nuevo setInterval.

HEXATEGOS 0.37.6 · CONEXIÓN TERRESTRE / ADUANA FRONTERIZA

Regla:
- una carretera de un país y una carretera de otro país pueden llegar a dos hexágonos fronterizos contiguos sin quedar conectadas;
- el contacto visual ya no crea por sí mismo una red viaria internacional;
- hace falta construir explícitamente la unión fronteriza.

Jugador:
- si tu hexágono tiene carretera y, justo al otro lado de la frontera, un país con relación cooperativa tiene también carretera, aparece CONEXIÓN TERRESTRE;
- el botón muestra ADUANA · 12 ORO · país;
- al pulsarlo se construye el tramo que cruza la frontera;
- ese tramo queda visible como parte real de la carretera;
- después el sistema intenta crear la ruta comercial terrestre entre ambos países.

IA:
- las IA siguen construyendo corredores comerciales hacia socios;
- cuando el socio es el jugador, la IA llega hasta la frontera pero no crea unilateralmente la aduana: espera a que el jugador pulse CONEXIÓN TERRESTRE;
- entre dos IA, cuando ambas carreteras alcanzan el mismo paso fronterizo, pueden construir la conexión explícita y pagar su coste;
- no existen conexiones internacionales mágicas por mera proximidad.

Diplomacia:
- solo puede construirse una conexión con una relación cooperativa que mantenga derechos comerciales;
- comercio, no agresión y alianza son válidos;
- si después la relación deja de permitir comercio, la ruta comercial puede suspenderse, aunque la carretera física siga existiendo.

Persistencia y rendimiento:
- el enlace fronterizo se guarda en localStorage y en archivos .hexategos;
- las partidas anteriores siguen siendo compatibles y empiezan sin aduanas internacionales registradas;
- la detección del botón solo revisa los vecinos del hexágono seleccionado;
- no se añade ningún temporizador nuevo.

HEXATEGOS 0.37.5 · IA CIVIL Y COMERCIO FÍSICO ENTRE NACIONES

Problemas corregidos:
- con muchas naciones, la diplomacia comercial podía quedarse sin tiempo de CPU si el scheduler militar agotaba su presupuesto;
- una relación comercial solo generaba ruta terrestre si las carreteras de ambos países ya estaban unidas por casualidad;
- las IA no tenían una motivación específica para prolongar sus carreteras hacia la frontera de un socio;
- algunas IA podían dejar de construir después de su fase inicial al quedarse sin candidatos que cumplieran todos los filtros de desarrollo.

Comercio:
- cada tratado cooperativo mantiene derechos comerciales: comercio, no agresión y alianza;
- las IA detectan socios comerciales próximos mediante la red diplomática y sus fronteras reales;
- ambos países valoran el mismo paso fronterizo con una puntuación determinista;
- si uno de los dos ya tiene carretera en la frontera, el otro recibe una prioridad fuerte para encontrarse allí;
- esto permite que una carretera del jugador llevada hasta la frontera sea continuada desde el lado de la IA cuando existe una relación comercial;
- cuando las dos redes quedan físicamente unidas, el sistema intenta crear inmediatamente la ruta comercial terrestre real;
- las rutas siguen dependiendo de carreteras físicas: no se inventa una conexión a distancia.

Desarrollo civil:
- una ciudad, industria o puerto propio sin carretera se intenta reconectar antes de abrir nueva infraestructura;
- el constructor nacional normal sigue siendo el sistema principal;
- si una IA acumula aproximadamente 30 segundos de campaña sin progreso y sigue por debajo de sus objetivos, entra un watchdog;
- ese watchdog relaja solo de forma moderada distancia/suministro para encontrar una ciudad o industria viable;
- sigue necesitando territorio propio, recursos, seguridad y un mínimo de suministro;
- no se regalan edificios ni oro.

Rendimiento:
- no se añade ningún temporizador periódico;
- la diplomacia garantizada reutiliza economyTick3212 y sigue obedeciendo dipNextReview;
- la búsqueda de corredores usa las muestras de frontera ya cacheadas;
- la comprobación comercial de cada nación está espaciada;
- el conteo civil más caro solo se ejecuta tras un estancamiento prolongado, no en cada tick IA.

HEXATEGOS 0.37.4 · RETIRADA MANUAL DE CARRETERAS

Cambios:
- al seleccionar un hexágono propio que ya contiene carretera aparece la acción ABANDONAR CARRETERA;
- al confirmarla se eliminan los tramos viarios que llegan a ese hexágono, sin devolución de oro;
- si la carretera atraviesa el hexágono, la ruta queda partida y se conservan automáticamente los subtramos válidos a cada lado;
- si varias carreteras confluyen en el mismo punto, se eliminan todas las conexiones incidentes a ese hexágono;
- el suministro, comercio físico, economía y cachés de IA se recalculan de inmediato;
- el sistema de degradación 0.37.3 vuelve a auditar las comunicaciones para que cualquier núcleo recién aislado inicie su proceso normal;
- la modificación se persiste dentro de la misma colección roads3212, por lo que no cambia el formato de guardado ni rompe partidas anteriores.

Rendimiento:
- la acción solo recorre las rutas existentes en el momento de abandonar una carretera;
- no se añade ningún setInterval ni cálculo por frame;
- el resto del tiempo el coste es cero.

HEXATEGOS 0.37.3 · DEGRADACIÓN, ABANDONO Y DESAPARICIÓN POR AISLAMIENTO

Objetivo:
- Hacer que una ciudad, industria o puerto necesite formar parte de una red de comunicaciones útil.
- Convertir el aislamiento prolongado en un proceso visible y con consecuencias económicas reales.
- Mantener la regla idéntica para el jugador y para las 150 / 250 / 350 / 500 naciones IA.

Ciclo:
- durante los primeros 60 segundos de campaña sin comunicaciones no hay penalización;
- entre 60 y 180 segundos el icono pierde progresivamente saturación y la producción cae;
- entre 180 y 300 segundos la infraestructura queda abandonada, completamente gris y casi improductiva;
- desde 300 segundos comienza a volverse transparente;
- a los 360 segundos desaparece definitivamente;
- si se restablece la comunicación antes de ese momento, el proceso se cancela y el núcleo se recupera.

Comunicaciones:
- cualquier carretera conectada al hexágono de una ciudad, industria o puerto cuenta por sí misma como ruta terrestre interna;
- no es necesario crear además una ruta comercial terrestre formal para evitar la degradación;
- un puerto puede mantenerse comunicado mediante una ruta marítima activa;
- si ciudad o industria comparten hexágono con ese puerto, se benefician de la misma salida marítima;
- la capital se considera nodo básico de comunicaciones y no entra en degradación por arrancar una partida todavía sin red viaria.

Economía y flotas:
- la producción de una infraestructura degradada cae de forma continua;
- una estructura abandonada conserva solo una actividad residual hasta desaparecer;
- si desaparece un puerto que era base de una flota, la flota queda sin base: no se borra ni se teletransporta;
- las IA están sujetas al mismo abandono y al mismo sistema de reasignación/traslado naval.

Rendimiento:
- no existe un nuevo bucle periódico;
- la auditoría se engancha al tick económico ya existente y solo actúa cada 10 segundos de campaña;
- las conexiones terrestres reutilizan los componentes de carretera cacheados por trade-logistics-0370;
- se recorren únicamente ciudades, industrias y puertos, no todos los hexágonos del mundo.

Compatibilidad:
- las partidas antiguas siguen cargando;
- al no contener estado 0.37.3 comienzan con sus infraestructuras sanas y la degradación se calcula desde ese momento;
- el estado se guarda tanto localmente como dentro de los archivos .hexategos.

HEXATEGOS 0.37.2 · TRÁFICO TERRESTRE VISIBLE Y PATRULLA LIMPIA

Cambios:
- los puntos de tráfico terrestre propio usan el color del jugador;
- el tráfico terrestre se muestra desde un zoom más cercano y con un tamaño/contorno algo más visible;
- las rutas terrestres comerciales del jugador mantienen ese mismo color;
- las carreteras se han estrechado ligeramente;
- las flotas en patrulla siguen recorriendo su zona, pero solo muestran en pantalla el siguiente tramo inmediato de su ruta;
- el recorrido completo sigue existiendo internamente para el movimiento, pero no se dibuja entero;
- se conservan los topes de puntos y la caché de tráfico de 0.37.1.

HEXATEGOS 0.37.1 · TRÁFICO INTERIOR Y MOVIMIENTO NAVAL VISIBLE

Cambios principales:
- el tráfico interior ya se ve sobre carreteras propias aunque todavía no exista comercio exterior;
- los puntos se mueven suavemente por la red y aparecen con zoom cercano;
- la selección prioriza corredores propios con ciudad, industria, capital o puerto, pero mantiene circulación en el resto de la red conectada;
- los puertos de una misma nación pueden abrir rutas comerciales marítimas interiores;
- el comercio marítimo interior aporta menos que una ruta exterior equivalente;
- las líneas marítimas terminan exactamente en los puertos, no en el hexágono de mar adyacente;
- las IA pueden abrir también rutas interiores entre sus propios puertos;
- una flota en patrulla recorre un circuito corto alrededor de su puerto-base y regresa;
- una flota en intercepción persigue transportes enemigos y, si no encuentra uno, realiza una salida hacia zona enemiga y vuelve;
- la hostilidad naval respeta el estado diplomático real.

Rendimiento:
- el tráfico terrestre interior se obtiene de una caché y no se reconstruye en cada frame;
- los corredores visibles y los puntos tienen topes adaptativos según dispositivo/detalle;
- la patrulla local usa pasos vecinos de mar y evita A* global;
- las salidas de intercepción limitan la búsqueda marítima nueva a una por intervalo y reutilizan el camino inverso para volver;
- se mantienen los límites de rutas y el scheduler por lotes de 0.37.0.

HEXATEGOS 0.37.0 · RUTAS FÍSICAS, TRÁNSITO Y PUERTOS-BASE

Objetivo:
- Hacer que el comercio dependa de rutas reales en vez de existir principalmente como una cifra diplomática.
- Vincular cada flota a un puerto concreto y permitir el traslado de base.
- Mantener el sistema viable con 150 / 250 / 350 / 500 naciones.

Comercio físico:
- una relación de Comercio o Alianza sin ruta conserva un intercambio residual casi simbólico;
- el ingreso importante necesita una ruta terrestre o marítima efectiva;
- las rutas terrestres nacen cuando las redes de carreteras de los socios se conectan físicamente;
- si una ruta cruza una tercera nación necesita tránsito autorizado;
- una ruta terrestre bloqueada puede convertirse en contrabando, con menor rendimiento y riesgo diplomático;
- las rutas marítimas unen puerto con puerto y tienen en cuenta terceros, bloqueos y riesgo naval;
- el flujo de mercancías se muestra como indicador económico además del ingreso.

Puertos y flotas:
- desde un puerto propio se puede transportar tropas, construir flota y abrir ruta comercial marítima;
- cada flota mantiene un puerto-base concreto;
- una flota puede trasladar su base a otro puerto propio;
- si pierde el puerto-base no se teletransporta: queda sin base hasta que se le asigne otra;
- las IA usan las mismas reglas y pueden reorganizar sus bases.

Visualización y rendimiento:
- a zoom cercano aparecen puntos de tráfico sobre carreteras y rutas marítimas;
- esos puntos son solo representación gráfica: no son vehículos simulados;
- las rutas guardan trayectorias muestreadas para limitar memoria;
- las búsquedas marítimas A* están presupuestadas y no se lanzan masivamente en el mismo tick;
- la red terrestre se reconstruye desde las celdas con carretera, no recorriendo el planeta por nación;
- el scheduler comercial trabaja por lotes y comparte cachés de ingreso;
- existe un límite global de rutas y límites por nación.

Compatibilidad:
- conserva partidas 0.36.x;
- no elimina carreteras, puertos, flotas o infraestructura ya existentes;
- el nuevo estado comercial se incluye también en los archivos .hexategos.

HEXATEGOS 0.36.2 · CONSTRUCCIÓN IA MÁS HUMANA

Objetivo:
- Hacer que las naciones construyan como un jugador: pocos núcleos útiles, industria concentrada y carreteras que conectan centros.
- Evitar la acumulación visual de fábricas en casi todos los hexágonos.
- Mantener intactas las capacidades de las 150 / 250 / 350 / 500 naciones y las optimizaciones de rendimiento.

Cambios:
- una nación de unas 50 celdas apunta aproximadamente a 7 ciudades y 3 polos industriales;
- una nación de unas 186 celdas apunta aproximadamente a 13 ciudades y 6 polos industriales;
- las nuevas industrias se priorizan en ciudades, puertos y nodos con carretera;
- al alcanzar el objetivo de polos, la IA solo mejora industria existente;
- los planes regionales vuelven a comprobar los conteos reales antes de ejecutar una construcción pendiente;
- ciudades, carreteras y puertos conservan una densidad limitada y proporcional al tamaño nacional;
- las partidas antiguas no pierden edificios ya construidos: simplemente dejan de extender infraestructura redundante.

Compatibilidad:
- no cambia el formato de guardado;
- no se modifica la malla, diplomacia, economía, guerra, frentes o flotas;
- las personalidades de IA siguen modificando prioridades, no las reglas disponibles.

HEXATEGOS 0.36.1 · RENDIMIENTO PARA 150 / 250 / 350 / 500 NACIONES

Objetivo:
- Mantener exactamente las mismas capacidades para todas las naciones.
- Mejorar especialmente la opción de 500 sin convertir ninguna IA en una entidad simplificada.

Optimizaciones:
- scheduler IA con presupuesto de tiempo real por tick, adaptado a CPU, memoria, móvil y coste de render;
- rotación justa: las naciones que no caben en un tick quedan aplazadas, no eliminadas del cálculo;
- conteo territorial compartido para HUD, clasificación y condiciones de victoria;
- check de victoria O(naciones) normalmente y un único barrido mundial exacto solo cerca del 80 %;
- número de guerras y comercio calculados desde la red diplomática activa;
- desgaste de guerra sin el antiguo bucle cuadrático repetido por nación;
- snapshots económicos agrupados para evitar reconstrucciones tras cada hexágono conquistado;
- caché LOD de propietarios con buffers reutilizados y sin Int32Array temporal por celda;
- panel diplomático con refresco DOM limitado cuando no existen cambios.

Compatibilidad:
- 150 / 250 / 350 / 500 siguen siendo naciones completas del mismo motor.
- Los cinco perfiles de IA y su evolución hasta los 60 minutos se mantienen.
- No cambia el formato territorial ni se introduce una segunda clase de actor.
- Las partidas anteriores continúan siendo compatibles.

HEXATEGOS 0.36.0 · 150 / 250 / 350 / 500 NACIONES REALES

CONCEPTO
- Se elimina la idea de entidades políticas adicionales o de segunda categoría.
- El propio motor original dispone ahora de 500 plazas de nación.
- Una nueva partida permite elegir 150, 250, 350 o 500 naciones.
- Todas son exactamente el mismo tipo de actor del juego: owner6, capital, ciudad inicial, economía, tropas, diplomacia, guerra, campañas, flotas, construcción, carreteras, industria, puertos, fortificaciones, nacionalismo y pérdida/traslado de capital.

IA ADAPTATIVA
- Todas las naciones ejecutan los mismos sistemas de IA del motor.
- Internamente cada IA tiene uno de cinco perfiles: conformista, comercial, defensiva, oportunista o localista.
- El perfil no elimina ninguna capacidad; modifica propensión, agresividad, doctrina y ritmo de decisión.
- Una IA puede cambiar de perfil durante los primeros 3.600 segundos de campaña (60 min).
- 0–10 min: cambios relativamente frecuentes.
- 10–30 min: cambios moderados.
- 30–45 min: cambios poco frecuentes.
- 45–60 min: cambios raros.
- Después de 60 min el perfil queda estabilizado.
- Situaciones como desgaste de guerra, reservas bajas, mala economía, expansión exitosa, fronteras hostiles o disponibilidad de tierra influyen en la evolución.

RENDIMIENTO
- Scheduler escalonado: todas las IA conservan el mismo planificador, pero no reciben CPU en el mismo instante.
- Presupuesto por tick creciente según escala: hasta unas 60 naciones atendidas por tick en partidas de 500.
- Snapshot mundial compartido y limitado temporalmente para evitar cientos de barridos de las ~510.000 celdas.
- Clasificación calculada desde un único conteo/snapshot, nunca mediante 500 recorridos del planeta.
- Red diplomática de contactos optimizada y sin propagación N³.
- La diplomacia conserva matrices completas en memoria, pero el guardado 500 usa pares de contacto relevantes para evitar JSON gigantes.
- La defensa IA ya no llama a un conteo mundial independiente por nación.

GENERACIÓN
- Las capitales se distribuyen con separación dinámica según la escala.
- Si las capitales geográficas catalogadas no bastan, se usan celdas terrestres adicionales sin crear un actor distinto.
- Todas las naciones nacen con capital real y ciudad inicial mediante claimInitialRing3302.
- Los nombres adicionales se generan de forma coherente con la región y los colores se distribuyen automáticamente.

COMPATIBILIDAD
- Las nuevas opciones son 150/250/350/500.
- Los guardados antiguos con 16/25/35/50 siguen siendo aceptados.
- Se mantiene una rama de seguridad anterior al cambio:
  backup/hexategos-0.35.6-before-500-nations

HEXATEGOS 0.35.6 · INFRAESTRUCTURA COMBINADA + DESARROLLO IA

Base:
- HEXATEGOS 0.35.5 Atlas sin barrios + nombres históricos.
- HEXATEGOS 0.35.4 Capitales navegables + ciudades reales.
- HEXATEGOS 0.35.3 Paneles Movibles.

Novedades 0.35.6:

1. CAPITAL HISTÓRICA
- Se conserva como dato estratégico para nacionalismo, recuperación y traslado de capital.
- Ya no se dibuja una segunda estrella sobre el mapa cuando no coincide con la capital actual.

2. CIUDAD + INDUSTRIA + PUERTO
- Una misma celda puede mostrar simultáneamente ciudad, industria y puerto.
- Con zoom pequeño la ciudad prevalece para mantener la lectura del mapa.
- Con zoom medio/alto los iconos se separan alrededor del centro del hexágono para evitar solapes.
- Las ciudades empiezan a verse antes al alejar el mapa.

3. DESARROLLO DE LAS NACIONES IA
- Los objetivos físicos dejan de tener el antiguo techo de 11 ciudades y 10 industrias.
- Ciudades, industrias, carreteras y puertos escalan con la raíz del tamaño territorial.
- Una nación de alrededor de 1.000 territorios tiende aproximadamente a 33 ciudades, 23 industrias, 24 corredores y hasta 7 puertos antes de modificadores de personalidad.
- Las personalidades crecimiento, naval, defensiva y agresiva conservan modificadores propios.
- Las fortificaciones dejan de ser un destino automático del excedente económico cuando la nación todavía tiene déficits urbanos o industriales importantes.
- Las defensas siguen teniendo prioridad cuando la capital está amenazada o existe un cerco.

4. PARTIDAS YA EMPEZADAS
- No cambia el schema de guardado.
- Al cargar una campaña existente se invalidan los planes nacionales/regionales de desarrollo para recalcularlos con los nuevos objetivos.
- No se regenera territorio, ciudades ni infraestructuras existentes.

5. PRUEBAS
- Nuevo smoke test tests/smoke-0356.mjs.
- GitHub Actions ejecuta también la comprobación 0.35.6.

HEXATEGOS 0.35.4 · CAPITALES NAVEGABLES + CIUDADES REALES

Base:
- HEXATEGOS 0.35.3 Paneles Movibles.
- HEXATEGOS 0.35.2 Mapa Geopolítico.
- HEXATEGOS 0.35.0 Doctrina Geopolítica.

Novedades 0.35.4:

1. CLASIFICACIÓN NAVEGABLE
- Cada fila de nación de la clasificación se puede pulsar.
- Al pulsarla, el globo gira hasta la capital actual de esa nación.
- Se aplica un zoom adecuado para situarse sobre la capital.
- La capital queda seleccionada y el modo Geopolítica puede actualizar su foco.
- Las filas admiten teclado (Enter / Espacio).

2. ATLAS DE LOCALIDADES REALES
- Atlas offline base de 140.607 registros.
- Fuente: GeoNames cities1000, a través del snapshot público w3c/cities.
- Se excluyen 5.428 registros PPLX (secciones/barrios de núcleos de población), quedando 135.179 propuestas utilizables.
- Datos base conservados: nombre, latitud, longitud, población y país. La población se usa internamente para ordenar propuestas, pero ya no se muestra en el selector.
- Datos divididos en 12 franjas de 30° de longitud.
- Dentro de cada franja hay un índice por teselas de 1°.
- Los datos no se cargan en el arranque: se descargan bajo demanda y se cachean.

3. NOMBRE REAL AL CONSTRUIR CIUDAD
- Al crear una nueva ciudad se consulta el atlas.
- Se comprueba geométricamente si una localidad real cae dentro del hexágono/pentágono seleccionado.
- Si existen varias, se muestran hasta seis propuestas.
- Los barrios/distritos PPLX nunca se proponen como ciudades.
- Se priorizan internamente las localidades más pobladas dentro del mismo hexágono, sin mostrar la cifra de población.
- Si existe información histórica conservadora para la localidad, se muestra una secuencia breve de nombres anteriores.
- Si no hay ninguna localidad del atlas dentro del hexágono, se muestran localidades reales cercanas indicando la distancia.
- El jugador puede construir sin asignar nombre real y seguir usando el sistema de renombrado existente.
- Las mejoras de una ciudad ya construida conservan su nombre.

4. INTERFAZ
- El selector de localidad utiliza el modal común.
- Ese modal se registra en HexategosMovablePanels0353, por lo que puede reposicionarse.
- La clasificación conserva su aspecto anterior; cada fila actúa como enlace a la capital actual de la nación.

FUENTE Y LICENCIA
- GeoNames: CC BY 4.0.
- Atribución incluida en data/cities-0354/ATTRIBUTION.txt.
- El snapshot utilizado se transforma a un formato compacto específico de HEXATEGOS.
- Una localidad cercana nunca se presenta como si estuviera dentro del hexágono: ambas situaciones se distinguen expresamente.

DIAGNÓSTICO
- HexategosRealCities0354.suggest(cell)
- HexategosRealCities0354.focusCapital(faction)
- HexategosRealCities0354.validate()
- HexategosRealCities0354.cachedBands()

Ramas estables:
- hexategos-stable-0.33-r8
- hexategos-stable-0.34.2
- hexategos-stable-0.35.1
- hexategos-stable-0.35.2
- hexategos-stable-0.35.3
