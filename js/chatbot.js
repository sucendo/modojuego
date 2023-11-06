// Función para cargar el archivo JSON
function cargarRespuestas() {
  return fetch('../data/chatbotrespuestas.json')
    .then(response => response.json())
    .then(data => data.respuestas)
    .catch(error => {
      console.error('Error al cargar el archivo JSON:', error);
      return {};
    });
}

// Función para buscar palabras clave en el texto
function buscarPalabrasClave(texto, respuestas) {
  // Convierte el texto de entrada a minúsculas y quita tildes
  texto = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  for (const palabraClave in respuestas) {
    if (texto.includes(palabraClave)) {
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
  nuevoMensaje.textContent = `${usuario}: ${mensaje}`;
  chat.appendChild(nuevoMensaje);
}

// Cargar las respuestas y utilizarlas
cargarRespuestas()
  .then(respuestas => {
    const enviarButton = document.getElementById("enviar");

    enviarButton.addEventListener("click", function () {
      const userInput = document.getElementById("userInput");
      const pregunta = userInput.value;
      if (pregunta.trim() !== "") {
        mostrarMensaje("Usuario", pregunta);
        userInput.value = "";
        const respuesta = buscarPalabrasClave(pregunta, respuestas);
        if (respuesta) {
          mostrarMensaje("Robot", respuesta);
        } else {
          mostrarMensaje("Robot", "Lo siento, no entiendo tu pregunta.");
        }
      }
    });

    userInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        const pregunta = userInput.value;
        if (pregunta.trim() !== "") {
          mostrarMensaje("Usuario", pregunta);
          userInput.value = "";
          const respuesta = buscarPalabrasClave(pregunta, respuestas);
          if (respuesta) {
            mostrarMensaje("Robot", respuesta);
          } else {
            mostrarMensaje("Robot", "Lo siento, no entiendo tu pregunta.");
          }
        }
      }
    });
  });
