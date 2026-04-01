/*
* ChatmuBot - Configuración central del proyecto
*/

window.ChatmuConfig = {
  version: "3.0.0",
  appName: "ChatmuBot",
  data: {
    responses: "data/chatmubot/chatbotrespuestas.json",
    responsesOriginal: "data/chatmubot/chatbotrespuestas.original.json"
  },
  modules: {
    base: "assets/js/",
    core: [
      "core/chatbot.js"
    ],
    optional: [
      "modules/chatbotCorrector.js",
      "modules/chatbotLogicaConversacional.js",
      "modules/chatbotPedia.js",
      "modules/chatbotTranslate.js",
      "modules/chatbotJuegos.js",
      "modules/chatbotUtilidades.js"
    ]
  },
  features: {
    mathJS: true,
    tts: true,
    speechRecognition: true,
    wikipedia: true,
    translation: true,
    spellcheck: true
  }
};
