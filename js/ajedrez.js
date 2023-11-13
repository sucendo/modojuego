// Módulo de ajedrez
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

  function dibujarTablero(tablero) {
    const tableroHTML = document.getElementById('tablero');
    tableroHTML.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const celda = document.createElement('div');
        celda.textContent = tablero[i][j] ? piezas[tablero[i][j]] : '';
        celda.className = 'celda';
        celda.dataset.row = i;
        celda.dataset.col = j;
        celda.setAttribute('draggable', 'true');
        celda.addEventListener('dragstart', handleDragStart);
        celda.addEventListener('dragover', handleDragOver);
        celda.addEventListener('drop', handleDrop);
        tableroHTML.appendChild(celda);
      }
    }
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const piezaSeleccionada = e.dataTransfer.getData('text/plain');
    const origen = { row: +e.dataTransfer.getData('row'), col: +e.dataTransfer.getData('col') };
    const destino = { row: +e.target.dataset.row, col: +e.target.dataset.col };
    moverPieza(origen, destino, piezaSeleccionada);
  }

  function moverPieza(origen, destino, piezaSeleccionada) {
    const piezaOrigen = this.tablero[origen.row] && this.tablero[origen.row][origen.col];
  
    // Validar si el movimiento es válido (puedes personalizar esta lógica según las reglas del ajedrez)
    // Por ejemplo, aquí se asume que cualquier movimiento es válido para simplificar
    if (piezaOrigen && this.tablero[origen.row] && this.tablero[destino.row] && destino.row >= 0 && destino.row < 8 && destino.col >= 0 && destino.col < 8) {
      this.tablero[destino.row][destino.col] = piezaOrigen;
      this.tablero[origen.row][origen.col] = null;
    }
  
    // Llama a dibujarTablero al final del movimiento
    dibujarTablero(this.tablero);
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
