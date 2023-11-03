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
                // Aquí puedes implementar la lógica para esperar la interacción del usuario
                // Por ejemplo, mostrando los botones de "Sí" y "No" o realizando acciones posteriores.
            }
        }
    }

    escribirMensaje();
});
