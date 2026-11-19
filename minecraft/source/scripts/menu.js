import { getLanguage, setLanguage, t, onLanguageChange } from './i18n.js';

export function setupMenu(player, saves) {
  const select = document.getElementById('language-select');
  select.value = getLanguage();
  const list = document.getElementById('world-list');
  const nameInput = document.getElementById('new-world-name');
  const seedInput = document.getElementById('new-world-seed');
  const activeName = document.getElementById('active-world-name');
  const heroWorld = document.getElementById('menu-current-world');
  const typeSelect = document.getElementById('new-world-type');
  const modeSelect = document.getElementById('new-world-mode');
  const starterSelect = document.getElementById('new-world-starter');
  const typeHelp = document.getElementById('world-type-help');
  const updateTypeHelp = () => { typeHelp.textContent=t(`typeHelp_${typeSelect.value}`); };
  typeSelect.addEventListener('change',updateTypeHelp);
  modeSelect.addEventListener('change',()=>{ starterSelect.disabled=modeSelect.value==='creative'; });
  starterSelect.disabled=true;

  function action(label, callback, isDanger = false) {
    const button = document.createElement('button');
    button.textContent = t(label);
    button.type = 'button';
    button.className = `small-button${isDanger ? ' danger' : ''}`;
    button.addEventListener('click',callback);
    return button;
  }
  function renderWorlds() {
    list.replaceChildren();
    const items = saves.listWorlds();
    for (const world of items) {
      const row = document.createElement('article');
      row.className = `world-row${world.active ? ' active' : ''}`;
      const details = document.createElement('div'); details.className = 'world-details';
      const title = document.createElement('strong'); title.textContent = world.name;
      const info = document.createElement('small');
      const time = new Date(world.savedAt);
      const date = Number.isNaN(time.getTime()) ? '-' : time.toLocaleString(getLanguage());
      info.textContent = `${t('worldType')}: ${t(`type${world.type || 'classic'}`)} · ${t('seed')}: ${world.seed} · ${t(world.terrainVersion===6?'terrainHybridV112':world.terrainVersion===5?'terrainV112':world.terrainVersion===4?'terrainV11':world.terrainVersion===3?'terrainHybrid':world.terrainVersion===2?'terrainV10':'terrainLegacy')} · ${date}`;
      details.append(title,info);
      const actions = document.createElement('div'); actions.className = 'world-actions';
      if (world.active) {
        const badge = document.createElement('span');
        badge.className = 'current-badge'; badge.textContent = t('activeWorld'); actions.append(badge);
      } else {
        actions.append(action('openWorld', () => saves.switchWorld(world.id)));
      }
      actions.append(action('renameWorld',() => {
        const name = window.prompt(t('renamePrompt'),world.name);
        if (name !== null && name.trim()) saves.renameWorld(world.id,name);
      }));
      actions.append(action('duplicateWorld',() => saves.duplicateWorld(world.id)));
      if (items.length > 1) actions.append(action('deleteWorld',() => {
        if (window.confirm(t('confirmDeleteWorld').replace('{name}',world.name))) saves.deleteWorld(world.id);
      },true));
      row.append(details,actions); list.append(row);
    }
    const currentWorldLabel = `${t('activeWorld')}: ${saves.currentWorld()?.name || '-'}`;
    activeName.textContent = currentWorldLabel;
    heroWorld.textContent = currentWorldLabel;
  }
  saves.onWorldsChange = renderWorlds;
  onLanguageChange(() => {
    nameInput.placeholder = t('worldNamePlaceholder');
    updateTypeHelp();renderWorlds();
  });
  setLanguage(getLanguage());
  select.addEventListener('change', () => setLanguage(select.value));
  seedInput.value = String(Math.floor(Math.random() * 10001));
  document.getElementById('create-world').addEventListener('click',() => {
    const seed = Number(seedInput.value);
    if (seedInput.value.trim() === '' || !Number.isInteger(seed)) { saves.showStatus('invalidSeed',true); return; }
    if (!window.confirm(t('confirmCreateWorld'))) return;
    if (saves.createWorld(nameInput.value.trim() || t('worldDefault'),seed,typeSelect.value,modeSelect.value,starterSelect.checked)) {
      nameInput.value = '';
      seedInput.value = String(Math.floor(Math.random() * 10001));
      typeSelect.value='classic';modeSelect.value='creative';starterSelect.checked=true;starterSelect.disabled=true;updateTypeHelp();
    }
  });

  const start = () => { player.debugCamera = false; player.controls.lock(); };
  document.getElementById('start-game').addEventListener('click',start);
  document.getElementById('save-game').addEventListener('click',() => saves.saveLocal());
  document.getElementById('load-game').addEventListener('click',() => saves.loadLocal());
  document.getElementById('export-game').addEventListener('click',() => saves.exportFile());
  const input = document.getElementById('save-file-input');
  document.getElementById('import-game').addEventListener('click',() => input.click());
  input.addEventListener('change',async () => {
    const file = input.files?.[0]; input.value = '';
    await saves.importFile(file);
  });
  document.addEventListener('keydown',event => {
    if (event.code === 'F1' || event.code === 'F2') {
      event.preventDefault();
      if (event.repeat) return;
      if (event.code === 'F1') saves.saveLocal(); else saves.loadLocal();
      return;
    }
    if (!player.controls.isLocked && !player.inventoryVisible && event.code === 'Enter' &&
        !['INPUT','TEXTAREA','SELECT','BUTTON'].includes(event.target?.tagName)) {
      event.preventDefault(); start();
    }
  });
  renderWorlds();updateTypeHelp();
}
