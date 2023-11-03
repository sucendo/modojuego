// Espera a que se cargue el contenido HTML
document.addEventListener("DOMContentLoaded", function () {
    const pantalla = document.getElementById("pantalla");
    const computadora = document.getElementById("computadora");
    const usuario = document.getElementById("usuario");

    // Mensajes de la computadora
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
                computadora.textContent = mensaje.slice(0, caracterActual + 1);
                caracterActual++;
                escribiendo = true;
                setTimeout(escribirMensaje, 100); // Velocidad de escritura (100ms)
            } else {
                if (mensajeActual === 1) {
                    usuario.innerHTML = '<input type="text" id="nombreUsuario">';
                    document.getElementById("nombreUsuario").addEventListener("keydown", function (event) {
                        if (event.key === "Enter") {
                            mensajeActual++;
                            caracterActual = 0;
                            usuario.innerHTML = `<input type="text" id="codigoUsuario">`;
                            escribirMensaje();
                        }
                    });
                } else if (mensajeActual === 2) {
                    usuario.innerHTML = '<input type="password" id="codigoUsuario">';
                    document.getElementById("codigoUsuario").addEventListener("keydown", function (event) {
                        if (event.key === "Enter" && event.target.value.length >= 8) {
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
                mensajeActual++;
                caracterActual = 0;
                escribiendo = false;
                escribirMensaje();
            }
        }
    }

    escribirMensaje();

    // Agregar lógica para manejar las respuestas de los botones "Sí" y "No"
    document.getElementById("si").addEventListener("click", function () {
        if (!escribiendo) {
            // Lógica para responder "Sí"
        }
    });

    document.getElementById("no").addEventListener("click", function () {
        if (!escribiendo) {
            // Lógica para responder "No"
        }
    });
});
