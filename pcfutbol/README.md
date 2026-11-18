# PC Fútbol 2026/27 — versión local

El juego funciona **sin conexión a Internet**: datos, código, hojas de estilo y **272 escudos** están dentro de `pcfutbol/`. Las imágenes de los equipos se encuentran en `img/coats/2026-27/`, todas como PNG de 96 × 96 píxeles.

## Jugar con WAMP o XAMPP

1. Descomprime `pcfutbol/` conservando todos los archivos y subcarpetas.
2. Copia la carpeta a `C:\wamp64\www\pcfutbol\` (WAMP) o `C:\xampp\htdocs\pcfutbol\` (XAMPP).
3. Inicia **Apache** desde WAMP/XAMPP.
4. Abre **`http://localhost/pcfutbol/`** en el navegador. **No hace falta Internet.**

El juego es una aplicación HTML/CSS/JavaScript; no necesita PHP ni base de datos. Apache solo sirve los archivos locales.

## Entrenamientos y taquilla (v16.4)

- **Entrenamiento:** entra desde el menú principal y consulta el calendario de toda la temporada mes a mes. El modo automático adapta la propuesta a los días de partido y la fatiga. Cualquier sesión futura se puede personalizar; los partidos y sesiones ya ejecutadas quedan bloqueados.
- **Trabajo individual:** selecciona un futbolista y un objetivo de pase, regate, disparo, entradas, resistencia o recuperación. Las mejoras son graduales y los lesionados no acumulan desarrollo técnico.
- **Estadio:** selecciona un partido en casa y uno de los cinco sectores del plano orientativo. Puedes editar el precio sector a sector, aplicar una tarifa plana o subir/bajar precios en porcentaje o euros, solo para el partido o para todos los futuros.
- **Efectos reales:** avanzar con «▶ DÍA DEL PARTIDO» aplica los entrenamientos una vez; la recaudación de cada partido se calcula por sector según aforo, asistencia y precio, y se abona una sola vez.
- **Guardados:** se conservan las tarifas antiguas de precio único y las sesiones ya registradas. Los campos nuevos se añaden automáticamente a las partidas existentes.

> No recomendamos abrir `index.html` mediante `file://`: los navegadores modernos restringen las importaciones de módulos JavaScript desde archivos locales. Servir el juego por `localhost` sigue siendo totalmente local, sin conexión a ningún servicio externo.

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
