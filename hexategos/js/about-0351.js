'use strict';

// HEXATEGOS 0.35.2 · Acerca de / historial de versiones.
(() => {
  const HISTORY=[
    {
      version:'0.37.6',
      date:'Octubre 2026',
      title:'Conexión terrestre y aduana fronteriza',
      current:true,
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