// Función para mostrar texto caracter por caracter
function mostrarTextoCaracterPorCaracter(texto, elemento, velocidad, callback) {
    let index = 0;
    const longitudTexto = texto.length;
    const intervalo = setInterval(function() {
        if (index < longitudTexto) {
            elemento.textContent += texto.charAt(index);
            index++;
        } else {
            clearInterval(intervalo);
            // Ejecutar la función de callback después de mostrar el texto completo
            if (typeof callback === "function") {
                callback();
            }
        }
    }, velocidad);
}

// Cuando la página se carga
window.addEventListener("load", function() {
    // Mostrar "conectado con WOPR" al principio
    const mensajeTexto = document.getElementById("mensaje-texto");
    mensajeTexto.textContent = "";
    mostrarTextoCaracterPorCaracter("Conectado con WOPR", mensajeTexto, 100, function() {
        mensajeTexto.textContent += " ";
        // Después de la conexión, preguntar por el nombre del usuario
        mostrarTextoCaracterPorCaracter("Por favor, ingresa tu nombre de usuario: ", mensajeTexto, 100, function() {
            const entradaUsuario = document.createElement("input");
            entradaUsuario.type = "text";
            entradaUsuario.id = "nombre-usuario";
            entradaUsuario.style.display = "none";
            mensajeTexto.appendChild(entradaUsuario);
            entradaUsuario.addEventListener("input", function() {
                if (entradaUsuario.value.length >= 8) {
                    // El usuario ha ingresado al menos 8 caracteres
                    mensajeTexto.textContent = `Hola, ${entradaUsuario.value}. ¿Jugamos a algún juego?`;
                    const opcionesUsuario = document.getElementById("opciones-usuario");
                    opcionesUsuario.classList.remove("escondido");
                }
            });
        });
    });
});

// Resto del código para manejar las respuestas del usuario (Sí/No) y las acciones del juego
