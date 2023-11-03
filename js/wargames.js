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

// Función para mostrar opciones
function mostrarOpciones(opciones, callback) {
    const mensajeTexto = document.getElementById("mensaje-texto");
    mensajeTexto.textContent = "";

    for (let i = 0; i < opciones.length; i++) {
        const botonOpcion = document.createElement("button");
        botonOpcion.textContent = opciones[i];
        botonOpcion.addEventListener("click", function() {
            if (typeof callback === "function") {
                callback(opciones[i]);
            }
        });
        mensajeTexto.appendChild(botonOpcion);
    }
}

// Cuando la página se carga
window.addEventListener("load", function() {
    const pantallaNegra = document.getElementById("pantalla-negra");
    const mensajeTexto = document.getElementById("mensaje-texto");

    // Pantalla 1: Conexión con WOPR
    pantallaNegra.style.backgroundColor = "black";
    mensajeTexto.style.color = "blue";
    mostrarTextoCaracterPorCaracter("Conectado con WOPR ............................", mensajeTexto, 1000, function() {
        mensajeTexto.textContent = ""; // Limpiar el mensaje

        // Pantalla 2: Nombre de Usuario
        mostrarTextoCaracterPorCaracter("Nombre de usuario:", mensajeTexto, 100, function() {
            const entradaUsuario = document.createElement("input");
            entradaUsuario.type = "text";
            entradaUsuario.id = "nombre-usuario";
            entradaUsuario.style.display = "block";
            mensajeTexto.appendChild(entradaUsuario);
            entradaUsuario.focus();

            entradaUsuario.addEventListener("keyup", function(event) {
                if (event.key === "Enter" && entradaUsuario.value.length >= 1) {
                    entradaUsuario.style.display = "none";
                    entradaUsuario.blur();

                    // Pantalla 3: Contraseña
                    mostrarTextoCaracterPorCaracter("Contraseña (mínimo 8 caracteres):", mensajeTexto, 100, function() {
                        const entradaContrasena = document.createElement("input");
                        entradaContrasena.type = "password";
                        entradaContrasena.id = "contrasena-usuario";
                        entradaContrasena.style.display = "block";
                        mensajeTexto.appendChild(entradaContrasena);
                        entradaContrasena.focus();

                        entradaContrasena.addEventListener("keyup", function(event) {
                            if (event.key === "Enter" && entradaContrasena.value.length >= 8) {
                                entradaContrasena.style.display = "none";
                                entradaContrasena.blur();

                                // Pantalla 4: Saludo y opciones del juego
                                mensajeTexto.textContent = "¡Hola, " + entradaUsuario.value + "! ¿Jugamos a algún juego?";
                                const opciones = ["Sí", "No"];
                                mostrarOpciones(opciones, function(opcion) {
                                    if (opcion === "Sí") {
                                        mensajeTexto.textContent = "Esperando orden de ataque";
                                        // Lógica para continuar con el juego
                                    } else {
                                        mensajeTexto.textContent = "Hasta la próxima. ¡Adiós!";
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    });
});
