(function () {
  // Mapeo de caracteres
  const mapPiezas = {
    '♙': '♙', '♟': '♟',
    '♖': '♖', '♜': '♜',
    '♘': '♘', '♞': '♞',
    '♗': '♗', '♝': '♝',
    '♕': '♕', '♛': '♛',
    '♔': '♔', '♚': '♚'
  };

  // Estructura: { "pieza-0-1": {id, tipo, row, col}, ... }
  const piezasEnJuego = {}; 

  // Estado global
  let divEstado = null; 
  let ultimoMovimiento = null; 
  // ejemplo: { piezaID:'pieza-6-4', origen:{row:6,col:4}, destino:{row:4,col:4}, doblePaso:true }

  // Para enroque: saber si el rey o la torre se movieron ya
  // Simplificamos: guardamos segun color y posición inicial
  let reyBlancoHaMovido = false;
  let reyNegroHaMovido = false;
  let torreBlancaIzqHaMovido = false; // (fila 7, col 0)
  let torreBlancaDerHaMovido = false; // (fila 7, col 7)
  let torreNegraIzqHaMovido = false;  // (fila 0, col 0)
  let torreNegraDerHaMovido = false;  // (fila 0, col 7)

  function init() {
    divEstado = document.getElementById('estado');
    dibujarTablero();
    mostrarEstado("¡Tablero inicializado con movimientos especiales!");
  }

  /* Crea el tablero */
  function dibujarTablero() {
    const tableroHTML = document.getElementById('tablero');
    tableroHTML.innerHTML = '';

    const filasYCeldasContainer = document.createElement('div');
    filasYCeldasContainer.className = 'filas-celdas-container';

    // Etiquetas de columnas (A-H)
    const columnasLabel = document.createElement('div');
    columnasLabel.className = 'columnas-label';
    const emptyColumn = document.createElement('div');
    //columnasLabel.appendChild(emptyColumn);
    for (let i = 0; i < 8; i++) {
      const colDiv = document.createElement('div');
      colDiv.textContent = String.fromCharCode(65 + i);
      columnasLabel.appendChild(colDiv);
    }
    filasYCeldasContainer.appendChild(columnasLabel);

    // Filas
    for (let fila = 0; fila < 8; fila++) {
      const filaYCeldasContainer = document.createElement('div');
      filaYCeldasContainer.className = 'fila-celdas-container';

      const filaLabel = document.createElement('div');
      filaLabel.className = 'fila-label';
      filaLabel.textContent = 8 - fila;
      filaYCeldasContainer.appendChild(filaLabel);

      for (let col = 0; col < 8; col++) {
        const celda = document.createElement('div');
        celda.className = 'celda';
        celda.dataset.row = fila;
        celda.dataset.col = col;
        celda.addEventListener('dragover', handleDragOver);
        celda.addEventListener('drop', handleDrop);

        const isCeldaNegra = (fila + col) % 2 !== 0;
        celda.classList.add(isCeldaNegra ? 'celda-negra' : 'celda-blanca');

        // Poner pieza inicial
        const pieza = obtenerPiezaInicial(fila, col);
        if (pieza) {
          const piezaElemento = document.createElement('div');
          piezaElemento.className = 'pieza';
          piezaElemento.id = `pieza-${fila}-${col}`;
          piezaElemento.textContent = mapPiezas[pieza];
          piezaElemento.draggable = true;
          piezaElemento.addEventListener('dragstart', handleDragStart);

          celda.appendChild(piezaElemento);
          piezasEnJuego[piezaElemento.id] = {
            id: piezaElemento.id,
            tipo: pieza, 
            row: fila,
            col: col
          };
        }
        filaYCeldasContainer.appendChild(celda);
      }
      filasYCeldasContainer.appendChild(filaYCeldasContainer);
    }

    tableroHTML.appendChild(filasYCeldasContainer);
  }

  function obtenerPiezaInicial(row, col) {
    if (row === 1) return '♟'; 
    if (row === 6) return '♙'; 

    if (row === 0 || row === 7) {
      switch (col) {
        case 0: return (row === 0) ? '♜' : '♖';
        case 1: return (row === 0) ? '♞' : '♘';
        case 2: return (row === 0) ? '♝' : '♗';
        case 3: return (row === 0) ? '♛' : '♕';
        case 4: return (row === 0) ? '♚' : '♔';
        case 5: return (row === 0) ? '♝' : '♗';
        case 6: return (row === 0) ? '♞' : '♘';
        case 7: return (row === 0) ? '♜' : '♖';
      }
    }
    return null;
  }

  /* Drag & Drop Handlers */
  function handleDragStart(e) {
    const piezaID = e.target.id;
    e.dataTransfer.setData('text/plain', piezaID);
    e.dataTransfer.setData('row', piezasEnJuego[piezaID].row);
    e.dataTransfer.setData('col', piezasEnJuego[piezaID].col);
  }
  function handleDragOver(e) { e.preventDefault(); }
  function handleDrop(e) {
    e.preventDefault();
    const piezaID = e.dataTransfer.getData('text/plain');
    const origen = {
      row: +e.dataTransfer.getData('row'),
      col: +e.dataTransfer.getData('col')
    };
    let destino = {
      row: +e.target.dataset.row,
      col: +e.target.dataset.col
    };
    // Si sueltas sobre la propia pieza
    if (isNaN(destino.row) || isNaN(destino.col)) {
      const parentCelda = e.target.closest('.celda');
      if (!parentCelda) return;
      destino = {
        row: +parentCelda.dataset.row,
        col: +parentCelda.dataset.col
      };
    }

    // Verificar
    const validado = validarMovimiento(origen, destino, piezaID);
    if (!validado.esValido) {
      mostrarEstado("Movimiento inválido");
      return;
    }

    // Mover
    moverPieza(origen, destino, piezaID, validado);
  }

  function moverPieza(origen, destino, piezaID, infoMovimiento) {
    // Quitar en origen
    dibujarPieza(origen.row, origen.col, null);

    // Si es enroque, también mover la torre
    if (infoMovimiento.enroque) {
      // Determinar la posición de la torre y destino
      const { torreOrigen, torreDestino } = infoMovimiento.enroque;
      // Borrar la torre
      dibujarPieza(torreOrigen.row, torreOrigen.col, null);
      // Mover la torre
      dibujarPieza(torreDestino.row, torreDestino.col, torreOrigen.piezaID);
    }

    // Si es en passant => quita el peón que se captura
    if (infoMovimiento.enPassant) {
      const { row, col } = infoMovimiento.enPassant;
      dibujarPieza(row, col, null);
    }

    // Colocar pieza en destino
    dibujarPieza(destino.row, destino.col, piezaID);

    // Promoción
    if (infoMovimiento.promotion) {
      piezasEnJuego[piezaID].tipo = (colorDePieza(piezasEnJuego[piezaID].tipo) === 'white') ? '♕' : '♛';
      dibujarPieza(destino.row, destino.col, piezaID); // redibujar
      mostrarEstado("¡Promoción a reina!");
    }

    // Actualizar ultimoMovimiento
    ultimoMovimiento = {
      piezaID,
      origen, 
      destino, 
      doblePaso: infoMovimiento.doblePaso || false
    };

    // Marcar que rey o torres se han movido (para enroques futuros)
    actualizarFlagsReyTorre(piezaID, origen);

    mostrarEstado(`Movimiento: ${piezasEnJuego[piezaID].tipo} a (${destino.row},${destino.col})`);
  }

  // (Re)coloca una pieza en row,col (si piezaID=null => quita)
  function dibujarPieza(row, col, piezaID) {
    const celda = document.querySelector(`.celda[data-row="${row}"][data-col="${col}"]`);
    if (!celda) return;
    const piezaElemento = celda.querySelector('.pieza');
    if (!piezaID) {
      if (piezaElemento) piezaElemento.remove();
      return;
    }
    // O actualizar/crear
    if (piezaElemento) {
      piezaElemento.id = piezaID;
      piezaElemento.textContent = mapPiezas[piezasEnJuego[piezaID].tipo];
    } else {
      const nuevaPieza = document.createElement('div');
      nuevaPieza.className = 'pieza';
      nuevaPieza.id = piezaID;
      nuevaPieza.textContent = mapPiezas[piezasEnJuego[piezaID].tipo];
      nuevaPieza.draggable = true;
      nuevaPieza.addEventListener('dragstart', handleDragStart);
      celda.appendChild(nuevaPieza);
    }
    // Actualizar coords internas
    piezasEnJuego[piezaID].row = row;
    piezasEnJuego[piezaID].col = col;
  }

  // Devuelve info sobre si se puede mover
  function validarMovimiento(origen, destino, piezaID) {
    // Retorna un objeto { esValido: bool, enPassant?: {row,col}, enroque?: {...}, doblePaso?: bool, promotion?: bool }
    // esValido = false => movimiento inválido
    const piece = piezasEnJuego[piezaID].tipo;
    const color = colorDePieza(piece);

    // No mover a la misma casilla
    if (origen.row === destino.row && origen.col === destino.col) {
      return { esValido: false };
    }

    // Ver si hay pieza en destino
    const piezaDestino = getPieceAt(destino.row, destino.col);
    if (piezaDestino) {
      // No puedes capturar tu propio color
      if (colorDePieza(piezaDestino) === color) {
        return { esValido: false };
      }
    }

    // Distancia
    const dRow = destino.row - origen.row;
    const dCol = destino.col - origen.col;

    // Lógica por tipo
    switch(piece) {
      case '♙': return validarPeon(origen, destino, dRow, dCol, 'white');
      case '♟': return validarPeon(origen, destino, dRow, dCol, 'black');
      case '♖':
      case '♜': return validarTorre(origen, destino);
      case '♘':
      case '♞': return validarCaballo(dRow, dCol);
      case '♗':
      case '♝': return validarAlfil(origen, destino);
      case '♕':
      case '♛': return validarReina(origen, destino);
      case '♔':
      case '♚': return validarRey(origen, destino);
      default:
        return { esValido: false };
    }
  }

  function validarPeon(origen, destino, dRow, dCol, colorPeon) {
    // Retorno
    const result = { esValido: false, enPassant: null, doblePaso: false, promotion: false };

    const pieceDest = getPieceAt(destino.row, destino.col);
    const dir = (colorPeon === 'white') ? -1 : 1;
    const filaInicial = (colorPeon === 'white') ? 6 : 1;
    const filaDePromocion = (colorPeon === 'white') ? 0 : 7;

    // Avance normal 1
    if (dCol === 0 && dRow === dir && !pieceDest) {
      result.esValido = true;
      // ¿Promoción?
      if (destino.row === filaDePromocion) {
        result.promotion = true;
      }
      return result;
    }

    // Doble paso (si está en fila inicial y no hay piezas en medio)
    if (origen.row === filaInicial && dCol === 0 && dRow === 2*dir) {
      // Verificar que las 2 celdas estén libres
      const middleRow = origen.row + dir;
      if (!getPieceAt(middleRow, origen.col) && !pieceDest) {
        result.esValido = true;
        result.doblePaso = true;
        return result;
      }
    }

    // Captura diagonal
    if (Math.abs(dCol) === 1 && dRow === dir) {
      // Captura normal
      if (pieceDest) {
        result.esValido = true;
        if (destino.row === filaDePromocion) {
          result.promotion = true;
        }
        return result;
      }
      // En passant => si no hay pieza en destino, pero la última mov fue doble paso
      if (!pieceDest && ultimoMovimiento && ultimoMovimiento.doblePaso) {
        // El peón que hizo doble paso está en la misma fila que 'destino'
        // y su col es 'destino.col'
        const { piezaID, origen:orig, destino:dest } = ultimoMovimiento;
        const pTipo = piezasEnJuego[piezaID].tipo;
        // Debe ser un peón del color opuesto
        if ((pTipo === '♙' || pTipo === '♟') && colorDePieza(pTipo) !== colorPeon) {
          // Debe estar en la fila 'origen.row' y col 'destino.col'
          if (dest.row === destino.row + (-1*dir) && dest.col === destino.col) {
            // => es enPassant
            result.esValido = true;
            result.enPassant = { row: dest.row, col: dest.col }; 
            // Promoción si llega a la última fila
            if (destino.row === filaDePromocion) {
              result.promotion = true;
            }
            return result;
          }
        }
      }
    }

    return result;
  }

  function validarTorre(origen, destino) {
    if (origen.row !== destino.row && origen.col !== destino.col) {
      return { esValido: false };
    }
    if (hayBloqueoEnCamino(origen, destino)) {
      return { esValido: false };
    }
    return { esValido: true };
  }

  function validarCaballo(dRow, dCol) {
    const combos = [ [2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2] ];
    const valid = combos.some(([r,c]) => (r === dRow && c === dCol));
    return { esValido: valid };
  }

  function validarAlfil(origen, destino) {
    if (Math.abs(destino.row - origen.row) !== Math.abs(destino.col - origen.col)) {
      return { esValido: false };
    }
    if (hayBloqueoEnCamino(origen, destino)) {
      return { esValido: false };
    }
    return { esValido: true };
  }

  function validarReina(origen, destino) {
    const movAlfil = (Math.abs(destino.row - origen.row) === Math.abs(destino.col - origen.col));
    const movTorre = (origen.row === destino.row) || (origen.col === destino.col);
    if (!movAlfil && !movTorre) {
      return { esValido: false };
    }
    if (hayBloqueoEnCamino(origen, destino)) {
      return { esValido: false };
    }
    return { esValido: true };
  }

  // El rey puede hacer un enroque corto o largo si no ha movido, ni la torre
  // (y no chequeamos jaque)
  function validarRey(origen, destino) {
    // Mov normal (1 paso)
    const dRow = Math.abs(destino.row - origen.row);
    const dCol = Math.abs(destino.col - origen.col);

    // Enroque => si row es la misma y col se mueve 2
    if (dRow === 0 && dCol === 2) {
      // Comprobar si es enroque corto o largo, si no hay bloqueo, si Rey y Torre no han movido
      const resEnroque = chequearEnroque(origen, destino);
      if (resEnroque) return { esValido: true, enroque: resEnroque };
    }

    // Movimiento normal
    if (dRow <= 1 && dCol <= 1) {
      return { esValido: true };
    }
    return { esValido: false };
  }

  function chequearEnroque(origen, destino) {
    // Suponemos (row) es 0 o 7
    // Si col > origen => enroque corto, si col < origen => enroque largo
    if (origen.row !== destino.row) return null; 
    const row = origen.row;
    const diffCol = destino.col - origen.col;
    const color = (row === 0) ? 'black' : 'white'; 
    // row=0 => rey negro, row=7 => rey blanco

    // Revisar si el rey ya movió
    if (color === 'white' && reyBlancoHaMovido) return null;
    if (color === 'black' && reyNegroHaMovido) return null;

    // Enroque corto => +2 col
    if (diffCol === 2) {
      // Revisar si la torre (col=7) se ha movido, y no hay piezas en col=5 o col=6
      if (hayBloqueoEnCamino({row, col:4}, {row, col:7})) return null;
      if (color === 'white' && torreBlancaDerHaMovido) return null;
      if (color === 'black' && torreNegraDerHaMovido) return null;

      // Ok => mover la torre de (row,7) a (row,5)
      const torreID = getPiezaIDEn(row, 7);
      if (!torreID) return null;
      return {
        torreOrigen: { row, col:7, piezaID: torreID },
        torreDestino: { row, col:5 }
      };
    }
    // Enroque largo => -2 col
    if (diffCol === -2) {
      // Revisar torre en col=0
      if (hayBloqueoEnCamino({row, col:4}, {row, col:0})) return null;
      if (color === 'white' && torreBlancaIzqHaMovido) return null;
      if (color === 'black' && torreNegraIzqHaMovido) return null;

      const torreID = getPiezaIDEn(row, 0);
      if (!torreID) return null;
      return {
        torreOrigen: { row, col:0, piezaID: torreID },
        torreDestino: { row, col:3 }
      };
    }
    return null;
  }

  function hayBloqueoEnCamino(origen, destino) {
    let pasoRow = Math.sign(destino.row - origen.row);
    let pasoCol = Math.sign(destino.col - origen.col);

    let r = origen.row + pasoRow;
    let c = origen.col + pasoCol;

    while (r !== destino.row || c !== destino.col) {
      if (getPieceAt(r, c)) {
        return true;
      }
      r += pasoRow;
      c += pasoCol;
    }
    return false;
  }

  function getPieceAt(row, col) {
    for (const pID in piezasEnJuego) {
      const p = piezasEnJuego[pID];
      if (p.row === row && p.col === col) {
        return p.tipo; 
      }
    }
    return null;
  }
  function getPiezaIDEn(row, col) {
    // Devuelve el ID de la pieza en (row,col) o null
    for (const pID in piezasEnJuego) {
      const p = piezasEnJuego[pID];
      if (p.row === row && p.col === col) {
        return pID;
      }
    }
    return null;
  }

  function colorDePieza(tipo) {
    const blancas = ['♙','♖','♘','♗','♕','♔'];
    return blancas.includes(tipo) ? 'white' : 'black';
  }

  /* Actualiza las banderas de si el rey o las torres se han movido */
  function actualizarFlagsReyTorre(piezaID, origen) {
    const p = piezasEnJuego[piezaID];
    if (!p) return;
    const t = p.tipo;
    const color = colorDePieza(t);

    // Si es rey
    if (t === '♔') reyBlancoHaMovido = true;
    if (t === '♚') reyNegroHaMovido = true;

    // Si es torre, chequear su posición inicial
    if (t === '♖' || t === '♜') {
      if (color === 'white') {
        // fila=7, col=0 => izq, col=7 => der
        if (origen.row === 7 && origen.col === 0) torreBlancaIzqHaMovido = true;
        if (origen.row === 7 && origen.col === 7) torreBlancaDerHaMovido = true;
      } else {
        // negro fila=0
        if (origen.row === 0 && origen.col === 0) torreNegraIzqHaMovido = true;
        if (origen.row === 0 && origen.col === 7) torreNegraDerHaMovido = true;
      }
    }
  }

  function mostrarEstado(msg) {
    if (divEstado) {
      divEstado.textContent = msg;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
