// Función para cargar el archivo JSON de respuestas
function cargarRespuestas() {
  return fetch('data/chatbotrespuestas.json')
    .then(response => response.json())
    .catch(error => {
      console.error('Error al cargar el archivo JSON:', error);
      return {};
    });
}

// Definir un objeto para mantener el contexto de la conversación
const contextoConversacion = {
  palabraClave: null,
  repeticiones: 0,
};
// Definir nombreUsuario al comienzo del código o donde sea apropiado
let nombreUsuario = "";

function buscarPalabrasClave(texto, respuestas, contextoConversacion) {
  // Normalizar el texto de entrada
  texto = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Función para manejar respuestas genéricas
  function responderConRespuestaGenerica(palabraClave) {
    const respuestasCategoria = respuestas[palabraClave];
    if (respuestasCategoria) {
      return respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
    }
    return null;
  }

  // Verificar si se está pidiendo más del mismo tipo
  if (contextoConversacion.palabraClave) {
    // Comprobar si el usuario quiere otro
    if (texto.includes("otro") || texto.includes("más")) {
      contextoConversacion.repeticiones++;
      if (contextoConversacion.repeticiones > 2) {
        // Si se pidió más de 2 veces, reiniciamos el contexto
        contextoConversacion.palabraClave = null;
        contextoConversacion.repeticiones = 0;
        return "¡Has tenido suficiente de eso! ¿En qué más puedo ayudarte?";
      }
      // Obtener más del mismo tipo
      const respuesta = responderConRespuestaGenerica(contextoConversacion.palabraClave);
      if (respuesta) {
        // Suprimir la palabra clave de la respuesta
        return respuesta.replace(contextoConversacion.palabraClave, "").trim();
      }
    } else {
      // Si no se solicita más del mismo tipo, reiniciamos el contexto
      contextoConversacion.palabraClave = null;
      contextoConversacion.repeticiones = 0;
    }
  }

  for (const palabraClave in respuestas) {
    if (texto.includes(palabraClave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
      let respuesta = null;

      switch (palabraClave) {
        case "hora":
          const ahora = new Date();
          const horaActual = `${ahora.getHours()}:${ahora.getMinutes()}`;
          respuesta = `${respuestas[palabraClave]} ${horaActual}`;
          break;

        case "es hoy":
          const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
          const fechaYDia = new Date().toLocaleDateString("es-ES", opcionesFecha);
          respuesta = `Hoy es ${fechaYDia}`;
          break;

        case "cuanto es":
          const expresionMatematica = texto.replace(palabraClave, "").trim();
          try {
            const resultado = math.evaluate(expresionMatematica);
            respuesta = `${respuestas[palabraClave]} ${resultado}`;
          } catch (error) {
            respuesta = "No pude resolver la operación matemática.";
          }
          break;

        case "chiste":
        case "gracias":
        case "cuéntame una curiosidad":
          respuesta = responderConRespuestaGenerica(palabraClave);
          if (respuesta) {
            contextoConversacion.palabraClave = palabraClave;
            contextoConversacion.repeticiones = 0;
          }
          break;

        case "tu nombre":
        case "te llamas":
          respuesta = responderConRespuestaGenerica(palabraClave);
          break;

        default:
          respuesta = respuestas[palabraClave];
          break;
      }

      if (respuesta) {
        return respuesta;
      }
    }
  }
  return respuestas["no_entender"][Math.floor(Math.random() * respuestas["no_entender"].length)];
}

// Función para mostrar mensajes en el chat
function mostrarMensaje(usuario, mensaje) {
  const chat = document.getElementById("chat");
  const nuevoMensaje = document.createElement("div");
  nuevoMensaje.className = usuario === "Usuario" ? "mensaje-usuario" : "mensaje-robot";

  chat.appendChild(nuevoMensaje);

  // Verifica si el usuario es el Robot (chatbot) para aplicar el efecto de escritura
  if (usuario === "Robot" && typeof mensaje === "string") {
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
      const respuesta = buscarPalabrasClave(pregunta, respuestas, contextoConversacion); // Añadir contextoConversacion
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
