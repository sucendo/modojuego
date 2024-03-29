const opciones = ["piedra", "papel", "tijeras"];
        let victorias = 0;
        let derrotas = 0;
        let empates = 0;
        let temporizador = 60;
        let juegoTerminado = true; // Iniciar el juego como "terminado"
        let actualizarTemporizador;

        // Array de mensajes de victoria y derrota
        const mensajesVictoria = [
            "¡Victoria! Has derrotado al enemigo.",
            "¡Victoria! El enemigo se ha rendido.",
            "¡Victoria! Tu estrategia fue impecable.",
            "¡Victoria! El enemigo no tuvo oportunidad.",
            "¡Victoria! Tu ejército es invencible."
        ];

        const mensajesDerrota = [
            "¡Derrota! Tu capital ha sido atacado.",
            "¡Derrota! El enemigo se alza victorioso.",
            "¡Derrota! La guerra no ha terminado bien.",
            "¡Derrota! Necesitas reevaluar tu estrategia.",
            "¡Derrota! El enemigo era más poderoso."
        ];

        function mostrarDialogoInicio() {
            const inicioDialog = document.getElementById("inicioDialog");
            inicioDialog.showModal();
        }

        document.getElementById("inicioDialog").addEventListener("close", function () {
            const nombreUsuario = document.getElementById("nombre").value;
            const codigo = document.getElementById("codigo").value;
            const jugar = document.getElementById("jugar").value;

            if (jugar === "si") {
                mostrarCodigo(codigo);
                iniciarJuego();
            }
        });

        function iniciarJuego() {
            temporizador = 60;
            victorias = 0;
            derrotas = 0;
            empates = 0;
            juegoTerminado = false; // Iniciar el juego como "no terminado"
            actualizarTemporizador = setInterval(actualizarCuentaAtras, 1000);

            document.getElementById("iniciarJuegoButton").style.display = "none"; // Ocultar el botón "Iniciar Juego"
            document.getElementById("temporizador").textContent = `Tiempo restante: ${temporizador} segundos`;
            document.getElementById("resultado").textContent = "";
            document.getElementById("puntuacion").textContent = "Victorias: 0 | Derrotas: 0 | Empates: 0";
        }

        function actualizarCuentaAtras() {
            temporizador--;
            document.getElementById("temporizador").textContent = `Tiempo restante: ${temporizador} segundos`;
            if (temporizador === 0) {
                clearInterval(actualizarTemporizador);
                document.getElementById("temporizador").textContent = "¡Tiempo agotado!";
                document.getElementById("iniciarJuegoButton").style.display = "block"; // Mostrar el botón "Iniciar Juego"
                juegoTerminado = true;
            }
        }

        document.getElementById("iniciarJuegoButton").addEventListener("click", mostrarDialogoInicio);

        document.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", (event) => {
                if (juegoTerminado) return;

                const eleccionUsuario = event.target.id;
                const eleccionComputadora = opciones[Math.floor(Math.random() * 3)];

                let resultado;
                if (eleccionUsuario === eleccionComputadora) {
                    resultado = "Empate. La batalla continúa.";
                    document.getElementById("resultado").className = "empate";
                    empates++;
                } else if (
                    (eleccionUsuario === "piedra" && eleccionComputadora === "tijeras") ||
                    (eleccionUsuario === "papel" && eleccionComputadora === "piedra") ||
                    (eleccionUsuario === "tijeras" && eleccionComputadora === "papel")
                ) {
                    resultado = mensajesVictoria[Math.floor(Math.random() * mensajesVictoria.length)];
                    document.getElementById("resultado").className = "victoria";
                    victorias++;
                } else {
                    resultado = mensajesDerrota[Math.floor(Math.random() * mensajesDerrota.length)];
                    document.getElementById("resultado").className = "derrota";
                    derrotas++;
                }

                document.getElementById("resultado").textContent = `Elegiste ${eleccionUsuario}, la computadora eligió ${eleccionComputadora}. ${resultado}`;
                document.getElementById("puntuacion").textContent = `Victorias: ${victorias} | Derrotas: ${derrotas} | Empates: ${empates}`;
            });
        });

        function mostrarCodigo(codigo) {
            const codigoUsuario = document.getElementById("codigoUsuario");
            const tiempoTotal = 60000; // 60 segundos
            let tiempoTranscurrido = 0;
            let codigoActual = Array(codigo.length).fill('');
            let indices = Array.from({ length: codigo.length }, (_, i) => i);

            const interval = setInterval(() => {
                if (tiempoTranscurrido >= tiempoTotal) {
                    // Mostrar el código completo cuando el tiempo ha terminado
                    clearInterval(interval);
                    codigoUsuario.textContent = codigo;
                    return;
                }

                // Verificar y actualizar todas las posiciones al mismo tiempo
                indices.forEach((index) => {
                    if (tiempoTranscurrido >= tiempoTotal - 1000) {
                        // Cuando quede 1 segundo, mostrar el carácter correspondiente
                        codigoActual[index] = codigo[index];
                    } else {
                        if (codigoActual[index] !== codigo[index]) {
                            codigoActual[index] = generarCaracterAleatorio(); // Si no coincide, generar un carácter aleatorio
                        }
                    }
                });

                codigoUsuario.textContent = codigoActual.join('');
                tiempoTranscurrido += 100; // Incrementar el tiempo transcurrido en 100ms
            }, 100); // Mostrar cada 100ms

            function generarCaracterAleatorio() {
                const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~¡¢£¤¥¦¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";
                const caracterAleatorio = caracteres.charAt(Math.floor(Math.random() * caracteres.length));
                return caracterAleatorio;
            }
        }
