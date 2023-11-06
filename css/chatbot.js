let respuestas = {}; // Utilizamos una variable en lugar de una constante.

// Obtener respuestas del archivo JSON
fetch("data/chatbotrespuestas.json") // Actualiza la ruta al archivo JSON
    .then(response => response.json())
    .then(data => {
        respuestas = data;

        const chat = document.getElementById("chat");
        const userInput = document.getElementById("userInput");
        const enviarButton = document.getElementById("enviar");

        function mostrarMensaje(usuario, mensaje) {
            const nuevoMensaje = document.createElement("div");
            nuevoMensaje.className = usuario === "Usuario" ? "mensaje-usuario" : "mensaje-robot";
            nuevoMensaje.textContent = `${usuario}: ${mensaje}`;
            chat.appendChild(nuevoMensaje);
        }

        function responderPregunta(pregunta) {
            let respuestaEncontrada = false;
            for (const palabraClave in respuestas) {
                if (pregunta.toLowerCase().includes(palabraClave)) {
                    mostrarMensaje("Usuario", pregunta);
                    mostrarMensaje("Robot", respuestas[palabraClave]);
                    userInput.value = "";
                    respuestaEncontrada = true;
                    break;
                }
            }
            if (!respuestaEncontrada) {
                mostrarMensaje("Robot", "Lo siento, no entiendo tu pregunta.");
            }
        }

        enviarButton.addEventListener("click", function () {
            const pregunta = userInput.value.trim();
            if (pregunta !== "") {
                responderPregunta(pregunta);
            }
        });

        userInput.addEventListener("keyup", function (event) {
            if (event.key === "Enter") {
                const pregunta = userInput.value.trim();
                if (pregunta !== "") {
                    responderPregunta(pregunta);
                }
            }
        });
    });
