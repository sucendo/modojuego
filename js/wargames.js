// JavaScript para Simulación de Guerra Termonuclear

document.addEventListener("DOMContentLoaded", function () {
    const pantalla = document.getElementById("pantalla");
    const titulo = document.getElementById("titulo");
    const computadora = document.getElementById("computadora");
    const usuario = document.getElementById("usuario");

    const mensajes = [
        "Conectado con WOPR ............................",
        "Nombre de usuario",
        "Contraseña (mínimo 8 caracteres)",
        "Hola, [nombre de usuario]. ¿Jugamos a algún juego?"
    ];

    let mensajeActual = 0;

    function mostrarMensaje() {
        if (mensajeActual < mensajes.length) {
            titulo.textContent = mensajes[mensajeActual];
            mensajeActual++;

            if (mensajeActual === 1 || mensajeActual === 2) {
                const input = document.createElement("input");
                input.type = "text";
                input.addEventListener("keydown", function (event) {
                    if (event.key === "Enter") {
                        mostrarMensaje();
                    }
                });
                usuario.appendChild(input);
            } else if (mensajeActual === 3) {
                const botonSi = document.createElement("button");
                botonSi.textContent = "Sí";
                botonSi.addEventListener("click", function () {
                    mensajeActual++;
                    mostrarMensaje();
                });
                usuario.appendChild(botonSi);

                const botonNo = document.createElement("button");
                botonNo.textContent = "No";
                botonNo.addEventListener("click", function () {
                    mensajeActual = 0; // Reiniciar el juego
                    mostrarMensaje();
                });
                usuario.appendChild(botonNo);
            }
        } else {
            // Mensajes completos
            titulo.textContent = "";
            usuario.innerHTML = "";
        }
    }

    mostrarMensaje();
});
