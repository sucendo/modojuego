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

/* ------------------- ORTOGRAFIA ---------------------- */

// Función para consultar LanguageTool y obtener correcciones sin API Key
async function consultarLanguageTool(palabra) {
	const apiUrl = 'https://api.languagetool.org/v2/check'; // Versión gratuita de LanguageTool

	const data = {
		text: palabra,
		language: "es",
	};

	try {
		const respuesta = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams(data),
		});

		const resultado = await respuesta.json();
		
		// LanguageTool devuelve sugerencias en 'matches'
		if (resultado.matches && resultado.matches.length > 0) {
			return resultado.matches.map(match => ({
				sugerencia: match.replacements.map(replace => replace.value),
				mensaje: match.message
			}));
		} else {
			return []; // No hay sugerencias
		}
	} catch (error) {
		console.error("Error al consultar LanguageTool:", error);
		return null;
	}
}

// Función para encontrar la palabra correcta utilizando la API de LanguageTool
async function corregirOrtografia(palabra) {
	const apiUrl = `https://api.languagetool.org/v2/check`;
	
	const data = {
		text: palabra,
		language: 'es', // Idioma español
	};

	try {
		const respuesta = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams(data),
		});

		const resultado = await respuesta.json();
		
		// Si hay sugerencias, tomamos la primera
		if (resultado.matches.length > 0 && resultado.matches[0].replacements.length > 0) {
			return resultado.matches[0].replacements[0].value;
		} else {
			return palabra; // Si no hay correcciones, devolvemos la palabra original
		}
	} catch (error) {
		console.error("Error al consultar la API de LanguageTool:", error);
		return palabra; // Si ocurre un error, devolvemos la palabra original
	}
}

// Función para calcular la distancia de Levenshtein
function levenshteinDistance(a, b) {
	const matriz = [];

	for (let i = 0; i <= b.length; i++) {
		matriz[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matriz[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matriz[i][j] = matriz[i - 1][j - 1];
			} else {
				matriz[i][j] = Math.min(
					matriz[i - 1][j - 1] + 1, // Substitución
					matriz[i][j - 1] + 1,     // Inserción
					matriz[i - 1][j] + 1      // Eliminación
				);
			}
		}
	}

	return matriz[b.length][a.length];
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
    
   // Más
   "anotación", "aparta", "aplauden", "arroja", "aterriza", "asimila", "asegura", "atrae", "aumenta", "avanza",
    "cabaña", "califica", "calmante", "categoriza", "celebra", "cirujano", "clama", "conmueve", "confirma", "consiente",
    "contiene", "contiene", "controla", "coordina", "crece", "debate", "decora", "denuncia", "determina", "devora",
    "edifica", "elige", "enreda", "entrena", "estimula", "evalúa", "explica", "extiende", "enfrenta", "falda",
    "firma", "fija", "flota", "frena", "gira", "glorifica", "guarda", "impulsa", "incrementa", "indica",
    "inscribe", "integra", "interactúa", "intensifica", "introduce", "invoca", "lanza", "libera", "mejora", "modifica",
    "mueve", "navega", "oscila", "ordena", "organiza", "persigue", "planta", "previene", "produce", "protege",
    "quema", "realiza", "responde", "rota", "sale", "señala", "somete", "superan", "surgen", "trata",
    "transporta", "traspasa", "transforma", "unifica", "utiliza", "valida", "visita", "abunda", "aburre",
    "ahorra", "ama", "aplica", "arruina", "asoma", "ataca", "acompaña", "desarrolla", "destaca", "disminuye",
    "embellece", "engaña", "emplea", "enfatiza", "enfatiza", "entusiasta", "excusa", "fragancia", "frecuenta", "imita",
    "impacta", "incrementa", "intensifica", "invita", "juega", "madurar", "modifica", "molesta", "motiva",
    "muestra", "narra", "opina", "permite", "presenta", "prohíbe", "recomienda", "registra", "renueva", "representa",
    "respeta", "responde", "saca", "señala", "supera", "sustenta", "transforma", "utiliza", "vigila", "aclamación",
    "acoplamiento", "adoración", "administración", "advertencia", "aflicción", "agencia", "agitación", "alarmante",
    "albergue", "alquimia", "ambición", "antagonismo", "apariencia", "aprecio", "asombro", "asignación", "asociación",
    "asunción", "atisbo", "auge", "balance", "barrera", "belleza", "capacidad", "carácter", "clarificación",
    "colaboración", "compilación", "comprensión", "compresión", "conexión", "contemplación", "conversación", "copiosa",
    "corrección", "creación", "creatividad", "criticar", "curación", "democracia", "denuncia", "diseño", "determinación",
    "difusión", "educación", "emoción", "empoderar", "enfoque", "entusiasmo", "escalera", "eslabón", "esperanza",
    "exploración", "fabricación", "fastidiar", "fealdad", "felizmente", "fórmula", "fragor", "frecuencia", "gratitud",
    "guía", "hartazgo", "herencia", "humanidad", "hipótesis", "ideal", "independencia", "inspiración", "invitación",
    "liderazgo", "logros", "lógica", "lucidez", "madurez", "maldad", "magnitud", "malestar", "manifestación", "mapa",
    "medida", "melodía", "mesura", "metáfora", "movimiento", "motivación", "multitasking", "naturaleza", "necesidad",
    "nostalgia", "observación", "ocasión", "organización", "palabra", "paciencia", "perdón", "percepción", "rendimiento",
    "revisión", "romanticismo", "ruina", "sabiduría", "salvación", "similitud", "sintomatología", "solidaridad",
    "sofisticación", "sostenibilidad", "superación", "ternura", "tradición", "transformación", "validez", "victoria",
    "virtualidad", "bienestar", "búsqueda", "ágil", "además", "aunque", "alguien", "aquí", "alrededor",
    "alguna", "antorcha", "así", "atención", "bonito", "caso", "claro", "comienzo", "conseguir", "construir",
    "contenido", "creer", "curar", "detrás", "dicha", "disponible", "encontrar", "fuerte", "interesante", "mantener",
    "mejorar", "mundo", "noticia", "pensar", "posible", "preparar", "resolver", "saber", "serio", "sencillo",
    "siempre", "tratar", "una", "único", "utilizar", "vejez", "viento", "visual", "abordar", "alcanzar", "ajustado",
    "aprender", "cambiar", "cargar", "compartir", "construir", "conector", "conseguir", "contar", "correr", "crecer",
    "descubrir", "desarrollar", "disfrutar", "escuchar", "explicar", "generar", "ayudar", "iluminar", "incluir",
    "invitar", "liderar", "manifestar", "navegar", "oír", "olvidar", "parar", "proteger", "recibir", "revisar",
    "seleccionar", "sumar", "utilizar", "ver", "compartir", "sobrepasar", "participar", "destacar", "argumentar",
    "superar", "sugerir", "terminar", "transformar", "alentar", "buscar", "contemplar", "dar", "dirigir", "exhibir",
    "facilitar", "fomentar", "inscribir", "instigar", "justificar", "olvidar", "proponer", "tratar", "utilizar",
    "valorar", "acompañar", "abordar", "aportar", "armonizar", "argumentar", "alinear", "aplaudir", "callar",
    "celebrar", "cambiar", "considerar", "contestar", "culminar", "discernir", "disfrutar", "empoderar", "fomentar",
    "frustrar", "generar", "hilar", "ir", "investigar", "jugar", "vivir", "reflexionar", "remediar", "seguir",
    "servir", "sumergir", "sustituir", "tratar", "utilizar", "valorar", "apartarse", "advertir", "apegar", "atraer",
    "clarificar", "codificar", "compadecer", "concentrar", "construir", "transformar", "desplegar", "enfatizar",
    "iluminar", "inscribir", "justificar", "liderar", "manifestar", "organizar", "reforzar", "reflexionar",
    "reemplazar", "relajar", "revisar", "proseguir", "salir", "sustentar", "valerse", "validar", "convocar", "dar",
    "ejecutar", "iniciar", "utilizar", "permanecer", "responder", "saber", "reforzar", "servir", "acoger", "atraer",
    "ayudar", "comunicar", "decidir", "esforzarse", "expandir", "facilitar", "inspirar", "observar", "prever",
    "propiciar", "reconstruir", "realizar", "reproducir", "resolver", "trascender", "actualizar", "aunar",
    "consumir", "cultivar", "dispersar", "fomentar", "mejorar", "optimizar", "preparar", "reubicar", "salvar",
    "seducir", "sostener", "respaldar", "conseguir", "afinar", "avivar", "enhebrar", "iluminar", "involucrar",
    "resaltar", "ser", "transmitir", "cumplir", "diversificar", "armonizar", "coordinar", "repensar", "implicar",
    "manejar", "proyectar", "recuperar", "restringir", "seleccionar", "revisar", "invitar", "unir", "evitar", "aumentar"
];

// Función para consultar LanguageTool y obtener sugerencias ortográficas
async function corregirTexto(texto) {
	const apiUrl = 'https://api.languagetool.org/v2/check'; // Versión gratuita de LanguageTool

	const data = {
		text: texto,
		language: "es", // Suponemos que el texto inicial está en español
	};

	try {
		const respuesta = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams(data),
		});

		const resultado = await respuesta.json();

		if (resultado.matches && resultado.matches.length > 0) {
			let textoCorregido = texto;
			resultado.matches.forEach(match => {
				if (match.replacements && match.replacements.length > 0) {
					// Reemplazamos el texto incorrecto con la primera sugerencia
					const sugerencia = match.replacements[0].value;
					textoCorregido = textoCorregido.replace(match.context.text, sugerencia);
				}
			});
			return textoCorregido;
		} else {
			return texto; // Si no hay sugerencias, devolvemos el texto original
		}
	} catch (error) {
		console.error("Error al corregir ortografía:", error);
		return texto; // En caso de error, devolvemos el texto original
	}
}

// Función para corregir el texto que no está entre comillas
async function corregirTextoNoEntreComillas(texto) {
	// Buscar todas las partes que no están entre comillas utilizando una expresión regular
	const partesSeparadas = texto.split(/(".*?")/g);  // Dividimos por el texto entre comillas
	const partesCorregidas = [];

	// Recorremos cada parte: corregimos solo las que no estén entre comillas
	for (let parte of partesSeparadas) {
		if (parte.startsWith('"') && parte.endsWith('"')) {
			// Si está entre comillas, la dejamos intacta
			partesCorregidas.push(parte);
		} else {
			// Si no está entre comillas, corregimos ortografía
			const parteCorregida = await corregirTexto(parte);
			partesCorregidas.push(parteCorregida);
		}
	}

	// Unimos las partes corregidas y las que estaban entre comillas
	return partesCorregidas.join('');
}

// Función para encontrar la palabra más cercana en el diccionario local
/*
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
}*/

/* ------------------- ENCICLOPEDIA ---------------------- */

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

// Función para corregir ortografía de la consulta
async function corregirConsulta(consulta) {
    const palabras = consulta.split(' ');
    const palabrasCorregidas = [];

    for (const palabra of palabras) {
        const sugerencias = await consultarLanguageTool(palabra);

        if (sugerencias && sugerencias.length > 0) {
            // Filtramos las sugerencias por distancia de Levenshtein y obtenemos la más cercana
            const sugerenciasCercanas = sugerencias
                .map(sugerencia => sugerencia.sugerencia.filter(palabraSugerida => levenshteinDistance(palabra, palabraSugerida) <= 2))
                .filter(sugerenciasValidas => sugerenciasValidas.length > 0);

            // Si hay sugerencias cercanas, tomamos la primera
            if (sugerenciasCercanas.length > 0 && sugerenciasCercanas[0].length > 0) {
                palabrasCorregidas.push(sugerenciasCercanas[0][0]); // Tomamos la primera sugerencia
            } else {
                palabrasCorregidas.push(palabra); // Si no hay correcciones cercanas, dejamos la palabra original
            }
        } else {
            palabrasCorregidas.push(palabra); // Si no hay sugerencias, dejamos la palabra original
        }
    }

    // Retornamos la consulta corregida
    return palabrasCorregidas.join(' ');
}

/* -------------------------------------- TRADUCTOR -------------------------------------------------- */

// Función para traducir usando LibreTranslate
async function traducirTexto(frase, idiomaDestino = 'en') {
    const apiUrl = 'https://libretranslate.com/translate';

    const data = {
        q: frase,            // Texto que se va a traducir
        source: 'es',         // Idioma original (español en este caso)
        target: idiomaDestino, // Idioma al que se va a traducir (por defecto inglés)
        format: 'text',
    };

    try {
        const respuesta = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const resultado = await respuesta.json();
        
        // Devolver el texto traducido
        return resultado.translatedText;
    } catch (error) {
        console.error('Error al traducir:', error);
        return 'Hubo un error al traducir la frase.';
    }
}

// Diccionario de idiomas y sus códigos
const idiomasSoportados = {
	"español": "es",
	"inglés": "en",
	"alemán": "de",
	"francés": "fr",
	"italiano": "it",
	"portugués": "pt",
	"chino": "zh",
	"ruso": "ru",
	"japonés": "ja",
	"coreano": "ko",
	"árabe": "ar",
	"neerlandés": "nl",
	"húngaro": "hu",
	"polaco": "pl",
    // Añade más idiomas aquí
};

// Función para traducir usando Google Translate (sin API Key)
async function traducirGoogle(frase, idiomaDestino) {
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${idiomaDestino}&dt=t&q=${encodeURIComponent(frase)}`;

    try {
        const respuesta = await fetch(apiUrl);
        const resultado = await respuesta.json();

        // El resultado es un array, tomamos la primera traducción
        return resultado[0][0][0];
    } catch (error) {
        console.error('Error al traducir:', error);
        return 'Hubo un error al traducir la frase.';
    }
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
			}else if (textoNormalizado.startsWith("traduce al ")) {
				// Extraer el idioma y la frase a traducir
				let partes = texto.replace(/traduce al |Traduce al /g, "").trim().split(" ");
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

	chat.appendChild(nuevoMensaje);

	// Verifica si el usuario es el Robot (chatbot) para aplicar el efecto de escritura
	if (usuario === "Robot" && typeof mensaje === "string") {
		// Dividir el mensaje en caracteres
		const caracteres = mensaje.split("");
		let index = 0;

		// Determinar la velocidad de escritura
		const velocidadEscritura = mensaje.length > 250 ? 1: 25; // Duplicar velocidad si tiene más de 250 caracteres

		const mostrarCaracter = () => {
			if (index < caracteres.length) {
				nuevoMensaje.textContent += caracteres[index];
				index++;
				// Hacer una llamada recursiva para mostrar el próximo carácter después de un retraso
				setTimeout(mostrarCaracter, velocidadEscritura); // Usar la velocidad determinada
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
		//const pregunta = await corregirOrtografia(userInput.value); // Asegúrate de que corregirOrtografia sea una función asíncrona
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

	userInput.addEventListener("keyup", async function (event) {
		if (event.key === "Enter") {
			//const pregunta = await corregirOrtografia(userInput.value); // Asegúrate de que corregirOrtografia sea una función asíncrona
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
