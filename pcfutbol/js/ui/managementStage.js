import { GameState } from '../state.js';
import { getStadiumStructure } from '../stadiums_2026_27.js';
import {
  MANAGEMENT_STAGES, TRAINING_TYPES, TICKET_SECTORS, PLAYER_TRAINING_FOCUS, TRAINED_ATTRIBUTES, ensureManagementState,
  getManagementStage, getPendingUserFixtures, getTicketPrice, getStadiumSectors,
  getTicketSectorPrices, getTicketSalesProjection, setTicketPrice, setTicketSectorPrice,
  adjustTicketSectorPrices, setTicketMode, getSeasonTrainingMonths, getTrainingDayPlan,
  getUserFixturesOnDay, setTrainingDay, clearTrainingDay, setTrainingMode, setPlayerTrainingFocus, getPlayerTrainingReport,
} from '../game/managementCycle.js?v=1660';

let initialized = false;
let currentMonth = '';
let selectedTrainingDay = '';
let selectedSector = 'tribuna';
let selectedPlayer = '';

const get = id => document.getElementById(id);
const text = (id, value) => { const el = get(id); if (el) el.textContent = value; };
const euros = value => `${Math.round(Number(value || 0)).toLocaleString('es-ES')} €`;
const number = value => Math.round(Number(value || 0)).toLocaleString('es-ES');
const decimal = (value, digits = 2) => Number(value || 0).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (value, digits = 2) => `${value > 0.00001 ? '+' : ''}${decimal(value, digits)}`;
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
  const structure = getStadiumStructure(home);
  const sectors = getStadiumSectors(GameState, fx);
  const prices = fx ? getTicketSectorPrices(GameState, fx) : {};
  const projection = fx ? getTicketSalesProjection(GameState, fx) : null;
  const stadiumCapacity = projection?.capacity || sectors.reduce((sum, s) => sum + s.capacity, 0);
  const tierCount = structure.levels?.length || 0;
  const facts = get('pcf-stadium-facts');
  if (facts) {
    facts.replaceChildren();
    const items = [
      ['Estadio', home?.stadium?.name || 'Por determinar'],
      ['Aforo disponible', `${number(stadiumCapacity)} localidades`],
      ['Origen del aforo', home?.stadium?.capacityStatus === 'official' ? 'Fuente oficial' :
        home?.stadium?.capacityStatus === 'provisional' ? 'Provisional' : 'Catálogo del juego'],
      ['Graderíos / niveles', tierCount ? `${tierCount} niveles${structure.amphitheaters ? ` · ${structure.amphitheaters} anfiteatros` : ''}` : 'Pendiente de verificar'],
      ['Distribución por zonas', structure.sectorCapacities ? 'Desglose del estadio' : 'Estimación proporcional'],
    ];
    if (structure.plannedCapacity && structure.plannedCapacity > stadiumCapacity) {
      items.splice(2, 0, ['Aforo final previsto', `${number(structure.plannedCapacity)} localidades`]);
    }
    for (const [label, value] of items) {
      const item = document.createElement('div'); item.className = 'pcf-stadium-facts__item';
      const name = document.createElement('span'); name.textContent = label;
      const count = document.createElement('strong'); count.textContent = value;
      item.append(name, count); facts.append(item);
    }
  }
  text('pcf-stadium-capacity', `${number(stadiumCapacity)} plazas disponibles · Selecciona una zona del plano para consultar sus graderíos.`);

  for (const button of get('pcf-stadium-map')?.querySelectorAll('button[data-sector]') || []) {
    const sector = sectors.find(s => s.id === button.dataset.sector);
    if (!sector) continue;
    button.classList.toggle('is-selected', sector.id === selectedSector);
    button.textContent = `${sector.label.toUpperCase()}${fx ? ` · ${prices[sector.id]} €` : ''}`;
    button.title = `${sector.label}: ${number(sector.capacity)} plazas (reparto ${sector.allocationStatus === 'documented' ? 'documentado' : 'estimado'})`;
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
      left.textContent = `${s.label} · ${number(s.capacity)} plazas${s.allocationStatus === 'estimated' ? ' aprox.' : ''}`;
      const right = document.createElement('strong');
      right.textContent = fx ? euros(prices[s.id]) : '—';
      button.append(left, right);
      list.append(button);
    }
  }
  const levels = get('pcf-stadium-levels');
  const activeSector = sectors.find(s => s.id === selectedSector);
  if (levels) {
    levels.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = activeSector ? `${activeSector.label} · ${number(activeSector.capacity)} localidades` : 'Graderíos';
    levels.append(heading);
    if (activeSector?.id === 'vip') {
      const message = document.createElement('p');
      message.textContent = 'Zona comercial VIP. Los palcos se distribuyen por el recinto; no constituyen un anfiteatro independiente.';
      levels.append(message);
    } else if (activeSector?.levels?.length) {
      const wrapper = document.createElement('div'); wrapper.className = 'pcf-stadium-levels__grid';
      for (const tier of activeSector.levels) {
        const item = document.createElement('div'); item.className = 'pcf-stadium-levels__item';
        const label = document.createElement('span'); label.textContent = tier.name;
        const count = document.createElement('strong'); count.textContent = `${number(tier.capacity)} aprox.`;
        item.append(label, count); wrapper.append(item);
      }
      levels.append(wrapper);
    } else {
      const message = document.createElement('p');
      message.textContent = 'No se ha documentado todavía cuántas alturas tiene esta zona; se mantiene el precio y el aforo comercial estimado.';
      levels.append(message);
    }
  }
  const source = get('pcf-stadium-source');
  if (source) {
    source.replaceChildren();
    const note = document.createElement('span');
    note.textContent = `${structure.note ? `${structure.note} ` : ''}Los aforos por zona y nivel son estimaciones del juego, no cifras oficiales. `;
    source.append(note);
    if (structure.structureSource || structure.source) {
      for (const [url, label] of [[structure.source, 'Fuente del aforo'], [structure.structureSource, 'Fuente de las gradas']]) {
        if (!url) continue;
        const link = document.createElement('a');
        link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = label;
        source.append(' · ', link);
      }
    } else {
      const pending = document.createElement('span');
      pending.textContent = 'Estructura pendiente de contrastar.';
      source.append(pending);
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
      detail.textContent = `${selected?.label || 'Zona'}: ${number(selected?.attendance)} entradas estimadas · ${euros(selected?.revenue)}`;
      forecast.append(title, totals, detail);
    } else forecast.textContent = 'Selecciona un partido como local para ver la previsión.';
  }
}

function renderPlayerTrainingReport() {
  const report = getPlayerTrainingReport(GameState, selectedPlayer);
  const summary = get('pcf-training-player-summary');
  const attributes = get('pcf-training-player-attributes');
  const history = get('pcf-training-player-history');
  if (!summary || !attributes || !history) return;
  summary.replaceChildren();
  attributes.replaceChildren();
  history.replaceChildren();
  if (!report) { text('pcf-training-player-progress', 'Selecciona un jugador para consultar su evolución.'); return; }

  const metric = (label, value, extra) => {
    const card = document.createElement('div'); card.className = 'pcf-training-evolution__metric';
    const name = document.createElement('span'); name.textContent = label;
    const amount = document.createElement('strong'); amount.textContent = value;
    const change = document.createElement('small'); change.textContent = extra;
    card.append(name, amount, change);
    summary.append(card);
  };
  const { current, totals } = report;
  metric('Media global', number(current.overall), `${signed(totals.overall, 0)} por entrenamientos`);
  metric('Condición física', `${number(current.fitness * 100)} %`, `${signed(totals.fitness * 100, 1)} puntos por entrenamientos`);
  metric('Fatiga', `${number(current.fatigue)} / 100`, `${signed(totals.fatigue, 1)} puntos por entrenamientos`);
  metric('Forma', signed(current.form), `${signed(totals.form)} por entrenamientos`);
  const remaining = Math.max(0, 3.5 - Math.max(0, report.development.points));
  text('pcf-training-player-progress', `${totals.sessions} sesiones registradas · ${decimal(report.development.points)} / 3,50 puntos de desarrollo hacia la próxima mejora de media global (${decimal(remaining)} restantes). Máximo de 3 puntos de media por temporada.${report.injured ? ' Jugador lesionado: se prioriza la recuperación.' : ''}`);

  for (const attr of TRAINED_ATTRIBUTES) {
    const row = document.createElement('div'); row.className = 'pcf-training-evolution__attribute';
    const label = document.createElement('span'); label.textContent = attr.label;
    const bar = document.createElement('div'); bar.className = 'pcf-training-evolution__bar';
    const fill = document.createElement('span'); fill.className = 'pcf-training-evolution__fill';
    const value = Number(current.attributes[attr.key] || 0);
    fill.style.width = `${Math.max(0, Math.min(100, value / 99 * 100))}%`;
    bar.append(fill);
    const readout = document.createElement('strong');
    readout.textContent = decimal(value);
    const delta = document.createElement('small'); delta.className = 'pcf-training-evolution__gain';
    delta.textContent = ` (${signed(totals.attributes[attr.key])})`;
    readout.append(delta);
    row.append(label, bar, readout);
    attributes.append(row);
  }
  if (!report.recent.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Aún no hay sesiones aplicadas. Verás los cambios al avanzar al próximo día de partido.';
    history.append(empty);
    return;
  }
  for (const entry of report.recent) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${formatDate(`${entry.day}T12:00:00Z`)} · ${TRAINING_TYPES[entry.type] || entry.type}`;
    const details = document.createElement('span');
    const gains = TRAINED_ATTRIBUTES.filter(attr => (entry.gains?.[attr.key] || 0) > 0)
      .map(attr => `${attr.label} +${decimal(entry.gains[attr.key])}`);
    details.textContent = `${entry.injured ? 'Lesionado · recuperación prioritaria. ' : ''}Condición ${signed(entry.changes.fitness * 100, 1)} pp · Fatiga ${signed(entry.changes.fatigue, 1)}${gains.length ? ` · ${gains.join(' · ')}` : ''}${entry.changes.overall > 0 ? ' · ¡Subió la media global!' : ''}`;
    item.append(title, details);
    history.append(item);
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
  renderPlayerTrainingReport();
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
