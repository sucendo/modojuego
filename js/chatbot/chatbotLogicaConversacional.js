/*
* chatbotLogicaConversacional.js
* By Sucendo 2024
*/

function manejarContextoConversacion(contextoConversacion, palabras, respuestas) {
    // Aquí va la lógica conversacional del Chatbot
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
					// Construir la lista HTML utilizando la función crearListaHTML
					const listaHTML = crearListaHTML(peliculas);
					return `Aquí tienes algunas de mis películas favoritas:\n${listaHTML}`;
				} else {
					// Lógica adicional si no hay películas en la lista
					contextoConversacion.palabraClave = null;
					return "Lo siento, han debido de borrar mi lista de películas. ¿En qué más puedo ayudarte?";
				}
			} else {
				// El usuario no quiere ver la lista de películas
				contextoConversacion.palabraClave = null;
				return "Que pena, era una buena lista. ¿En qué más puedo ayudarte?";
			}
		} else  if (contextoConversacion.palabraClave === "significado_nombre") {
			if (textoNormalizado.includes("sí") || textoNormalizado.includes("vale")) {
				// Obtener el nombre del usuario (asumiendo que el usuario proporciona su nombre en la misma oración)
				const palabras = texto.split(" ");
				const nombreIndex = palabras.findIndex(palabra => palabra === "me" || palabra === "llamo" || palabra === "soy");
				if (nombreIndex !== -1 && nombreIndex < palabras.length - 1) {
					const nombreUsuario = palabras[nombreIndex + 1];
					if (nombreUsuario) {
						// Buscar el significado del nombre del usuario en el JSON
						const nombresSignificado = respuestas["nombres_significado"];
						const significado = nombresSignificado[nombreUsuario];
						if (significado) {
							return `El significado de tu nombre, ${nombreUsuario}, es "${significado}".`;
						} else {
							return `Lo siento, no tengo información sobre el significado de "${nombreUsuario}".`;
						}
					}
				}
			} else {
				// Restablecer el contexto de la conversación si el usuario responde negativamente
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
			// El usuario cambia de contexto
			contextoConversacion.palabraClave = null;
		}
	}
}
