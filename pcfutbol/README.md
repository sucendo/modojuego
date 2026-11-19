# PC Fútbol 2026/27 — versión local

El juego funciona **sin conexión a Internet**: datos, código, hojas de estilo y **272 escudos** están dentro de `pcfutbol/`. Las imágenes de los equipos se encuentran en `img/coats/2026-27/`, todas como PNG de 96 × 96 píxeles. **Opcionalmente**, con conexión, carga fotografías de estadios con licencia abierta desde Wikimedia Commons; sin conexión muestra su plano SVG.

## Jugar con WAMP o XAMPP

1. Descomprime `pcfutbol/` conservando todos los archivos y subcarpetas.
2. Copia la carpeta a `C:\wamp64\www\pcfutbol\` (WAMP) o `C:\xampp\htdocs\pcfutbol\` (XAMPP).
3. Inicia **Apache** desde WAMP/XAMPP.
4. Abre **`http://localhost/pcfutbol/`** en el navegador. **No hace falta Internet.**

El juego es una aplicación HTML/CSS/JavaScript; no necesita PHP ni base de datos. Apache solo sirve los archivos locales.

## Entrenamientos y taquilla (v16.5)

- **Entrenamiento:** entra desde el menú principal y consulta el calendario de toda la temporada mes a mes. El modo automático adapta la propuesta a los días de partido y la fatiga. Cualquier sesión futura se puede personalizar; los partidos y sesiones ya ejecutadas quedan bloqueados.
- **Trabajo individual:** selecciona un futbolista y un objetivo de pase, regate, disparo, entradas, resistencia o recuperación. Las mejoras son graduales y los lesionados no acumulan desarrollo técnico.
- **Evolución visible:** en Entrenamiento, la ficha del jugador enseña su media global, condición, fatiga, forma y cinco atributos entrenables con decimales y mejoras acumuladas. Incluye las últimas ocho sesiones realizadas y sus efectos. El informe separa las variaciones provocadas por entrenamientos de las que introduce un encuentro.
- **Desarrollo gradual:** la mejora de media global necesita acumular progreso técnico real (3,5 puntos de atributos por mejora), con un máximo de tres puntos por temporada. La fatiga elevada reduce el rendimiento de los entrenamientos; una lesión detiene el progreso técnico hasta la recuperación.
- **Estadio:** selecciona un partido en casa y uno de los cinco sectores del plano orientativo. Puedes editar el precio sector a sector, aplicar una tarifa plana o subir/bajar precios en porcentaje o euros, solo para el partido o para todos los futuros.
- **Efectos reales:** avanzar con «▶ DÍA DEL PARTIDO» aplica los entrenamientos una vez; la recaudación de cada partido se calcula por sector según aforo, asistencia y precio, y se abona una sola vez.
- **Guardados:** se conservan las tarifas antiguas de precio único, la evolución técnica, el historial de entrenamientos y las sesiones ya registradas. Los campos nuevos se añaden automáticamente a las partidas existentes, sin atribuirles sesiones antiguas que no hayan sido registradas.

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

## Estadios 2026/27: aforos, fotos y gradas

- `js/stadiumCatalog_2026_27.js`: base de datos de **272 recintos**, con nombre, aforo, enlace a la fuente y, cuando existe, fotografía contrastada en Wikimedia Commons (264 fichas actualmente). **Ocho** disponen de ilustración SVG, pero aún no de fotografía libre verificable.
- `js/stadiums_2026_27.js`: aforos operativos contrastados, estructura conocida y estimaciones explícitas. No confundir tres *franjas visuales estimadas* con tres anfiteatros realmente construidos.
- `js/ui/stadiumSvgPlan.js` y `js/game/managementCycle.js`: el plano y la taquilla se generan automáticamente; cada grada ocupa un ancho proporcional a sus plazas y se colorea según su propia previsión de asistencia. Los asientos de todos los sectores suman exactamente el aforo.
- `js/ui/stadiumPhoto.js`: fotografía con crédito y licencia en **Estadio** y **Previa**; nunca usa fotos de licencias desconocidas. Sin imagen o sin Internet queda visible el plano ilustrativo.

**Añadir datos físicos de un estadio sin dibujar un SVG propio:** en `scripts/enrichStadiumCatalog2026.mjs`, incorpora su `structure` en `officialOverrides` junto al enlace oficial. Después ejecuta `node pcfutbol/scripts/enrichStadiumCatalog2026.mjs --official-only` para trasladarlo a la base. Por ejemplo:

```js
structure: {
  structureStatus: 'partial',
  structureSource: 'https://web-oficial-del-club/estadio',
  stands: {
    norte: { present: true, levels: [
      { name: 'Grada norte baja', weight: 0.65 },
      { name: 'Anfiteatro norte', weight: 0.35 },
    ] },
    sur: { present: false }, // Si existe fuente que confirme el cierre.
  },
  sectorConstraints: { norte: 4100 }, // Solo si hay aforo real desglosado.
}
```

Las zonas aceptadas son `tribuna`, `preferencia`, `norte`, `sur` y `vip`. `weight` reparte **proporcionalmente** las plazas conocidas de esa zona; sin fuente se marca como estimación. `sectorConstraints` fija el aforo conocido de una zona y reparte automáticamente el resto. `stands[sector].coverage` permite un graderío parcialmente construido o abierto (de 0 a 1). Para la estructura completa se puede usar `sectorCapacities` si sus cinco cifras suman el aforo oficial.

Para reconstruir toda la base desde Wikidata/Wikipedia, ejecutar en orden `buildStadiumCatalog2026.mjs`, `enrichStadiumCatalog2026.mjs` y `findStadiumPhotos2026.mjs` (requiere Internet y respeta las pausas de Wikimedia). Las correcciones humanas de imágenes ambiguas están en el último script; `--review-only` las aplica sin consultas nuevas. **No atribuir un número de anfiteatros no comprobado a un estadio.**

## Partidas guardadas

El navegador guarda las partidas en el almacenamiento local del origen utilizado (host y puerto). Para que sigan apareciendo, usa siempre la misma dirección local. Puedes utilizar las funciones de exportación/importación del juego para trasladar partidas entre ordenadores o direcciones.
