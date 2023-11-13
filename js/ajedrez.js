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
        celda.setAttribute('draggable', 'true');
        tableroHTML.appendChild(celda);
      }
    }
  }

  class Ajedrez {
    constructor() {
      this.tablero = crearTablero();
      this.dibujar();
      this.inicializarArrastre();
    }

    dibujar() {
      dibujarTablero(this.tablero);
    }

    moverPieza(origen, destino) {
      const piezaOrigen = this.tablero[origen.row][origen.col];
      const piezaDestino = this.tablero[destino.row][destino.col];
      this.tablero[destino.row][destino.col] = piezaOrigen;
      this.tablero[origen.row][origen.col] = null;
      if (piezaDestino !== null) {
        this.tablero[origen.row][origen.col] = piezaDestino;
      }
      this.dibujar();
    }

    inicializarArrastre() {
      const celdas = document.querySelectorAll('.celda');
      let piezaSeleccionada = null;

      celdas.forEach(celda => {
        celda.addEventListener('dragstart', () => {
          piezaSeleccionada = celda.textContent;
        });

        celda.addEventListener('dragover', e => {
          e.preventDefault();
        });

        celda.addEventListener('drop', () => {
          if (piezaSeleccionada !== null) {
            const origen = obtenerCoordenadas(celdas, piezaSeleccionada);
            const destino = obtenerCoordenadas(celdas, celda.textContent);
            if (origen && destino) {
              this.moverPieza(origen, destino);
            }
          }
          piezaSeleccionada = null;
        });
      });
    }
  }

  function obtenerCoordenadas(celdas, pieza) {
    for (let i = 0; i < celdas.length; i++) {
      if (celdas[i].textContent === pieza) {
        const fila = Math.floor(i / 8);
        const columna = i % 8;
        return { row: fila, col: columna };
      }
    }
    return null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const juegoAjedrez = new Ajedrez();
  });
})();
