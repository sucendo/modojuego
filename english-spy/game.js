/* Where Is Evelyn Blackwood? — Operación Madrid, primer episodio jugable.
   Motor de escenas y contenidos independiente de la maquetación. */
(() => {
  'use strict';

  const SAVE_KEY = 'evelyn-blackwood-madrid-v01';
  const REQUIRED = ['MAD-E01', 'MAD-E02', 'MAD-E03', 'MAD-E04', 'MAD-E05'];
  const BOARD_LINKS = {
    timeline: { clues: ['MAD-E02', 'MAD-E03'], title: 'An uncertain timeline', es: 'Carmen vio salir a una mujer antes de que se imprimiera el recibo. No sabemos si ambas pistas pertenecen a la misma persona.' },
    destination: { clues: ['MAD-E04', 'MAD-E05'], title: 'The Lealtad connection', es: 'La etiqueta de la llave y el mensaje reconstruido apuntan a Plaza de la Lealtad. Es una dirección que merece ser investigada.' },
  };
  const ITEMS = {
    receipt: { icon: '⌁', title: 'Folded receipt', es: 'Recibo doblado', text: 'Printed at 18:36. A note on the back warns you about the first ticket.' },
    napkin: { icon: '▤', title: 'Torn napkin', es: 'Servilleta rasgada', text: 'A fragment of handwriting: “LEA…” The edge looks like it fits another scrap.' },
    key: { icon: '⚿', title: 'Brass key', es: 'Llave de latón', text: 'Its metal tag reads “Plaza de la Lealtad”.' },
    joined: { icon: '✉', title: 'Reconstructed message', es: 'Mensaje reconstruido', text: 'The two torn fragments reveal “LEALTAD — 19:10”. A time and a location, not a confession.' },
  };
  const LEVELS = {
    starter: { title: 'Young Agent', range: 'Pre-A1', note: 'Palabras, colores y objetos', spanish: true },
    basic: { title: 'Junior Agent', range: 'A1–A2', note: 'Frases, lugares y preguntas', spanish: true },
    intermediate: { title: 'Field Agent', range: 'B1', note: 'Testimonios y pasado', spanish: false },
    advanced: { title: 'Special Agent', range: 'B2+', note: 'Deducción y matices', spanish: false },
  };

  const EVIDENCE = {
    'MAD-E01': { icon: '✉', name: 'Encrypted invitation', es: 'Invitación cifrada de Evelyn', detail: 'Evelyn asked for an urgent meeting at 18:40 opposite the Royal Palace.', detailEs: 'Evelyn solicitó una cita urgente a las 18:40 frente al Palacio Real.' },
    'MAD-E02': { icon: '⌁', name: 'Folded café receipt', es: 'Recibo doblado del café', detail: 'Printed at 18:36. The receipt says: “Don’t follow the first ticket. Ask where the key was left.”', detailEs: 'El recibo, impreso a las 18:36, advierte de un billete engañoso y menciona una llave.' },
    'MAD-E03': { icon: '◉', name: 'Carmen’s statement', es: 'Declaración de Carmen', detail: 'Before 18:30, a woman resembling Evelyn received a phone call and left. Carmen did not confirm her identity.', detailEs: 'Antes de las 18:30, una mujer parecida a Evelyn recibió una llamada y se fue. Carmen no comprobó su identidad.' },
    'MAD-E04': { icon: '⚿', name: 'Brass key and tag', es: 'Llave de latón con etiqueta', detail: 'A key was hidden under the table. The tag reads “Plaza de la Lealtad”.', detailEs: 'Una llave escondida bajo la mesa tiene una etiqueta con la dirección Plaza de la Lealtad.' },
    'MAD-E05': { icon: '▤', name: 'Reconstructed paper message', es: 'Mensaje reconstruido', detail: 'Combining a torn napkin with the receipt reveals: “LEALTAD — 19:10”.', detailEs: 'Al unir una servilleta rasgada con el recibo aparece: «LEALTAD — 19:10».' },
  };

  const SCENES = {
    terrace: {
      title: 'Café de Oriente · Terrace', subtitle: 'Plaza de Oriente, Madrid · 18:47',
      image: './assets/cafe-terrace.webp',
      hotspots: [
        { id: 'receipt', title: 'Folded receipt', icon: '⌁', x: 70.3, y: 79.3, clue: 'MAD-E02' },
        { id: 'table', title: 'The meeting table', icon: '⌕', x: 60.6, y: 84, clue: 'MAD-E04' },
        { id: 'cup', title: 'Coffee cup & saucer', icon: '☕', x: 68.7, y: 72.2 },
        { id: 'palace', title: 'Royal Palace', icon: '◈', x: 36, y: 34.5 },
        { id: 'clock', title: 'The street lamp', icon: '✦', x: 13, y: 30 },
        { id: 'door', title: 'Enter the café', icon: '➜', x: 88.6, y: 39.2, go: 'interior' },
      ],
    },
    interior: {
      title: 'Café de Oriente · Salon', subtitle: 'Plaza de Oriente, Madrid · 18:52',
      image: './assets/cafe-interior.webp',
      hotspots: [
        { id: 'carmen', title: 'Speak with Carmen', icon: '◉', x: 13.3, y: 60.3, clue: 'MAD-E03' },
        { id: 'menu', title: 'Restaurant menu', icon: '≡', x: 54.4, y: 57.5 },
        { id: 'coat', title: 'Coat by the door', icon: '⌕', x: 25.7, y: 37.5 },
        { id: 'salon', title: 'Guest table', icon: '⌕', x: 61.2, y: 78.5 },
        { id: 'window', title: 'View of the plaza', icon: '◈', x: 72.4, y: 34.1 },
        { id: 'exit', title: 'Return to the terrace', icon: '↩', x: 86.6, y: 47.8, go: 'terrace' },
      ],
    },
  };

  const OBJECTS = {
    receipt: {
      title: 'A folded receipt', es: 'Un recibo doblado',
      text: 'There is a short handwritten message on the back. Some words have been underlined.',
      textEs: 'Hay un mensaje escrito a mano en el reverso. Algunas palabras están subrayadas.',
      challenge: 'receipt', clue: 'MAD-E02',
    },
    table: {
      title: 'The empty meeting table', es: 'La mesa de la cita',
      text: 'One chair is empty. Someone moved it recently. Could there be something under the table?',
      textEs: 'Hay una silla vacía que alguien ha movido. ¿Podría haber algo debajo de la mesa?',
      challenge: 'key', clue: 'MAD-E04', needs: 'MAD-E02',
    },
    cup: { title: 'An unfinished coffee', es: 'Un café sin terminar', text: 'The cup is still here. There is a torn paper napkin under the saucer. The handwriting may be important.', textEs: 'La taza sigue aquí. Debajo del platillo hay una servilleta rasgada con una inscripción que podría ser importante.', item: 'napkin' },
    palace: { title: 'Royal Palace of Madrid', es: 'Palacio Real de Madrid', text: 'The Palace stands across the Plaza de Oriente. This is the landmark Evelyn used to identify the meeting place.', textEs: 'El Palacio Real está frente a la Plaza de Oriente. Evelyn lo utilizó como referencia de la cita.' },
    clock: { title: 'The evening lights', es: 'Las luces de la plaza', text: 'The lamps are already on. Your meeting was at 18:40. Evelyn is not here.', textEs: 'Las farolas están encendidas. La cita era a las 18:40 y Evelyn no aparece.' },
    carmen: { title: 'Carmen Soler · Café staff', es: 'Carmen Soler · Empleada del café', text: '“Good evening. Are you looking for someone? A British woman was here earlier. Then her phone rang…”', textEs: '«Buenas tardes. ¿Busca a alguien? Antes había aquí una mujer británica. Entonces sonó su teléfono…»', dialogue: true, clue: 'MAD-E03' },
    menu: { title: 'The restaurant menu', es: 'La carta del restaurante', text: 'Coffee, tea, juice… There are lots of English words you can practise here.', textEs: 'Coffee (café), tea (té), juice (zumo). Puedes escuchar cómo suenan.', speech: 'Coffee. Tea. Orange juice. A cup. A glass. A table.' },
    coat: { title: 'A coat near reception', es: 'Un abrigo junto a recepción', text: 'It belongs to a guest who is still inside. Not every object is a clue in this investigation.', textEs: 'Pertenece a otro cliente. No todos los objetos forman parte del misterio.' },
    salon: { title: 'A quiet table', es: 'Una mesa tranquila', text: 'The table has been prepared for dinner. It does not match the place described in Evelyn’s message.', textEs: 'La mesa está preparada para cenar y no coincide con el lugar indicado por Evelyn.' },
    window: { title: 'A view across the plaza', es: 'Vistas de la plaza', text: 'From here you can see the terrace and part of the Royal Palace. The café has more than one entrance.', textEs: 'Desde aquí se ve la terraza y parte del Palacio Real. El café tiene varios accesos.' },
  };

  const CHALLENGES = {
    receipt: {
      starter: { question: 'Find the word that means «llave».', options: ['KEY', 'APPLE', 'BLUE'], answer: 0, help: 'La pista menciona un objeto con el que abrimos puertas.', speech: 'Key. Apple. Blue.' },
      basic: { question: 'What does “under the table” mean?', options: ['Encima de la mesa', 'Debajo de la mesa', 'Detrás de la puerta'], answer: 1, help: 'Under = debajo de.', speech: 'Under the table.' },
      intermediate: { question: 'The note says “Don’t follow the first ticket.” What is the best interpretation?', options: ['Every ticket is authentic.', 'The first travel clue may be misleading.', 'Evelyn took a train to London.'], answer: 1, help: 'No sabemos si el primer itinerario es verdadero.', speech: 'Don’t follow the first ticket. Ask where the key was left.' },
      advanced: { question: 'Which inference is warranted by the note?', options: ['Evelyn must have written it.', 'The first ticket has definitely been forged.', 'Someone wanted the reader to question an apparent travel clue.'], answer: 2, help: 'Una advertencia no prueba ni la identidad del autor ni la falsificación.', speech: 'Don’t follow the first ticket. Ask where the key was left.' },
    },
    witness: {
      starter: { question: 'Carmen says: “She ordered coffee.” What did she order?', options: ['Coffee ☕', 'Water 💧', 'Juice 🍊'], answer: 0, help: 'Coffee significa café.', speech: 'She ordered coffee.' },
      basic: { question: 'What happened after the woman received a phone call?', options: ['She left the café.', 'She went to sleep.', 'She ordered another dinner.'], answer: 0, help: 'Left es el pasado de leave: marcharse.', speech: 'She received a phone call and left the café.' },
      intermediate: { question: 'Put the events in the most likely order.', options: ['The woman left, ordered coffee, then called.', 'She ordered coffee, received a call, and left.', 'She left, returned, and ordered coffee.'], answer: 1, help: 'Presta atención a los tiempos y conectores.', speech: 'She ordered coffee. Then she received a call and left.' },
      advanced: { question: 'Which statement is supported by Carmen’s testimony?', options: ['Evelyn was certainly abducted.', 'A woman resembling Evelyn left after a call, but her identity remains unverified.', 'The caller worked for the CNI.'], answer: 1, help: 'Distingue observación de suposición.', speech: 'A woman matching her description left after receiving a call. I did not ask her name.' },
    },
    key: {
      starter: { question: 'Where should we look for the key?', options: ['Under the table', 'Above the Palace', 'Inside the lamp'], answer: 0, help: 'Under significa debajo de.', speech: 'Look under the table.' },
      basic: { question: 'Complete the instruction: “Look ___ the table.”', options: ['on', 'under', 'between'], answer: 1, help: 'La llave está debajo de la mesa.', speech: 'Look under the table.' },
      intermediate: { question: 'You find a key with a tag reading “Plaza de la Lealtad”. What should you do?', options: ['Ignore it; it is not a train ticket.', 'Cross-reference the address with known locations.', 'Assume Evelyn is at the airport.'], answer: 1, help: 'Primero hay que contrastar la dirección.', speech: 'A brass key. Plaza de la Lealtad.' },
      advanced: { question: 'Which conclusion best respects the evidence?', options: ['The key proves Evelyn stayed at the Ritz.', 'The key suggests a place to investigate, but possession and use are unconfirmed.', 'The key confirms the CIA staged the disappearance.'], answer: 1, help: 'Una pista puede justificar una visita sin demostrar una hipótesis.', speech: 'The tag reads Plaza de la Lealtad. It identifies a place, not a person.' },
    },
  };

  const CARMEN_TOPICS = {
    time: { question: 'When did she leave?', answer: 'Before half past six, I think. She left in a hurry after receiving a call.', answerEasy: 'She left before six thirty. She had a phone call.', es: 'Cree que salió antes de las 18:30, después de recibir una llamada.' },
    phone: { question: 'Did you hear the call?', answer: 'No. She stepped away from the table and lowered her voice. She sounded worried, but I could not hear the words.', answerEasy: 'No. She spoke very quietly.', es: 'No escuchó las palabras de la llamada. La mujer habló en voz baja y parecía preocupada.' },
    identity: { question: 'Are you sure it was Evelyn?', answer: 'I recognised the coat from your description, but I never asked for a name or checked any documents.', answerEasy: 'I did not ask her name. I only saw her coat.', es: 'Nunca comprobó la identidad de aquella mujer. Solo reconoce su abrigo.' },
    company: { question: 'Was she alone?', answer: 'She arrived alone. Later a man in a grey jacket stood near the entrance, but I cannot say whether they knew each other.', answerEasy: 'She came alone. A man was near the door.', es: 'Llegó sola. Había un hombre con chaqueta gris junto a la entrada, sin vínculo confirmado.' },
  };

  const defaults = () => ({ agents: [], selectedAgent: null, saves: {}, settings: { help: true, sound: true } });
  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!stored || !Array.isArray(stored.agents)) return defaults();
      return { ...defaults(), ...stored, settings: { ...defaults().settings, ...(stored.settings || {}) } };
    } catch { return defaults(); }
  }
  const db = load();
  const ui = { view: 'menu', side: 'case', inspected: null, modal: null, levelPick: 'starter', lastError: '', selectedItem: null, boardFirst: null };
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(db)); } catch {} }
  function newSave() { return { scene: 'hq', evidence: ['MAD-E01'], xp: 0, ritzUnlocked: false, caseDone: false, items: [], links: [], asked: [], lastAction: null }; }
  function agent() { return db.agents.find(a => a.id === db.selectedAgent) || null; }
  function save() { return db.saves[db.selectedAgent] || null; }
  function ensureSave() {
    if (db.selectedAgent && !db.saves[db.selectedAgent]) db.saves[db.selectedAgent] = newSave();
    const s = save();
    if (s) {
      s.items ||= []; s.links ||= []; s.asked ||= [];
      // Compatible with the original v0.1 saves and their already collected clues.
      if (s.evidence.includes('MAD-E02') && !s.items.includes('receipt')) s.items.push('receipt');
      if (s.evidence.includes('MAD-E04') && !s.items.includes('key')) s.items.push('key');
      if (s.ritzUnlocked && !s.links.includes('destination')) s.links.push('destination');
    }
    return s;
  }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function helpOn() { return db.settings.help; }
  function helped(text) { return helpOn() && text ? `<p class="question-help">${esc(text)}</p>` : ''; }
  function hasEvidence(id) { return Boolean(save()?.evidence.includes(id)); }
  function evidenceCount() { return REQUIRED.filter(hasEvidence).length; }
  function hasItem(id) { return Boolean(save()?.items?.includes(id)); }
  function addItem(id) { if (!ITEMS[id] || hasItem(id)) return false; save().items.push(id); persist(); return true; }
  function boardComplete() { return Object.keys(BOARD_LINKS).every(id => save()?.links?.includes(id)); }
  function notify(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3400); }
  function badge(text, cls='') { return `<span class="pill ${cls}">${esc(text)}</span>`; }
  function speak(text) {
    if (!db.settings.sound) { notify('El audio está desactivado. Actívalo desde las opciones.'); return; }
    if (!('speechSynthesis' in window)) { notify('Este navegador no ofrece lectura en voz alta.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB'; utterance.rate = agent()?.level === 'starter' ? .76 : .9; utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => /en-GB/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
    window.speechSynthesis.speak(utterance);
  }

  function header({ game=false } = {}) {
    return `<header class="topbar ${game?'game-topbar':''}">
      <div class="brand"><div class="brand-emblem" aria-hidden="true"><span>✦</span></div><div class="brand-copy"><strong>W·E·B / INTELLIGENCE</strong><small>WHERE IS EVELYN BLACKWOOD?</small></div></div>
      <div class="top-actions">${game ? badge(`AGENT ${agent()?.name||''}`, 'warm') + badge(`${save()?.xp||0} XP`) : badge('OPERACIÓN MADRID · 0.2', 'warm')}
      <button class="btn btn-sm btn-ghost" data-action="toggle-help" title="Activar o desactivar ayuda en español">${helpOn() ? 'ES · Ayuda ✓' : 'ES · Ayuda'}</button>
      ${game ? '<button class="btn btn-sm btn-ghost" data-action="home">Menú</button>' : ''}</div>
    </header>`;
  }

  function renderMenu() {
    const active = agent(), progressed = Boolean(active && save());
    return `<div class="app-shell">${header()}<main class="menu">
      <section class="menu-art" aria-label="Ilustración de la terraza del Café de Oriente en Madrid"><div class="menu-art-content"><div class="stamp">TOP SECRET · MADRID</div><h1>Where Is<br/><em>Evelyn</em><br/>Blackwood?</h1><p>An English Spy Adventure · Primer episodio</p></div></section>
      <section class="menu-side"><div class="kicker">CONFIDENTIAL // FILE EB–001</div><h2>One missing agent.<br/><span class="gold">A thousand questions.</span></h2><p>Tu contacto del MI6 no ha acudido a una cita urgente en Madrid. Investiga escenarios reales, escucha testimonios en inglés y descubre por qué ha desaparecido.</p>
      <div class="menu-summary"><div class="eyebrow">Tu misión comienza en</div><strong>Café de Oriente · Plaza de Oriente · Madrid</strong><p class="small">Investiga a tu ritmo. El inglés es tu herramienta para resolver el misterio.</p></div>
      <button class="btn btn-primary btn-wide" data-action="profiles">${progressed?'▶ Continuar investigación':'✦ Comenzar como agente'}</button>
      <button class="btn btn-wide btn-ghost" data-action="profiles">${progressed?'Cambiar de agente / Nueva partida':'Crear perfil de agente'}</button>
      <p class="version-foot">Versión 0.2 · Investigación interactiva · Escenarios artísticos</p></section></main></div>`;
  }

  function renderProfiles() {
    const cards = db.agents.map(a => {
      const s = db.saves[a.id];
      const pct = s ? (REQUIRED.filter(x => s.evidence.includes(x)).length / REQUIRED.length) * 100 : 0;
      return `<button class="profile-card ${db.selectedAgent===a.id?'active':''}" data-action="select-agent" data-id="${esc(a.id)}"><span class="avatar">${esc(a.symbol)}</span><strong>${esc(a.name)}</strong><small>${esc(LEVELS[a.level].title)} · ${esc(LEVELS[a.level].range)}</small><small>${s?`${s.xp} XP · ${Math.round(pct)}% del primer caso`:'Nuevo expediente'}</small><div class="progressbar"><span style="width:${pct}%"></span></div></button>`;
    }).join('');
    return `<div class="app-shell">${header()}<main class="profiles-view"><div class="profiles-head"><div><div class="kicker">ACCESO RESTRINGIDO · IDENTIDAD</div><h1>Choose your agent.</h1><p class="muted">Cada agente conserva su nivel y progreso de manera independiente en este navegador.</p></div><button class="btn btn-ghost" data-action="home">← Volver</button></div><div class="profiles-grid">${cards}<button class="profile-card new-profile" data-action="new-agent"><span style="font-size:2.3rem;color:var(--gold)">＋</span><strong>Crear nuevo agente</strong><small>Un expediente de investigación independiente</small></button></div></main></div>`;
  }

  function renderHQ() {
    const a = agent();
    return `<div class="app-shell">${header({game:true})}<main class="hq-shell"><div class="hq-heading"><div class="kicker">CENTRO DE OPERACIONES · MADRID</div><h1>Welcome, <span class="gold">${esc(a?.name)}.</span></h1><p class="muted">Servicio de enlace internacional · Unidad ficticia de investigación</p></div>
      <div class="hq-columns"><section class="hq-card"><div class="eyebrow">INCOMING / PRIORITY: URGENT</div><h2>One encrypted message.</h2><div class="classified"><div class="small">FROM: E. BLACKWOOD · MI6 LIAISON<br/>TO: ${esc(a?.name)} · MADRID<br/>STATUS: ENCRYPTED / VERIFIED KEY</div><h3>Dear Agent,</h3><p>We need to talk. Tonight. <strong>18:40.</strong><br/>The café facing the <strong>Royal Palace</strong>.<br/>Come alone. I have the documents.</p><p style="font-style:italic">If I don't show up, follow the clues.</p><p>— Evelyn</p></div>${helpOn()?'<p class="small muted" style="margin-top:20px">Ayuda: Evelyn necesita entregarnos unos documentos. Nos cita a las 18:40 en una cafetería frente al Palacio Real. Si no aparece, debemos seguir las pistas.</p>':''}<div class="action-row" style="margin-top:20px"><button class="btn" data-action="speak" data-text="${encodeURIComponent('We need to talk. Tonight. Six forty P M. The café facing the Royal Palace. Come alone. I have the documents. If I do not show up, follow the clues.')}">▶ Listen to Evelyn's message</button><button class="btn btn-primary" data-action="travel-terrace">Start investigation →</button></div></section>
      <aside class="hq-card"><div class="eyebrow">CASE STATUS</div><h2>Operation Madrid</h2><div class="hq-stat"><div><strong>${save()?.xp||0}</strong><span>Experience</span></div><div><strong>${evidenceCount()}/${REQUIRED.length}</strong><span>Evidence</span></div><div><strong>${esc(LEVELS[a?.level].range)}</strong><span>English</span></div></div><div class="hq-map"><div class="map-line"></div><span class="map-dot" style="left:29%;top:53%"></span><span class="map-tag" style="left:31%;top:47%">Café de Oriente</span><span class="map-dot locked" style="left:65%;top:72%"></span><span class="map-tag locked" style="left:67%;top:65%">Ritz · ${save()?.ritzUnlocked?'Rastro encontrado':'Bloqueado'}</span></div><div class="case-brief"><h4>Mission objective</h4><p>Find out why Evelyn missed your meeting. Examine the café, gather objects, interview witnesses and link evidence on your board.</p></div><div class="side-actions"><button class="btn btn-ghost" data-action="open-notebook">Expediente</button><button class="btn btn-ghost" data-action="show-map">Mapa</button></div></aside></div></main></div>`;
  }

  function hotspot(h, scene) {
    const completed = (h.clue && hasEvidence(h.clue)) || (h.id === 'cup' && hasItem('napkin')),
      cls = [completed?'completed':'',h.go?'hotspot-go':'',ui.selectedItem?'item-target':''].join(' ');
    return `<button class="hotspot ${cls}" data-action="hotspot" data-id="${esc(h.id)}" style="left:${h.x}%;top:${h.y}%" aria-label="${esc(h.title)}" title="${esc(h.title)}"><span aria-hidden="true">${completed?'✓':h.icon}</span><span class="hotspot-label">${esc(h.title)}</span></button>`;
  }

  function renderScene() {
    const scene = SCENES[save().scene];
    return `<div class="app-shell">${header({game:true})}<main class="mission-body"><section class="scene-column"><div class="scene-heading"><div><div class="kicker">OPERACIÓN MADRID / EPISODIO 01</div><h2>${esc(scene.title)}</h2><p>${esc(scene.subtitle)}</p></div><div class="heading-right">${badge(`${evidenceCount()}/${REQUIRED.length} pruebas`, 'good')}${badge(LEVELS[agent().level].range)}</div></div>
      <div class="scene-frame"><img class="scene-photo" src="${esc(scene.image)}" alt="Recreación artística del ${save().scene==='terrace'?'Café de Oriente y el Palacio Real desde la terraza':'salón del Café de Oriente'} en Madrid" /><div class="scene-banner">${ui.selectedItem?`Objeto seleccionado: ${esc(ITEMS[ui.selectedItem]?.es)} · Pulsa otro objeto para combinar`:'Examine the scene · Busca los puntos dorados'}</div>${scene.hotspots.map(h=>hotspot(h,scene)).join('')}</div>
      <div class="game-tabs" role="group" aria-label="Herramientas del agente"><button class="game-tab ${ui.side==='inventory'?'active':''}" data-action="inventory">▣ Inventario <span>${save().items.length}</span></button><button class="game-tab ${ui.side==='board'?'active':''}" data-action="board">◇ Tablero <span>${save().links.length}/${Object.keys(BOARD_LINKS).length}</span></button><button class="game-tab ${ui.side==='notebook'?'active':''}" data-action="open-notebook">◫ Pruebas <span>${evidenceCount()}</span></button><button class="game-tab ${ui.side==='map'?'active':''}" data-action="show-map">⌖ Mapa</button></div>
      <div class="scene-toolbar"><p>Explora, recoge objetos, combínalos en el inventario e interroga a los testigos. Después conecta las pruebas en el tablero.</p><div class="action-row"><button class="btn btn-sm" data-action="scene" data-scene="${save().scene==='terrace'?'interior':'terrace'}">${save().scene==='terrace'?'Entrar al café →':'← Volver a terraza'}</button><button class="btn btn-sm btn-primary" data-action="deduce">Deducir destino</button></div></div>
      <div class="scene-foot"><span>Ilustración artística inspirada en el entorno real · interiores dramatizados</span><span>Sin cronómetro · Guardado automático</span></div></section><aside class="sidebar">${renderSidebar()}</aside></main></div>`;
  }

  function renderSidebar() {
    const closeSide = '<button class="btn btn-icon btn-ghost" data-action="side-case" aria-label="Volver al caso">×</button>';
    if (ui.side === 'inventory') {
      return `<div class="side-header"><div><div class="eyebrow">FIELD EQUIPMENT</div><h3>Inventario</h3></div>${closeSide}</div>
      <p class="side-text">Selecciona un objeto y después otro para intentar combinarlos. También puedes usarlo sobre los puntos de una escena.</p>
      <div class="inventory-grid">${save().items.length ? save().items.map(id => `<button class="inv-card ${ui.selectedItem===id?'selected':''}" data-action="inventory-item" data-id="${id}" aria-pressed="${ui.selectedItem===id}"><span class="inv-icon">${ITEMS[id].icon}</span><strong>${esc(ITEMS[id].title)}</strong><small>${esc(ITEMS[id].es)}</small></button>`).join('') : '<div class="empty-inventory">Todavía no llevas objetos. Examina el recibo y la taza de la terraza.</div>'}</div>
      ${ui.selectedItem?`<div class="item-detail"><strong>${esc(ITEMS[ui.selectedItem].title)}</strong><p>${esc(ITEMS[ui.selectedItem].text)}</p><button class="btn btn-sm" data-action="speak" data-text="${encodeURIComponent(ITEMS[ui.selectedItem].text)}">▶ Listen</button><button class="text-link" data-action="clear-item">Deseleccionar</button></div>`:''}
      <div class="rule"></div><button class="btn btn-primary btn-wide" data-action="board">Abrir tablero de investigación →</button>`;
    }
    if (ui.side === 'board') {
      const selected = ui.boardFirst;
      return `<div class="side-header"><div><div class="eyebrow">INTELLIGENCE ANALYSIS</div><h3>Tablero de pruebas</h3></div>${closeSide}</div>
      <p class="side-text">Relaciona dos pruebas que tengan una conexión lógica. Selecciona una tarjeta y después otra.</p>
      <div class="board-cards">${REQUIRED.map(id=>`<button class="board-clue ${hasEvidence(id)?'found':''} ${selected===id?'selected':''}" data-action="board-select" data-id="${id}" ${hasEvidence(id)?'':'disabled'} aria-pressed="${selected===id}"><span>${hasEvidence(id)?EVIDENCE[id].icon:'?'}</span><strong>${esc(hasEvidence(id)?EVIDENCE[id].name:'Unknown clue')}</strong></button>`).join('')}</div>
      <div class="board-connections"><div class="eyebrow">CONEXIONES · ${save().links.length}/${Object.keys(BOARD_LINKS).length}</div>${Object.entries(BOARD_LINKS).map(([id,link])=>`<div class="board-link ${save().links.includes(id)?'connected':''}"><span>${save().links.includes(id)?'✓':'◇'}</span><div><strong>${esc(save().links.includes(id)?link.title:'Conexión pendiente')}</strong><p>${save().links.includes(id)?esc(link.es):'Selecciona dos pruebas relacionadas.'}</p></div></div>`).join('')}</div>
      ${boardComplete()?'<div class="case-brief"><h4>Analysis complete</h4><p>Ya puedes justificar tu próximo destino.</p></div>':''}<button class="btn btn-primary btn-wide" data-action="deduce">Formular hipótesis →</button>`;
    }
    if (ui.side === 'inspect' && ui.inspected) {
      const obj = OBJECTS[ui.inspected];
      if (!obj) { ui.side = 'case'; return renderSidebar(); }
      const found = obj.clue && hasEvidence(obj.clue);
      return `<div class="side-header"><div><div class="eyebrow">EVIDENCE INSPECTION</div><h3>${esc(obj.title)}</h3></div>${closeSide}</div><p class="side-text">${esc(obj.text)}</p>${helped(obj.textEs)}${obj.clue ? `<div class="rule"></div>${found?badge('Evidence logged', 'good'):badge('Potential evidence','warm')}`:''}
      ${obj.challenge ? `<button class="btn btn-primary btn-wide" style="margin-top:20px" data-action="challenge" data-id="${esc(obj.challenge)}">${found?'Practise again':'Investigate clue →'}</button>` : ''}
      ${obj.item ? `<button class="btn btn-primary btn-wide" style="margin-top:20px" data-action="collect-item" data-id="${esc(obj.item)}" ${hasItem(obj.item)?'disabled':''}>${hasItem(obj.item)?'✓ Guardado en inventario':'▣ Recoger objeto →'}</button>` : ''}
      ${obj.dialogue ? `<button class="btn btn-primary btn-wide" style="margin-top:20px" data-action="dialogue">${found?'Hablar otra vez':'◉ Interrogar a Carmen →'}</button>` : ''}
      ${obj.speech ? `<button class="btn btn-wide" style="margin-top:15px" data-action="speak" data-text="${encodeURIComponent(obj.speech)}">▶ Listen & practise</button>` : ''}
      ${obj.needs && !hasEvidence(obj.needs) ? '<p class="small muted">Hint: the folded receipt may tell you where to search.</p>' : ''}
      <div class="rule"></div><button class="btn btn-ghost" data-action="inventory">Inventario</button> <button class="btn btn-ghost" data-action="open-notebook">Expediente</button>`;
    }
    if (ui.side === 'notebook') {
      return `<div class="side-header"><div><div class="eyebrow">YOUR FIELD NOTES</div><h3>Evidence file</h3></div>${closeSide}</div><p class="side-text">No confundas una pista con una conclusión. Comprueba qué demuestra cada prueba.</p><div class="evidence-list">${Object.entries(EVIDENCE).map(([id,e])=>`<div class="evidence-item ${hasEvidence(id)?'found':''}"><strong><span class="evidence-icon">${hasEvidence(id)?e.icon:'?'}</span>${esc(hasEvidence(id)?e.name:'Unknown evidence')}</strong><p>${hasEvidence(id)?esc(e.detail):'Not discovered yet.'}</p>${hasEvidence(id)&&helpOn()?`<p style="color:#c7d7cf">${esc(e.detailEs)}</p>`:''}</div>`).join('')}</div><div class="rule"></div><button class="btn btn-primary btn-wide" data-action="board">Relacionar pistas →</button>`;
    }
    if (ui.side === 'map') {
      return `<div class="side-header"><div><div class="eyebrow">MISSION MAP</div><h3>Madrid</h3></div>${closeSide}</div><p class="side-text">Los destinos se desbloquean con deducciones basadas en pruebas.</p><div class="hq-map"><div class="map-line"></div><span class="map-dot" style="left:25%;top:54%"></span><span class="map-tag" style="left:28%;top:48%">Café de Oriente</span><span class="map-dot ${save().ritzUnlocked?'':'locked'}" style="left:67%;top:67%"></span><span class="map-tag ${save().ritzUnlocked?'':'locked'}" style="left:70%;top:61%">Ritz</span></div><div class="choice-list"><button class="choice" data-action="travel-terrace">● Café de Oriente — Disponible</button><button class="choice" data-action="ritz" ${save().ritzUnlocked?'':'disabled'}>${save().ritzUnlocked?'●':'○'} Hotel Ritz — ${save().ritzUnlocked?'Pista encontrada':'Desconocido'}</button><div class="evidence-item"><strong>Otras localizaciones</strong><p>Atocha, Chamartín, las Cuatro Torres y el piso franco se incorporarán a medida que ampliemos la misión.</p></div></div>`;
    }
    return `<div class="side-header"><div><div class="eyebrow">MISSION FILE · 001</div><h3>The missing contact</h3></div>${badge('OPEN','warm')}</div>
      <p class="side-text">Evelyn has missed an urgent rendezvous. She was carrying important documents. Find out what happened.</p>${helped('Evelyn no ha aparecido en una cita urgente. Investiga las pistas y descubre qué sucedió.')}
      <div class="mission-progress"><div class="progress-head"><span>Investigation progress</span><strong>${evidenceCount()} / ${REQUIRED.length} clues</strong></div><div class="progress-line"><span style="width:${evidenceCount()/REQUIRED.length*100}%"></span></div></div>
      <div class="case-brief"><h4>Current objective</h4><p>${save().ritzUnlocked?'You have identified the next location. Review the case or open your map.':evidenceCount()===REQUIRED.length?'Connect the evidence on your investigation board.':'Find the folded receipt, examine the cup, question Carmen and search under the meeting table.'}</p></div>
      <div class="quote">“If I don’t show up, follow the clues.”</div><div class="side-actions"><button class="btn" data-action="inventory">▣ Inventario</button><button class="btn" data-action="board">◇ Tablero</button><button class="btn" data-action="open-notebook">◫ Expediente</button><button class="btn" data-action="show-map">⌖ Mapa</button></div>
      <div class="learning-card"><div class="eyebrow">ENGLISH TRAINING</div><strong>${esc(LEVELS[agent().level].title)} · ${esc(LEVELS[agent().level].range)}</strong><p>${esc(LEVELS[agent().level].note)}. Puedes escuchar de nuevo y utilizar ayudas; el aprendizaje no penaliza la investigación.</p><button class="text-link" data-action="speak" data-text="${encodeURIComponent('If I do not show up, follow the clues.')}">▶ Listen to the mission phrase</button></div>`;
  }

  function renderNewAgentModal() {
    return `<div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-label="Crear agente"><button class="modal-close" data-action="close-modal" aria-label="Cerrar">×</button><div class="kicker">IDENTITY REGISTRATION</div><h2>Create your codename.</h2><p>Elige un nombre en clave y el nivel inicial de inglés. Es una orientación provisional: más adelante incorporaremos evaluación adaptativa.</p><div class="field"><label for="agent-name">Nombre en clave / Codename</label><input id="agent-name" maxlength="22" placeholder="Ej. Fénix, Shadow, Atlas..." autocomplete="off" /></div><div class="field"><label>Choose your English level</label><div class="level-grid">${Object.entries(LEVELS).map(([id,l])=>`<button class="level-card ${ui.levelPick===id?'selected':''}" data-action="pick-level" data-id="${id}"><strong>${esc(l.title)}</strong><small>${esc(l.range)} · ${esc(l.note)}</small></button>`).join('')}</div></div>${ui.lastError?`<div class="choice-result error">${esc(ui.lastError)}</div>`:''}<div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="create-agent">Crear agente →</button></div></section></div>`;
  }

  function renderChallengeModal() {
    const puzzle = ui.modal.id, level = agent().level, q = CHALLENGES[puzzle]?.[level];
    if (!q) return '';
    return `<div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-label="Resolver una pista"><button class="modal-close" data-action="close-modal" aria-label="Cerrar">×</button><div class="kicker">FIELD ENGLISH · ${esc(LEVELS[level].range)}</div><h2>${puzzle==='witness'?'Witness interview':puzzle==='key'?'Search the meeting table':'Decode the message'}</h2><div class="question">${esc(q.question)}</div>${helped(q.help)}<button class="btn btn-sm" data-action="speak" data-text="${encodeURIComponent(q.speech)}" style="margin-top:12px">▶ Listen again</button><div class="choice-list">${q.options.map((option,i)=>`<button class="choice" data-action="answer" data-index="${i}">${String.fromCharCode(65+i)}. ${esc(option)}</button>`).join('')}</div>${ui.lastError?`<div class="choice-result error">${esc(ui.lastError)}</div>`:''}<div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Volver al escenario</button></div></section></div>`;
  }

  function renderDialogueModal() {
    const last = ui.modal?.reply && CARMEN_TOPICS[ui.modal.reply];
    const ready = ['time', 'identity'].every(id=>save().asked.includes(id));
    const easy = ['starter','basic'].includes(agent().level);
    return `<div class="modal-backdrop" role="presentation"><section class="modal conversation" role="dialog" aria-modal="true" aria-label="Interrogatorio a Carmen"><button class="modal-close" data-action="close-modal" aria-label="Cerrar">×</button>
      <div class="kicker">WITNESS INTERVIEW / CARMEN SOLER</div><h2>A witness with questions.</h2>
      <div class="dialogue-bubble"><span class="dialogue-avatar">CS</span><div><strong>Carmen Soler · Café de Oriente</strong><p>${esc(last?(easy?last.answerEasy:last.answer):'Good evening, Agent. A woman ordered coffee here earlier. What do you want to know?')}</p>${last&&helpOn()?`<small>${esc(last.es)}</small>`:''}</div></div>
      ${last?`<button class="btn btn-sm" data-action="speak" data-text="${encodeURIComponent(easy?last.answerEasy:last.answer)}">▶ Listen to Carmen</button>`:''}
      <div class="eyebrow" style="margin-top:22px">YOUR QUESTIONS / TUS PREGUNTAS</div><div class="choice-list">${Object.entries(CARMEN_TOPICS).map(([id,topic])=>`<button class="choice ${save().asked.includes(id)?'asked':''}" data-action="ask-carmen" data-id="${id}">${save().asked.includes(id)?'✓':'◉'} ${esc(topic.question)}</button>`).join('')}</div>
      <div class="dialogue-progress">${save().asked.length} preguntas formuladas · ${ready?'Puedes verificar el testimonio.':'Pregunta por la hora y la identidad para contrastar la declaración.'}</div>
      <div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Terminar conversación</button><button class="btn btn-primary" data-action="challenge" data-id="witness" ${ready?'':'disabled'}>${hasEvidence('MAD-E03')?'Practise testimony':'Verify statement →'}</button></div></section></div>`;
  }

  function renderSuccessModal() {
    const e = EVIDENCE[ui.modal.evidence];
    return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="Pista resuelta"><button class="modal-close" data-action="close-modal" aria-label="Cerrar">×</button><div class="kicker">EVIDENCE SECURED · +25 XP</div><h2>Excellent work, Agent.</h2><div class="choice-result">✓ ${esc(e.name)} — Added to your case file.</div><p>${esc(e.detail)}</p>${helped(e.detailEs)}${evidenceCount()===REQUIRED.length?'<div class="case-brief"><h4>All clues collected!</h4><p>Open your investigation board and connect the evidence before choosing the next destination.</p></div>':''}<div class="modal-footer"><button class="btn btn-ghost" data-action="open-notebook-modal">Ver expediente</button><button class="btn btn-primary" data-action="close-modal">Continue →</button></div></section></div>`;
  }

  function renderDeductionModal() {
    const ready = REQUIRED.every(hasEvidence) && boardComplete();
    return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="Deducir siguiente destino"><button class="modal-close" data-action="close-modal">×</button><div class="kicker">INTELLIGENCE ANALYSIS</div><h2>Where should we go next?</h2>${ready?'<p>Compare the tag on the key and your reconstructed message. Is one destination better supported by the evidence?</p>':'<p>Para formular una hipótesis necesitas reunir cinco pruebas y crear las dos conexiones en el tablero.</p>'}<div class="evidence-list">${REQUIRED.map(id=>`<div class="evidence-item ${hasEvidence(id)?'found':''}"><strong>${hasEvidence(id)?'✓ ':'○ '}${esc(hasEvidence(id)?EVIDENCE[id].name:'Evidence not yet found')}</strong></div>`).join('')}</div><p class="small muted">Conexiones: ${save().links.length} / ${Object.keys(BOARD_LINKS).length}</p>${ready?`<div class="choice-list"><button class="choice" data-action="deduction-answer" data-place="atocha">A. Estación de Atocha</button><button class="choice" data-action="deduction-answer" data-place="ritz">B. Hotel Ritz · Plaza de la Lealtad</button><button class="choice" data-action="deduction-answer" data-place="chamartin">C. Estación de Chamartín</button></div>`:''}${ui.lastError?`<div class="choice-result error">${esc(ui.lastError)}</div>`:''}<div class="modal-footer">${!ready?'<button class="btn btn-primary" data-action="board-from-modal">Abrir tablero →</button>':''}<button class="btn btn-ghost" data-action="close-modal">Volver a investigar</button></div></section></div>`;
  }

  function renderChapterEnd() {
    return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="Primer caso completado"><button class="modal-close" data-action="close-modal">×</button><div class="kicker">CASE REPORT · FIRST LEAD CONFIRMED</div><h2>The trail leads to the Ritz.</h2><p>You have gathered enough evidence to investigate the Hotel Ritz. The key points to Plaza de la Lealtad, but it does not prove Evelyn stayed there or reveal where she is now.</p>${helped('Has identificado el siguiente lugar a investigar: el Hotel Ritz. Las pistas justifican visitarlo, pero no demuestran que Evelyn se alojara allí.')}<div class="choice-result">✓ Caso 01: la cita fallida · Primer avance conseguido.</div><p class="small">La visita al hotel, el piso franco, las estaciones y las Cuatro Torres se incorporarán en las siguientes versiones.</p><div class="modal-footer"><button class="btn btn-ghost" data-action="open-notebook-modal">Revisar expediente</button><button class="btn btn-primary" data-action="close-modal">Volver a Madrid</button></div></section></div>`;
  }

  function renderComingSoon() {
    return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="Próximo episodio"><button class="modal-close" data-action="close-modal">×</button><div class="kicker">NEXT INVESTIGATION UNLOCKED</div><h2>Mandarin Oriental Ritz</h2><p>Great work, Agent. You have identified the next place to investigate. The Ritz investigation, with its own rooms and witnesses, is planned for the next chapter.</p>${helped('¡Buen trabajo! La siguiente investigación será el Ritz, pero aún no se puede explorar.')}<div class="modal-footer"><button class="btn btn-primary" data-action="close-modal">Entendido</button></div></section></div>`;
  }

  function renderModal() {
    switch (ui.modal?.type) {
      case 'new-agent': return renderNewAgentModal();
      case 'challenge': return renderChallengeModal();
      case 'dialogue': return renderDialogueModal();
      case 'success': return renderSuccessModal();
      case 'deduction': return renderDeductionModal();
      case 'chapter-end': return renderChapterEnd();
      case 'coming-soon': return renderComingSoon();
      default: return '';
    }
  }

  function render() {
    if (ui.view === 'profiles') app.innerHTML = renderProfiles();
    else if (ui.view === 'game' && save()) app.innerHTML = save().scene === 'hq' ? renderHQ() : renderScene();
    else app.innerHTML = renderMenu();
    modalRoot.innerHTML = renderModal();
  }

  function setScene(scene) {
    ensureSave();
    if (scene !== 'hq' && !SCENES[scene]) return;
    save().scene = scene; ui.view = 'game'; ui.side = 'case'; ui.inspected = null; ui.modal = null; ui.selectedItem = null; ui.boardFirst = null;
    persist(); render(); window.scrollTo({top:0,behavior:'smooth'});
  }

  function award(evidenceId) {
    if (!evidenceId || hasEvidence(evidenceId)) return false;
    save().evidence.push(evidenceId); save().xp += 25;
    if (evidenceId === 'MAD-E02') addItem('receipt');
    if (evidenceId === 'MAD-E04') addItem('key');
    persist(); return true;
  }

  function combineItems(first, second) {
    const pair = [first, second].sort().join('+');
    ui.selectedItem = null;
    if (pair !== 'napkin+receipt') {
      notify('These objects do not fit together. / Estos objetos no encajan.'); render(); return;
    }
    if (hasItem('joined')) {
      notify('Ya habías reconstruido el mensaje.'); render(); return;
    }
    addItem('joined');
    award('MAD-E05'); ui.side = 'inventory'; ui.inspected = null;
    ui.modal = { type:'success', evidence:'MAD-E05' }; render();
    notify('¡Has reconstruido un mensaje! Ahora puedes relacionarlo con las demás pruebas.');
  }

  function connectBoard(first, second) {
    if (!first) { ui.boardFirst = second; render(); return; }
    ui.boardFirst = null;
    if (first === second) { render(); return; }
    const match = Object.entries(BOARD_LINKS).find(([,link]) => link.clues.includes(first) && link.clues.includes(second));
    if (!match) { render(); notify('Esa relación no está justificada. Prueba con otras dos pistas.'); return; }
    const [id, link] = match;
    if (save().links.includes(id)) { render(); notify('Ya has documentado esa conexión.'); return; }
    save().links.push(id); save().xp += 15; persist(); render();
    notify(`Conexión confirmada: ${link.title}. +15 XP`);
  }

  function handleAnswer(index) {
    const id = ui.modal?.id; const q = CHALLENGES[id]?.[agent().level];
    if (!q) return;
    if (index !== q.answer) { ui.lastError = 'Not quite. Try again — take your time. / Vuelve a intentarlo, sin prisa.'; render(); return; }
    const evidenceId = { receipt: 'MAD-E02', witness: 'MAD-E03', key: 'MAD-E04' }[id];
    if (award(evidenceId)) {
      ui.modal = {type:'success', evidence:evidenceId};
      if (evidenceCount() === REQUIRED.length) notify('¡Ya tienes las cinco pruebas! Relaciónalas en el tablero para deducir el siguiente lugar.');
    } else { ui.modal = null; notify('Correct! Esta prueba ya estaba en tu expediente.'); }
    ui.lastError = ''; render();
  }

  function openHotspot(id) {
    const h = SCENES[save().scene]?.hotspots.find(x=>x.id===id);
    if (!h) return;
    if (h.go) { setScene(h.go); return; }
    if (ui.selectedItem) {
      if ((ui.selectedItem === 'napkin' && id === 'receipt' && hasItem('receipt')) ||
          (ui.selectedItem === 'receipt' && id === 'cup' && hasItem('napkin'))) {
        combineItems('napkin', 'receipt'); return;
      }
      notify('No hay una combinación útil en ese lugar. Puedes combinar objetos en el inventario.'); return;
    }
    ui.inspected = id; ui.side = 'inspect'; ui.modal = null; render();
  }

  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-action]'); if (!el) return;
    const action = el.dataset.action, id = el.dataset.id;
    switch (action) {
      case 'home': ui.view='menu'; ui.modal=null; render(); break;
      case 'profiles': ui.view='profiles'; ui.modal=null; render(); break;
      case 'new-agent': ui.levelPick='starter'; ui.lastError=''; ui.modal={type:'new-agent'}; render(); document.getElementById('agent-name')?.focus(); break;
      case 'pick-level': {
        const name = document.getElementById('agent-name')?.value || '';
        ui.levelPick=id; render(); const input=document.getElementById('agent-name'); if(input)input.value=name; break;
      }
      case 'create-agent': {
        const name = (document.getElementById('agent-name')?.value||'').trim().replace(/\s+/g,' ');
        if (name.length < 2) { ui.lastError='El nombre debe tener al menos dos caracteres.'; render(); break; }
        if (db.agents.some(a=>a.name.toLowerCase()===name.toLowerCase())) { ui.lastError='Ese nombre en clave ya existe. Elige otro para mantener las partidas separadas.'; render(); break; }
        const newAgent = { id: 'ag_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6), name, level: ui.levelPick, symbol: ['✦','◆','◈','◇'][db.agents.length % 4] };
        db.agents.push(newAgent); db.selectedAgent=newAgent.id; db.saves[newAgent.id]=newSave(); ui.view='game'; ui.modal=null; persist(); render(); notify('Credenciales creadas. Bienvenido a la agencia.'); break;
      }
      case 'select-agent': db.selectedAgent=id; ensureSave(); ui.view='game'; ui.modal=null; persist(); render(); break;
      case 'toggle-help': db.settings.help=!db.settings.help; persist(); render(); notify(db.settings.help?'Ayuda en español activada.':'Ayuda en español desactivada.'); break;
      case 'inventory': ui.side='inventory'; ui.boardFirst=null; ui.inspected=null; ui.modal=null; render(); break;
      case 'board': ui.side='board'; ui.selectedItem=null; ui.inspected=null; ui.modal=null; render(); break;
      case 'board-from-modal': ui.modal=null; ui.side='board'; ui.inspected=null; render(); break;
      case 'board-select': if(hasEvidence(id))connectBoard(ui.boardFirst,id); break;
      case 'inventory-item': {
        if(!hasItem(id))break;
        if(ui.selectedItem && ui.selectedItem!==id) combineItems(ui.selectedItem,id);
        else {ui.selectedItem=ui.selectedItem===id?null:id;render();}
        break;
      }
      case 'clear-item': ui.selectedItem=null;render();break;
      case 'collect-item':
        if(addItem(id)){ui.side='inventory';ui.inspected=null;render();notify(`Has recogido: ${ITEMS[id].es}.`);}
        break;
      case 'speak': speak(decodeURIComponent(el.dataset.text||'')); break;
      case 'travel-terrace': setScene('terrace'); break;
      case 'scene': setScene(el.dataset.scene); break;
      case 'hotspot': openHotspot(id); break;
      case 'dialogue': ui.modal={type:'dialogue',reply:null};render();break;
      case 'ask-carmen': {
        const topic=CARMEN_TOPICS[id]; if(!topic)break;
        if(!save().asked.includes(id))save().asked.push(id);
        ui.modal={type:'dialogue',reply:id};persist();render();
        if(db.settings.sound)speak(['starter','basic'].includes(agent().level)?topic.answerEasy:topic.answer);
        break;
      }
      case 'side-case': ui.side='case'; ui.inspected=null; render(); break;
      case 'open-notebook': ui.side='notebook'; ui.inspected=null; render(); break;
      case 'open-notebook-modal': ui.modal=null; ui.side='notebook'; render(); break;
      case 'show-map': ui.side='map'; ui.inspected=null; render(); break;
      case 'challenge': {
        const obj=OBJECTS[ui.inspected];
        if(obj?.needs && !hasEvidence(obj.needs)){notify('First, investigate the folded receipt. / Examina primero el recibo.');break;}
        if(id==='witness'&&!['time','identity'].every(topic=>save().asked.includes(topic))){notify('Ask Carmen about the time and identity first.');break;}
        ui.lastError=''; ui.modal={type:'challenge',id}; render(); break;
      }
      case 'answer': handleAnswer(Number(el.dataset.index)); break;
      case 'deduce': ui.lastError=''; ui.modal={type:'deduction'}; render(); break;
      case 'deduction-answer':
        if(!REQUIRED.every(hasEvidence)||!boardComplete()){notify('Antes debes reunir y relacionar las pruebas.');break;}
        if(el.dataset.place==='ritz') {if(!save().caseDone)save().xp+=50;save().ritzUnlocked=true;save().caseDone=true;persist();ui.modal={type:'chapter-end'};ui.lastError='';render();}
        else {ui.lastError='That destination is possible later, but the key tag currently gives stronger evidence for another place. / Revisa la etiqueta de la llave.';render();} break;
      case 'ritz': ui.modal={type:'coming-soon'}; render(); break;
      case 'close-modal': ui.modal=null;ui.lastError='';render();break;
      default: break;
    }
  });
  document.addEventListener('keydown', ev=>{
    const editing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'');
    if(ev.key==='Escape') {if(ui.modal){ui.modal=null;ui.lastError='';render();}else if(ui.selectedItem){ui.selectedItem=null;render();}return;}
    if(!editing && !ui.modal && ui.view==='game' && save()?.scene!=='hq'){
      const shortcut={i:'inventory',b:'board',m:'show-map'}[ev.key.toLowerCase()];
      if(shortcut){ev.preventDefault();document.querySelector(`[data-action="${shortcut}"]`)?.click();}
    }
  });
  render();
})();
