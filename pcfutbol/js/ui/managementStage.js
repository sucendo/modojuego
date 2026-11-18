import { GameState } from '../state.js';
import {
  MANAGEMENT_STAGES, TRAINING_TYPES, ensureManagementState,
  getManagementStage, getPendingUserFixtures, getTicketPrice,
  getTrainingDaysToPlan, setTicketPrice, setTrainingDay,
} from '../game/managementCycle.js';

let initialized = false;

const get = (id) => document.getElementById(id);
const text = (id, value) => { const el = get(id); if (el) el.textContent = value; };
const formatDate = (iso) => new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short', timeZone:'UTC' });

export function initManagementUI({ onContinue } = {}) {
  if (initialized) return;
  initialized = true;

  get('pcf-ticket-fixture')?.addEventListener('change', updateManagementView);
  get('pcf-ticket-price')?.addEventListener('change', (event) => {
    const fx = getPendingUserFixtures(GameState).find(f => String(f.id) === String(get('pcf-ticket-fixture')?.value));
    const ok = setTicketPrice(GameState, fx, event.target.value);
    if (!ok) text('pcf-ticket-hint', 'Precio no válido o entradas ya cerradas (entre 5 y 250 €).');
    else updateManagementView();
  });

  get('pcf-training-days')?.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-training-day]');
    if (!select) return;
    if (!setTrainingDay(GameState, select.dataset.trainingDay, select.value)) {
      updateManagementView();
    }
  });

  get('btn-go-next-match')?.addEventListener('click', (event) => {
    if (getManagementStage(GameState) !== MANAGEMENT_STAGES.WEEK) return;
    event.preventDefault();
    event.stopPropagation();
    onContinue?.();
  });
}

export function updateManagementView() {
  const panel = get('pcf-management-panel');
  if (!panel) return;
  ensureManagementState(GameState);
  const stage = getManagementStage(GameState);
  const upcoming = getPendingUserFixtures(GameState);
  const next = upcoming[0] || null;
  const action = get('btn-go-next-match');

  panel.dataset.stage = stage;
  const titles = {
    [MANAGEMENT_STAGES.WEEK]: 'Gestión semanal · Día después del partido',
    [MANAGEMENT_STAGES.MATCHDAY]: 'Día del partido · Últimos preparativos',
    [MANAGEMENT_STAGES.POST]: 'Partido finalizado · Informe pendiente',
  };
  text('pcf-management-title', titles[stage]);
  text('pcf-management-status', stage === MANAGEMENT_STAGES.WEEK ? 'Antes de entrenar' : stage === MANAGEMENT_STAGES.MATCHDAY ? 'Entradas cerradas hoy' : 'Finalizado');
  text('pcf-management-description', stage === MANAGEMENT_STAGES.WEEK
    ? 'Organiza el club y los entrenamientos hasta el próximo encuentro. El tiempo avanzará cuando pulses Continuar.'
    : stage === MANAGEMENT_STAGES.MATCHDAY
      ? 'Revisa la alineación y la táctica. Ya no puedes cambiar las entradas de hoy; sí las de futuros partidos y sus entrenamientos.'
      : 'Consulta el resultado, la cronología y el estado físico antes de continuar al día siguiente.');

  if (action) {
    action.textContent = !next && stage !== MANAGEMENT_STAGES.POST ? 'TEMPORADA FINALIZADA'
      : stage === MANAGEMENT_STAGES.WEEK ? '▶ DÍA DEL PARTIDO'
        : stage === MANAGEMENT_STAGES.MATCHDAY ? '▶ JUGAR PARTIDO' : '▶ VER POSTPARTIDO';
    action.disabled = !next && stage !== MANAGEMENT_STAGES.POST;
    action.dataset.stage = stage;
  }

  const fixtureSelect = get('pcf-ticket-fixture');
  const priceInput = get('pcf-ticket-price');
  const previousSelection = fixtureSelect?.value;
  const homeFixtures = upcoming.filter(f => String(f.homeClubId) === String(GameState.user?.clubId));
  if (fixtureSelect) {
    fixtureSelect.replaceChildren();
    if (!homeFixtures.length) {
      const option = new Option('Sin partidos en casa pendientes', '');
      fixtureSelect.add(option);
      fixtureSelect.disabled = true;
    } else {
      for (const f of homeFixtures) {
        const opponent = (GameState.clubs || []).find(c => String(c.id) === String(f.awayClubId));
        const frozen = f.meta?.ticketPriceLocked != null;
        fixtureSelect.add(new Option(`${formatDate(f.kickoffDate)} · ${opponent?.name || f.awayClubId}${frozen ? ' · CERRADO' : ''}`, String(f.id)));
      }
      fixtureSelect.disabled = false;
      if (homeFixtures.some(f => String(f.id) === previousSelection)) fixtureSelect.value = previousSelection;
      else fixtureSelect.value = String(homeFixtures.find(f => f.meta?.ticketPriceLocked == null)?.id ?? homeFixtures[0].id);
    }
  }
  const selected = homeFixtures.find(f => String(f.id) === String(fixtureSelect?.value));
  const locked = !selected || selected.meta?.ticketPriceLocked != null || stage === MANAGEMENT_STAGES.POST;
  if (priceInput) {
    priceInput.value = selected ? String(getTicketPrice(GameState, selected)) : '';
    priceInput.disabled = locked;
  }
  text('pcf-ticket-hint', !selected ? 'Las entradas se configuran cuando juegas como local.'
    : locked ? 'Precio cerrado para este encuentro. Puedes elegir otro partido futuro.'
      : 'El precio se bloqueará al llegar el día del partido. Una tarifa más alta puede reducir la asistencia.');

  const training = get('pcf-training-days');
  if (training) {
    training.replaceChildren();
    const days = stage === MANAGEMENT_STAGES.POST ? [] : getTrainingDaysToPlan(GameState);
    text('pcf-training-title', stage === MANAGEMENT_STAGES.MATCHDAY ? 'Planificar próximos entrenamientos' : 'Entrenamientos hasta el próximo partido');
    if (!days.length) {
      const p = document.createElement('p');
      p.className = 'pcf-management__hint';
      p.textContent = stage === MANAGEMENT_STAGES.POST ? 'Disponible al continuar.' : 'Sin sesiones previstas en este intervalo.';
      training.appendChild(p);
    }
    for (const day of days) {
      const row = document.createElement('label');
      row.className = 'pcf-management__day';
      const name = document.createElement('span');
      name.textContent = new Date(`${day}T12:00:00Z`).toLocaleDateString('es-ES', { weekday:'short', day:'2-digit', month:'short', timeZone:'UTC' });
      const select = document.createElement('select');
      select.dataset.trainingDay = day;
      for (const [type, title] of Object.entries(TRAINING_TYPES)) select.add(new Option(title, type));
      select.value = GameState.management.trainingDays[day] || 'balanced';
      row.append(name, select);
      training.appendChild(row);
    }
  }
}
