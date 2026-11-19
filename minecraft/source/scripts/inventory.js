// Data-only inventory model. A stack contains an item ID and an amount;
// block IDs and non-placeable object IDs share the same catalogue.
export const ITEM_CATALOG = Object.freeze([
  ...[
    [1,'grass.png'],[2,'dirt.png'],[3,'stone.png'],[4,'coal_ore.png'],
    [5,'iron_ore.png'],[6,'tree_top.png'],[7,'leaves.png'],[8,'sand.png'],
    [10,'snow.png'],[11,'jungle_tree_top.png'],[12,'jungle_leaves.png'],
    [13,'cactus_side.png'],[14,'grass.png'],[15,'planks.png'],
    [16,'stone_bricks.png'],[17,'glass.png'],[18,'crafting_table.png'],
    [19,'basalt.png'],[20,'snow_leaves.png'],
    [21,'torch.png'],[22,'bookshelf.png'],[23,'bed.png'],[24,'table.png'],
    [25,'chest.png'],[26,'furnace.png'],[27,'deepslate.png'],[28,'glass.png']
  ].map(([id,icon]) => ({id, blockId:id, icon, maxStack:64, nameKey:`block${id}`})),
  {id:'stick',icon:'stick.png',maxStack:64,nameKey:'itemStick'},
  {id:'coal',icon:'coal.png',maxStack:64,nameKey:'itemCoal'},
  {id:'raw_iron',icon:'raw_iron.png',maxStack:64,nameKey:'itemRawIron'},
  {id:'fabric',icon:'fabric.png',maxStack:64,nameKey:'itemFabric'},
  {id:'paper',icon:'paper.png',maxStack:64,nameKey:'itemPaper'},
  {id:'book',icon:'book.png',maxStack:64,nameKey:'itemBook'},
  {id:'iron_ingot',icon:'iron_ingot.png',maxStack:64,nameKey:'itemIronIngot'},
  {id:'charcoal',icon:'coal.png',maxStack:64,nameKey:'itemCharcoal'},
  {id:'wool',icon:'wool.png',maxStack:64,nameKey:'itemWool'},
  {id:'raw_meat',icon:'raw_meat.png',maxStack:64,nameKey:'itemRawMeat'},
  {id:'cooked_meat',icon:'cooked_meat.png',maxStack:64,nameKey:'itemCookedMeat'},
  {id:'wood_pickaxe',icon:'wood_pickaxe.png',maxStack:1,nameKey:'itemWoodPickaxe',toolLevel:1},
  {id:'stone_pickaxe',icon:'stone_pickaxe.png',maxStack:1,nameKey:'itemStonePickaxe',toolLevel:2},
  {id:'iron_pickaxe',icon:'iron_pickaxe.png',maxStack:1,nameKey:'itemIronPickaxe',toolLevel:3},
  {id:'saw',icon:'saw.png',maxStack:1,nameKey:'itemSaw',toolLevel:0},
  {id:'sword',icon:'sword.png',maxStack:1,nameKey:'itemSword',toolLevel:0}
]);
export const ITEM_IDS = new Set(ITEM_CATALOG.map(item => String(item.id)));
export const INVENTORY_BLOCK_IDS = Object.freeze(ITEM_CATALOG.filter(item => item.blockId).map(item => item.id));
export const ITEM_BY_ID = Object.freeze(Object.fromEntries(ITEM_CATALOG.map(item => [item.id,item])));
export const HOTBAR_SIZE = 9;
export const CREATIVE_HOTBAR_IDS = Object.freeze([1,2,3,6,8,10,15,16,17]);
export const INVENTORY_SIZE = 36;
const copy = stack => stack ? {id:stack.id,count:stack.count} : null;
const isItem = id => ITEM_IDS.has(String(id));
const stackLimit = id => ITEM_BY_ID[id]?.maxStack ?? 64;
const validStack = value => value && typeof value === 'object' && !Array.isArray(value) &&
  isItem(value.id) && Number.isInteger(value.count) && value.count >= 1 && value.count <= stackLimit(value.id);
const sameId = (a,b) => a && b && String(a.id) === String(b.id);
const pattern = (...rows) => rows;
// Only NEW worlds receive the quickbar. Loading an existing world never
// overwrites its layout (including older empty inventories).
export function createStartingInventory(mode='creative', starterKit=true) {
  const normalized = mode === 'survival' ? 'survival' : 'creative';
  const slots = Array(INVENTORY_SIZE).fill(null);
  const items = normalized === 'creative'
    ? CREATIVE_HOTBAR_IDS.map(id=>[id,ITEM_BY_ID[id].maxStack])
    : starterKit ? [['wood_pickaxe',1],[6,8],[15,16],[21,8],[2,16],[18,1]] : [];
  items.forEach(([id,count],index) => { slots[index] = {id,count}; });
  return {mode:normalized,slots,selectedSlot:0,craftSize:2,craftGrid:Array(9).fill(null),reserve:{}};
}

export const RECIPES = Object.freeze([
  {id:'planks',pattern:pattern([6]),output:15,count:4},
  {id:'junglePlanks',pattern:pattern([11]),output:15,count:4},
  {id:'sticks',pattern:pattern([15],[15]),output:'stick',count:4},
  {id:'craftingTable',pattern:pattern([15,15],[15,15]),output:18,count:1},
  {id:'stoneBricks',pattern:pattern([3,3],[3,3]),output:16,count:4},
  {id:'woodPickaxe',pattern:pattern([15,15,15],[null,'stick',null],[null,'stick',null]),output:'wood_pickaxe',count:1},
  {id:'stonePickaxe',pattern:pattern([3,3,3],[null,'stick',null],[null,'stick',null]),output:'stone_pickaxe',count:1},
  {id:'ironPickaxe',pattern:pattern(['iron_ingot','iron_ingot','iron_ingot'],[null,'stick',null],[null,'stick',null]),output:'iron_pickaxe',count:1},
  {id:'saw',pattern:pattern(['iron_ingot','iron_ingot'],['stick',null]),output:'saw',count:1},
  {id:'sword',pattern:pattern([null,'iron_ingot',null],[null,'iron_ingot',null],[null,'stick',null]),output:'sword',count:1},
  {id:'torches',pattern:pattern(['coal'],['stick']),output:21,count:4},
  // Accessible simplified recipes until sheep, sugar cane, and leather exist.
  {id:'fabric',pattern:pattern([7,7],[7,7]),output:'fabric',count:2},
  {id:'jungleFabric',pattern:pattern([12,12],[12,12]),output:'fabric',count:2},
  {id:'paper',pattern:pattern([7,7,7]),output:'paper',count:3},
  {id:'junglePaper',pattern:pattern([12,12,12]),output:'paper',count:3},
  {id:'book',pattern:pattern(['paper','paper','paper'],[null,15,null]),output:'book',count:1},
  {id:'bookshelf',pattern:pattern([15,15,15],['book','book','book'],[15,15,15]),output:22,count:1},
  {id:'bed',pattern:pattern(['fabric','fabric','fabric'],[15,15,15]),output:23,count:1},
  {id:'table',pattern:pattern([15,15,15],['stick',null,'stick'],['stick',null,'stick']),output:24,count:1},
  {id:'chest',pattern:pattern([15,15,15],[15,null,15],[15,15,15]),output:25,count:1},
  {id:'furnace',pattern:pattern([3,3,3],[3,null,3],[3,3,3]),output:26,count:1}
]);

export class Inventory {
  constructor(onChange=()=>{}) {
    this.onChange = onChange;
    this.onCraft = () => {};
    this.mode = 'creative';
    this.slots = Array(INVENTORY_SIZE).fill(null);
    this.selectedSlot = 0;
    this.craftSize = 2;
    this.craftGrid = Array(9).fill(null);
    this.reserve={};
    this.workbenchAccess=false;
  }
  notify(){ this.onChange(); }
  setMode(mode){
    if (mode !== 'creative' && mode !== 'survival') return false;
    this.mode=mode; this.notify(); return true;
  }
  getSlot(index){ return Number.isInteger(index) && index >= 0 && index < INVENTORY_SIZE ? copy(this.slots[index]) : null; }
  getSelected(){ return this.getSlot(this.selectedSlot); }
  select(index){ if(!Number.isInteger(index)||index<0||index>=HOTBAR_SIZE)return false; this.selectedSlot=index; this.notify(); return true; }
  count(id){ return this.slots.reduce((sum,stack)=>sum+(stack && String(stack.id)===String(id)?stack.count:0),0); }
  has(id,amount=1){ return this.mode==='creative' || this.count(id)>=amount; }
  canAccept(id,amount=1){
    if(!isItem(id)||!Number.isInteger(amount)||amount<1)return false;
    const available=this.slots.reduce((n,stack)=>n+(stack?String(stack.id)===String(id)?stackLimit(id)-stack.count:0:stackLimit(id)),0);
    return available>=amount;
  }
  add(id,amount=1){
    if(!isItem(id)||!Number.isInteger(amount)||amount<1||!this.canAccept(id,amount))return false;
    let left=amount;
    for(let i=0;i<INVENTORY_SIZE&&left;i++){
      const stack=this.slots[i];
      if(stack&&String(stack.id)===String(id)){
        const taken=Math.min(left,stackLimit(id)-stack.count);
        stack.count+=taken;left-=taken;
      }
    }
    for(let i=0;i<INVENTORY_SIZE&&left;i++){
      if(this.slots[i]===null){
        const taken=Math.min(left,stackLimit(id));
        this.slots[i]={id,count:taken};left-=taken;
      }
    }
    this.notify();return true;
  }
  consume(id,amount=1){
    if(this.mode==='creative')return true;
    if(!Number.isInteger(amount)||amount<1||this.count(id)<amount)return false;
    let left=amount;
    // Consume from the last slots to minimize changes to the hotbar.
    for(let i=INVENTORY_SIZE-1;i>=0&&left;i--){
      const stack=this.slots[i];
      if(stack&&String(stack.id)===String(id)){
        const taken=Math.min(left,stack.count);
        stack.count-=taken;left-=taken;
        if(!stack.count)this.slots[i]=null;
      }
    }
    this.notify();return true;
  }
  consumeSelected(){
    if(this.mode==='creative')return true;
    const stack=this.slots[this.selectedSlot];
    if(!stack)return false;
    stack.count--;
    if(!stack.count)this.slots[this.selectedSlot]=null;
    this.notify();return true;
  }
  moveSlot(from,to,split=false){
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=36||to>=36||from===to||!this.slots[from])return false;
    const a=this.slots[from],b=this.slots[to];
    if(split){
      const n=Math.ceil(a.count/2);
      if(b && !sameId(a,b))return false;
      const taken=Math.min(n,b?stackLimit(a.id)-b.count:n);
      if(taken<1)return false;
      if(!b)this.slots[to]={id:a.id,count:taken};else b.count+=taken;
      a.count-=taken;if(!a.count)this.slots[from]=null;
    } else if(sameId(a,b)){
      const moved=Math.min(a.count,stackLimit(a.id)-b.count);
      if(!moved)return false;
      b.count+=moved;a.count-=moved;if(!a.count)this.slots[from]=null;
    } else [this.slots[from],this.slots[to]]=[b,a];
    this.notify();return true;
  }
  fillCreativeHotbar(){
    if(this.mode!=='creative')return false;
    let filled=false;
    for(let i=0;i<HOTBAR_SIZE;i++){
      if(this.slots[i]===null){
        const id=CREATIVE_HOTBAR_IDS[i];
        this.slots[i]={id,count:stackLimit(id)};
        filled=true;
      }
    }
    if(filled)this.notify();
    return filled;
  }
  assignCreative(id,index=this.selectedSlot){
    if(this.mode!=='creative'||!isItem(id)||!Number.isInteger(index)||index<0||index>=HOTBAR_SIZE)return false;
    this.slots[index]={id,count:stackLimit(id)};this.notify();return true;
  }
  setCraftSize(size){
    if(size!==2&&size!==3)return false;
    if(size===3&&this.mode!=='creative'&&this.count(18)<1&&!this.workbenchAccess)return false;
    if(size===2&&this.craftGrid.some((s,i)=>s&&![0,1,3,4].includes(i)))return false;
    this.craftSize=size;this.notify();return true;
  }
  putInCraft(from,cell,one=true){
    if(!Number.isInteger(from)||from<0||from>=36||![0,1,3,4,2,5,6,7,8].includes(cell))return false;
    if(this.craftSize===2&&![0,1,3,4].includes(cell))return false;
    const stack=this.slots[from],target=this.craftGrid[cell];
    if(!stack||(target&&!sameId(stack,target))||target?.count===stackLimit(stack.id))return false;
    const amount=one?1:Math.min(stack.count,stackLimit(stack.id)-(target?.count||0));
    if(target)target.count+=amount;else this.craftGrid[cell]={id:stack.id,count:amount};
    stack.count-=amount;if(!stack.count)this.slots[from]=null;
    this.notify();return true;
  }
  takeFromCraft(cell,one=false){
    const stack=this.craftGrid[cell];if(!stack)return false;
    const amount=one?1:stack.count;
    if(!this.canAccept(stack.id,amount))return false;
    stack.count-=amount;if(!stack.count)this.craftGrid[cell]=null;
    this.add(stack.id,amount);return true;
  }
  returnCraftGrid(){
    // No loss on closing the inventory: if full, keep the material in the grid for later.
    let all=true;
    for(let i=0;i<9;i++)if(this.craftGrid[i]){
      const stack=this.craftGrid[i];
      if(this.canAccept(stack.id,stack.count)){this.craftGrid[i]=null;this.add(stack.id,stack.count);}
      else all=false;
    }
    this.notify();return all;
  }
  getRecipe(){
    const filled=[];
    for(let y=0;y<this.craftSize;y++)for(let x=0;x<this.craftSize;x++){
      const cell=this.craftGrid[y*3+x];if(cell)filled.push({x,y,id:cell.id});
    }
    if(!filled.length)return null;
    const minX=Math.min(...filled.map(p=>p.x)),maxX=Math.max(...filled.map(p=>p.x));
    const minY=Math.min(...filled.map(p=>p.y)),maxY=Math.max(...filled.map(p=>p.y));
    const shape=[];
    for(let y=minY;y<=maxY;y++){
      const row=[];
      for(let x=minX;x<=maxX;x++)row.push(this.craftGrid[y*3+x]?.id??null);
      shape.push(row);
    }
    return RECIPES.find(r=>r.pattern.length===shape.length&&r.pattern.every((row,y)=>
      row.length===shape[y].length&&row.every((id,x)=>String(id)===String(shape[y][x]))))||null;
  }
  craft(){
    const recipe=this.getRecipe();if(!recipe||!this.canAccept(recipe.output,recipe.count))return false;
    for(let i=0;i<9;i++)if(this.craftGrid[i]){
      const stack=this.craftGrid[i];if(--stack.count===0)this.craftGrid[i]=null;
    }
    this.add(recipe.output,recipe.count);
    this.onCraft(recipe);return true;
  }
  canFillRecipe(recipe){
    if(!recipe || this.craftGrid.some(Boolean))return false;
    if(recipe.pattern.length>this.craftSize || recipe.pattern.some(row=>row.length>this.craftSize))return false;
    const needed={};
    for(const row of recipe.pattern)for(const id of row)if(id!==null)needed[id]=(needed[id]||0)+1;
    return this.mode==='creative'||Object.entries(needed).every(([id,count])=>this.count(id)>=count);
  }
  fillRecipe(recipeId){
    const recipe=RECIPES.find(r=>r.id===recipeId);
    if(!this.canFillRecipe(recipe))return false;
    for(let y=0;y<recipe.pattern.length;y++)for(let x=0;x<recipe.pattern[y].length;x++){
      const id=recipe.pattern[y][x];
      if(id===null)continue;
      if(this.mode!=='creative')this.consume(id,1);
      this.craftGrid[y*3+x]={id,count:1};
    }
    this.notify();return true;
  }
  reclaim(id){
    if(!isItem(id)||!this.reserve[String(id)])return false;
    const available=this.slots.reduce((sum,stack)=>sum+(stack?String(stack.id)===String(id)?stackLimit(id)-stack.count:0:stackLimit(id)),0);
    if(available<1)return false;
    const taken=Math.min(this.reserve[String(id)],available,stackLimit(id));
    if(!this.add(id,taken))return false;
    this.reserve[String(id)]-=taken;
    if(!this.reserve[String(id)])delete this.reserve[String(id)];
    this.notify();return true;
  }
  // A v3 snapshot stores precise slot positions; older v2 saves store aggregated block counts.
  snapshot(){return {mode:this.mode,slots:this.slots.map(copy),selectedSlot:this.selectedSlot,craftSize:this.craftSize,craftGrid:this.craftGrid.map(copy),reserve:{...this.reserve}};}
  restore(raw={}){
    this.mode=raw.mode==='survival'?'survival':'creative';
    this.slots=Array(INVENTORY_SIZE).fill(null);
    this.reserve={};
    this.workbenchAccess=false;
    if(raw.reserve&&typeof raw.reserve==='object')for(const [id,n] of Object.entries(raw.reserve)){if(isItem(id)&&Number.isSafeInteger(n)&&n>0)this.reserve[id]=n;}
    if(Array.isArray(raw.slots)){
      raw.slots.slice(0,36).forEach((stack,i)=>{if(validStack(stack))this.slots[i]=copy(stack);});
    }else if(raw.items && typeof raw.items==='object'){
      // Legacy migration; preserve all counts by splitting into stacks <=64.
      for(const [key,value] of Object.entries(raw.items)){
        const id=/^\d+$/.test(key)?Number(key):key;
        if(!isItem(id)||!Number.isInteger(value)||value<1)continue;
        let amount=Math.min(value,99999);
        for(let i=0;i<36&&amount;i++){
          if(!this.slots[i]){const n=Math.min(amount,stackLimit(id));this.slots[i]={id,count:n};amount-=n;}
        }
        if(amount)this.reserve[String(id)]=(this.reserve[String(id)]||0)+amount;
      }
    }
    this.selectedSlot=Number.isInteger(raw.selectedSlot)&&raw.selectedSlot>=0&&raw.selectedSlot<9?raw.selectedSlot:0;
    this.craftSize=raw.craftSize===3?3:2;
    this.craftGrid=Array(9).fill(null);
    if(Array.isArray(raw.craftGrid))raw.craftGrid.slice(0,9).forEach((stack,i)=>{if(validStack(stack))this.craftGrid[i]=copy(stack);});
    this.notify();
  }
}
