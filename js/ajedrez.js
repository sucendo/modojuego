// Módulo de ajedrez
(function() {
  // Importar la función existeElemento()
  import { existeElemento } from './js/util.js';

  const TABLERO_ANCHO = 8;
  const TABLERO_ALTO = 8;

  const piezas = {
    "♙": "peón",
    "♖": "torre",
    "♘": "caballo",
    "♗": "alfil",
    "♕": "reina",
    "♔": "rey",
  };

  function crearTablero() {
    const tablero = [];
    for (let i = 0; i < TABLERO_ANCHO; i++) {
      tablero[i] = [];
      for (let j = 0; j < TABLERO_ALTO; j++) {
        tablero[i][j] = null;
      }
    }
    return tablero;
  }

  function dibujarTablero(tablero, elemento) {
    // Verificar si el elemento existe antes de intentar establecer su propiedad innerHTML
    if (existeElemento(elemento)) {
      elemento.innerHTML = "";
    }

    for (let i = 0; i < TABLERO_ANCHO; i++) {
      for (let j = 0; j < TABLERO_ALTO; j++) {
        const pieza = tablero[i][j];
        const celda = document.createElement("div");
        celda.textContent = pieza ? piezas[pieza] : "";
        celda.style.position = "absolute";
        celda.style.top = (j * 64) + "px";
        celda.style.left = (i * 64) + "px";
        elemento.appendChild(celda);
      }
    }
  }

  function moverPieza(origen, destino) {
    // Comprobar si el movimiento es válido
    // ...

    // Mover la pieza
    const piezaOrigen = tablero[origen][origen];
    const piezaDestino = tablero[destino][destino];
    tablero[destino][destino] = piezaOrigen;
    tablero[origen][origen] = null;
    if (piezaDestino !== null) {
      tablero[origen][origen] = piezaDestino;
    }
 }

  // Crear el tablero de ajedrez
  const tablero = crearTablero();

  // Dibujar el tablero de ajedrez
  dibujarTablero(tablero, document.getElementById("tablero"));
})();
