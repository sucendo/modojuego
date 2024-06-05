// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: 1845,
    height: 900,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Declarar la puntuación inicial y otros parámetros relacionados
let score = 0;
let puntosPorAvionDerribado = 1000;
let puntosPorDisparo = 50;
let puntosPorImpacto = 200;

const game = new Phaser.Game(config);

let enemyCount = 0;
let playerLife = 3;

function preload() {
    // Cargar imágenes y recursos
    this.load.image('avion', 'img/plane/avion-blue.svg');
    this.load.image('bala', 'img/plane/cohete-blue.svg');
    this.load.image('enemigo', 'img/plane/avion-red.svg');
    this.load.image('balaEnemiga', 'img/plane/cohete-red.svg');
    this.load.image('fondo', 'img/plane/fondo01.png');
}

function create() {
    // Crear el fondo y hacer que se mueva
    this.fondo = this.add.tileSprite(0, 0, config.width, config.height, 'fondo');
    this.fondo.setOrigin(0, 0);

    // Crear el avión
    this.avion = this.physics.add.sprite(900, 800, 'avion');
   this.avion.body.setSize(40, 80); // Establecer un radio más pequeño para el cuerpo de colisión del avión del jugador
    this.avion.setCollideWorldBounds(true);

    // Crear grupo de balas
    this.balas = this.physics.add.group({
        defaultKey: 'bala',
        maxSize: 100
    });

    // Crear grupo de balas enemigas
    this.balasEnemigas = this.physics.add.group();

    // Crear grupo de enemigos
    this.enemigos = this.physics.add.group();

    // Control de teclas
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Colisiones
    this.physics.add.overlap(this.balas, this.enemigos, destruirEnemigo, null, this);
    this.physics.add.overlap(this.balasEnemigas, this.avion, impactarJugador, null, this);

    // Temporizador para generar enemigos
    this.time.addEvent({
        delay: 1000, // 1 segundo
        callback: crearEnemigo,
        callbackScope: this,
        loop: true
    });

    // Temporizador para disparos enemigos
    this.time.addEvent({
        delay: 2000, // 2 segundos
        callback: dispararEnemigos,
        callbackScope: this,
        loop: true
    });
}

function update() {
    // Mover el fondo para crear sensación de movimiento
    this.fondo.tilePositionY -= 3;

    // Control de movimiento del avión
    const velocidadJugador = 300; // Aumentar la velocidad del avión
    if (this.cursors.left.isDown) {
        this.avion.setVelocityX(-velocidadJugador);
    } else if (this.cursors.right.isDown) {
        this.avion.setVelocityX(velocidadJugador);
    } else {
        this.avion.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
        this.avion.setVelocityY(-velocidadJugador);
    } else if (this.cursors.down.isDown) {
        this.avion.setVelocityY(velocidadJugador);
    } else {
        this.avion.setVelocityY(0);
    }

    // Disparar balas
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
        let bala = this.balas.get(this.avion.x, this.avion.y);
        if (bala) {
            bala.setActive(true);
            bala.setVisible(true);
	 bala.body.setSize(20, 20); // Establecer un radio más pequeño para el cuerpo de colisión de la bala
            bala.body.velocity.y = -300;
	 bala.setScale(0.4); // Escalar la bala del jugador
        }
    }

    // Movimiento aleatorio de enemigos
    this.enemigos.children.iterate(function (enemigo) {
        if (!enemigo.body.velocity.x) {
            let direccionX = Phaser.Math.Between(-200, 200); // Aumentamos el rango de direcciones en el eje X
            let direccionY = Phaser.Math.Between(-200, 200);
            enemigo.setVelocity(direccionX, direccionY);
        }
        if (enemigo.x <= 0) {
            enemigo.setVelocityX(Phaser.Math.Between(50, 200)); // Reiniciamos la velocidad en el eje X si alcanza el límite izquierdo
        }
        if (enemigo.x >= config.width) {
            enemigo.setVelocityX(Phaser.Math.Between(-200, -50)); // Reiniciamos la velocidad en el eje X si alcanza el límite derecho
        }
        if (enemigo.y <= 0) {
            enemigo.setVelocityY(Phaser.Math.Between(50, 200)); // Reiniciamos la velocidad en el eje Y si alcanza el límite superior
        }
        if (enemigo.y >= config.height) {
            enemigo.setVelocityY(Phaser.Math.Between(-200, -50)); // Reiniciamos la velocidad en el eje Y si alcanza el límite inferior
        }

        // Actualizar la rotación del avión enemigo para que mire hacia la dirección de movimiento
        enemigo.setRotation(Phaser.Math.Angle.Between(0, 0, enemigo.body.velocity.x, enemigo.body.velocity.y));
    }, this);
}

function crearEnemigo() {
    if (this.enemigos.getChildren().length < 6) {
        let x, y, direccionX, direccionY;
        const borde = Phaser.Math.Between(0, 3); // 0: arriba, 1: derecha, 2: abajo, 3: izquierda

        switch (borde) {
            case 0: // Aparecer desde arriba
                x = Phaser.Math.Between(0, config.width);
                y = 0;
                direccionX = Phaser.Math.Between(100, -100);
                direccionY = Phaser.Math.Between(200, 50);
                break;
            case 1: // Aparecer desde la derecha
                x = config.width;
                y = Phaser.Math.Between(0, config.height);
                direccionX = Phaser.Math.Between(-200, -50);
                direccionY = Phaser.Math.Between(-100, 100);
                break;
            case 2: // Aparecer desde abajo
                x = Phaser.Math.Between(0, config.width);
                y = config.height;
                direccionX = Phaser.Math.Between(-100, 100);
                direccionY = Phaser.Math.Between(-200, -50);
                break;
            case 3: // Aparecer desde la izquierda
                x = 0;
                y = Phaser.Math.Between(0, config.height);
                direccionX = Phaser.Math.Between(50, 200);
                direccionY = Phaser.Math.Between(-100, 100);
                break;
        }

        // Crear enemigo en la posición adecuada
        let enemigo = this.enemigos.create(x, y, 'enemigo');

        // Establecer la velocidad del enemigo
        enemigo.setVelocity(direccionX, direccionY);

        // Establecer la rotación del avión enemigo según su dirección
        enemigo.setRotation(Phaser.Math.Angle.Between(0, 0, direccionX, direccionY));

        enemigo.body.setSize(40, 80);
        enemyCount++;
    }
}

function dispararEnemigos() {
    this.enemigos.children.iterate(function (enemigo) {
        let balaEnemiga = this.balasEnemigas.create(enemigo.x, enemigo.y, 'balaEnemiga');
        balaEnemiga.setVelocityY(300); // Velocidad descendente de la bala enemiga
        balaEnemiga.setScale(0.4); // Escalar la bala del jugador
       score -= puntosPorDisparo;
    }, this);
}

function destruirEnemigo(bala, enemigo) {
    bala.destroy();
    enemigo.destroy();
    enemyCount--; // Disminuir el conteo de enemigos
   score += puntosPorAvionDerribado;
}

function impactarJugador(avion, balaEnemiga) {
    balaEnemiga.destroy();
    playerLife--;
    avion.setTint(0xff0000); // Cambiar el color del avión a rojo
    setTimeout(() => {
        avion.clearTint(); // Restaurar el color original del avión después de medio segundo
    }, 150);
    score -= puntosPorImpacto;
    if (playerLife <= 0) {
        this.physics.pause();
        avion.setActive(false); // Desactivar el sprite del avión
        avion.setVisible(false); // Ocultar el sprite del avión
        avion.body.stop(); // Detener cualquier movimiento del avión
        avion.anims.play('explode');

        // Crear texto "GAME OVER" con contorno y sombreado
        this.add.text(config.width / 2, config.height / 2, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#ff0000',
            stroke: '#000000', // Contorno del texto
            strokeThickness: 6, // Grosor del contorno
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 5,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
	this.add.text(config.width / 2, config.height / 2 + 50, 'Puntuación: ' + score, { fontFamily: 'Arial', fontSize: 32, color: '#ffffff' }).setOrigin(0.5);	
    }
}
