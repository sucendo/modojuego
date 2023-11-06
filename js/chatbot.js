document.addEventListener("DOMContentLoaded", function () {
    const chat = document.getElementById("chat");
    const userInput = document.getElementById("userInput");
    const enviarButton = document.getElementById("enviar");

    let respuestas = {};

    let nombreUsuario = "";

    // Cargar las respuestas desde el archivo JSON
    fetch('data/chatbotrespuestas.json')
        .then(response => response.json())
        .then(data => {
            respuestas = data;

            function mostrarMensaje(usuario, mensaje) {
                const nuevoMensaje = document.createElement("div");
                nuevoMensaje.className = usuario === "Usuario" ? "mensaje-usuario" : "mensaje-robot";
                nuevoMensaje.textContent = `${usuario}: ${mensaje}`;
                chat.appendChild(nuevoMensaje);
            }

            function responderPregunta(pregunta) {
                const respuesta = respuestas[pregunta.toLowerCase()];
                if (respuesta) {
                    mostrarMensaje("Usuario", pregunta);
                    mostrarMensaje("Robot", respuesta);
                    if (pregunta.toLowerCase() === "nombre") {
                        setTimeout(() => {
                            mostrarMensaje("Robot", `Encantado de conocerte, ${nombreUsuario}! ¿En qué puedo ayudarte?`);
                        }, 2000); // Responder con el nombre del usuario después de 2 segundos
                    }
                } else {
                    mostrarMensaje("Robot", "Lo siento, no entiendo tu pregunta.");
                }
            }

            enviarButton.addEventListener("click", function () {
                const pregunta = userInput.value;
                if (pregunta.trim() !== "") {
                    mostrarMensaje("Usuario", pregunta);
                    userInput.value = "";
                    responderPregunta(pregunta);
                }
            });

            userInput.addEventListener("keyup", function (event) {
                if (event.key === "Enter") {
                    const pregunta = userInput.value;
                    if (pregunta.trim() !== "") {
                        mostrarMensaje("Usuario", pregunta);
                        userInput.value = "";
                        responderPregunta(pregunta);
                    }
                }
            });

            // Pedir el nombre del usuario
            setTimeout(() => {
                const nombre = prompt("Hola, soy Chatbot. ¿Cómo te llamas?");
                if (nombre) {
                    nombreUsuario = nombre;
                    mostrarMensaje("Robot", `Encantado de conocerte, ${nombreUsuario}! ¿En qué puedo ayudarte?`);
                }
            }, 1000); // Pedir el nombre después de 1 segundo
        });
});
