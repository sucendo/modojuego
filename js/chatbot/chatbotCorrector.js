/*
* chatbotCorrector.js
* By Sucendo 2024
*/

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

// Función para consultar LanguageTool y corregir ortografía
async function corregirTexto(texto) {
	// Si el texto está entre comillas dobles, no corregir
	const regexComillas = /"([^"]*)"/g;
	if (regexComillas.test(texto)) {
		return {
			corregidoHTML: texto, // Devolver tal como está, incluyendo las comillas
			corregidoSimple: texto // Igual para el texto sin formato
		};
	}

	// Si el texto comienza o contiene estas excepciones, no corregir
	if (texto.toLowerCase().startsWith("como se escribe")) {
		return {
			corregidoHTML: texto, // Devolver tal como está
			corregidoSimple: texto // Igual para el texto sin formato
		};
	} else if (texto.toLowerCase().includes("al ingles")) {
		const textoCorregido = texto.replace(/\bingles\b/gi, 'inglés');
		return {
			corregidoHTML: textoCorregido, 
			corregidoSimple: textoCorregido
		};
	}

	// API URL para LanguageTool
	const apiUrl = 'https://api.languagetool.org/v2/check';
	const data = {
		text: texto,
		language: "es", // Suponemos que el texto está en español
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
			let textoCorregidoHTML = texto.split('');
			let textoCorregidoSimple = texto.split('');

			// Aplicar cada corrección en orden inverso para evitar desajustes de índice
			resultado.matches.reverse().forEach(match => {
				if (match.replacements && match.replacements.length > 0) {
					const sugerencia = match.replacements[0].value;
					const start = match.offset;
					const end = start + match.length;

					// Reemplazar la palabra en ambas versiones (HTML y texto simple)
					textoCorregidoSimple.splice(start, end - start, ...sugerencia);
					const palabraCorregidaHTML = `<em>${sugerencia}</em>`;
					textoCorregidoHTML.splice(start, end - start, ...palabraCorregidaHTML);
				}
			});

			// Devolver ambas versiones: la corregida con HTML y sin HTML
			return {
				corregidoHTML: textoCorregidoHTML.join(''),
				corregidoSimple: textoCorregidoSimple.join('')
			};
		} else {
			// Si no hay correcciones, devolver el texto original en ambos casos
			return {
				corregidoHTML: texto,
				corregidoSimple: texto
			};
		}
	} catch (error) {
		console.error("Error al corregir ortografía:", error);
		// En caso de error, devolver el texto original
		return {
			corregidoHTML: texto,
			corregidoSimple: texto
		};
	}
}

// Función para excluir correcciones dentro de comillas
function excluirComillas(texto) {
	const partesExcluidas = texto.match(/"[^"]*"/g) || [];
	const textoSinComillas = texto.replace(/"[^"]*"/g, "__RESERVADO__"); // Placeholder temporal

	return { textoSinComillas, partesExcluidas };
}

// Función para restaurar las partes con comillas
function restaurarComillas(textoCorregido, partesExcluidas) {
	let i = 0;
	return textoCorregido.replace(/__RESERVADO__/g, () => partesExcluidas[i++] || '');
}

// Función principal para corregir ortografía respetando comillas
async function procesarTextoConCorreccion(texto) {
	const { textoSinComillas, partesExcluidas } = excluirComillas(texto);
	const textoCorregido = await corregirTexto(textoSinComillas);
	return restaurarComillas(textoCorregido, partesExcluidas);
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
