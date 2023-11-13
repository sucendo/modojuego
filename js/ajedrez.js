// Módulo de ajedrez
(function() {
  class Ajedrez {
    constructor() {
      this.tablero = crearTablero();
      this.dibujarTablero();
    }

    moverPieza(origen, destino) {
      const piezaOrigen = this.tablero[origen][origen];
      const piezaDestino = this.tablero[destino][destino];
      this.tablero[destino][destino] = piezaOrigen;
      this.tablero[origen][origen] = null;
      if (piezaDestino !== null) {
        this.tablero[origen][origen] = piezaDestino;
      }
    }

    private crearTablero() {
      const tablero = [];
      for (let i = 0; i < 8; i++) {
        tablero[i] = [];
        for (let j = 0; j < 8; j++) {
          tablero[i][j] = null;
        }
      }
      for (let i = 0; i < 8; i++) {
        tablero[1][i] = "♙";
        tablero[6][i] = "♟";
        tablero[0][i] = i % 2 === 0 ? "♖" : "♘";
        tablero[7][i] = i % 2 === 0 ? "♜" : "♞";
        tablero[2][i] = i % 2 === 0 ? "♗" : "♝";
        tablero[5][i] = i % 2 === 0 ? "♗" : "♝";
        tablero[3][i] = i % 2 === 0 ? "♕" : "♛";
        tablero[4][i] = i % 2 === 0 ? "♔" : "♚";
      }
      return tablero;
    }

    private dibujarTablero() {
      const tableroHTML = document.getElementById("tablero");
      tableroHTML.innerHTML = "";
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const celda = document.createElement("div");
          celda.textContent = this.tablero[i][j] ? piezas[this.tablero[i][j]] : "";
          celda.style.position = "absolute";
          celda.style.top = (j * 64) + "px";
          celda.style.left = (i * 64) + "px";
          tableroHTML.appendChild(celda);
        }
      }
    }
  }

  export default Ajedrez;
})();
