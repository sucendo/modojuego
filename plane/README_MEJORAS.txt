F-22 RAPTOR · MISIÓN 001 — versión 3 · CINEMÁTICA AÉREA RELATIVA

NOVEDADES DE ESTA VERSIÓN
- Los aviones enemigos ya no se desplazan con una velocidad fija "de pantalla".
- Cada enemigo tiene velocidad propia en m/s, rumbo absoluto, aceleración, fase táctica y límite de giro.
- La posición visible se calcula mediante velocidad relativa: V_enemigo - V_jugador.
  * Encuentro frontal: las velocidades se suman y el cruce es muy rápido.
  * Cruce lateral: velocidad relativa intermedia.
  * Persecución desde atrás: las velocidades se restan y el acercamiento es mucho más lento.
  * Si alcanzamos nosotros a otro avión, también se aplica la diferencia de velocidades.
- Se han añadido geometrías de entrada: frontal, cruce derecha/izquierda, oblicuo, persecución trasera y alcance por nuestra parte.
- Los enemigos NO rebotan ni giran en el borde de la pantalla.
- Al salir de cámara siguen existiendo y su posición, velocidad y rumbo continúan simulándose.
- Después de un cruce se separan durante un intervalo breve y realizan fuera de pantalla una maniobra real de retorno.
- El viraje utiliza un modelo simplificado basado en carga G y velocidad: a más velocidad, mayor radio de giro.
- Durante un giro fuerte la IA reduce velocidad para cerrar radio; cuando alinea el morro acelera de nuevo.
- La IA calcula un punto de interceptación aproximado en vez de apuntar siempre directamente a la posición actual.
- Si el jugador cambia mucho de velocidad antes de que un contacto aparezca, el enemigo corrige su interceptación fuera de cámara; tampoco se teletransporta.
- Los enemigos fuera de pantalla no pueden disparar.
- Para disparar, un enemigo visible necesita además tener al jugador dentro de un cono frontal razonable.
- Los misiles del jugador no seleccionan como nuevo blanco un enemigo que está varios kilómetros fuera de cámara.
- El HUD muestra velocidad del F-22 y contactos visibles/totales. Los contactos totales incluyen los que siguen maniobrando fuera de pantalla.
- Q/E permiten reducir/aumentar la velocidad objetivo del F-22.
- La aceleración del jugador es progresiva, no instantánea.
- El desplazamiento del mapa y las nubes responde ahora a la velocidad del F-22.

EJEMPLO DEL MODELO RELATIVO
Con el F-22 aproximadamente a 270 m/s (~972 km/h):
- Rival frontal a 300 m/s: cierre visual aproximado 570 m/s (~2050 km/h).
- Rival lateral a 285 m/s: movimiento relativo aproximado 393 m/s (~1410 km/h).
- Rival detrás, mismo rumbo, a 330 m/s: solo gana unos 60 m/s (~216 km/h).
Por eso los tres encuentros ya no atraviesan la pantalla con la misma sensación de velocidad.

IMPORTANTE SOBRE LOS GIROS FUERA DE PANTALLA
Un avión que acaba de cruzarnos puede tardar bastantes segundos en volver. Esto es deliberado: no se gira 180 grados sobre el borde del canvas. Continúa alejándose, realiza un arco de varios centenares o miles de metros y solo reaparece si su trayectoria vuelve a intersectar nuestra zona visible. Mientras tanto pueden entrar otros contactos.

CONTROLES
Flechas: maniobrar dentro de la zona visible
Q: reducir velocidad objetivo
E: aumentar velocidad objetivo
Espacio: cañón
A: misil guiado
D: bajar de cota
F: volver a cota de combate
R: reiniciar tras Game Over
Ratón/táctil: mantener y arrastrar para maniobrar

MEJORAS DE LA VERSIÓN ANTERIOR QUE SE CONSERVAN
- Rutas internas corregidas.
- Sin doble generación de enemigos.
- Misiles guiados independientes de FPS.
- Selección del blanco visible más cercano.
- Baja altura sin destruir colliders.
- Invulnerabilidad breve tras impacto.
- Proyectiles reciclados.
- HUD y reinicio limpio.
- Phaser 3.80.1 y diseño responsive.

NOTA MAPBOX
El token de Mapbox continúa en el cliente como en el proyecto original. Conviene restringirlo desde la cuenta de Mapbox a los dominios donde se publique el juego.


VERSIÓN 3.1 — CORRECCIÓN DE RECURSOS GRÁFICOS
----------------------------------------------
- La página principal ahora se llama index.html.
- Se conservan todos los SVG originales dentro de /img.
- Phaser carga versiones PNG rasterizadas de alta resolución para evitar
  incompatibilidades de SVG/filtros entre navegadores.
- Corregidos los tamaños visuales del F-22, Su-57, balas y misiles.
- Los tamaños ya no dependen del viewBox diminuto de algunos SVG.
- Corregidos los hitboxes para ajustarse a los nuevos tamaños visuales.
- Añadido mensaje de consola si falla la carga de cualquier recurso.


VERSIÓN 3.2 — IMPACTOS + HUD ARCADE
------------------------------------
- Corregido el efecto que podía hacer parecer que el F-22 desaparecía tras un impacto.
- El avión nunca baja ahora su opacidad durante un impacto y se fuerza visible/activo.
- Separados los efectos visuales de impacto de los tweens de cambio de cota.
- Nuevo impacto arcade: flash, sacudida de cámara, onda expansiva y aviso HIT.
- HUD rediseñado con paneles arcade, score grande, vidas, velocímetro central y estado de combate.
- Pantalla de GAME OVER y mensajes de bonificación rediseñados.
- Añadido overlay visual muy sutil de scanlines/vignette.


VERSIÓN 3.3 — MODO MÓVIL RESPONSIVE
------------------------------------
- Detección automática de pantalla táctil / móvil.
- HUD ultracompacto en móvil; desaparece la barra inferior de ayuda.
- Joystick táctil inferior izquierdo.
- Botón GUN mantenible para ráfaga.
- Botón MSL para misil guiado.
- Botón ALT para alternar cota.
- Botones + / − para variar velocidad objetivo.
- Multi-touch: se puede maniobrar y disparar simultáneamente.
- Aviso no bloqueante si el móvil está en vertical; se recomienda horizontal.
- Adaptación al cambio de orientación y safe viewport móvil.
- En escritorio permanece el control con teclado y ratón.


VERSIÓN 3.4 — NAVEGADOR PEQUEÑO / ESCRITORIO COMPACTO
------------------------------------------------------
- Se separa correctamente móvil de ventana estrecha de PC.
- Los controles táctiles solo aparecen en dispositivos táctiles/coarse pointer.
- Nuevo modo COMPACT automático:
  * se activa si el navegador de escritorio mide menos de 980 px de ancho
    o 620 px de alto;
  * HUD de solo 38 px;
  * sin barra inferior ni textos innecesarios.
- Nuevo modo MICRO automático:
  * se activa por debajo de 560 px de ancho o 420 px de alto;
  * HUD de una sola franja de aproximadamente 28 px.
- Tecla H: alterna manualmente el HUD ultramínimo en escritorio.
- Títulos, mensajes y pantalla GAME OVER escalan según el tamaño real
  de la ventana para no tapar el área de juego.
- Una ventana pequeña de ordenador conserva teclado y ratón; ya no recibe
  joystick/botones de móvil por ser estrecha.


VERSIÓN 3.5 — CORRECCIÓN CRÍTICA DE IMPACTOS
---------------------------------------------
- Corregido el fallo por el que un impacto podía hacer desaparecer el F-22
  y dejarlo sin control.
- Los callbacks de Arcade Physics ya no dependen del orden de argumentos
  cuando se mezclan Group + Sprite.
- Todas las entidades están identificadas por tipo.
- recycleProjectile(), recycleMissile() y destroyEnemy() bloquean explícitamente
  cualquier intento de actuar sobre el jugador.
- Si queda al menos una vida, el cuerpo físico del F-22 se restaura con
  enableBody(), sigue visible y los controles permanecen activos.
- Hay una comprobación de integridad cada frame durante la misión.
- Cambiar de cota ya no puede cancelar el tween de despegue.


VERSIÓN 3.6 — FLIGHT DYNAMICS
------------------------------
- El F-22 ya no cambia de dirección instantáneamente: aceleración y frenado
  lateral progresivos para mantener control arcade con sensación de masa.
- Banking visual del F-22:
  * inclinación progresiva según la maniobra lateral;
  * retorno suave a vuelo nivelado;
  * foreshortening del sprite para sugerir alabeo en vista cenital.
- Banking físico/visual de los Su-57:
  * se calcula a partir de su velocidad angular REAL;
  * conserva la maniobra también fuera de pantalla;
  * si reaparece en mitad de un giro, reaparece inclinado de forma coherente.
- Nubes con parallax según la maniobra del jugador.
- Speed streaks progresivos a alta velocidad, sin tapar la pantalla a velocidad
  normal.
- Efecto CLOSE PASS cuando un contacto cruza muy cerca con gran velocidad
  relativa: barrido visual, pequeña sacudida y lectura de velocidad de cierre.
- La cota baja/alta usa ahora una transición integrada con la dinámica visual,
  evitando conflictos entre tweens, impactos y banking.
- Se conservan las protecciones críticas de la v3.5 para que un impacto nunca
  recicle o destruya accidentalmente el F-22 mientras queden vidas.


VERSIÓN 3.7 — DYNAMIC WEATHER
------------------------------
- El gran número de velocidad desaparece de la cabecera.
- Nuevo instrumento SPD compacto junto al borde inferior:
  * velocidad actual en km/h;
  * objetivo de velocidad mientras acelera/frena;
  * barra de 7 segmentos que representa el ajuste de velocidad.
- El centro superior queda dedicado a meteorología (WX).
- Meteorología variable durante la partida:
  * CLR = despejado;
  * SCT = nubes dispersas;
  * BKN = nuboso/fraccionado;
  * OVC = cubierto.
- Los cambios meteorológicos son graduales, normalmente entre estados vecinos.
- La cobertura nubosa, opacidad, escala, deriva y oscurecimiento ambiental
  cambian suavemente durante 9 segundos.
- Las nubes SVG/PNG antiguas dejan de utilizarse.
- Se generan cuatro texturas procedurales de nube UNA SOLA VEZ al arrancar.
  Durante el juego solo se mueven/reutilizan hasta 34 sprites normales:
  no hay ruido, blur ni generación procedural por frame.
- Se mantiene el parallax y las nubes cambian ligeramente de forma al reciclarse.
- Corregida una llamada duplicada a createCollisions() que existía en v3.6.


VERSIÓN 3.8 — MISSILES & STORM
-------------------------------
METEOROLOGÍA
- Nuevo estado TSR / THUNDERSTORM.
- Cumulonimbos oscuros generados proceduralmente UNA sola vez.
- OVC puede mostrar nubosidad gris intensa; TSR añade bancos realmente oscuros.
- Lluvia ligera mediante un pool fijo de 28 trazos.
- Relámpagos ocasionales con un único overlay reutilizado.
- Turbulencia solamente visual y muy leve: no roba el control al jugador.
- La visibilidad meteorológica afecta de forma moderada al alcance/tiempo de lock.

MISILES
- Ya no giran instantáneamente hacia el blanco.
- Salen rectos durante una breve fase inicial.
- Motor con boost, fase sostenida y pérdida de energía posterior.
- Máximo de G y radio de giro dependiente de velocidad.
- Navegación proporcional simplificada.
- Seeker con cono limitado: un blanco que queda demasiado atrás puede perderse.
- Un misil que pierde el blanco NO lo recupera mágicamente; sigue balístico.
- Mayor margen fuera de pantalla para que complete curvas naturales.
- Estela de humo con pool fijo de 84 elementos reutilizados.
- Nuevo sistema SEARCH / TRACK / LOCK.
- El misil solo se lanza con LOCK; el retículo muestra el progreso sobre el blanco.

MAPBOX
- No se oculta la atribución/licencia.
- Se recoloca abajo a la derecha y se usa el control compacto permitido para
  que moleste lo mínimo posible.


VERSIÓN 3.9 — AUDIO & COMBAT FEEDBACK
--------------------------------------
- Audio procedural mediante Web Audio API: no se añaden MP3/WAV ni dependencias.
- Motor continuo del F-22:
  * tono y filtro ligados a la velocidad real;
  * pequeña variación con la carga de giro/banking.
- Cañón con golpe corto de baja frecuencia + ruido filtrado.
- Lanzamiento de misil con ignición/rocket burst.
- SEARCH permanece silencioso para no saturar.
- TRACK emite pulsos que aceleran a medida que progresa la adquisición.
- LOCK tiene confirmación sonora diferenciada.
- NO LOCK tiene aviso grave doble.
- Impacto del jugador: golpe, ruido y alerta.
- Derribo enemigo: explosión paneada según la posición izquierda/derecha.
- CLOSE PASS: whoosh estéreo cuya intensidad depende de la velocidad relativa.
- Tormenta:
  * lluvia ambiente continua solo según intensidad meteorológica;
  * trueno retrasado tras algunos relámpagos.
- Secuencia sonora al GAME OVER.
- Mezclador interno separado: motor / armas / alertas / ambiente.
- Tecla M y pequeño indicador SND/MUTE para silenciar el juego.
- En móvil, el indicador SND es táctil.
- El navegador desbloquea el audio con el primer toque o pulsación, como exige
  la política de autoplay de Chrome/Safari.
- El AudioContext se reutiliza entre reinicios para no volver a exigir un gesto.


VERSIÓN 4.0 — DOGFIGHT AI & DAMAGE
-----------------------------------
IA DE DOGFIGHT
- Cada Su-57 recibe un piloto: ROOKIE, FIGHTER, VETERAN o ACE.
- El nivel modifica reacción, agresividad, G disponibles, velocidad, alcance,
  cono de disparo y error de puntería.
- La IA decide tácticas durante el combate:
  * LEAD: interceptación predictiva;
  * PURSUIT: persecución directa;
  * SIX: intenta colocarse detrás del F-22;
  * LAG: persecución retrasada para conservar energía;
  * CUTBACK: corta la trayectoria desde un lateral;
  * BREAK: ruptura defensiva en proximidad;
  * EXTEND: se separa y acelera para recuperar energía.
- Las maniobras siguen usando velocidad, radio de giro y posición continua:
  no hay teletransportes ni giros instantáneos en el borde.
- Los pilotos mejores administran mejor la energía durante giros fuertes.
- Disparo enemigo según habilidad y posición real del morro.

DAÑO PROGRESIVO
- El cañón ya no hace desaparecer automáticamente un enemigo.
- Integridad de cada avión: OK → DAMAGED → CRITICAL → DESTROYED.
- DAMAGED:
  * humo;
  * menor aceleración;
  * menor velocidad máxima;
  * menor capacidad de giro.
- CRITICAL:
  * humo oscuro/ocasional fuego;
  * prestaciones muy reducidas;
  * abandona el dogfight e intenta escapar;
  * un impacto de misil o daño extremo puede provocar fallo estructural retardado.
- Misiles causan mucho más daño, pero el avión puede permanecer unos instantes
  crítico antes de caer.
- Derribo:
  * el avión entra brevemente en barrena/caída;
  * genera humo;
  * después aparece una explosión visual y sonora;
  * no desaparece en el mismo frame del impacto.
- Efectos de humo usan un pool fijo de 110 círculos reutilizados.
- Los restos en caída dejan de ser blancos y no bloquean el spawn de amenazas nuevas.


VERSIÓN 4.1 — RADAR & COUNTERMEASURES
--------------------------------------
RADAR
- Radar real: usa las posiciones simuladas de los Su-57 aunque estén fuera de pantalla.
- Contactos enemigos, blanco TRACK/LOCK y misiles enemigos se dibujan con símbolos distintos.
- Rango aproximado: 1,85 km en la escala aérea actual.
- Se actualiza a ~13 Hz para ahorrar rendimiento.
- Tamaño automático: escritorio, compacto, micro y móvil.
- Tecla G activa/desactiva el radar.

MISILES ENEMIGOS
- FIGHTER puede llevar 1; VETERAN y ACE hasta 2; ROOKIE normalmente no lleva.
- El enemigo necesita morro, distancia y tiempo de adquisición adecuados.
- Tiempo de lock depende de habilidad del piloto.
- Guiado con salida recta, boost, energía, navegación proporcional y límite de G.
- Los misiles enemigos continúan fuera de pantalla y aparecen en radar.
- Alerta MISSILE INBOUND con dirección y distancia aproximadas.
- Tono de alerta aumenta de frecuencia a medida que se acerca.

BENGALAS
- C = FLARES en teclado.
- Botón FLR en móvil.
- 8 cargas por partida; cada uso expulsa dos bengalas.
- Las bengalas tienen vida y firma térmica decreciente.
- El misil solo puede enganchar una bengala si está dentro de su cono buscador,
  suficientemente cerca y con una geometría favorable.
- Seekers asociados a mejores pilotos son más difíciles de engañar.
- Una bengala que seduce correctamente el misil hace que éste abandone el F-22;
  no es una inmunidad automática.
- El HUD muestra las cargas restantes.

RENDIMIENTO
- Radar: un solo Graphics redibujado a baja frecuencia.
- Bengalas: pool fijo de 24 objetos.
- Misiles enemigos: pool máximo de 16.
- Reutiliza el pool de estelas existente; no añade sistemas de partículas infinitos.


VERSIÓN 4.2 — COMBAT FEEL
--------------------------
EVITACIÓN DE COLISIONES
- Los Su-57 ya no aceptan una trayectoria de impacto como si no vieran al F-22.
- Cada enemigo calcula el punto de máxima aproximación (CPA) usando posición
  y velocidad relativa.
- Si el cruce previsto en los siguientes ~1–2,5 s es peligroso, hace una ruptura
  lateral anticipada físicamente limitada por su capacidad de giro.
- ACE y VETERAN detectan antes el peligro que un ROOKIE.
- Los enemigos también aplican separación entre ellos para evitar amontonamientos.
- No se han eliminado las colisiones: un cruce forzado o una reacción demasiado
  tardía todavía puede terminar en impacto.

ENERGÍA DEL F-22
- Los giros fuertes consumen velocidad de forma gradual.
- Al volver a vuelo más recto, el avión recupera la velocidad seleccionada con Q/E.
- El SPD muestra la velocidad REAL, no solo el ajuste de gas.
- Cuando no hay diferencia con el objetivo, el indicador pequeño muestra E##:
  porcentaje de energía disponible respecto a la velocidad seleccionada.
- Tutorial contextual explica la pérdida de energía la primera vez que es relevante.

DAÑO DEL JUGADOR
- El F-22 pasa a tener 100% de integridad estructural:
  OK → DAMAGED → CRITICAL → DESTROYED.
- Cañón, misil y colisión producen cantidades de daño distintas.
- Las tres antiguas vidas siguen visibles como lectura arcade de los tres tercios
  de integridad.
- DAMAGED reduce ligeramente aceleración y autoridad de control.
- CRITICAL reduce algo más las prestaciones y genera humo oscuro.
- El impacto ya no significa automáticamente “-1 vida”.
- El HUD muestra AIR ##% y el estado estructural.

RITMO DE COMBATE
- Nuevo director de intensidad invisible.
- No borra ni frena amenazas ya activas.
- Si coinciden demasiados enemigos/misiles o el jugador acaba muy presionado,
  retrasa temporalmente nuevos spawns y nuevos locks de misil.
- El objetivo es alternar tensión → clímax → unos segundos de recuperación.

FEEDBACK / APRENDIZAJE
- Tutorial contextual breve y no bloqueante para movimiento, TRACK/LOCK,
  bengalas, energía y daño.
- Si una bengala engaña realmente al seeker aparece MISSILE DECOYED +300.
- Si la bengala falla, la alarma continúa: el jugador puede aprender visualmente
  cuándo la combinación maniobra + bengala ha funcionado.
