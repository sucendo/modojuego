'use strict';
/* HEXATEGOS 0.38.38 · Balance económico derivado.
   No genera mercancías ni altera inventarios: solo resume producción física
   y orienta la demanda, el comercio y la IA. Un cálculo por tick comercial. */
(() => {
  const BUILD='0.38.38';
  const KEYS=['food','raw','fuel','goods','military'];
  const LABELS=['Alimentos','Materias primas','Combustible','Bienes civiles','Material militar'];
  const GOODS_LABELS={
    oil:'Petróleo',gas:'Gas natural',coal:'Carbón',iron:'Hierro',copper:'Cobre',
    timber:'Madera',quarry:'Piedra',crops:'Cultivos',livestock:'Ganadería',
    plantfiber:'Fibras',wool:'Lana',hides:'Pieles',dairy:'Lácteos',
    fuel:'Combustible refinado',gasfuel:'Gas procesado',steel:'Acero',
    copperref:'Cobre refinado',lumber:'Madera elaborada',cement:'Cemento',
    textilebase:'Hilos y tejidos',leather:'Cuero',machinerygoods:'Maquinaria'
  };
  const HORIZON=18;  // segundos simulados; NO es un ritmo de producción ficticio
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let nations=[],revision=0,lastCycle=0,lastStats={nations:0,routes:0,cargo:0,industrialSites:0};
  const empty=()=>({stock:[0,0,0,0,0],prod:[0,0,0,0,0],demand:[0,0,0,0,0],
    balance:[0,0,0,0,0],surplus:[0,0,0,0,0],shortage:[0,0,0,0,0],
    pressure:[0,0,0,0,0],coverage:[0,0,0,0,0],imports:[0,0,0,0,0],
    exports:[0,0,0,0,0],materials:[],materialNeeds:[],nodes:0,industrialSites:0});
  const clean=x=>Math.max(0,Number(x)||0);
  function update({summaries=[],routes=[],campaignSeconds=0}={}){
    const total=Math.min(500,Math.max(0,summaries.length));
    const next=Array.from({length:total},empty);
    for(let f=0;f<total;f++){
      const source=summaries[f],dst=next[f];
      if(!source)continue;
      dst.nodes=clean(source.nodes);
      for(let i=0;i<5;i++){
        const stock=clean(source.stock?.[i]),cap=clean(source.cap?.[i]),
          production=clean(source.prod?.[i]),demand=clean(source.demand?.[i]);
        const coverage=cap>0?clamp(stock/cap,0,1):.55;
        dst.stock[i]=stock;dst.prod[i]=production;dst.demand[i]=demand;
        dst.coverage[i]=coverage;dst.balance[i]=production-demand;
        // Exportable only if it exists in stocks and covers local reserves.
        dst.surplus[i]=stock>cap*.63&&production>=demand*.75?
          stock-cap*.63:0;
        // A low stock with net imports necessary should drive demand.
        dst.shortage[i]=Math.max(0,cap*.48-stock)+
          Math.max(0,demand-production)*HORIZON;
        dst.pressure[i]=clamp(Math.max(0,(.70-coverage)/.70)*.70+
          (demand>0?Math.max(0,demand-production)/demand*.30:0),0,1);
      }
    }
    // Secondary materials are counted separately, never added to the
    // five legacy aggregates (doing so would double-count real stock).
    const stocks=window.HexategosProduction0388?.materialBalance?.();
    let industrialSites=0;
    if(stocks instanceof Map){
      for(const [nation,s] of stocks){
        const dest=next[nation];
        if(!dest)continue;
        dest.industrialSites=clean(s.sites);industrialSites+=dest.industrialSites;
        dest.materials=Object.entries(s.stock||{}).filter(([,v])=>v>0)
          .map(([key,v])=>({key,label:GOODS_LABELS[key]||key,stock:clean(v)}))
          .sort((a,b)=>b.stock-a.stock).slice(0,28);
        dest.materialNeeds=Object.entries(s.demand||{})
          .map(([key,rate])=>{
            const stock=clean(s.stock?.[key]);
            const demand=clean(rate);
            return {key,label:GOODS_LABELS[key]||key,stock,demand,
              shortage:Math.max(0,demand*HORIZON-stock)};
          }).filter(x=>x.demand>0)
          .sort((a,b)=>b.shortage-a.shortage).slice(0,28);
      }
    }
    let cargo=0,tradeRoutes=0;
    for(const r of routes){
      if(r.status==='closed'||r.status==='blocked'||r.status==='broken')continue;
      const a=next[r.a],b=next[r.b];
      if(!a||!b)continue;
      tradeRoutes++;
      const rates=Array.isArray(r.cargo03720)?r.cargo03720:[];
      const directions=Array.isArray(r.cargoDirection03720)?r.cargoDirection03720:[];
      for(let i=0;i<5;i++){
        const v=clean(rates[i]);if(!v)continue;
        cargo+=v;
        if(directions[i]<0){b.exports[i]+=v;a.imports[i]+=v}
        else{a.exports[i]+=v;b.imports[i]+=v}
      }
      for(const value of Object.values(r.productionCargo0388||{}))cargo+=clean(value);
    }
    nations=next;revision++;lastCycle=Number(campaignSeconds)||0;
    lastStats={nations:total,routes:tradeRoutes,cargo:+cargo.toFixed(3),
      industrialSites,revision};
    return lastStats;
  }
  function routeFactor(route){
    if(!route||route.status==='closed'||route.status==='blocked'||route.status==='broken')return 0;
    // Real shipped goods alone generate commercial route revenue.
    const aggregate=clean(route.cargoTotal03720);
    const specialized=Object.values(route.productionCargo0388||{}).reduce((a,v)=>a+clean(v),0);
    const total=aggregate+specialized;
    return total>0?clamp((.18+.82*(total/(total+.26))*1.55),0,1.15):0;
  }
  function nation(f){
    const n=nations[Number(f)];if(!n)return null;
    return {...n,...Object.fromEntries(
      ['stock','prod','demand','balance','surplus','shortage','pressure','coverage','imports','exports']
      .map(k=>[k,n[k].slice()])),
      materials:n.materials.map(x=>({...x})),
      materialNeeds:n.materialNeeds.map(x=>({...x}))};
  }
  function opportunity(f,partner){
    const a=nations[Number(f)],b=nations[Number(partner)];
    if(!a||!b||f===partner)return 0;
    let score=0;
    for(let i=0;i<3;i++){
      const allowed=window.HexategosStatecraft0380?.resourceTradeAllowed?.(partner,f,i);
      if(allowed===false)continue;
      const target=Math.max(.01,(a.stock[i]+b.stock[i])*.03);
      score+=Math.min(1.8,b.surplus[i]/target)*a.pressure[i]*1.8;
    }
    return clamp(score,0,6);
  }
  window.HexategosEconomicBalance03838=Object.freeze({
    version:BUILD,keys:()=>KEYS.slice(),labels:()=>LABELS.slice(),update,
    nation,opportunity,routeFactor,stats:()=>({...lastStats,lastCycle,revision})
  });
})();
