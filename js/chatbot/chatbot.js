/*
* chatbot.js
* By Sucendo 2024
*/

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
	cargarScript('js/chatbot/chatbotLogicaConversacional.js', function () {
		// Código que depende del script de utilidades
		// Aquí puedes iniciar tu aplicación después de cargar ambos scripts
	});
	cargarScript('js/chatbot/chatbotUtilidades.js', function () {
		// Código que depende del script de utilidades
		// Aquí puedes iniciar tu aplicación después de cargar ambos scripts
	});
	cargarScript('js/chatbot/chatbotPedia.js', function () {
		// Código que depende del script de utilidades
		// Aquí puedes iniciar tu aplicación después de cargar ambos scripts
	});
	cargarScript('js/chatbot/chatbotTranslate.js', function () {
		// Código que depende del script de utilidades
		// Aquí puedes iniciar tu aplicación después de cargar ambos scripts
	});
	cargarScript('js/chatbot/chatbotCorrector.js', function () {
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

/* ---------------------------------------------------------------------------------------- */

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
	
	const respuesta = manejarContextoConversacion(contextoConversacion, palabras, respuestas);
	if (respuesta) {
		return respuesta;
	}

	for (const palabraClave in respuestas) {
		const palabrasClave = palabraClave;

		// Usamos .includes() para verificar las frases compuestas
		if (textoNormalizado.includes(palabrasClave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
			if (palabrasClave === "hora") {
				return `${respuestas[palabrasClave]}` + ` ` + calcularHoraActual(texto);
			} else if (palabrasClave === "es hoy") {
				return calcularDiaHoy(texto);
			} else if (palabrasClave === "buenos dias" || palabrasClave === "buenas tardes" || palabrasClave === "buenas noches") {
				return saludoDia(texto);
			} else if (palabrasClave === "queda") {
				return calcularTiempoRestante(texto);
			}  else if (textoNormalizado.includes("cuanto es") || textoNormalizado.includes("calcula")) {
				const expresionMatematica = textoNormalizado.replace(/(cuanto es|calcula)/g, "").trim();
				try {
					const resultado = math.evaluate(expresionMatematica);
					return `${respuestas[palabrasClave]} ${resultado}`;
				} catch (error) {
					return "No pude resolver la operación matemática.";
				}
			}  else if (textoNormalizado.includes("me llamo") || textoNormalizado.includes("soy")) {
				const palabras = texto.split(" ");
				const nombreIndex = palabras.findIndex(palabra => palabra === "llamo" || palabra === "soy");
				if (nombreIndex !== -1 && nombreIndex < palabras.length - 1) {
					const nuevoNombreUsuario = palabras[nombreIndex + 1];
					if (nuevoNombreUsuario) {
						nombreUsuario = nuevoNombreUsuario;
						if (nombreUsuario.toLowerCase() === "sucendo") {
							contextoConversacion.juegoIniciado = true;
							contextoConversacion.palabraClave = "jugar";
							return "Hola creador mío, ¿quieres jugar?";
						} else {
							return `Encantado de conocerte, ${nombreUsuario}!`;
						}
					}
				}
			} else if (textoNormalizado.includes("significado") && textoNormalizado.includes("nombre")) {
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
				if (contextoConversacion.palabraClave === "chiste") {
					const respuestasChiste = respuestas[palabraClave];
					const chisteAleatorio = respuestasChiste[Math.floor(Math.random() * respuestasChiste.length)];
					return chisteAleatorio;
				} else {
					contextoConversacion.palabraClave = "chiste";
					contextoConversacion.repeticiones = 0;
					const chisteInicial = respuestas[palabraClave][0];
					return chisteInicial;
				}
			} else if (textoNormalizado.includes("busca") || textoNormalizado.includes("que es") || textoNormalizado.includes("quien es")) {		
				// Extraer la consulta eliminando las palabras clave "busca" o "que es"
				const consultaOriginal = texto.replace(/busca|Busca|que es|Que es|quien es|Quien es/g, "").trim();
				
				// Si hay una consulta válida, proceder
				if (consultaOriginal) {
					// Corregir ortografía de la consulta antes de buscar
					const consultaCorregida = await corregirConsulta(consultaOriginal);

					// Luego, realizar la búsqueda en Wikipedia
					const resultado = await buscarEnWikipedia(consultaCorregida);  // Esperar la respuesta de la búsqueda
					return `Esto es lo que encontré sobre "${consultaCorregida}":\n${resultado}`;
				} else {
					return "Por favor, proporciona algo para buscar en Wikipedia.";
				}
			} else if (textoNormalizado.includes("como se escribe")) {
				// Extraer la consulta eliminando las palabras clave "como se escribe"
				const consulta = texto.replace(/como se escribe|Como se escribe/g, "").trim();

				if (consulta) {
					const sugerencias = await consultarLanguageTool(consulta);

					if (sugerencias && sugerencias.length > 0) {
						// Filtrar las sugerencias por distancia de Levenshtein
						const sugerenciasCercanas = sugerencias
							.map(sugerencia => ({
								sugerenciasFiltradas: sugerencia.sugerencia.filter(palabraSugerida => levenshteinDistance(consulta, palabraSugerida) <= 2), // Limitar por distancia
								motivo: sugerencia.mensaje !== "Se ha encontrado un posible error ortográfico." ? sugerencia.mensaje : ""
							}))
							.filter(sugerencia => sugerencia.sugerenciasFiltradas.length > 0);

						if (sugerenciasCercanas.length > 0) {
							// Si solo hay una sugerencia
							if (sugerenciasCercanas.length === 1 && sugerenciasCercanas[0].sugerenciasFiltradas.length === 1) {
								// Si no hay motivo relevante, devolver solo la sugerencia
								if (!sugerenciasCercanas[0].motivo) {
									return `La forma correcta de escribirlo es: "${sugerenciasCercanas[0].sugerenciasFiltradas[0]}"`;
								} else {
									// Mostrar la sugerencia con el motivo (si aplica)
									return `La forma correcta de escribirlo es: "${sugerenciasCercanas[0].sugerenciasFiltradas[0]}" \nMotivo: ${sugerenciasCercanas[0].motivo}`;
								}
							}
							
							// Mostrar todas las sugerencias cercanas (sin limitar)
							const resultado = sugerenciasCercanas.map(sugerencia =>
								`Sugerencia: ${sugerencia.sugerenciasFiltradas.join(', ')}${sugerencia.motivo ? ` \nMotivo: ${sugerencia.motivo}` : ""}`
							).join('\n');
							return `Posibles correcciones para "${consulta}":\n${resultado}`;
						} else {
							return `No se encontraron correcciones útiles para "${consulta}".`;
						}
					} else {
						return `No se encontraron correcciones para "${consulta}".`;
					}
				} else {
					return "No entiendo nada de lo que has escrito.";
				}
			}else if (textoNormalizado.startsWith("traduce al") || textoNormalizado.includes("traduccion al")) {
				// Extraer el idioma y la frase a traducir
				let partes = texto.replace(/traduce al|Traduce al|Traduccion al|Traduccion al/g, "").trim().split(" ");
				let idiomaTexto = partes.shift(); // El primer elemento es el idioma
				let frase = partes.join(" "); // El resto es la frase a traducir

				// Corregir el nombre del idioma
				idiomaTexto = await corregirConsulta(idiomaTexto);

				// Corregir el texto a traducir
				frase = await corregirConsulta(frase);

				// Verificar si el idioma es soportado
				const idiomaDestino = idiomasSoportados[idiomaTexto];
				
				if (idiomaDestino && frase) {
					const traduccion = await traducirGoogle(frase, idiomaDestino); // Traducir al idioma especificado
					return `Traducción al ${idiomaTexto}: "${traduccion}"`;
				} else if (!idiomaDestino) {
					return `Lo siento, no soportamos traducciones al idioma "${idiomaTexto}".`;
				} else {
					return "Por favor, proporciona una frase para traducir.";
				}
			} else if (palabraClave in respuestas) {
				const respuestasCategoria = respuestas[palabraClave];
				if (respuestasCategoria.length === 1) {
					contextoConversacion.palabraClave = palabrasClave;
					contextoConversacion.repeticiones = 0;
					return respuestasCategoria[0];
				} else {
					const respuestaAleatoria = respuestasCategoria[Math.floor(Math.random() * respuestasCategoria.length)];
					contextoConversacion.palabraClave = palabrasClave;
					contextoConversacion.repeticiones = 0;
					return respuestaAleatoria;
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

/* ----------------------------------------FUNCIONALIDADES DEL FONTEND DEL CHATMUBOT------------------------------------------- */

// Función para mostrar mensajes en el chat
function mostrarMensaje(usuario, mensaje) {
	const chat = document.getElementById("chat");
	const nuevoMensaje = document.createElement("div");
	nuevoMensaje.className = usuario === "Usuario" ? "mensaje-usuario" : "mensaje-robot";

	// Verifica si el usuario es el Robot (chatbot) para aplicar el efecto de escritura
	if (usuario === "Robot" && typeof mensaje === "string") {
		// Dividir el mensaje en caracteres para el efecto de escritura
		const caracteres = mensaje.split("");
		let index = 0;

		const velocidadEscritura = mensaje.length > 250 ? 1 : 25;

		const mostrarCaracter = () => {
			if (index < caracteres.length) {
				nuevoMensaje.innerHTML += caracteres[index]; // Usamos innerHTML en vez de textContent para permitir HTML
				index++;
				setTimeout(mostrarCaracter, velocidadEscritura);
			}
		};

		mostrarCaracter();
	} else {
		nuevoMensaje.innerHTML = mensaje; // Usamos innerHTML para permitir HTML
	}

	chat.appendChild(nuevoMensaje);
	chat.scrollTop = chat.scrollHeight; // Desplazar automáticamente hacia abajo
}

// Cargar las respuestas y utilizarlas
cargarRespuestas().then(respuestas => {
	const enviarButton = document.getElementById("enviar");
	const userInput = document.getElementById("userInput");

	// Evento para el botón de enviar
	enviarButton.addEventListener("click", async function () {
		const textoUsuario = userInput.value;

		// Corregir el texto antes de continuar
		const { corregidoHTML, corregidoSimple } = await corregirTexto(textoUsuario);

		if (corregidoSimple.trim() !== "") {
			// Mostrar la versión corregida con HTML en el chat
			mostrarMensaje("Usuario", corregidoHTML);
			userInput.value = ""; // Limpiar el input después de enviar

			// Hacer la búsqueda en Wikipedia o cualquier otra acción con la versión simple
			buscarPalabrasClave(corregidoSimple, respuestas)
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

	// Evento para presionar Enter
	userInput.addEventListener("keyup", async function (event) {
		if (event.key === "Enter") {
			const textoUsuario = userInput.value;

			// Corregir el texto antes de continuar
			const { corregidoHTML, corregidoSimple } = await corregirTexto(textoUsuario);

			if (corregidoSimple.trim() !== "") {
				// Mostrar la versión corregida con HTML en el chat
				mostrarMensaje("Usuario", corregidoHTML);
				userInput.value = ""; // Limpiar el input después de enviar

				// Hacer la búsqueda en Wikipedia o cualquier otra acción con la versión simple
				buscarPalabrasClave(corregidoSimple, respuestas)
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
		botonModo.textContent = "☀️";
	} else {
		botonModo.textContent = "🌙";
	}
}
