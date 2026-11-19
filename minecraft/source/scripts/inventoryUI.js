import { ITEM_CATALOG, ITEM_BY_ID, RECIPES, HOTBAR_SIZE, INVENTORY_SIZE } from './inventory.js';
import { t, onLanguageChange } from './i18n.js';
import { TOOL_PROFILES, OBJECT_BLOCK_IDS, isTool, isObjectBlock } from './toolProfiles.js';

const imageFor = id => {
  const img=document.createElement('img');
  img.className='item-icon'; img.src=`textures/${ITEM_BY_ID[id]?.icon || 'stone.png'}`;
  img.alt='';img.draggable=false;return img;
};
export function setupInventoryUI(player,saves){
  const inventory=player.inventory;
  const hotbar=document.getElementById('toolbar');
  const bag=document.getElementById('inventory-main-slots');
  const slots=document.getElementById('inventory-slots');
  const craftGrid=document.getElementById('crafting-grid');
  const craftOutput=document.getElementById('crafting-output');
  const recipeBook=document.getElementById('recipe-book');
  const creativeCatalog=document.getElementById('creative-catalog');
  const creativeHeading=document.getElementById('creative-heading');
  const fillStarter=document.getElementById('fill-starter-bar');
  const reserveBox=document.getElementById('inventory-reserve');
  const current=document.getElementById('current-block');
  const equipmentTools=document.getElementById('equipment-tools');
  const equipmentObjects=document.getElementById('equipment-objects');
  const selectedExtra=document.getElementById('selected-extra');
  const mode=document.getElementById('game-mode-select');
  const craftingSize=document.getElementById('craft-size');
  const craftHint=document.getElementById('craft-hint');
  let picked=null;

  const name=id=>t(ITEM_BY_ID[id]?.nameKey||`block${id}`);
  function slotButton(stack,index,isHud=false){
    const button=document.createElement('button');button.type='button';
    button.className=`stack-slot${index===inventory.selectedSlot&&!player.mineMode?' equipped':''}${index===picked?' picked':''}`;
    button.title=stack?`${name(stack.id)} × ${stack.count}`:t('emptySlot');
    button.dataset.index=String(index);
    if(stack){button.append(imageFor(stack.id));const count=document.createElement('span');
      count.className='stack-count';count.textContent=inventory.mode==='creative'&&isHud?'∞':String(stack.count);
      button.append(count);}
    if(index<HOTBAR_SIZE){const n=document.createElement('span');n.className='slot-key';n.textContent=String(index+1);button.append(n);}
    if(isHud){button.addEventListener('click',()=>{player.selectHotbar(index);});}
    else{
      button.draggable=!!stack;
      button.addEventListener('click',()=>{
        if(picked!==null&&picked!==index){inventory.moveSlot(picked,index);picked=null;}
        else if(picked===index)picked=null;
        else if(stack)picked=index;
        if(index<HOTBAR_SIZE)player.selectHotbar(index);
        render();
      });
      button.addEventListener('contextmenu',event=>{
        event.preventDefault();
        if(picked!==null&&picked!==index){inventory.moveSlot(picked,index,true);picked=null;}
        else if(stack){picked=index;}
        render();
      });
      button.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain',String(index));event.dataTransfer.effectAllowed='move';});
      button.addEventListener('dragover',event=>event.preventDefault());
      button.addEventListener('drop',event=>{event.preventDefault();const from=Number(event.dataTransfer.getData('text/plain'));
        if(Number.isInteger(from))inventory.moveSlot(from,index);picked=null;render();});
    }
    return button;
  }
  function render(){
    mode.value=inventory.mode;
    const selected=inventory.getSelected();
    current.textContent=player.mineMode ? `${t('toolSelectionHint')}: ${t(TOOL_PROFILES[player.equippedToolId]?.nameKey||'toolBasicPickaxe')}` : `${t('selectedObject')}: ${selected?name(selected.id):t('emptyHand')}`;
    selectedExtra.hidden=false;
    selectedExtra.textContent=`${current.textContent} · ${t('rightObjectTitle')}: ${name(player.rightObjectId)}`;
    hotbar.replaceChildren();slots.replaceChildren();bag.replaceChildren();
    const pick=document.createElement('button');pick.type='button';
    pick.className=`stack-slot pick-tool-slot${player.mineMode?' equipped':''}`;pick.title=t('mineModeSelected');
    pick.append(imageFor(player.equippedToolId==='basic_pickaxe'?'stone_pickaxe':player.equippedToolId));
    const zero=document.createElement('span');zero.className='slot-key';zero.textContent='0';pick.append(zero);
    pick.addEventListener('click',()=>player.selectPickaxe());hotbar.append(pick);
    equipmentTools.replaceChildren(); equipmentObjects.replaceChildren();
    const toolIds=Object.keys(TOOL_PROFILES);
    for(const id of toolIds){
      const b=document.createElement('button');b.type='button';
      b.className=`equipment-choice${player.equippedToolId===id?' active':''}`;
      b.title=t(TOOL_PROFILES[id].nameKey);
      b.disabled=id!=='basic_pickaxe'&&!inventory.has(id);
      b.append(imageFor(id==='basic_pickaxe'?'stone_pickaxe':id));
      const label=document.createElement('span');label.textContent=t(TOOL_PROFILES[id].nameKey);b.append(label);
      b.addEventListener('click',()=>{if(player.equipTool(id))render();});equipmentTools.append(b);
    }
    for(const id of OBJECT_BLOCK_IDS){
      const b=document.createElement('button');b.type='button';
      b.className=`equipment-choice${player.rightObjectId===id?' active':''}`;
      b.title=name(id);b.disabled=!inventory.has(id);
      b.append(imageFor(id));
      const label=document.createElement('span');label.textContent=name(id);b.append(label);
      b.addEventListener('click',()=>{if(player.selectRightObject(id))render();});equipmentObjects.append(b);
    }
    for(let i=0;i<INVENTORY_SIZE;i++){
      const stack=inventory.getSlot(i);
      if(i<9){hotbar.append(slotButton(stack,i,true));slots.append(slotButton(stack,i));}
      else bag.append(slotButton(stack,i));
    }
    creativeHeading.hidden=inventory.mode!=='creative';
    fillStarter.hidden=inventory.mode!=='creative';
    creativeCatalog.hidden=inventory.mode!=='creative';
    creativeCatalog.replaceChildren();
    if(inventory.mode==='creative')for(const item of ITEM_CATALOG){
      const button=document.createElement('button');button.type='button';button.className='catalog-item';
      button.title=name(item.id);button.append(imageFor(item.id));
      button.addEventListener('click',()=>{
        if(isTool(item.id)){player.equipTool(item.id);return;}
        if(isObjectBlock(item.id)){player.selectRightObject(item.id);return;}
        inventory.assignCreative(item.id);player.selectHotbar(inventory.selectedSlot);
      });
      creativeCatalog.append(button);
    }
    reserveBox.replaceChildren();
    const reserved=Object.entries(inventory.reserve);
    reserveBox.hidden=!reserved.length;
    if(reserved.length){
      const heading=document.createElement('p');heading.textContent=t('reserveLabel');reserveBox.append(heading);
      for(const [id,count] of reserved){
        const row=document.createElement('div');row.className='reserve-row';
        row.append(imageFor(id));
        const label=document.createElement('span');label.textContent=`${name(id)} × ${count}`;
        const action=document.createElement('button');action.type='button';action.className='small-button';
        action.textContent=t('claimReserve');action.disabled=!inventory.canAccept(id,1);
        action.addEventListener('click',()=>inventory.reclaim(id));
        row.append(label,action);reserveBox.append(row);
      }
    }
    craftingSize.value=String(inventory.craftSize);
    const hasTable=inventory.mode==='creative'||inventory.count(18)>0||inventory.workbenchAccess;
    craftingSize.querySelector('option[value="3"]').disabled=!hasTable;
    craftHint.textContent=hasTable?t('craftHint'):t('craftRequiresTable');
    craftGrid.replaceChildren();
    const indices=inventory.craftSize===2?[0,1,3,4]:[0,1,2,3,4,5,6,7,8];
    craftGrid.className=`craft-grid size-${inventory.craftSize}`;
    for(const cell of indices){
      const stack=inventory.craftGrid[cell];
      const button=document.createElement('button');button.type='button';button.className='stack-slot craft-cell';
      button.title=stack?`${name(stack.id)} × ${stack.count}`:t('emptySlot');
      if(stack){button.append(imageFor(stack.id));const qty=document.createElement('span');qty.className='stack-count';qty.textContent=String(stack.count);button.append(qty);}
      button.addEventListener('click',event=>{
        if(picked!==null)inventory.putInCraft(picked,cell,!event.shiftKey);
        else inventory.takeFromCraft(cell);
        render();
      });
      button.addEventListener('contextmenu',event=>{event.preventDefault();
        if(picked!==null)inventory.putInCraft(picked,cell,true);
        else inventory.takeFromCraft(cell,true);
        render();
      });
      button.addEventListener('dragover',event=>event.preventDefault());
      button.addEventListener('drop',event=>{event.preventDefault();const from=Number(event.dataTransfer.getData('text/plain'));
        if(Number.isInteger(from))inventory.putInCraft(from,cell,!!event.shiftKey);render();});
      craftGrid.append(button);
    }
    craftOutput.replaceChildren();
    const recipe=inventory.getRecipe();
    if(recipe){craftOutput.append(imageFor(recipe.output));
      const label=document.createElement('span');label.textContent=`${name(recipe.output)} × ${recipe.count}`;craftOutput.append(label);}
    else craftOutput.textContent=t('craftEmpty');
    craftOutput.disabled=!recipe||!inventory.canAccept(recipe?.output,recipe?.count);
    document.getElementById('crafting-recipe-help').textContent=t('craftingGridHelp');
    recipeBook.replaceChildren();
    for(const recipe of RECIPES){
      const item=document.createElement('button');item.type='button';item.className='recipe-book-item';
      item.title=`${name(recipe.output)} × ${recipe.count}`;
      item.append(imageFor(recipe.output));
      const label=document.createElement('span');label.textContent=`${name(recipe.output)} × ${recipe.count}`;item.append(label);
      const dimensions=Math.max(recipe.pattern.length,...recipe.pattern.map(row=>row.length));
      if(dimensions>inventory.craftSize)item.disabled=true;
      else item.disabled=!inventory.canFillRecipe(recipe);
      item.addEventListener('click',()=>{if(inventory.fillRecipe(recipe.id))render();});
      recipeBook.append(item);
    }
  }
  craftOutput.addEventListener('click',()=>{if(inventory.craft())saves.showStatus('crafted');render();});
  craftingSize.addEventListener('change',()=>{if(!inventory.setCraftSize(Number(craftingSize.value)))saves.showStatus('craftGridNotEmpty',true);render();});
  mode.addEventListener('change',()=>{inventory.setMode(mode.value);render();});
  fillStarter.addEventListener('click',()=>inventory.fillCreativeHotbar());
  document.getElementById('open-inventory').addEventListener('click',()=>player.openInventory());
  document.getElementById('inventory-close').addEventListener('click',()=>player.closeInventory(false));
  document.getElementById('inventory-resume').addEventListener('click',()=>player.closeInventory(true));
  document.addEventListener('keydown',event=>{
    if(event.code==='Escape'&&player.inventoryVisible&&!player.controls.isLocked)player.closeInventory(false);
  });
  document.addEventListener('wheel',event=>{
    if(!player.controls.isLocked||!event.deltaY)return;
    event.preventDefault();const step=event.deltaY>0?1:-1;
    player.selectHotbar((inventory.selectedSlot+step+9)%9);
  },{passive:false});
  document.addEventListener('minecraft-selection-change',render);
  onLanguageChange(render);
  const original=inventory.onChange;
  inventory.onChange=()=>{original();player.syncSelectedSlot();render();};
  player.syncSelectedSlot();render();
  return {render};
}
