# Motor de Repaso (v1)

## Estructura
- index.html -> Portal (jugadores + grid)
- games/play.html -> Runner genérico
- engine/ -> motor común + estilos
- data/*.json -> temarios

## Uso
1) Abre `index.html`
2) Crea/elige un jugador (se guarda en el navegador)
3) Abre un juego -> `games/play.html?deck=../data/<deck>.json`

> Nota: Para que `fetch` de JSON funcione, abre el proyecto con un servidor local (recomendado).
> Opciones:
> - VSCode Live Server
> - `python -m http.server` en la carpeta del proyecto y abrir http://localhost:8000

## Progreso
- Jugadores: `portal_juegos_store_v3`
- Progreso: `repaso_progress_v1`
