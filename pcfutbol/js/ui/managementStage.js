import { GameState } from '../state.js';
import {
  MANAGEMENT_STAGES, TRAINING_TYPES, TICKET_SECTORS, PLAYER_TRAINING_FOCUS, ensureManagementState,
  getManagementStage, getPendingUserFixtures, getTicketPrice, getStadiumSectors,
  getTicketSectorPrices, getTicketSalesProjection, setTicketPrice, setTicketSectorPrice,
  adjustTicketSectorPrices, setTicketMode, getSeasonTrainingMonths, getTrainingDayPlan,
  getUserFixturesOnDay, setTrainingDay, clearTrainingDay, setTrainingMode, setPlayerTrainingFocus,
} from '../game/managementCycle.js?v=1641';

let initialized = false;
let currentMonth = '';
let selectedTrainingDay = '';
let selectedSector = 'tribuna';
let selectedPlayer = '';

const get = id => document.getElementById(id);
const text = (id, value) => { const el = get(id); if (el) el.textContent = value; };
const euros = value => `${Math.round(Number(value || 0)).toLocaleString('es-ES')} €`;
const number = value => Math.round(Number(value || 0)).toLocaleString('es-ES');
const formatDate = iso => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const homeFixtures = () => getPendingUserFixtures(GameState).filter(fx => String(fx.homeClubId) === String(GameState.user?.clubId));
const selectedFixture = () => homeFixtures().find(fx => String(fx.id) === String(get('pcf-ticket-fixture')?.value));

const TRAINING_EFFECTS = {
  rest: 'Descansa y reduce la fatiga. No mejora atributos.',
  recovery: 'Favorece la recuperación y reduce la fatiga de la plantilla.',
  balanced: 'Actividad moderada: mantiene la condición física.',
  intense: 'Mejora gradualmente la resistencia, pero acumula fatiga y eleva el riesgo en los partidos.',
  technical: 'Pequeños progresos acumulativos en pase, regate, disparo y entrada.',
  tactical: 'Mejora levemente la forma y la preparación para competir.',
  match: 'Jornada de competición: no se programa entrenamiento adicional.',
};

export function initManagementUI({ onContinue } = {}) {
  if (initialized) return;
  initialized = true;

  get('pcf-ticket-fixture')?.addEventListener('change', updateManagementView);
  get('pcf-ticket-mode')?.addEventListener('change', e => {
    setTicketMode(GameState, e.target.value);
    updateManagementView();
  });
  get('pcf-ticket-flat-apply')?.addEventListener('click', () => {
    const fx = selectedFixture();
    if (!setTicketPrice(GameState, fx, get('pcf-ticket-price')?.value)) {
      text('pcf-ticket-hint', 'Tarifa no válida o entradas cerradas. Utiliza entre 5 y 250 €.');
      return;
    }
    setTicketMode(GameState, 'manual');
    updateManagementView();
  });
  // Selección desde el plano o la lista: mismo sector y precio en ambos sitios.
  for (const id of ['pcf-stadium-map', 'pcf-ticket-sector-list']) {
    get(id)?.addEventListener('click', event => {
      const button = event.target.closest('button[data-sector]');
      if (!button) return;
      selectedSector = button.dataset.sector;
      updateManagementView();
    });
  }
  get('pcf-ticket-sector-apply')?.addEventListener('click', () => {
    if (!setTicketSectorPrice(GameState, selectedFixture(), selectedSector, get('pcf-ticket-sector-price')?.value)) {
      text('pcf-ticket-hint', 'No se puede cambiar este precio. Comprueba la tarifa y la fecha.');
      return;
    }
    updateManagementView();
  });
  get('pcf-ticket-adjust-apply')?.addEventListener('click', () => {
    const fx = selectedFixture();
    const targets = get('pcf-ticket-adjust-scope')?.value === 'future' ? homeFixtures() : fx ? [fx] : [];
    const zone = get('pcf-ticket-adjust-zone')?.value === 'selected' ? selectedSector : 'all';
    const count = adjustTicketSectorPrices(GameState, targets, {
      sectorId: zone,
      operation: get('pcf-ticket-adjust-operation')?.value,
      amount: Number(get('pcf-ticket-adjust-amount')?.value),
    });
    updateManagementView();
    text('pcf-ticket-hint', count ? `Tarifas actualizadas en ${count} sector(es). Los encuentros cerrados no se modifican.`
      : 'No se han modificado tarifas. Comprueba la selección.');
  });

  get('pcf-training-prev')?.addEventListener('click', () => changeMonth(-1));
  get('pcf-training-next')?.addEventListener('click', () => changeMonth(1));
  get('pcf-training-mode')?.addEventListener('change', e => {
    setTrainingMode(GameState, e.target.value);
    updateManagementView();
  });
  get('pcf-training-days')?.addEventListener('click', e => {
    const button = e.target.closest('button[data-training-date]');
    if (!button) return;
    selectedTrainingDay = button.dataset.trainingDate;
    updateManagementView();
  });
  get('pcf-training-day-type')?.addEventListener('change', e => {
    if (!setTrainingDay(GameState, selectedTrainingDay, e.target.value)) {
      updateManagementView();
      return;
    }
    updateManagementView();
  });
  get('pcf-training-day-auto')?.addEventListener('click', () => {
    if (clearTrainingDay(GameState, selectedTrainingDay)) updateManagementView();
  });
  get('pcf-player-training-player')?.addEventListener('change', e => {
    selectedPlayer = e.target.value;
    updateManagementView();
  });
  get('pcf-player-training-focus')?.addEventListener('change', e => {
    if (setPlayerTrainingFocus(GameState, selectedPlayer, e.target.value)) updateManagementView();
  });
  get('btn-go-next-match')?.addEventListener('click', event => {
    if (getManagementStage(GameState) !== MANAGEMENT_STAGES.WEEK) return;
    event.preventDefault();
    event.stopPropagation();
    onContinue?.();
  });
}

function changeMonth(step) {
  const months = getSeasonTrainingMonths(GameState);
  if (!months.length) return;
  const index = months.indexOf(currentMonth);
  const next = Math.max(0, Math.min(months.length - 1, index + step));
  currentMonth = months[next];
  selectedTrainingDay = `${currentMonth}-01`;
  updateManagementView();
}

function updateTicketView(stage) {
  const upcoming = homeFixtures();
  const selector = get('pcf-ticket-fixture');
  const previous = selector?.value;
  if (selector) {
    selector.replaceChildren();
    for (const fx of upcoming) {
      const opponent = (GameState.clubs || []).find(c => String(c.id) === String(fx.awayClubId));
      selector.add(new Option(`${formatDate(fx.kickoffDate)} · ${opponent?.name || fx.awayClubId}${fx.meta?.ticketPriceLocked != null ? ' · CERRADO' : ''}`, String(fx.id)));
    }
    if (!upcoming.length) selector.add(new Option('Sin partidos en casa pendientes', ''));
    selector.disabled = !upcoming.length;
    if (upcoming.some(fx => String(fx.id) === previous)) selector.value = previous;
    else if (upcoming.length) selector.value = String(upcoming.find(fx => fx.meta?.ticketPriceLocked == null)?.id ?? upcoming[0].id);
  }
  const fx = selectedFixture();
  const locked = !fx || fx.meta?.ticketPriceLocked != null || stage === MANAGEMENT_STAGES.POST;
  const mode = get('pcf-ticket-mode');
  if (mode) { mode.value = GameState.management.ticketMode; mode.disabled = stage === MANAGEMENT_STAGES.POST; }
  const price = get('pcf-ticket-price');
  if (price) { price.value = fx ? String(getTicketPrice(GameState, fx)) : ''; price.disabled = locked; }
  const flat = get('pcf-ticket-flat-apply');
  if (flat) flat.disabled = locked;
  text('pcf-ticket-hint', !fx ? 'Las entradas solo se configuran para partidos como local.' : locked
    ? 'Venta de entradas cerrada para este encuentro. Puedes seleccionar otro posterior.'
    : 'Precios entre 5 y 250 €. Los ajustes manuales prevalecen sobre las recomendaciones automáticas.');

  const home = (GameState.clubs || []).find(c => String(c.id) === String(GameState.user?.clubId));
  const sectors = getStadiumSectors(GameState, fx);
  const prices = fx ? getTicketSectorPrices(GameState, fx) : {};
  const projection = fx ? getTicketSalesProjection(GameState, fx) : null;
  text('pcf-stadium-capacity', `${home?.stadium?.name || 'Estadio'} · ${number(projection?.capacity || sectors.reduce((sum, s) => sum + s.capacity, 0))} localidades`);

  for (const button of get('pcf-stadium-map')?.querySelectorAll('button[data-sector]') || []) {
    const sector = sectors.find(s => s.id === button.dataset.sector);
    if (!sector) continue;
    button.classList.toggle('is-selected', sector.id === selectedSector);
    button.textContent = `${sector.label.toUpperCase()}${fx ? ` · ${prices[sector.id]} €` : ''}`;
    button.setAttribute('aria-pressed', String(sector.id === selectedSector));
  }
  const list = get('pcf-ticket-sector-list');
  if (list) {
    list.replaceChildren();
    for (const s of sectors) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.sector = s.id;
      button.className = `pcf-sector-item${selectedSector === s.id ? ' is-selected' : ''}`;
      button.setAttribute('aria-pressed', String(selectedSector === s.id));
      const left = document.createElement('span');
      left.textContent = `${s.label} · ${number(s.capacity)} plazas`;
      const right = document.createElement('strong');
      right.textContent = fx ? euros(prices[s.id]) : '—';
      button.append(left, right);
      list.append(button);
    }
  }
  const sectorInput = get('pcf-ticket-sector-price');
  if (sectorInput) { sectorInput.value = fx ? String(prices[selectedSector]) : ''; sectorInput.disabled = locked; }
  const sectorSave = get('pcf-ticket-sector-apply');
  if (sectorSave) sectorSave.disabled = locked;
  const bulk = get('pcf-ticket-adjust-apply');
  if (bulk) bulk.disabled = locked;
  const forecast = get('pcf-ticket-forecast');
  if (forecast) {
    forecast.replaceChildren();
    if (projection) {
      const title = document.createElement('strong');
      title.textContent = 'Previsión orientativa';
      const totals = document.createElement('p');
      totals.textContent = `${number(projection.attendance)} espectadores / ${number(projection.capacity)} plazas · ${euros(projection.revenue)} de taquilla`;
      const selected = projection.breakdown.find(s => s.id === selectedSector);
      const detail = document.createElement('small');
      detail.textContent = `${selected.label}: ${number(selected.attendance)} entradas estimadas · ${euros(selected.revenue)}`;
      forecast.append(title, totals, detail);
    } else forecast.textContent = 'Selecciona un partido como local para ver la previsión.';
  }
}

function updateTrainingView(stage) {
  const months = getSeasonTrainingMonths(GameState);
  const todayMonth = GameState.currentTimeISO?.slice(0, 7);
  if (!months.includes(currentMonth)) currentMonth = months.includes(todayMonth) ? todayMonth : months[0];
  if (!selectedTrainingDay || !selectedTrainingDay.startsWith(currentMonth)) selectedTrainingDay = `${currentMonth}-01`;
  const monthIndex = months.indexOf(currentMonth);
  const prev = get('pcf-training-prev');
  const next = get('pcf-training-next');
  if (prev) prev.disabled = monthIndex <= 0;
  if (next) next.disabled = monthIndex >= months.length - 1;
  const mode = get('pcf-training-mode');
  if (mode) { mode.value = GameState.management.trainingMode; mode.disabled = stage === MANAGEMENT_STAGES.POST; }
  const [year, month] = currentMonth.split('-').map(Number);
  if (!year || !month) return;
  text('pcf-training-month', new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }));
  const calendar = get('pcf-training-days');
  if (calendar) {
    calendar.replaceChildren();
    for (const label of ['L', 'M', 'X', 'J', 'V', 'S', 'D']) {
      const name = document.createElement('span');
      name.className = 'pcf-training-calendar__weekday';
      name.textContent = label;
      calendar.appendChild(name);
    }
    const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    for (let i = 0; i < firstWeekday; i++) {
      const spacer = document.createElement('span');
      spacer.className = 'pcf-training-calendar__blank';
      calendar.appendChild(spacer);
    }
    const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= total; day++) {
      const iso = `${currentMonth}-${String(day).padStart(2, '0')}`;
      const planned = getTrainingDayPlan(GameState, iso);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.trainingDate = iso;
      button.dataset.type = planned.type;
      button.className = `pcf-training-calendar__day${iso === selectedTrainingDay ? ' is-selected' : ''}${planned.locked ? ' is-locked' : ''}`;
      button.setAttribute('aria-pressed', String(iso === selectedTrainingDay));
      button.title = `${formatDate(`${iso}T12:00:00Z`)} · ${TRAINING_TYPES[planned.type] || 'Partido'}${planned.source === 'manual' ? ' (personalizado)' : ''}`;
      const digit = document.createElement('strong'); digit.textContent = String(day);
      const tag = document.createElement('span'); tag.textContent = planned.type === 'match' ? 'Partido' : (TRAINING_TYPES[planned.type] || '').split(' ')[0];
      button.append(digit, tag);
      calendar.append(button);
    }
  }

  const plan = getTrainingDayPlan(GameState, selectedTrainingDay);
  const editable = !plan.locked && plan.type !== 'match';
  const match = getUserFixturesOnDay(GameState, selectedTrainingDay)[0];
  const opponentId = match && (String(match.homeClubId) === String(GameState.user?.clubId) ? match.awayClubId : match.homeClubId);
  const opponent = (GameState.clubs || []).find(c => String(c.id) === String(opponentId));
  text('pcf-training-title', formatDate(`${selectedTrainingDay}T12:00:00Z`));
  text('pcf-training-day-info', match ? `Partido: ${opponent?.name || opponentId}. No hay sesión de entrenamiento.`
    : plan.played ? 'Sesión ya aplicada a la plantilla.'
      : plan.locked ? 'Fecha cerrada: no se pueden modificar entrenamientos pasados.'
        : plan.source === 'manual' ? 'Planificación personalizada. El ajuste se conserva aunque actives el modo automático.'
          : plan.source === 'auto' ? 'Sesión propuesta según los partidos cercanos y el día de la semana.'
            : 'Planificación manual. Elige una sesión para este día.');
  const session = get('pcf-training-day-type');
  if (session) {
    session.replaceChildren();
    for (const [key, title] of Object.entries(TRAINING_TYPES)) session.add(new Option(title, key));
    if (plan.type === 'match') session.add(new Option('Partido (sin entrenamiento)', 'match'));
    session.value = plan.type;
    session.disabled = !editable;
  }
  const reset = get('pcf-training-day-auto');
  if (reset) { reset.disabled = !editable || plan.source !== 'manual'; reset.textContent = GameState.management.trainingMode === 'auto' ? 'Restaurar sugerencia automática' : 'Eliminar cambio manual'; }
  text('pcf-training-effect', TRAINING_EFFECTS[plan.type] || '');
  const players = (GameState.clubs || []).find(c => String(c.id) === String(GameState.user?.clubId))?.players || [];
  const average = field => players.length ? players.reduce((s, p) => s + Number(p[field] || 0), 0) / players.length : 0;
  text('pcf-training-squad-status', `Estado actual de plantilla · Condición: ${Math.round(average('fitness') * 100)} % · Fatiga: ${Math.round(average('fatigue'))}/100. Los efectos se aplican al avanzar al día del partido.`);
  const playerPicker = get('pcf-player-training-player');
  if (!players.some(p => String(p.id) === selectedPlayer)) selectedPlayer = String(players[0]?.id ?? '');
  if (playerPicker) {
    playerPicker.replaceChildren();
    for (const player of players) playerPicker.add(new Option(player.name || player.id, String(player.id)));
    if (selectedPlayer) playerPicker.value = selectedPlayer;
    playerPicker.disabled = !players.length;
  }
  const focusPicker = get('pcf-player-training-focus');
  if (focusPicker) {
    focusPicker.replaceChildren();
    for (const [key, label] of Object.entries(PLAYER_TRAINING_FOCUS)) focusPicker.add(new Option(label, key));
    focusPicker.value = GameState.management.playerTraining[selectedPlayer] || 'general';
    focusPicker.disabled = !players.length || stage === MANAGEMENT_STAGES.POST;
  }
  const individualCount = players.filter(p => GameState.management.playerTraining[String(p.id)]).length;
  text('pcf-player-training-status', `${individualCount} objetivo(s) individual(es) asignado(s). Se aplican de forma gradual con las sesiones futuras; los lesionados priorizan su recuperación.`);
}

export function updateManagementView() {
  if (!get('view-stadium') && !get('view-training')) return;
  ensureManagementState(GameState);
  const stage = getManagementStage(GameState);
  const next = getPendingUserFixtures(GameState)[0];
  const action = get('btn-go-next-match');
  if (get('view-stadium')) get('view-stadium').dataset.stage = stage;
  if (get('view-training')) get('view-training').dataset.stage = stage;
  text('pcf-ticket-status', stage === MANAGEMENT_STAGES.POST ? 'Postpartido' : 'Taquilla');
  text('pcf-ticket-description', stage === MANAGEMENT_STAGES.MATCHDAY
    ? 'La taquilla del partido de hoy está cerrada. Puedes preparar otros encuentros como local.'
    : 'Configura los precios por sector y consulta la previsión de asistencia e ingresos.');
  text('pcf-training-status', stage === MANAGEMENT_STAGES.POST ? 'Postpartido' : 'Toda la temporada');
  text('pcf-training-description', 'Planifica las sesiones mes a mes. Puedes dejar que el cuerpo técnico proponga el plan y personalizar cualquier día futuro.');
  if (action) {
    action.textContent = !next && stage !== MANAGEMENT_STAGES.POST ? 'TEMPORADA FINALIZADA'
      : stage === MANAGEMENT_STAGES.WEEK ? '▶ DÍA DEL PARTIDO'
        : stage === MANAGEMENT_STAGES.MATCHDAY ? '▶ JUGAR PARTIDO' : '▶ VER POSTPARTIDO';
    action.disabled = !next && stage !== MANAGEMENT_STAGES.POST;
    action.dataset.stage = stage;
  }
  updateTicketView(stage);
  updateTrainingView(stage);
}
