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
    if (row === 1) return '♟'; // Peón negro
    if (row === 6) return '♙'; // Peón blanco
  
    if (row === 0 || row === 7) {
      // Configuración de las piezas de la fila superior e inferior
      switch (col) {
        case 0:
          return row === 0 ? '♖' : '♜'; // Torre
        case 1:
          return row === 0 ? '♘' : '♞'; // Caballo
        case 2:
          return row === 0 ? '♗' : '♝'; // Alfil
        case 3:
          return row === 0 ? '♕' : '♛'; // Reina
        case 4:
          return row === 0 ? '♔' : '♚'; // Rey
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

  function dibujarTablero() {
    const tableroHTML = document.getElementById('tablero');
    tableroHTML.innerHTML = '';

    // Agregar etiquetas para las columnas (A-H)
    const columnasLabel = document.createElement('div');
    columnasLabel.className = 'columnas-label';
    for (let i = 0; i < 8; i++) {
      const columna = document.createElement('div');
      columna.textContent = String.fromCharCode(65 + i);
      columnasLabel.appendChild(columna);
    }
    tableroHTML.appendChild(columnasLabel);

    for (let i = 0; i < 8; i++) {
      // Agregar etiqueta para la fila (1-8)
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

        // Aplicar colores a las casillas según la disposición de las piezas
        if ((i + j) % 2 === 0) {
          // Si la pieza es negra y está en la parte superior o si la pieza es blanca y está en la parte inferior
          if ((i < 4 && obtenerPiezaInicial(i, j) === '♟') || (i >= 4 && obtenerPiezaInicial(i, j) === '♙')) {
            celda.classList.add('celda-negra');
          } else {
            celda.classList.add('celda-blanca');
          }
        } else {
          // Si la pieza es negra y está en la parte superior o si la pieza es blanca y está en la parte inferior
          if ((i < 4 && obtenerPiezaInicial(i, j) === '♟') || (i >= 4 && obtenerPiezaInicial(i, j) === '♙')) {
            celda.classList.add('celda-blanca');
          } else {
            celda.classList.add('celda-negra');
          }
        }

        const pieza = obtenerPiezaInicial(i, j);
        if (pieza) {
          // Agrega pieza como elemento "drag and drop"
          const piezaElemento = document.createElement('div');
          piezaElemento.className = 'pieza';
          piezaElemento.textContent = piezas[pieza];
          piezaElemento.draggable = true; // Hace la pieza arrastrable
          piezaElemento.addEventListener('dragstart', handleDragStart);
          celda.appendChild(piezaElemento);
        }

        tableroHTML.appendChild(celda);
      }
    }

    // Agregar etiquetas vacías para las filas (1-8)
    const filasLabel = document.createElement('div');
    filasLabel.className = 'filas-label';
    for (let i = 0; i < 8; i++) {
      const fila = document.createElement('div');
      filasLabel.appendChild(fila);
    }
    tableroHTML.appendChild(filasLabel);
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
    // Verificar si la fila de origen está definida y contiene una pieza
    const piezaOrigen = obtenerPiezaInicial(origen.row, origen.col);
    if (piezaOrigen) {
      // Verificar si el movimiento es válido (casilla de destino vacía)
      const piezaDestino = obtenerPiezaInicial(destino.row, destino.col);
      if (!piezaDestino) {
        // Actualizar el tablero
        dibujarPieza(destino.row, destino.col, piezaOrigen);
        dibujarPieza(origen.row, origen.col, null);
      }
    }
  }

  function esMovimientoValido(origen, destino, piezaSeleccionada) {
    // Implementa la lógica para verificar si el movimiento es válido
    // Por ahora, siempre devolveremos true
    return true;
  }

  function dibujarPieza(row, col, pieza) {
    const celda = document.querySelector(`.celda[data-row="${row}"][data-col="${col}"]`);
    if (celda) {
      const piezaElemento = celda.querySelector('.pieza');
      if (piezaElemento) {
        if (pieza) {
          piezaElemento.textContent = piezas[pieza];
        } else {
          // Si pieza es null, elimina la pieza de la celda
          piezaElemento.remove();
        }
      } else if (pieza) {
        // Si no hay piezaElemento y pieza no es null, crea la pieza
        const nuevaPieza = document.createElement('div');
        nuevaPieza.className = 'pieza';
        nuevaPieza.textContent = piezas[pieza];
        nuevaPieza.draggable = true;
        nuevaPieza.addEventListener('dragstart', handleDragStart);
        celda.appendChild(nuevaPieza);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    dibujarTablero();
  });
})();
