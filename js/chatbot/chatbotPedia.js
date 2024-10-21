/*
* chatbotPedia.js
* By Sucendo 2024
*/

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