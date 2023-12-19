// Función para cargar un script de forma dinámica
function cargarScript(nombreArchivo, callback) {
  const script = document.createElement('script');
  script.src = nombreArchivo;
  script.defer = true;

  // Manejar el evento de carga del script
  script.onload = callback;

  // Agregar el script al final del cuerpo del documento
  document.body.appendChild(script);
}

// Uso de la función para cargar el script principal y el script de utilidades
cargarScript('js/chatbot.js', function () {
  // Código que depende del script principal
  cargarScript('js/chatbotutil.js', function () {
    // Código que depende del script de utilidades
    // Aquí puedes iniciar tu aplicación después de cargar ambos scripts
  });
});

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

// Función para buscar en Wikipedia
async function buscarEnWikipedia(consulta) {
  try {
    const respuesta = await fetch('https://es.wikipedia.org/w/api.php' +
      `?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=${consulta}`);
    const data = await respuesta.json();

    // Extraer el extracto de la primera página (puede haber varias páginas en la respuesta)
    const pages = data.query.pages;
    const primeraPaginaId = Object.keys(pages)[0];
    const extracto = pages[primeraPaginaId].extract;

    return extracto || 'No se encontró información.';
  } catch (error) {
    console.error('Error al buscar en Wikipedia:', error);
    return 'Hubo un error al buscar en Wikipedia.';
  }
}

// Función para normalizar el texto
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Definir un objeto para mantener el contexto de la conversación
let contextoConversacion = {
  palabraClave: null,
  repeticiones: 0,
  juegoIniciado: false,
  listaPeliculasSolicitada: false, // Nuevo contexto para gestionar la solicitud de lista de películas
};

// Definir nombreUsuario al comienzo del código o donde sea apropiado
let nombreUsuario = "";

// Definir un objeto para almacenar datos temporales
let datosTemporales = {};

// Función para buscar palabras clave
async function buscarPalabrasClave(texto, respuestas) {
  textoNormalizado = normalizarTexto(texto);

  const palabras = textoNormalizado;

  if (contextoConversacion.palabraClave) {
    if (contextoConversacion.palabraClave === "chiste") {
      if (palabras.includes("otro") || palabras.includes(normalizarTexto("más"))) {
        contextoConversacion.repeticiones++;
        if (contextoConversacion.repeticiones > 2) {
          contextoConversacion.palabraClave = null;
          contextoConversacion.repeticiones = 0;
          return "¡Has tenido suficiente de eso! ¿En qué más puedo ayudarte?";
        }
        const respuestasCategoria = respuestas[contextoConversacion.palabraClave];
        if (respuestasCategoria) {
          const respuestaAleatoria = respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
          // Reemplazar todas las instancias de la palabra clave en la respuesta
          const respuestaFormateada = respuestaAleatoria.replace(new RegExp(contextoConversacion.palabraClave, "gi"), "").trim();
          return respuestaFormateada;
        }
      }
    } else if (normalizarTexto(contextoConversacion.palabraClave) === normalizarTexto("película favorita") ){
      if (palabras.includes(normalizarTexto("sí")) || palabras.includes(normalizarTexto("vale"))) {
        // El usuario quiere ver la lista de películas
        contextoConversacion.listaPeliculasSolicitada = false; // Restablecer el contexto

        const peliculas = respuestas["peliculas_lista"];
        
        if (peliculas && peliculas.length > 0) {
          // Construir la lista HTML
          const listaHTML = "<ul>" + peliculas.map(pelicula => `<li>${pelicula}</li>`).join("") + "</ul>";
          return `Aquí tienes algunas de mis películas favoritas:\n${listaHTML}`;
        } else {
          return "No hay películas disponibles en este momento.";
        }
      } else {
        // El usuario no quiere ver la lista de películas
        contextoConversacion.palabraClave = null;
        return "Entendido. ¿En qué más puedo ayudarte?";
      }
    } else if (normalizarTexto(contextoConversacion.palabraClave) === normalizarTexto("jugar") ){
      if (palabras.includes(normalizarTexto("sí")) ||  palabras.includes(normalizarTexto("vale")) ) {
        // El usuario quiere ver la lista de películas
        contextoConversacion.repeticiones++;
        if (contextoConversacion.repeticiones ===1) {
          return "Empezamos. ¿Quieres jugar a la Guerra Termonuclear?";
    	  }else{
    		  return "¿A quién te pides?"
    	  }
      }else{
        return "Una pena...";
      }
    } else if (contextoConversacion.palabraClave === "adivinanza") {
      // El usuario quiere una adivinanza
      const adivinanzaActual = respuestas[contextoConversacion.palabraClave][0]; // Obtener la adivinanza actual
      const respuestaCorrecta = normalizarTexto(adivinanzaActual.respuesta);

      // Verificar si la respuesta del usuario es correcta
      if (palabras.includes(respuestaCorrecta)) {
        contextoConversacion.palabraClave = null; // Reiniciar el contexto
        return "¡Correcto! ¡Eres un experto en adivinanzas!";
      } else {
        return "Incorrecto. ¿Quieres intentarlo de nuevo o preguntarme algo más?";
      }
    } else {    
      // El usuario no quiere ver la lista de películas
      contextoConversacion.palabraClave = null;
      return "Entendido. ¿En qué más puedo ayudarte?";
    }
  }

  for (const palabraClave in respuestas) {
    const palabrasClave = palabraClave;
    if (palabras.includes(palabrasClave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
      if (palabrasClave === "hora") {
		    return `${respuestas[palabrasClave]}` + ` `+ calcularHoraActual(texto);
      } else if (palabrasClave === "es hoy") {
		    return calcularDiaHoy(texto);
      } else if (palabraClave === "queda") {
		    return calcularTiempoRestante(texto);
      } else if (palabras.includes("cuanto es") || palabras.includes("calcula")) {
		    const expresionMatematica = texto.replace(palabrasClave, "").trim();
    		try {
    		  const resultado = math.evaluate(expresionMatematica);
    		  return `${respuestas[palabrasClave]} ${resultado}`;
    		} catch (error) {
    		  return "No pude resolver la operación matemática.";
    		}
      } else if ((palabras.includes("me llamo") || palabras.includes("soy")) && !palabras.includes("como")) {
  		  const palabrasClaveEncontradas = Object.keys(respuestas).filter(pc => palabras.includes(pc));
  		  if (palabrasClaveEncontradas.length > 0) {
    		  // Extraer el nombre del usuario del texto original
    		  const posicionPalabraClave = palabras.indexOf(palabrasClaveEncontradas[0]);
    		  // Obtener la parte del texto después de la palabra clave
    		  const nuevoNombreUsuario = texto.substring(posicionPalabraClave + palabrasClaveEncontradas[0].length).trim();

    		  if (nuevoNombreUsuario) {
      			// Asignar el nombre a la variable global
      			nombreUsuario = nuevoNombreUsuario;

      			// Verificar si el nombre es "Sucendo"
      			if (nombreUsuario.toLowerCase() === "sucendo") {
        			contextoConversacion.juegoIniciado = true; // Iniciar el juego
        			contextoConversacion.palabraClave = "jugar";		  
        			return "Hola creador mío, ¿quieres jugar?";
        	  
        		} else {
        			return `Encantado de conocerte, ${nombreUsuario}!`;
        		}
    		  }
    		}
      } else if (palabras.includes("como") && palabras.includes("me") && palabras.includes("llamo")) {
    		if (nombreUsuario) {
    			return `Te llamas ${nombreUsuario}.`;
    		} else {
    			return "Lo siento, no tengo esa información. ¿Cómo te llamas?";
    		}
      } else if (palabras.includes(normalizarTexto("adivinanza"))) {
  		  contextoConversacion.palabraClave = "adivinanza";
  		  // Aquí puedes mostrar la adivinanza al usuario
  		  mostrarMensaje("Robot", respuestas["adivinanza"][0]);
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
          contextoConversacion.palabraClave = palabrasClave;
          contextoConversacion.repeticiones = 0;
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
    const respuestaNoEntender = respuestasNoEntender[Math.floor(Math.random() * respuestasNoEntender.length)];

    // Buscar en Wikipedia si no se entiende la pregunta
    /*	
    if (respuestaNoEntender.includes("no entiendo") || respuestaNoEntender.includes("no sé")) {
      const consulta = palabras.join(" "); // Usar la pregunta completa como consulta
      const respuestaWikipedia = await buscarEnWikipedia(consulta);

      return [respuestaNoEntender, respuestaWikipedia];
    }
  */
    return respuestaNoEntender;
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

/// Cargar las respuestas y utilizarlas
cargarRespuestas().then(respuestas => {
  const enviarButton = document.getElementById("enviar");
  const userInput = document.getElementById("userInput");

  enviarButton.addEventListener("click", function () {
    const pregunta = userInput.value;
    if (pregunta.trim() !== "") {
      mostrarMensaje("Usuario", pregunta);
      userInput.value = "";
      buscarPalabrasClave(pregunta, respuestas)
        .then(respuesta => {
          if (respuesta) {
            mostrarMensaje("Robot", respuesta);
          } else {
            mostrarMensaje("Robot", "Lo siento, no entiendo tu pregunta.");
          }
        })
        .catch(error => console.error('Error:', error));
    }
  });

  userInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      const pregunta = userInput.value;
      if (pregunta.trim() !== "") {
        mostrarMensaje("Usuario", pregunta);
        userInput.value = "";
        buscarPalabrasClave(pregunta, respuestas)
          .then(respuesta => {
            if (respuesta) {
              mostrarMensaje("Robot", respuesta);
            } else {
              mostrarMensaje("Robot", "Lo siento, no entiendo tu pregunta.");
            }
          })
          .catch(error => console.error('Error:', error));
      }
    }
  });
});
