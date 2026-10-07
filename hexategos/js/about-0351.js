'use strict';

// HEXATEGOS 0.35.2 · Acerca de / historial de versiones.
(() => {
  const HISTORY=[
    {
      version:'0.36.2',
      date:'Octubre 2026',
      title:'Construcción IA más humana',
      current:true,
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
            '<p>Global Geopolitical Strategy · versión 0.36.2</p>'+
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

  console.info('[HEXATEGOS] historial actualizado para 0.36.1');
})();