'use strict';
/* HEXATEGOS Atlas 0.40.4 · cuencas del Caspio y del Aral.
 * Datos orientativos. Aral/Balkhash/Issyk-Kul no son agua en la malla
 * original; sólo se representarán como capa visual hexagonal SIN
 * cambiar el suelo jugable ni permitir rutas marítimas.
 * El Caspio SÍ es agua nativa: jamás superponerle otra costa.
 */
(function(){
 const rivers=[{"name":"Amu Daria","points":[[71.55,37.65],[69.7,37.5],[67.5,37.8],[65.6,39],[62.7,41.15],[60.9,42.7],[59.6,43.8]],"mouthBody":"Aral occidental","minZoom":5.9,"maxWidth":190,"historicalDelta":true},{"name":"Sir Daria","points":[[76.8,41.9],[73,40.5],[70.2,40.7],[67.5,41.6],[64.5,43.1],[62.5,44.2],[60.85,46]],"mouthBody":"Aral septentrional","minZoom":5.9,"maxWidth":210},{"name":"Ili","points":[[81.4,43.6],[79.2,43.7],[77.7,43.92],[76.4,44.3],[75.1,45.1]],"mouthBody":"Balkhash","minZoom":6.5,"maxWidth":145},{"name":"Zarafshan","points":[[69.7,39.45],[68.1,39.5],[66.8,39.65],[65.1,39.75],[63.5,39.7]],"minZoom":7.2,"maxWidth":115,"endorheic":true},{"name":"Chuy","points":[[76.7,42.1],[74.9,42.65],[72.7,43],[70.4,43.45]],"minZoom":7.5,"maxWidth":95,"endorheic":true},{"name":"Talas","points":[[72.4,42.28],[71.65,42.48],[70.8,42.72],[69.8,43.1]],"minZoom":8,"maxWidth":85,"endorheic":true},{"name":"Atrak","points":[[58.95,37.2],[57.9,37.1],[56.7,37.3],[55.5,37],[54,36.9]],"mouth":true,"minZoom":7.5,"maxWidth":95,"intermittent":true},{"name":"Emba (Zhem)","points":[[58.5,49.1],[56.8,48.6],[55.1,47.5],[52.35,46.6]],"mouth":true,"minZoom":7.7,"maxWidth":85,"intermittent":true},{"name":"Terek","points":[[43,42.8],[44.1,43.2],[45.4,43.55],[46.6,43.42]],"mouth":true,"minZoom":7.2,"maxWidth":125},{"name":"Karatal","points":[[80.7,44.6],[79.7,45.4],[79.25,45.95],[79.0,46.46]],"mouthBody":"Balkhash","minZoom":8.2,"maxWidth":80},{"name":"Turgai","points":[[65,50],[64,48.8],[63.1,47.6],[62.8,46.8]],"minZoom":8.1,"maxWidth":72,"endorheic":true}];
 const mountains=[{"name":"Alay","points":[[71.5,39.2],[73.3,39.6],[75.3,39.8],[77,40.1]],"minZoom":7.3,"elevationM":5500},{"name":"Cordillera de Ferganá","points":[[72.1,41.3],[73.4,41.6],[74.8,41.9]],"minZoom":8.2,"elevationM":4800},{"name":"Gissar","points":[[66.2,38.6],[67.6,38.8],[69,38.75]],"minZoom":8.3,"elevationM":4500},{"name":"Nuratau","points":[[64.1,40.25],[65.4,40.55],[66.7,40.55]],"minZoom":9,"elevationM":2169},{"name":"Karatau","points":[[67,43.1],[68.5,43.7],[70.1,44.3]],"minZoom":8.3,"elevationM":2176},{"name":"Kungey Alatau","points":[[75.4,42.7],[76.6,42.8],[78,42.9]],"minZoom":8.6,"elevationM":4771},{"name":"Trans-Ili Alatau","points":[[75.3,43],[76.4,43],[77.3,43.1]],"minZoom":8.5,"elevationM":4973},{"name":"Boro-Horo","points":[[80.8,44.2],[82.1,44],[83.2,43.7],[84.7,43.65]],"minZoom":8.4,"elevationM":4550},{"name":"Dzungarian Alatau","points":[[80.8,45.2],[81.7,45.65],[82.7,45.95]],"minZoom":8.3,"elevationM":4622},{"name":"Tarbagatai","points":[[81,46.35],[82.7,46.7],[84.4,47.1],[85.8,47.35]],"minZoom":8.8,"elevationM":2992},{"name":"Kyrgyz Ala-Too","points":[[71.9,42.6],[73.2,42.4],[74.5,42.35],[75.4,42.3]],"minZoom":8.7,"elevationM":4875},{"name":"Montes Saur","points":[[84,47.9],[85,47.55],[86.4,47.2]],"minZoom":9,"elevationM":3816}];
 const waterBodies=[{"name":"Aral septentrional","displayName":"Mar de Aral","components":[[60.73,46.21,0.72,0.36]],"minZoom":5.15,"kind":"inland","note":"Sector norte; superficie orientativa"},{"name":"Aral occidental","displayName":"Mar de Aral","components":[[59.1,44.5,0.26,0.86]],"minZoom":5.15,"kind":"inland","note":"Remanente occidental; el área varía con el tiempo"},{"name":"Balkhash","displayName":"Lago Balkhash","components":[[74.8,46.42,1.24,0.26],[77.2,46.33,2.03,0.34]],"minZoom":5.15,"kind":"inland","note":"Contorno esquemático basado en hexágonos"},{"name":"Issyk-Kul","displayName":"Issyk-Kul","components":[[77.32,42.43,0.77,0.18]],"minZoom":6.6,"kind":"inland","note":"Lago endorreico de alta montaña"},{"name":"Alakol","displayName":"Lago Alakol","components":[[81.61,46.24,0.44,0.27]],"minZoom":7.1,"kind":"inland"},{"name":"Sarykamysh","displayName":"Lago Sarykamysh","components":[[57.67,41.99,0.36,0.28]],"minZoom":7.5,"kind":"inland"}];
 const basins=[{"name":"Cuenca del Caspio","center":[52.7,44],"kind":"land","minZoom":5.9,"maxZoom":13,"priority":70},{"name":"Delta del Amu Daria","center":[59.6,43.5],"kind":"land","minZoom":9.2,"maxZoom":16,"priority":64},{"name":"Delta del Sir Daria","center":[60.8,45.7],"kind":"land","minZoom":9.2,"maxZoom":16,"priority":64},{"name":"Mar de Aral","center":[60.4,45.85],"kind":"water","minZoom":5.3,"maxZoom":15,"priority":90},{"name":"Lago Balkhash","center":[76.6,46.3],"kind":"water","minZoom":5.5,"maxZoom":15,"priority":82}];
 const reliefBasins=[{"name":"Depresión de Turán","center":[62.8,42.6],"radii":[8.8,4.6],"kind":"land","minZoom":5.8,"priority":68},{"name":"Meseta de Ustyurt","center":[57.1,44.7],"radii":[2.2,1.7],"kind":"land","minZoom":7.8,"priority":72},{"name":"Desierto de Karakum","center":[59.4,39.6],"radii":[3.8,2.1],"kind":"land","minZoom":6.3,"priority":79},{"name":"Desierto de Kyzylkum","center":[64.6,42.9],"radii":[3.9,2.1],"kind":"land","minZoom":6.4,"priority":79},{"name":"Estepa Kazaja","center":[68,49.3],"radii":[13,3.8],"kind":"land","minZoom":5.5,"priority":74},{"name":"Desierto de Betpak-Dala","center":[69.9,45.9],"radii":[4,2.6],"kind":"land","minZoom":7.3,"priority":78},{"name":"Valle de Ferganá","center":[71.3,40.5],"radii":[2.4,0.75],"kind":"land","minZoom":7.1,"priority":84},{"name":"Valle del Ili","center":[78.1,43.7],"radii":[3.2,0.65],"kind":"land","minZoom":7.4,"priority":76},{"name":"Desierto de Saryesik-Atyrau","center":[75.2,45.1],"radii":[2.2,1.15],"kind":"land","minZoom":8.1,"priority":70},{"name":"Cuenca de Zungaria","center":[85,46],"radii":[5,2.6],"kind":"land","minZoom":7,"priority":79},{"name":"Desierto de Gurbantunggut","center":[86.7,45.3],"radii":[2.3,1.4],"kind":"land","minZoom":8.4,"priority":74},{"name":"Cuenca del Tarim","center":[83,40],"radii":[6.7,2.8],"kind":"land","minZoom":6.3,"priority":82},{"name":"Desierto de Taklamakán","center":[83.3,38.8],"radii":[5,1.5],"kind":"land","minZoom":7.1,"priority":87},{"name":"Cuenca de Ferganá","center":[71.5,40.55],"radii":[2.6,0.9],"kind":"land","minZoom":10.3,"priority":53}];
 const canonical={"rivers":["Volga","Ural","Irtish"],"mountains":["Pamir","Tien Shan","Altái","Kopet Dag"]};
 const bounds=Object.freeze({west:41,east:99,south:33,north:56});
 function contains(body,lon,lat){
  const components=body?.components||[];
  return components.some(([cx,cy,rx,ry])=>{
   const u=(lon-cx)/rx,v=(lat-cy)/ry;
   return u*u+v*v<=1;
  });
 }
 function regionsNear(lon,lat){
  return reliefBasins.filter(r=>{
   const x=(lon-r.center[0])/r.radii[0],y=(lat-r.center[1])/r.radii[1];
   return x*x+y*y<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 function bodyAt(lon,lat){
  for(const body of waterBodies)if(contains(body,lon,lat))return body;
  return null;
 }
 window.HexategosCentralAsiaPhysical0404=Object.freeze({
  version:'0.40.5',bounds,rivers,mountains,waterBodies,basins,reliefBasins,canonical,
  contains,bodyAt,regionsNear
 });
})();
