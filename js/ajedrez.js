// **Constantes**

const TABLERO_ANCHO = 8;
const TABLERO_ALTO = 8;

const PIEZAS = {
  "peón": {
    iniciales: ["♙", "♟"],
    movimiento: {
      horizontal: [-1, 1],
      diagonal: [-1, 1],
    },
  },
  "torre": {
    iniciales: ["♖", "♜"],
    movimiento: {
      horizontal: [-8, 8],
    },
  },
  "caballo": {
    iniciales: ["♘", "♞"],
    movimiento: {
      horizontal: [-2, 2, -1, 1],
      vertical: [-1, 1, -2, 2],
    },
  },
  "alfil": {
    iniciales: ["♗", "♝"],
    movimiento: {
      diagonal: [-7, 7, -6, 6, -5, 5, -4, 4],
    },
  },
  "dama": {
    iniciales: ["♕", "♛"],
    movimiento: {
      horizontal: [-8, 8],
      diagonal: [-7, 7, -6, 6, -5, 5, -4, 4],
    },
  },
  "rey": {
    iniciales: ["♔", "♚"],
    movimiento: {
      horizontal: [-1, 0, 1],
      vertical: [-1, 0, 1],
    },
  },
};

// **Variables globales**

let turno = "blancas";
let tablero = [];

// **Funciones**

function crearTablero() {
  for (let i = 0; i < TABLERO_ANCHO; i++) {
    tablero.push([]);
    for (let j = 0; j < TABLERO_ALTO; j++) {
      tablero[i].push("");
    }
  }

  // Colocar las piezas iniciales

  for (const [pieza, iniciales] of Object.entries(PIEZAS)) {
    for (const inicial of iniciales) {
      const [i, j] = inicial.split("");
      tablero[i - 1][j - 1] = pieza;
    }
  }
}

function moverPieza(pieza, origen, destino) {
  // Comprobar que el movimiento es válido

  if (!PIEZAS[pieza].movimiento.includes([origen[0] - destino[0], origen[1] - destino[1]])) {
    return false;
  }

  // Mover la pieza

  tablero[origen[0]][origen[1]] = "";
  tablero[destino[0]][destino[1]] = pieza;

  // Cambiar el turno

  turno = turno === "blancas" ? "negras" : "blancas";

  return true;
}

// **Ejecución**

crearTablero();

// Bucle principal del juego

while (true) {
  // Mostrar el tablero

  for (const fila of tablero) {
    console.log(fila.join(" "));
  }

  // Solicitar el movimiento

  console.log("Turno de las " + turno + ":");
  const [origen, destino] = prompt("Introduce la pieza a mover (ejemplo: a1 a2)").split(" ");

  // Mover la pieza

  const moverExitosa = moverPieza(tablero[origen[0] - 1][origen[1] - 1], [origen[0], origen[1]], [destino[0], destino[1]]);

  // Comprobar si hay jaque

  if (moverExitosa && esJaque(tablero, turno)) {
    console.log("Jaque!");
  }

  // Comprobar si hay jaque mate

  if (esJaqueMate(tablero, turno)) {
    console.log("Jaque mate!");
    break;
 
