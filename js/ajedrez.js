// ajedrez.js
(function () {
  const piezas = {
    '♙': 'P', '♟': 'p',
    '♖': 'R', '♜': 'r',
    '♘': 'N', '♞': 'n',
    '♗': 'B', '♝': 'b',
    '♕': 'Q', '♛': 'q',
    '♔': 'K', '♚': 'k'
  };

  function crearTablero() {
    const tablero = [];
    for (let i = 0; i < 8; i++) {
      tablero[i] = [];
      for (let j = 0; j < 8; j++) {
        tablero[i][j] = null;
      }
    }
    for (let i = 0; i < 8; i++) {
      tablero[1][i] = '♙';
      tablero[6][i] = '♟';
      tablero[0][i] = obtenerPiezaInicial(0, i);
      tablero[7][i] = obtenerPiezaInicial(7, i);
    }
    return tablero;
  }

  function dibujarTablero() {
    const tableroHTML = document.getElementById('tablero');
    tableroHTML.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const celda = document.createElement('div');
        celda.className = 'celda';
        celda.dataset.row = i;
        celda.dataset.col = j;
        celda.setAttribute('draggable', 'true');
        celda.addEventListener('dragstart', handleDragStart);
        celda.addEventListener('dragover', handleDragOver);
        celda.addEventListener('drop', handleDrop);

        // Aplicar colores a las casillas pares e impares
        if ((i + j) % 2 === 0) {
          celda.classList.add('celda-blanca');
        } else {
          celda.classList.add('celda-negra');
        }

        const pieza = obtenerPiezaInicial(i, j);
        if (pieza) {
          celda.textContent = piezas[pieza];
        }

        tableroHTML.appendChild(celda);
      }
      // Agrega un salto de línea después de cada fila
      const saltoDeLinea = document.createElement('br');
      tableroHTML.appendChild(saltoDeLinea);
    }
  }

  function obtenerPiezaInicial(row, col) {
    // Configuración de las piezas iniciales en la posición inicial del tablero
    if (row === 1) return '♙'; // Peón blanco
    if (row === 6) return '♟'; // Peón negro

    if (row === 0 || row === 7) {
      // Configuración de las piezas de la fila superior e inferior
      switch (col) {
        case 0:
        case 7:
          return '♖'; // Torre
        case 1:
        case 6:
          return '♘'; // Caballo
        case 2:
        case 5:
          return '♗'; // Alfil
        case 3:
          return '♕'; // Reina
        case 4:
          return '♔'; // Rey
        default:
          return null;
      }
    }

    return null;
  }

  function moverPieza(origen, destino, piezaSeleccionada, tablero) {
    const piezaOrigen = tablero[origen.row] && tablero[origen.row][origen.col];

    if (piezaOrigen && tablero[origen.row] && tablero[destino.row] && destino.row >= 0 && destino.row < 8 && destino.col >= 0 && destino.col < 8) {
      tablero[destino.row][destino.col] = piezaOrigen;
      tablero[origen.row][origen.col] = null;
    }

    dibujarTablero();  // Redibujar el tablero después de un movimiento
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.dataTransfer.setData('row', e.target.dataset.row);
    e.dataTransfer.setData('col', e.target.dataset.col);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const piezaSeleccionada = e.dataTransfer.getData('text/plain');
    const origen = {
      row: +e.dataTransfer.getData('row'),
      col: +e.dataTransfer.getData('col')
    };
    const destino = {
      row: +e.target.dataset.row,
      col: +e.target.dataset.col
    };
  
    // Verificar si el movimiento es válido
    if (esMovimientoValido(origen, destino, piezaSeleccionada)) {
      moverPieza(origen, destino, piezaSeleccionada, this.tablero);
    }
  }

  function esMovimientoValido(origen, destino, piezaSeleccionada) {
    // Aquí deberías implementar la lógica para validar si el movimiento es legal para la pieza seleccionada
    // Por ahora, siempre devolveremos true
    return true;
  }

  class Ajedrez {
    constructor() {
      this.tablero = crearTablero();
      dibujarTablero();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const juegoAjedrez = new Ajedrez();
  });
})();
