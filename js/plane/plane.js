// Configuración del juego
var config = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};

 var game = new Phaser.Game(config);

// Declarar la puntuación inicial y otros parámetros relacionados
let score = 0;
let puntosPorAvionDerribado = 1000;
let puntosPorDisparo = 10;
let puntosPorMisil = 300;
let puntosPorImpacto = 500;

let enemyCount = 0;
let playerLife = 3;
let misilesSeguidoresActivas = 0;
let enAlturaBaja = false;

// Declarar una variable para contar el número de aviones enemigos destruidos
let avionesDestruidos = 0;
// Declarar una variable para controlar si se debe detener la generación de enemigos
let detenerGeneracion = false;

// Array con mensajes de ánimo
const mensajesAnimo = [
    "¡Sigue así, piloto!",
    "¡No hay enemigo que te detenga!",
    "¡Eres el mejor piloto que he visto!",
    "¡Ánimo, piloto! ¡Estás haciendo un gran trabajo!",
    "Mantén la calma y sigue luchando.",
    "La misión depende de ti. ¡Tú puedes!",
    "¡Estamos contigo, piloto! ¡No te rindas!",
    "La victoria está cerca. ¡Sigue adelante!",
    "Recuerda tu entrenamiento. Confiamos en ti.",
    "La misión es dura, pero tú eres más fuerte.",
    "Cada enemigo derribado nos acerca a la victoria.",
    "La misión es difícil, pero tú eres capaz.",
    "Tu valentía nos inspira a todos. ¡Sigue así!"
];

function preload() {
	// Cargar imágenes y recursos
	this.load.image('avion', 'img/plane/avion-f22.svg');
	this.load.image('balas', 'img/plane/bala.svg');
	this.load.image('misil', 'img/plane/cohete-blue.svg');
	this.load.image('enemigo', 'img/plane/avion-su57.svg');
	this.load.image('balasEnemiga', 'img/plane/cohete-red.svg');
	this.load.image('fondo', 'img/plane/fondo01.png');
	this.load.image('nube1', 'img/plane/nube1.svg'); // Cargar imagen de nube1
	this.load.image('nube2', 'img/plane/nube2.svg'); // Cargar imagen de nube2
	this.load.image('nube3', 'img/plane/nube3.svg'); // Cargar imagen de nube3
}

function create() {
	// Crear el fondo y hacer que se mueva
	this.fondo = this.add.tileSprite(0, 0, config.width, config.height, 'fondo');
	this.fondo.setOrigin(0, 0);

	// Crear nubes para el efecto 3D
	this.nubes = this.physics.add.group();

	for (let i = 0; i < 20; i++) {
		let x = Phaser.Math.Between(0, config.width);
		let y = Phaser.Math.Between(0, config.height);
		
		// Ajustar la probabilidad de crear más o menos nubes
		let probabilidad = Phaser.Math.FloatBetween(0, 1);
		let cantidadNubes = 1; // Por defecto, crear una nube

		if (probabilidad < 0.3) { // Probabilidad del 30% de crear más nubes
			cantidadNubes = 3; // Crear dos nubes
		}

		for (let j = 0; j < cantidadNubes; j++) {
			let tipoNube = Phaser.Math.Between(1, 3); // Seleccionar aleatoriamente entre nube1, nube2 y nube3
			let nube = this.nubes.create(x, y, 'nube' + tipoNube);
			nube.setVelocity(0, Phaser.Math.Between(300, 500)); // Aumentar la velocidad de las nubes
			nube.setScale(Phaser.Math.FloatBetween(0.5, 2.5));
			nube.setAlpha(0.6);
		}
	}
	
	// Crear intro ----------------------------------------------------

	// Agregar el título "F-22 Raptor" en letras grandes con estilo
	let titulo = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'F-22 Raptor', {
		fontFamily: 'Impact',
		fontSize: 200,
		color: '#0066ff',
		stroke: '#ffffff',
		strokeThickness: 8,
		shadow: {
			offsetX: 4,
			offsetY: 4,
			color: '#808080', 
			blur: 5,
			stroke: true,
			fill: true
		},
		align: 'center'
	}).setOrigin(0.5);

	// Texto "Misión 001" debajo del título
	let subtitulo = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 150, 'Misión 001', {
		fontFamily: 'Impact',
		fontSize: 48,
		color: '#ff0000', // Color rojo
		stroke: '#ffffff',
		strokeThickness: 6,
		align: 'center'
	}).setOrigin(0.5);

	// Desvanecer el título después de 2 segundos
	this.time.delayedCall(2000, () => {
		titulo.destroy(); // Eliminar el texto del título
		subtitulo.destroy(); // Eliminar el texto del subtitulo
		// Aquí puedes iniciar cualquier otra parte de tu juego
	}, [], this);

	// Creación de Objetos del juego y sus automatizaciones ----------
	
	// Crear el avión
	this.avion = this.physics.add.sprite(900, 800, 'avion');
	this.avion.body.setSize(40, 80); // Establecer un radio más pequeño para el cuerpo de colisión del avión del jugador
	this.avion.setCollideWorldBounds(true);

	// Crear grupo de bala
	this.bala = this.physics.add.group({
		defaultKey: 'balas',
		maxSize: 10000
	});
	
	// Crear grupo de misiles
	this.misil= this.physics.add.group({   
		defaultKey: 'misil',
		maxSize: 10
	});
	
	// Control de teclas
	this.cursors = this.input.keyboard.createCursorKeys();
	this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
	
	// Control de tecla para disparar una balas que siga a un avión enemigo (tecla A)
	this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
	// Control de tecla para descender el avión (tecla D)
	this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
	// Control de tecla para ascender el avión (tecla F)
	this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

	// Crear grupo de enemigos
	this.enemigos = this.physics.add.group();

	// Crear grupo de bala enemigas
	this.misilEnemigo = this.physics.add.group();	

	// Temporizador para generar enemigos
	this.time.addEvent({
		delay: Phaser.Math.Between(1000, 5000), // Retraso aleatorio entre 1 y 5 segundos
		callback: crearEnemigo,
		callbackScope: this,
		loop: true
	});

	// Temporizador para disparos enemigos
	this.time.addEvent({
		delay: Phaser.Math.Between(1000, 3000), // Retraso aleatorio entre 1 y 3 segundos
		callback: dispararEnemigos,
		callbackScope: this,
		loop: true
	});
	
	// Temporizador para maniobras de enemigos
	this.time.addEvent({
		delay: Phaser.Math.Between(500, 1000), // Retraso aleatorio entre 0.5 y 1 segundo
		callback: maniobrarEnemigos,
		callbackScope: this,
		loop: true
	});
	
	// Colisiones
	this.physics.add.overlap(this.bala, this.enemigos, destruirEnemigo, null, this);
	this.physics.add.overlap(this.misilEnemigo, this.avion, impactarJugador, null, this);
	this.physics.add.overlap(this.avion, this.enemigos, impactarJugador, null, this);
	this.physics.add.overlap(this.misil, this.enemigos, destruirEnemigo, null, this);
	this.physics.add.overlap(this.bala, this.misilEnemigo, destruirMisilEnemigo, null, this);
}

function update() {
	// Mover el fondo para crear sensación de movimiento
	this.fondo.tilePositionY -= 3;

	// Mover nubes para crear efecto 3D
	this.nubes.children.iterate(function (nube) {
		if (nube.y > config.height) {
			nube.y = 0;
			nube.x = Phaser.Math.Between(0, config.width);
			nube.setVelocity(0, Phaser.Math.Between(300, 500)); // Aumentar la velocidad de las nubes al reiniciar su posición
			nube.setScale(Phaser.Math.FloatBetween(0.5, 2.5));
		}
	});

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

	// Disparar bala
	if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
		if (!enAlturaBaja) {
			let balas = this.bala.get(this.avion.x, this.avion.y);
			if (balas) {
				balas.setActive(true);
				balas.setVisible(true);
				balas.body.setSize(20, 20); // Establecer un radio más pequeño para el cuerpo de colisión de la balas
				balas.body.velocity.y = -600;
				balas.setScale(0.15); // Escalar la balas del jugador
			}
			score -= puntosPorDisparo;
		}
	}
	
	// Disparar misiles que siguen a un avión enemigo (Tecla A)
	if (Phaser.Input.Keyboard.JustDown(this.aKey) && misilesSeguidoresActivas < 10) {		
		if (!enAlturaBaja){	
			// Obtener la referencia al avión enemigo más cercano
			let avionEnemigoMasCercano = this.enemigos.getFirstAlive();

			if (avionEnemigoMasCercano) {
				// Crear una balas que siga al avión enemigo
				let misiles = this.misil.get(this.avion.x, this.avion.y);

				if (misiles) {
					misiles.setActive(true);
					misiles.setVisible(true);
					misiles.body.setSize(20, 20); // Establecer un tamaño de colisión para la balas
					misiles.setScale(0.5); // Escalar la balas

					// Inicializar la velocidad del misil
					misiles.speed = 50; // Velocidad inicial del misil

					// Calcular el ángulo de rotación hacia el avión enemigo más cercano
					let angle = Phaser.Math.Angle.BetweenPoints(misiles, avionEnemigoMasCercano);
					misiles.angle = Phaser.Math.RadToDeg(0); // Ajustar el ángulo en 90 grados

					// Establecer la velocidad de la balas en la dirección del avión enemigo
					this.physics.velocityFromRotation(angle, misiles.speed, misiles.body.velocity);
					misiles.target = avionEnemigoMasCercano;

					// Incrementar el contador de bala seguidoras activas
					misilesSeguidoresActivas++;
				}
			}
			score -= puntosPorMisil;
		}
	}

	this.misil.children.iterate((misiles) => {
		if (misiles.active) {
			// Verificar si el objetivo aún es válido
			if (!misiles.target || !misiles.target.active) {
				// Asignar un nuevo objetivo
				let nuevoObjetivo = this.enemigos.getChildren().find(enemigo => enemigo.active);
				if (nuevoObjetivo) {
					misiles.target = nuevoObjetivo;
				} else {
					// Si no hay nuevos objetivos, destruir el misil
					destruirMisiles(misiles);
					return; // Salir de la iteración
				}
			}

			// Aumentar la velocidad del misil
			misiles.speed += 5;

			// Calcular el ángulo hacia el objetivo actual
			let targetAngle = Phaser.Math.Angle.BetweenPoints(misiles, misiles.target);

			// Interpolación lineal del ángulo del misil hacia el ángulo objetivo
			let currentAngle = Phaser.Math.DegToRad(misiles.angle - 90);
			let newAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, 0.05); // 0.05 es el factor de suavizado

			// Calcular la nueva velocidad y dirección basada en el ángulo interpolado
			this.physics.velocityFromRotation(newAngle, misiles.speed, misiles.body.velocity);
			misiles.angle = Phaser.Math.RadToDeg(newAngle) + 90;

			// Verificar la colisión con el objetivo
			if (Phaser.Math.Distance.Between(misiles.x, misiles.y, misiles.target.x, misiles.target.y) < 10) {
				destruirEnemigo(null, misiles.target); // Destruir enemigo cuando el misil lo alcanza
				destruirMisiles(misiles); // Destruir el misil
			}
		}
	}, this);
	
	// Control de descenso (tecla D)
	if (Phaser.Input.Keyboard.JustDown(this.dKey)) {
		enAlturaBaja = true;
		// Reducir gradualmente la escala del avión a 0.6
		this.tweens.add({
			targets: this.avion,
			scaleX: 0.6,
			scaleY: 0.6,
			duration: 500, // Duración de la animación en milisegundos
			ease: 'Linear', // Tipo de interpolación
			onComplete: function() {
				// Desactivar las colisiones entre bala enemigas y aviones enemigos con el avión del jugador
				this.physics.world.removeCollider(this.avionbalasEnemigaCollider);
				this.physics.world.removeCollider(this.avionEnemigoCollider);
			},
			callbackScope: this // Ámbito de la función onComplete
		});
	}

	// Control de ascenso (tecla F)
	if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
		enAlturaBaja = false;
		// Aumentar gradualmente la escala del avión a 1 (escala original)
		this.tweens.add({
			targets: this.avion,
			scaleX: 1,
			scaleY: 1,
			duration: 500, // Duración de la animación en milisegundos
			ease: 'Linear', // Tipo de interpolación
			onComplete: function() {
				// Reactivar las colisiones entre bala enemigas y aviones enemigos con el avión del jugador
				this.avionbalasEnemigaCollider = this.physics.add.collider(this.avion, this.misilEnemigo, impactarJugador, null, this);
				this.avionEnemigoCollider = this.physics.add.collider(this.avion, this.enemigos, impactarJugador, null, this);
			},
			callbackScope: this // Ámbito de la función onComplete
		});
	}

	// Movimiento aleatorio de enemigos
	/*
	this.enemigos.children.iterate(function (enemigo) {
		if (!enemigo.body.velocity.x) {
			let direccionX = Phaser.Math.Between(-200, 200); // Aumentamos el rango de direcciones en el eje X
			let direccionY = Phaser.Math.Between(-200, 200);
			enemigo.setVelocity(direccionX, direccionY);
		}
		if (enemigo.x <= 0) {
			enemigo.setVelocityX(Phaser.Math.Between(50, 100)); // Reiniciamos la velocidad en el eje X si alcanza el límite izquierdo
		}
		if (enemigo.x >= config.width) {
			enemigo.setVelocityX(Phaser.Math.Between(-200, -50)); // Reiniciamos la velocidad en el eje X si alcanza el límite derecho
		}
		if (enemigo.y <= 0) {
			enemigo.setVelocityY(Phaser.Math.Between(150, 500)); // Reiniciamos la velocidad en el eje Y si alcanza el límite superior
		}
		if (enemigo.y >= config.height) {
			enemigo.setVelocityY(Phaser.Math.Between(-200, -50)); // Reiniciamos la velocidad en el eje Y si alcanza el límite inferior
		}

		// Actualizar la rotación del avión enemigo para que mire hacia la dirección de movimiento
		enemigo.setRotation(Phaser.Math.Angle.Between(0, 0, enemigo.body.velocity.x, enemigo.body.velocity.y) + Math.PI / 2);
	}, this);
	*/
	
	// Actualizar la rotación del avión enemigo para que mire hacia la dirección de movimiento
	this.enemigos.children.iterate(function (enemigo) {
		enemigo.setRotation(Phaser.Math.Angle.Between(0, 0, enemigo.body.velocity.x, enemigo.body.velocity.y) + Math.PI / 2);
	}, this);	
	
}

function crearEnemigo() {
	if (!detenerGeneracion) {
		if (this.enemigos.getChildren().length < 6) {
			let x, y, direccionX, direccionY;
			const borde = Phaser.Math.Between(0, 3); // 0: arriba, 1: derecha, 2: abajo, 3: izquierda

			// Definir colores para el tint
			const ColoresEnemigos = [0x617073, 0x858484, 0xa5bfc5, 0x383d4b]; // Colores gris original, gris claro, azul claro y negro
			let color = Phaser.Math.RND.pick(ColoresEnemigos);

			switch (borde) {
				case 0: // Aparecer desde arriba
					x = Phaser.Math.Between(0, config.width);
					y = 0;
					direccionX = Phaser.Math.Between(-50, 50);
					direccionY = Phaser.Math.Between(300, 500); // Más rápido hacia abajo
					break;
				case 1: // Aparecer desde la derecha
					x = config.width;
					y = Phaser.Math.Between(0, config.height);
					direccionX = Phaser.Math.Between(-300, -200); // Rápido hacia la izquierda
					direccionY = Phaser.Math.Between(-50, 50);
					break;
				case 2: // Aparecer desde abajo
					x = Phaser.Math.Between(0, config.width);
					y = config.height;
					direccionX = Phaser.Math.Between(-50, 50);
					direccionY = Phaser.Math.Between(-300, -200); // Más lento hacia arriba
					break;
				case 3: // Aparecer desde la izquierda
					x = 0;
					y = Phaser.Math.Between(0, config.height);
					direccionX = Phaser.Math.Between(200, 300); // Rápido hacia la derecha
					direccionY = Phaser.Math.Between(-50, 50);
					break;
			}

			// Crear enemigo en la posición adecuada
			let enemigo = this.enemigos.create(x, y, 'enemigo');

			// Seleccionar un color de tint aleatorio
			let colorEnemigo = Phaser.Math.RND.pick(ColoresEnemigos);
			enemigo.setTint(colorEnemigo); // Aplicar color aleatorio al enemigo

			enemigo.setCollideWorldBounds(true);
			enemigo.setBounce(1);

			// Establecer la velocidad del enemigo
			enemigo.setVelocity(direccionX, direccionY);

			// Establecer la rotación del avión enemigo según su dirección
			enemigo.setRotation(Phaser.Math.Angle.Between(0, 0, direccionX, direccionY) + Math.PI / 2);

			enemigo.body.setSize(40, 80);
			enemigo.body.customSpeed = Math.sqrt(direccionX * direccionX + direccionY * direccionY); // Guardar la velocidad personalizada en el cuerpo del enemigo
			enemigo.body.customDirection = new Phaser.Math.Vector2(direccionX, direccionY).normalize(); // Guardar la dirección inicial del enemigo

			enemyCount++;
		}
	}
}

function dispararEnemigos() {
	this.enemigos.children.iterate(function (enemigo) {
		let balasEnemiga = this.misilEnemigo.create(enemigo.x, enemigo.y, 'balasEnemiga');
		this.physics.velocityFromRotation(enemigo.rotation - Math.PI / 2, 400, balasEnemiga.body.velocity); // Disparar en la dirección del enemigo
		balasEnemiga.setAngle(enemigo.angle); // Rotar la balas para que apunte en la misma dirección que el enemigo
		balasEnemiga.setScale(0.5); // Escalar la balas del enemigo
	}, this);
}

function maniobrarEnemigos() {
	this.enemigos.children.iterate(function (enemigo) {
		if (!enemigo || !enemigo.active) return; // Verificar si el enemigo existe y está activo

		let maxSpeed = enemigo.body.customSpeed; // Usar la velocidad personalizada como máximo
		let minSpeed = 50;
		let acceleration = 10;
		let angleChange = Phaser.Math.DegToRad(Phaser.Math.Between(-10, 10)); // Cambiar el ángulo ligeramente

		// Obtener la velocidad actual
		let currentSpeed = enemigo.body.velocity ? enemigo.body.velocity.length() : 0; // Verificar si existe la propiedad velocity

		// Asegurar que la velocidad no supere el máximo ni sea menor al mínimo
		let newSpeed = Phaser.Math.Clamp(currentSpeed + Phaser.Math.Between(-acceleration, acceleration), minSpeed, maxSpeed);

		// Obtener la dirección actual
		let currentDirection = enemigo.body.velocity ? enemigo.body.velocity.angle() : 0; // Verificar si existe la propiedad velocity

		// Cambiar la dirección ligeramente
		let newDirection = currentDirection + angleChange;

		// Calcular la nueva velocidad en X e Y
		let newDireccionX = Math.cos(newDirection) * newSpeed;
		let newDireccionY = Math.sin(newDirection) * newSpeed;

		// Aplicar la nueva velocidad gradualmente usando Tween
		this.tweens.add({
			targets: enemigo.body.velocity,
			x: newDireccionX,
			y: newDireccionY,
			ease: 'Power1',
			duration: 1000, // Cambio gradual en un segundo
			onUpdate: () => {
				if (enemigo && enemigo.active) { // Verificar nuevamente si el enemigo sigue activo
					// Actualizar la velocidad del enemigo
					enemigo.setVelocity(enemigo.body.velocity.x, enemigo.body.velocity.y);
				}
			}
		});

		// Asegurar que el enemigo no se quede atascado en los bordes
		if (enemigo && enemigo.active && enemigo.x < 50 && newDireccionX < 0 || enemigo.x > config.width - 50 && newDireccionX > 0) {
			enemigo.setVelocityX(-newDireccionX);
		}
		if (enemigo && enemigo.active && enemigo.y < 50 && newDireccionY < 0 || enemigo.y > config.height - 50 && newDireccionY > 0) {
			enemigo.setVelocityY(-newDireccionY);
		}

		// Actualizar la rotación del avión enemigo para que mire hacia la dirección de movimiento
		enemigo.setRotation(newDirection + Math.PI / 2);
	}, this);
}


function destruirMisiles(misiles) {
	if (misiles) {
		misilesSeguidoresActivas--;
		misiles.destroy();
	}
}

function destruirEnemigo(balas, enemigo) {
	// Incrementar el contador de aviones destruidos
	avionesDestruidos++;

	// Verificar si se han destruido suficientes aviones
	if (avionesDestruidos % 15 === 0) {
		// Detener la generación de enemigos durante 10 segundos
		detenerGeneracion = true;
		mostrarMensajeAnimo(this); // Llamar a la función para mostrar el mensaje de ánimo pasando la escena como argumento
		setTimeout(() => {
			detenerGeneracion = false;
		}, 10000); // 10 segundos
	}
	
	balas.destroy();
	enemigo.destroy();
	enemyCount--; // Disminuir el conteo de enemigos
	score += puntosPorAvionDerribado;
}

function destruirMisilEnemigo(bala, misilEnemigo) {
	misilEnemigo.destroy();
	bala.destroy();
}

// Función para mostrar un mensaje de ánimo aleatorio
function mostrarMensajeAnimo(scene) {
	// Seleccionar un mensaje aleatorio del array
	const mensajeAleatorio = Phaser.Math.RND.pick(mensajesAnimo);

	// Crear un fondo negro detrás del mensaje
	const fondoMensaje = scene.add.rectangle(scene.sys.game.config.width / 2, scene.sys.game.config.height - 50, mensajeAleatorio.length * 20, 40, 0x000000, 0.8).setOrigin(0.5);

	// Crear un texto con el mensaje aleatorio
	const mensajeTexto = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height - 50, mensajeAleatorio, {
		fontFamily: 'Impact',
		fontSize: 24,
		color: '#ffffff'
	}).setOrigin(0.5);

	// Centrar el texto en el fondo negro
	Phaser.Display.Align.In.Center(mensajeTexto, fondoMensaje);

	// Ocultar el mensaje después de un cierto tiempo
	setTimeout(() => {
		mensajeTexto.destroy();
		fondoMensaje.destroy();
	}, 10000); // 10 segundos
}

function impactarJugador(avion, balasEnemiga) {
	if (!enAlturaBaja) {
		balasEnemiga.destroy();
		playerLife--;
		avion.setTint(0xff0000); // Cambiar el color del avión a rojo
		setTimeout(() => {
			avion.clearTint(); // Restaurar el color original del avión después de un momento
		}, 150);
		score -= puntosPorImpacto;
		if (playerLife <= 0) {
			this.physics.pause();
			avion.setActive(false); // Desactivar el sprite del avión
			avion.setVisible(false); // Ocultar el sprite del avión
			avion.body.stop(); // Detener cualquier movimiento del avión

			// Crear texto "GAME OVER" con contorno y sombreado
			this.add.text(config.width / 2, config.height / 2, 'GAME OVER', {
				fontFamily: 'Impact',
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

			this.add.text(config.width / 2, config.height / 2 + 50, 'Puntuación: ' + score, {
				fontFamily: 'Impact',
				fontSize: 32,
				color: '#ffffff'
			}).setOrigin(0.5);

			// Crear botón de reinicio
			let botonReiniciar = this.add.text(config.width / 2, config.height / 2 + 100, 'Volver a jugar', {
				fontFamily: 'Impact',
				fontSize: 32,
				color: '#ffffff',
				backgroundColor: '#000000',
				padding: {
					x: 20,
					y: 10
				},
				borderRadius: 5
			}).setOrigin(0.5).setInteractive();

			botonReiniciar.on('pointerdown', () => {
				this.scene.restart(); // Reiniciar la escena
				score = 0; // Restablecer la puntuación
				playerLife = 3; // Restablecer la vida del jugador
			});
		}
	}
}

 window.addEventListener('resize', resizeGame);

function resizeGame() {
	var canvas = game.canvas;
	var width = window.innerWidth;
	var height = window.innerHeight;
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
	game.scale.resize(width, height);
}
