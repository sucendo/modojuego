'use strict';

/*
 * F-22 Raptor · Misión 001
 * v4.1 · Radar & Countermeasures: radar real, misiles enemigos, alertas y bengalas.
 * - Estado encapsulado en la escena.
 * - Temporizadores y movimiento independientes de FPS.
 * - Una sola generación de enemigos.
 * - Misiles guiados con objetivo realmente más cercano.
 * - Baja altura sin eliminar/recrear colliders.
 * - Reciclado de proyectiles y limpieza fuera de pantalla.
 * - Reinicio limpio y HUD responsive.
 */

// -----------------------------------------------------------------------------
// Fondo Mapbox
// -----------------------------------------------------------------------------

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3VjZW5kbyIsImEiOiJjbTF0YjQ0bW0wMGo3MmtzYmhxM3Z3cXRtIn0.8wBIoqAHKxikEB3ilStfdQ';
const MAP_CENTER = [-3.4604086485761267, 40.485002191480696];

class MapBackground {
  constructor() {
    this.map = null;
    this.raf = null;
    this.startTime = 0;
    this.lastPaint = 0;
    this.currentCenter = [...MAP_CENTER];
    this.airspeedMps = 270;
    this.distanceTravelled = 0;
  }

  init() {
    if (!window.mapboxgl || !document.getElementById('map')) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    this.map = new mapboxgl.Map({
      container: 'map',
      center: MAP_CENTER,
      zoom: 14,
      pitch: 0,
      bearing: 43.5,
      style: 'mapbox://styles/mapbox/satellite-v9',
      interactive: false,
      attributionControl: false,
      logoPosition: 'bottom-right'
    });

    // Atribución obligatoria, pero en formato compacto y en una esquina.
    // Se mantiene visible por licencia, sin competir con el HUD principal.
    this.map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    this.map.on('load', () => {
      this.startTime = performance.now();
      this.lastPaint = this.startTime;
      this.currentCenter = [...MAP_CENTER];
      this.distanceTravelled = 0;
      this.animate(this.startTime);
    });
  }

  animate(now) {
    if (!this.map) return;

    // Limitar las actualizaciones del mapa a ~30 FPS: Phaser puede seguir a 60 FPS.
    if (now - this.lastPaint >= 33) {
      const dt = Math.min((now - this.lastPaint) / 1000, 0.12);
      const distance = this.airspeedMps * dt;
      this.distanceTravelled += distance;

      // La ruta describe una curva muy suave. El bearing de la cámara coincide con
      // el rumbo geográfico de avance, por lo que el terreno fluye hacia abajo.
      const bearing = 43.5 + Math.sin(this.distanceTravelled / 6500) * 2.5;
      const bearingRad = bearing * Math.PI / 180;
      const northMeters = Math.cos(bearingRad) * distance;
      const eastMeters = Math.sin(bearingRad) * distance;
      const lat = this.currentCenter[1];
      const metersPerDegreeLat = 111320;
      const metersPerDegreeLng = metersPerDegreeLat * Math.cos(lat * Math.PI / 180);

      this.currentCenter[1] += northMeters / metersPerDegreeLat;
      this.currentCenter[0] += eastMeters / Math.max(1, metersPerDegreeLng);
      this.map.jumpTo({ center: this.currentCenter, bearing });
      this.lastPaint = now;
    }

    this.raf = requestAnimationFrame((time) => this.animate(time));
  }

  setAirspeed(mps) {
    if (Number.isFinite(mps)) this.airspeedMps = Math.max(0, mps);
  }

  reset() {
    this.currentCenter = [...MAP_CENTER];
    this.distanceTravelled = 0;
    this.airspeedMps = 270;
    this.startTime = performance.now();
    this.lastPaint = this.startTime;
    if (!this.map) return;
    this.map.jumpTo({ center: MAP_CENTER, zoom: 14, pitch: 0, bearing: 43.5 });
  }
}

const mapBackground = new MapBackground();
window.addEventListener('load', () => mapBackground.init(), { once: true });

// -----------------------------------------------------------------------------
// Configuración del juego
// -----------------------------------------------------------------------------

const GAME = Object.freeze({
  // Movimiento del sprite del jugador dentro de la cámara (no es la TAS del avión).
  playerSpeed: 360,
  playerScreenAcceleration: 1250, // px/s²: respuesta rápida pero no instantánea
  playerScreenDeceleration: 880,
  playerBankMax: 15 * Math.PI / 180,
  playerBankResponse: 7.5,
  playerBankForeshorten: 0.16,
  playerLives: 3,

  // Tamaños visuales independientes de las dimensiones internas del SVG/PNG.
  playerDisplayHeight: 86,
  enemyDisplayHeight: 74,
  bulletDisplayHeight: 24,
  missileDisplayHeight: 38,
  cloudDisplayScale: 1,
  weatherMaxClouds: 34,
  weatherTransitionSeconds: 9,
  weatherChangeMinSeconds: 28,
  weatherChangeMaxSeconds: 48,
  weatherRainDrops: 28,
  weatherLightningMinSeconds: 2.8,
  weatherLightningMaxSeconds: 7.2,

  // Modelo cinemático simplificado de combate aéreo.
  // 1 píxel de la capa aérea equivale aproximadamente a 1 metro horizontal.
  playerInitialAirspeed: 270,   // m/s ≈ 972 km/h
  playerMinAirspeed: 180,
  playerMaxAirspeed: 350,
  playerThrottleStep: 20,
  playerAcceleration: 22,       // m/s² hacia la velocidad seleccionada
  playerManeuverVelocityScale: 0.22, // traduce el movimiento de pantalla a maniobra física aprox.
  playerWorldHeading: -Math.PI / 2, // rumbo de referencia: hacia la parte superior
  gravity: 9.80665,
  enemyMinSpeed: 170,
  enemyMaxSpeed: 345,
  enemyMaxAfterburnerSpeed: 410,
  enemyTurnSpeed: 235,
  enemyAcceleration: 20,
  maxEnemies: 10,
  maxNearbyEnemies: 5,
  enemySpawnMargin: 180,
  enemyVisibilityMargin: 70,
  enemyRejoinG: 8.2,
  enemyAttackG: 6.0,
  enemyCruiseG: 2.8,
  enemyMinTurnRate: 1.3 * Math.PI / 180,
  enemyMaxTurnRate: 22 * Math.PI / 180,

  // Dogfight y daño progresivo.
  enemyIntegrity: 100,
  enemyBulletDamageMin: 27,
  enemyBulletDamageMax: 39,
  enemyMissileDamageMin: 78,
  enemyMissileDamageMax: 112,
  enemyDamagedThreshold: 64,
  enemyCriticalThreshold: 30,
  enemyHitPoints: 120,
  enemyDamageSmokePool: 110,
  enemyDamageSmokeLifetime: 1.05,
  enemyFallingMinSeconds: 0.80,
  enemyFallingMaxSeconds: 1.65,

  bulletSpeed: 820,
  enemyShotSpeed: 430,
  maxBullets: 120,
  maxEnemyShots: 80,
  maxHomingMissiles: 10,

  // Misil aire-aire: modelo arcade-físico. La capacidad de giro se limita por G,
  // por lo que a mucha velocidad el radio de giro crece de forma natural.
  missileInitialSpeed: 235,
  missileBoostAcceleration: 255,
  missileSustainAcceleration: 72,
  missileCoastDrag: 44,
  missileMaxSpeed: 820,
  missileMinUsefulSpeed: 155,
  missileBoostTime: 1.55,
  missileBurnTime: 3.85,
  missileLifetime: 8.4,
  missileStraightTime: 0.26,
  missileMaxG: 27,
  missileAbsoluteMaxTurnRate: 1.35, // rad/s; además queda limitado por G/v
  missileNavConstant: 3.15,
  missileHeadingCorrection: 0.56,
  missileSeekerCone: 74 * Math.PI / 180,
  missileTrackLossDelay: 0.58,

  // Adquisición de blanco del avión.
  lockCone: 42 * Math.PI / 180,
  lockRange: 720,
  lockAcquireSeconds: 0.72,

  // Estela ligera: pool fijo, sin partículas infinitas.
  missileTrailPoolSize: 84,
  missileTrailInterval: 0.085,
  missileTrailLifetime: 0.72,

  // Misiles enemigos y contramedidas.
  maxEnemyMissiles: 16,
  enemyMissileRange: 980,
  enemyMissileLockCone: 29 * Math.PI / 180,
  enemyMissileBaseLockSeconds: 1.45,
  enemyMissileInitialSpeed: 225,
  enemyMissileBoostAcceleration: 235,
  enemyMissileSustainAcceleration: 58,
  enemyMissileCoastDrag: 48,
  enemyMissileMaxSpeed: 760,
  enemyMissileMinUsefulSpeed: 145,
  enemyMissileBoostTime: 1.45,
  enemyMissileBurnTime: 3.55,
  enemyMissileLifetime: 9.2,
  enemyMissileStraightTime: 0.24,
  enemyMissileMaxG: 23,
  enemyMissileAbsoluteMaxTurnRate: 1.20,
  enemyMissileNavConstant: 3.0,
  enemyMissileHeadingCorrection: 0.52,
  enemyMissileSeekerCone: 67 * Math.PI / 180,
  enemyMissileTrackLossDelay: 0.62,
  enemyMissileHitDistance: 25,

  flareCharges: 8,
  flareBurstCount: 2,
  flarePoolSize: 24,
  flareLifetime: 2.35,
  flareCooldownMs: 420,
  flareSeductionRadius: 285,

  radarRange: 1850,
  radarUpdateSeconds: 0.075,

  hitInvulnerabilityMs: 850,

  // Sensación de vuelo / pasadas.
  speedFxStartMps: 245,
  speedFxFullMps: 345,
  speedFxMaxStreaks: 20,
  closePassDistance: 128,
  closePassMinRelativeSpeed: 360,
  closePassFxCooldownMs: 650,

  pointsEnemy: 1000,
  costBullet: 10,
  costMissile: 300,
  hitPenalty: 500,
  introDelayMs: 1200,
  takeoffDurationMs: 4200
});

const PILOT_PROFILES = Object.freeze({
  ROOKIE: Object.freeze({
    id: 'ROOKIE',
    skill: 0.38,
    aggression: 0.42,
    gFactor: 0.78,
    reactionMin: 2.2,
    reactionMax: 3.5,
    fireCone: 18 * Math.PI / 180,
    fireRange: 0.64,
    aimError: 0.090,
    speedFactor: 0.96
  }),
  FIGHTER: Object.freeze({
    id: 'FIGHTER',
    skill: 0.61,
    aggression: 0.62,
    gFactor: 0.91,
    reactionMin: 1.55,
    reactionMax: 2.65,
    fireCone: 22 * Math.PI / 180,
    fireRange: 0.76,
    aimError: 0.062,
    speedFactor: 1.00
  }),
  VETERAN: Object.freeze({
    id: 'VETERAN',
    skill: 0.80,
    aggression: 0.76,
    gFactor: 1.03,
    reactionMin: 1.05,
    reactionMax: 1.90,
    fireCone: 25 * Math.PI / 180,
    fireRange: 0.86,
    aimError: 0.040,
    speedFactor: 1.035
  }),
  ACE: Object.freeze({
    id: 'ACE',
    skill: 0.96,
    aggression: 0.88,
    gFactor: 1.10,
    reactionMin: 0.72,
    reactionMax: 1.38,
    fireCone: 28 * Math.PI / 180,
    fireRange: 0.95,
    aimError: 0.022,
    speedFactor: 1.07
  })
});

const AUDIO_MIX = Object.freeze({
  master: 0.72,
  engine: 0.52,
  weapons: 0.78,
  alerts: 0.58,
  ambience: 0.38
});

const WEATHER_PRESETS = Object.freeze([
  {
    id: 'CLR',
    label: 'CLEAR',
    coverage: 0.18,
    cloudAlpha: 0.34,
    cloudScale: 0.86,
    shadeAlpha: 0.00,
    shadeColor: 0x16324a,
    windX: -6,
    storm: 0,
    rain: 0,
    visibility: 1
  },
  {
    id: 'SCT',
    label: 'SCATTERED',
    coverage: 0.43,
    cloudAlpha: 0.46,
    cloudScale: 1.00,
    shadeAlpha: 0.025,
    shadeColor: 0x17324a,
    windX: -11,
    storm: 0,
    rain: 0,
    visibility: 0.97
  },
  {
    id: 'BKN',
    label: 'BROKEN',
    coverage: 0.70,
    cloudAlpha: 0.56,
    cloudScale: 1.08,
    shadeAlpha: 0.065,
    shadeColor: 0x142b40,
    windX: -17,
    storm: 0.08,
    rain: 0,
    visibility: 0.90
  },
  {
    id: 'OVC',
    label: 'OVERCAST',
    coverage: 0.93,
    cloudAlpha: 0.63,
    cloudScale: 1.14,
    shadeAlpha: 0.115,
    shadeColor: 0x102538,
    windX: -23,
    storm: 0.24,
    rain: 0.08,
    visibility: 0.80
  },
  {
    id: 'TSR',
    label: 'THUNDERSTORM',
    coverage: 1.00,
    cloudAlpha: 0.76,
    cloudScale: 1.22,
    shadeAlpha: 0.205,
    shadeColor: 0x08131f,
    windX: -36,
    storm: 1,
    rain: 0.82,
    visibility: 0.58
  }
]);

const ENCOURAGEMENT = [
  '¡Sigue así, piloto!',
  '¡No hay enemigo que te detenga!',
  'Mantén la calma y sigue luchando.',
  'La misión depende de ti. ¡Tú puedes!',
  'Recuerda tu entrenamiento. Confiamos en ti.',
  'Cada enemigo derribado nos acerca a la victoria.',
  'Tu valentía nos inspira a todos. ¡Sigue así!'
];

class PlaneScene extends Phaser.Scene {
  constructor() {
    super('PlaneScene');
  }

  preload() {
    this.load.on('loaderror', (file) => {
      console.error('[Plane] No se pudo cargar el recurso:', file?.src || file?.key || file);
    });

    this.load.image('player', 'img/avion-f22.png');
    this.load.image('bullet', 'img/bala.png');
    this.load.image('homingMissile', 'img/cohete-blue.png');
    this.load.image('enemy', 'img/avion-su57.png');
    this.load.image('enemyShot', 'img/cohete-red.png');
  }

  create() {
    this.state = {
      score: 0,
      lives: GAME.playerLives,
      destroyed: 0,
      lowAltitude: false,
      controlsEnabled: false,
      spawningPaused: true,
      gameOver: false,
      invulnerableUntil: 0,
      missionStarted: false,
      playerAirspeed: GAME.playerInitialAirspeed,
      targetAirspeed: GAME.playerInitialAirspeed,
      flares: GAME.flareCharges
    };

    // Un navegador estrecho en un PC NO debe convertirse en interfaz móvil.
    // Solo usamos controles táctiles cuando el dispositivo tiene puntero grueso/táctil.
    this.isTouchDevice =
      (navigator.maxTouchPoints > 0) &&
      (window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window));

    this.layoutMode = this.getLayoutMode();
    this.isMobileLayout = this.layoutMode === 'mobile';
    this.isCompactLayout = this.layoutMode === 'compact' || this.layoutMode === 'micro';
    this.hudManualMinimal = false;

    mapBackground.setAirspeed(this.state.playerAirspeed);
    this.createProceduralCloudTextures();
    this.createWeatherSystem();
    this.createClouds();
    this.createSpeedFx();
    this.createPlayer();
    this.createPools();
    this.createMissileTrailPool();
    this.createEnemyDamageFxPool();
    this.createCountermeasureSystem();
    this.createWeaponLockSystem();
    this.createAudioSystem();
    this.createInput();
    this.createHud();
    this.createRadarSystem();
    this.createMobileControls();
    this.createCollisions();
    this.showIntro();
    this.scheduleEnemySpawn();
    this.scheduleEnemyFire();

    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onResize, this);
      this.shutdownAudio();
    });
  }

  createProceduralCloudTextures() {
    // Las texturas se generan UNA sola vez. Durante la partida las nubes son
    // sprites normales, por lo que el coste por frame es prácticamente idéntico
    // al de usar PNG/SVG precargados.
    const textureWidth = 420;
    const textureHeight = 210;

    const makeRandom = (seed) => {
      let s = seed >>> 0;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    };

    const drawPuff = (ctx, x, y, rx, ry, topAlpha, grey = false) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx, ry);
      const g = ctx.createRadialGradient(0, 0, 0.04, 0, 0, 1);
      if (grey) {
        g.addColorStop(0, `rgba(135,150,160,${topAlpha})`);
        g.addColorStop(0.48, `rgba(165,178,185,${topAlpha * 0.66})`);
        g.addColorStop(1, 'rgba(175,190,198,0)');
      } else {
        g.addColorStop(0, `rgba(255,255,255,${topAlpha})`);
        g.addColorStop(0.44, `rgba(247,251,252,${topAlpha * 0.88})`);
        g.addColorStop(0.78, `rgba(225,236,241,${topAlpha * 0.38})`);
        g.addColorStop(1, 'rgba(215,228,235,0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    for (let variant = 1; variant <= 4; variant++) {
      const key = `procCloud${variant}`;
      if (this.textures.exists(key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = textureWidth;
      canvas.height = textureHeight;
      const ctx = canvas.getContext('2d', { alpha: true });
      const rnd = makeRandom(0xC10D + variant * 977);

      // Sombra inferior amplia.
      const shadowPuffs = 12 + variant * 2;
      for (let i = 0; i < shadowPuffs; i++) {
        const x = textureWidth * (0.18 + rnd() * 0.64);
        const y = textureHeight * (0.54 + rnd() * 0.18);
        const rx = 48 + rnd() * 78;
        const ry = 22 + rnd() * 35;
        drawPuff(ctx, x, y, rx, ry, 0.12 + rnd() * 0.08, true);
      }

      // Cuerpo blanco: muchas formas solapadas dan un borde orgánico sin ruido
      // procedural en tiempo real.
      const whitePuffs = 18 + variant * 3;
      for (let i = 0; i < whitePuffs; i++) {
        const centerBias = 1 - Math.abs(rnd() * 2 - 1);
        const x = textureWidth * (0.12 + rnd() * 0.76);
        const y = textureHeight * (0.28 + rnd() * 0.46 - centerBias * 0.05);
        const rx = 34 + rnd() * 68 + centerBias * 20;
        const ry = 24 + rnd() * 42 + centerBias * 12;
        drawPuff(ctx, x, y, rx, ry, 0.30 + rnd() * 0.28, false);
      }

      this.textures.addCanvas(key, canvas);
    }

    // Cumulonimbos oscuros, también generados una sola vez.
    const drawStormPuff = (ctx, x, y, rx, ry, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx, ry);
      const g = ctx.createRadialGradient(0, 0, 0.04, 0, 0, 1);
      g.addColorStop(0, `rgba(38,48,58,${alpha})`);
      g.addColorStop(0.38, `rgba(58,69,79,${alpha * 0.92})`);
      g.addColorStop(0.70, `rgba(83,94,103,${alpha * 0.54})`);
      g.addColorStop(1, 'rgba(100,112,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    for (let variant = 1; variant <= 2; variant++) {
      const key = `procStorm${variant}`;
      if (this.textures.exists(key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = textureWidth;
      canvas.height = textureHeight;
      const ctx = canvas.getContext('2d', { alpha: true });
      const rnd = makeRandom(0x570A + variant * 1823);

      for (let i = 0; i < 27 + variant * 4; i++) {
        const x = textureWidth * (0.08 + rnd() * 0.84);
        const y = textureHeight * (0.22 + rnd() * 0.58);
        const centerBias = 1 - Math.abs(rnd() * 2 - 1);
        const rx = 42 + rnd() * 82 + centerBias * 28;
        const ry = 28 + rnd() * 54 + centerBias * 18;
        drawStormPuff(ctx, x, y, rx, ry, 0.24 + rnd() * 0.36);
      }

      // Parte superior algo más luminosa para conservar volumen.
      for (let i = 0; i < 8; i++) {
        drawPuff(
          ctx,
          textureWidth * (0.16 + rnd() * 0.68),
          textureHeight * (0.20 + rnd() * 0.30),
          42 + rnd() * 55,
          24 + rnd() * 34,
          0.11 + rnd() * 0.08,
          true
        );
      }

      this.textures.addCanvas(key, canvas);
    }
  }

  createWeatherSystem() {
    this.weather = {
      currentIndex: 1, // SCT al comenzar
      targetIndex: 1,
      blend: 1,
      transitionActive: false,
      nextChangeIn: Phaser.Math.FloatBetween(
        GAME.weatherChangeMinSeconds,
        GAME.weatherChangeMaxSeconds
      ),
      lightningIn: Phaser.Math.FloatBetween(
        GAME.weatherLightningMinSeconds,
        GAME.weatherLightningMaxSeconds
      ),
      lightningAlpha: 0
    };

    const { width, height } = this.scale;
    this.weatherShade = this.add.rectangle(
      0, 0, width, height, 0x16324a, 0
    ).setOrigin(0, 0).setDepth(-30).setScrollFactor(0);

    this.lightningFlash = this.add.rectangle(
      0, 0, width, height, 0xd9efff, 0
    ).setOrigin(0, 0).setDepth(90).setScrollFactor(0);

    this.rainDrops = [];
    for (let i = 0; i < GAME.weatherRainDrops; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, Math.max(1, width)),
        Phaser.Math.Between(0, Math.max(1, height)),
        1,
        Phaser.Math.Between(13, 28),
        0xcbe8f4,
        0
      ).setDepth(48).setAngle(-8);
      drop.rainSpeed = Phaser.Math.FloatBetween(620, 980);
      drop.rainDrift = Phaser.Math.FloatBetween(-100, -55);
      this.rainDrops.push(drop);
    }
  }

  createClouds() {
    this.clouds = [];
    const { width, height } = this.scale;

    for (let i = 0; i < GAME.weatherMaxClouds; i++) {
      const depth = Phaser.Math.FloatBetween(0.52, 1.55);
      const cloud = this.add.image(
        Phaser.Math.Between(0, Math.max(1, width)),
        Phaser.Math.Between(-Math.round(height * 0.25), Math.max(1, height)),
        `procCloud${Phaser.Math.Between(1, 4)}`
      );

      cloud.coverageRank = (i + Phaser.Math.FloatBetween(0, 0.88)) / GAME.weatherMaxClouds;
      cloud.baseDepth = depth;
      cloud.baseScale = Phaser.Math.FloatBetween(0.48, 1.05) * depth;
      cloud.baseAlpha = Phaser.Math.FloatBetween(0.72, 1.0);
      cloud.currentAlpha = 0;
      cloud.scrollSpeed = Phaser.Math.Linear(82, 235, Phaser.Math.Clamp(depth / 1.55, 0, 1));
      cloud.parallaxFactor = Phaser.Math.Linear(0.028, 0.13, Phaser.Math.Clamp(depth / 1.55, 0, 1));
      cloud.windBias = Phaser.Math.FloatBetween(-7, 7);
      cloud.normalTexture = `procCloud${Phaser.Math.Between(1, 4)}`;
      cloud.stormTexture = `procStorm${Phaser.Math.Between(1, 2)}`;
      cloud.usingStormTexture = false;
      cloud.setTexture(cloud.normalTexture);
      cloud.setAlpha(0);
      cloud.setDepth(-10 + depth);
      this.clouds.push(cloud);
    }

    this.applyWeatherImmediately();
  }

  getWeatherBlendValue(property) {
    const weather = this.weather;
    if (!weather) return WEATHER_PRESETS[1][property];

    const from = WEATHER_PRESETS[weather.currentIndex];
    const to = WEATHER_PRESETS[weather.targetIndex];
    const t = Phaser.Math.Clamp(weather.blend, 0, 1);

    if (typeof from[property] === 'number' && typeof to[property] === 'number') {
      return Phaser.Math.Linear(from[property], to[property], t);
    }
    return t < 0.5 ? from[property] : to[property];
  }

  getWeatherDisplayPreset() {
    if (!this.weather) return WEATHER_PRESETS[1];
    if (!this.weather.transitionActive) return WEATHER_PRESETS[this.weather.currentIndex];
    return this.weather.blend < 0.5
      ? WEATHER_PRESETS[this.weather.currentIndex]
      : WEATHER_PRESETS[this.weather.targetIndex];
  }

  applyWeatherImmediately() {
    if (!this.weather) return;
    const preset = WEATHER_PRESETS[this.weather.currentIndex];
    this.weather.targetIndex = this.weather.currentIndex;
    this.weather.blend = 1;
    this.weather.transitionActive = false;

    for (const cloud of this.clouds || []) {
      const on = cloud.coverageRank <= preset.coverage;
      cloud.currentAlpha = on ? preset.cloudAlpha * cloud.baseAlpha : 0;
      cloud.setAlpha(cloud.currentAlpha);
      cloud.setScale(cloud.baseScale * preset.cloudScale);
    }

    if (this.weatherShade) {
      this.weatherShade.setFillStyle(preset.shadeColor, preset.shadeAlpha);
    }
  }

  chooseNextWeather() {
    const current = this.weather.currentIndex;

    // El tiempo evoluciona gradualmente: normalmente se mueve un escalón,
    // evitando saltar de despejado a cubierto instantáneamente.
    const candidates = [];
    if (current > 0) candidates.push(current - 1);
    if (current < WEATHER_PRESETS.length - 1) candidates.push(current + 1);

    // Ocasionalmente mantiene el estado un ciclo más.
    if (Phaser.Math.FloatBetween(0, 1) < 0.18) candidates.push(current);

    return Phaser.Utils.Array.GetRandom(candidates);
  }

  beginWeatherTransition(nextIndex = this.chooseNextWeather()) {
    if (!this.weather || nextIndex == null) return;
    this.weather.targetIndex = nextIndex;
    this.weather.blend = 0;
    this.weather.transitionActive = nextIndex !== this.weather.currentIndex;

    if (!this.weather.transitionActive) {
      this.weather.blend = 1;
      this.weather.nextChangeIn = Phaser.Math.FloatBetween(
        GAME.weatherChangeMinSeconds,
        GAME.weatherChangeMaxSeconds
      );
    }

    this.updateHud();
  }

  updateWeather(dt) {
    if (!this.weather) return;

    if (this.weather.transitionActive) {
      this.weather.blend = Math.min(
        1,
        this.weather.blend + dt / GAME.weatherTransitionSeconds
      );

      if (this.weather.blend >= 1) {
        this.weather.currentIndex = this.weather.targetIndex;
        this.weather.targetIndex = this.weather.currentIndex;
        this.weather.transitionActive = false;
        this.weather.nextChangeIn = Phaser.Math.FloatBetween(
          GAME.weatherChangeMinSeconds,
          GAME.weatherChangeMaxSeconds
        );
        this.updateHud();
      }
    } else {
      this.weather.nextChangeIn -= dt;
      if (this.weather.nextChangeIn <= 0) this.beginWeatherTransition();
    }

    const coverage = this.getWeatherBlendValue('coverage');
    const cloudAlpha = this.getWeatherBlendValue('cloudAlpha');
    const cloudScale = this.getWeatherBlendValue('cloudScale');
    const shadeAlpha = this.getWeatherBlendValue('shadeAlpha');
    const stormIntensity = this.getWeatherBlendValue('storm');
    const rainIntensity = this.getWeatherBlendValue('rain');

    const from = WEATHER_PRESETS[this.weather.currentIndex];
    const to = WEATHER_PRESETS[this.weather.targetIndex];
    const shadeT = Phaser.Math.Clamp(this.weather.blend, 0, 1);
    const shadeColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(from.shadeColor),
      Phaser.Display.Color.IntegerToColor(to.shadeColor),
      100,
      Math.round(shadeT * 100)
    );
    const shadeInt = Phaser.Display.Color.GetColor(
      shadeColor.r,
      shadeColor.g,
      shadeColor.b
    );

    this.weatherShade?.setFillStyle(shadeInt, shadeAlpha);

    for (const cloud of this.clouds || []) {
      const thresholdFade = Phaser.Math.Clamp(
        (coverage - cloud.coverageRank) * 13 + 0.5,
        0,
        1
      );
      const targetAlpha = cloudAlpha * cloud.baseAlpha * thresholdFade;
      cloud.currentAlpha = Phaser.Math.Linear(
        cloud.currentAlpha ?? 0,
        targetAlpha,
        1 - Math.exp(-2.2 * dt)
      );
      cloud.setAlpha(cloud.currentAlpha);
      cloud.setScale(cloud.baseScale * cloudScale);

      // Durante tormenta una fracción creciente del banco de nubes pasa a usar
      // cumulonimbos oscuros. Solo cambiamos textura cuando el estado cambia.
      const shouldStorm = stormIntensity > 0.18 &&
        cloud.coverageRank < Phaser.Math.Clamp(stormIntensity * 0.82, 0, 0.82);

      if (shouldStorm !== cloud.usingStormTexture) {
        cloud.usingStormTexture = shouldStorm;
        cloud.setTexture(shouldStorm ? cloud.stormTexture : cloud.normalTexture);
      }
    }

    this.updateStormFx(dt, stormIntensity, rainIntensity);
  }

  updateStormFx(dt, stormIntensity, rainIntensity) {
    const { width, height } = this.scale;

    // Lluvia con pool fijo.
    for (const drop of this.rainDrops || []) {
      const targetAlpha = rainIntensity * 0.34;
      drop.setAlpha(targetAlpha);
      if (targetAlpha <= 0.005) continue;

      drop.y += drop.rainSpeed * (0.72 + rainIntensity * 0.55) * dt;
      drop.x += drop.rainDrift * dt;

      if (drop.y > height + 35 || drop.x < -30) {
        drop.y = Phaser.Math.Between(-90, -8);
        drop.x = Phaser.Math.Between(0, Math.max(1, width + 70));
        drop.rainSpeed = Phaser.Math.FloatBetween(620, 980);
      }
    }

    // Relámpagos escasos: un rectángulo ya existente, sin filtros ni partículas.
    if (stormIntensity > 0.52) {
      this.weather.lightningIn -= dt;
      if (this.weather.lightningIn <= 0) {
        this.weather.lightningAlpha = Phaser.Math.FloatBetween(0.22, 0.48) * stormIntensity;
        this.weather.lightningIn = Phaser.Math.FloatBetween(
          GAME.weatherLightningMinSeconds,
          GAME.weatherLightningMaxSeconds
        );
        if (this.state.missionStarted) {
          this.cameras.main.shake(70, 0.0011 * stormIntensity);
          const thunderDelay = Phaser.Math.Between(180, 760);
          this.time.delayedCall(thunderDelay, () => {
            if (!this.state.gameOver) this.playThunderSound(stormIntensity);
          });
        }
      }
    } else {
      this.weather.lightningIn = Math.max(
        this.weather.lightningIn,
        Phaser.Math.FloatBetween(1.8, 3.2)
      );
    }

    this.weather.lightningAlpha = Math.max(
      0,
      this.weather.lightningAlpha - dt * 2.9
    );
    this.lightningFlash?.setAlpha(this.weather.lightningAlpha);

    // Turbulencia VISUAL mínima; no cambia la física ni roba el control.
    this.visualStormTurbulence = stormIntensity * 0.018;
  }

  createSpeedFx() {
    this.speedFxBoost = 0;
    this.lastClosePassFxAt = -10000;
    this.speedStreaks = [];

    const { width, height } = this.scale;

    for (let i = 0; i < GAME.speedFxMaxStreaks; i++) {
      const depth = Phaser.Math.FloatBetween(0.45, 1);
      const streak = this.add.rectangle(
        Phaser.Math.Between(0, Math.max(1, width)),
        Phaser.Math.Between(0, Math.max(1, height)),
        Phaser.Math.FloatBetween(1, 2.2),
        Phaser.Math.FloatBetween(12, 34),
        0xd9f8ff,
        0
      ).setDepth(6);

      streak.fxDepth = depth;
      streak.fxBaseAlpha = Phaser.Math.FloatBetween(0.12, 0.35);
      streak.fxDrift = Phaser.Math.FloatBetween(-18, 18);
      this.speedStreaks.push(streak);
    }
  }

  resetSpeedStreak(streak, fromTop = true) {
    const { width, height } = this.scale;
    streak.x = Phaser.Math.Between(0, Math.max(1, width));
    streak.y = fromTop
      ? Phaser.Math.Between(-Math.max(30, Math.round(height * 0.22)), -8)
      : Phaser.Math.Between(0, Math.max(1, height));
    streak.fxDepth = Phaser.Math.FloatBetween(0.45, 1);
    streak.fxBaseAlpha = Phaser.Math.FloatBetween(0.12, 0.35);
    streak.fxDrift = Phaser.Math.FloatBetween(-18, 18);
  }

  createPlayer() {
    const { width, height } = this.scale;
    this.player = this.physics.add.sprite(width / 2, height + 80, 'player');
    this.player.setDisplaySize(
      GAME.playerDisplayHeight * (33.5 / 44),
      GAME.playerDisplayHeight
    );
    this.player.normalScaleX = this.player.scaleX;
    this.player.normalScaleY = this.player.scaleY;

    // Empieza pequeño para conservar el efecto visual del despegue.
    this.player.setScale(
      this.player.normalScaleX * 0.18,
      this.player.normalScaleY * 0.18
    );
    this.player.entityType = 'player';
    this.player.visualBank = 0;
    this.player.altitudeVisualScale = 1;
    this.player.altitudeVisualScaleTarget = 1;
    this.player.commandVelocity = new Phaser.Math.Vector2(0, 0);
    this.player.setDepth(20);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(
      this.player.width * 0.62,
      this.player.height * 0.72,
      true
    );
  }

  createPools() {
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: GAME.maxBullets,
      runChildUpdate: false
    });

    this.homingMissiles = this.physics.add.group({
      defaultKey: 'homingMissile',
      maxSize: GAME.maxHomingMissiles,
      runChildUpdate: false
    });

    this.enemies = this.physics.add.group({ maxSize: GAME.maxEnemies });
    this.enemyShots = this.physics.add.group({
      defaultKey: 'enemyShot',
      maxSize: GAME.maxEnemyShots
    });

    this.enemyMissiles = this.physics.add.group({
      defaultKey: 'enemyShot',
      maxSize: GAME.maxEnemyMissiles,
      runChildUpdate: false
    });
  }


  createMissileTrailPool() {
    this.missileTrailParticles = [];
    for (let i = 0; i < GAME.missileTrailPoolSize; i++) {
      const puff = this.add.circle(0, 0, 3, 0xdce7eb, 0)
        .setDepth(13)
        .setVisible(false);
      puff.trailActive = false;
      puff.life = 0;
      puff.maxLife = GAME.missileTrailLifetime;
      puff.driftX = 0;
      puff.driftY = 0;
      this.missileTrailParticles.push(puff);
    }
    this.missileTrailCursor = 0;
  }

  spawnMissileTrail(missile) {
    if (!this.missileTrailParticles?.length) return;
    const puff = this.missileTrailParticles[this.missileTrailCursor];
    this.missileTrailCursor = (this.missileTrailCursor + 1) % this.missileTrailParticles.length;

    puff.trailActive = true;
    puff.life = puff.maxLife;
    puff.setVisible(true)
      .setPosition(missile.x, missile.y)
      .setRadius(Phaser.Math.FloatBetween(2.2, 4.2))
      .setAlpha(0.32);

    puff.driftX = Phaser.Math.FloatBetween(-12, 12);
    puff.driftY = Phaser.Math.FloatBetween(24, 48);
  }

  updateMissileTrails(dt) {
    for (const puff of this.missileTrailParticles || []) {
      if (!puff.trailActive) continue;
      puff.life -= dt;
      if (puff.life <= 0) {
        puff.trailActive = false;
        puff.setVisible(false).setAlpha(0);
        continue;
      }

      const t = puff.life / puff.maxLife;
      puff.x += puff.driftX * dt;
      puff.y += puff.driftY * dt;
      puff.setAlpha(0.32 * t * t);
      puff.setScale(1 + (1 - t) * 1.7);
    }
  }


  createEnemyDamageFxPool() {
    this.enemyDamagePuffs = [];
    this.enemyDamagePuffCursor = 0;

    for (let i = 0; i < GAME.enemyDamageSmokePool; i++) {
      const puff = this.add.circle(0, 0, 4, 0x65717a, 0)
        .setDepth(11)
        .setVisible(false);
      puff.fxActive = false;
      puff.life = 0;
      puff.maxLife = GAME.enemyDamageSmokeLifetime;
      puff.vx = 0;
      puff.vy = 0;
      this.enemyDamagePuffs.push(puff);
    }
  }

  spawnEnemyDamagePuff(enemy, critical = false) {
    if (!enemy || !this.enemyDamagePuffs?.length) return;

    const puff = this.enemyDamagePuffs[this.enemyDamagePuffCursor];
    this.enemyDamagePuffCursor =
      (this.enemyDamagePuffCursor + 1) % this.enemyDamagePuffs.length;

    const life = Phaser.Math.FloatBetween(
      critical ? 0.78 : 0.60,
      critical ? 1.18 : 0.95
    );

    puff.fxActive = true;
    puff.life = life;
    puff.maxLife = life;
    puff.setVisible(true)
      .setPosition(
        enemy.x + Phaser.Math.FloatBetween(-7, 7),
        enemy.y + Phaser.Math.FloatBetween(-4, 10)
      )
      .setRadius(Phaser.Math.FloatBetween(3.2, critical ? 7.2 : 5.7))
      .setFillStyle(
        critical
          ? Phaser.Math.RND.pick([0x20272c, 0x30383d, 0x4b4f50, 0xa54a22])
          : Phaser.Math.RND.pick([0x5a6469, 0x6d777b, 0x475157]),
        critical ? 0.58 : 0.42
      )
      .setAlpha(critical ? 0.58 : 0.42)
      .setScale(1);

    puff.vx = Phaser.Math.FloatBetween(-18, 18);
    puff.vy = Phaser.Math.FloatBetween(34, 76);
  }

  updateEnemyDamageFx(dt) {
    for (const puff of this.enemyDamagePuffs || []) {
      if (!puff.fxActive) continue;

      puff.life -= dt;
      if (puff.life <= 0) {
        puff.fxActive = false;
        puff.setVisible(false).setAlpha(0);
        continue;
      }

      const t = puff.life / puff.maxLife;
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.setAlpha((0.12 + 0.46 * t) * t);
      puff.setScale(1 + (1 - t) * 1.65);
    }
  }


  createCountermeasureSystem() {
    this.flarePool = [];
    this.nextFlareAt = 0;

    for (let i = 0; i < GAME.flarePoolSize; i++) {
      const flare = this.add.circle(0, 0, 4, 0xffd25a, 0)
        .setDepth(24)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setVisible(false);

      flare.flareActive = false;
      flare.life = 0;
      flare.maxLife = GAME.flareLifetime;
      flare.heat = 0;
      flare.vx = 0;
      flare.vy = 0;
      this.flarePool.push(flare);
    }
  }

  getActiveFlares() {
    return (this.flarePool || []).filter((flare) => flare.flareActive);
  }

  deployFlares() {
    if (
      this.state.gameOver ||
      !this.state.controlsEnabled ||
      this.state.flares <= 0 ||
      this.time.now < this.nextFlareAt
    ) return;

    this.nextFlareAt = this.time.now + GAME.flareCooldownMs;
    this.state.flares--;
    this.playFlareSound();

    const baseVx = this.player.body?.velocity.x || 0;
    const baseVy = this.player.body?.velocity.y || 0;
    let emitted = 0;

    for (const flare of this.flarePool) {
      if (flare.flareActive) continue;

      const side = emitted % 2 === 0 ? -1 : 1;
      flare.flareActive = true;
      flare.life = GAME.flareLifetime * Phaser.Math.FloatBetween(0.88, 1.08);
      flare.maxLife = flare.life;
      flare.heat = 1;
      flare.vx = baseVx * 0.20 + side * Phaser.Math.FloatBetween(72, 112);
      flare.vy = baseVy * 0.12 + Phaser.Math.FloatBetween(145, 205);

      flare
        .setVisible(true)
        .setPosition(
          this.player.x + side * Phaser.Math.FloatBetween(7, 13),
          this.player.y + Phaser.Math.FloatBetween(12, 21)
        )
        .setRadius(Phaser.Math.FloatBetween(3.5, 5.5))
        .setFillStyle(
          Phaser.Math.RND.pick([0xfff0a4, 0xffcf48, 0xff8a32]),
          0.96
        )
        .setAlpha(0.96)
        .setScale(1);

      emitted++;
      if (emitted >= GAME.flareBurstCount) break;
    }

    this.showWeaponCue(`FLARES ${this.state.flares}`, '#ffd45b');
    this.updateHud();
  }

  updateFlares(dt) {
    const { width, height } = this.scale;

    for (const flare of this.flarePool || []) {
      if (!flare.flareActive) continue;

      flare.life -= dt;
      if (flare.life <= 0) {
        flare.flareActive = false;
        flare.heat = 0;
        flare.setVisible(false).setAlpha(0);
        continue;
      }

      const t = Phaser.Math.Clamp(flare.life / flare.maxLife, 0, 1);
      flare.heat = t * t;
      flare.vx *= Math.pow(0.945, dt * 60);
      flare.vy += 55 * dt;
      flare.x += flare.vx * dt;
      flare.y += flare.vy * dt;

      const flicker = 0.82 + 0.18 * Math.sin(this.time.now * 0.052 + flare.x);
      flare.setAlpha(Phaser.Math.Clamp(t * 1.15 * flicker, 0, 1));
      flare.setScale(Phaser.Math.Linear(1.7, 0.65, t));

      if (
        flare.x < -90 || flare.x > width + 90 ||
        flare.y < -90 || flare.y > height + 120
      ) {
        flare.flareActive = false;
        flare.heat = 0;
        flare.setVisible(false);
      }
    }
  }

  createWeaponLockSystem() {
    this.weaponLock = {
      candidate: null,
      target: null,
      progress: 0,
      status: 'SEARCH'
    };

    this.lockGraphics = this.add.graphics()
      .setDepth(111)
      .setScrollFactor(0);

    this.lockText = this.add.text(0, 0, '', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '10px',
      color: '#ffd84b',
      stroke: '#001018',
      strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(112).setVisible(false);
  }

  findLockCandidate() {
    if (this.state.lowAltitude || !this.enemies) return null;

    const visibility = this.getWeatherBlendValue('visibility');
    const maxRange = GAME.lockRange * Phaser.Math.Linear(0.72, 1, visibility);
    const forward = -Math.PI / 2;

    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active || enemy.isDying || !this.isEnemyVisible(enemy, 60)) continue;

      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > maxRange) continue;

      const bearing = Math.atan2(dy, dx);
      const angularError = Math.abs(Phaser.Math.Angle.Wrap(bearing - forward));
      if (angularError > GAME.lockCone) continue;

      const score = distance * (1 + angularError * 1.45);
      if (score < bestScore) {
        bestScore = score;
        best = enemy;
      }
    }

    return best;
  }

  updateWeaponLock(dt) {
    if (!this.weaponLock) return;

    if (this.state.lowAltitude) {
      this.weaponLock.candidate = null;
      this.weaponLock.target = null;
      this.weaponLock.progress = 0;
      this.weaponLock.status = 'SEARCH';
      this.updateLockReticle();
      return;
    }

    const candidate = this.findLockCandidate();

    if (candidate && candidate === this.weaponLock.candidate) {
      const visibility = this.getWeatherBlendValue('visibility');
      const weatherPenalty = Phaser.Math.Linear(1.55, 1, visibility);
      this.weaponLock.progress = Math.min(
        1,
        this.weaponLock.progress + dt / (GAME.lockAcquireSeconds * weatherPenalty)
      );
    } else {
      this.weaponLock.candidate = candidate;
      this.weaponLock.target = null;
      this.weaponLock.progress = candidate ? 0.06 : 0;
    }

    if (!candidate) {
      this.weaponLock.status = 'SEARCH';
      this.weaponLock.target = null;
    } else if (this.weaponLock.progress >= 1) {
      this.weaponLock.status = 'LOCK';
      this.weaponLock.target = candidate;
    } else {
      this.weaponLock.status = 'TRACK';
    }

    this.updateLockReticle();

    if (this.mobileButtons?.missile) {
      const c = this.weaponLock.status === 'LOCK'
        ? 0x67ff9f
        : (this.weaponLock.status === 'TRACK' ? 0xffcf32 : 0xff9a32);
      this.mobileButtons.missile.bg.setStrokeStyle(2, c, 0.9);
    }
  }

  updateLockReticle() {
    if (!this.lockGraphics || !this.lockText) return;

    this.lockGraphics.clear();
    const enemy = this.weaponLock?.candidate;

    if (!enemy?.active || !this.isEnemyVisible(enemy, 20)) {
      this.lockText.setVisible(false);
      return;
    }

    const locked = this.weaponLock.status === 'LOCK';
    const color = locked ? 0x69ff9e : 0xffd84b;
    const radius = locked ? 29 : 25 + this.weaponLock.progress * 5;

    this.lockGraphics.lineStyle(2, color, 0.9);
    this.lockGraphics.strokeCircle(enemy.x, enemy.y, radius);

    // Pequeñas marcas angulares, más legibles que un círculo grande.
    const arm = 7;
    const r = radius + 4;
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const x1 = enemy.x + Math.cos(a) * (r - arm);
      const y1 = enemy.y + Math.sin(a) * (r - arm);
      const x2 = enemy.x + Math.cos(a) * r;
      const y2 = enemy.y + Math.sin(a) * r;
      this.lockGraphics.lineBetween(x1, y1, x2, y2);
    }

    const pct = Math.round(this.weaponLock.progress * 100);
    this.lockText
      .setVisible(true)
      .setPosition(enemy.x, enemy.y - radius - 6)
      .setColor(locked ? '#69ff9e' : '#ffd84b')
      .setText(locked ? 'LOCK' : `TRACK ${pct}%`);
  }

  showWeaponCue(text, color = '#ffd84b') {
    const compact = this.hudPresentationMode === 'compact' || this.hudPresentationMode === 'micro';
    const cue = this.add.text(this.player.x, this.player.y - 58, text, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: compact ? '12px' : '16px',
      color,
      stroke: '#001018',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(130);

    this.tweens.add({
      targets: cue,
      y: cue.y - 12,
      alpha: 0,
      duration: 580,
      ease: 'Cubic.easeOut',
      onComplete: () => cue.destroy()
    });
  }


  createAudioSystem() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audio = {
      supported: !!AudioCtx,
      ctx: null,
      unlocked: false,
      muted: false,
      master: null,
      engineBus: null,
      weaponsBus: null,
      alertsBus: null,
      ambienceBus: null,
      engineOscA: null,
      engineOscB: null,
      engineFilter: null,
      engineGain: null,
      rainSource: null,
      rainFilter: null,
      rainGain: null,
      noiseBuffer: null,
      lockStatus: 'SEARCH',
      lockBeepCooldown: 0,
      nodesToStop: []
    };

    if (!AudioCtx) return;

    // Reutilizamos un único AudioContext entre reinicios. Así, una vez desbloqueado
    // por un gesto del usuario, el navegador no vuelve a silenciar la siguiente misión.
    const ctx = window.__planeAudioContext || new AudioCtx();
    window.__planeAudioContext = ctx;
    this.audio.ctx = ctx;
    this.audio.unlocked = ctx.state === 'running';

    const master = ctx.createGain();
    const engineBus = ctx.createGain();
    const weaponsBus = ctx.createGain();
    const alertsBus = ctx.createGain();
    const ambienceBus = ctx.createGain();

    master.gain.value = AUDIO_MIX.master;
    engineBus.gain.value = AUDIO_MIX.engine;
    weaponsBus.gain.value = AUDIO_MIX.weapons;
    alertsBus.gain.value = AUDIO_MIX.alerts;
    ambienceBus.gain.value = AUDIO_MIX.ambience;

    engineBus.connect(master);
    weaponsBus.connect(master);
    alertsBus.connect(master);
    ambienceBus.connect(master);
    master.connect(ctx.destination);

    this.audio.master = master;
    this.audio.engineBus = engineBus;
    this.audio.weaponsBus = weaponsBus;
    this.audio.alertsBus = alertsBus;
    this.audio.ambienceBus = ambienceBus;

    // Buffer de ruido único reutilizado por lluvia, explosiones y whoosh.
    const seconds = 2;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x51A7E;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[i] = ((seed / 4294967296) * 2 - 1) * 0.82;
    }
    this.audio.noiseBuffer = buffer;

    // Motor: dos capas muy baratas, filtradas. La frecuencia se actualiza suavemente
    // según la velocidad real del F-22.
    const engineOscA = ctx.createOscillator();
    const engineOscB = ctx.createOscillator();
    const engineFilter = ctx.createBiquadFilter();
    const engineGain = ctx.createGain();

    engineOscA.type = 'sawtooth';
    engineOscB.type = 'sine';
    engineOscA.frequency.value = 88;
    engineOscB.frequency.value = 44;
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 520;
    engineFilter.Q.value = 0.7;
    engineGain.gain.value = 0;

    engineOscA.connect(engineFilter);
    engineOscB.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(engineBus);
    engineOscA.start();
    engineOscB.start();

    this.audio.engineOscA = engineOscA;
    this.audio.engineOscB = engineOscB;
    this.audio.engineFilter = engineFilter;
    this.audio.engineGain = engineGain;
    this.audio.nodesToStop.push(engineOscA, engineOscB);

    // Ambiente de lluvia: un solo noise source en loop. El gain permanece a 0
    // fuera de tormenta, por lo que no crea trabajo adicional por frame.
    const rainSource = ctx.createBufferSource();
    const rainFilter = ctx.createBiquadFilter();
    const rainGain = ctx.createGain();
    rainSource.buffer = buffer;
    rainSource.loop = true;
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 2500;
    rainFilter.Q.value = 0.45;
    rainGain.gain.value = 0;

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(ambienceBus);
    rainSource.start();

    this.audio.rainSource = rainSource;
    this.audio.rainFilter = rainFilter;
    this.audio.rainGain = rainGain;
    this.audio.nodesToStop.push(rainSource);
  }

  unlockAudio() {
    const a = this.audio;
    if (!a?.supported || !a.ctx) return;

    const finish = () => {
      a.unlocked = a.ctx.state === 'running';
      this.updateAudioHud();
    };

    if (a.ctx.state === 'suspended') {
      a.ctx.resume().then(finish).catch(() => {});
    } else {
      finish();
    }
  }

  toggleAudioMute() {
    if (!this.audio?.supported) return;
    this.unlockAudio();
    this.audio.muted = !this.audio.muted;

    const ctx = this.audio.ctx;
    if (ctx && this.audio.master) {
      this.audio.master.gain.setTargetAtTime(
        this.audio.muted ? 0 : AUDIO_MIX.master,
        ctx.currentTime,
        0.025
      );
    }
    this.updateAudioHud();
  }

  updateAudioHud() {
    if (!this.hudSound) return;

    if (!this.audio?.supported) {
      this.hudSound.setText('NO SND').setColor('#83939d');
      return;
    }

    if (this.audio.muted) {
      this.hudSound.setText('MUTE').setColor('#ff6a78');
    } else if (!this.audio.unlocked) {
      this.hudSound.setText('SND?').setColor('#ffcf32');
    } else {
      this.hudSound.setText('SND').setColor('#70f2ff');
    }
  }

  updateAudio(dt) {
    const a = this.audio;
    if (!a?.supported || !a.ctx) return;

    a.unlocked = a.ctx.state === 'running';
    const now = a.ctx.currentTime;
    const engineOn = this.state?.missionStarted && !this.state?.gameOver;

    const speedNorm = Phaser.Math.Clamp(
      ((this.state?.playerAirspeed || GAME.playerInitialAirspeed) - GAME.playerMinAirspeed) /
      Math.max(1, GAME.playerMaxAirspeed - GAME.playerMinAirspeed),
      0,
      1
    );
    const bankLoad = Math.abs(this.player?.visualBank || 0) /
      Math.max(0.001, GAME.playerBankMax);

    const fundamental = 76 + speedNorm * 76 + bankLoad * 5;
    const engineLevel = engineOn ? (0.040 + speedNorm * 0.034 + bankLoad * 0.006) : 0;

    a.engineOscA?.frequency.setTargetAtTime(fundamental * 1.93, now, 0.055);
    a.engineOscB?.frequency.setTargetAtTime(fundamental, now, 0.065);
    a.engineFilter?.frequency.setTargetAtTime(390 + speedNorm * 580, now, 0.07);
    a.engineGain?.gain.setTargetAtTime(engineLevel, now, 0.08);

    const rain = this.getWeatherBlendValue?.('rain') || 0;
    a.rainGain?.gain.setTargetAtTime(
      engineOn ? rain * 0.105 : 0,
      now,
      0.16
    );

    this.updateLockAudio(dt);
  }

  updateLockAudio(dt) {
    const a = this.audio;
    if (!a?.unlocked || a.muted || !this.weaponLock) return;

    a.lockBeepCooldown = Math.max(0, a.lockBeepCooldown - dt);
    const status = this.weaponLock.status || 'SEARCH';

    if (status === 'LOCK' && a.lockStatus !== 'LOCK') {
      this.playLockConfirmSound();
      a.lockBeepCooldown = 0.55;
    } else if (status === 'TRACK' && a.lockBeepCooldown <= 0) {
      const p = Phaser.Math.Clamp(this.weaponLock.progress || 0, 0, 1);
      this.playTone(560 + p * 220, 590 + p * 240, 0.055, 'square', 0.045, 'alerts');
      a.lockBeepCooldown = Phaser.Math.Linear(0.43, 0.19, p);
    }

    a.lockStatus = status;
  }

  getAudioBus(name) {
    if (!this.audio) return null;
    if (name === 'engine') return this.audio.engineBus;
    if (name === 'alerts') return this.audio.alertsBus;
    if (name === 'ambience') return this.audio.ambienceBus;
    return this.audio.weaponsBus;
  }

  makePanner(pan = 0) {
    const ctx = this.audio?.ctx;
    if (!ctx) return null;
    if (!ctx.createStereoPanner) return null;
    const panner = ctx.createStereoPanner();
    panner.pan.value = Phaser.Math.Clamp(pan, -1, 1);
    return panner;
  }

  playTone(startHz, endHz, duration, type = 'sine', gain = 0.08, busName = 'weapons', pan = 0, delay = 0) {
    const a = this.audio;
    if (!a?.unlocked || a.muted || !a.ctx) return;

    const ctx = a.ctx;
    const bus = this.getAudioBus(busName);
    if (!bus) return;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const panner = this.makePanner(pan);
    const start = ctx.currentTime + Math.max(0, delay);
    const stop = start + Math.max(0.02, duration);

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, startHz), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), stop);

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.012, duration * 0.25));
    amp.gain.exponentialRampToValueAtTime(0.0001, stop);

    osc.connect(amp);
    if (panner) {
      amp.connect(panner);
      panner.connect(bus);
    } else {
      amp.connect(bus);
    }

    osc.start(start);
    osc.stop(stop + 0.02);
  }

  playNoise(duration, gain = 0.08, filterHz = 1000, busName = 'weapons', pan = 0, filterType = 'bandpass', playbackRate = 1) {
    const a = this.audio;
    if (!a?.unlocked || a.muted || !a.ctx || !a.noiseBuffer) return;

    const ctx = a.ctx;
    const bus = this.getAudioBus(busName);
    if (!bus) return;

    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    const panner = this.makePanner(pan);
    const now = ctx.currentTime;

    src.buffer = a.noiseBuffer;
    src.playbackRate.value = playbackRate;
    filter.type = filterType;
    filter.frequency.value = filterHz;
    filter.Q.value = filterType === 'bandpass' ? 0.8 : 0.35;

    amp.gain.setValueAtTime(Math.max(0.0002, gain), now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(amp);
    if (panner) {
      amp.connect(panner);
      panner.connect(bus);
    } else {
      amp.connect(bus);
    }

    src.start(now, Math.random() * 0.8);
    src.stop(now + duration + 0.03);
  }

  audioPanFromX(x) {
    const width = Math.max(1, this.scale?.width || 1);
    return Phaser.Math.Clamp((x / width) * 2 - 1, -0.9, 0.9);
  }


  playFlareSound() {
    this.playNoise(0.18, 0.055, 1800, 'weapons', 0, 'bandpass', 1.25);
    this.playTone(410, 245, 0.16, 'triangle', 0.028, 'weapons');
  }

  playEnemyMissileLaunchSound(x) {
    const pan = this.audioPanFromX(x);
    this.playNoise(0.30, 0.065, 640, 'weapons', pan, 'lowpass', 0.82);
    this.playTone(145, 72, 0.28, 'sawtooth', 0.040, 'weapons', pan);
  }

  playMissileWarningSound(distance) {
    const urgency = 1 - Phaser.Math.Clamp(distance / 900, 0, 1);
    this.playTone(
      820 + urgency * 260,
      900 + urgency * 320,
      0.075,
      'square',
      0.055 + urgency * 0.025,
      'alerts'
    );
  }

  playGunSound() {
    this.playNoise(0.055, 0.10, 1750, 'weapons', 0, 'bandpass', 1.35);
    this.playTone(155, 82, 0.048, 'square', 0.055, 'weapons');
  }

  playEnemyWeaponSound(x) {
    const pan = this.audioPanFromX(x);
    this.playNoise(0.07, 0.032, 1300, 'weapons', pan, 'bandpass', 1.18);
    this.playTone(120, 72, 0.06, 'triangle', 0.022, 'weapons', pan);
  }

  playMissileLaunchSound() {
    this.playNoise(0.36, 0.115, 720, 'weapons', 0, 'lowpass', 0.78);
    this.playTone(112, 48, 0.34, 'sawtooth', 0.075, 'weapons');
    this.playTone(360, 185, 0.18, 'triangle', 0.034, 'weapons', 0, 0.025);
  }

  playNoLockSound() {
    this.playTone(230, 155, 0.12, 'square', 0.055, 'alerts');
    this.playTone(190, 125, 0.12, 'square', 0.045, 'alerts', 0, 0.13);
  }

  playLockConfirmSound() {
    this.playTone(820, 870, 0.095, 'square', 0.055, 'alerts');
    this.playTone(1080, 1180, 0.14, 'square', 0.065, 'alerts', 0, 0.105);
  }

  playPlayerHitSound() {
    this.playNoise(0.24, 0.16, 520, 'weapons', 0, 'lowpass', 0.76);
    this.playTone(92, 44, 0.28, 'sawtooth', 0.11, 'weapons');
    this.playTone(540, 260, 0.13, 'square', 0.04, 'alerts', 0, 0.02);
  }

  playExplosionSound(x, strength = 1) {
    const pan = this.audioPanFromX(x);
    const g = Phaser.Math.Clamp(strength, 0.45, 1.25);
    this.playNoise(0.55, 0.16 * g, 310, 'weapons', pan, 'lowpass', 0.62);
    this.playNoise(0.22, 0.075 * g, 1100, 'weapons', pan, 'bandpass', 0.86);
    this.playTone(82, 31, 0.50, 'sine', 0.095 * g, 'weapons', pan);
  }

  playClosePassSound(side, relativeSpeed) {
    const pan = Phaser.Math.Clamp(side, -1, 1);
    const intensity = Phaser.Math.Clamp((relativeSpeed - 300) / 450, 0.45, 1);
    this.playNoise(0.42, 0.13 * intensity, 760, 'ambience', pan, 'bandpass', 1.55);
    this.playTone(230 + intensity * 90, 82, 0.34, 'sine', 0.045 * intensity, 'ambience', pan);
  }

  playThunderSound(intensity = 1) {
    const pan = Phaser.Math.FloatBetween(-0.7, 0.7);
    const g = Phaser.Math.Clamp(intensity, 0.4, 1);
    this.playNoise(1.55, 0.12 * g, 190, 'ambience', pan, 'lowpass', 0.48);
    this.playTone(58, 29, 1.25, 'sine', 0.082 * g, 'ambience', pan);
    this.playNoise(0.34, 0.035 * g, 1300, 'ambience', pan, 'bandpass', 0.72);
  }

  playGameOverSound() {
    this.playTone(330, 260, 0.25, 'sawtooth', 0.055, 'alerts');
    this.playTone(245, 185, 0.32, 'sawtooth', 0.055, 'alerts', 0, 0.24);
    this.playTone(180, 95, 0.52, 'sawtooth', 0.065, 'alerts', 0, 0.53);
  }

  shutdownAudio() {
    const a = this.audio;
    if (!a?.supported) return;

    for (const node of a.nodesToStop || []) {
      try { node.stop?.(); } catch (_) {}
      try { node.disconnect?.(); } catch (_) {}
    }

    for (const node of [
      a.engineGain, a.engineFilter,
      a.rainGain, a.rainFilter,
      a.engineBus, a.weaponsBus, a.alertsBus, a.ambienceBus, a.master
    ]) {
      try { node?.disconnect?.(); } catch (_) {}
    }
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
      missile: Phaser.Input.Keyboard.KeyCodes.A,
      low: Phaser.Input.Keyboard.KeyCodes.D,
      high: Phaser.Input.Keyboard.KeyCodes.F,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      slower: Phaser.Input.Keyboard.KeyCodes.Q,
      faster: Phaser.Input.Keyboard.KeyCodes.E,
      hud: Phaser.Input.Keyboard.KeyCodes.H,
      mute: Phaser.Input.Keyboard.KeyCodes.M,
      flare: Phaser.Input.Keyboard.KeyCodes.C,
      radar: Phaser.Input.Keyboard.KeyCodes.G
    });

    this.pointerTarget = null;
    this.mobileMovePointerId = null;
    this.mobileMoveVector = new Phaser.Math.Vector2(0, 0);
    this.mobileFireHeld = false;
    this.mobileNextGunAt = 0;

    this.input.keyboard.on('keydown', () => this.unlockAudio());

    this.input.on('pointerdown', (pointer) => {
      this.unlockAudio();
      if (!this.state.controlsEnabled || this.state.gameOver) return;

      if (this.isMobileLayout) {
        const j = this.mobileJoystick;
        if (j && Phaser.Math.Distance.Between(pointer.x, pointer.y, j.x, j.y) <= j.radius * 1.35) {
          this.mobileMovePointerId = pointer.id;
          this.updateMobileJoystick(pointer);
        }
        return;
      }

      this.pointerTarget = { x: pointer.x, y: pointer.y };
    });

    this.input.on('pointermove', (pointer) => {
      if (this.isMobileLayout) {
        if (pointer.isDown && pointer.id === this.mobileMovePointerId) this.updateMobileJoystick(pointer);
        return;
      }
      if (pointer.isDown && this.pointerTarget) {
        this.pointerTarget.x = pointer.x;
        this.pointerTarget.y = pointer.y;
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (this.isMobileLayout && pointer.id === this.mobileMovePointerId) {
        this.mobileMovePointerId = null;
        this.mobileMoveVector.set(0, 0);
        this.mobileJoystick?.knob?.setPosition(this.mobileJoystick.x, this.mobileJoystick.y);
      } else if (!this.isMobileLayout) {
        this.pointerTarget = null;
      }
    });
  }

  getLayoutMode() {
    const width = this.scale.width || window.innerWidth;
    const height = this.scale.height || window.innerHeight;

    if (this.isTouchDevice) return 'mobile';

    // Escritorio con navegador muy reducido: una sola franja HUD de 28 px.
    if (width < 560 || height < 420) return 'micro';

    // Ventana pequeña/mediana de escritorio: HUD compacto, sin barra inferior.
    if (width < 980 || height < 620) return 'compact';

    return 'desktop';
  }

  toggleHudMinimal() {
    if (this.isMobileLayout) return;
    this.hudManualMinimal = !this.hudManualMinimal;
    this.applyHudLayout();
    this.layoutRadar();
    this.updateHud();
  }

  createHud() {
    const { width, height } = this.scale;

    // HUD compacto: conserva la estética arcade sin ocupar el campo de combate.
    this.hudPanels = {
      left: this.add.rectangle(8, 8, 210, 62, 0x06131d, 0.72)
        .setOrigin(0, 0).setStrokeStyle(1, 0x27d9ff, 0.72).setDepth(96),
      center: this.add.rectangle(width / 2, 8, 188, 62, 0x06131d, 0.72)
        .setOrigin(0.5, 0).setStrokeStyle(1, 0xffc928, 0.72).setDepth(96),
      right: this.add.rectangle(width - 8, 8, 228, 62, 0x06131d, 0.72)
        .setOrigin(1, 0).setStrokeStyle(1, 0xff395d, 0.72).setDepth(96),
      bottom: this.add.rectangle(width / 2, height - 6, Math.min(760, width - 20), 28, 0x04101a, 0.68)
        .setOrigin(0.5, 1).setStrokeStyle(1, 0x27d9ff, 0.45).setDepth(96)
    };

    this.hudAccents = {
      left: this.add.rectangle(11, 11, 3, 56, 0x27d9ff, 1).setOrigin(0, 0).setDepth(97),
      center: this.add.rectangle(width / 2, 11, 54, 3, 0xffc928, 1).setOrigin(0.5, 0).setDepth(97),
      right: this.add.rectangle(width - 11, 11, 3, 56, 0xff395d, 1).setOrigin(1, 0).setDepth(97)
    };

    const labelStyle = {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '10px',
      color: '#63e7ff',
      stroke: '#001018',
      strokeThickness: 2
    };
    const valueStyle = {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '23px',
      color: '#ffffff',
      stroke: '#001018',
      strokeThickness: 4
    };

    this.hudScoreLabel = this.add.text(20, 14, 'SCORE', labelStyle).setDepth(100);
    this.hudScore = this.add.text(20, 24, '000000', valueStyle).setDepth(100);
    this.hudLives = this.add.text(20, 49, '', {
      ...labelStyle, fontSize: '11px', color: '#ffcf32'
    }).setDepth(100);

    this.hudMission = this.add.text(width / 2, 13, 'F-22 // MISSION 001', {
      ...labelStyle, color: '#ffcf32', fontSize: '9px'
    }).setOrigin(0.5, 0).setDepth(100);
    this.hudSpeed = this.add.text(width / 2, 23, '0972', {
      ...valueStyle, fontSize: '27px'
    }).setOrigin(0.5, 0).setDepth(100);
    this.hudSpeedUnit = this.add.text(width / 2, 49, 'KM/H', {
      ...labelStyle, fontSize: '9px', color: '#ffffff'
    }).setOrigin(0.5, 0).setDepth(100);

    this.hudRight = this.add.text(width - 20, 14, '', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      align: 'right',
      lineSpacing: 1,
      stroke: '#001018',
      strokeThickness: 3
    }).setOrigin(1, 0).setDepth(100);

    // Velocidad fuera de la cabecera: pequeño instrumento independiente.
    this.speedWidget = {
      panel: this.add.rectangle(8, height - 8, 154, 32, 0x04131f, 0.72)
        .setOrigin(0, 1).setStrokeStyle(1, 0x41dfff, 0.66).setDepth(101),
      label: this.add.text(15, height - 31, 'SPD', {
        ...labelStyle, fontSize: '8px', color: '#58e7ff'
      }).setDepth(103),
      value: this.add.text(45, height - 34, '972', {
        ...valueStyle, fontSize: '17px'
      }).setDepth(103),
      unit: this.add.text(88, height - 29, 'KM/H', {
        ...labelStyle, fontSize: '7px', color: '#dffaff'
      }).setDepth(103),
      target: this.add.text(147, height - 29, '', {
        ...labelStyle, fontSize: '7px', color: '#ffcf32'
      }).setOrigin(1, 0).setDepth(103),
      bars: []
    };

    for (let i = 0; i < 7; i++) {
      this.speedWidget.bars.push(
        this.add.rectangle(15 + i * 18, height - 12, 14, 3, 0x17384a, 0.85)
          .setOrigin(0, 1).setDepth(103)
      );
    }

    this.hudWeather = this.add.text(width / 2, 31, 'WX // SCT', {
      ...labelStyle, fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5, 0).setDepth(100);

    this.hudSound = this.add.text(width / 2, 52, 'SND?', {
      ...labelStyle,
      fontSize: '7px',
      color: '#ffcf32',
      backgroundColor: 'rgba(3,16,26,.42)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0).setDepth(104).setInteractive({ useHandCursor: true });

    this.hudSound.on('pointerdown', (pointer) => {
      pointer.event?.preventDefault?.();
      this.toggleAudioMute();
    });

    this.helpText = this.add.text(width / 2, height - 10,
      '[ARROWS] MOVE  [Q/E] SPD  [SPACE] GUN  [A] MSL  [C] FLR  [D/F] ALT  [G] RAD  [M] SND', {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '10px', color: '#dffaff', stroke: '#001018', strokeThickness: 3
      }).setOrigin(0.5, 1).setDepth(100).setScrollFactor(0);

    this.applyHudLayout();
    this.updateHud();
  }

  applyHudLayout() {
    const { width, height } = this.scale;

    this.layoutMode = this.getLayoutMode();
    this.isMobileLayout = this.layoutMode === 'mobile';
    this.isCompactLayout = this.layoutMode === 'compact' || this.layoutMode === 'micro';

    // H permite forzar el HUD ultramínimo en escritorio.
    const mode = (!this.isMobileLayout && this.hudManualMinimal) ? 'micro' : this.layoutMode;
    this.hudPresentationMode = mode;

    if (mode === 'mobile') {
      const top = 6;
      this.hudPanels.left.setPosition(5, top).setSize(118, 43).setAlpha(0.6).setVisible(true);
      this.hudPanels.center.setPosition(width / 2, top).setSize(112, 43).setAlpha(0.6).setVisible(true);
      this.hudPanels.right.setPosition(width - 5, top).setSize(124, 43).setAlpha(0.6).setVisible(true);
      this.hudPanels.bottom.setVisible(false);

      this.hudAccents.left.setVisible(true).setPosition(8, 9).setSize(2, 37);
      this.hudAccents.center.setVisible(true).setPosition(width / 2, 9).setSize(38, 2);
      this.hudAccents.right.setVisible(true).setPosition(width - 8, 9).setSize(2, 37);

      this.hudScoreLabel.setVisible(true).setPosition(13, 10).setFontSize(8).setText('PTS');
      this.hudScore.setVisible(true).setPosition(13, 18).setFontSize(17);
      this.hudLives.setVisible(true).setPosition(13, 35).setFontSize(9);

      this.hudMission.setVisible(false);
      this.hudSpeed.setVisible(false);
      this.hudSpeedUnit.setVisible(false);
      this.hudWeather.setVisible(true).setPosition(width / 2, 14).setFontSize(11);
      this.hudSound.setVisible(true).setPosition(width / 2, 34).setFontSize(7);

      this.hudRight.setVisible(true).setPosition(width - 13, 11).setFontSize(8).setLineSpacing(0);
      this.helpText.setVisible(false);
      this.layoutSpeedWidget(mode);
      return;
    }

    if (mode === 'micro') {
      // HUD de escritorio para ventanas realmente pequeñas.
      const top = 3;
      const gap = 3;
      const leftW = Math.max(128, Math.floor(width * 0.34));
      const centerW = Math.max(82, Math.floor(width * 0.20));
      const rightW = Math.max(138, width - leftW - centerW - gap * 4);

      this.hudPanels.left.setVisible(true).setPosition(gap, top).setSize(leftW, 28).setAlpha(0.52);
      this.hudPanels.center.setVisible(true).setPosition(width / 2, top).setSize(centerW, 28).setAlpha(0.52);
      this.hudPanels.right.setVisible(true).setPosition(width - gap, top).setSize(rightW, 28).setAlpha(0.52);
      this.hudPanels.bottom.setVisible(false);

      this.hudAccents.left.setVisible(false);
      this.hudAccents.center.setVisible(false);
      this.hudAccents.right.setVisible(false);

      this.hudScoreLabel.setVisible(false);
      this.hudScore.setVisible(true).setPosition(9, 7).setFontSize(13);
      this.hudLives.setVisible(true).setPosition(Math.min(leftW - 47, 82), 9).setFontSize(8);

      this.hudMission.setVisible(false);
      this.hudSpeed.setVisible(false);
      this.hudSpeedUnit.setVisible(false);
      this.hudWeather.setVisible(true).setPosition(width / 2, 6).setFontSize(7);
      this.hudSound.setVisible(true).setPosition(width / 2, 18).setFontSize(6);

      this.hudRight.setVisible(true).setPosition(width - 9, 9).setFontSize(7).setLineSpacing(0);
      this.helpText.setVisible(false);
      this.layoutSpeedWidget(mode);
      return;
    }

    if (mode === 'compact') {
      const top = 4;
      const leftW = Math.min(170, Math.max(150, Math.floor(width * 0.24)));
      const centerW = Math.min(132, Math.max(112, Math.floor(width * 0.17)));
      const rightW = Math.min(200, Math.max(174, Math.floor(width * 0.28)));

      this.hudPanels.left.setVisible(true).setPosition(5, top).setSize(leftW, 38).setAlpha(0.6);
      this.hudPanels.center.setVisible(true).setPosition(width / 2, top).setSize(centerW, 38).setAlpha(0.6);
      this.hudPanels.right.setVisible(true).setPosition(width - 5, top).setSize(rightW, 38).setAlpha(0.6);
      this.hudPanels.bottom.setVisible(false);

      this.hudAccents.left.setVisible(true).setPosition(8, 7).setSize(2, 32);
      this.hudAccents.center.setVisible(true).setPosition(width / 2, 7).setSize(34, 2);
      this.hudAccents.right.setVisible(true).setPosition(width - 8, 7).setSize(2, 32);

      this.hudScoreLabel.setVisible(true).setPosition(13, 8).setFontSize(7).setText('SCORE');
      this.hudScore.setVisible(true).setPosition(13, 15).setFontSize(16);
      this.hudLives.setVisible(true).setPosition(13, 30).setFontSize(8);

      this.hudMission.setVisible(false);
      this.hudSpeed.setVisible(false);
      this.hudSpeedUnit.setVisible(false);
      this.hudWeather.setVisible(true).setPosition(width / 2, 8).setFontSize(9);
      this.hudSound.setVisible(true).setPosition(width / 2, 25).setFontSize(6);

      this.hudRight.setVisible(true).setPosition(width - 12, 8).setFontSize(7).setLineSpacing(0);
      this.helpText.setVisible(false);
      this.layoutSpeedWidget(mode);
      return;
    }

    // Escritorio normal.
    this.hudPanels.left.setVisible(true).setPosition(8, 8).setSize(210, 62).setAlpha(0.72);
    this.hudPanels.center.setVisible(true).setPosition(width / 2, 8).setSize(188, 62).setAlpha(0.72);
    this.hudPanels.right.setVisible(true).setPosition(width - 8, 8).setSize(228, 62).setAlpha(0.72);
    this.hudPanels.bottom.setVisible(true).setPosition(width / 2, height - 6).setSize(Math.min(760, width - 20), 28);

    this.hudAccents.left.setVisible(true).setPosition(11, 11).setSize(3, 56);
    this.hudAccents.center.setVisible(true).setPosition(width / 2, 11).setSize(54, 3);
    this.hudAccents.right.setVisible(true).setPosition(width - 11, 11).setSize(3, 56);

    this.hudScoreLabel.setVisible(true).setPosition(20, 14).setFontSize(10).setText('SCORE');
    this.hudScore.setVisible(true).setPosition(20, 24).setFontSize(23);
    this.hudLives.setVisible(true).setPosition(20, 49).setFontSize(11);

    this.hudMission.setVisible(true).setPosition(width / 2, 13).setFontSize(9);
    this.hudSpeed.setVisible(false);
    this.hudSpeedUnit.setVisible(false);
    this.hudWeather.setVisible(true).setPosition(width / 2, 27).setFontSize(15);
    this.hudSound.setVisible(true).setPosition(width / 2, 50).setFontSize(7);

    this.hudRight.setVisible(true).setPosition(width - 20, 14).setFontSize(10).setLineSpacing(1);
    this.helpText.setVisible(true).setPosition(width / 2, height - 10);
    this.layoutSpeedWidget(mode);
  }


  layoutSpeedWidget(mode = this.hudPresentationMode || 'desktop') {
    if (!this.speedWidget) return;

    const { width, height } = this.scale;
    const w = this.speedWidget;

    let x = 8;
    let y = height - 8;
    let panelW = 154;
    let panelH = 32;
    let compact = false;

    if (mode === 'mobile') {
      panelW = 142;
      panelH = 27;
      x = width / 2 - panelW / 2;
      y = height - 7;
      compact = true;
    } else if (mode === 'micro') {
      panelW = 126;
      panelH = 23;
      x = 4;
      y = height - 4;
      compact = true;
    } else if (mode === 'compact') {
      panelW = 142;
      panelH = 27;
      x = 5;
      y = height - 5;
      compact = true;
    }

    w.panel.setVisible(true).setPosition(x, y).setSize(panelW, panelH);

    const top = y - panelH;
    w.label.setVisible(true).setPosition(x + 7, top + (compact ? 4 : 5)).setFontSize(compact ? 7 : 8);
    w.value.setVisible(true).setPosition(x + (compact ? 31 : 37), top + (compact ? 2 : 3)).setFontSize(compact ? 14 : 17);
    w.unit.setVisible(!compact || mode === 'mobile')
      .setPosition(x + (compact ? 73 : 80), top + (compact ? 7 : 8))
      .setFontSize(7);
    w.target.setVisible(true)
      .setPosition(x + panelW - 7, top + (compact ? 7 : 8))
      .setFontSize(7);

    const barY = y - 4;
    const gap = compact ? 15 : 18;
    for (let i = 0; i < w.bars.length; i++) {
      w.bars[i]
        .setVisible(true)
        .setPosition(x + 7 + i * gap, barY)
        .setSize(compact ? 11 : 14, compact ? 2 : 3);
    }
  }


  createRadarSystem() {
    this.radar = {
      visible: true,
      timer: 0,
      x: 0,
      y: 0,
      size: 112
    };

    this.radarGraphics = this.add.graphics()
      .setDepth(116)
      .setScrollFactor(0);

    this.radarLabel = this.add.text(0, 0, 'RAD', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '7px',
      color: '#77ecff',
      stroke: '#001018',
      strokeThickness: 2
    }).setDepth(117).setScrollFactor(0);

    this.missileWarningText = this.add.text(
      this.scale.width / 2,
      78,
      '',
      {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '18px',
        color: '#ff3f52',
        stroke: '#001018',
        strokeThickness: 5,
        backgroundColor: 'rgba(25,0,4,.46)',
        padding: { x: 9, y: 4 }
      }
    ).setOrigin(0.5, 0)
      .setDepth(145)
      .setScrollFactor(0)
      .setVisible(false);

    this.missileWarningCooldown = 0;
    this.layoutRadar();
    this.drawRadar();
  }

  toggleRadar() {
    if (!this.radar) return;
    this.radar.visible = !this.radar.visible;
    this.radarGraphics?.setVisible(this.radar.visible);
    this.radarLabel?.setVisible(this.radar.visible);
    if (this.radar.visible) this.drawRadar();
  }

  layoutRadar() {
    if (!this.radar) return;

    const { width, height } = this.scale;
    const mode = this.hudPresentationMode || this.layoutMode || 'desktop';

    let size = 112;
    let x = width - size - 12;
    let y = height - size - 44;

    if (mode === 'compact') {
      size = 88;
      x = width - size - 7;
      y = height - size - 7;
    } else if (mode === 'micro') {
      size = 66;
      x = width - size - 4;
      y = height - size - 4;
    } else if (mode === 'mobile') {
      size = Math.max(72, Math.min(90, width * 0.13));
      x = 8;
      y = 54;
    }

    this.radar.size = size;
    this.radar.x = x;
    this.radar.y = y;

    this.radarLabel
      ?.setPosition(x + 7, y + 5)
      .setFontSize(mode === 'micro' ? 6 : 7);

    const warnY =
      mode === 'micro' ? 34 :
      mode === 'compact' ? 45 :
      mode === 'mobile' ? 53 :
      78;

    this.missileWarningText
      ?.setPosition(width / 2, warnY)
      .setFontSize(
        mode === 'micro' ? 11 :
        mode === 'compact' ? 13 :
        mode === 'mobile' ? 14 :
        18
      );
  }

  drawRadar() {
    if (!this.radar?.visible || !this.radarGraphics) return;

    const g = this.radarGraphics;
    const { x, y, size } = this.radar;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const radius = size * 0.43;
    const range = GAME.radarRange;

    g.clear();

    g.fillStyle(0x03131d, 0.60);
    g.fillCircle(cx, cy, size * 0.49);

    g.lineStyle(1, 0x55dff4, 0.45);
    g.strokeCircle(cx, cy, radius);
    g.lineStyle(1, 0x55dff4, 0.20);
    g.strokeCircle(cx, cy, radius * 0.52);
    g.lineBetween(cx - radius, cy, cx + radius, cy);
    g.lineBetween(cx, cy - radius, cx, cy + radius);

    // Jugador.
    g.fillStyle(0x69eaff, 1);
    g.fillTriangle(
      cx, cy - 5,
      cx - 4, cy + 4,
      cx + 4, cy + 4
    );

    const plotContact = (dx, dy, color, shape = 'square', alpha = 1) => {
      const distance = Math.hypot(dx, dy);
      const scale = radius / range;
      let px = dx * scale;
      let py = dy * scale;

      if (distance > range) {
        const s = radius / Math.max(1, distance * scale);
        px *= s;
        py *= s;
      }

      const rx = cx + px;
      const ry = cy + py;

      g.fillStyle(color, alpha);
      if (shape === 'diamond') {
        g.fillTriangle(rx, ry - 4, rx - 4, ry, rx, ry + 4);
        g.fillTriangle(rx, ry - 4, rx + 4, ry, rx, ry + 4);
      } else if (shape === 'missile') {
        g.fillCircle(rx, ry, 2.7);
        g.lineStyle(1, color, alpha);
        g.lineBetween(rx - 4, ry, rx + 4, ry);
        g.lineBetween(rx, ry - 4, rx, ry + 4);
      } else {
        g.fillRect(rx - 2.2, ry - 2.2, 4.4, 4.4);
      }
    };

    for (const enemy of this.enemies?.getChildren?.() || []) {
      if (!enemy.active || enemy.isDying) continue;

      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const isLock = enemy === this.weaponLock?.candidate;

      plotContact(
        dx,
        dy,
        isLock
          ? (this.weaponLock?.status === 'LOCK' ? 0x6aff9d : 0xffd54c)
          : 0xff455d,
        isLock ? 'diamond' : 'square',
        0.96
      );
    }

    for (const missile of this.enemyMissiles?.getChildren?.() || []) {
      if (!missile.active) continue;
      plotContact(
        missile.x - this.player.x,
        missile.y - this.player.y,
        0xfff05a,
        'missile',
        1
      );
    }
  }

  updateRadar(dt) {
    if (!this.radar?.visible) return;

    this.radar.timer -= dt;
    if (this.radar.timer <= 0) {
      this.radar.timer = GAME.radarUpdateSeconds;
      this.drawRadar();
    }
  }

  getMissileDirectionGlyph(dx, dy) {
    const angle = Math.atan2(dy, dx);
    const octant = Math.round(angle / (Math.PI / 4));
    const glyphs = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
    return glyphs[(octant + 8) % 8];
  }

  updateMissileWarning(dt) {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const missile of this.enemyMissiles?.getChildren?.() || []) {
      if (!missile.active) continue;
      const distance = Phaser.Math.Distance.Between(
        missile.x, missile.y,
        this.player.x, this.player.y
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = missile;
      }
    }

    if (!nearest) {
      this.missileWarningText?.setVisible(false);
      this.missileWarningCooldown = 0;
      return;
    }

    const dx = nearest.x - this.player.x;
    const dy = nearest.y - this.player.y;
    const direction = this.getMissileDirectionGlyph(dx, dy);
    const meters = Math.max(0, Math.round(nearestDistance));

    this.missileWarningText
      ?.setVisible(true)
      .setText(`MISSILE ${direction}  ${meters} m`);

    this.missileWarningCooldown -= dt;
    if (this.missileWarningCooldown <= 0) {
      this.playMissileWarningSound(nearestDistance);
      this.missileWarningCooldown = Phaser.Math.Linear(
        0.22,
        0.66,
        Phaser.Math.Clamp(nearestDistance / 900, 0, 1)
      );
    }
  }

  createMobileControls() {
    this.mobileUi = [];
    this.mobileJoystick = null;
    if (!this.isMobileLayout) return;

    const { width, height } = this.scale;
    const buttonStyle = {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '12px', color: '#eaffff', align: 'center',
      stroke: '#001018', strokeThickness: 3
    };

    const joyX = 76;
    const joyY = height - 78;
    const base = this.add.circle(joyX, joyY, 52, 0x062336, 0.24)
      .setStrokeStyle(2, 0x54ddff, 0.34).setDepth(115);
    const knob = this.add.circle(joyX, joyY, 23, 0x36d8ff, 0.28)
      .setStrokeStyle(2, 0xbff7ff, 0.55).setDepth(116);
    this.mobileJoystick = { x: joyX, y: joyY, radius: 52, base, knob };
    this.mobileUi.push(base, knob);

    const makeButton = (x, y, radius, label, color, onDown, onUp = null) => {
      const bg = this.add.circle(x, y, radius, color, 0.28)
        .setStrokeStyle(2, color, 0.72).setDepth(117).setInteractive();
      const txt = this.add.text(x, y, label, buttonStyle).setOrigin(0.5).setDepth(118);
      bg.on('pointerdown', (pointer) => { pointer.event?.preventDefault?.(); onDown?.(); bg.setAlpha(0.58); });
      bg.on('pointerup', () => { onUp?.(); bg.setAlpha(0.28); });
      bg.on('pointerout', () => { onUp?.(); bg.setAlpha(0.28); });
      this.mobileUi.push(bg, txt);
      return { bg, txt };
    };

    this.mobileButtons = {};
    this.mobileButtons.gun = makeButton(width - 66, height - 72, 38, 'GUN', 0xff365d,
      () => { this.mobileFireHeld = true; },
      () => { this.mobileFireHeld = false; });
    this.mobileButtons.missile = makeButton(width - 142, height - 104, 29, 'MSL', 0xffc928,
      () => this.fireHomingMissile());
    this.mobileButtons.alt = makeButton(width - 143, height - 42, 27, 'ALT', 0x4bdcff,
      () => this.setLowAltitude(!this.state.lowAltitude));
    this.mobileButtons.faster = makeButton(width - 54, height - 142, 22, '+', 0x65ff9c,
      () => this.adjustTargetAirspeed(1));
    this.mobileButtons.slower = makeButton(width - 104, height - 142, 22, '−', 0x65ff9c,
      () => this.adjustTargetAirspeed(-1));
    this.mobileButtons.flare = makeButton(width - 203, height - 67, 25, 'FLR', 0xffa83d,
      () => this.deployFlares());

    this.portraitHint = this.add.text(width / 2, height / 2,
      '↻  GIRA EL MÓVIL\nMEJOR EN HORIZONTAL', {
        fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '24px',
        color: '#ffffff', align: 'center', stroke: '#001018', strokeThickness: 5,
        backgroundColor: 'rgba(3,16,26,.62)', padding: { x: 18, y: 12 }
      }).setOrigin(0.5).setDepth(180).setVisible(height > width * 1.08);
    this.mobileUi.push(this.portraitHint);
  }

  updateMobileJoystick(pointer) {
    const j = this.mobileJoystick;
    if (!j) return;
    const dx = pointer.x - j.x;
    const dy = pointer.y - j.y;
    const len = Math.hypot(dx, dy) || 1;
    const max = j.radius - 10;
    const mag = Math.min(len, max);
    const nx = dx / len;
    const ny = dy / len;
    j.knob.setPosition(j.x + nx * mag, j.y + ny * mag);
    const strength = Phaser.Math.Clamp(len / max, 0, 1);
    this.mobileMoveVector.set(nx * strength, ny * strength);
  }

  adjustTargetAirspeed(direction) {
    this.state.targetAirspeed = Phaser.Math.Clamp(
      this.state.targetAirspeed + direction * GAME.playerThrottleStep,
      GAME.playerMinAirspeed,
      GAME.playerMaxAirspeed
    );
    this.updateHud();
  }

  layoutMobileControls() {
    if (!this.isMobileLayout || !this.mobileJoystick || !this.mobileButtons) return;
    const { width, height } = this.scale;
    const joyX = Math.max(64, Math.min(84, width * 0.12));
    const joyY = height - Math.max(70, Math.min(88, height * 0.15));
    this.mobileJoystick.x = joyX;
    this.mobileJoystick.y = joyY;
    this.mobileJoystick.base.setPosition(joyX, joyY);
    this.mobileJoystick.knob.setPosition(joyX, joyY);

    const place = (button, x, y) => {
      button.bg.setPosition(x, y);
      button.txt.setPosition(x, y);
    };
    place(this.mobileButtons.gun, width - 66, height - 72);
    place(this.mobileButtons.missile, width - 142, height - 104);
    place(this.mobileButtons.alt, width - 143, height - 42);
    place(this.mobileButtons.faster, width - 54, height - 142);
    place(this.mobileButtons.slower, width - 104, height - 142);
    place(this.mobileButtons.flare, width - 203, height - 67);
    this.portraitHint?.setPosition(width / 2, height / 2).setVisible(height > width * 1.08);
  }

  createCollisions() {
    // No confiamos en el orden de los argumentos que devuelve Arcade Physics
    // cuando mezcla grupos y sprites: cada callback identifica los objetos por tipo.
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletEnemy, null, this);
    this.physics.add.overlap(this.homingMissiles, this.enemies, this.onMissileEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.enemyShots, this.onBulletEnemyShot, null, this);
    this.physics.add.overlap(this.player, this.enemyShots, this.onEnemyShotPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyPlayer, null, this);
  }

  showIntro() {
    const { width, height } = this.scale;
    const titleSize = Phaser.Math.Clamp(
      Math.round(Math.min(width * 0.11, height * 0.22)),
      30,
      170
    );
    const subtitleSize = Phaser.Math.Clamp(Math.round(titleSize * 0.42), 16, 42);

    this.introTitle = this.add.text(width / 2, height / 2 - 35, 'F-22 RAPTOR', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${titleSize}px`,
      color: '#32d9ff',
      stroke: '#ffffff',
      strokeThickness: 5,
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5).setDepth(110);

    this.introSubtitle = this.add.text(width / 2, height / 2 + 95, 'MISIÓN 001', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${subtitleSize}px`,
      color: '#ff3154',
      stroke: '#ffcf32',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(110);

    this.time.delayedCall(GAME.introDelayMs, () => this.startTakeoff());
  }

  startTakeoff() {
    const targetY = Phaser.Math.Clamp(
      this.scale.height * 0.68,
      75,
      Math.max(75, this.scale.height - 58)
    );

    this.tweens.add({
      targets: this.player,
      y: targetY,
      scaleX: this.player.normalScaleX,
      scaleY: this.player.normalScaleY,
      duration: GAME.takeoffDurationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.state.missionStarted = true;
        this.state.controlsEnabled = true;
        this.state.spawningPaused = false;
        this.ensurePlayerOperational();
        this.updateHud();
      }
    });

    this.tweens.add({
      targets: [this.introTitle, this.introSubtitle],
      alpha: 0,
      delay: Math.max(0, GAME.takeoffDurationMs - 1400),
      duration: 1200,
      onComplete: () => {
        this.introTitle?.destroy();
        this.introSubtitle?.destroy();
      }
    });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.updateWeather(dt);
    this.updateClouds(dt);
    this.updateAudio(dt);
    this.updateEnemyDamageFx(dt);

    if (Phaser.Input.Keyboard.JustDown(this.keys.hud)) this.toggleHudMinimal();
    if (Phaser.Input.Keyboard.JustDown(this.keys.mute)) this.toggleAudioMute();
    if (Phaser.Input.Keyboard.JustDown(this.keys.radar)) this.toggleRadar();

    if (this.state.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.restartGame();
      return;
    }

    // Invariante de seguridad: durante una misión activa el jugador nunca puede
    // quedar desactivado/invisible por una colisión o por el reciclado de un pool.
    if (this.state.missionStarted) this.ensurePlayerOperational();

    if (!this.state.controlsEnabled) return;

    this.updatePlayerAirspeed(dt);
    this.updatePlayerMovement(dt);
    this.updatePlayerFlightVisuals(dt);
    this.updateSpeedFx(dt);
    this.updateWeaponLock(dt);
    this.updateWeaponsInput(time);
    this.updateAltitudeInput();
    this.updateHomingMissiles(dt);
    this.updateMissileTrails(dt);
    this.updateFlares(dt);
    this.updateEnemies(dt);
    this.updateEnemyMissileSystems(dt);
    this.updateEnemyMissiles(dt);
    this.updateMissileWarning(dt);
    this.updateRadar(dt);
    this.cleanupProjectiles();
  }

  updateClouds(dt) {
    const { width, height } = this.scale;
    const airspeedFactor = this.state?.playerAirspeed
      ? this.state.playerAirspeed / GAME.playerInitialAirspeed
      : 1;
    const pvx = this.player?.body?.velocity?.x || 0;
    const pvy = this.player?.body?.velocity?.y || 0;
    const windX = this.getWeatherBlendValue('windX');

    for (const cloud of this.clouds) {
      cloud.y += (
        cloud.scrollSpeed * airspeedFactor -
        pvy * cloud.parallaxFactor
      ) * dt;

      cloud.x += (
        windX +
        cloud.windBias -
        pvx * cloud.parallaxFactor
      ) * dt;

      if (cloud.y - cloud.displayHeight / 2 > height + 40) {
        cloud.y = -cloud.displayHeight / 2 - Phaser.Math.Between(20, 120);
        cloud.x = Phaser.Math.Between(-80, Math.max(1, width + 80));
        cloud.normalTexture = `procCloud${Phaser.Math.Between(1, 4)}`;
        cloud.stormTexture = `procStorm${Phaser.Math.Between(1, 2)}`;
        cloud.setTexture(cloud.usingStormTexture ? cloud.stormTexture : cloud.normalTexture);
      }

      if (cloud.x < -cloud.displayWidth) cloud.x = width + cloud.displayWidth * 0.45;
      if (cloud.x > width + cloud.displayWidth) cloud.x = -cloud.displayWidth * 0.45;
    }
  }

  updateSpeedFx(dt) {
    if (!this.speedStreaks?.length) return;

    const { width, height } = this.scale;
    const speedIntensity = Phaser.Math.Clamp(
      (this.state.playerAirspeed - GAME.speedFxStartMps) /
      Math.max(1, GAME.speedFxFullMps - GAME.speedFxStartMps),
      0,
      1
    );

    this.speedFxBoost = Math.max(0, this.speedFxBoost - dt * 1.75);
    const intensity = Phaser.Math.Clamp(speedIntensity * 0.72 + this.speedFxBoost, 0, 1);
    const pvx = this.player?.body?.velocity?.x || 0;
    const pvy = this.player?.body?.velocity?.y || 0;

    for (const streak of this.speedStreaks) {
      if (intensity < 0.055) {
        streak.setAlpha(0);
        continue;
      }

      const depth = streak.fxDepth;
      const moveSpeed = Phaser.Math.Linear(320, 1120, intensity) * depth;
      streak.y += (moveSpeed - pvy * 0.22 * depth) * dt;
      streak.x += (streak.fxDrift - pvx * 0.10 * depth) * dt;

      const h = Phaser.Math.Linear(9, 62, intensity) * depth;
      streak.setDisplaySize(
        Phaser.Math.Linear(1, 2.2, depth),
        Math.max(5, h)
      );
      streak.setAlpha(streak.fxBaseAlpha * intensity);

      if (
        streak.y > height + h ||
        streak.x < -30 ||
        streak.x > width + 30
      ) {
        this.resetSpeedStreak(streak, true);
      }
    }
  }

  updatePlayerAirspeed(dt) {
    let targetChanged = false;

    if (Phaser.Input.Keyboard.JustDown(this.keys.slower)) {
      this.state.targetAirspeed = Phaser.Math.Clamp(
        this.state.targetAirspeed - GAME.playerThrottleStep,
        GAME.playerMinAirspeed,
        GAME.playerMaxAirspeed
      );
      targetChanged = true;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.faster)) {
      this.state.targetAirspeed = Phaser.Math.Clamp(
        this.state.targetAirspeed + GAME.playerThrottleStep,
        GAME.playerMinAirspeed,
        GAME.playerMaxAirspeed
      );
      targetChanged = true;
    }

    const before = this.state.playerAirspeed;
    const maxChange = GAME.playerAcceleration * dt;
    if (before < this.state.targetAirspeed) {
      this.state.playerAirspeed = Math.min(this.state.targetAirspeed, before + maxChange);
    } else if (before > this.state.targetAirspeed) {
      this.state.playerAirspeed = Math.max(this.state.targetAirspeed, before - maxChange);
    }

    mapBackground.setAirspeed(this.state.playerAirspeed);

    if (targetChanged || Math.floor(before * 3.6) !== Math.floor(this.state.playerAirspeed * 3.6)) {
      this.updateHud();
    }
  }

  getPlayerWorldVelocity(includeManeuver = false) {
    const speed = this.state.playerAirspeed;
    let vx = Math.cos(GAME.playerWorldHeading) * speed;
    let vy = Math.sin(GAME.playerWorldHeading) * speed;

    // El movimiento libre dentro de la pantalla representa una maniobra evasiva,
    // pero se escala para no convertir 360 px/s en 360 m/s laterales reales.
    if (includeManeuver && this.player?.body) {
      vx += this.player.body.velocity.x * GAME.playerManeuverVelocityScale;
      vy += this.player.body.velocity.y * GAME.playerManeuverVelocityScale;
    }

    return { x: vx, y: vy };
  }

  approach(current, target, maxDelta) {
    if (current < target) return Math.min(target, current + maxDelta);
    if (current > target) return Math.max(target, current - maxDelta);
    return target;
  }

  updatePlayerMovement(dt) {
    let inputX = 0;
    let inputY = 0;
    let desiredX = 0;
    let desiredY = 0;
    let hasCommand = false;

    if (this.cursors.left.isDown) inputX -= 1;
    if (this.cursors.right.isDown) inputX += 1;
    if (this.cursors.up.isDown) inputY -= 1;
    if (this.cursors.down.isDown) inputY += 1;

    if (inputX || inputY) {
      this.pointerTarget = null;
      const vector = new Phaser.Math.Vector2(inputX, inputY).normalize().scale(GAME.playerSpeed);
      desiredX = vector.x;
      desiredY = vector.y;
      hasCommand = true;
    } else if (
      this.isMobileLayout &&
      this.mobileMoveVector &&
      this.mobileMoveVector.lengthSq() > 0.0025
    ) {
      desiredX = this.mobileMoveVector.x * GAME.playerSpeed;
      desiredY = this.mobileMoveVector.y * GAME.playerSpeed;
      hasCommand = true;
    } else if (this.pointerTarget) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.pointerTarget.x, this.pointerTarget.y
      );

      if (distance > 10) {
        const angle = Phaser.Math.Angle.Between(
          this.player.x, this.player.y,
          this.pointerTarget.x, this.pointerTarget.y
        );
        const commandSpeed = Math.min(GAME.playerSpeed, distance * 3);
        desiredX = Math.cos(angle) * commandSpeed;
        desiredY = Math.sin(angle) * commandSpeed;
        hasCommand = true;
      } else {
        this.pointerTarget = null;
      }
    }

    const currentX = this.player.body?.velocity.x || 0;
    const currentY = this.player.body?.velocity.y || 0;
    const accel = hasCommand ? GAME.playerScreenAcceleration : GAME.playerScreenDeceleration;
    const maxDelta = accel * dt;

    const nextX = this.approach(currentX, desiredX, maxDelta);
    const nextY = this.approach(currentY, desiredY, maxDelta);
    this.player.setVelocity(nextX, nextY);

    this.player.commandVelocity.set(desiredX, desiredY);
  }

  updatePlayerFlightVisuals(dt) {
    if (!this.player?.active || !this.state.missionStarted) return;

    const vx = this.player.body?.velocity.x || 0;
    const bankCommand = Phaser.Math.Clamp(vx / GAME.playerSpeed, -1, 1);
    const targetBank = bankCommand * GAME.playerBankMax;
    const bankBlend = 1 - Math.exp(-GAME.playerBankResponse * dt);

    this.player.visualBank = Phaser.Math.Linear(
      this.player.visualBank || 0,
      targetBank,
      bankBlend
    );

    const altitudeBlend = 1 - Math.exp(-7.5 * dt);
    this.player.altitudeVisualScale = Phaser.Math.Linear(
      this.player.altitudeVisualScale ?? 1,
      this.player.altitudeVisualScaleTarget ?? 1,
      altitudeBlend
    );

    // Con un sprite cenital el roll real no se ve; combinamos una pequeña
    // orientación del morro con foreshortening horizontal para sugerir el alabeo.
    const bankNorm = Phaser.Math.Clamp(
      this.player.visualBank / Math.max(0.001, GAME.playerBankMax),
      -1,
      1
    );
    const rollCompression = 1 - Math.abs(bankNorm) * GAME.playerBankForeshorten;
    const stretch = 1 + Math.abs(bankNorm) * 0.025;
    const altitudeScale = this.player.altitudeVisualScale;

    const stormJitter = (this.visualStormTurbulence || 0) *
      Math.sin(this.time.now * 0.014) *
      Math.sin(this.time.now * 0.0067);

    this.player.rotation = this.player.visualBank * 0.72 + stormJitter;
    this.player.setScale(
      this.player.normalScaleX * altitudeScale * rollCompression,
      this.player.normalScaleY * altitudeScale * stretch
    );
  }


  updateWeaponsInput(time = 0) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) this.fireBullet();
    if (Phaser.Input.Keyboard.JustDown(this.keys.missile)) this.fireHomingMissile();
    if (Phaser.Input.Keyboard.JustDown(this.keys.flare)) this.deployFlares();

    if (this.mobileFireHeld && time >= this.mobileNextGunAt) {
      this.fireBullet();
      this.mobileNextGunAt = time + 135;
    }
  }

  updateAltitudeInput() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.low)) this.setLowAltitude(true);
    if (Phaser.Input.Keyboard.JustDown(this.keys.high)) this.setLowAltitude(false);
  }

  setLowAltitude(low) {
    if (this.state.lowAltitude === low) return;
    this.state.lowAltitude = low;

    this.player.altitudeVisualScaleTarget = low ? 0.62 : 1;
    this.player.setAlpha(low ? 0.88 : 1);
    this.updateHud();
  }


  fireBullet() {
    if (this.state.lowAltitude) return;

    const bullet = this.bullets.get(this.player.x, this.player.y - 35);
    if (!bullet) return;

    bullet.enableBody(true, this.player.x, this.player.y - 35, true, true);
    bullet.entityType = 'playerBullet';
    bullet.setDisplaySize(4, GAME.bulletDisplayHeight);
    bullet.setDepth(15).setAngle(0);
    bullet.body.setSize(
      Math.max(2, bullet.width * 0.55),
      bullet.height * 0.82,
      true
    );
    bullet.setVelocity(0, -GAME.bulletSpeed);
    this.playGunSound();
    this.state.score -= GAME.costBullet;
    this.updateHud();
  }

  fireHomingMissile() {
    if (this.state.lowAltitude) return;

    const target = this.weaponLock?.target;
    if (!target?.active || this.weaponLock.status !== 'LOCK') {
      this.showWeaponCue('NO LOCK', '#ffb52f');
      this.playNoLockSound();
      return;
    }

    const missile = this.homingMissiles.get(this.player.x, this.player.y - 20);
    if (!missile) return;

    missile.enableBody(true, this.player.x, this.player.y - 20, true, true);
    missile.entityType = 'playerMissile';
    missile.setDisplaySize(
      GAME.missileDisplayHeight * (3 / 11.3),
      GAME.missileDisplayHeight
    );
    missile.setDepth(16);
    missile.body.setSize(
      missile.width * 0.75,
      missile.height * 0.72,
      true
    );

    missile.target = target;
    missile.age = 0;
    missile.speed = GAME.missileInitialSpeed;
    missile.heading = -Math.PI / 2; // sale en el eje del F-22, no "salta" al blanco
    missile.previousLosAngle = Phaser.Math.Angle.BetweenPoints(missile, target);
    missile.lostTargetTime = 0;
    missile.trailTimer = 0;
    missile.rotation = missile.heading + Math.PI / 2;

    this.physics.velocityFromRotation(
      missile.heading,
      missile.speed,
      missile.body.velocity
    );

    this.state.score -= GAME.costMissile;
    this.playMissileLaunchSound();
    this.showWeaponCue('FOX', '#69ff9e');

    // Tras el lanzamiento hay que volver a adquirir, aunque el mismo blanco siga delante.
    this.weaponLock.progress = 0.28;
    this.weaponLock.target = null;
    this.weaponLock.status = 'TRACK';
    this.updateHud();
  }

  updateHomingMissiles(dt) {
    for (const missile of this.homingMissiles.getChildren()) {
      if (!missile.active) continue;

      missile.age = (missile.age || 0) + dt;
      if (missile.age >= GAME.missileLifetime) {
        this.recycleMissile(missile);
        continue;
      }

      // Motor: boost, sostenimiento y después vuelo en energía/coast.
      let acceleration = 0;
      if (missile.age < GAME.missileBoostTime) {
        acceleration = GAME.missileBoostAcceleration;
      } else if (missile.age < GAME.missileBurnTime) {
        acceleration = GAME.missileSustainAcceleration;
      } else {
        acceleration = -GAME.missileCoastDrag;
      }

      missile.speed = Phaser.Math.Clamp(
        missile.speed + acceleration * dt,
        GAME.missileMinUsefulSpeed,
        GAME.missileMaxSpeed
      );

      const target = missile.target;
      const canGuide = missile.age >= GAME.missileStraightTime && target?.active;

      if (canGuide) {
        const losAngle = Phaser.Math.Angle.BetweenPoints(missile, target);
        const headingError = Phaser.Math.Angle.Wrap(losAngle - missile.heading);

        // Seeker: si el blanco queda demasiado atrás, el misil pierde seguimiento.
        if (Math.abs(headingError) > GAME.missileSeekerCone) {
          missile.lostTargetTime += dt;
        } else {
          missile.lostTargetTime = Math.max(0, missile.lostTargetTime - dt * 1.7);
        }

        if (missile.lostTargetTime >= GAME.missileTrackLossDelay) {
          missile.target = null;
        } else {
          const previousLos = Number.isFinite(missile.previousLosAngle)
            ? missile.previousLosAngle
            : losAngle;
          const losRate = Phaser.Math.Angle.Wrap(losAngle - previousLos) / Math.max(dt, 0.001);
          missile.previousLosAngle = losAngle;

          // Navegación proporcional simplificada + pequeña corrección al eje.
          const commandedRate =
            GAME.missileNavConstant * losRate +
            headingError * GAME.missileHeadingCorrection;

          // Límite físico: omega_max = a_lateral / V.
          const gLimitedRate =
            (GAME.missileMaxG * GAME.gravity) /
            Math.max(missile.speed, 1);

          const maxTurnRate = Math.min(
            GAME.missileAbsoluteMaxTurnRate,
            gLimitedRate
          );

          const actualRate = Phaser.Math.Clamp(
            commandedRate,
            -maxTurnRate,
            maxTurnRate
          );

          missile.heading = Phaser.Math.Angle.Wrap(
            missile.heading + actualRate * dt
          );
        }
      }

      // Si el blanco desaparece, NO reacquire mágicamente: continúa balístico.
      if (!missile.target?.active) missile.target = null;

      missile.rotation = missile.heading + Math.PI / 2;
      this.physics.velocityFromRotation(
        missile.heading,
        missile.speed,
        missile.body.velocity
      );

      missile.trailTimer -= dt;
      if (missile.trailTimer <= 0) {
        this.spawnMissileTrail(missile);
        missile.trailTimer = GAME.missileTrailInterval;
      }
    }
  }


  findNearestEnemy(x, y) {
    let nearest = null;
    let nearestSq = Number.POSITIVE_INFINITY;

    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active || enemy.isDying || !this.isEnemyVisible(enemy, 140)) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestSq) {
        nearestSq = distSq;
        nearest = enemy;
      }
    }
    return nearest;
  }

  scheduleEnemySpawn() {
    this.time.delayedCall(Phaser.Math.Between(1100, 2600), () => {
      if (!this.state.gameOver) {
        if (
          !this.state.spawningPaused &&
          this.activeEnemyCount() < GAME.maxEnemies &&
          this.nearbyEnemyCount() < GAME.maxNearbyEnemies
        ) {
          this.spawnEnemy();
        }
        this.scheduleEnemySpawn();
      }
    });
  }

  scheduleEnemyFire() {
    this.time.delayedCall(Phaser.Math.Between(800, 1500), () => {
      if (!this.state.gameOver && this.state.controlsEnabled) this.enemyFire();
      if (!this.state.gameOver) this.scheduleEnemyFire();
    });
  }

  activeEnemyCount() {
    let count = 0;
    for (const enemy of this.enemies.getChildren()) if (enemy.active) count++;
    return count;
  }

  nearbyEnemyCount() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const maxDistance = Math.hypot(width, height) * 1.45;
    let count = 0;

    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active || enemy.isDying) continue;
      if (Math.hypot(enemy.x - cx, enemy.y - cy) <= maxDistance) count++;
    }
    return count;
  }

  spawnEnemy() {
    const { width, height } = this.scale;
    const playerSpeed = this.state.playerAirspeed;

    // La repetición pondera los encuentros sin convertirlos en una secuencia predecible.
    const encounter = Phaser.Math.RND.pick([
      'headOn', 'headOn', 'headOn',
      'crossRight', 'crossLeft',
      'rearChase', 'rearChase',
      'overtaken',
      'obliqueRight', 'obliqueLeft'
    ]);

    let speed;
    let heading;

    switch (encounter) {
      case 'headOn':
        speed = Phaser.Math.FloatBetween(245, GAME.enemyMaxSpeed);
        heading = Math.PI / 2 + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-7, 7));
        break;

      case 'crossRight':
        speed = Phaser.Math.FloatBetween(240, 325);
        heading = Math.PI + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-10, 8));
        break;

      case 'crossLeft':
        speed = Phaser.Math.FloatBetween(240, 325);
        heading = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-8, 10));
        break;

      case 'rearChase':
        // Si viene por detrás necesita una pequeña ventaja para alcanzarnos.
        speed = Phaser.Math.Clamp(
          playerSpeed + Phaser.Math.FloatBetween(55, 105),
          GAME.enemyMinSpeed,
          GAME.enemyMaxAfterburnerSpeed
        );
        heading = -Math.PI / 2 + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-5, 5));
        break;

      case 'overtaken':
        // Avión al que nosotros vamos alcanzando: misma dirección, algo más lento.
        speed = Phaser.Math.Clamp(
          playerSpeed - Phaser.Math.FloatBetween(30, 70),
          GAME.enemyMinSpeed,
          GAME.enemyMaxSpeed
        );
        heading = -Math.PI / 2 + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-4, 4));
        break;

      case 'obliqueRight':
        speed = Phaser.Math.FloatBetween(245, 335);
        heading = Phaser.Math.DegToRad(135 + Phaser.Math.FloatBetween(-8, 8));
        break;

      case 'obliqueLeft':
      default:
        speed = Phaser.Math.FloatBetween(245, 335);
        heading = Phaser.Math.DegToRad(45 + Phaser.Math.FloatBetween(-8, 8));
        break;
    }

    // Elegimos un punto de cruce dentro de la zona de combate y retrocedemos
    // por la velocidad RELATIVA hasta colocar el avión realmente fuera de pantalla.
    const crossPoint = {
      x: Phaser.Math.FloatBetween(width * 0.24, width * 0.76),
      y: Phaser.Math.FloatBetween(height * 0.22, height * 0.70)
    };

    const playerVelocity = this.getPlayerWorldVelocity(false);
    const enemyWorldVx = Math.cos(heading) * speed;
    const enemyWorldVy = Math.sin(heading) * speed;
    const relativeVx = enemyWorldVx - playerVelocity.x;
    const relativeVy = enemyWorldVy - playerVelocity.y;
    const relativeSpeed = Math.max(1, Math.hypot(relativeVx, relativeVy));
    const ux = relativeVx / relativeSpeed;
    const uy = relativeVy / relativeSpeed;

    let distance = 0;
    let x = crossPoint.x;
    let y = crossPoint.y;
    const margin = GAME.enemySpawnMargin;
    const outside = () => (
      x < -margin || x > width + margin || y < -margin || y > height + margin
    );

    // Para un perseguidor por detrás la velocidad relativa puede ser pequeña;
    // por eso calculamos la distancia geométricamente, no con un tiempo fijo.
    while (!outside() && distance < 5000) {
      distance += 80;
      x = crossPoint.x - ux * distance;
      y = crossPoint.y - uy * distance;
    }

    distance += Phaser.Math.FloatBetween(90, 240);
    x = crossPoint.x - ux * distance;
    y = crossPoint.y - uy * distance;

    const enemy = this.enemies.get(x, y, 'enemy');
    if (!enemy) return;

    enemy.enableBody(true, x, y, true, true);
    enemy.entityType = 'enemy';
    enemy.setDepth(12);
    enemy.setDisplaySize(
      GAME.enemyDisplayHeight * (33.5 / 44),
      GAME.enemyDisplayHeight
    );
    enemy.baseTintColor = Phaser.Math.RND.pick([0x617073, 0x858484, 0xa5bfc5, 0x383d4b]);
    enemy.setTint(enemy.baseTintColor);
    enemy.body.setSize(
      enemy.width * 0.62,
      enemy.height * 0.72,
      true
    );
    enemy.setCollideWorldBounds(false);

    const pilot = Phaser.Math.RND.pick([
      PILOT_PROFILES.ROOKIE, PILOT_PROFILES.ROOKIE, PILOT_PROFILES.ROOKIE,
      PILOT_PROFILES.FIGHTER, PILOT_PROFILES.FIGHTER, PILOT_PROFILES.FIGHTER, PILOT_PROFILES.FIGHTER,
      PILOT_PROFILES.VETERAN, PILOT_PROFILES.VETERAN,
      PILOT_PROFILES.ACE
    ]);

    speed = Phaser.Math.Clamp(
      speed * pilot.speedFactor,
      GAME.enemyMinSpeed,
      GAME.enemyMaxAfterburnerSpeed
    );

    enemy.pilot = pilot;
    enemy.speedMps = speed;
    enemy.cruiseSpeedMps = speed;
    enemy.targetSpeedMps = speed;
    enemy.heading = heading;
    enemy.holdHeading = heading;
    enemy.entryHeading = heading;
    enemy.encounter = encounter;
    enemy.phase = 'inbound';
    enemy.phaseTimer = 0;
    enemy.hasBeenVisible = false;
    enemy.wasVisible = false;
    enemy.passCount = 0;
    enemy.offscreenSeconds = 0;
    enemy.visualBank = 0;
    enemy.lastClosePassIndex = -1;
    enemy.baseScaleX = enemy.scaleX;
    enemy.baseScaleY = enemy.scaleY;

    enemy.maxIntegrity = GAME.enemyIntegrity;
    enemy.integrity = enemy.maxIntegrity;
    enemy.damageState = 'OK';
    enemy.isDying = false;
    enemy.killAwarded = false;
    enemy.damageSmokeTimer = Phaser.Math.FloatBetween(0.08, 0.25);
    enemy.criticalFailureTimer = 0;
    enemy.lastDamageKind = null;

    enemy.tactic = 'lead';
    enemy.tacticTimer = Phaser.Math.FloatBetween(pilot.reactionMin, pilot.reactionMax);
    enemy.tacticSide = Phaser.Math.RND.pick([-1, 1]);
    enemy.breakHeading = enemy.heading;
    enemy.fireCooldownUntil = 0;

    enemy.enemyMissileAmmo =
      pilot.id === 'ACE' ? 2 :
      pilot.id === 'VETERAN' ? 2 :
      pilot.id === 'FIGHTER' && Phaser.Math.FloatBetween(0, 1) < 0.62 ? 1 :
      0;
    enemy.enemyMissileLock = 0;
    enemy.enemyMissileCooldownUntil =
      this.time.now + Phaser.Math.Between(4200, 9000);

    enemy.attackG =
      Phaser.Math.FloatBetween(GAME.enemyAttackG - 0.4, GAME.enemyAttackG + 0.6) *
      pilot.gFactor;
    enemy.rejoinG =
      Phaser.Math.FloatBetween(GAME.enemyRejoinG - 0.3, GAME.enemyRejoinG + 0.7) *
      pilot.gFactor;
    enemy.rotation = heading + Math.PI / 2;

    this.setEnemyRelativeVelocity(enemy);
  }

  isEnemyVisible(enemy, margin = GAME.enemyVisibilityMargin) {
    const { width, height } = this.scale;
    return (
      enemy.x >= -margin && enemy.x <= width + margin &&
      enemy.y >= -margin && enemy.y <= height + margin
    );
  }

  getEnemyTurnRate(enemy, gLimit) {
    // Giro sostenido simplificado por carga normal:
    // omega = g * sqrt(n² - 1) / V.
    // Esto hace que a mayor velocidad el radio de viraje crezca de forma natural.
    const n = Math.max(1.01, gLimit);
    const speed = Math.max(120, enemy.speedMps);
    const rate = GAME.gravity * Math.sqrt(n * n - 1) / speed;
    return Phaser.Math.Clamp(rate, GAME.enemyMinTurnRate, GAME.enemyMaxTurnRate);
  }

  calculateInterceptHeading(enemy) {
    const rx = this.player.x - enemy.x;
    const ry = this.player.y - enemy.y;
    const targetVelocity = this.getPlayerWorldVelocity(true);
    const targetSpeedSq = targetVelocity.x * targetVelocity.x + targetVelocity.y * targetVelocity.y;
    const projectileSpeedSq = enemy.speedMps * enemy.speedMps;

    const a = targetSpeedSq - projectileSpeedSq;
    const b = 2 * (rx * targetVelocity.x + ry * targetVelocity.y);
    const c = rx * rx + ry * ry;

    let interceptTime = null;

    if (Math.abs(a) < 1e-6) {
      if (Math.abs(b) > 1e-6) {
        const t = -c / b;
        if (t > 0) interceptTime = t;
      }
    } else {
      const discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) {
        const root = Math.sqrt(discriminant);
        const t1 = (-b - root) / (2 * a);
        const t2 = (-b + root) / (2 * a);
        const positives = [t1, t2].filter((t) => Number.isFinite(t) && t > 0.05);
        if (positives.length) interceptTime = Math.min(...positives);
      }
    }

    // Una predicción demasiado lejana suele ser tácticamente inútil: el rival
    // apuntaría a un punto donde probablemente ya habremos maniobrado.
    if (!Number.isFinite(interceptTime) || interceptTime === null) {
      return Math.atan2(ry, rx);
    }

    const t = Math.min(interceptTime, 18);
    const aimX = rx + targetVelocity.x * t;
    const aimY = ry + targetVelocity.y * t;
    return Math.atan2(aimY, aimX);
  }

  setEnemyRelativeVelocity(enemy) {
    const playerVelocity = this.getPlayerWorldVelocity(false);
    const enemyWorldVx = Math.cos(enemy.heading) * enemy.speedMps;
    const enemyWorldVy = Math.sin(enemy.heading) * enemy.speedMps;

    // Ésta es la clave del nuevo modelo: lo que vemos es V_enemigo - V_jugador.
    // Frontal: las velocidades se suman. Misma dirección: se restan.
    const relativeVx = enemyWorldVx - playerVelocity.x;
    const relativeVy = enemyWorldVy - playerVelocity.y;
    enemy.relativeSpeed = Math.hypot(relativeVx, relativeVy);
    enemy.setVelocity(relativeVx, relativeVy);
  }

  chooseDogfightTactic(enemy, distanceToPlayer) {
    const p = enemy.pilot || PILOT_PROFILES.FIGHTER;
    const behindPlayer =
      enemy.y > this.player.y + 45 &&
      Math.abs(enemy.x - this.player.x) < 280;
    const lowEnergy = enemy.speedMps < Math.max(205, this.state.playerAirspeed * 0.80);

    let tactic;

    if (distanceToPlayer < 135) {
      tactic = 'break';
    } else if (lowEnergy && Phaser.Math.FloatBetween(0, 1) < 0.60 + p.skill * 0.25) {
      tactic = 'extend';
    } else if (behindPlayer && p.skill > 0.58 && Phaser.Math.FloatBetween(0, 1) < p.skill) {
      tactic = 'six';
    } else {
      const roll = Phaser.Math.FloatBetween(0, 1);

      if (p.skill > 0.86 && roll < 0.22) tactic = 'cutback';
      else if (p.skill > 0.70 && roll < 0.44) tactic = 'six';
      else if (roll < 0.68) tactic = 'lead';
      else if (roll < 0.84) tactic = 'lag';
      else tactic = p.aggression > 0.70 ? 'pursuit' : 'extend';
    }

    enemy.tactic = tactic;
    enemy.tacticSide = Phaser.Math.RND.pick([-1, 1]);

    const reaction = Phaser.Math.FloatBetween(p.reactionMin, p.reactionMax);
    enemy.tacticTimer = reaction;

    if (tactic === 'break') {
      enemy.breakHeading = Phaser.Math.Angle.Wrap(
        enemy.heading +
        enemy.tacticSide *
        Phaser.Math.DegToRad(Phaser.Math.FloatBetween(72, 118))
      );
      enemy.tacticTimer = Phaser.Math.FloatBetween(0.75, 1.35);
    }

    if (tactic === 'extend') {
      enemy.holdHeading = enemy.heading;
      enemy.tacticTimer = Phaser.Math.FloatBetween(0.85, 1.75);
    }
  }

  getDogfightHeading(enemy, distanceToPlayer) {
    const p = enemy.pilot || PILOT_PROFILES.FIGHTER;
    const playerWorldV = this.getPlayerWorldVelocity(true);

    if (enemy.tactic === 'pursuit') {
      return Phaser.Math.Angle.BetweenPoints(enemy, this.player);
    }

    if (enemy.tactic === 'six' || enemy.tactic === 'lag') {
      // Punto virtual detrás del F-22. Un piloto hábil intenta llegar primero a
      // esa zona en vez de apuntar todo el tiempo al centro del sprite.
      const trail = enemy.tactic === 'six'
        ? Phaser.Math.Linear(205, 145, p.skill)
        : Phaser.Math.Linear(310, 225, p.skill);

      const aimX =
        this.player.x +
        playerWorldV.x * Phaser.Math.Linear(0.18, 0.42, p.skill);
      const aimY =
        this.player.y + trail +
        playerWorldV.y * Phaser.Math.Linear(0.08, 0.22, p.skill);

      return Math.atan2(aimY - enemy.y, aimX - enemy.x);
    }

    if (enemy.tactic === 'cutback') {
      const sideOffset = enemy.tacticSide * Phaser.Math.Linear(230, 150, p.skill);
      const forwardOffset = -Phaser.Math.Linear(95, 145, p.skill);
      const aimX = this.player.x + sideOffset + playerWorldV.x * 0.25;
      const aimY = this.player.y + forwardOffset + playerWorldV.y * 0.18;
      return Math.atan2(aimY - enemy.y, aimX - enemy.x);
    }

    if (enemy.tactic === 'break') return enemy.breakHeading;
    if (enemy.tactic === 'extend') return enemy.holdHeading;

    // LEAD por defecto.
    return this.calculateInterceptHeading(enemy);
  }

  updateEnemyDamageState(enemy, dt) {
    if (enemy.isDying) return;

    enemy.damageSmokeTimer -= dt;

    if (enemy.damageState === 'DAMAGED' && enemy.damageSmokeTimer <= 0) {
      this.spawnEnemyDamagePuff(enemy, false);
      enemy.damageSmokeTimer = Phaser.Math.FloatBetween(0.14, 0.25);
    } else if (enemy.damageState === 'CRITICAL' && enemy.damageSmokeTimer <= 0) {
      this.spawnEnemyDamagePuff(enemy, true);
      enemy.damageSmokeTimer = Phaser.Math.FloatBetween(0.055, 0.105);

      if (enemy.criticalFailureTimer > 0) {
        enemy.criticalFailureTimer -= dt;
        if (enemy.criticalFailureTimer <= 0) {
          this.beginEnemyDestruction(enemy, enemy.lastDamageKind || 'critical');
        }
      }
    }
  }

  updateFallingEnemy(enemy, dt) {
    enemy.damageSmokeTimer -= dt;
    if (enemy.damageSmokeTimer <= 0) {
      this.spawnEnemyDamagePuff(enemy, true);
      enemy.damageSmokeTimer = Phaser.Math.FloatBetween(0.035, 0.07);
    }

    enemy.fallVy += 84 * dt;
    enemy.x += enemy.fallVx * dt;
    enemy.y += enemy.fallVy * dt;
    enemy.rotation += enemy.spinRate * dt;
    enemy.deathTimer -= dt;

    const margin = 180;
    const outside =
      enemy.x < -margin ||
      enemy.x > this.scale.width + margin ||
      enemy.y < -margin ||
      enemy.y > this.scale.height + margin;

    if (enemy.deathTimer <= 0 || outside) {
      this.finalizeEnemyDestruction(enemy);
    }
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active) continue;

      if (enemy.isDying) {
        this.updateFallingEnemy(enemy, dt);
        continue;
      }

      this.updateEnemyDamageState(enemy, dt);
      if (enemy.isDying || !enemy.active) continue;

      const visible = this.isEnemyVisible(enemy);
      const distanceToPlayer = Phaser.Math.Distance.Between(
        enemy.x, enemy.y, this.player.x, this.player.y
      );

      if (visible) {
        enemy.offscreenSeconds = 0;

        if (!enemy.hasBeenVisible) {
          enemy.hasBeenVisible = true;
          enemy.phase = 'attack';
          enemy.phaseTimer = Phaser.Math.FloatBetween(0.40, 0.85);
          enemy.holdHeading = enemy.heading;
          enemy.targetSpeedMps = enemy.cruiseSpeedMps;
          enemy.tacticTimer = 0;
        } else if (!enemy.wasVisible && enemy.phase === 'rejoin') {
          enemy.phase = 'attack';
          enemy.phaseTimer = Phaser.Math.FloatBetween(0.20, 0.55);
          enemy.holdHeading = enemy.heading;
          enemy.targetSpeedMps = Phaser.Math.Clamp(
            Math.max(enemy.cruiseSpeedMps, this.state.playerAirspeed + 20),
            GAME.enemyMinSpeed,
            GAME.enemyMaxAfterburnerSpeed
          );
          enemy.tacticTimer = 0;
        }
      } else {
        enemy.offscreenSeconds += dt;

        if (!enemy.hasBeenVisible && enemy.phase === 'inbound' && enemy.offscreenSeconds > 11) {
          enemy.phase = 'rejoin';
        }

        if (enemy.wasVisible && enemy.hasBeenVisible) {
          enemy.phase = 'extend';
          enemy.phaseTimer = Phaser.Math.FloatBetween(0.85, 1.90);
          enemy.holdHeading = enemy.heading;
          enemy.passCount++;
        }
      }

      enemy.wasVisible = visible;

      let desiredHeading = enemy.heading;
      let gLimit = GAME.enemyCruiseG;
      const pilot = enemy.pilot || PILOT_PROFILES.FIGHTER;

      if (enemy.damageState === 'CRITICAL') {
        // Un avión crítico ya no busca ganar el combate: intenta salir mientras
        // conserva la trayectoria física y va perdiendo prestaciones.
        enemy.phase = 'escape';
      }

      if (enemy.phase === 'inbound') {
        desiredHeading = enemy.entryHeading;
        gLimit = GAME.enemyCruiseG;

      } else if (enemy.phase === 'attack') {
        if (enemy.phaseTimer > 0) {
          enemy.phaseTimer -= dt;
          desiredHeading = enemy.holdHeading;
        } else {
          enemy.tacticTimer -= dt;

          if (enemy.tacticTimer <= 0) {
            this.chooseDogfightTactic(enemy, distanceToPlayer);
          }

          desiredHeading = this.getDogfightHeading(enemy, distanceToPlayer);

          if (enemy.tactic === 'break') {
            gLimit = enemy.attackG * 1.06;
            enemy.targetSpeedMps = Math.max(
              GAME.enemyMinSpeed,
              Math.min(enemy.cruiseSpeedMps, GAME.enemyTurnSpeed)
            );
          } else if (enemy.tactic === 'extend') {
            gLimit = GAME.enemyCruiseG;
            enemy.targetSpeedMps = Phaser.Math.Clamp(
              Math.max(enemy.cruiseSpeedMps, this.state.playerAirspeed + 85),
              GAME.enemyMinSpeed,
              GAME.enemyMaxAfterburnerSpeed
            );
          } else if (enemy.tactic === 'six') {
            gLimit = enemy.attackG;
            enemy.targetSpeedMps = Phaser.Math.Clamp(
              this.state.playerAirspeed + Phaser.Math.Linear(18, 55, pilot.skill),
              GAME.enemyMinSpeed,
              GAME.enemyMaxAfterburnerSpeed
            );
          } else if (enemy.tactic === 'lag') {
            gLimit = enemy.attackG * 0.86;
            enemy.targetSpeedMps = Math.max(
              GAME.enemyMinSpeed,
              Math.min(enemy.cruiseSpeedMps, this.state.playerAirspeed + 20)
            );
          } else if (enemy.tactic === 'cutback') {
            gLimit = enemy.attackG * 1.03;
            enemy.targetSpeedMps = Math.min(enemy.cruiseSpeedMps, GAME.enemyTurnSpeed + 20);
          } else {
            gLimit = enemy.attackG;
            enemy.targetSpeedMps = Phaser.Math.Clamp(
              Math.max(enemy.cruiseSpeedMps, this.state.playerAirspeed + 30),
              GAME.enemyMinSpeed,
              GAME.enemyMaxAfterburnerSpeed
            );
          }
        }

      } else if (enemy.phase === 'extend') {
        enemy.phaseTimer -= dt;
        desiredHeading = enemy.holdHeading;
        gLimit = GAME.enemyCruiseG;
        enemy.targetSpeedMps = Phaser.Math.Clamp(
          Math.max(enemy.cruiseSpeedMps, this.state.playerAirspeed + 95),
          GAME.enemyMinSpeed,
          GAME.enemyMaxAfterburnerSpeed
        );
        if (enemy.phaseTimer <= 0) enemy.phase = 'rejoin';

      } else if (enemy.phase === 'rejoin') {
        desiredHeading = this.calculateInterceptHeading(enemy);
        gLimit = enemy.rejoinG;

        const headingError = Math.abs(
          Phaser.Math.Angle.Wrap(desiredHeading - enemy.heading)
        );

        if (headingError > Phaser.Math.DegToRad(28)) {
          enemy.targetSpeedMps = Math.min(enemy.cruiseSpeedMps, GAME.enemyTurnSpeed);
        } else {
          enemy.targetSpeedMps = Phaser.Math.Clamp(
            Math.max(enemy.cruiseSpeedMps, this.state.playerAirspeed + 105),
            GAME.enemyMinSpeed,
            GAME.enemyMaxAfterburnerSpeed
          );
        }

      } else if (enemy.phase === 'escape') {
        // Se aleja del centro de combate y gira poco: daño real = menos prestaciones.
        const away = Phaser.Math.Angle.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        );
        desiredHeading = Phaser.Math.Angle.RotateTo(
          enemy.heading,
          away,
          Phaser.Math.DegToRad(35)
        );
        gLimit = Math.max(1.8, enemy.attackG * 0.48);
        enemy.targetSpeedMps = Math.max(
          GAME.enemyMinSpeed,
          Math.min(enemy.cruiseSpeedMps * 0.72, 245)
        );
      }

      // Muy cerca evitamos un pivot imposible sobre el jugador.
      if (distanceToPlayer < 118 && enemy.phase === 'attack') {
        desiredHeading = enemy.heading;
      }

      // Daño = menos aceleración, menos velocidad máxima y menos G disponible.
      const damageFactor =
        enemy.damageState === 'DAMAGED' ? 0.82 :
        enemy.damageState === 'CRITICAL' ? 0.56 :
        1;

      gLimit *= damageFactor;
      enemy.targetSpeedMps = Math.min(
        enemy.targetSpeedMps,
        enemy.damageState === 'DAMAGED'
          ? GAME.enemyMaxSpeed * 0.90
          : enemy.damageState === 'CRITICAL'
            ? 245
            : GAME.enemyMaxAfterburnerSpeed
      );

      // Giro fuerte consume energía. Los pilotos buenos administran mejor la pérdida.
      const headingError = Math.abs(
        Phaser.Math.Angle.Wrap(desiredHeading - enemy.heading)
      );
      if (
        enemy.phase === 'attack' &&
        headingError > Phaser.Math.DegToRad(34) &&
        enemy.tactic !== 'extend'
      ) {
        const energyRetention = Phaser.Math.Linear(0.72, 0.90, pilot.skill);
        enemy.targetSpeedMps = Math.min(
          enemy.targetSpeedMps,
          Math.max(GAME.enemyMinSpeed, enemy.speedMps * energyRetention)
        );
      }

      const acceleration =
        GAME.enemyAcceleration *
        damageFactor *
        Phaser.Math.Linear(0.90, 1.12, pilot.skill);
      const speedDelta = acceleration * dt;

      if (enemy.speedMps < enemy.targetSpeedMps) {
        enemy.speedMps = Math.min(enemy.targetSpeedMps, enemy.speedMps + speedDelta);
      } else if (enemy.speedMps > enemy.targetSpeedMps) {
        enemy.speedMps = Math.max(enemy.targetSpeedMps, enemy.speedMps - speedDelta);
      }

      const turnRate = this.getEnemyTurnRate(enemy, Math.max(1.05, gLimit));
      const previousHeading = enemy.heading;
      enemy.heading = Phaser.Math.Angle.RotateTo(
        enemy.heading,
        desiredHeading,
        turnRate * dt
      );

      const actualTurn = dt > 0
        ? Phaser.Math.Angle.Wrap(enemy.heading - previousHeading) / dt
        : 0;
      const targetBank = Phaser.Math.Clamp(
        actualTurn / Math.max(0.001, turnRate),
        -1,
        1
      );
      const bankBlend = 1 - Math.exp(-5.2 * dt);
      enemy.visualBank = Phaser.Math.Linear(
        enemy.visualBank || 0,
        targetBank,
        bankBlend
      );

      enemy.rotation =
        enemy.heading +
        Math.PI / 2 +
        enemy.visualBank * 0.045;

      const enemyBankCompression =
        1 - Math.abs(enemy.visualBank) * 0.18;

      enemy.setScale(
        enemy.baseScaleX * enemyBankCompression,
        enemy.baseScaleY * (1 + Math.abs(enemy.visualBank) * 0.025)
      );

      this.setEnemyRelativeVelocity(enemy);

      if (
        visible &&
        distanceToPlayer > 58 &&
        distanceToPlayer < GAME.closePassDistance &&
        enemy.relativeSpeed >= GAME.closePassMinRelativeSpeed &&
        enemy.lastClosePassIndex !== enemy.passCount
      ) {
        enemy.lastClosePassIndex = enemy.passCount;
        this.createClosePassFx(enemy);
      }
    }
  }

  createClosePassFx(enemy) {
    if (!enemy?.active || !this.state.missionStarted) return;

    const now = this.time.now;
    if (now - this.lastClosePassFxAt < GAME.closePassFxCooldownMs) return;
    this.lastClosePassFxAt = now;

    const closureKmh = Math.round((enemy.relativeSpeed || 0) * 3.6);
    const side = enemy.x < this.player.x ? -1 : 1;
    this.speedFxBoost = Math.max(this.speedFxBoost, 0.95);
    this.playClosePassSound(side, enemy.relativeSpeed || 0);

    this.cameras.main.shake(
      95,
      Phaser.Math.Clamp((enemy.relativeSpeed || 360) / 90000, 0.0035, 0.0075)
    );

    const sweep = this.add.rectangle(
      this.player.x + side * 48,
      this.player.y,
      5,
      Math.max(80, this.scale.height * 0.24),
      0xe7fbff,
      0.34
    ).setDepth(28).setAngle(side > 0 ? 9 : -9);

    this.tweens.add({
      targets: sweep,
      x: sweep.x + side * 160,
      alpha: 0,
      scaleY: 1.6,
      duration: 180,
      ease: 'Cubic.easeOut',
      onComplete: () => sweep.destroy()
    });

    const compact = this.hudPresentationMode === 'compact' || this.hudPresentationMode === 'micro';
    const text = this.add.text(
      this.scale.width / 2,
      compact ? 42 : 86,
      `CLOSE PASS  //  ${closureKmh.toLocaleString('es-ES')} KM/H`,
      {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: compact ? '13px' : '20px',
        color: '#e8fbff',
        stroke: '#001018',
        strokeThickness: compact ? 3 : 4,
        letterSpacing: 1
      }
    ).setOrigin(0.5, 0).setDepth(132).setScrollFactor(0);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 8,
      delay: 280,
      duration: 520,
      onComplete: () => text.destroy()
    });
  }


  updateEnemyMissileSystems(dt) {
    if (this.state.lowAltitude) {
      for (const enemy of this.enemies.getChildren()) {
        if (enemy.active) enemy.enemyMissileLock = Math.max(0, (enemy.enemyMissileLock || 0) - dt * 1.8);
      }
      return;
    }

    const now = this.time.now;

    for (const enemy of this.enemies.getChildren()) {
      if (
        !enemy.active ||
        enemy.isDying ||
        enemy.damageState === 'CRITICAL' ||
        (enemy.enemyMissileAmmo || 0) <= 0
      ) continue;

      if (now < (enemy.enemyMissileCooldownUntil || 0)) continue;

      const pilot = enemy.pilot || PILOT_PROFILES.FIGHTER;
      if (pilot.skill < 0.52) continue;

      const distance = Phaser.Math.Distance.Between(
        enemy.x, enemy.y,
        this.player.x, this.player.y
      );

      const lineOfSight = Phaser.Math.Angle.BetweenPoints(enemy, this.player);
      const noseError = Math.abs(
        Phaser.Math.Angle.Wrap(lineOfSight - enemy.heading)
      );

      const lockCone = GAME.enemyMissileLockCone * Phaser.Math.Linear(0.86, 1.08, pilot.skill);
      const inEnvelope =
        distance <= GAME.enemyMissileRange &&
        distance >= 150 &&
        noseError <= lockCone;

      if (inEnvelope) {
        const lockSeconds =
          GAME.enemyMissileBaseLockSeconds *
          Phaser.Math.Linear(1.34, 0.72, pilot.skill);

        enemy.enemyMissileLock = Math.min(
          1,
          (enemy.enemyMissileLock || 0) + dt / lockSeconds
        );
      } else {
        enemy.enemyMissileLock = Math.max(
          0,
          (enemy.enemyMissileLock || 0) - dt * 1.4
        );
      }

      if (enemy.enemyMissileLock >= 1) {
        this.launchEnemyMissile(enemy);
        enemy.enemyMissileLock = 0;
        enemy.enemyMissileAmmo--;
        enemy.enemyMissileCooldownUntil =
          now + Phaser.Math.Linear(12500, 7600, pilot.skill) + Phaser.Math.Between(0, 3200);
      }
    }
  }

  launchEnemyMissile(enemy) {
    const missile = this.enemyMissiles.get(enemy.x, enemy.y, 'enemyShot');
    if (!missile) return;

    const pilot = enemy.pilot || PILOT_PROFILES.FIGHTER;

    missile.enableBody(true, enemy.x, enemy.y, true, true);
    missile.entityType = 'enemyMissile';
    missile.setDisplaySize(
      GAME.missileDisplayHeight * (3 / 11.3),
      GAME.missileDisplayHeight
    );
    missile.setDepth(17);
    missile.body.setSize(
      missile.width * 0.72,
      missile.height * 0.72,
      true
    );

    missile.age = 0;
    missile.speed = Math.max(
      GAME.enemyMissileInitialSpeed,
      Math.min(GAME.enemyMissileMaxSpeed * 0.55, (enemy.speedMps || 220) + 45)
    );
    missile.heading = enemy.heading;
    missile.rotation = missile.heading + Math.PI / 2;
    missile.targetType = 'player';
    missile.target = this.player;
    missile.previousLosAngle = Phaser.Math.Angle.BetweenPoints(missile, this.player);
    missile.lostTargetTime = 0;
    missile.trailTimer = 0;
    missile.seekerQuality = pilot.skill;
    missile.sourcePilot = pilot.id;

    this.physics.velocityFromRotation(
      missile.heading,
      missile.speed,
      missile.body.velocity
    );

    this.playEnemyMissileLaunchSound(enemy.x);
    this.showWeaponCue('MISSILE INBOUND', '#ff455b');
  }

  findSeductiveFlare(missile) {
    let best = null;
    let bestScore = 0;

    for (const flare of this.getActiveFlares()) {
      const dx = flare.x - missile.x;
      const dy = flare.y - missile.y;
      const distance = Math.hypot(dx, dy);
      if (distance > GAME.flareSeductionRadius) continue;

      const bearing = Math.atan2(dy, dx);
      const angleError = Math.abs(
        Phaser.Math.Angle.Wrap(bearing - missile.heading)
      );

      if (angleError > GAME.enemyMissileSeekerCone) continue;

      const distanceScore = 1 - distance / GAME.flareSeductionRadius;
      const angleScore = 1 - angleError / GAME.enemyMissileSeekerCone;
      const score =
        flare.heat *
        (0.38 + distanceScore * 0.62) *
        (0.35 + angleScore * 0.65);

      if (score > bestScore) {
        bestScore = score;
        best = flare;
      }
    }

    const quality = missile.seekerQuality || 0.6;
    const threshold = Phaser.Math.Linear(0.40, 0.67, quality);

    return bestScore >= threshold ? best : null;
  }

  recycleEnemyMissile(missile) {
    if (!missile?.active || this.entityIs(missile, 'player')) return;

    missile.target = null;
    missile.targetType = null;
    missile.age = 0;
    missile.speed = 0;
    missile.lostTargetTime = 0;
    missile.previousLosAngle = null;
    missile.trailTimer = 0;
    missile.disableBody(true, true);
  }

  updateEnemyMissiles(dt) {
    for (const missile of this.enemyMissiles.getChildren()) {
      if (!missile.active) continue;

      missile.age = (missile.age || 0) + dt;
      if (missile.age >= GAME.enemyMissileLifetime) {
        this.recycleEnemyMissile(missile);
        continue;
      }

      let acceleration = 0;
      if (missile.age < GAME.enemyMissileBoostTime) {
        acceleration = GAME.enemyMissileBoostAcceleration;
      } else if (missile.age < GAME.enemyMissileBurnTime) {
        acceleration = GAME.enemyMissileSustainAcceleration;
      } else {
        acceleration = -GAME.enemyMissileCoastDrag;
      }

      missile.speed = Phaser.Math.Clamp(
        missile.speed + acceleration * dt,
        GAME.enemyMissileMinUsefulSpeed,
        GAME.enemyMissileMaxSpeed
      );

      if (
        missile.targetType === 'player' &&
        missile.age >= GAME.enemyMissileStraightTime
      ) {
        const flare = this.findSeductiveFlare(missile);
        if (flare) {
          missile.targetType = 'flare';
          missile.target = flare;
          missile.previousLosAngle = Phaser.Math.Angle.BetweenPoints(missile, flare);
          missile.lostTargetTime = 0;
        }
      }

      if (
        missile.targetType === 'player' &&
        (this.state.lowAltitude || !this.player?.active)
      ) {
        missile.target = null;
        missile.targetType = null;
      }

      if (
        missile.targetType === 'flare' &&
        (!missile.target?.flareActive || missile.target.heat <= 0.02)
      ) {
        // Una vez engañado, el misil no reacquire mágicamente en esta versión.
        missile.target = null;
        missile.targetType = null;
      }

      const target = missile.target;
      const canGuide =
        missile.age >= GAME.enemyMissileStraightTime &&
        target &&
        (missile.targetType === 'player' ? target.active : target.flareActive);

      if (canGuide) {
        const losAngle = Phaser.Math.Angle.BetweenPoints(missile, target);
        const headingError = Phaser.Math.Angle.Wrap(
          losAngle - missile.heading
        );

        if (Math.abs(headingError) > GAME.enemyMissileSeekerCone) {
          missile.lostTargetTime += dt;
        } else {
          missile.lostTargetTime = Math.max(
            0,
            missile.lostTargetTime - dt * 1.5
          );
        }

        if (missile.lostTargetTime >= GAME.enemyMissileTrackLossDelay) {
          missile.target = null;
          missile.targetType = null;
        } else {
          const previousLos = Number.isFinite(missile.previousLosAngle)
            ? missile.previousLosAngle
            : losAngle;

          const losRate = Phaser.Math.Angle.Wrap(
            losAngle - previousLos
          ) / Math.max(dt, 0.001);

          missile.previousLosAngle = losAngle;

          const commandedRate =
            GAME.enemyMissileNavConstant * losRate +
            headingError * GAME.enemyMissileHeadingCorrection;

          const gLimitedRate =
            (GAME.enemyMissileMaxG * GAME.gravity) /
            Math.max(missile.speed, 1);

          const maxTurnRate = Math.min(
            GAME.enemyMissileAbsoluteMaxTurnRate,
            gLimitedRate
          );

          missile.heading = Phaser.Math.Angle.Wrap(
            missile.heading +
            Phaser.Math.Clamp(
              commandedRate,
              -maxTurnRate,
              maxTurnRate
            ) * dt
          );
        }
      }

      missile.rotation = missile.heading + Math.PI / 2;
      this.physics.velocityFromRotation(
        missile.heading,
        missile.speed,
        missile.body.velocity
      );

      missile.trailTimer -= dt;
      if (missile.trailTimer <= 0) {
        this.spawnMissileTrail(missile);
        missile.trailTimer = GAME.missileTrailInterval;
      }

      if (
        missile.targetType === 'flare' &&
        missile.target?.flareActive &&
        Phaser.Math.Distance.Between(
          missile.x, missile.y,
          missile.target.x, missile.target.y
        ) < 18
      ) {
        this.recycleEnemyMissile(missile);
        continue;
      }

      if (
        !this.state.lowAltitude &&
        this.player?.active &&
        Phaser.Math.Distance.Between(
          missile.x, missile.y,
          this.player.x, this.player.y
        ) <= GAME.enemyMissileHitDistance
      ) {
        this.playExplosionSound(this.player.x, 0.9);
        this.recycleEnemyMissile(missile);
        this.damagePlayer();
      }
    }
  }

  enemyFire() {
    const now = this.time.now;

    const candidates = this.enemies.getChildren().filter((enemy) => {
      if (
        !enemy.active ||
        enemy.isDying ||
        enemy.damageState === 'CRITICAL' ||
        !this.isEnemyVisible(enemy, 20)
      ) return false;

      if (now < (enemy.fireCooldownUntil || 0)) return false;

      const pilot = enemy.pilot || PILOT_PROFILES.FIGHTER;
      const distance = Phaser.Math.Distance.Between(
        enemy.x, enemy.y, this.player.x, this.player.y
      );

      const maxRange =
        Math.max(this.scale.width, this.scale.height) *
        pilot.fireRange;

      if (distance > maxRange) return false;

      const sight = Phaser.Math.Angle.BetweenPoints(enemy, this.player);
      const noseError = Math.abs(
        Phaser.Math.Angle.Wrap(sight - enemy.heading)
      );

      return noseError < pilot.fireCone;
    });

    if (!candidates.length) return;

    Phaser.Utils.Array.Shuffle(candidates);
    const shooters = candidates.slice(
      0,
      Math.min(candidates.length, Phaser.Math.Between(1, 2))
    );

    for (const enemy of shooters) {
      const pilot = enemy.pilot || PILOT_PROFILES.FIGHTER;
      const shot = this.enemyShots.get(enemy.x, enemy.y, 'enemyShot');
      if (!shot) continue;

      shot.enableBody(true, enemy.x, enemy.y, true, true);
      shot.entityType = 'enemyShot';
      shot.setDisplaySize(
        GAME.missileDisplayHeight * (3 / 11.3),
        GAME.missileDisplayHeight
      );
      shot.setDepth(14);
      shot.body.setSize(
        shot.width * 0.75,
        shot.height * 0.72,
        true
      );

      // Pilotos mejores anticipan una pequeña fracción del movimiento del jugador.
      const playerVx = this.player.body?.velocity.x || 0;
      const playerVy = this.player.body?.velocity.y || 0;
      const leadTime = Phaser.Math.Linear(0.03, 0.17, pilot.skill);
      const aimX = this.player.x + playerVx * leadTime;
      const aimY = this.player.y + playerVy * leadTime;

      const angle =
        Math.atan2(aimY - enemy.y, aimX - enemy.x) +
        Phaser.Math.FloatBetween(-pilot.aimError, pilot.aimError);

      shot.rotation = angle + Math.PI / 2;
      this.physics.velocityFromRotation(
        angle,
        GAME.enemyShotSpeed,
        shot.body.velocity
      );
      this.playEnemyWeaponSound(enemy.x);

      enemy.fireCooldownUntil =
        now +
        Phaser.Math.Linear(1350, 720, pilot.skill) +
        Phaser.Math.Between(0, 430);
    }
  }
  cleanupProjectiles() {
    const margin = 120;
    const { width, height } = this.scale;

    const outside = (obj) => (
      obj.x < -margin || obj.x > width + margin || obj.y < -margin || obj.y > height + margin
    );

    for (const bullet of this.bullets.getChildren()) {
      if (bullet.active && outside(bullet)) this.recycleProjectile(bullet);
    }
    for (const shot of this.enemyShots.getChildren()) {
      if (shot.active && outside(shot)) this.recycleProjectile(shot);
    }
    const missileMargin = 360;
    const missileOutside = (obj) => (
      obj.x < -missileMargin || obj.x > width + missileMargin ||
      obj.y < -missileMargin || obj.y > height + missileMargin
    );

    for (const missile of this.homingMissiles.getChildren()) {
      if (missile.active && missileOutside(missile)) this.recycleMissile(missile);
    }

    const enemyMissileMargin = 520;
    for (const missile of this.enemyMissiles.getChildren()) {
      if (
        missile.active &&
        (
          missile.x < -enemyMissileMargin ||
          missile.x > width + enemyMissileMargin ||
          missile.y < -enemyMissileMargin ||
          missile.y > height + enemyMissileMargin
        )
      ) {
        this.recycleEnemyMissile(missile);
      }
    }
  }

  entityIs(obj, type) {
    if (!obj) return false;
    if (obj.entityType === type) return true;

    const key = obj.texture?.key;
    const fallback = {
      player: 'player',
      playerBullet: 'bullet',
      playerMissile: 'homingMissile',
      enemy: 'enemy',
      enemyShot: 'enemyShot',
      enemyMissile: 'enemyShot'
    };
    return key === fallback[type];
  }

  getCollisionEntity(a, b, type) {
    if (this.entityIs(a, type)) return a;
    if (this.entityIs(b, type)) return b;
    return null;
  }

  ensurePlayerOperational() {
    if (!this.player || this.state.gameOver) return;

    const x = Phaser.Math.Clamp(
      Number.isFinite(this.player.x) ? this.player.x : this.scale.width / 2,
      18,
      Math.max(18, this.scale.width - 18)
    );
    const y = Phaser.Math.Clamp(
      Number.isFinite(this.player.y) ? this.player.y : this.scale.height * 0.68,
      18,
      Math.max(18, this.scale.height - 18)
    );

    // Tras disableBody() no basta con cambiar visible/active: enableBody()
    // restaura de forma correcta el cuerpo Arcade Physics.
    if (!this.player.active || !this.player.visible || !this.player.body?.enable) {
      if (this.player.body) {
        this.player.enableBody(true, x, y, true, true);
      } else {
        this.player.setActive(true).setVisible(true);
      }
    }

    this.player.entityType = 'player';
    this.player.setActive(true).setVisible(true).setDepth(20);
    this.player.altitudeVisualScaleTarget = this.state.lowAltitude ? 0.62 : 1;
    this.player.setAlpha(this.state.lowAltitude ? 0.88 : 1);

    if (this.state.missionStarted) this.state.controlsEnabled = true;
  }

  recycleProjectile(projectile) {
    if (!projectile?.active) return;

    const valid =
      this.entityIs(projectile, 'playerBullet') ||
      this.entityIs(projectile, 'enemyShot');

    // Protección crítica: jamás reciclar al jugador.
    if (!valid || this.entityIs(projectile, 'player')) {
      if (this.entityIs(projectile, 'player')) {
        console.warn('[Plane] Bloqueado intento de reciclar al jugador.');
        this.ensurePlayerOperational();
      }
      return;
    }

    projectile.disableBody(true, true);
  }

  recycleMissile(missile) {
    if (!missile?.active) return;

    if (!this.entityIs(missile, 'playerMissile') || this.entityIs(missile, 'player')) {
      if (this.entityIs(missile, 'player')) this.ensurePlayerOperational();
      return;
    }

    missile.target = null;
    missile.speed = 0;
    missile.age = 0;
    missile.previousLosAngle = null;
    missile.lostTargetTime = 0;
    missile.trailTimer = 0;
    missile.disableBody(true, true);
  }

  showEnemyDamageCue(enemy, text, color = '#ffcf32') {
    if (!enemy?.visible) return;

    const cue = this.add.text(enemy.x, enemy.y - 38, text, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: this.hudPresentationMode === 'micro' ? '10px' : '13px',
      color,
      stroke: '#001018',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(131);

    this.tweens.add({
      targets: cue,
      y: cue.y - 18,
      alpha: 0,
      duration: 640,
      ease: 'Cubic.easeOut',
      onComplete: () => cue.destroy()
    });
  }

  flashEnemyHit(enemy, severe = false) {
    if (!enemy?.active || enemy.isDying) return;

    enemy.setTintFill(severe ? 0xff8c48 : 0xffffff);
    this.time.delayedCall(severe ? 100 : 65, () => {
      if (enemy?.active && !enemy.isDying) {
        enemy.clearTint();
        enemy.setTint(enemy.baseTintColor || 0xffffff);
      }
    });
  }

  createEnemyExplosionFx(enemy) {
    if (!enemy) return;

    const x = enemy.x;
    const y = enemy.y;

    const core = this.add.circle(x, y, 10, 0xffe39a, 0.96).setDepth(31);
    const fire = this.add.circle(x, y, 17, 0xff7b2f, 0.72).setDepth(30);
    const smoke = this.add.circle(x, y, 25, 0x283038, 0.38).setDepth(29);

    this.tweens.add({
      targets: core,
      scale: 2.5,
      alpha: 0,
      duration: 230,
      onComplete: () => core.destroy()
    });
    this.tweens.add({
      targets: fire,
      scale: 2.8,
      alpha: 0,
      duration: 410,
      onComplete: () => fire.destroy()
    });
    this.tweens.add({
      targets: smoke,
      scale: 3.2,
      alpha: 0,
      y: y + 30,
      duration: 720,
      onComplete: () => smoke.destroy()
    });

    for (let i = 0; i < 5; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const spark = this.add.rectangle(
        x, y,
        Phaser.Math.Between(2, 4),
        Phaser.Math.Between(7, 13),
        0xffc04a,
        0.9
      ).setDepth(32).setRotation(angle);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * Phaser.Math.Between(28, 62),
        y: y + Math.sin(angle) * Phaser.Math.Between(28, 62),
        alpha: 0,
        duration: Phaser.Math.Between(260, 470),
        onComplete: () => spark.destroy()
      });
    }
  }

  applyEnemyDamage(enemy, source = null, forcedDamage = null) {
    if (
      !enemy?.active ||
      enemy.isDying ||
      !this.entityIs(enemy, 'enemy') ||
      this.entityIs(enemy, 'player')
    ) {
      if (source) {
        if (this.entityIs(source, 'playerMissile')) this.recycleMissile(source);
        else if (this.entityIs(source, 'playerBullet')) this.recycleProjectile(source);
      }
      return;
    }

    let damage;
    let kind = 'impact';

    if (this.entityIs(source, 'playerMissile')) {
      damage = Phaser.Math.Between(
        GAME.enemyMissileDamageMin,
        GAME.enemyMissileDamageMax
      );
      kind = 'missile';
      this.recycleMissile(source);
    } else if (this.entityIs(source, 'playerBullet')) {
      damage = Phaser.Math.Between(
        GAME.enemyBulletDamageMin,
        GAME.enemyBulletDamageMax
      );
      kind = 'gun';
      this.recycleProjectile(source);
    } else {
      damage = GAME.enemyIntegrity;
      kind = 'collision';
    }

    if (Number.isFinite(forcedDamage)) damage = forcedDamage;

    enemy.lastDamageKind = kind;
    enemy.integrity = Math.max(0, enemy.integrity - damage);

    if (enemy.integrity <= 0) {
      this.beginEnemyDestruction(enemy, kind);
      return;
    }

    this.state.score += GAME.enemyHitPoints;

    const previous = enemy.damageState;
    if (enemy.integrity <= GAME.enemyCriticalThreshold) {
      enemy.damageState = 'CRITICAL';
    } else if (enemy.integrity <= GAME.enemyDamagedThreshold) {
      enemy.damageState = 'DAMAGED';
    } else {
      enemy.damageState = 'OK';
    }

    const severe = enemy.damageState !== 'OK';
    this.flashEnemyHit(enemy, severe);

    if (enemy.damageState === 'CRITICAL') {
      enemy.phase = 'escape';
      enemy.criticalFailureTimer =
        kind === 'missile'
          ? Phaser.Math.FloatBetween(0.65, 2.15)
          : (enemy.integrity <= 14
              ? Phaser.Math.FloatBetween(1.2, 3.1)
              : Phaser.Math.FloatBetween(2.8, 5.8));

      if (previous !== 'CRITICAL') {
        this.showEnemyDamageCue(enemy, 'CRITICAL', '#ff5c45');
      } else {
        this.showEnemyDamageCue(enemy, 'HIT', '#ff9b4a');
      }
    } else if (enemy.damageState === 'DAMAGED') {
      if (previous !== 'DAMAGED') {
        this.showEnemyDamageCue(enemy, 'DAMAGED', '#ffcf32');
      } else {
        this.showEnemyDamageCue(enemy, 'HIT', '#ffffff');
      }
    } else {
      this.showEnemyDamageCue(enemy, 'HIT', '#ffffff');
    }

    this.updateHud();
  }

  beginEnemyDestruction(enemy, reason = 'impact') {
    if (!enemy?.active || enemy.isDying) return;

    enemy.isDying = true;
    enemy.phase = 'falling';
    enemy.damageState = 'DESTROYED';
    enemy.lastDamageKind = reason;

    // Los misiles dejan de perseguir un aparato que ya está cayendo.
    for (const missile of this.homingMissiles.getChildren()) {
      if (missile.active && missile.target === enemy) missile.target = null;
    }
    if (this.weaponLock?.candidate === enemy) {
      this.weaponLock.candidate = null;
      this.weaponLock.target = null;
      this.weaponLock.progress = 0;
      this.weaponLock.status = 'SEARCH';
    }

    const vx = enemy.body?.velocity?.x || 0;
    const vy = enemy.body?.velocity?.y || 0;

    if (enemy.body) {
      enemy.body.stop();
      enemy.body.enable = false;
    }

    enemy.fallVx = vx * Phaser.Math.FloatBetween(0.20, 0.42) +
      Phaser.Math.FloatBetween(-28, 28);
    enemy.fallVy = Math.max(55, vy * 0.18 + Phaser.Math.FloatBetween(80, 135));
    enemy.spinRate =
      Phaser.Math.RND.pick([-1, 1]) *
      Phaser.Math.FloatBetween(2.1, 4.4);
    enemy.deathTimer = Phaser.Math.FloatBetween(
      GAME.enemyFallingMinSeconds,
      GAME.enemyFallingMaxSeconds
    );
    enemy.damageSmokeTimer = 0;

    if (!enemy.killAwarded) {
      enemy.killAwarded = true;
      this.state.destroyed++;
      this.state.score += GAME.pointsEnemy;
      this.showEnemyDamageCue(enemy, 'SHOT DOWN', '#69ff9e');

      if (this.state.destroyed % 15 === 0) {
        this.state.spawningPaused = true;
        this.showEncouragement();
        this.time.delayedCall(10000, () => {
          if (!this.state.gameOver) this.state.spawningPaused = false;
        });
      }
    }

    this.updateHud();
  }

  finalizeEnemyDestruction(enemy) {
    if (!enemy?.active) return;

    this.createEnemyExplosionFx(enemy);
    const strength =
      enemy.lastDamageKind === 'missile' ? 1.15 :
      enemy.lastDamageKind === 'collision' ? 1.06 :
      0.86;
    this.playExplosionSound(enemy.x, strength);

    enemy.clearTint();
    enemy.isDying = false;
    enemy.killAwarded = false;
    enemy.integrity = 0;

    if (enemy.body) enemy.body.enable = false;
    enemy.setActive(false).setVisible(false);
  }

  destroyEnemy(enemy, source = null) {
    // Método compatible para colisiones u otras rutas que requieran derribo inmediato.
    if (source) {
      this.applyEnemyDamage(enemy, source, GAME.enemyIntegrity + 1);
    } else {
      this.beginEnemyDestruction(enemy, 'collision');
    }
  }

  onBulletEnemy(a, b) {
    const bullet = this.getCollisionEntity(a, b, 'playerBullet');
    const enemy = this.getCollisionEntity(a, b, 'enemy');
    if (!bullet || !enemy) return;
    this.applyEnemyDamage(enemy, bullet);
  }

  onMissileEnemy(a, b) {
    const missile = this.getCollisionEntity(a, b, 'playerMissile');
    const enemy = this.getCollisionEntity(a, b, 'enemy');
    if (!missile || !enemy) return;
    this.applyEnemyDamage(enemy, missile);
  }

  onBulletEnemyShot(a, b) {
    const bullet = this.getCollisionEntity(a, b, 'playerBullet');
    const enemyShot = this.getCollisionEntity(a, b, 'enemyShot');
    if (!bullet || !enemyShot) return;
    this.recycleProjectile(bullet);
    this.recycleProjectile(enemyShot);
  }

  onEnemyShotPlayer(a, b) {
    if (this.state.lowAltitude) return;

    const player = this.getCollisionEntity(a, b, 'player');
    const enemyShot = this.getCollisionEntity(a, b, 'enemyShot');
    if (!player || !enemyShot || player !== this.player) return;

    this.recycleProjectile(enemyShot);
    this.damagePlayer();
  }

  onEnemyPlayer(a, b) {
    if (this.state.lowAltitude) return;

    const player = this.getCollisionEntity(a, b, 'player');
    const enemy = this.getCollisionEntity(a, b, 'enemy');
    if (!player || !enemy || player !== this.player) return;

    this.beginEnemyDestruction(enemy, 'collision');
    this.damagePlayer();
  }

  damagePlayer() {
    const now = this.time.now;
    if (now < this.state.invulnerableUntil || this.state.gameOver) return;

    this.state.invulnerableUntil = now + GAME.hitInvulnerabilityMs;
    this.state.lives--;
    this.state.score -= GAME.hitPenalty;
    this.playPlayerHitSound();

    if (this.state.lives <= 0) {
      this.updateHud();
      this.endGame();
      return;
    }

    // Si queda al menos una vida, el impacto nunca debe ocultar ni bloquear el F-22.
    this.ensurePlayerOperational();

    if (this.player.body) {
      const vx = Phaser.Math.Clamp(this.player.body.velocity.x, -GAME.playerSpeed, GAME.playerSpeed);
      const vy = Phaser.Math.Clamp(this.player.body.velocity.y, -GAME.playerSpeed, GAME.playerSpeed);
      this.player.setVelocity(vx, vy);
    }

    this.updateHud();
    this.createPlayerHitFx();

    // Segunda comprobación cuando termine el callback de física del frame actual.
    this.time.delayedCall(0, () => {
      if (!this.state.gameOver) this.ensurePlayerOperational();
    });
  }

  createPlayerHitFx() {
    if (!this.player?.active) return;

    const baseAlpha = this.state.lowAltitude ? 0.88 : 1;
    this.cameras.main.shake(150, 0.008);

    // Destello de pantalla muy breve, sin tocar la visibilidad del avión.
    const flash = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0xff203f,
      0.16
    ).setDepth(150).setScrollFactor(0);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    // Onda expansiva arcade centrada en el punto del impacto.
    const ring = this.add.circle(this.player.x, this.player.y, 34, 0xff334f, 0.04)
      .setStrokeStyle(5, 0xff3b5c, 1)
      .setDepth(26);
    this.tweens.add({
      targets: ring,
      scaleX: 2.25,
      scaleY: 2.25,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    // Flash de color: nunca bajamos alpha, por lo que el avión permanece visible.
    this.player.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (this.player?.active) this.player.setTintFill(0xff3b4f);
    });
    this.time.delayedCall(150, () => {
      if (this.player?.active) this.player.setTintFill(0xffffff);
    });
    this.time.delayedCall(230, () => {
      if (this.player?.active) {
        this.player.clearTint();
        this.player.setVisible(true).setAlpha(baseAlpha);
      }
    });

    const hit = this.add.text(this.scale.width / 2, this.scale.height * 0.72, 'HIT!  -1 LIFE', {
      fontFamily: 'Impact, Haettenschweiler, Arial Black, sans-serif',
      fontSize: '34px',
      color: '#ff3556',
      stroke: '#ffffff',
      strokeThickness: 3,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
    }).setOrigin(0.5).setDepth(155).setScrollFactor(0);
    this.tweens.add({
      targets: hit,
      y: hit.y - 34,
      alpha: 0,
      delay: 260,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => hit.destroy()
    });
  }

  showEncouragement() {
    const text = Phaser.Math.RND.pick(ENCOURAGEMENT).toUpperCase();
    const tiny = this.hudPresentationMode === 'micro';
    const compact = tiny || this.hudPresentationMode === 'compact';
    const y = compact ? this.scale.height - 36 : this.scale.height - 92;
    const h = tiny ? 30 : (compact ? 38 : 58);
    const font = tiny ? 13 : (compact ? 16 : 24);

    const banner = this.add.rectangle(
      this.scale.width / 2,
      y,
      Math.min(compact ? 520 : 720, this.scale.width - 24),
      h,
      0x06131d,
      compact ? 0.78 : 0.92
    ).setStrokeStyle(compact ? 1 : 3, 0xffc928, 1).setDepth(119);

    const message = this.add.text(this.scale.width / 2, y, `★  ${text}  ★`, {
      fontFamily: 'Impact, Haettenschweiler, Arial Black, sans-serif',
      fontSize: `${font}px`,
      color: '#ffdb3d',
      stroke: '#001018',
      strokeThickness: compact ? 3 : 5,
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(120);

    this.tweens.add({
      targets: [message, banner],
      alpha: 0,
      delay: compact ? 2600 : 4200,
      duration: 700,
      onComplete: () => {
        message.destroy();
        banner.destroy();
      }
    });
  }

  endGame() {
    this.state.gameOver = true;
    this.state.controlsEnabled = false;
    this.playGameOverSound();
    this.player.setVelocity(0, 0);
    this.player.disableBody(true, true);
    this.physics.pause();

    const { width, height } = this.scale;
    const titleFont = Phaser.Math.Clamp(Math.round(Math.min(width * 0.12, height * 0.22)), 28, 76);
    const scoreFont = Phaser.Math.Clamp(Math.round(titleFont * 0.34), 13, 26);
    const restartFont = Phaser.Math.Clamp(Math.round(titleFont * 0.36), 14, 27);
    const yGap = Phaser.Math.Clamp(Math.round(height * 0.16), 42, 88);

    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62).setDepth(190);
    const title = this.add.text(width / 2, height / 2 - yGap, 'MISSION FAILED', {
      fontFamily: 'Impact, Haettenschweiler, Arial Black, sans-serif',
      fontSize: `${titleFont}px`,
      color: '#ff3154',
      stroke: '#ffffff',
      strokeThickness: 3,
      shadow: { offsetX: 5, offsetY: 5, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5).setDepth(200);

    const score = this.add.text(width / 2, height / 2 + 4,
      `SCORE  ${this.state.score.toLocaleString('es-ES')}   //   KILLS  ${this.state.destroyed}`, {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: `${scoreFont}px`,
        color: '#ffffff',
        stroke: '#001018',
        strokeThickness: 5
      }).setOrigin(0.5).setDepth(200);

    const restart = this.add.text(width / 2, height / 2 + yGap, this.isMobileLayout ? '▶  TAP TO RETRY' : '▶  PRESS R TO RETRY', {
      fontFamily: 'Impact, Haettenschweiler, Arial Black, sans-serif',
      fontSize: `${restartFont}px`,
      color: '#ffdb3d',
      backgroundColor: '#071926',
      stroke: '#001018',
      strokeThickness: 3,
      padding: { x: 26, y: 14 }
    }).setOrigin(0.5).setDepth(200).setInteractive({ useHandCursor: true });

    restart.on('pointerdown', () => this.restartGame());
    this.gameOverUi = [shade, title, score, restart];
  }

  restartGame() {
    mapBackground.reset();
    this.scene.restart();
  }

  updateHud() {
    if (!this.hudScore || !this.hudRight || !this.hudSpeed) return;

    const activeMissiles = this.homingMissiles
      ? this.homingMissiles.getChildren().filter((m) => m.active).length
      : 0;

    const inboundMissiles = this.enemyMissiles
      ? this.enemyMissiles.getChildren().filter((m) => m.active).length
      : 0;

    const totalEnemies = this.enemies
      ? this.enemies.getChildren().filter((enemy) => enemy.active && !enemy.isDying).length
      : 0;

    const visibleEnemies = this.enemies
      ? this.enemies.getChildren().filter(
          (enemy) => enemy.active && !enemy.isDying && this.isEnemyVisible(enemy, 0)
        ).length
      : 0;

    const kmh = Math.round(this.state.playerAirspeed * 3.6);
    const targetKmh = Math.round(this.state.targetAirspeed * 3.6);
    const mode = this.hudPresentationMode || this.layoutMode || 'desktop';

    const scoreText = Math.trunc(this.state.score).toLocaleString('es-ES');
    this.hudScore.setText(mode === 'micro' ? `S ${scoreText}` : scoreText);

    this.hudLives.setText(
      `${mode === 'desktop' ? 'LIFE  ' : ''}${'◆'.repeat(Math.max(0, this.state.lives))}${'◇'.repeat(Math.max(0, GAME.playerLives - this.state.lives))}`
    );

    this.hudSpeed.setText(String(kmh).padStart(mode === 'micro' ? 3 : 4, '0'));
    this.hudSpeedUnit.setText('KM/H');

    if (this.speedWidget) {
      this.speedWidget.value.setText(String(kmh));
      this.speedWidget.target.setText(kmh !== targetKmh ? `▶${targetKmh}` : '');

      const speedNorm = Phaser.Math.Clamp(
        (this.state.targetAirspeed - GAME.playerMinAirspeed) /
        Math.max(1, GAME.playerMaxAirspeed - GAME.playerMinAirspeed),
        0,
        1
      );
      const litBars = Math.max(1, Math.round(speedNorm * this.speedWidget.bars.length));

      this.speedWidget.bars.forEach((bar, i) => {
        const active = i < litBars;
        const nearMax = i >= this.speedWidget.bars.length - 2;
        bar.setFillStyle(
          active ? (nearMax ? 0xffc928 : 0x36dcff) : 0x17384a,
          active ? 0.95 : 0.65
        );
      });
    }

    const wx = this.getWeatherDisplayPreset();
    if (this.hudWeather) {
      const transition = this.weather?.transitionActive
        ? ` → ${WEATHER_PRESETS[this.weather.targetIndex].id}`
        : '';
      this.hudWeather.setText(mode === 'micro' ? `WX ${wx.id}${transition}` : `WX // ${wx.id}${transition}`);
      this.hudWeather.setColor(
        wx.id === 'TSR' ? '#ffb32f' :
        (wx.id === 'OVC' ? '#d8e7f0' : '#ffffff')
      );
    }

    const altitudeLong = this.state.lowAltitude ? '▼ LOW / LOCK' : '▲ COMBAT';
    const altitudeShort = this.state.lowAltitude ? '▼LOW' : '▲CBT';
    this.hudRight.setColor(this.state.lowAltitude ? '#ffcf32' : '#ffffff');

    if (mode === 'micro') {
      this.hudRight.setText(
        `H ${visibleEnemies}/${totalEnemies}  M ${activeMissiles}  F ${this.state.flares}  ${inboundMissiles ? '!' + inboundMissiles : ''}`
      );
    } else if (mode === 'compact') {
      this.hudRight.setText([
        `${altitudeShort}   H ${visibleEnemies}/${totalEnemies}`,
        `M ${activeMissiles}  FLR ${this.state.flares}  ${inboundMissiles ? 'IN ' + inboundMissiles : 'K ' + this.state.destroyed}`
      ]);
    } else if (mode === 'mobile') {
      this.hudRight.setText([
        `${altitudeLong}`,
        `H ${visibleEnemies}/${totalEnemies}  M ${activeMissiles}`,
        `FLR ${this.state.flares}  ${inboundMissiles ? 'IN ' + inboundMissiles : 'K ' + this.state.destroyed}`
      ]);
    } else {
      this.hudRight.setText([
        altitudeLong,
        `HOSTILE  ${visibleEnemies} VIS / ${totalEnemies} TOTAL`,
        `MSL ${activeMissiles}/${GAME.maxHomingMissiles}   FLR ${this.state.flares}`,
        inboundMissiles ? `MISSILE INBOUND  ${inboundMissiles}` : `KILLS    ${this.state.destroyed}`
      ]);
    }

    if (this.mobileButtons?.alt) {
      const c = this.state.lowAltitude ? 0xffc928 : 0x4bdcff;
      this.mobileButtons.alt.bg.setStrokeStyle(2, c, 0.85);
    }

    this.updateAudioHud();
  }

  onResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    if (!width || !height) return;

    this.physics.world.setBounds(0, 0, width, height);
    this.weatherShade?.setSize(width, height);
    this.lightningFlash?.setSize(width, height);

    const wasMobile = this.isMobileLayout;
    this.applyHudLayout();
    this.layoutRadar();

    for (const streak of this.speedStreaks || []) {
      if (
        streak.x < -40 || streak.x > width + 40 ||
        streak.y < -Math.max(80, height) || streak.y > height + 80
      ) {
        this.resetSpeedStreak(streak, false);
      }
    }

    // Compactar una ventana de escritorio no crea controles táctiles.
    // Solo reconstruimos esos controles si cambia realmente el modo táctil.
    if (this.isMobileLayout !== wasMobile) {
      this.mobileUi?.forEach((obj) => obj?.destroy?.());
      this.mobileUi = [];
      this.mobileJoystick = null;
      this.mobileButtons = null;
      this.mobileMoveVector?.set(0, 0);
      this.mobileFireHeld = false;
      this.createMobileControls();
    } else {
      this.layoutMobileControls();
    }
    this.updateHud();

    if (this.state?.gameOver && this.gameOverUi) {
      const [shade, title, score, restart] = this.gameOverUi;
      shade?.setPosition(width / 2, height / 2).setSize(width, height);
      const yGap = Phaser.Math.Clamp(Math.round(height * 0.16), 42, 88);
      title?.setPosition(width / 2, height / 2 - yGap);
      score?.setPosition(width / 2, height / 2 + 4);
      restart?.setPosition(width / 2, height / 2 + yGap);
    }
  }

}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  transparent: true,
  backgroundColor: 'rgba(0,0,0,0)',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 5
  },
  render: {
    antialias: true,
    roundPixels: false
  },
  scene: PlaneScene
};

window.addEventListener('load', () => {
  if (!window.Phaser) {
    console.error('Phaser no se ha podido cargar.');
    return;
  }
  window.planeGame = new Phaser.Game(phaserConfig);
}, { once: true });
