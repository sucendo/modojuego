// Función para cargar el archivo JSON de respuestas
function cargarRespuestas() {
  return fetch('data/chatbotrespuestas.json')
    .then(response => response.json())
    .catch(error => {
      console.error('Error al cargar el archivo JSON:', error);
      return {};
    });
}

function buscarPalabrasClave(texto, respuestas) {
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
      } else if (palabraClave === "chiste" || palabraClave === "gracias") {
        const respuestasCategoria = respuestas[palabraClave];
      
        if (respuestasCategoria) {
          const respuestaAleatoria = respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
          return respuestaAleatoria;
        }
      } else if (palabraClave === "nombre") {
        // Si la pregunta es sobre el nombre del chatbot
        return respuestas[palabraClave];
      } else if (nombreUsuario && (texto.includes("me llamo") || texto.includes("soy "))) {
        // Si el usuario responde con su nombre después de la pregunta sobre el nombre del chatbot
        return `Encantado de conocerte, ${nombreUsuario}`;
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
cargarRespuestas().then(respuestas => {
  const enviarButton = document.getElementById("enviar");
  const userInput = document.getElementById("userInput");

  enviarButton.addEventListener("click", function () {
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
