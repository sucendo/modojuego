document.addEventListener("DOMContentLoaded", function () {
    const pantalla = document.getElementById("pantalla");
    const titulo = document.getElementById("titulo");
    const computadora = document.getElementById("computadora");
    const usuario = document.getElementById("usuario");
    const nombreEntrada = document.getElementById("nombre-entrada");
    const codigoEntrada = document.getElementById("codigo-entrada");
    const preguntaJuego = document.getElementById("pregunta-juego");
    const nombreUsuarioRespuesta = document.getElementById("nombre-usuario-respuesta");
    const siButton = document.getElementById("si-button");
    const noButton = document.getElementById("no-button");

    const mensajes = [
        "Conectado con WOPR ............................",
        "Nombre de usuario",
        "Contraseña (mínimo 8 caracteres)",
        "Hola ",
        ". ¿Jugamos a algún juego?"
    ];
    let mensajeActual = 0;

    function mostrarMensaje() {
        switch (mensajeActual) {
            case 0:
                setTimeout(() => {
                    titulo.classList.remove("escondido");
                    mensajeActual++;
                    mostrarMensaje();
                }, 3000);
                break;
            case 1:
                setTimeout(() => {
                    nombreEntrada.classList.remove("escondido");
                    nombreEntrada.focus();
                    mensajeActual++;
                }, 3000);
                break;
            case 2:
                setTimeout(() => {
                    codigoEntrada.classList.remove("escondido");
                    codigoEntrada.focus();
                    mensajeActual++;
                }, 3000);
                break;
            case 3:
                setTimeout(() => {
                    usuario.classList.remove("escondido");
                    nombreUsuarioRespuesta.textContent = nombreEntrada.value;
                    mensajeActual++;
                    mostrarMensaje();
                }, 3000);
                break;
            case 4:
                setTimeout(() => {
                    preguntaJuego.classList.remove("escondido");
                    siButton.addEventListener("click", iniciarJuego);
                    noButton.addEventListener("click", rechazarJuego);
                }, 3000);
                break;
        }
        computadora.textContent = mensajes[mensajeActual];
    }

    mostrarMensaje();

    function iniciarJuego() {
        // Agregar tu lógica para iniciar el juego aquí
        titulo.textContent = "Simulación de Guerra Termonuclear";
        // Otras acciones necesarias para el juego
    }

    function rechazarJuego() {
        // Agregar tu lógica para rechazar el juego aquí
        titulo.textContent = "Juego rechazado";
        // Otras acciones necesarias para el rechazo del juego
    }
});

