document.addEventListener("DOMContentLoaded", function () {
    const pantalla = document.getElementById("pantalla");
    const computadora = document.getElementById("computadora");
    const usuario = document.getElementById("usuario");

    const mensajesComputadora = [
        "Conectado con WOPR ............................",
        "Nombre de usuario",
        "contraseña (mínimo 8 caracteres)",
        "Hola ",
        "¿Jugamos a algún juego?"
    ];

    const respuestasComputadora = [
        "",
        "¡Hola! Por supuesto, primero necesito tu nombre.",
        "Ahora, por favor, ingresa una contraseña segura (mínimo 8 caracteres).",
        "¡Hola! ¿En qué puedo ayudarte hoy?",
        "Perfecto, ¿qué tipo de juego te gustaría jugar?"
    ];

    let mensajeActual = 0;
    let caracterActual = 0;
    let escribiendo = false;

    function escribirMensaje() {
        if (mensajeActual < mensajesComputadora.length) {
            const mensaje = mensajesComputadora[mensajeActual];
            if (caracterActual < mensaje.length) {
                computadora.textContent = mensaje.slice(0, caracterActual + 1);
                caracterActual++;
                escribiendo = true;
                setTimeout(escribirMensaje, 100);
            } else {
                if (mensajeActual > 0 && respuestasComputadora[mensajeActual]) {
                    usuario.textContent = respuestasComputadora[mensajeActual];
                } else if (mensajeActual === 2) {
                    usuario.innerHTML = 'Nombre de usuario: <input type="text" id="nombreUsuario">';
                    document.getElementById("nombreUsuario").addEventListener("keydown", function (event) {
                        if (event.key === "Enter") {
                            mensajeActual++;
                            caracterActual = 0;
                            usuario.innerHTML = "";
                            escribirMensaje();
                        }
                    });
                } else if (mensajeActual === 3) {
                    usuario.textContent = `Hola ${document.getElementById("nombreUsuario").value}`;
                } else if (mensajeActual === 4) {
                    usuario.innerHTML = '<button id="si">Sí</button><button id="no">No</button>';
                }
                caracterActual = 0;
                escribiendo = false;
                mensajeActual++;
            }
        }
    }

    escribirMensaje();

    document.getElementById("si").addEventListener("click", function () {
        if (!escribiendo) {
            // Lógica para responder "Sí" y continuar la conversación
        }
    });

    document.getElementById("no").addEventListener("click", function () {
        if (!escribiendo) {
            // Lógica para responder "No" y continuar la conversación
        }
    });
});
