/*
* chatbot.js
* By Sucendo 2024
*/

/* chatbot.js */

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
cargarScript('js/chatbot/chatbot.js', function () {
  // Código que depende del script principal
	cargarScript('js/chatbot/logicaConversacional.js', function () {
		// Código que depende del script de utilidades
		// Aquí puedes iniciar tu aplicación después de cargar ambos scripts
	  });
	  cargarScript('js/chatbot/chatbotutil.js', function () {
		// Código que depende del script de utilidades
		// Aquí puedes iniciar tu aplicación después de cargar ambos scripts
	  });
});

// Función para cargar el archivo JSON de respuestas
function cargarRespuestas() {
	  // Colocar el foco en la caja de texto al cargar la página
	  const userInput = document.getElementById("userInput");
	  userInput.focus();

	  return fetch('data/chatbot/chatbotrespuestas.json')
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

// Función para crear una lista como un string con saltos de línea en ASCII
function crearListaHTML(elementos) {
	const listaHTML = elementos.map(elemento => `- ${elemento}`).join('\n');
	return listaHTML;
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

	const palabras = textoNormalizado.split(" ");
	
	const respuesta = manejarContextoConversacion(contextoConversacion, palabras, respuestas); // Llama a la función para manejar el contexto de la conversación
	if (respuesta) {
		// Si hay una respuesta, la mostramos en el chat
		return respuesta;
	}

	for (const palabraClave in respuestas) {
		const palabrasClave = palabraClave;
		if (palabras.includes(palabrasClave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
			if (palabrasClave === "hora") {
				return `${respuestas[palabrasClave]}` + ` `+ calcularHoraActual(texto);
			} else if (palabrasClave === "es hoy") {
				return calcularDiaHoy(texto);
			} else if ((palabrasClave === "buenos dias")|| (palabrasClave === "buenas tardes")|| (palabrasClave === "buenas noches")) {
				return saludoDia(texto);
			} else if (palabrasClave === "queda") {
				return calcularTiempoRestante(texto);
			} else if (palabras.includes("cuanto es") || palabras.includes("calcula")) {
				const expresionMatematica = texto.replace(palabrasClave, "").trim();
				try {
					  const resultado = math.evaluate(expresionMatematica);
					  return `${respuestas[palabrasClave]} ${resultado}`;
				} catch (error) {
					return "No pude resolver la operación matemática.";
				}
			} else if (textoNormalizado.includes("me llamo") || textoNormalizado.includes("soy")) {
				// Extraer el nombre del usuario del texto
				const palabras = texto.split(" ");
				const nombreIndex = palabras.findIndex(palabra => palabra === "llamo" || palabra === "soy");
				if (nombreIndex !== -1 && nombreIndex < palabras.length - 1) {
					const nuevoNombreUsuario = palabras[nombreIndex + 1];
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
			} else if (textoNormalizado.includes("significado") && textoNormalizado.includes("nombre")) {
				// Mostrar un mensaje preguntando al usuario si quiere conocer el significado de su nombre
				contextoConversacion.palabraClave = "significado_nombre";
				return "¿Quieres saber el significado de tu nombre?";
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
			} else if (palabraClave === "chiste") {
				// El usuario solicita otro chiste
				if (contextoConversacion.palabraClave === "chiste") {
					// Si ya se contó un chiste antes, ofrecer otro
					const respuestasChiste = respuestas[palabraClave];
					const chisteAleatorio = respuestasChiste[Math.floor(Math.random() * respuestasChiste.length)];
					return chisteAleatorio;
				} else {
					// Primer chiste
					contextoConversacion.palabraClave = "chiste";
					contextoConversacion.repeticiones = 0;
					const chisteInicial = respuestas[palabraClave][0];
					return chisteInicial;
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

function cambiarModo() {
    // Alternar la clase 'modo-nocturno' en el cuerpo del documento
    document.body.classList.toggle("modo-nocturno");
    
    // Cambiar el texto del botón según el modo actual
    const botonModo = document.getElementById("btnModo");
    if (document.body.classList.contains("modo-nocturno")) {
        botonModo.textContent = "Modo diurno";
    } else {
        botonModo.textContent = "Modo nocturno";
    }
}

