(function () {
  const piezas = {
    '♙': '♙', '♟': '♟',
    '♖': '♖', '♜': '♜',
    '♘': '♘', '♞': '♞',
    '♗': '♗', '♝': '♝',
    '♕': '♕', '♛': '♛',
    '♔': '♔', '♚': '♚'
  };

  // Función para obtener la pieza inicial en una posición dada del tablero
  function obtenerPiezaInicial(row, col) {
    if (row === 1) return '♟'; // Peón negro
    if (row === 6) return '♙'; // Peón blanco
  
    if (row === 0 || row === 7) {
      switch (col) {
        case 0:
          return row === 0 ? '♜' : '♖'; // Torre
        case 1:
          return row === 0 ? '♞' : '♘'; // Caballo
        case 2:
          return row === 0 ? '♝' : '♗'; // Alfil
        case 3:
          return row === 0 ? '♛' : '♕'; // Reina
        case 4:
          return row === 0 ? '♚' : '♔'; // Rey
        case 5:
          return row === 0 ? '♝' : '♗'; // Alfil
        case 6:
          return row === 0 ? '♞' : '♘'; // Caballo
        case 7:
          return row === 0 ? '♜' : '♖'; // Torre
        default:
          return null;
      }
    }
  
    return null;
  }

  // Función para dibujar el tablero
  function dibujarTablero() {
    const tableroHTML = document.getElementById('tablero');
    tableroHTML.innerHTML = '';

    const columnasLabel = document.createElement('div');
    columnasLabel.className = 'columnas-label';
    for (let i = 0; i < 8; i++) {
      const columna = document.createElement('div');
      columna.textContent = String.fromCharCode(65 + i);
      columnasLabel.appendChild(columna);
    }
    tableroHTML.appendChild(columnasLabel);

    for (let i = 0; i < 8; i++) {
      const filaLabel = document.createElement('div');
      filaLabel.className = 'fila-label';
      filaLabel.textContent = 8 - i;
      tableroHTML.appendChild(filaLabel);

      for (let j = 0; j < 8; j++) {
        const celda = document.createElement('div');
        celda.className = 'celda';
        celda.dataset.row = i;
        celda.dataset.col = j;
        celda.addEventListener('dragover', handleDragOver);
        celda.addEventListener('drop', handleDrop);

        if ((i + j) % 2 === 0) {
          if ((i < 4 && obtenerPiezaInicial(i, j) === '♟') || (i >= 4 && obtenerPiezaInicial(i, j) === '♙')) {
            celda.classList.add('celda-negra');
          } else {
            celda.classList.add('celda-blanca');
          }
        } else {
          if ((i < 4 && obtenerPiezaInicial(i, j) === '♟') || (i >= 4 && obtenerPiezaInicial(i, j) === '♙')) {
            celda.classList.add('celda-blanca');
          } else {
            celda.classList.add('celda-negra');
          }
        }

        const pieza = obtenerPiezaInicial(i, j);
        if (pieza) {
          const piezaElemento = document.createElement('div');
          piezaElemento.className = 'pieza';
          piezaElemento.textContent = piezas[pieza];
          piezaElemento.draggable = true;
          piezaElemento.addEventListener('dragstart', handleDragStart);
          celda.appendChild(piezaElemento);
        }

        tableroHTML.appendChild(celda);
      }
    }

    const filasLabel = document.createElement('div');
    filasLabel.className = 'filas-label';
    for (let i = 0; i < 8; i++) {
      const fila = document.createElement('div');
      filasLabel.appendChild(fila);
    }
    tableroHTML.appendChild(filasLabel);
  }

  // Función para manejar el inicio del arrastre
  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.dataTransfer.setData('row', e.target.parentElement.dataset.row);
    e.dataTransfer.setData('col', e.target.parentElement.dataset.col);
  }

  // Función para manejar el evento de arrastre sobre la celda
  function handleDragOver(e) {
    e.preventDefault();
  }

  // Función para manejar el evento de soltar la pieza
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

    if (esMovimientoValido(origen, destino, piezaSeleccionada)) {
      moverPieza(origen, destino, piezaSeleccionada);
    }
  }

  // Función para mover la pieza en el tablero
  function moverPieza(origen, destino, piezaSeleccionada) {
    if (tablero[origen.row] && tablero[origen.row][origen.col] !== null) {
      const piezaOrigen = tablero[origen.row][origen.col];

      if (tablero[destino.row] && tablero[destino.row][destino.col] === null) {
        tablero[destino.row][destino.col] = piezaOrigen;
        tablero[origen.row][origen.col] = null;

        dibujarTablero();
      }
    }
  }

  // Función para verificar si el movimiento es válido
  function esMovimientoValido(origen, destino, piezaSeleccionada) {
    return true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    dibujarTablero();
  });
})();
