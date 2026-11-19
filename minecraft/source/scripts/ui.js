import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { resources } from './blocks.js';
import { t, onLanguageChange } from './i18n.js';

/** A translated lil-gui debug panel. Regeneration preserves edited blocks. */
export function setupUI(world, player, physics, scene) {
  const gui = new GUI({ title: t('settings') });
  const controllers = [];
  const folders = [];
  const regenerate = () => world.generate(false, player.position);
  let markDirty = () => {};
  const changed = () => markDirty();

  function folder(parent, label, close = false) {
    const result = parent.addFolder(t(label));
    folders.push([result, label]);
    if (close) result.close();
    return result;
  }

  function control(parent, object, property, label, options = [], regenerates = false) {
    const result = parent.add(object, property, ...options).name(t(label));
    controllers.push([result, label]);
    result.onFinishChange(() => { changed(); if (regenerates) regenerate(); });
    return result;
  }

  const playerFolder = folder(gui, 'player');
  control(playerFolder, player, 'maxSpeed', 'maxSpeed', [1, 20, 0.1]);
  control(playerFolder, player, 'jumpSpeed', 'jumpSpeed', [1, 10, 0.1]);
  control(playerFolder, player.boundsHelper, 'visible', 'playerBounds');
  control(playerFolder, player.cameraHelper, 'visible', 'cameraHelper');

  const physicsFolder = folder(gui, 'physics');
  control(physicsFolder, physics.helpers, 'visible', 'collisions');
  control(physicsFolder, physics, 'simulationRate', 'simRate', [10, 1000]);

  const worldFolder = folder(gui, 'world');
  control(worldFolder, world, 'drawDistance', 'drawDistance', [0, 5, 1], true);
  control(worldFolder, world, 'asyncLoading', 'asyncLoading');
  control(worldFolder, world, 'weatherEnabled', 'weatherEffects');
  control(worldFolder, scene.userData?.fogPreferences || scene.fog, 'near', 'fogNear', [1, 250, 1]);
  control(worldFolder, scene.userData?.fogPreferences || scene.fog, 'far', 'fogFar', [1, 300, 1]);

  const terrainFolder = folder(worldFolder, 'terrain', true);
  control(terrainFolder, world.params, 'seed', 'seed', [0, 10000, 1], true);
  control(terrainFolder, world.params.terrain, 'scale', 'scale', [10, 100], true);
  // The original max of 1 was below the default magnitude of 8.
  control(terrainFolder, world.params.terrain, 'magnitude', 'magnitude', [0, 16], true);
  control(terrainFolder, world.params.terrain, 'offset', 'offset', [0, 32, 1], true);
  control(terrainFolder, world.params.terrain, 'waterOffset', 'waterOffset', [0, 32, 1], true);

  const biomesFolder = folder(gui, 'biomes');
  control(biomesFolder, world.params.biomes, 'scale', 'biomeScale', [100, 10000], true);
  control(biomesFolder, world.params.biomes.variation, 'amplitude', 'variationAmplitude', [0, 1], true);
  control(biomesFolder, world.params.biomes.variation, 'scale', 'variationScale', [10, 500], true);
  control(biomesFolder, world.params.biomes, 'tundraToTemperate', 'tundraTemperate', [0, 1], true);
  control(biomesFolder, world.params.biomes, 'temperateToJungle', 'temperateJungle', [0, 1], true);
  control(biomesFolder, world.params.biomes, 'jungleToDesert', 'jungleDesert', [0, 1], true);

  const resourcesFolder = folder(worldFolder, 'resources', true);
  const resourceLabels = { 3: 'resourceStone', 4: 'resourceCoal', 5: 'resourceIron' };
  for (const resource of resources) {
    const resourceFolder = folder(resourcesFolder, resourceLabels[resource.id]);
    control(resourceFolder, resource, 'scarcity', 'scarcity', [0, 1], true);
    control(resourceFolder, resource.scale, 'x', 'scaleX', [10, 100], true);
    control(resourceFolder, resource.scale, 'y', 'scaleY', [10, 100], true);
    control(resourceFolder, resource.scale, 'z', 'scaleZ', [10, 100], true);
  }

  const treesFolder = folder(terrainFolder, 'trees', true);
  control(treesFolder, world.params.trees, 'frequency', 'frequency', [0, 0.1], true);
  control(treesFolder, world.params.trees.trunk, 'minHeight', 'minTrunk', [0, 10, 1], true);
  control(treesFolder, world.params.trees.trunk, 'maxHeight', 'maxTrunk', [0, 10, 1], true);
  control(treesFolder, world.params.trees.canopy, 'minRadius', 'minCanopy', [0, 10, 1], true);
  control(treesFolder, world.params.trees.canopy, 'maxRadius', 'maxCanopy', [0, 10, 1], true);
  control(treesFolder, world.params.trees.canopy, 'density', 'canopyDensity', [0, 1], true);

  const cloudsFolder = folder(worldFolder, 'clouds', true);
  const cloudStyles = () => ({
    [t('cloudFast')]: 'fast', [t('cloudFancy')]: 'fancy', [t('cloudAdvanced')]: 'advanced'
  });
  const cloudStyleController = control(cloudsFolder, world, 'cloudStyle', 'cloudStyle', [cloudStyles()]);
  control(cloudsFolder, world.params.clouds, 'density', 'density', [0, 1]);
  control(cloudsFolder, world.params.clouds, 'scale', 'scale', [18, 80, 1]);

  onLanguageChange(() => {
    gui.title(t('settings'));
    for (const [element, label] of folders) element.title(t(label));
    for (const [element, label] of controllers) element.name(t(label));
    cloudStyleController.options(cloudStyles());
  });

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'KeyU' || event.repeat) return;
    const tag = event.target?.tagName;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
    if (gui._hidden) gui.show();
    else gui.hide();
  });
  gui.hide();

  return {
    onChange(callback) { markDirty = callback; },
    refresh() {
      for (const [controller] of controllers) controller.updateDisplay();
    }
  };
}
