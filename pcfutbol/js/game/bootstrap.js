// js/game/bootstrap.js
//
// Punto único de "wire-up" para el motor (inyección de dependencias)
// y side-effects necesarios para evitar ciclos entre módulos.
//
// IMPORTANTE: este archivo debe importarse UNA vez (idealmente desde ui.js)

import { configureMainLeagueSync, configureWorldSimulateFixture } from './world/sync.js';
import { configureAdvancedStatsGenerator, simulateQuickWorldFixture } from './world/quickSim.js';
import { generateAdvancedStatsForFixture } from './match/advancedStats.js';
import { syncMainLeagueUpTo } from './simulateMatchday.js';

let _bootstrapped = false;

export function bootstrapGame() {
  if (_bootstrapped) return;
  _bootstrapped = true;

  // Inyectar generador de stats avanzadas (evita ciclos)
  configureAdvancedStatsGenerator(generateAdvancedStatsForFixture);

  // Registrar dependencias del módulo de sync (evita ciclos de imports)
  configureMainLeagueSync(syncMainLeagueUpTo);
  configureWorldSimulateFixture(simulateQuickWorldFixture);
}

// Side-effect intencional: si lo importas, queda listo.
bootstrapGame();