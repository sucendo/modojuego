// Variables para almacenar el contexto del chatbot y el usuario
const context = {
  userContext: {
    nombre: "",
    tema: ""
  },
  chatbotContext: {
    preguntas: 0
  }
};

// Función para cargar el archivo JSON de respuestas
function cargarRespuestas() {
  return fetch('data/chatbotrespuestas.json')
    .then(response => response.json())
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
  mostrarMensaje("Robot", respuesta);
}

// Función para procesar mensajes del chatbot
function procesarMensajeChatbot(mensaje) {
  // Actualizar el contexto del chatbot
  context.chatbotContext = actualizarContextoChatbot(mensaje);

  // Procesar el mensaje y obtener una respuesta
  const respuesta = procesarMensaje(mensaje, context);

  // Devolver la respuesta al usuario
  mostrarMensaje("Usuario", mensaje);
  mostrarMensaje("Robot", respuesta);
}

// Función para procesar mensajes y generar respuestas
function procesarMensaje(mensaje, context) {
  // Implementa lógica para generar respuestas en función del mensaje y el contexto
  // Puedes utilizar el contexto del usuario y el chatbot para personalizar las respuestas.

  // Aquí deberás utilizar el archivo JSON de respuestas para buscar respuestas adecuadas
  // en función de las palabras clave en el mensaje del usuario.

  // Ejemplo simplificado:
  if (mensaje.includes("tu nombre") || mensaje.includes("te llamas")) {
    const respuestas = respuestasJSON;
    return respuestas["tu nombre"];
  } else {
    return respuestasJSON["no_entender"];
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

  return context.userContext;
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

// Otras funciones de utilidad para mostrar mensajes y control de la interfaz de usuario

// Cargar las respuestas JSON
let respuestasJSON;

cargarRespuestas().then(respuestas => {
  respuestasJSON = respuestas;
});

// Definir nombreUsuario al comienzo del código o donde sea apropiado
let nombreUsuario = "";

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
        setTimeout(mostrarCaracter, 25); // Controla la velocidad de escritura
      }
    };

    mostrarCaracter();
  } else {
    nuevoMensaje.textContent = mensaje;
  }
}

// Event listener para el envío de mensajes
document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();
  const input = document.getElementById("mensaje-entrada");
  const mensaje = input.value;
  if (mensaje.trim() !== "") {
    procesarMensajeUsuario(mensaje);
    input.value = "";
  }
});
