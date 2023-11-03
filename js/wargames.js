document.addEventListener("DOMContentLoaded", function () {
    const pantalla = document.getElementById("pantalla");
    const titulo = document.getElementById("titulo");
    const computadora = document.getElementById("computadora");
    const usuario = document.getElementById("usuario");
    const conversacion = document.getElementById("conversacion");
    const mensajeEntrada = document.getElementById("mensaje");
    const enviarButton = document.getElementById("enviar");

    const preguntas = [
        "¿Cuál es tu nombre?",
        "Ingresa un código (mínimo 8 caracteres):",
        "¿Estás listo para comenzar el juego?",
        "Elige tu estrategia: piedra, papel o tijeras."
    ];

    let preguntaActual = 0;

    function mostrarMensaje(mensaje, destino) {
        const nuevoMensaje = document.createElement("div");
        nuevoMensaje.textContent = mensaje;
        destino.appendChild(nuevoMensaje);
    }

    function escribirTexto(texto, destino, velocidad, callback) {
        let i = 0;
        const intervalo = setInterval(function () {
            if (i < texto.length) {
                destino.textContent += texto[i];
                i++;
            } else {
                clearInterval(intervalo);
                if (callback) {
                    callback();
                }
            }
        }, velocidad);
    }

    function siguientePregunta() {
        if (preguntaActual < preguntas.length) {
            mostrarMensaje(preguntas[preguntaActual], computadora);
            preguntaActual++;
            setTimeout(function () {
                escribirTexto("Usuario: ", usuario, 50, function () {
                    mensajeEntrada.classList.remove("escondido");
                    enviarButton.classList.remove("escondido");
                    mensajeEntrada.focus();
                });
            }, 2000);
        }
    }

    enviarButton.addEventListener("click", function () {
        mostrarMensaje("Tú: " + mensajeEntrada.value, usuario);
        mensajeEntrada.value = "";

        if (preguntaActual < preguntas.length) {
            setTimeout(siguientePregunta, 1000);
        }
    });

    setTimeout(siguientePregunta, 3000); // Empezar después de 3 segundos
});
