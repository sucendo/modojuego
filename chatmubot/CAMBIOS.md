# Cambios de ChatmuBot

## v3.0.1 — Corrección de interfaz (23/09/2026)

- El campo de mensajes ocupa siempre su propia fila.
- Botones y corrección ortográfica pasan a una barra independiente que se reorganiza en móvil.
- Sin cambios en el motor conversacional ni nuevas dependencias.


## v3.0.1 — Estabilización del motor propio (23/09/2026)

**Objetivo:** mantener todo el razonamiento conversacional en JavaScript, sin integrar modelos externos de IA. Las consultas a Wikipedia, traducción y LanguageTool siguen siendo herramientas web.

### Errores corregidos

- Se ejecutan antes las órdenes explícitas de traducción y corrección para que el contenido solicitado no se trate como un saludo, pregunta u orden secundaria. Los cambios de actividad cancelan la tarea anterior sin perder el marcador de los juegos.
- Coincidencia de respuestas por palabras completas, preferencia de frase exacta y frase más específica; se descartan arrays que no contienen respuestas textuales.
- Adivinanzas: solo solución, alternativas explícitas y pequeñas erratas admisibles; ya no bastan fragmentos mínimos de la respuesta. Duelos: palabras clave solo para pistas y respuesta validada por coincidencia completa o errata pequeña.
- Bloqueo inmediato de envíos simultáneos, preservación del mensaje original y del texto tecleado mientras se espera una respuesta lenta.
- Corrector desactivado por defecto; activación voluntaria en la interfaz con aviso de servicio externo. La corrección explícita realiza una sola petición por frase, con timeout, sin «corregir» silenciosamente las consultas Wikipedia.
- Gestión de datos diferenciada: `/limpiar`, `/reset`, `borrar todos mis datos` con confirmación. Recuperación del contexto en la misma pestaña y almacenamiento temporal si no está disponible `localStorage`.
- Historial restaurado sin lectura en voz alta involuntaria. Control de errores de servicio más claro. Retirado el CDN de math.js para operaciones aritméticas básicas.
- Zoom accesible en móvil, botones superiores etiquetados, selección de idioma aplicada al dictado y altura de pantalla dinámica.

### Alcance de pruebas

- Node: siete comprobaciones deterministas de adivinanza/duelo.
- Chromium/Playwright: interacción con intérprete, modo de traducción y recarga de sesión, juegos, operaciones consecutivas, memoria, confirmación de borrado, consentimiento del corrector, solicitudes bloqueadas, conservación del borrador, ancho móvil y almacenamiento bloqueado. Servicios externos simulados.
- En el entorno de auditoría, Chromium bloqueaba la navegación a localhost y a un origen simulado; el smoke test del cargador real por URL debe repetirse en un navegador sin esa restricción. El código sí se revisó sintácticamente y se probó con módulos cargados en el orden del loader.

### Limitaciones conocidas

- El intérprete sigue basado en reglas y en el JSON existente. Reconocimiento semántico avanzado, preguntas ambiguas y memoria entre pestañas/dispositivos se aplazan a versiones posteriores.
- La traducción y la búsqueda dependen de sus servicios respectivos y de sus políticas de acceso; su disponibilidad por Internet no quedó verificada durante esta entrega.
- El reconocimiento de voz, si está disponible, depende de la implementación del navegador y puede no ser totalmente local.

## v3.0.0 — Estructura modular anterior

- Adivinanza con estado, pistas y marcador; duelo con palabras clave.
- Contexto con temas recientes.
- Comandos locales de memoria, exportación y reinicio.
- Separación entre núcleo, módulos, datos y documentación; cargador y configuración centralizados.
- Dataset original conservado y dataset de ejecución reproducible.
