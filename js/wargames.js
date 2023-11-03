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

    let mensajeActual = 0;
    let caracterActual = 0;

    function escribirMensaje() {
        if (mensajeActual < mensajesComputadora.length) {
            const mensaje = mensajesComputadora[mensajeActual];
            if (caracterActual < mensaje.length) {
                computadora.textContent = mensaje.slice(0, caracterActual + 1);
                caracterActual++;
            } else {
                // Solo avanzar al siguiente mensaje si no es el último
                if (mensajeActual < mensajesComputadora.length - 1) {
                    mensajeActual++;
                    caracterActual = 0;
                }
            }
        }
    }

    escribirMensaje();

    function avanzarMensaje() {
        if (mensajeActual < mensajesComputadora.length - 1) {
            mensajeActual++;
            caracterActual = 0;
            escribirMensaje();
        } else {
            // Mostrar opciones al final del último mensaje
            usuario.innerHTML = '<button id="si">Sí</button><button id="no">No</button>';
        }
    }

    // Agregar lógica para manejar las respuestas de los botones "Sí" y "No"
    document.getElementById("si").addEventListener("click", function () {
        // Lógica para responder "Sí"
        avanzarMensaje();
    });

    document.getElementById("no").addEventListener("click", function () {
        // Lógica para responder "No"
        avanzarMensaje();
    });

    // Capturar el evento "Enter" en campos de entrada de texto
    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && mensajeActual === 1) {
            // Avanzar al siguiente mensaje si el usuario presiona "Enter" en el primer campo de entrada
            avanzarMensaje();
        } else if (event.key === "Enter" && mensajeActual === 2 && document.getElementById("codigoUsuario").value.length >= 8) {
            // Avanzar al siguiente mensaje si el usuario presiona "Enter" en el segundo campo de entrada (cuando la contraseña es lo suficientemente larga)
            avanzarMensaje();
        }
    });
});
