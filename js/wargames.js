document.addEventListener("DOMContentLoaded", function () {
    const pantalla = document.getElementById("pantalla");
    const computadora = document.getElementById("computadora");
    const usuario = document.getElementById("usuario");
    const titulo = document.getElementById("titulo");
    const mensajesComputadora = [
        "Conectado con WOPR ............................",
        "Nombre de usuario",
        "contraseña (mínimo 8 caracteres)",
        "Hola ",
        "¿Jugamos a algún juego?"
    ];

    let mensajeActual = 0;
    let caracterActual = 0;
    let escribiendo = false;

    function escribirMensaje() {
        if (mensajeActual < mensajesComputadora.length) {
            const mensaje = mensajesComputadora[mensajeActual];
            if (caracterActual < mensaje.length) {
                usuario.innerHTML = ""; // Borra el contenido del usuario
                computadora.textContent = mensaje.slice(0, caracterActual + 1);
                caracterActual++;
                escribiendo = true;
            } else {
                // Solo avanzar al siguiente mensaje si no es el último
                if (mensajeActual < mensajesComputadora.length - 1) {
                    mensajeActual++;
                    caracterActual = 0;
                    escribiendo = false;
                    setTimeout(escribirMensaje, 100); // Espera un breve tiempo antes de avanzar
                }
            }
        }
    }

    function responder() {
        if (mensajeActual < mensajesComputadora.length - 1) {
            if (escribiendo) {
                // Si la computadora todavía está escribiendo, muestra el mensaje completo
                usuario.textContent = mensajesComputadora[mensajeActual];
                computadora.textContent = "";
                mensajeActual++;
                caracterActual = 0;
                escribiendo = false;
                setTimeout(escribirMensaje, 100); // Espera un breve tiempo antes de avanzar
            }
        } else {
            // Mostrar opciones al final del último mensaje
            usuario.innerHTML = '<button id="si">Sí</button><button id="no">No</button>';
        }
    }

    // Inicia la conversación
    escribirMensaje();

    // Agregar lógica para manejar las respuestas de los botones "Sí" y "No"
    document.getElementById("si").addEventListener("click", responder);

    document.getElementById("no").addEventListener("click", responder);

    // Capturar el evento "Enter" en campos de entrada de texto
    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            responder();
        }
    });
});
