import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// El pico de respaldo evita una mano invisible si la carga del GLB falla.
function createFallbackPickaxe() {
  const group = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x906039 });
  const iron = new THREE.MeshLambertMaterial({ color: 0x9aa4b0 });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.25, 0.13), wood);
  handle.position.set(0, -0.05, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.20, 0.20), iron);
  head.position.set(0, 0.51, 0);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, 0.20), iron);
  left.position.set(-0.58, 0.45, 0);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, 0.20), iron);
  right.position.set(0.58, 0.45, 0);
  group.add(handle, head, left, right);
  return group;
}

export class ModelLoader {
  loader = new GLTFLoader();

  models = { pickaxe: undefined };

  constructor(onLoad) {
    this.models.pickaxe = createFallbackPickaxe();
    onLoad(this.models);
    this.loader.load('./models/pickaxe.glb', (model) => {
      this.models.pickaxe = model.scene;
      onLoad(this.models);
    }, undefined, (error) => {
      console.warn('No se pudo cargar el modelo del pico; se usa el pico de respaldo.', error);
    });
  }
}
