/*
* chatbotJuegos.js
* By Sucendo 2024
*/

// Función para iniciar una nueva adivinanza
function iniciarAdivinanza(respuestas) {
	const adivinanzaAleatoria = respuestas["adivinanza"][Math.floor(Math.random() * respuestas["adivinanza"].length)];
	contextoConversacion.respuestaCorrecta = adivinanzaAleatoria.respuesta; // Guarda la respuesta correcta en el contexto
	return adivinanzaAleatoria.pregunta; // Devuelve solo la pregunta
}

// Función para manejar la respuesta a una adivinanza
function manejarAdivinanza(contextoConversacion, respuestaUsuario) {
	const esCorrecto = verificarRespuesta(contextoConversacion, respuestaUsuario);
	
	if (esCorrecto) {
		// Si la respuesta es correcta
		return "¡Correcto! ¿Quieres otra adivinanza?";
	} else {
		// Si la respuesta es incorrecta
		return "¡Incorrecto! Inténtalo de nuevo o di 'otra' para una nueva adivinanza.";
	}
}

function verificarRespuesta(contextoConversacion, respuestaUsuario) {
	const respuestaCorrecta = contextoConversacion.respuestaCorrecta; // Asume que guardas la respuesta correcta en el contexto
	return respuestaUsuario.toLowerCase() === respuestaCorrecta.toLowerCase(); // Compara ignorando mayúsculas
}


function iniciarDueloDeInsultos(respuestas) {
	const insultoAleatorio = respuestas["duelo"][Math.floor(Math.random() * respuestas["duelo"].length)];
	contextoConversacion.respuestaCorrecta = insultoAleatorio.respuesta;  // Guardamos la réplica correcta
	return `El chatbot te dice: "${insultoAleatorio.insulto}" ¡Es tu turno!`;
}

function manejarRespuestaInsulto(contextoConversacion, respuestaUsuario) {
	const respuestaCorrecta = contextoConversacion.respuestaCorrecta;

	if (respuestaUsuario.toLowerCase() === respuestaCorrecta.toLowerCase()) {
		contextoConversacion.repeticiones++;
		return `¡Buena réplica! ¿Listo para el siguiente insulto?`;
	} else {
		return `¡Respuesta incorrecta! La réplica correcta era: "${respuestaCorrecta}". ¿Quieres intentarlo de nuevo?`;
	}
}
