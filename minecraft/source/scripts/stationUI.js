import { ITEM_BY_ID } from './inventory.js';
import { getStation, placeInStation, takeFromStation, canStartFurnace, startFurnace } from './stations.js';
import { t, onLanguageChange } from './i18n.js';

export function setupStationUI(player,saves,world){
  const overlay=document.getElementById('station-overlay');
  const title=document.getElementById('station-title');
  const content=document.getElementById('station-content');
  const bag=document.getElementById('station-inventory');
  const hint=document.getElementById('station-help');
  const close=document.getElementById('station-close');
  let station=null;
  let activeKey=null;
  let picked=null;
  let lastWorldType=world.type;
  const name=id=>t(ITEM_BY_ID[id]?.nameKey||`block${id}`);
  function icon(stack){
    const img=document.createElement('img');img.className='item-icon';
    img.src=`textures/${ITEM_BY_ID[stack.id]?.icon||'stone.png'}`;img.alt='';
    return img;
  }
  function slot(stack,label,onClick,selected=false){
    const node=document.createElement('button');node.type='button';node.className=`stack-slot station-slot${selected?' picked':''}`;
    node.title=stack?`${name(stack.id)} × ${stack.count}`:label;
    if(stack){node.append(icon(stack));const count=document.createElement('span');count.className='stack-count';count.textContent=stack.count;node.append(count);}
    else{const desc=document.createElement('small');desc.textContent=label;node.append(desc);}
    node.addEventListener('click',event=>onClick(event));return node;
  }
  function update(){
    if(!station || !player.stationVisible)return;
    title.textContent=t(station.kind==='chest'?'chestTitle':'furnaceTitle');
    bag.replaceChildren();content.replaceChildren();
    for(let i=0;i<36;i++){
      const stack=player.inventory.getSlot(i);
      bag.append(slot(stack,`${i+1}`,()=>{
        if(picked===i){
          // Double click the chosen inventory slot to transfer to first chest gap.
          if(station.kind==='chest'){
            const target=station.slots.findIndex(s=>!s||String(s.id)===String(stack?.id) && s.count+stack.count<=(ITEM_BY_ID[stack.id]?.maxStack||64));
            if(target>=0 && stack && placeInStation(player.inventory,station,i,target,stack.count))saves.markDirty();
          }
          picked=null;
        }else picked=i;
        update();
      },picked===i));
    }
    if(station.kind==='chest'){
      const grid=document.createElement('div');grid.className='inventory-grid';
      for(let i=0;i<27;i++)grid.append(slot(station.slots[i],`${i+1}`,(event)=>{
        let ok=false;
        if(picked!==null && player.inventory.getSlot(picked))
          ok=placeInStation(player.inventory,station,picked,i,event.shiftKey?player.inventory.getSlot(picked).count:1);
        else ok=takeFromStation(player.inventory,station,i);
        if(!ok)saves.showStatus('inventoryFull',true);
        else saves.markDirty();
        picked=null;update();
      }));
      content.append(grid);
      hint.textContent=t('chestHelp');
    }else{
      const controls=document.createElement('div');controls.className='furnace-slots';
      for(const [key,labelKey] of [['input','furnaceInput'],['fuel','furnaceFuel'],['output','furnaceOutput']]){
        const column=document.createElement('div');column.className='station-cell';
        const caption=document.createElement('span');caption.textContent=t(labelKey);
        column.append(caption,slot(station[key],t(labelKey),event=>{
          let ok=false;
          if(picked!==null && key!=='output' && player.inventory.getSlot(picked))
            ok=placeInStation(player.inventory,station,picked,key,event.shiftKey?player.inventory.getSlot(picked).count:1);
          else ok=takeFromStation(player.inventory,station,key);
          if(!ok)saves.showStatus('stationActionFailed',true);
          else saves.markDirty();
          picked=null;update();
        }));controls.append(column);
      }
      content.append(controls);
      const progress=document.createElement('p');
      progress.className='station-progress';
      progress.textContent=station.processing?`${t('smelting')} ${Math.round(100*(1-station.processing.remainingMs/3000))}%`:t('furnaceIdle');
      content.append(progress);
      const action=document.createElement('button');action.type='button';action.className='game-button primary';action.textContent=t('startSmelting');
      action.disabled=!canStartFurnace(station);
      action.addEventListener('click',()=>{if(startFurnace(station))saves.markDirty();update();});
      content.append(action);
      hint.textContent=t('furnaceHelp');
    }
  }
  function closeStation(resume=true){
    if(!player.stationVisible)return;
    player.stationVisible=false;overlay.hidden=true;station=null;activeKey=null;picked=null;
    if(resume)player.controls.lock();else document.getElementById('overlay').hidden=false;
  }
  player.onInteract=(blockId,coords)=>{
    station=getStation(world,coords.x,coords.y,coords.z,blockId);
    activeKey=`${coords.x},${coords.y},${coords.z}`;picked=null;
    player.stationVisible=true;
    if(player.controls.isLocked)player.controls.unlock();
    else{overlay.hidden=false;document.getElementById('overlay').hidden=true;}
    update();
  };
  close.addEventListener('click',()=>closeStation(true));
  document.getElementById('station-back-menu').addEventListener('click',()=>closeStation(false));
  document.addEventListener('keydown',e=>{if(e.code==='Escape' && player.stationVisible && !player.controls.isLocked)closeStation(false);});
  onLanguageChange(update);
  const renderInterval=setInterval(()=>{
    if(!player.stationVisible)return;
    // Active stations disappear upon a change of world, never copy storage across worlds.
    if(world.type!==lastWorldType || world.stations?.[activeKey]!==station){closeStation(false);lastWorldType=world.type;return;}
    update();
  },250);
  return {update,closeStation,renderInterval};
}
