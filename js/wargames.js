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
            if (mensajeActual !== 0 && caracterActual < mensaje.length) {
                computadora.textContent = mensaje.slice(0, caracterActual + 1);
                caracterActual++;
                setTimeout(escribirMensaje, 100);

                if (mensajeActual === 3) {
                    usuario.innerHTML = `<input type="text" id="nombreUsuario">`;
                } else if (mensajeActual === 4) {
                    usuario.innerHTML = '<input type="password" id="codigoUsuario">';
                }
            } else if (caracterActual === mensaje.length) {
                if (mensajeActual === 4) {
                    usuario.innerHTML = `<button id="siButton" onclick="iniciarJuego()">Sí</button><button id="noButton" onclick="rechazarJuego()">No</button>`;
                }
                mensajeActual++;
                caracterActual = 0;
                setTimeout(escribirMensaje, 1000); // Retrasar el siguiente mensaje
            }
        }
    }

    escribirMensaje();
});
