/*
* chatbotutil.js
* By Sucendo 2024
*/

// Función para calcular el tiempo que queda para una fecha y hora específicas
function calcularTiempoRestante(texto) {
	  // Expresión regular mejorada para buscar patrones de fecha y hora
	  const patronFechaHora = /(\d{1,2}\/\d{1,2}\/\d{4})\s*(\d{1,2}h:\d{1,2})?/i;
	  const coincidenciasFechaHora = texto.match(patronFechaHora);

	  if (coincidenciasFechaHora) {
		const fecha = coincidenciasFechaHora[1];
		const hora = coincidenciasFechaHora[2];

		if (fecha || hora) {
		  // Calcular tiempo que queda para la fecha y hora especificadas
		  const ahora = new Date();
		  let fechaEspecifica = null;

		  if (fecha) {
			const [dia, mes, anio] = fecha.split('/').map(Number);
			fechaEspecifica = new Date(anio, mes - 1, dia); // Meses en JavaScript van de 0 a 11
		  }

		  if (hora) {
			const [hora, minutos] = hora.split(':').map(Number);
			if (!fechaEspecifica) {
			  // Si no se especificó la fecha, usar la fecha actual
			  fechaEspecifica = new Date();
			}
			fechaEspecifica.setHours(hora, minutos);
		  }

		  const tiempoRestante = fechaEspecifica - ahora;

		  if (tiempoRestante > 0) {
			const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
			const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));

			if (dias > 365) {
			  const anos = Math.floor(dias / 365);
			  const diasRestantes = dias % 365;
			  return `Quedan ${anos} años, ${diasRestantes} días, ${horas} horas y ${minutos} minutos para la fecha especificada.`;
			} else {
			  return `Quedan ${dias} días, ${horas} horas y ${minutos} minutos para la fecha especificada.`;
			}
		  } else {
			return `La fecha y hora especificadas ya han pasado.`;
		  }
		}
	  }
	return "No se proporcionó una fecha y hora válidas.";
}

function calcularHoraActual(texto) {
        const ahora = new Date();
        const horaActual = `${ahora.getHours()}:${ahora.getMinutes()}`;
        return `${horaActual}`;
}

function calcularDiaHoy(texto) {
        const ahora = new Date();
        const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const fechaYDia = ahora.toLocaleDateString("es-ES", opcionesFecha);
        return `Hoy es ${fechaYDia}`;
}

function saludoDia(texto) {
	const horaActual = calcularHoraActual(texto);
	const hora = parseInt(horaActual.split(":")[0]);

	let saludo;
	if (hora >= 5 && hora < 12) {
		saludo = "buenos días";
	} else if (hora >= 12 && hora < 18) {
		saludo = "buenas tardes";
	} else {
		saludo = "buenas noches";
	}

	if (!texto.toLowerCase().includes(saludo)) {
		// Si el saludo no coincide con el momento del día actual, corregirlo
		if (saludo === "buenos días") {
			return "¡Buenos días! ¿Cómo estás?";
		} else if (saludo === "buenas tardes") {
			return "¡Buenas tardes! ¿Cómo estás?";
		} else {
			return "¡Buenas noches! ¿Cómo estás?";
		}
	} else {
		// Si el saludo coincide, devolver la hora actual normalmente
		return `Son las ${horaActual}.`;
	}
}