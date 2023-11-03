document.addEventListener("DOMContentLoaded", function () {
    const chat = document.getElementById("chat");
    const mensajeInicial = document.getElementById("mensaje-inicial");
    const userInput = document.getElementById("userInput");
    const enviarButton = document.getElementById("enviar");

    const preguntas = [
        "Nombre de usuario:",
        "Contraseña (mínimo 8 caracteres):",
        "Hola [nombre de usuario]. ¿Jugamos a algún juego?"
    ];

    let preguntaActual = 0;

    function mostrarMensaje(mensaje) {
        const nuevoMensaje = document.createElement("div");
        nuevoMensaje.textContent = mensaje;
        chat.appendChild(nuevoMensaje);
    }

    function siguientePregunta() {
        if (preguntaActual < preguntas.length) {
            if (preguntaActual === 2) {
                userInput.classList.remove("escondido");
                enviarButton.classList.remove("escondido");
                userInput.focus();
            }

            mostrarMensaje(preguntas[preguntaActual]);
            preguntaActual++;
        }
    }

    enviarButton.addEventListener("click", function () {
        if (preguntaActual === 0) {
            const nombreUsuario = userInput.value.trim();
            if (nombreUsuario.length >= 1) {
                const pregunta = preguntas[2].replace("[nombre de usuario]", nombreUsuario);
                mostrarMensaje(`Tú: ${nombreUsuario}`);
                userInput.value = "";
                userInput.classList.add("escondido");
                enviarButton.classList.add("escondido");
                setTimeout(function () {
                    mostrarMensaje(pregunta);
                    siguientePregunta();
                }, 1000);
            }
        }
    });

    setTimeout(function () {
        mensajeInicial.classList.add("escondido");
        mostrarMensaje("Tú: Usuario");
        siguientePregunta();
    }, 3000);
});
