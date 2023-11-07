// Variables para almacenar el contexto del chatbot y el usuario
const context = {
  userContext: {},
  chatbotContext: {},
};

let respuestas; // Variable para almacenar las respuestas

// Función para cargar el archivo JSON de respuestas
function cargarRespuestas() {
  return fetch('data/chatbotrespuestas.json')
    .then(response => response.json())
    .then(data => {
      respuestas = data; // Asigna los datos a la variable respuestas
    })
    .catch(error => {
      console.error('Error al cargar el archivo JSON:', error);
      return {};
    });
}

// Función para procesar mensajes del usuario
function procesarMensajeUsuario(mensaje) {
  // Actualizar el contexto del usuario
  context.userContext = actualizarContextoUsuario(mensaje);

  // Procesar el mensaje y obtener una respuesta
  const respuesta = procesarMensaje(mensaje, context);

  // Devolver la respuesta al usuario
  return respuesta;
}

// Función para procesar mensajes del chatbot
function procesarMensajeChatbot(mensaje) {
  // Actualizar el contexto del chatbot
  context.chatbotContext = actualizarContextoChatbot(mensaje);

  // Procesar el mensaje y obtener una respuesta
  const respuesta = procesarMensaje(mensaje, context);

  // Devolver la respuesta al usuario
  return respuesta;
}

// Función para procesar mensajes y generar respuestas
function procesarMensaje(mensaje, context) {
  // Implementa lógica para generar respuestas en función del mensaje y el contexto
  // Puedes utilizar el contexto del usuario y el chatbot para personalizar las respuestas.

  // Ejemplo simplificado:
  if (mensaje.includes("nombre")) {
    if (context.userContext.nombre) {
      return `Mi nombre es ChatBot. ¿En qué más puedo ayudarte, ${context.userContext.nombre}?`;
    } else {
      return "Mi nombre es ChatBot, ¿en qué más puedo ayudarte?";
    }
  } else {
    return "Lo siento, no entiendo tu pregunta.";
  }
}

// Función para actualizar el contexto del usuario
function actualizarContextoUsuario(mensaje) {
  // Implementa lógica para actualizar el contexto del usuario en función de su mensaje.
  // Puedes extraer información relevante del mensaje, como el nombre del usuario.

  // Ejemplo simplificado: Buscar el nombre en el mensaje
  const nombreMatch = mensaje.match(/me llamo (\w+)/i);
  if (nombreMatch) {
    return { nombre: nombreMatch[1] };
  }

  return {};
}

// Función para actualizar el contexto del chatbot
function actualizarContextoChatbot(mensaje) {
  // Implementa lógica para actualizar el contexto del chatbot en función del mensaje.
  // Esto podría incluir un seguimiento de la conversación actual o cualquier otro detalle relevante.

  // Ejemplo simplificado: Actualizar un contador de preguntas del chatbot
  if (context.chatbotContext.preguntas) {
    context.chatbotContext.preguntas++;
  } else {
    context.chatbotContext.preguntas = 1;
  }

  return context.chatbotContext;
}

// Función para buscar palabras clave en el mensaje
function buscarPalabrasClave(texto) {
  texto = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  for (const palabraClave in respuestas) {
    if (texto.includes(palabraClave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
      if (palabraClave === "hora") {
        const ahora = new Date();
        const horaActual = `${ahora.getHours()}:${ahora.getMinutes()}`;
        return `${respuestas[palabraClave]} ${horaActual}`;
      } else if (palabraClave === "cuanto es") {
        // Extrae la expresión matemática del texto
        const expresionMatematica = texto.replace(palabraClave, "").trim();
        try {
          // Evalúa la expresión matemática utilizando math.js
          const resultado = math.evaluate(expresionMatematica);
          return `${respuestas[palabraClave]} ${resultado}`;
        } catch (error) {
          return "No pude resolver la operación matemática.";
        }
      } else if (palabraClave === "chiste" || palabraClave === "gracias" || palabraClave === "cuéntame una curiosidad") {
        const respuestasCategoria = respuestas[palabraClave];
      
        if (respuestasCategoria) {
          const respuestaAleatoria = respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
          return respuestaAleatoria;
        }
      } else if (palabraClave === "tu nombre" || palabraClave === "te llamas") {
        // Si la pregunta es sobre el nombre del chatbot
        return respuestas[palabraClave];
      } else if (texto.includes("me llamo") || texto.includes("soy ")) {
        // Extraer el nombre del usuario del texto
        const nombre = texto.split("me llamo")[1] || texto.split("soy ")[1];
        if (nombre) {
          nombreUsuario = nombre.trim();
          return `Encantado de conocerte, ${nombreUsuario}!`;
        }
      }
      return respuestas[palabraClave];
    }
  }
  return null;
}

// Función para mostrar mensajes en el chat
function mostrarMensaje(usuario, mensaje) {
  const chat = document.getElementById("chat");
  const nuevoMensaje = document.createElement("div");
  nuevoMensaje.className = usuario === "Usuario" ? "mensaje-usuario" : "mensaje-robot";

  chat.appendChild(nuevoMensaje);

  // Verifica si el usuario es el Robot (chatbot) para aplicar el efecto de escritura
  if (usuario === "Robot") {
    // Dividir el mensaje en caracteres
    const caracteres = mensaje.split("");
    let index = 0;

    const mostrarCaracter = () => {
      if (index < caracteres.length) {
        nuevoMensaje.textContent += caracteres[index];
        index++;
        // Hacer una llamada recursiva para mostrar el próximo carácter después de un retraso
        setTimeout(mostrarCaracter, 25); // Controla la velocidad de escritura (ajusta según lo necesario)
      }
    };

    // Iniciar la animación de escritura
    mostrarCaracter();
  } else {
    nuevoMensaje.textContent = mensaje;
  }

  // Desplaza automáticamente el scroll hacia abajo
  chat.scrollTop = chat.scrollHeight;
}

// Cargar las respuestas y utilizarlas
cargarRespuestas().then(() => {
  const enviarButton = document.getElementById("enviar");
  const userInput = document.getElementById("userInput");

  enviarButton.addEventListener("click", function () {
    const pregunta = userInput.value;
    if (pregunta.trim() !== "") {
      mostrarMensaje("Usuario", pregunta);
      userInput.value = "";
      const respuesta = procesarMensajeUsuario(pregunta);
      mostrarMensaje("Robot", respuesta);
    }
  });

  userInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      const pregunta = userInput.value;
      if (pregunta.trim() !== "") {
        mostrarMensaje("Usuario", pregunta);
        userInput.value = "";
        const respuesta = procesarMensajeUsuario(pregunta);
        mostrarMensaje("Robot", respuesta);
      }
    }
  });
});
