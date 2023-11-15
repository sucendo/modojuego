(function () {
  const piezas = {
    '♙': '♙', '♟': '♟',
    '♖': '♖', '♜': '♜',
    '♘': '♘', '♞': '♞',
    '♗': '♗', '♝': '♝',
    '♕': '♕', '♛': '♛',
    '♔': '♔', '♚': '♚'
  };

  // Estructura de datos para las piezas
  const piezasEnJuego = {};

  function obtenerPiezaInicial(row, col) {
    const id = `pieza-${row}-${col}`;
    if (row === 1) return '♟'; // Peón negro
    if (row === 6) return '♙'; // Peón blanco
  
    if (row === 0 || row === 7) {
      // Configuración de las piezas de la fila superior e inferior
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

  function dibujarTablero() {
    const tableroHTML = document.getElementById('tablero');
    tableroHTML.innerHTML = '';
  
    // Contenedor para las filas y celdas
    const filasYCeldasContainer = document.createElement('div');
    filasYCeldasContainer.className = 'filas-celdas-container';
  
    // Agregar etiquetas para las columnas (A-H)
    const columnasLabel = document.createElement('div');
    columnasLabel.className = 'columnas-label';
  
    // Primer div vacío
    const emptyColumn = document.createElement('div');
    columnasLabel.appendChild(emptyColumn);
  
    // Letras de la A a la H
    for (let i = 0; i < 8; i++) {
      const columna = document.createElement('div');
      columna.textContent = String.fromCharCode(65 + i);
      columnasLabel.appendChild(columna);
    }
  
    filasYCeldasContainer.appendChild(columnasLabel);
  
    for (let i = 0; i < 8; i++) {
      // Contenedor para la fila y celdas
      const filaYCeldasContainer = document.createElement('div');
      filaYCeldasContainer.className = 'fila-celdas-container';
  
      // Agregar etiqueta para la fila (1-8)
      const filaLabel = document.createElement('div');
      filaLabel.className = 'fila-label';
      filaLabel.textContent = 8 - i;
      filaYCeldasContainer.appendChild(filaLabel);
  
      for (let j = 0; j < 8; j++) {
        const celda = document.createElement('div');
        celda.className = 'celda';
        celda.dataset.row = i;
        celda.dataset.col = j;
        celda.addEventListener('dragover', handleDragOver);
        celda.addEventListener('drop', handleDrop);
  
        // Invertir el jarreteo para el tablero
        const isCeldaNegra = (i + j) % 2 !== 0;
        if (isCeldaNegra) {
          celda.classList.add('celda-negra');
        } else {
          celda.classList.add('celda-blanca');
        }
  
        const pieza = obtenerPiezaInicial(i, j);
        if (pieza) {
          // Agrega pieza como elemento "drag and drop"
          const piezaElemento = document.createElement('div');
          piezaElemento.className = 'pieza';
          piezaElemento.id = `pieza-${i}-${j}`;
          piezaElemento.textContent = piezas[pieza];
          piezaElemento.draggable = true; // Hace la pieza arrastrable
          piezaElemento.addEventListener('dragstart', handleDragStart);
          celda.appendChild(piezaElemento);
          // Guardar la pieza en la estructura de datos
          piezasEnJuego[piezaElemento.id] = { id: piezaElemento.id, tipo: pieza, col: j, row: i };
        }
  
        filaYCeldasContainer.appendChild(celda);
      }
  
      filasYCeldasContainer.appendChild(filaYCeldasContainer);
    }
  
    tableroHTML.appendChild(filasYCeldasContainer);
  }

  function handleDragStart(e) {
    const piezaElemento = e.target;
    const piezaID = piezaElemento.id;
    const row = piezasEnJuego[piezaID].row;
    const col = piezasEnJuego[piezaID].col;
    e.dataTransfer.setData('text/plain', piezaID);
    e.dataTransfer.setData('row', row);
    e.dataTransfer.setData('col', col);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const piezaSeleccionadaID = e.dataTransfer.getData('text/plain');
    const origen = {
      row: +e.dataTransfer.getData('row'),
      col: +e.dataTransfer.getData('col')
    };
    const destino = {
      row: +e.target.dataset.row,
      col: +e.target.dataset.col
    };
  
    // Verificar si el movimiento es válido
    if (esMovimientoValido(origen, destino, piezaSeleccionadaID)) {
      moverPieza(origen, destino, piezaSeleccionadaID);
    }
  }
  
  function esMovimientoValido(origen, destino, piezaSeleccionadaID) {
    // Implementa la lógica para verificar si el movimiento es válido
    // Por ahora, siempre devolveremos true
    return true;
  }
  
  function dibujarPieza(row, col, piezaID) {
    const celda = document.querySelector(`.celda[data-row="${row}"][data-col="${col}"]`);
    if (celda) {
      const piezaElemento = celda.querySelector('.pieza');
      if (piezaElemento) {
        if (piezaID) {
          piezaElemento.textContent = piezas[piezasEnJuego[piezaID].tipo];
        } else {
          piezaElemento.remove();
        }
      } else if (piezaID) {
        const nuevaPieza = document.createElement('div');
        nuevaPieza.className = 'pieza';
        nuevaPieza.id = piezaID;
        nuevaPieza.textContent = piezas[piezasEnJuego[piezaID].tipo];
        nuevaPieza.draggable = true;
        nuevaPieza.addEventListener('dragstart', handleDragStart);
        celda.appendChild(nuevaPieza);
        // Actualizar la posición de la pieza en la estructura de datos
        piezasEnJuego[piezaID].col = col;
        piezasEnJuego[piezaID].row = row;
      }
    }
  }

  function moverPieza(origen, destino, piezaSeleccionadaID) {
    // Actualizar el tablero
    dibujarPieza(destino.row, destino.col, piezaSeleccionadaID);
    dibujarPieza(origen.row, origen.col, null);
  }

  document.addEventListener('DOMContentLoaded', function () {
    dibujarTablero();
  });
})();
