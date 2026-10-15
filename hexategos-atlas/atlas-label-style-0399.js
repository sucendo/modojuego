'use strict';
/* Paleta compartida de topónimos de Hexategos Atlas 0.39.9.
 * Prioridad: categoría semántica; nombres como respaldo cuando los datos
 * compartidos solo exponen la clase genérica 'natural'.
 */
(function(){
 const palette=Object.freeze({
  water:Object.freeze([137,215,238]),
  mountain:Object.freeze([231,165,105]),
  land:Object.freeze([246,245,237])
 });
 const waterKinds=new Set(['water','sea','ocean','bay','gulf','fjord',
   'ria','estuary','strait','river','lake','marine','canal']);
 const mountainKinds=new Set(['mountain','mountains','mountain-range',
   'peak','ridge','sierra','massif','relief']);
 const waterName=/^(?:oc[eé]ano|mar(?:es)?\b|golfo|bah[ií]a|r[ií]a|fiordo|fjord|estuario|estrecho|lago|laguna|r[ií]o|lim[aá]n|canal de|kattegat|skagerrak|[øo]resund|peque[nñ]o belt|gran belt|fehmarn belt|sognefjord|hardangerfjord|geirangerfjord|trondheimsfjord)\b/i;
 const mountainName=/^(?:cordillera|sistema monta[nñ]oso|sistema central|sistema ib[eé]rico|sierras?|macizo|montes?|alpes|pirineos|c[aá]rpatos|c[aá]ucaso|apeninos|urales|selva negra)\b/i;
 function category(item){
  const kind=String(item?.kind||'').toLowerCase();
  if(waterKinds.has(kind))return 'water';
  if(mountainKinds.has(kind))return 'mountain';
  const name=String(item?.name||'').trim();
  if(waterName.test(name))return 'water';
  if(mountainName.test(name))return 'mountain';
  return 'land';
 }
 function color(item,alpha=1){
  const rgb=palette[category(item)];
  return 'rgba('+rgb.join(',')+','+Math.max(0,Math.min(1,alpha)).toFixed(3)+')';
 }
 window.HexategosAtlasLabelStyle0399=Object.freeze({category,color,palette});
})();
