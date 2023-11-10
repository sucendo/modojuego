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
  textoNormalizado = normalizarTexto(texto);

  const palabras = textoNormalizado;

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
      } else if (palabrasClave === "queda") {
        // Expresión regular mejorada para buscar patrones de fecha y hora
        const patronFechaHora = /(\d{1,2}\/\d{1,2}\/\d{4})\s*(\d{1,2}h:\d{1,2})?/i;
        const coincidenciasFechaHora = texto.match(patronFechaHora);
      
        if (coincidenciasFechaHora) {
          const fecha = coincidenciasFechaHora[1];
          const hora = coincidenciasFechaHora[2];
      
          if (fecha || hora) {
            // Calcular tiempo que queda para la fecha y hora especificadas
            const ahora = new Date();
            let fechaEspecifica = null;
      
            if (fecha) {
              const [dia, mes, anio] = fecha.split('/').map(Number);
              fechaEspecifica = new Date(anio, mes - 1, dia); // Meses en JavaScript van de 0 a 11
            }
      
            if (hora) {
              const [hora, minutos] = hora.split(':').map(Number);
              if (!fechaEspecifica) {
                // Si no se especificó la fecha, usar la fecha actual
                fechaEspecifica = new Date();
              }
              fechaEspecifica.setHours(hora, minutos);
            }
      
            const tiempoRestante = fechaEspecifica - ahora;
      
            if (tiempoRestante > 0) {
              const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
              const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
      
              if (dias > 365) {
                const anos = Math.floor(dias / 365);
                const diasRestantes = dias % 365;
                return `Quedan ${anos} años, ${diasRestantes} días, ${horas} horas y ${minutos} minutos para la fecha especificada.`;
              } else {
                return `Quedan ${dias} días, ${horas} horas y ${minutos} minutos para la fecha especificada.`;
              }
            } else {
              return `La fecha y hora especificadas ya han pasado.`;
            }
          }
        }
      } else if (palabras.includes("cuanto es") || palabras.includes("calcula")) {
        const expresionMatematica = texto.replace(palabrasClave, "").trim();
        try {
          const resultado = math.evaluate(expresionMatematica);
          return `${respuestas[palabrasClave]} ${resultado}`;
        } catch (error) {
          return "No pude resolver la operación matemática.";
        }
      } else if (palabras.includes("me llamo") || palabras.includes("soy")) {
        const palabrasClaveEncontradas = Object.keys(respuestas).filter(pc => palabras.includes(pc));
        if (palabrasClaveEncontradas.length > 0) {
          // Extraer el nombre del usuario del texto original
          const posicionPalabraClave = palabras.indexOf(palabrasClaveEncontradas[0]);
          const nombreUsuario = texto.substring(posicionPalabraClave + palabrasClaveEncontradas[0].length).trim();
          
          if (nombreUsuario) {
            return `Encantado de conocerte, ${nombreUsuario}!`;
          }
        }
      } else if (palabras.includes("como") && palabras.includes("me") && palabras.includes("llamo")) {
        if (nombreUsuario) {
          return `Te llamas ${nombreUsuario}.`;
        } else {
          return "Lo siento, no tengo esa información. ¿Cómo te llamas?";
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
