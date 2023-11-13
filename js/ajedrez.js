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
      tablero[0][i] = i % 2 === 0 ? '♖' : '♘';
      tablero[7][i] = i % 2 === 0 ? '♜' : '♞';
      tablero[2][i] = i % 2 === 0 ? '♗' : '♝';
      tablero[5][i] = i % 2 === 0 ? '♗' : '♝';
      tablero[3][i] = i % 2 === 0 ? '♕' : '♛';
      tablero[4][i] = i % 2 === 0 ? '♔' : '♚';
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
  
        tableroHTML.appendChild(celda);
      }
      // Agrega un salto de línea después de cada fila
      const saltoDeLinea = document.createElement('br');
      tableroHTML.appendChild(saltoDeLinea);
    }
  }
  
  function moverPieza(origen, destino, piezaSeleccionada) {
    const piezaOrigen = this.tablero[origen.row] && this.tablero[origen.row][origen.col];
  
    if (piezaOrigen && this.tablero[origen.row] && this.tablero[destino.row] && destino.row >= 0 && destino.row < 8 && destino.col >= 0 && destino.col < 8) {
      this.tablero[destino.row][destino.col] = piezaOrigen;
      this.tablero[origen.row][origen.col] = null;
      // Redibujar el tablero después de un breve retraso
      setTimeout(() => dibujarTablero(this.tablero), 100);
    }
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
    moverPieza(origen, destino, piezaSeleccionada);
  }

  class Ajedrez {
    constructor() {
      this.tablero = crearTablero();
      this.dibujar();
    }

    dibujar() {
      dibujarTablero(this.tablero);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const juegoAjedrez = new Ajedrez();
  });
})();
