# PC Fútbol 2026/27 — versión local

El juego funciona **sin conexión a Internet**: datos, código, hojas de estilo y **272 escudos** están dentro de `pcfutbol/`. Las imágenes de los equipos se encuentran en `img/coats/2026-27/`, todas como PNG de 96 × 96 píxeles.

## Jugar en Windows

1. Descomprime la carpeta `pcfutbol/` conservando su estructura.
2. Ejecuta **`iniciar-local.bat`**. Busca PHP (incluido WAMP) o Python en el equipo y abre el navegador en `http://127.0.0.1:8765/`.
3. Mantén abierta la ventana del servidor mientras juegas. **No hace falta Internet.**

También puedes copiar `pcfutbol/` dentro de `www` de WAMP y entrar por `http://localhost/pcfutbol/` con Apache arrancado.

> No recomendamos abrir `index.html` mediante `file://`: los navegadores modernos restringen las importaciones de módulos JavaScript desde archivos locales. Servir el juego por `localhost` sigue siendo totalmente local, sin conexión a ningún servicio externo.

## Linux y macOS

En la carpeta `pcfutbol/` ejecuta `python3 -m http.server 8765 --bind 127.0.0.1` y abre `http://127.0.0.1:8765/`. Si utilizas PHP, también sirve `php -S 127.0.0.1:8765`.

## Escudos y mantenimiento

- Catálogo local: `img/coats/2026-27/<id-del-club>.png`.
- `manifest.json` documenta de dónde procede cada imagen y su SHA-256.
- Si faltase o se dañase un PNG, la interfaz muestra un **escudo SVG provisional generado localmente**.
- Para actualizar las imágenes en el futuro (operación que *sí* requiere Internet y tener `curl`, ImageMagick y Node.js instalados), ejecuta desde la raíz del repositorio:

  ```sh
  node pcfutbol/scripts/downloadCoats.mjs --force
  ```

  El juego **nunca consulta** las URLs de Google Sports, ESPN o Transfermarkt. Esas fuentes solo se utilizan durante la preparación de los activos.

Los escudos pertenecen a sus respectivos clubes y pueden estar sujetos a derechos de marca y autor. Su inclusión técnica para jugar sin Internet no concede derechos adicionales de distribución comercial.

## Partidas guardadas

El navegador guarda las partidas en el almacenamiento local del origen utilizado (host y puerto). Para que sigan apareciendo, usa siempre la misma dirección local. Puedes utilizar las funciones de exportación/importación del juego para trasladar partidas entre ordenadores o direcciones.
