(function () {
  const piezas = {
    '♙': '♙', '♟': '♟',
    '♖': '♖', '♜': '♜',
    '♘': '♘', '♞': '♞',
    '♗': '♗', '♝': '♝',
    '♕': '♕', '♛': '♛',
    '♔': '♔', '♚': '♚'
  };

  function obtenerPiezaInicial(row, col) {
    // Configuración de las piezas iniciales en la posición inicial del tablero
    if (row === 0) return '♜'; // Torre negra
    if (row === 1) return '♞'; // Caballo negro
    if (row === 2) return '♝'; // Alfil negro
    if (row === 3) return '♛'; // Reina negra
    if (row === 4) return '♚'; // Rey negro
    if (row === 5) return '♝'; // Alfil negro
    if (row === 6) return '♞'; // Caballo negro
    if (row === 7) return '♜'; // Torre negra

    return null;
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
        celda.addEventListener('dragover', handleDragOver);
        celda.addEventListener('drop', handleDrop);

        // Aplicar colores a las casillas según la disposición de las piezas
        if ((i + j) % 2 === 0) {
          // Si la pieza es negra y está en la parte superior o si la pieza es blanca y está en la parte inferior
          if ((i < 2 && obtenerPiezaInicial(i, j) === '♜') || (i >= 2 && obtenerPiezaInicial(i, j) === '♖')) {
            celda.classList.add('celda-negra');
          } else {
            celda.classList.add('celda-blanca');
          }
        } else {
          // Si la pieza es negra y está en la parte superior o si la pieza es blanca y está en la parte inferior
          if ((i < 2 && obtenerPiezaInicial(i, j) === '♜') || (i >= 2 && obtenerPiezaInicial(i, j) === '♖')) {
            celda.classList.add('celda-blanca');
          } else {
            celda.classList.add('celda-negra');
          }
        }

        const pieza = obtenerPiezaInicial(i, j);
        if (pieza) {
          // Agrega redondel como elemento "drag and drop"
          const redondel = document.createElement('div');
          redondel.className = 'redondel';
          redondel.textContent = piezas[pieza];
          redondel.draggable = true; // Hace la pieza arrastrable
          redondel.addEventListener('dragstart', handleDragStart);
          celda.appendChild(redondel);
        }

        tableroHTML.appendChild(celda);
      }
      // Agrega un salto de línea después de cada fila
      const saltoDeLinea = document.createElement('br');
      tableroHTML.appendChild(saltoDeLinea);
    }
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.dataTransfer.setData('row', e.target.parentElement.dataset.row);
    e.dataTransfer.setData('col', e.target.parentElement.dataset.col);
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
      moverPieza(origen, destino, piezaSeleccionada);
    }
  }

  function moverPieza(origen, destino, piezaSeleccionada) {
    // Implementa la lógica de movimiento de piezas aquí
    // ...
    dibujarTablero(); // Redibujar el tablero después de un movimiento
  }

  function esMovimientoValido(origen, destino, piezaSeleccionada) {
    // Implementa la lógica para verificar si el movimiento es válido
    // Por ahora, siempre devolveremos true
    return true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    dibujarTablero();
  });
})();
