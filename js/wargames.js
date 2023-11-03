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
    // Después de 3 segundos, muestra la segunda pregunta
    setTimeout(function() {
        const mensajeTexto = document.getElementById("mensaje-texto");
        mensajeTexto.textContent = ""; // Limpia cualquier contenido previo
        mostrarTextoCaracterPorCaracter("¿Quieres jugar a la Simulación de Guerra Termonuclear?", mensajeTexto, 100, function() {
            // Cuando se completa la segunda pregunta, muestra las opciones del usuario
            document.getElementById("opciones-usuario").classList.remove("escondido");
        });
    }, 3000);

    // Cuando el usuario hace clic en "Sí"
    document.getElementById("boton-si").addEventListener("click", function() {
        // Muestra el h1 y el mensaje de "Esperando orden de ataque"
        const tituloJuego = document.getElementById("titulo-juego");
        tituloJuego.classList.remove("escondido");
        tituloJuego.textContent = "Simulación de Guerra Termonuclear";
        const mensajeTexto = document.getElementById("mensaje-texto");
        mensajeTexto.textContent = "Esperando orden de ataque";
        // También puedes iniciar tu juego aquí
    });

    // Cuando el usuario hace clic en "No"
    document.getElementById("boton-no").addEventListener("click", function() {
        // Puedes realizar alguna acción si el usuario no quiere jugar
    });
});
