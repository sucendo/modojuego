HEXATEGOS 0.33
=================================

Base funcional:
- HEXATEGOS v3.30.15.
- Se conservan las mecánicas y los controles táctiles de esa versión.
- Esta revisión cambia la distribución de archivos, no la lógica jugable.

CÓMO SUBIRLO A LA WEB
---------------------
1. Descomprime este ZIP.
2. Sube TODO el contenido de la carpeta HEXATEGOS_v3_31_0_Web conservando
   exactamente las subcarpetas:
      assets/
      css/
      data/
      js/
3. El archivo de entrada es index.html.
4. No hace falta Node, PHP, npm ni proceso de compilación.

IMPORTANTE
----------
No subas solo index.html: necesita los archivos externos de las carpetas
assets, css, data y js.

ESTRUCTURA
----------
index.html              Interfaz y arranque
css/hexategos.css       Estilos
js/vendor/pako.min.js   Descompresión
js/game.js              Motor del juego
assets/                  Logos, favicon y fondo
data/                    Mallas y tablas geográficas

Los datos de máxima resolución (LOD 8) están divididos en varios archivos
para evitar límites de tamaño por archivo en paneles de hosting.

NOTA
----
Esta v0.33 sigue cargando todos los datos antes de ejecutar el motor para
mantener el comportamiento de v3.30.15. Una versión posterior puede añadir
carga diferida de LOD 8 sin mezclarlo con esta primera modularización.

DESTINO WEB PREVISTO
--------------------
Repositorio: sucendo/modojuego
Ruta: /hexategos/
Versión pública: 0.33
