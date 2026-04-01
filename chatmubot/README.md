# ChatmuBot v3

Versión reestructurada del proyecto para hosting estático, mantenimiento sencillo y ampliación progresiva.

## Qué cambia en esta versión

- Estructura más limpia y predecible.
- Configuración centralizada en `assets/js/core/chatbotConfig.js`.
- Datos separados en `data/chatmubot/`.
- Dataset original conservado y dataset runtime normalizado.
- Loader desacoplado de rutas hardcodeadas.
- Mejoras acumuladas en adivinanza, duelo y contexto.
- Proyecto listo para GitHub Pages, Apache, Nginx o servidor local.

## Árbol principal

```text
chatmubot_v3_estructura/
├── index.html
├── assets/
│   ├── css/
│   │   └── chatmubot.css
│   └── js/
│       ├── core/
│       │   ├── chatbot.js
│       │   ├── chatbotConfig.js
│       │   └── chatbotLoader.js
│       └── modules/
│           ├── chatbotCorrector.js
│           ├── chatbotJuegos.js
│           ├── chatbotLogicaConversacional.js
│           ├── chatbotPedia.js
│           ├── chatbotTranslate.js
│           └── chatbotUtilidades.js
├── data/
│   └── chatmubot/
│       ├── chatbotrespuestas.json
│       └── chatbotrespuestas.original.json
├── docs/
│   ├── CAMBIOS.md
│   └── ESTRUCTURA.md
└── tools/
    └── build-runtime-data.py
```

## Datos

- `chatbotrespuestas.original.json`: copia del archivo de datos original.
- `chatbotrespuestas.json`: versión runtime normalizada a partir del original.
  - fusiona claves duplicadas cuando es posible
  - añade `palabrasClave` al duelo para validar mejor respuestas

## Uso

Abre `index.html` desde un servidor local o súbelo a hosting estático.

Ejemplos:

- `adivinanza`
- `pista`
- `otra`
- `duelo`
- `siguiente`
- `busca Roma`
- `y su capital`
- `de qué hablábamos`
- `últimos temas`
- `guardar color azul`
- `mostrar datos`

## Nota

El dataset original tenía claves duplicadas. En JSON, eso provoca que al parsearlo normalmente gane la última aparición. En esta versión el archivo runtime intenta resolverlo de forma más útil.
