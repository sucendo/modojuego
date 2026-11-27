import {canonicalBlock,placementVariant} from './constructionShapes.js';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { blocks } from './blocks.js';
import { Inventory, ITEM_BY_ID } from './inventory.js';
import { canBreakStation, stationKey } from './stations.js';
import { pickVoxel, adjacentCell } from './voxelPicking.js';
import { TOOL_PROFILES, isTool, isObjectBlock, harvestLevel, requiredHarvestLevel } from './toolProfiles.js';
import { createToolModel } from './toolModels.js';
import { viewPoseFor } from './toolPose.js';

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  height = 1.75;
  radius = 0.5;
  maxSpeed = 5;

  jumpSpeed = 10;
  sprinting = false;
  onGround = false;

  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 900);
  cameraHelper = new THREE.CameraHelper(this.camera);
  controls = new PointerLockControls(this.camera, document.body);
  debugCamera = false;

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
  selectedCoords = null;
  mineCoords = null;
  placeCoords = null;
  activeBlockId = blocks.empty.id;
  mineMode = true; // 0 = herramienta, 1–9 = bloques (igual que el original)
  equippedToolId = 'basic_pickaxe';
  rightObjectId = 21; // Objeto elegido con E para colocar con clic derecho
  baseToolModel = null;
  toolVariants = new Map();
  inventory = new Inventory();
  inventoryVisible = false;
  mapVisible = false;
  stationVisible = false;
  onFeedback = () => {};
  onInteract = () => {};
  onSleep = () => false;
  progress = null;
  animals = null;
  respawnPoint = [32,32,32];

  tool = {
    // Group that will contain the tool mesh
    container: new THREE.Group(),
    // Whether or not the tool is currently animating
    animate: false,
    // The time the animation was started
    animationStart: 0,
    // The rotation speed of the tool
    animationSpeed: 0.025,
    // Reference to the current animation
    animation: null
  }

  constructor(scene, world) {
    this.world = world;
    this.position.set(32, 32, 32);
    this.cameraHelper.visible = false;
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    // Hide/show instructions based on pointer controls locking/unlocking
    this.controls.addEventListener('lock', this.onCameraLock.bind(this));
    this.controls.addEventListener('unlock', this.onCameraUnlock.bind(this));

    // The tool is parented to the camera
    this.camera.add(this.tool.container);

    // Set raycaster to use layer 0 so it doesn't interact with water mesh on layer 1
    this.raycaster.layers.set(0);
    this.camera.layers.enable(1);

    // Wireframe mesh visualizing the player's bounding cylinder
    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    this.boundsHelper.visible = false;
    scene.add(this.boundsHelper);

    // Helper used to highlight the currently active block
    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa
    });
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);

    // Add event listeners for keyboard/mouse events
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('contextmenu', event => { if(this.controls.isLocked) event.preventDefault(); });
  }

  onCameraLock() {
    this.debugCamera = false;
    this.inventoryVisible = false;
    document.getElementById('inventory-overlay').hidden = true;
    document.getElementById('station-overlay').hidden = true;
    document.getElementById('world-map-overlay').hidden = true;
    this.mapVisible=false;
    document.getElementById('overlay').hidden = true;
  }

  onCameraUnlock() {
    // Releasing a movement key while the menu is open must not leave the player moving.
    this.input.set(0, 0, 0);
    this.sprinting = false;
    if (this.mapVisible) {
      document.getElementById('world-map-overlay').hidden=false;
      document.getElementById('overlay').hidden=true;
    } else if (this.stationVisible) {
      document.getElementById('station-overlay').hidden=false;
      document.getElementById('overlay').hidden=true;
    } else if (this.inventoryVisible) {
      document.getElementById('inventory-overlay').hidden = false;
      document.getElementById('overlay').hidden = true;
    } else if (!this.debugCamera) {
      document.getElementById('overlay').hidden = false;
    }
  }

  syncSelectedSlot() {
    const stack=this.inventory.getSelected();
    this.activeBlockId=this.mineMode ? 0 : (ITEM_BY_ID[stack?.id]?.blockId || 0);
    if (!this.tool.animate) this.tool.container.visible=this.shouldShowPickaxe();
    document.dispatchEvent(new Event('minecraft-selection-change'));
  }
  shouldShowPickaxe() {
    return this.mineMode;
  }
  selectPickaxe() { this.mineMode=true; this.syncSelectedSlot(); this.refreshToolModel(); }
  equipTool(id) {
    if (!isTool(id) || (id !== 'basic_pickaxe' && !this.inventory.has(id))) return false;
    this.equippedToolId=id;this.selectPickaxe();this.inventory.notify();return true;
  }
  selectRightObject(id) {
    if (!isObjectBlock(id) || !ITEM_BY_ID[id] || !this.inventory.has(id)) return false;
    this.rightObjectId=Number(id);
    this.inventory.notify();
    document.dispatchEvent(new Event('minecraft-selection-change'));
    return true;
  }
  refreshToolModel(){
    if (!this.baseToolModel) return;
    this.tool.container.clear();
    if(this.equippedToolId !== 'basic_pickaxe' && !this.toolVariants.has(this.equippedToolId))
      this.toolVariants.set(this.equippedToolId,createToolModel(this.equippedToolId));
    this.tool.container.add(this.equippedToolId === 'basic_pickaxe' ? this.baseToolModel : this.toolVariants.get(this.equippedToolId));
    this.applyToolViewPose();
    this.tool.container.visible=this.shouldShowPickaxe();
  }
  applyToolViewPose() {
    const kind=TOOL_PROFILES[this.equippedToolId]?.kind || 'pickaxe';
    const pose=viewPoseFor(kind);
    this.tool.baseRotation=pose.rotation;
    this.tool.swingAmount=pose.swing;
    this.tool.container.position.set(...pose.position);
    this.tool.container.scale.setScalar(pose.scale);
    this.tool.container.rotation.set(...pose.rotation);
  }
  setSelectedBlock(id) {
    if(id===0) {this.selectPickaxe();return;}
    if(!ITEM_BY_ID[id]?.blockId)return;
    let index=this.inventory.slots.findIndex((item,i)=>i<9&&item?.id===id);
    if(index<0 && this.inventory.mode==='creative'){
      this.inventory.assignCreative(id,this.inventory.selectedSlot);index=this.inventory.selectedSlot;
    }
    if(index>=0)this.selectHotbar(index);
  }
  selectHotbar(index){
    if(!this.inventory.select(index))return;
    const item=this.inventory.getSelected();
    if(isTool(item?.id)){this.equipTool(item.id);return;}
    this.mineMode=false;
    this.syncSelectedSlot();
  }

  openInventory() {
    this.inventoryVisible = true;
    if (this.controls.isLocked) this.controls.unlock();
    else {
      document.getElementById('overlay').hidden = true;
      document.getElementById('inventory-overlay').hidden = false;
    }
  }

  closeInventory(resume = false) {
    this.inventory.returnCraftGrid();
    this.inventory.workbenchAccess=false;
    if (this.inventory.mode!=='creative' && this.inventory.count(18)===0) this.inventory.setCraftSize(2);
    this.inventoryVisible = false;
    document.getElementById('inventory-overlay').hidden = true;
    if (resume) this.controls.lock();
    else document.getElementById('overlay').hidden = false;
  }

  /**
   * Updates the state of the player
   * @param {World} world 
   */
  update(world) {
    this.updateBoundsHelper();
    this.updateRaycaster(world);

    if (this.tool.animate) {
      this.updateToolAnimation();
    }
  }

  /**
   * Updates the raycaster used for block selection
   * @param {World} world 
   */
  updateRaycaster(world) {
    this.raycaster.far = 7;
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const hit = pickVoxel(world, this.raycaster.ray.origin, this.raycaster.ray.direction, 7);
    this.placementNormal=hit?.normal;
    this.mineCoords = hit ? new THREE.Vector3(hit.x,hit.y,hit.z) : null;
    this.mineAnimalId = null;
    this.placeCoords = null;
    if (this.mineMode && this.animals && this.equippedToolId!=='broom') {
      const animal = this.animals.raycast(this.raycaster,Math.min(hit?.distance??Infinity,TOOL_PROFILES[this.equippedToolId]?.reach??2.6));
      if (animal) { this.mineAnimalId=animal.id; this.mineCoords=null; }
    }
    // Original behaviour: place only against an EXISTING face. This still
    // permits roofs/bridges over empty space, but not isolated floating cubes.
    const target = adjacentCell(hit);
    if (target && target.y >= 0 && target.y < world.chunkSize.height &&
        world.getBlock(target.x,target.y,target.z)?.id === 0) {
      this.placeCoords = new THREE.Vector3(target.x,target.y,target.z);
    }
    const slab=canonicalBlock(this.inventory.getSelected()?.id);
    if(!this.mineMode&&hit&&[33,34].includes(slab)&&canonicalBlock(hit.id)===slab&&((hit.id<47&&hit.normal.y===1)||(hit.id>=47&&hit.normal.y===-1)))this.placeCoords=new THREE.Vector3(hit.x,hit.y,hit.z);
    this.selectedCoords = this.mineMode ? this.mineCoords : this.placeCoords;
    this.selectionHelper.visible = !!this.selectedCoords;
    if (this.selectedCoords) this.selectionHelper.position.copy(this.selectedCoords);
  }

  /**
   * Updates the state of the player based on the current user inputs
   * @param {Number} dt 
   */
  applyInputs(dt) {
    if (this.controls.isLocked === true) {
      this.velocity.x = this.input.x * (this.sprinting ? 1.5 : 1);
      this.velocity.z = this.input.z * (this.sprinting ? 1.5 : 1);
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

      if (this.position.y < 0) {
        this.position.y = 0;
        this.velocity.y = 0;
      }
    }

    document.getElementById('info-player-position').innerHTML = this.toString();
  }

  /**
   * Updates the position of the player's bounding cylinder helper
   */
  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.camera.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  /**
   * Set the tool object the player is holding
   * @param {THREE.Mesh} tool 
   */
  setTool(tool) {
    this.baseToolModel=tool;
    this.tool.container.receiveShadow=false;
    this.tool.container.castShadow=false;
    this.refreshToolModel();
  }

  /**
   * Animates the tool rotation
   */
  updateToolAnimation() {
    if (this.tool.container.children.length > 0) {
      const t = this.tool.animationSpeed * (performance.now() - this.tool.animationStart);
      // Swing around the grip, never rotate the blade relative to its handle.
      this.tool.container.rotation.z = this.tool.baseRotation[2] + this.tool.swingAmount * Math.sin(t);
    }
  }

  /**
   * Returns the current world position of the player
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /**
   * Returns the velocity of the player in world coordinates
   * @returns {THREE.Vector3}
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  /**
   * Applies a change in velocity 'dv' that is specified in the world frame
   * @param {THREE.Vector3} dv 
   */
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyDown(event) {
    // Only the menu's Play button (or Enter) acquires pointer lock.
    // Otherwise typing in the language selector or settings would start movement.
    if (!this.controls.isLocked) return;

    switch (event.code) {
      case 'Digit0':
        this.selectPickaxe();
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        this.selectHotbar(Number(event.code.slice(-1))-1);
        break;
      case 'KeyE':
        if (!event.repeat) this.openInventory();
        break;
      case 'KeyW':
        this.input.z = this.maxSpeed;
        break;
      case 'KeyA':
        this.input.x = -this.maxSpeed;
        break;
      case 'KeyS':
        this.input.z = -this.maxSpeed;
        break;
      case 'KeyD':
        this.input.x = this.maxSpeed;
        break;
      case 'KeyR':
        if (event.repeat) break;
        this.position.y = 32;
        this.velocity.set(0, 0, 0);
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprinting = true;
        break;
      case 'Space':
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
      case 'F10':
        this.debugCamera = true;
        this.controls.unlock();
        break;
    }
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.input.z = 0;
        break;
      case 'KeyA':
        this.input.x = 0;
        break;
      case 'KeyS':
        this.input.z = 0;
        break;
      case 'KeyD':
        this.input.x = 0;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprinting = false;
        break;
    }
  }

  /**
   * Event handler for 'mousedown'' event
   * @param {MouseEvent} event 
   */
  respawn() {
    this.position.fromArray(this.respawnPoint);
    this.velocity.set(0,0,0);
    this.input.set(0,0,0);
  }

  canPlaceAt(x,y,z,blockId) {
    const hit=this.mineCoords;
    // Furniture needs a supporting floor, ordinary blocks support bridges.
    if ([21,23,24,25,26].includes(blockId) && (!hit || y!==hit.y+1)) {
      this.onFeedback('needsFloor',true);return false;
    }
    // Do not trap the player inside the newly placed object.
    if (Math.abs(x-this.position.x)<.85 && Math.abs(z-this.position.z)<.85 &&
        y>this.position.y-this.height-.5 && y<this.position.y+.5) return false;
    return true;
  }

  placeSelected(blockId, viaRight=false) {
    if (!blockId || !this.placeCoords) return false;
    const {x,y,z}=this.placeCoords;
    if (!this.canPlaceAt(x,y,z,blockId)) return false;
    if (viaRight && !this.inventory.has(blockId)) {
      this.onFeedback('notEnoughBlocks',true);return false;
    }
    if (!viaRight && this.inventory.mode==='survival' && !this.inventory.getSelected()) return false;
    const canonical=canonicalBlock(blockId),target=this.mineCoords,old=target&&this.world.getBlock(target.x,target.y,target.z)?.id;
    let changed;
    if([33,34].includes(canonical)&&canonicalBlock(old)===canonical&&((old<47&&this.placementNormal?.y===1)||(old>=47&&this.placementNormal?.y===-1))){
      changed=this.world.replaceBlock(target.x,target.y,target.z,canonical===33?3:15);
    }else changed=this.world.addBlock(x,y,z,placementVariant(blockId,this.raycaster?.ray?.direction,this.placementNormal));
    if (changed) {
      this.progress?.increment('blocksPlaced');
      if (viaRight) this.inventory.consume(blockId,1);
      else this.inventory.consumeSelected();
    }
    return changed;
  }

  breakAt(x,y,z) {
    const block=this.world.getBlock(x,y,z);
    if (!block?.id) return false;
    if (!canBreakStation(this.world,x,y,z,block.id,this.inventory)) {
      this.onFeedback('emptyStationFirst',true);return false;
    }
    const level=harvestLevel(this.equippedToolId,block.id);
    if(level < 0) { this.onFeedback('wrongTool',true);return false; }
    const required=requiredHarvestLevel(block.id);
    const canHarvest=this.inventory.mode==='creative' || level>=required;
    // Natural ice shatters without yielding an extra block in survival.
    const dropId=block.id===28?null:block.id===4?'coal':block.id===5?'raw_iron':block.id===29?'raw_gold':block.id===30?'emerald':block.id===31?'diamond':canonicalBlock(block.id);
    if(this.inventory.mode==='survival' && canHarvest && ITEM_BY_ID[dropId] && !this.inventory.canAccept(dropId)) {
      this.onFeedback('inventoryFull',true);return false;
    }
    const changed=this.world.removeBlock(x,y,z);
    if(changed) {
      this.progress?.increment('blocksBroken');
      if(this.world.stations)delete this.world.stations[stationKey(x,y,z)];
      if(this.inventory.mode==='survival') {
        if(canHarvest && ITEM_BY_ID[dropId]) this.inventory.add(dropId);
        else if(required) this.onFeedback('needPickaxe',true);
      }
    }
    return changed;
  }

  interactAtMineCoords() {
    if (!this.mineCoords) return false;
    const {x,y,z}=this.mineCoords;
    const id=this.world.getBlock(x,y,z)?.id;
    if(id===18){this.inventory.workbenchAccess=true;this.inventory.setCraftSize(3);this.openInventory();return true;}
    if(id===23){
      this.respawnPoint=[x,y+2,z];
      const slept=this.onSleep();
      this.onFeedback(slept?'bedSlept':'bedSpawnSet');
      this.inventory.notify();return true;
    }
    if(id===25 || id===26){this.onInteract(id,{x,y,z});return true;}
    return false;
  }

  animateSwing() {
    if (this.tool.container.children.length===0) return;
    this.tool.container.visible=true;
    this.tool.animate=true;
    this.tool.animationStart=performance.now();
    clearTimeout(this.tool.animation);
    this.tool.animation=setTimeout(()=>{
      this.tool.animate=false;
      this.tool.container.rotation.z=this.tool.baseRotation?.[2] ?? 0;
      this.tool.container.visible=this.shouldShowPickaxe();
    },3*Math.PI/this.tool.animationSpeed);
  }

  onMouseDown(event) {
    if(event.target?.closest?.('button,input,select,textarea')) return;
    if(!this.controls.isLocked || (event.button!==0 && event.button!==2)) return;
    if(this.mineMode && this.equippedToolId!=='basic_pickaxe' && !this.inventory.has(this.equippedToolId)){
      this.equipTool('basic_pickaxe');
    }
    // RIGHT: use existing workstations/beds, or place the selected E object.
    // Shift+right always tries placement, including next to a workstation.
    if(event.button===2){
      event.preventDefault();
      if(!event.shiftKey && this.interactAtMineCoords()) return;
      if(this.rightObjectId) this.placeSelected(this.rightObjectId,true);
      return;
    }
    // LEFT: exactly the original 0 = remove, 1–9 = place on a block face.
    if(!this.mineMode){
      const id=ITEM_BY_ID[this.inventory.getSelected()?.id]?.blockId;
      if(id) this.placeSelected(id);
      return;
    }
    if(this.equippedToolId==='broom'){
      const p=this.mineCoords,model=this.world.hydrology?.environment;
      const swept=p&&model?.clearSurface(p.x,p.y,p.z,'broom');
      if(swept)this.animateSwing();
      else if(p&&model?.snow.get(`${p.x},${p.z}`)?.ice>.001)this.onFeedback('frozenSnowNeedsPickaxe',true);
      return;
    }
    let changed=false;
    if(this.mineAnimalId && this.animals){
      changed=this.animals.harvest(this.mineAnimalId,this.inventory,this.equippedToolId);
      if(changed)this.progress?.increment('animalsHarvested');
      if(!changed)this.onFeedback('inventoryFull',true);
    }else if(this.mineCoords){
      const {x,y,z}=this.mineCoords;
      const iceRemoved=TOOL_PROFILES[this.equippedToolId]?.kind==='pickaxe'&&this.world.hydrology?.environment.clearSurface(x,y,z,'pickaxe');
      changed=iceRemoved||this.breakAt(x,y,z);
      // The saw can fell an accessible, vertical trunk (max 8 sections).
      if(changed && this.equippedToolId==='saw') {
        for(let h=1;h<8;h++){
          const id=this.world.getBlock(x,y+h,z)?.id;
          if(id!==6 && id!==11)break;
          if(!this.breakAt(x,y+h,z))break;
        }
      }
    }
    if(changed) this.animateSwing();
  }

  /**
   * Returns player position in a readable string form
   * @returns {string}
   */
  toString() {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}
