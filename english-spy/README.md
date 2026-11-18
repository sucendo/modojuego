# Where Is Evelyn Blackwood? — Operación Madrid

Primer episodio jugable (v0.2) de una aventura gráfica educativa de espionaje para aprender inglés. Se desarrolla con HTML, CSS y JavaScript, sin dependencias ni servidor.

## Probar

Abrir `dist/index.html` en un navegador moderno. La versión publicada se sirve desde `dist/`.

## Incluye

- Menú principal, perfiles individuales y guardado automático mediante `localStorage`.
- Cuatro bandas de dificultad provisionales (Pre-A1, A1–A2, B1 y B2+). En el futuro se convertirán en 20 niveles de progreso adaptativo.
- Centro de operaciones con el mensaje cifrado de Evelyn y lectura en voz alta mediante `speechSynthesis` del navegador.
- Dos escenas conectadas: terraza y salón del Café de Oriente, con 12 puntos interactivos en total.
- Inventario persistente de objetos, selección y combinaciones. Por ejemplo, unir un recibo y una servilleta para reconstruir un mensaje.
- Entrevista a Carmen con cuatro preguntas, respuestas escuchables y una comprobación de comprensión adaptada al nivel.
- Cinco pruebas y un tablero en el que el jugador debe construir dos conexiones lógicas antes de deducir el siguiente destino.
- Expediente de pruebas, mapa narrativo, ayuda en español activable, experiencia y guardado individual.
- Interfaz responsive para ordenador, tablet y móvil.

## Cómo jugar

1. Entra al Café de Oriente y pulsa los puntos dorados para inspeccionar la escena.
2. Investiga el recibo y la mesa; examina la taza y recoge la servilleta rasgada.
3. Abre **Inventario** y selecciona el recibo y la servilleta para combinarlos. También puedes seleccionar un objeto y utilizarlo sobre un punto de la escena.
4. Entra al salón, habla con Carmen y pregúntale por la hora y la identidad. Escucha las respuestas antes de verificar la declaración.
5. Abre el **Tablero**, relaciona las pruebas y formula una hipótesis para desbloquear el siguiente lugar de Madrid.

Atajos con el teclado: `I` inventario, `B` tablero, `M` mapa, `Escape` cancelar. No hay límite de tiempo ni penalización por equivocarse. Las partidas v0.1 se conservan.

La investigación del Ritz sigue pendiente: el hotel aparece como destino descubierto, no como una ubicación explorable.

## Arquitectura

- `dist/index.html`: entrada del juego.
- `dist/styles.css`: interfaz y adaptación responsive.
- `dist/game.js`: escenas, narración, retos educativos, persistencia y navegación.
- `dist/assets/`: ilustraciones de escenarios en WebP comprimido.
- `.openai/hosting.json`: configuración del proyecto de prueba privado.

## Fidelidad visual

Los escenarios son **ilustraciones originales** de la terraza y un salón inspiradas en el Café de Oriente y la Plaza de Oriente. No son reconstrucciones métricas ni imágenes documentales, y algunos detalles del interior están dramatizados. Para cada espacio público que añadamos se documentarán su arquitectura, fotografía de referencia, configuración de accesos y época representada. El argumento y los personajes son ficticios.

## Próximos pasos

1. Incorporar el Ritz con subestancias, conversaciones y pruebas.
2. Añadir la investigación del piso franco en el Barrio de las Letras.
3. Incorporar Atocha, Chamartín, Torre de Cristal y T4, con arquitectura documentada.
4. Reforzar el motor educativo con progresión de 20 niveles, repetición espaciada y reconocimiento de voz opcional.

El diseño narrativo completo de Madrid se conserva como documento independiente.
