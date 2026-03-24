export const APP_CONFIG = {
  app: {
    title: 'SIMULADOR',
  },
  resources: {
    bootLogoPath: '../resources/logo.svg',
  },
  storage: {
    introSeenKey: 'gm14_intro_seen_v1',
    saveKey: 'gm14_save_v2',
    legacySaveKeys: ['gm13_save_v1'],
    hudLayoutKey: 'eliteHudLayout_v6',
    hudNotesKey: 'eliteHudNotes',
    hudNotesDraftKey: 'eliteHudNotesDraft',
  },
  boot: {
    delayMs: 2000,
    fadeMs: 1000,
  },
  intro: {
    subtitle: 'Historia del universo y guía de navegación',
    openDelayAfterBootMs: 120,
    dontShowCheckedByDefault: true,
    storyHtml: `
      <p>
        Este simulador nace como una reconstrucción interactiva del viaje humano por el espacio:
        no solo como un mapa de mundos y órbitas, sino como una crónica técnica y visual de cómo
        la humanidad aprendió a observar, calcular, despegar, sobrevivir y finalmente habitar el
        vacío entre estrellas.
      </p>
      <p>
        Durante siglos, el cielo fue una frontera inalcanzable. Primero llegaron la observación,
        la cartografía celeste, la mecánica orbital y las primeras máquinas capaces de abandonar
        la atmósfera. Más tarde vinieron las estaciones, la industria en órbita, las sondas
        automáticas, la navegación interplanetaria y los primeros asentamientos fuera de la Tierra.
        Cada avance fue pequeño frente a la escala del cosmos, pero decisivo para abrir el siguiente.
      </p>
      <p>
        En este universo, la exploración no se entiende como un salto mágico, sino como una suma de
        sistemas: motores, trayectorias, referencias inerciales, maniobras de aproximación, vuelos
        rasantes, inserciones orbitales, descensos controlados y navegación local sobre mundos de
        todo tipo. El jugador no solo viaja: aprende a situarse dentro de un marco astronómico en
        movimiento constante.
      </p>
      <p>
        La intención del simulador es mezclar contemplación, precisión y escala. Puedes observar una
        estrella lejana, entrar en un sistema, aproximarte a un planeta, mantenerte en órbita baja,
        rozar su atmósfera o desplazarte sobre su superficie mientras el cuerpo rota bajo ti. El
        universo no queda congelado para el jugador; sigue su curso, y tú te insertas dentro de él.
      </p>
      <p>
        Esta obra está pensada como una bitácora visual expandible. La historia, las facciones,
        los programas de exploración, las naves y los hitos tecnológicos pueden crecer con el
        tiempo. Este panel es también el prólogo de ese mundo: una puerta de entrada antes de
        despegar.
      </p>
      <p>
        Aquí comienza el viaje.
      </p>
    `,
    controlsHtml: `
      <p><strong>Orientación y maniobra</strong></p>
      <p>
        La cámara gira libremente respecto a la dirección actual de la nave, lo que permite
        apuntar, corregir la trayectoria y maniobrar con suavidad durante el vuelo.
      </p>
      <ul>
        <li><strong>W / S</strong>: cabeceo arriba / abajo</li>
        <li><strong>Q / E</strong>: guiñada izquierda / derecha</li>
        <li><strong>A / D</strong>: alabeo izquierda / derecha</li>
        <li><strong>Ratón / toque</strong>: vista libre respecto a la dirección actual</li>
      </ul>

      <p><strong>Velocidades</strong></p>
      <ul>
        <li><strong>0–9</strong>: hitos de velocidad</li>
        <li><strong>+</strong> / <strong>-</strong>: ajuste fino de velocidad</li>
        <li><strong>º / ª / Backquote</strong>: invertir sentido FWD / REV</li>
        <li><strong>X</strong>: detener la nave</li>
      </ul>

      <p><strong>Atajos del simulador</strong></p>
      <ul>
        <li><strong>C</strong>: mostrar / ocultar HUD</li>
        <li><strong>L</strong>: mostrar / ocultar labels</li>
        <li><strong>G</strong>: mostrar / ocultar grid</li>
        <li><strong>N</strong>: mostrar / ocultar notas</li>
        <li><strong>R</strong>: centrar vista</li>
        <li><strong>Y</strong>: activar / desactivar giroscopio</li>
        <li><strong>F3</strong> o <strong>P</strong>: overlay de rendimiento</li>
        <li><strong>F1</strong>: volver a abrir esta guía</li>
        <li><strong>F9</strong>: guardar estado</li>
        <li><strong>F10</strong>: cargar estado</li>
        <li><strong>F8</strong>: borrar guardado</li>
        <li><strong>Esc</strong>: cerrar esta ventana</li>
      </ul>

      <p><strong>Navegación orbital y de superficie</strong></p>
      <ul>
        <li>Al acercarte a un cuerpo celeste, la cámara puede quedar anclada a su marco local.</li>
        <li>Si estás en órbita o sobre la superficie, al volver se recupera la posición relativa al cuerpo.</li>
        <li>La escala del universo es grande: usa cambios de velocidad de forma progresiva.</li>
      </ul>
    `,
  },
  input: {
    flags: {
      saveKeysBound: '__gm13_saveKeysBound',
      introKeysBound: '__gm14_introKeysBound',
    },
    shortcuts: {
      save: 'F9',
      clearSave: 'F8',
      load: 'F10',
      openIntro: 'F1',
      closeModal: 'Escape',
    },
  },
  engine: {
    preserveDrawingBuffer: false,
    stencil: false,
    antialias: true,
    reverseDepthBuffer: true,
  },
  scene: {
    daysPerRealSecond: 1.0 / 86400.0,
    clearColor: [0, 0, 0, 1],
    keepDepthGroups: [1, 2, 3],
    canvasBackground: '#000',
    nearZDefault: 5e-4,
    nearZSurfaceDefault: 1e-3,
    nearZSurfaceMin: 1e-5,
    nearZSurfaceFactor: 0.15,
    maxZ: 5e9,
    saveIntervalMs: 30000,
    binaryUpdateMs: 33,
    presencePublishMs: 100,
    orbitSmoothHz: 12.0,
    initialSpawn: {
      orbitalAltitudeRadiusMul: 0.035,
      orbitalAltitudeMin: 0.0016,
      earthNames: ['Tierra', 'Earth', 'Terra'],
      sunNames: ['Sol', 'Sun', 'Solis'],
    },
  },
  camera: {
    baseSpeed: 100.0,
    fastMult: 1000.0,
    enableModeUI: false,
    angularSensibility: 3500,
    inertia: 0.0,
    angularInertia: 0.0,
    keysUp: [87],
    keysDown: [83],
    keysLeft: [65],
    keysRight: [68],
    keysUpward: [32],
    keysDownward: [17],
    unitsPerLyDefault: 1_000_000,
    ship: {
      rotAccel: 2.15,
      rotDamping: 3.0,
      accelK: 3.5,
      lookSensitivityMouse: 0.0032,
      lookSensitivityTouch: 0.0040,
      maxFreeLookPitch: Math.PI * 0.495,
      gyroGain: 1.8,
      gyroSmoothing: 0.18,
      gyroDeadZone: 0.03,
      gyroPitchLimit: Math.PI / 3,
      gyroYawLimit: Math.PI / 2,
      gyroRollLimit: Math.PI / 2,
    },
  },
  representation: {
    evalIntervalMs: 33,
    evalBudgetMs: 0.8,
    evalMaxPerTick: 250,
    transitionBudgetMs: 1.5,
    transitionMaxPerTick: 10,
    hysteresisRatio: 0.25,
    minStateHoldMs: 900,
    initialState: 'dot',
    createInitialRep: true,
    offDisablesLabels: true,
    offDisablesMesh: true,
    procRefineMaxCamSpeed: 200.0,
    remoteAtmosphere: {
       enabled: true,
       throttleMs: 120,
       minPx: 6,
       strongPx: 28,
       maxVisible: 8,
       maxCenterDistN: 1.85,
       localSuppressMul: 1.25,
       segments: 20,
       ppMinPx: 5,
       ppExitPx: 4,
       maxRemotePP: 2,
       maxTotalPP: 3,
    },
  },
  world: {
    kmPerUnitLocal: 1e6,
  },
  floatingOrigin: {
    thresh: 10,
    rebaseGrid: 2,
  },
  orbitAnchor: {
    captureMul: 6.0,
    minCaptureGap: 0.00010,
    stickyMul: 12.0,
    influenceHz: 1.5,
    offsetFollowHz: 4.0,
    carryFactor: 1.0,
  },
  bodyCollision: {
    padding: 0.0000005,
  },
  localSurfaceFlight: {
    moveFullMul: 0.002,
    moveFadeMul: 0.05,
    minMoveFullGap: 0.00001,
    minMoveFadeGap: 0.00015,
    alignFullMul: 0.0005,
    alignFadeMul: 0.008,
    minAlignFullGap: 0.000003,
    minAlignFadeGap: 0.00003,
    tangentMoveScale: 1.00,
    upMoveScale: 0.94,
    downMoveScale: 1.00,
	moveBlendHz: 18.0,
    alignHz: 0.85,
    alignMix: 0.10,
    upSmoothingHz: 10.0,
    turnAlignFullRadS: 0.20,
    turnAlignFadeRadS: 1.20,
    turnAlignMinFactor: 0.25,
  },
  localBodyGravity: {
    accelMul: 0.028,
    minAccel: 0.0000005,
    maxAccel: 0.000040,
    assistNear: 0.94,
    assistFar: 0.0,
    assistFullMul: 0.0012,
    assistFadeMul: 0.040,
    minAssistFullGap: 0.000008,
    minAssistFadeGap: 0.00015,
    radialDampingNear: 12.0,
    radialDampingFar: 1.5,
    groundClampMul: 0.00030,
    minGroundClampGap: 0.000004,
    maxFallSpeed: 0.000010,
  },
  systemDots: {
    minPx: 22.0,
    throttleMs: 80,
  },
  navGrid: {
    fixedAnchor: true,
    throttleMs: 0,
    autoCenter: false,
    followY: false,
    includeYZ: true,
    yLevel: 0,
    step: 250000,
    extent: 25000000,
    maxLinesPerAxis: 401,
    rebuildDistance: 0,
  },
  perfOverlay: {
    intervalMs: 250,
    visible: false,
    toggleKeys: ['F3', 'KeyP'],
  },
 };