// A world-specific Minecraft-style calendar. One 24-hour game day is twenty
// minutes of ACTIVE gameplay; opening the menu or changing tabs pauses it.
export const DAY_MS = 20 * 60 * 1000;
export const MORNING_HOUR = 7;
const initialTime = Math.round(DAY_MS * 8 / 24);
export const freshDayNight = () => ({ day: 1, timeMs: initialTime });

export function validateDayNight(value, invalid = () => { throw new Error('invalidFile'); }) {
  if (value === undefined) return freshDayNight(); // v1-v7 compatibility.
  if (!value || Array.isArray(value) || typeof value !== 'object' ||
      !Number.isSafeInteger(value.day) || value.day < 1 || value.day > 1000000 ||
      !Number.isSafeInteger(value.timeMs) || value.timeMs < 0 || value.timeMs >= DAY_MS) return invalid();
  return { day: value.day, timeMs: value.timeMs };
}

export class DayNightClock {
  constructor() { this.restore(freshDayNight()); }
  restore(state) { const next=validateDayNight(state); this.day=next.day; this.timeMs=next.timeMs; }
  snapshot() { return { day:this.day, timeMs:Math.floor(this.timeMs) }; }
  get hour() { return this.timeMs * 24 / DAY_MS; }
  get isNight() { return this.hour >= 19 || this.hour < 6; }
  tick(deltaMs) {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return false;
    // Explicitly bound long frame gaps; callers must only tick while playing.
    const elapsed=Math.min(deltaMs,250);
    const sum=this.timeMs+elapsed;
    if(sum>=DAY_MS){this.day+=Math.floor(sum/DAY_MS);this.timeMs=sum%DAY_MS;}
    else this.timeMs=sum;
    return true;
  }
  sleep() {
    if (!this.isNight) return false;
    if (this.hour >= 19) this.day += 1;
    this.timeMs=Math.round(DAY_MS*MORNING_HOUR/24);
    return true;
  }
}

export function formatGameTime(state) {
  const minutes=Math.floor((state.timeMs/DAY_MS)*24*60)%1440;
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}
