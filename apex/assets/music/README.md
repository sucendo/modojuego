# APEX Formula 26 — Tema principal

La música elegida para APEX 26 está en `apex-theme.mp3`. Se reproduce
**solo cuando el usuario activa la música o ya había optado por ello y realiza
una interacción**; se pausa al ocultar el menú y al cambiar de pestaña.

El archivo comprimido se genera a partir de la composición original SoundBox
aportada por el usuario: `../soundbox/apex-song01.js`, 42 canales,
72 patrones de 32 filas, 252,24 segundos. En el arreglo hay 21 canales con
patrones que contienen notas. Los otros 21 no contienen notas y se omiten
únicamente del render offline. La fuente original se conserva íntegra.

## Recompilación

El archivo se sintetiza con el reproductor original de SoundBox disponible en
`../../vendor/soundbox-player-small.js` usando
`../../scripts/render-soundbox-theme.cjs`. GitHub Actions produce un WAV
provisional y lo comprime a MP3 sin instalar herramientas en el equipo del
usuario. El juego nunca sintetiza la canción en tiempo real.

La rutina `player-small.js` es Copyright (c) 2011-2013 Marcus Geelnard y se
redistribuye según licencia zlib/libpng, con el aviso legal íntegro conservado
en el código. La canción `apex-song01.js` es el archivo proporcionado por el
usuario para este proyecto.

En GitHub se ha renderizado la canción con una duración final de 252,26 s.
