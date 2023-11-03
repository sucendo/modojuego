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

// Función para manejar la entrada de usuario
function manejarEntradaUsuario(mensaje, siguienteMensaje, inputId, callback) {
    const mensajeTexto = document.getElementById("mensaje-texto");
    mensajeTexto.textContent = mensaje;
    
    const entradaUsuario = document.createElement("input");
    entradaUsuario.type = "text";
    entradaUsuario.id = inputId;
    entradaUsuario.style.display = "block";
    entradaUsuario.style.color = "black";
    mensajeTexto.appendChild(entradaUsuario);

    entradaUsuario.addEventListener("keyup", function(event) {
        if (event.key === "Enter" && entradaUsuario.value.length >= 8) {
            if (typeof callback === "function") {
                callback(entradaUsuario.value);
            }
        }
    });
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
    const mensajeTexto = document.getElementById("mensaje-texto");

    // Pantalla 1: Conexión con WOPR
    mensajeTexto.textContent = "";
    mostrarTextoCaracterPorCaracter("Conectado con WOPR ............................", mensajeTexto, 100, function() {
        mensajeTexto.textContent = ""; // Limpiar el mensaje
        // Pantalla 2: Nombre de Usuario
        manejarEntradaUsuario("Nombre de usuario: ", "Contraseña (mínimo 8 caracteres):", "nombre-usuario", function(nombreUsuario) {
            // Pantalla 3: Contraseña
            manejarEntradaUsuario("Contraseña (mínimo 8 caracteres): ", "¡Hola " + nombreUsuario + "! ¿Jugamos a algún juego?", "contrasena-usuario", function() {
                // Pantalla 4: Saludo y opciones del juego
                mensajeTexto.textContent = `¡Hola, ${nombreUsuario}! ¿Jugamos a algún juego?`;
                const opciones = ["Sí", "No"];
                mostrarOpciones(opciones, function(opcion) {
                    if (opcion === "Sí") {
                        mensajeTexto.textContent = "Esperando orden de ataque";
                        // Lógica para continuar con el juego
                    } else {
                        mensajeTexto.textContent = "Hasta la próxima. ¡Adiós!";
                    }
                });
            });
        });
    });
});
