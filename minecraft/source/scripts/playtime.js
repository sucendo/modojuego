// Gameplay time is counted only while pointer lock is active and the tab is visible.
// We keep a bounded journal of sessions, while the accumulated total never resets.
export const MAX_PLAY_SESSIONS = 80;
export const MAX_PLAY_MS = 365 * 24 * 60 * 60 * 1000 * 100; // 100 years, reject corrupt JSON.
export function emptyPlaytime() { return { totalMs: 0, sessions: [] }; }

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
const validDuration = value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_PLAY_MS;

export function validatePlaytime(raw, reject = () => { throw new Error('invalidFile'); }) {
  if (raw === undefined) return emptyPlaytime(); // Worlds from versions 1–6.
  if (raw === null || Array.isArray(raw) || typeof raw !== 'object' ||
      !validDuration(raw.totalMs) || !Array.isArray(raw.sessions) || raw.sessions.length > MAX_PLAY_SESSIONS) return reject();
  const sessions = [];
  let sum = 0;
  for (const session of raw.sessions) {
    if (session === null || Array.isArray(session) || typeof session !== 'object' ||
        !validDate(session.startedAt) || !validDate(session.endedAt) ||
        Date.parse(session.endedAt) < Date.parse(session.startedAt) || !validDuration(session.durationMs) ||
        session.durationMs > Date.parse(session.endedAt) - Date.parse(session.startedAt) + 1000) return reject();
    sum += session.durationMs;
    sessions.push({ startedAt: session.startedAt, endedAt: session.endedAt, durationMs: session.durationMs });
  }
  // Old sessions may have been trimmed; the visible journal cannot exceed the overall total.
  if (sum > raw.totalMs + sessions.length) return reject();
  return { totalMs: raw.totalMs, sessions };
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}

export class PlaytimeTracker {
  constructor({ monotonic = () => performance.now(), wallClock = () => new Date() } = {}) {
    this.monotonic = monotonic;
    this.wallClock = wallClock;
    this.restore(emptyPlaytime());
  }
  restore(value) {
    this.totalMs = value.totalMs;
    this.sessions = value.sessions.map(s => ({ ...s }));
    this.active = null;
    this.startedAtPerf = null;
  }
  get running() { return this.startedAtPerf !== null; }
  start() {
    if (this.running) return;
    const date = this.wallClock().toISOString();
    if (!this.active) this.active = { startedAt: date, endedAt: date, durationMs: 0 };
    this.startedAtPerf = this.monotonic();
  }
  tick() {
    if (!this.running) return;
    const now = this.monotonic();
    // Bound any single interval to avoid wild totals on suspended devices and clock anomalies.
    const elapsed = Math.max(0, Math.min(now - this.startedAtPerf, 24 * 3600 * 1000));
    const delta = Math.floor(elapsed);
    if (delta > 0) {
      this.totalMs += delta;
      this.active.durationMs += delta;
      this.active.endedAt = this.wallClock().toISOString();
    }
    this.startedAtPerf = now - (elapsed - delta);
  }
  pause() { this.tick(); this.startedAtPerf = null; }
  endSession() {
    this.pause();
    if (this.active && this.active.durationMs > 0) {
      this.sessions.push({ ...this.active });
      this.sessions = this.sessions.slice(-MAX_PLAY_SESSIONS);
    }
    this.active = null;
  }
  snapshot() {
    this.tick();
    const history = [...this.sessions];
    if (this.active && this.active.durationMs > 0) history.push({ ...this.active });
    return { totalMs: this.totalMs, sessions: history.slice(-MAX_PLAY_SESSIONS) };
  }
  sessionMs() { this.tick(); return this.active?.durationMs || 0; }
  total() { this.tick(); return this.totalMs; }
}
