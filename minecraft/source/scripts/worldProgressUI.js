import { DAY_MS, formatGameTime } from './dayNight.js';
import { t, onLanguageChange, getLanguage } from './i18n.js';

const DISPLAY_STATS = [
  ['statsBlocksPlaced','blocksPlaced'], ['statsBlocksBroken','blocksBroken'],
  ['statsDistance','distanceMeters'], ['statsCrafted','itemsCrafted'],
  ['statsAnimals','animalsHarvested'], ['statsSpecies','speciesSeen'],
  ['statsNights','nightsSlept']
];

export function setupWorldProgressUI(saves, player){
  const dayNode=document.getElementById('game-day');
  const hourNode=document.getElementById('game-time');
  const icon=document.getElementById('world-time-icon');
  const grid=document.getElementById('progress-grid');
  const overlay=document.getElementById('overlay');
  const nodes = DISPLAY_STATS.map(([label,key])=>{
    const item=document.createElement('div');item.className='progress-stat';
    const caption=document.createElement('span');caption.dataset.i18n=label;caption.textContent=t(label);
    const value=document.createElement('strong');value.textContent='0';
    item.append(caption,value);grid.append(item);
    return { key,caption,value };
  });
  let lastWorld=null,lastStats='',lastTime='';
  const draw=()=>{
    if(!saves.index)return;
    const clock=saves.dayNight.snapshot();
    dayNode.textContent=String(clock.day);
    const hour=formatGameTime(clock);
    hourNode.textContent=hour;
    const hourFloat=clock.timeMs/DAY_MS*24;
    icon.textContent=hourFloat>=6&&hourFloat<18 ? '☀' : hourFloat>=18&&hourFloat<20 ? '◐' : '☾';
    const activeId=saves.currentWorld()?.id;
    if(overlay.hidden)return;
    const progress=saves.progress.snapshot();
    const sig=JSON.stringify(progress);
    if(lastWorld===activeId && sig===lastStats && lastTime===getLanguage())return;
    lastWorld=activeId;lastStats=sig;lastTime=getLanguage();
    for(const item of nodes){
      item.caption.textContent=t(DISPLAY_STATS.find(([k,v])=>v===item.key)[0]);
      const n=progress[item.key];
      item.value.textContent=item.key==='speciesSeen' ? `${n.length} / 4` : item.key==='distanceMeters'
        ? `${Math.floor(n).toLocaleString(getLanguage())} m` : n.toLocaleString(getLanguage());
    }
  };
  const previous=saves.onWorldsChange;
  saves.onWorldsChange=(worlds)=>{previous(worlds);lastWorld=null;draw();};
  onLanguageChange(()=>{lastTime='';draw();});
  player.controls.addEventListener('unlock',draw);
  setInterval(draw,1000);
  draw();
}
