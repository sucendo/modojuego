document.addEventListener("DOMContentLoaded", function () {
  const pantalla = document.getElementById("pantalla");
  const computadora = document.getElementById("computadora");
  const usuario = document.getElementById("usuario");

  const mensajes = [
    "Conectado con WOPR ............................",
    "Nombre de usuario:",
    "Contraseña (mínimo 8 caracteres):",
    "Hola, [nombre de usuario]. ¿Jugamos a algún juego?",
  ];

  let mensajeActual = 0;

  const mostrarMensajeComputadora = () => {
    if (mensajeActual >= mensajes.length) {
      return;
    }

    computadora.textContent = ""; // Limpiar el contenido de la computadora

    const mensaje = mensajes[mensajeActual];
    const tiempoEntreCaracteres = 100; // Tiempo entre caracteres en milisegundos

    let i = 0;
    const mostrarCaracter = () => {
      if (i < mensaje.length) {
        computadora.textContent += mensaje.charAt(i);
        i++;
        setTimeout(mostrarCaracter, tiempoEntreCaracteres);
      } else {
        mensajeActual++;
        if (mensajeActual < mensajes.length) {
          usuario.innerHTML = `<input type="text" id="respuestaUsuario" placeholder="Escribe tu respuesta aquí" onkeyup="responderUsuario(event)">`;
        }
      }
    };

    mostrarCaracter();
  };

  const responderUsuario = (event) => {
    if (event.key === "Enter") {
      usuario.innerHTML = ""; // Limpiar la entrada del usuario
      mostrarMensajeComputadora();
    }
  };

  mostrarMensajeComputadora();
});
