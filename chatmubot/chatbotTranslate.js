/*
* chatbotTranslate.js
* By Sucendo 2024
*/

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

		if (!respuesta.ok) throw new Error(`LibreTranslate HTTP ${respuesta.status}`);
		const resultado = await respuesta.json();
		
		// Devolver el texto traducido
		if (typeof resultado.translatedText !== "string") throw new Error("Respuesta de traducción no válida");
		return resultado.translatedText;
	} catch (error) {
		console.error('Error al traducir:', error);
		throw error;
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
	"húngaro": "hu",
	"latín": "la",
	// Añade más idiomas aquí
};

// Función para traducir usando Google Translate (sin API Key)
async function traducirGoogle(frase, idiomaDestino) {
	const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${idiomaDestino}&dt=t&q=${encodeURIComponent(frase)}`;

	try {
		const respuesta = await fetch(apiUrl);
		if (!respuesta.ok) throw new Error(`Traductor HTTP ${respuesta.status}`);
		const resultado = await respuesta.json();

		// El resultado es un array, tomamos la primera traducción
		const traducido = resultado?.[0]?.map(parte => parte?.[0] || "").join("");
		if (!traducido) throw new Error("Respuesta de traducción no válida");
		return traducido;
	} catch (error) {
		console.error('Error al traducir:', error);
		throw error;
	}
}