// js/game/utils/tacticsState.js
// Estado de táctica/alineación (motor, sin DOM)

import { isPlayerUnavailable } from './availability.js';

function getPositionGroup(position) {
  const pos = (position || '').toUpperCase();
  if (pos === 'POR' || pos === 'GK') return 0;
  if (
    pos.startsWith('D') ||
    ['DF', 'LD', 'LI', 'DFC', 'CB', 'RB', 'LB', 'CAD', 'CAI'].includes(pos)
  )
    return 1;
  if (
    pos.startsWith('M') ||
    ['CM', 'DM', 'AM', 'MC', 'MCD', 'MCO', 'MD', 'MI', 'MP'].includes(pos)
  )
    return 2;
  if (['DC', 'DL', 'ED', 'EI', 'ST', 'FW', 'CF', 'SD'].includes(pos)) return 3;
  return 2;
}

export function autoPickMatchdaySquad(club, benchMax = 9) {
  if (!club || !Array.isArray(club.players)) return;

  const available = club.players
    .filter((p) => p && p.id && !isPlayerUnavailable(p))
    .slice()
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  const xi = [];
  const gk = available.find(
    (p) => String(p.position || '').toUpperCase() === 'POR'
  );
  if (gk) xi.push(gk.id);

  for (let i = 0; i < available.length && xi.length < 11; i++) {
    const id = available[i].id;
    if (id && !xi.includes(id)) xi.push(id);
  }

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

  if (!club.tactics) {
    club.tactics = {
      formation: '4-4-2',
      mentality: 'BALANCED',
      tempo: 'NORMAL',
      pressure: 'NORMAL',
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
  const parts = String(formation || '4-4-2')
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const lines = parts.length ? parts : [4, 4, 2];

  const slots = [];
  slots.push({ role: 'GK', x: 50, y: 86 });

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
        x: xs[i],
        y,
      });
    }
  }

  return slots.slice(0, 11);
}

export function assignPlayersToSlots(players, slots) {
  const list = (players || []).slice();

  const gks = list.filter((p) => String(p.position || '').toUpperCase() === 'POR');
  const defs = list.filter((p) => getPositionGroup(p.position) === 1 && String(p.position || '').toUpperCase() !== 'POR');
  const mids = list.filter((p) => getPositionGroup(p.position) === 2);
  const fwds = list.filter((p) => getPositionGroup(p.position) >= 3);

  const pick = (arr) => arr.shift() || null;

  return (slots || []).map((s) => {
    let p = null;
    if (s.role === 'GK') p = pick(gks) || pick(defs) || pick(mids) || pick(fwds);
    else if (s.role === 'DEF') p = pick(defs) || pick(mids) || pick(fwds) || pick(gks);
    else if (s.role === 'MID') p = pick(mids) || pick(defs) || pick(fwds) || pick(gks);
    else p = pick(fwds) || pick(mids) || pick(defs) || pick(gks);
    return { ...s, player: p };
  });
}