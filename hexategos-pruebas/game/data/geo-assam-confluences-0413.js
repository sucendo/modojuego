'use strict';
/* Hexategos 0.41.3: corrección cartográfica del Brahmaputra de Assam.
 * Referencias geográficas aproximadas [lon,lat].  Los puntos no son
 * geometría libre: todos se resuelven sobre ARISTAS/VÉRTICES L8.
 * Nunca cambia el cauce canónico, propietarios, navegación ni guardados.
 */
(function(){
 const corridor=Object.freeze({
  name:'Brahmaputra (Assam occidental)',
  // Primer anclaje en el Brahmaputra canónico cerca de Jorhat.
  // El tramo occidental/delta no está correctamente representado
  // en el motor nativo; se conserva sólo como superposición visual.
  points:[[93.924,26.928],[93.45,26.76],[92.75,26.55],
   [92.05,26.19],[91.72,26.18],[91.24,26.20],
   [90.825,26.25],[90.22,26.05],[89.92,25.87],
   [89.66,25.49],[89.82,25.17],[90.22,24.82],
   [90.922,24.673]],
  minZoom:7.8, maxSnapKm:42
 });
 const mouths=Object.freeze({
  Subansiri:Object.freeze({at:[93.91,26.88],maxKm:38}),
  Manas:Object.freeze({at:[90.825,26.250],maxKm:38}),
  Teesta:Object.freeze({at:[89.66,25.49],maxKm:38})
 });
 const highCourses=Object.freeze({
  Subansiri:[[92.643,27.983],[93.1,28.28],[94.03,28.36],
    [94.35,27.72],[94.21,27.60],[94.27,27.24],[94.10,27.03],[93.91,26.88]],
  Manas:[[91.3,27.92],[91.2,27.58],[90.95,27.22],
    [90.95,26.84],[90.87,26.52],[90.825,26.25]],
  Teesta:[[88.73,27.96],[88.55,27.35],[88.55,26.75],
    [88.76,26.30],[89.2,25.90],[89.66,25.49]]
 });
 window.HexategosAssamConfluences0413=Object.freeze({
  version:'0.41.3',corridor,mouths,highCourses
 });
})();
