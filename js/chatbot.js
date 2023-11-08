// Función para cargar el archivo JSON de respuestas
function cargarRespuestas() {
  // Colocar el foco en la caja de texto al cargar la página
  const userInput = document.getElementById("userInput");
  userInput.focus();
  
  return fetch('data/chatbotrespuestas.json')
    .then(response => response.json())
    .catch(error => {
      console.error('Error al cargar el archivo JSON:', error);
      return {};
    });
}

// Función para normalizar el texto
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Definir un objeto para mantener el contexto de la conversación
let contextoConversacion = {
  palabraClave: null, // La palabra clave actual
  repeticiones: 0, // Número de veces que se ha pedido más de lo mismo
};

// Definir nombreUsuario al comienzo del código o donde sea apropiado
let nombreUsuario = "";

// Definir un objeto para almacenar datos temporales
let datosTemporales = {};

// Función para buscar palabras clave
function buscarPalabrasClave(texto, respuestas) {
  texto = normalizarTexto(texto);

  const palabras = texto;

  if (contextoConversacion.palabraClave) {
    if (palabras.includes("otro") || palabras.includes("más")) {
      contextoConversacion.repeticiones++;
      if (contextoConversacion.repeticiones > 2) {
        contextoConversacion.palabraClave = null;
        contextoConversacion.repeticiones = 0;
        return "¡Has tenido suficiente de eso! ¿En qué más puedo ayudarte?";
      }
      const respuestasCategoria = respuestas[contextoConversacion.palabraClave];
      if (respuestasCategoria) {
        let respuestaAleatoria = respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
        respuestaAleatoria = respuestaAleatoria.replace(contextoConversacion.palabraClave, "").trim();
        return respuestaAleatoria;
      }
    } else {
      contextoConversacion.palabraClave = null;
      contextoConversacion.repeticiones = 0;
    }
  }

  for (const palabraClave in respuestas) {
    const palabrasClave = palabraClave;
    if (palabras.includes(palabrasClave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
      if (palabrasClave === "hora") {
        const ahora = new Date();
        const horaActual = `${ahora.getHours()}:${ahora.getMinutes()}`;
        return `${respuestas[palabrasClave]} ${horaActual}`;
      } else if (palabrasClave === "es hoy") {
        const ahora = new Date();
        const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const fechaYDia = ahora.toLocaleDateString("es-ES", opcionesFecha);
        return `Hoy es ${fechaYDia}`;
      } else if (palabrasClave === "cuanto es") {
        const expresionMatematica = texto.replace(palabrasClave, "").trim();
        try {
          const resultado = math.evaluate(expresionMatematica);
          return `${respuestas[palabrasClave]} ${resultado}`;
        } catch (error) {
          return "No pude resolver la operación matemática.";
        }
      /*} else if (palabrasClave.includes("chiste") || palabrasClave.includes("gracias") || palabrasClave.includes("cuéntame una curiosidad")) {
        const respuestasCategoria = respuestas[palabrasClave];
        if (respuestasCategoria) {
          contextoConversacion.palabraClave = palabrasClave;
          contextoConversacion.repeticiones = 0;
          const respuestaAleatoria = respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
          return respuestaAleatoria;
        }*/
      } else if (palabras.includes("me llamo") || palabras.includes("soy")) {
        const nombre = palabras[palabras.indexOf("me llamo") + 1] || palabras[palabras.indexOf("soy") + 1];
        if (nombre) {
          nombreUsuario = nombre.trim();
          return `Encantado de conocerte, ${nombreUsuario}!`;
        }
      } else if (palabras.includes("guardar")) {
        const palabras = texto.split(" ");
        const datoIndex = palabras.indexOf("guardar");
      
        if (datoIndex !== -1 && datoIndex < palabras.length - 1) {
          const clave = palabras[datoIndex + 1];
          if (clave) {
            // Genera una clave única
            const dato = palabras[datoIndex + 2];
            datosTemporales[clave] = dato;
            return `He guardado "${dato}" temporalmente con la clave "${clave}".`;
          }
        }
      } else if (palabras.includes("mostrar")) {
        const palabras = texto.split(" ");
        const datoIndex = palabras.indexOf("mostrar");
      
        if (datoIndex !== -1 && datoIndex < palabras.length - 1) {
          const clave = palabras[datoIndex + 1];
          const dato = datosTemporales[clave];
          if (dato) {
            return `El dato almacenado con la clave "${clave}" es: "${dato}".`;
          } else {
            return "No se ha encontrado ningún dato almacenado con la clave especificada.";
          }
        }  
      } else if (palabraClave in respuestas) {
        // Aquí, aseguramos que siempre se elija la única respuesta si solo hay una
        const respuestasCategoria = respuestas[palabraClave];
        if (respuestasCategoria.length === 1) {
          return respuestasCategoria[0];
        } else {
          //return respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
          const respuestasCategoria = respuestas[palabrasClave];
          if (respuestasCategoria) {
            contextoConversacion.palabraClave = palabrasClave;
            contextoConversacion.repeticiones = 0;
            const respuestaAleatoria = respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
            return respuestaAleatoria;
          }          
        }
      }
    }
  }

  const respuestasNoEntender = respuestas["no_entender"];
  if (respuestasNoEntender) {
    return respuestasNoEntender[Math.floor(Math.random() * respuestasNoEntender.length)];
  }
  return "Lo siento, no entiendo tu pregunta.";
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
