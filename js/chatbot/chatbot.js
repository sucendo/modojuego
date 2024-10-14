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

// Función para verificar la ortografía con la API de la RAE
async function verificarOrtografiaRAE(palabra) {
	const url = `https://dle.rae.es/data/search?w=${encodeURIComponent(palabra)}`;

	try {
		const respuesta = await fetch(url);
		const data = await respuesta.json();

		if (data.length > 0 && data[0].header) {
			// La palabra está en el diccionario, la devolvemos tal cual
			return `La palabra "${palabra}" está correctamente escrita.`;
		} else {
			// Si no está en el diccionario, devolver sugerencias
			return `La palabra "${palabra}" no se encuentra en el DLE.`;
		}
	} catch (error) {
		console.error("Error al consultar la RAE:", error);
		return `Hubo un error al consultar la RAE para la palabra "${palabra}".`;
	}
}


// Función de corrección ortográfica básica usando Levenshtein
function levenshteinDistance(a, b) {
	const matrix = [];

	// Incrementamos las letras
	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // reemplazo
					matrix[i][j - 1] + 1,     // inserción
					matrix[i - 1][j] + 1      // eliminación
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

// Simulamos un diccionario local con palabras comunes en español
const diccionario = [
    // Palabras comunes
    "revolución", "ortografía", "inteligencia", "palabra", "computadora", "escribir", "hola", "adiós",
    "amor", "amistad", "felicidad", "tristeza", "esperanza", "familia", "trabajo", "salud", "dinero", 
    "comida", "bebida", "agua", "fuego", "tierra", "aire", "sol", "luna", "estrella", "planeta", 
    "universo", "cielo", "mar", "río", "montaña", "bosque", "ciudad", "pueblo", "casa", "edificio", 
    "carro", "bicicleta", "avión", "barco", "tren", "camión", "animal", "perro", "gato", "pájaro", 
    "pez", "caballo", "león", "tigre", "elefante", "zorro", "lobo", "ratón", "conejo", "serpiente", 
    "insecto", "mariposa", "abeja", "araña", "mosca", "libro", "carta", "teléfono", "televisión", 
    "radio", "música", "película", "teatro", "deporte", "fútbol", "baloncesto", "tenis", "golf", 
    "natación", "esquí", "ciclismo", "carrera", "boxeo", "lucha", "arte", "pintura", "escultura", 
    "dibujo", "fotografía", "museo", "historia", "ciencia", "matemáticas", "física", "química", 
    "biología", "geografía", "lengua", "literatura", "poesía", "novela", "cuento", "ensayo", 
    "palabra", "frase", "oración", "parrafo", "idioma", "español", "inglés", "francés", "alemán", 
    "italiano", "portugués", "japonés", "chino", "ruso", "árabe", "hindi", "coreano", "árbol", 
    "flor", "fruta", "manzana", "plátano", "naranja", "uva", "fresa", "limón", "piña", "mango", 
    "melón", "sandía", "verdura", "zanahoria", "lechuga", "espinaca", "papa", "tomate", "pepino", 
    "pimiento", "calabacín", "maíz", "trigo", "arroz", "pasta", "pan", "queso", "leche", "huevo", 
    "carne", "pollo", "pescado", "cerdo", "res", "cordero", "salchicha", "hamburguesa", "pizza", 
    "sopa", "ensalada", "bebida", "café", "té", "jugo", "refresco", "vino", "cerveza", "agua", 
    "limonada", "chocolate", "leche", "familia", "padre", "madre", "hermano", "hermana", "abuelo", 
    "abuela", "tío", "tía", "primo", "prima", "hijo", "hija", "esposo", "esposa", "amigo", "amiga", 
    "vecino", "jefe", "compañero", "profesor", "maestro", "estudiante", "alumno", "doctor", 
    "enfermero", "policía", "bombero", "abogado", "ingeniero", "arquitecto", "artista", "músico", 
    "escritor", "periodista", "fotógrafo", "actor", "director", "cocinero", "panadero", "peluquero", 
    "carpintero", "plomero", "electricista", "mecánico", "pintor", "jardinero", "deportista", 
    "atleta", "boxeador", "tenista", "futbolista", "ciclista", "nadador", "esquiador", "corredor", 
    "boxeador", "gimnasta", "entrenador", "árbitro", "medalla", "trofeo", "campeón", "partido", 
    "juego", "competencia", "entrenamiento", "estrategia", "táctica", "equipo", "jugador", 
    "aficionado", "espectador", "público", "marcador", "gol", "punto", "canasta", "pase", "tiro", 
    "penalti", "falta", "tarjeta", "expulsión", "árbitro", "entrenador", "presidente", "dirigente", 
    "jugador", "defensa", "delantero", "portero", "medio", "centrocampista", "arco", "red", 
    "balón", "pelota", "camiseta", "short", "calcetines", "botas", "zapatos", "guantes", "cinturón",

    // Palabras que comúnmente se escriben incorrectamente
    "acento", "acción", "adaptación", "adición", "afortunado", "algunas", "análisis", "aplicación",
    "artículo", "así", "atracción", "balón", "básico", "cálido", "cámara", "cien", "ciudad",
    "cohete", "corrección", "dificultad", "dólar", "educación", "efectivo", "elección", "emoción",
    "especial", "estudiante", "está", "fácil", "fácilmente", "favorito", "frustración", "futuro",
    "gobierno", "héroe", "historia", "imaginación", "importante", "independencia", "interesante",
    "inteligente", "invitación", "límite", "máquina", "matemáticas", "número", "opinión", "opción",
    "organización", "país", "película", "práctico", "proporción", "razón", "recibo", "región",
    "responsabilidad", "revolución", "sección", "sistema", "técnico", "televisión", "tradición",
    "universidad", "utilizar", "vacaciones", "validez", "verdad", "zoológico",

    // Palabras con errores comunes
    "dificil", "dificultades", "excelente", "felicidades", "gracias", "imaginativo", "matematico",
    "misterioso", "moralidad", "natural", "ocurrencia", "oportunidad", "percepcion", "plazo",
    "precaucion", "recuperacion", "refleccion", "relacion", "solucion", "superficie", "utilidad",
    "vigilancia", "año", "dólares", "cárcel", "ciencia", "cómodo", "adición", "emoción", "garantía",
    "próximo", "murciélago", "carácter", "química", "índice", "cóndor", "cápsula", "cólera", "término",
    "especificación", "declaración", "imposición", "incidencia", "influencia", "inmunización",
    "juventud", "líquido", "medicina", "narración", "navegación", "situación", "tecnología",
    "término", "universidad", "vegetación", "voluntad", "vaca",

    // Palabras adicionales
    "abandonar", "abrazar", "acelerar", "aceptar", "acompañar", "acostarse", "admirar", "afirmar", 
    "agregar", "ajustar", "alegría", "alivio", "andar", "animar", "anotar", "aprender", "apoyar", 
    "arreglar", "asegurar", "asumir", "atender", "aumentar", "avanzar", "bailar", "cambiar", 
    "cancelar", "captar", "celebrar", "cerrar", "chocar", "citar", "cooperar", "crear", "crecer", 
    "decidir", "defender", "desarrollar", "descubrir", "desejar", "detener", "dialogar", "diferir", 
    "educar", "encontrar", "enviar", "entender", "equilibrar", "examinar", "explicar", "felicitar", 
    "formar", "frustrar", "generar", "gritar", "guardar", "guiar", "hablar", "imitar", "iniciar", 
    "investigar", "jugar", "justificar", "leer", "limpiar", "manejar", "mirar", "modificar", 
    "motivar", "navegar", "necesitar", "observación", "ofrecer", "organizar", "perder", "persistir", 
    "plantear", "planificar", "probar", "proponer", "realizar", "recoger", "reflejar", "regresar", 
    "resolver", "resultar", "romper", "saber", "saludar", "salir", "seguir", "soñar", "sonreír", 
    "sostener", "sugerir", "transformar", "usar", "valorar", "vender", "ver", "visitar", "volar", 

    // Adjetivos
    "abierto", "agradable", "alto", "amable", "ancho", "bajo", "bonito", "brillante", "cálido", 
    "corto", "claro", "colorido", "difícil", "divertido", "dudoso", "elegante", "enorme", "fácil", 
    "feliz", "grande", "interesante", "largo", "lejano", "malo", "nuevo", "rápido", "sabroso", 
    "serio", "simpático", "sólido", "tierno", "tranquilo", "vivo", "voluminoso", 

    // Sustantivos adicionales
    "abstracción", "acuerdo", "adversidad", "afecto", "análisis", "aprecio", "artefacto", 
    "asunto", "atención", "cambio", "comunicación", "confianza", "consejo", "creación", 
    "desafío", "desarrollo", "deseo", "detalles", "diversión", "documento", "experiencia", 
    "firmeza", "fluctuación", "futuro", "gracia", "guía", "influencia", "inquietud", 
    "interacción", "inversión", "juego", "juventud", "lección", "manera", "misterio", 
    "narrativa", "observación", "perspectiva", "planteamiento", "proceso", "proyecto", 
    "quiebra", "reacción", "reflexión", "relación", "solución", "sugerencia", "tendencia", 
    "vacío", "variación", 

    // Adverbios
    "además", "ahora", "aquí", "así", "bajo", "cerca", "claro", "constantemente", "después", 
    "donde", "rápidamente", "siempre", "tal vez", "temprano", "tarde", "ya", 
];

// Función para encontrar la palabra más cercana en el diccionario
function corregirOrtografia(palabra) {
	let mejorCoincidencia = "";
	let distanciaMinima = Infinity;

	diccionario.forEach(function(palabraCorrecta) {
		const distancia = levenshteinDistance(palabra, palabraCorrecta);
		if (distancia < distanciaMinima) {
			distanciaMinima = distancia;
			mejorCoincidencia = palabraCorrecta;
		}
	});

	// Si la distancia es considerablemente baja, devolvemos la mejor coincidencia
	if (distanciaMinima <= 2) {
		return mejorCoincidencia;
	} else {
		return palabra; // Si la diferencia es muy grande, devolvemos la palabra original
	}
}

// Función para buscar en Wikipedia
/*async function buscarEnWikipedia(consulta) {
	try {
        // Codificar correctamente la consulta
        const consultaCodificada = encodeURIComponent(consulta);

        // Llamada a la API de Wikipedia con la consulta codificada
		const respuesta = await fetch('https://es.wikipedia.org/w/api.php' +
		  `?action=query&format=json&prop=extracts|categories&exintro=true&explaintext=true&titles=${consultaCodificada}&origin=*`);
		const data = await respuesta.json();

		const pages = data.query.pages;
		const primeraPaginaId = Object.keys(pages)[0];
		const extracto = pages[primeraPaginaId].extract;
		const categorias = pages[primeraPaginaId].categories.map(cat => cat.title).join(", ");

		return extracto ? `${extracto}\nCategorías: ${categorias}` : 'No se encontró información.';
	} catch (error) {
		console.error('Error al buscar en Wikipedia:', error);
		return 'Hubo un error al buscar en Wikipedia.';
	}
}*/

// Función para buscar en Wikipedia usando 'opensearch'
async function buscarEnWikipedia(consulta) {
    try {
        // Codificar correctamente la consulta
        const consultaCodificada = encodeURIComponent(consulta);

        // Llamada a la API de Wikipedia con 'opensearch' para obtener sugerencias
        const respuesta = await fetch(`https://es.wikipedia.org/w/api.php?action=opensearch&search=${consultaCodificada}&limit=1&format=json&origin=*`);
        const data = await respuesta.json();

        // Verificar si se encontró alguna coincidencia
        const coincidencias = data[1]; // Array de títulos de artículos sugeridos
        const urlCoincidencia = data[3]; // Array de URLs de artículos sugeridos

        if (coincidencias.length > 0 && urlCoincidencia.length > 0) {
            // Tomamos la primera coincidencia
            const primerTitulo = coincidencias[0];
            const primerUrl = urlCoincidencia[0];

            // Hacemos otra llamada a la API para obtener el extracto del artículo encontrado
            const extractoRespuesta = await fetch(`https://es.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|categories&exintro=true&explaintext=true&titles=${encodeURIComponent(primerTitulo)}&origin=*`);
            const extractoData = await extractoRespuesta.json();

            const pages = extractoData.query.pages;
            const primeraPaginaId = Object.keys(pages)[0];
            let extracto = pages[primeraPaginaId].extract;
            const categorias = pages[primeraPaginaId].categories.map(cat => cat.title).join(", ");

            // Eliminar el texto entre corchetes usando una expresión regular
            extracto = extracto.replace(/\[.*?\]/g, '');

            return extracto 
                ? `${extracto}\nCategorías: ${categorias}\nMás información: ${primerUrl}` 
                : 'No se encontró información detallada.';
        } else {
            return 'No se encontró información relevante.';
        }
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
			} else if (textoNormalizado.includes("busca") || textoNormalizado.includes("que es")) {		
				// Extraer la consulta eliminando las palabras clave "busca" o "que es"
				const consulta = texto.replace(/busca|que es/g, "").trim();
				
				// Si hay una consulta válida, buscar en Wikipedia
				if (consulta) {
					const resultado = await buscarEnWikipedia(consulta);  // Esperar la respuesta de la búsqueda
					return `Esto es lo que encontré sobre "${consulta}":\n${resultado}`;
				} else {
					return "Por favor, proporciona algo para buscar en Wikipedia.";
				}
			} else if (textoNormalizado.includes("como se escribe")) {		
				// Extraer la consulta eliminando las palabras clave "como se escribe"
				const consulta = texto.replace(/como se escribe/g, "").trim();

				if (consulta) {
					const palabraCorregida = corregirOrtografia(consulta);
					return `La forma correcta de escribirlo es: "${palabraCorregida}".`;
				} else {
					return "No entiendo nada de lo que has escrito.";
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

// ----------------------------------------FUNCIONALIDADES DEL CHATBOT-------------------------------------------

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
        botonModo.textContent = "☀️";
    } else {
        botonModo.textContent = "🌙";
    }
}
