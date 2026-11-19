import { formatDuration } from './playtime.js';
import { t, getLanguage, onLanguageChange } from './i18n.js';

const localStamp = iso => new Date(iso).toLocaleString(getLanguage(), { dateStyle:'short',timeStyle:'medium' });

export function setupPlaytimeUI(saves,player) {
  const worldName=document.getElementById('timer-world');
  const total=document.getElementById('timer-total');
  const session=document.getElementById('timer-session');
  const summary=document.getElementById('playtime-summary');
  const entries=document.getElementById('playtime-entries');
  const overlay=document.getElementById('overlay');

  const draw = () => {
    if (!saves.index) return;
    const snap=saves.playtime.snapshot();
    worldName.textContent=saves.currentWorld()?.name || '';
    total.textContent=formatDuration(snap.totalMs);
    session.textContent=formatDuration(saves.playtime.sessionMs());
    // The history is only rebuilt while the menu is displayed.
    if (overlay.hidden) return;
    summary.textContent=`${t('playtimeTotal')}: ${formatDuration(snap.totalMs)} · ${t('playtimeSessions')}: ${snap.sessions.length}`;
    entries.replaceChildren();
    if (!snap.sessions.length) {
      const empty=document.createElement('p'); empty.className='playtime-empty';
      empty.textContent=t('playtimeNoSessions'); entries.append(empty); return;
    }
    // Display latest sessions first, but persist the last 80 in the save JSON.
    for (const item of snap.sessions.slice(-12).reverse()) {
      const row=document.createElement('div');row.className='playtime-entry';
      const time=document.createElement('time');time.dateTime=item.startedAt;
      time.textContent=`${t('playtimeFrom')}: ${localStamp(item.startedAt)} · ${t('playtimeUntil')}: ${localStamp(item.endedAt)}`;
      const duration=document.createElement('strong');
      duration.textContent=formatDuration(item.durationMs);
      duration.title=t('playtimeDuration');
      row.append(time,duration);entries.append(row);
    }
  };
  const previous=saves.onWorldsChange;
  saves.onWorldsChange=(worlds)=>{previous(worlds);draw();};
  onLanguageChange(draw);
  player.controls.addEventListener('lock',draw);
  player.controls.addEventListener('unlock',draw);
  document.addEventListener('visibilitychange',draw);
  setInterval(draw,1000);
  draw();
}
