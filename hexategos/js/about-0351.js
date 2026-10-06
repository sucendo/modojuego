'use strict';

// HEXATEGOS 0.35.2 · Acerca de / historial de versiones.
(() => {
  const HISTORY=[
    {
      version:'0.36.0',
      date:'Octubre 2026',
      title:'Evolución política e IA adaptativa',
      current:true,
      summary:'Las naciones dinámicas dejan de ser estáticas: todas intentan crecer al menos un territorio razonable, pueden competir entre sí y su forma de pensar puede evolucionar durante la partida.',
      changes:[
        'Toda entidad viva mantiene una ambición territorial mínima; incluso las más conformistas intentan expandirse algo antes de estabilizarse.',
        'Las naciones dinámicas pueden competir por territorio, perder su capital y desaparecer por completo.',
        'Las entidades desaparecidas no reaparecen después durante el relleno automático del mapa.',
        'Las personalidades internas pueden evolucionar y no son estados permanentes.',
        'Los cambios de carácter son más frecuentes durante los primeros minutos y se vuelven mucho más raros al madurar la campaña.',
        'Las naciones principales también pueden cambiar su doctrina estratégica durante las primeras fases de la partida.',
        'El sistema conserva decisiones escalonadas, snapshots compartidos y límites de cálculo para proteger el rendimiento.'
      ]
    },
    {
      version:'0.35.9',
      date:'Octubre 2026',
      title:'Entidades políticas universales',
      summary:'Todas las entidades políticas se presentan con las mismas capacidades jugables; la diferencia interna queda limitada a cómo y cada cuánto decide su IA.',
      changes:[
        'Diplomacia completa también con las naciones generadas dinámicamente: guerra, paz, comercio, no agresión y alianza.',
        'Las entidades dinámicas disponen de economía, tropas, ciudades, industria, puertos y fortificaciones propias.',
        'Pueden atacar y perder territorio, conquistar al jugador y ser conquistadas mediante las mismas operaciones visibles.',
        'La clasificación y el mapa mantienen una presentación única sin revelar categorías internas.',
        'La personalidad solo modifica frecuencia y propensión de decisión: conformismo, defensa, comercio u oportunismo no aparecen como etiquetas de juego.',
        'El cálculo se escalona por grupos y reutiliza snapshots territoriales periódicos para mantener controlado el coste con cientos de entidades.',
        'Las partidas existentes migran sin alterar el territorio de las naciones ya presentes.'
      ]
    },
    {
      version:'0.35.8',
      date:'Octubre 2026',
      title:'Entidades políticas unificadas',
      summary:'El mapa incorpora muchas más entidades políticas sin distinguir visualmente entre categorías internas: todas aparecen como naciones normales y su importancia se descubre por su comportamiento y evolución.',
      changes:[
        'La escala elegida al iniciar mantiene las naciones con IA completa y el mundo añade otras entidades políticas de forma dinámica.',
        'Las entidades adicionales usan una simulación ligera para mantener el rendimiento sin delatar su categoría al jugador.',
        'La cantidad total de entidades varía en cada mundo según la escala y la semilla de la partida.',
        'Cada entidad recibe un nombre, color y comportamiento propio; algunas son conformistas y otras más expansivas, comerciales o defensivas.',
        'La expansión sobre tierra neutral utiliza una simulación territorial muy barata para mantener el coste controlado.',
        'El objetivo de densidad sigue siendo aproximadamente un 97,5 % de tierra políticamente ocupada a los cinco minutos.',
        'La expansión tiene un presupuesto máximo por tick para proteger el rendimiento y evitar picos de CPU.',
        'Las partidas ya empezadas reciben las nuevas entidades automáticamente y la clasificación mezcla a todas las naciones sin indicar su categoría interna.'
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
            '<p>Global Geopolitical Strategy · versión 0.36.0</p>'+
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

  console.info('[HEXATEGOS] historial actualizado para 0.36.0');
})();