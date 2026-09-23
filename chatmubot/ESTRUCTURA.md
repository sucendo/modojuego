# Estructura del proyecto

## Principios

1. `index.html` solo arranca la interfaz y el loader.
2. `assets/js/core/` contiene arranque, configuración y orquestación.
3. `assets/js/modules/` agrupa capacidades desacopladas.
4. `data/chatmubot/` separa contenido conversacional de la lógica.
5. `tools/` contiene scripts auxiliares que no forman parte del runtime.

## Flujo de carga

1. `index.html`
2. `chatbotConfig.js`
3. `chatbotLoader.js`
4. `chatbotUtilidades.js`
5. `chatbot.js`
6. módulos opcionales

## Recomendación de crecimiento

- Añadir nuevos módulos en `assets/js/modules/`
- Declararlos en `chatbotConfig.js`
- Mantener los datos en `data/chatmubot/`
- Evitar lógica de negocio en el HTML
