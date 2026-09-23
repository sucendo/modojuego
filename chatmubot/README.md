# ChatmuBot v3.0.1 — Sucendo

Chatbot web con **motor conversacional propio** (reglas, contexto, respuestas y juegos). Puede conectarse a servicios de información y herramientas de Internet, pero **no está conectado a ningún modelo externo de IA conversacional o generativa**.

## Ejecutar

1. Descomprime el ZIP.
2. Desde la carpeta `chatmubot/`, inicia un servidor web estático (también puedes usar Apache/WAMP):

   ```bash
   python -m http.server 8000
   ```

   En Windows también suele funcionar `py -m http.server 8000`.
3. Abre `http://localhost:8000/` en tu navegador.

**Importante:** no abras `index.html` directamente mediante `file://`, ya que el navegador puede impedir cargar el JSON por seguridad. No hace falta instalar Node ni Python si vas a alojar la carpeta en Apache, Nginx o un servicio web estático.

## Corrección de interfaz (23/09/2026)

La versión con corrección de interfaz rediseña el área de escritura para que no se comprima por encima de 768 px y mantenga controles accesibles en móvil. El motor sigue siendo el de v3.0.1.

## Novedades de la v3.0.1

- Prioridad de herramientas explícitas: «traduce al inglés: buenos días» no se confunde con un saludo; «al francés» reutiliza la frase anterior.
- Coincidencias completas en respuestas; `necesito` deja de activar `si` y `ahora` ya no activa la consulta de hora.
- Adivinanzas y duelos con validación estricta. Las palabras clave son pistas, no soluciones válidas por sí solas.
- Envío único: se bloquea mientras se procesa y no se borra lo que escribas durante la espera.
- Se guarda el mensaje original. La corrección automática está **desactivada de fábrica** y requiere activar una casilla visible; `corrige: ...` funciona explícitamente y llama a LanguageTool una sola vez por frase.
- `/limpiar` borra el historial de chat; `/reset` reinicia el contexto, pero preserva los datos guardados; `borrar todos mis datos` pide confirmación y elimina datos del navegador.
- Recuperación de contexto en la misma pestaña mediante `sessionStorage`, conservación del historial anterior y funcionamiento temporal cuando se bloquea `localStorage`.
- Mejoras de accesibilidad y adaptación móvil; calculadora aritmética básica local sin CDN de math.js.

## Comandos de prueba

`ayuda`, `traduce al inglés: buenos días`, `al francés`, `salir`, `corrige: ola ke ase`, `adivinanza`, `pista`, `duelo`, `calcula 3+4`, `+5`, `busca Roma`, `y su capital`, `guardar color azul`, `mostrar color`, `/limpiar`, `/reset` y `borrar todos mis datos`.

## Servicios de Internet

- **Wikipedia:** búsquedas y seguimiento del último tema; necesita conexión.
- **Traducción:** los adaptadores heredados para Google Translate y LibreTranslate siguen disponibles. El endpoint de Google utilizado no es una API de pago oficial y LibreTranslate puede exigir clave o alojamiento propio. Comprueba su disponibilidad en tu entorno.
- **LanguageTool:** solo se consulta con `corrige: ...` o tras activar voluntariamente la corrección automática, que envía texto al servicio externo.
- **Voz:** utiliza las capacidades que ofrezca el navegador. Según el navegador, el reconocimiento de voz puede usar un servicio en la nube.

No se ha incorporado ningún adaptador para GPT, Claude, Gemini u otro modelo generativo.

## Datos y migración

Se mantienen los identificadores del historial y de las preferencias de v3, por lo que **sustituir los archivos de la aplicación no borra los datos ya guardados en el mismo origen y navegador**. Haz una exportación desde la interfaz antes de actualizar. Si cambias la dirección o el puerto del proyecto, el navegador lo considerará otro origen y no compartirá los datos existentes.

Las copias ZIP incluidas dentro del proyecto son **archivos históricos**; el código vigente de v3.0.1 está en los archivos extraídos del directorio `chatmubot/`.

## Pruebas

- `node tests/test_games.js` — pruebas deterministas de adivinanzas y duelos, sin paquetes adicionales.
- `python tests/test_browser.py` — pruebas de interacción con Chromium + Playwright y proveedores externos **simulados**.
- `python tests/test_static_server.py` — opcional: comprueba la carga real mediante un servidor HTTP local; se omite si el entorno bloquea localhost.

No hemos verificado contra servidores externos reales en las pruebas automatizadas. Los detalles están en `docs/CAMBIOS.md`.
