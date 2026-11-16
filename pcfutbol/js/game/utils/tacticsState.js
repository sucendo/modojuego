// js/game/utils/tacticsState.js
// Estado de táctica/alineación (motor, sin DOM)

import { isPlayerUnavailable } from './availability.js';
import { selectValidStartingXI } from './lineupSelection.js';
import { FORMATION_ROLES, fitPlayersToFormation, fitPlayersToRoles } from '../tactics/identity.js';

export function autoPickMatchdaySquad(club, benchMax = 9) {
  if (!club || !Array.isArray(club.players)) return;

  const available = club.players
    .filter((p) => p && p.id && !isPlayerUnavailable(p))
    .slice()
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  const suited = fitPlayersToFormation(available, club.tactics?.formation || club.alignment?.formation)
    .map(slot => slot.player?.id).filter(Boolean);
  const xi = selectValidStartingXI(available, suited);

  const xiSet = new Set(xi);
  const bench = [];
  for (let i = 0; i < available.length && bench.length < benchMax; i++) {
    const id = available[i].id;
    if (id && !xiSet.has(id) && !bench.includes(id)) bench.push(id);
  }

  club.lineup = xi.slice(0, 11);
  club.bench = bench.slice(0, benchMax);
}

export function ensureClubTactics(club) {
  if (!club) return;

  if (!club.alignment) {
    const identity = club.tacticalIdentity || {};
    club.alignment = {
      formation: identity.formation || '4-4-2',
      mentality: identity.mentality || 'BALANCED',
      tempo: identity.tempo || 'NORMAL',
      pressure: identity.pressure || 'NORMAL',
    };
  }
  if (!club.tactics) {
    club.tactics = {
      ...club.alignment,
      playStyle: club.tacticalIdentity?.playStyle || 'POSSESSION',
    };
  }

  if (!Array.isArray(club.lineup)) club.lineup = [];
  if (!Array.isArray(club.bench)) club.bench = [];

  if (club.lineup.length === 0 && club.bench.length === 0) {
    autoPickMatchdaySquad(club, 9);
  }
}

function spreadX(count) {
  if (count <= 1) return [50];
  const min = 18,
    max = 82;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

export function getFormationSlots(formation) {
  const normalized = FORMATION_ROLES[formation] ? formation : '4-4-2';
  const positions = FORMATION_ROLES[normalized];
  const parts = String(normalized)
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const lines = parts.length ? parts : [4, 4, 2];

  const slots = [];
  slots.push({ role: 'GK', position: 'GK', x: 50, y: 86 });

  const baseY = 70;
  const step = lines.length > 1 ? 52 / (lines.length - 1) : 0;
  const yLines = Array.from({ length: lines.length }, (_, i) => baseY - i * step);

  for (let li = 0; li < lines.length; li++) {
    const count = lines[li];
    const y = yLines[li];
    const xs = spreadX(count);
    for (let i = 0; i < count; i++) {
      slots.push({
        role: li === 0 ? 'DEF' : li === lines.length - 1 ? 'FWD' : 'MID',
        position: positions[slots.length],
        x: xs[i],
        y,
      });
    }
  }

  return slots.slice(0, 11);
}

export function assignPlayersToSlots(players, slots) {
  const positions = (slots || []).map(s => s.position || (s.role === 'GK' ? 'GK' : 'CM'));
  const assigned = fitPlayersToRoles(players, positions);
  return (slots || []).map((slot, index) => ({ ...slot, player: assigned[index]?.player || null }));
}
