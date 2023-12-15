const color = {
    cloakBg:'#110033',
    cloakOl:'#aa00ff',
    bone:'#eeffee',
    floorBg:'#110033',
    floorOl:'#9944ff66',
    brickBg:'#c16c45',
    brickOl:'#c93c20',
    doorBg:'#772200',
    doorOl:'#aa5500',
    jumpBg:'#552233',
    jumpOl:'#ff77ff66',
}

const LOCALSTORAGE_KEY = 'DeathsApprenticeJS13k2022BestTime';


class Game {
    constructor(canvas, leveldata) {
        this.canvas = canvas;
        this.levels = [];
        this.levelPointer = -1;
        this.player = null;
        this.initLevels(leveldata);
        this.musicPlaying = false;

        this.ctx = canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.objs = [];
        this.keys = {
            'KeyA':'l',
            'KeyD':'r',
            'KeyW':'j',
            'ArrowLeft':'l',
            'ArrowRight':'r',
            'ArrowUp':'j',
            'ShiftLeft':'d',
            'ShiftRight':'d'
        };
        this.actions = {
            l:false,
            r:false,
            j:false
        };
        let game = this;
        document.addEventListener('keydown', (ev)=> game.keydown(ev));
        document.addEventListener('keyup', (ev)=> game.keyup(ev));
        this.lastUpdate = Date.now();
        this.startTime = null;
        this.speedRunTime = null;
    }
    initLevels(leveldata) {
        this.levels = leveldata.split('\n#\n');
        this.levelPointer = -1;
    }
    finishedCurrentLevel() {
        if(this.levelPointer == this.levels.length - 2) {
            // finished last level with hourglass, stop timer
            this.speedRunTime = (Date.now() - this.startTime) / 1000.0;
            let currentBest = localStorage.getItem(LOCALSTORAGE_KEY);
            if(!currentBest || currentBest > this.speedRunTime) {
                localStorage.setItem(LOCALSTORAGE_KEY, this.speedRunTime);
            }
        }
        if(this.levelPointer >= this.levels.length - 1) {
            return; // no more levels
        }
        this.player.stopUpdates = true;
        let game = this;
        this.addObj(new LevelBlender({
            target:this.player,
            game:game,
            finishedCallback:(blendObj)=>{
                game.loadNextLevel();
            }
        }));
    }
    loadNextLevel() {
        if(this.levelPointer >= this.levels.length - 1) {
            return; // no more levels
        }
        this.levelPointer++;
        this.loadCurrentLevel();
    }
    loadCurrentLevel() {
        this.objs = [];
        this.player = null;
        let leveldata = this.levels[this.levelPointer];
        leveldata.split("§").forEach(levelObject => {
            let data = levelObject.split("~");
            if(data.length < 2) {
                return;
            }
            let obj = {};
            if(data.length >= 3) {
                obj.pos = new Vec(data[1] * 1, data[2] * 1);
            }
            if(['f','d','j','s'].indexOf(data[0]) > -1) {
                obj.size = new Vec(data[3] * 1, data[4] * 1);
            }
            if(data[0] == "f") {
                game.addObj(new Floor(obj));
            } else if(data[0] == "s") {
                obj.directionUp = data[5] == "1";
                game.addObj(new Spikes(obj));
            } else if(data[0] == "d") {
                obj.lock = data[5];
                game.addObj(new Door(obj));
            } else if(data[0] == "k") {
                obj.unlocking = data[3];
                game.addObj(new Key(obj));
            } else if(data[0] == "j") {
                obj.jumpforce = (data[5] || 1.5) * 1;
                game.addObj(new Jumppad(obj));
            } else if(data[0] == "p") {
                game.player = game.addObj(new Player(obj));
            } else if(data[0] == "h") {
                obj.startTime = data[3] * 1;
                game.addObj(new Hourglass(obj));
            } else if(data[0] == "t") {
                obj.text = data[3];
                if(game.speedRunTime) {
                    obj.text = obj.text.replace("{speedRunTime}", this.getTimeFormated(game.speedRunTime));
                    localStorage.getItem(LOCALSTORAGE_KEY);
                    obj.text = obj.text.replace("{bestTime}", this.getTimeFormated(localStorage.getItem(LOCALSTORAGE_KEY)));
                }
                obj.startTime = data[4] * 1;
                obj.textsize = data[5];
                game.addObj(new Text(obj));
            }
        });
        this.player.stopUpdates = true;
        this.player.stopRendering = true;
        this.addObj(new LevelBlender({
            target:this.player,
            game:game,
            radius:1,
            rate:-game.canvas.width,
            finishedCallback:(blendObj)=>{
                game.removeObj(blendObj);
                game.player.respawn();
            }
        }));
    }
    keydown(ev) {
        if(this.keys[ev.code]) {
            this.actions[this.keys[ev.code]] = true;
        }
        if(ev.code == 'KeyM') {
            if(this.musicPlaying) {
                audio.pause();
                this.musicPlaying = false;
            } else {
                audio.play();
                this.musicPlaying = true;
            }
        }
        if(ev.code == 'KeyO') {
            this.loadNextLevel();
        }
        if(this.levelPointer == 0 && !this.startTime) {
            this.startTime = Date.now();
        }
    }
    keyup(ev) {
        if(this.keys[ev.code]) {
            this.actions[this.keys[ev.code]] = false;
            if(this.keys[ev.code] == "j" && this.player) {
                this.player.jumpReleased = true;
            }
        }
    }
    run() {
        this.lastUpdate = Date.now();
        this.requestFrame();
        audio.play();
        this.musicPlaying = true;
    }
    requestFrame() {
        requestAnimationFrame(() => {this.updateAndRender()});
    }
    updateAndRender() {
        let now = Date.now();
        let delta = (now - this.lastUpdate)/1000;
        this.lastUpdate = now;
        this.objs.forEach(o => o.update(delta));
        this.objs = this.objs.filter(o=>o.ttl > 0);
        this.ctx.fillStyle = '#0e71b4';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.objs.forEach(o => o.render(this.ctx));
        if(!this.speedRunTime) {
            let runTime = (now - (this.startTime ? this.startTime : now)) / 1000.0;
            let elapsedTime = this.getTimeFormated(runTime);
            this.ctx.textAlign = "center";
            this.ctx.font = "24px serif";
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(elapsedTime,750,24);
        }
        this.requestFrame();
    }
    getTimeFormated(runTime) {
        runTime = runTime || 0;
        let minutes = Math.floor(runTime / 60.0);
        let seconds = Math.floor(runTime - minutes * 60.0);
        let tenth = Math.floor((runTime - minutes * 60.0 - seconds) * 10);
        return ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2) + "." + tenth;
    }
    getColliderObjs(collGroup) {
        return this.objs.filter(o=>o.collGroup == collGroup);
    }
    addObj(obj) {
        this.objs.push(obj);
        obj.game = this;
        return obj;
    }
    removeObj(objToRemove) {
        this.objs = this.objs.filter(o => o !== objToRemove);
    }
}
class Vec {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        return new Vec(this.x, this.y);
    }
    multi(multi) {
        return new Vec(this.x * multi, this.y * multi);
    }
    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }
    add(x,y) {
        this.x += x || 0;
        this.y += y || 0;
        return this;
    }
}
class Obj {
    constructor({pos, size, origin, ttl}) {
        this.pos = pos || new Vec(0,0);
        this.size = size || new Vec(0,0);
        this.origin = origin || new Vec(0.5,0.5);;
        this.type = "obj";
        this.collGroup = "";
        this.fillColor = color.floorBg;
        this.strokeColor = color.floorOl;
        this.game = null;
        this.ttl = ttl || Infinity;
    }
    render(ctx) {
        this.renderStart(ctx);
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.strokeColor;
        if(this.fillColor) {
            ctx.fillRect(-this.size.x * this.origin.x, -this.size.y * this.origin.y, this.size.x, this.size.y);
        }
        if(this.strokeColor) {
            ctx.beginPath();
            ctx.rect(-this.size.x * this.origin.x, -this.size.y * this.origin.y, this.size.x, this.size.y);
            ctx.stroke();
        }
        this.renderPostProcess(ctx);
        ctx.restore();
    }
    renderStart(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
    }
    renderPostProcess(ctx) {}
    update(delta) {
        this.ttl -= delta;
    }
}
class Dust extends Obj {
    constructor(obj) {
        let ttl = obj.ttl || 0.5;
        let shrinkrate = obj.size / ttl;
        let dx = obj.dx || 80;
        let dy = obj.dy || 80;
        let dxd = obj.dxd || dx/2;
        let dyd = obj.dyd || dy/2;
        obj.size = new Vec(obj.size, obj.size);
        super(obj);
        this.dPos = new Vec(Math.random() * dx - dxd, Math.random() * dy - dyd);
        this.fillColor = "#aaaaaa";
        this.strokeColor = null;
        this.ttl = ttl;
        this.shrinkrate = shrinkrate;
    }
    update(delta) {
        super.update(delta);
        this.size.x -=  this.shrinkrate * delta;
        this.size.y -=  this.shrinkrate * delta;
        this.pos.add(this.dPos.x * delta, this.dPos.y * delta);
    }
}
class LevelBlender extends Obj {
    constructor({game, rate, radius, target, finishedCallback}) {
        super({});
        this.game = game;
        this.target = target || this.game.player;
        this.rate = rate || game.canvas.width / 2;
        this.radius = radius || game.canvas.width;
        this.finishedCallback = finishedCallback || null;
    }
    update(delta) {
        this.radius -= this.rate * delta;
        if(this.radius < 0.1) {
            this.radius = 0.1;
            if(this.finishedCallback) {
                this.finishedCallback(this);
            }
            this.ttl = -1;
        }
        if(this.radius > this.game.canvas.width) {
            this.radius = this.game.canvas.width;
            if(this.finishedCallback) {
                this.finishedCallback(this);
            }
            this.ttl = -1;
        }
    }
    render(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.rect(this.game.canvas.width, 0, -this.game.canvas.width, this.game.canvas.height);
        ctx.arc(this.target.pos.x, this.target.pos.y, this.radius, 0, 2*Math.PI);
        ctx.fill();
    }

}
class Floor extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.type = "floor";
        this.collGroup = "level";
        this.fillColor = "#8d6b6b";
        this.strokeColor = "#848691";
        this.brickFillColor = "#c16c45";
        this.brickStrokeColor = "#682417";
        this.bricks = [];
        let x = 0;
        while(x < this.size.x) {
            let w = Math.ceil(Math.random() * 15) + 5;
            if(x + w > this.size.x) {
                w = this.size.x - x;
            }
            let h = Math.ceil(Math.random() * 5) + 3;
            let y = Math.floor(Math.random() * 2);
            this.bricks.push({
                x: x,
                y: y,
                w: w,
                h: h
            });
            x += w;
        }
        let y = 0;
        while(y < this.size.y) {
            let h = Math.ceil(Math.random() * 15) + 5;
            if(y + h > this.size.y) {
                h = this.size.y - y;
            }
            let w = Math.ceil(Math.random() * 5) + 3;
            let x = Math.floor(Math.random() * 2);
            this.bricks.push({
                x: x,
                y: y,
                w: w,
                h: h
            });
            y += h;
        }
        y = 0;
        while(y < this.size.y) {
            let h = Math.ceil(Math.random() * 15) + 5;
            if(y + h > this.size.y) {
                h = this.size.y - y;
            }
            let w = Math.ceil(Math.random() * 5) + 3;
            let x = Math.floor(Math.random() * 2);
            this.bricks.push({
                x: this.size.x - x - w,
                y: y,
                w: w,
                h: h
            });
            y += h;
        }
    }
    renderPostProcess(ctx) {
        this.bricks.forEach(b => {
            ctx.fillStyle = this.brickFillColor;
            ctx.strokeStyle = this.brickStrokeColor;
            ctx.fillRect(b.x , b.y, b.w, b.h);
            ctx.beginPath();
            ctx.rect(b.x , b.y, b.w, b.h);
            ctx.stroke();
        });
    }
}

class Spikes extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.directionUp = obj.directionUp !== false;
        this.type = "spikes";
        this.collGroup = "level";
        this.fillColor = "#aaaaaa";
        this.strokeColor = "#dddddd";
    }
    render(ctx) {
        this.renderStart(ctx);
        let y1 = this.size.y;
        let y2 = 0;
        if(this.directionUp) {
            y1 = 0;
            y2 = this.size.y;
        }
        ctx.strokeStyle = this.strokeColor;
        ctx.fillStyle = this.fillColor;
        ctx.beginPath();
        ctx.moveTo(0,y2);
        let steps = Math.ceil(this.size.x / 10);
        let stepsize = this.size.x / steps;
        for(let x = 0; x <= this.size.x - stepsize +0.1; x+=stepsize) {
            ctx.lineTo(x+stepsize/2,y1);
            ctx.lineTo(x+stepsize, y2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class Door extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.type = "door";
        this.collGroup = "level";
        this.fillColor = color.doorBg;
        this.strokeColor = color.doorOl;
        this.lock = obj.lock || 'allLocks';
        this.unlocked = false;
    }
    update(delta) {
        if(this.unlocked && this.size.y > 0) {
            this.size.y -= delta * 40;
            this.pos.y += delta * 40;
        }
    }
}

class Jumppad extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.jumpforce = obj.jumpforce || 3;
        this.type = "jumppad";
        this.collGroup = "level";
        this.fillColor = color.jumpBg;
        this.strokeColor = color.jumpOl;
    }
}

class Key extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0.5, 0.5);
        obj.size = new Vec(20,20);
        super(obj);
        this.unlocking = obj.unlocking || 'allLocks';
        this.type = "key";
        this.collGroup = "keys";
        let defs = [
            ['#ffff88', null, -5,0, -8,3, -8,6, -11,6, -11,3, -14,-1, -14,-3, -11,-5, -8,-5, -5,-3, 8,-3, 8,-2, 7,-2, 7,1, 5,1, 5,-1, -5,-1, 'c'],
            [null, '#000000', -13,-2, -11,-2, -11,1],
            [null, '#000000', -6,-2, -8,-2, -8,1],
        ];
        this.currentPath = createPath(defs);
    }
    render(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        renderPaths(ctx, this.currentPath);
        ctx.restore();
    }
}
class Hourglass extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0.5, 0.5);
        obj.size = new Vec(20,20);
        super(obj);
        this.type = "hourglass";
        this.collGroup = "collect";
        this.fillColor = '#ffffdd';
        this.textFillColor = '#ffffdd';
        this.strokeColor = '#ffff00';
        this.startTime = obj.startTime || Infinity;
        this.time = this.startTime;
		let defs = [
            [null, '#000000', -3,-8, 3,-8],
            [null, '#000000', -3,-8, -4,-6, -7,0],
			[null, '#000000', 3,-8, 4,-6, 7,0],
			['#000000','#000000', -7,0, -5,0, -5,3, -7,0],
			['#000000','#000000',  7,0, 5,0, 5,3, 7,0],
        ];
        /*let defs = [
            [color.cloakBg,color.cloakOl, -5,-10, 0,0, -5,10, 5,10, 0,0, 5,-10, 'c'],
            [color.bone, null, -3,-5, 0,0, 3,-5, 'c'],
            [color.bone, null, -4,9, 0,7, 4,9, 'c'],
            [null, '#aa8822', -7,-10, 7,-10],
            [null, '#aa8822', -7,10, 7,10],
            [null, '#aa8822', -5,-9, -5,9],
            [null, '#aa8822', 5,-9, 5,9],
        ];*/
        this.currentPath = createPath(defs);
    }
    update(delta) {
        if(this.time < -0.9) {
            this.game.player.stopUpdates = true;
            this.game.addObj(new LevelBlender({
                target:this,
                game:game,
                radius:game.canvas.width,
                rate:game.canvas.width/2,
                finishedCallback:(blendObj)=>{
                    game.removeObj(blendObj);
                    this.game.loadCurrentLevel();
                }
            }));
        } else {
            this.time -= delta;
        }
    }
    render(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        renderPaths(ctx, this.currentPath);
        if(this.time < Infinity) {
            ctx.textAlign = "center";
            if(this.time <= 0) {
                ctx.font = "24px serif";
                ctx.fillStyle = 'red';
            } else {
                ctx.font = "12px serif";
                ctx.fillStyle = this.textFillColor;
            }
            ctx.fillText(Math.ceil(this.time), 0, -15);
        }
        ctx.restore();
    }
}
class Text extends Obj {
    constructor(obj) {
        super(obj);
        this.type = "text";
        this.collGroup = "text";
        this.textFillColor = '#000000';
        this.text = obj.text || "";
        this.textsize = obj.textsize || "12";
        this.startTime = obj.startTime || Infinity;
        this.time = this.startTime;
    }
    update(delta) {
        this.time -= delta;
        if(this.time < -0.5) {
            this.game.removeObj(this);
        }
    }
    render(ctx) {
        this.renderStart(ctx);
        ctx.textAlign = "center";
        ctx.font = this.textsize + "px serif";
        ctx.fillStyle = this.textFillColor;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}
let createPath = (defs, flipX) => {
    let fX = flipX ? -1 : 1;
    return defs.map(d=> {
        let p = {
            fill:d[0],
            stroke:d[1],
            path: new Path2D()
        };
        p.path.moveTo(d[2] * fX, d[3]);
        for(let i = 4; i <= d.length -2; i+=2) {
            p.path.lineTo(d[i] * fX, d[i+1]);
        }
        if(d[d.length-1] == 'c') {
            p.path.closePath();
        }
        return p;
    });
}
let renderPaths = (ctx, paths) => {
    paths.forEach(p=> {
        if(p.fill) {
            ctx.fillStyle = p.fill;
            ctx.fill(p.path);
        }
        if(p.stroke) {
            ctx.strokeStyle = p.stroke;
            ctx.stroke(p.path); 
        }   
    });
}
class Player extends Obj {
    constructor(obj) {
        obj.size = new Vec(10,30);
        obj.origin = new Vec(0.5, 1);
        super(obj);
        this.respawnPos = this.pos.clone();
        this.type = "player";
        this.collGroup = "player";
        this.dPos = new Vec(0,0);
        this.speed = 100; // pixel per second
        this.dashFactor = 3;
        this.dashDuration = 0.25;
        this.dashtimer = this.dashDuration;
        this.jumpForce = 200;
        this.jumpReleased = true;
        this.gravity = 500;
        this.maxFallSpeed = 300;
        this.grounded = false;
        this.groundedTo = null;
        this.stopUpdates = false;
        this.stopRendering = false;
        this.walkDustTimout = 0.1;
        this.lastWalkDust = 0;
        let defs = [
			["#73ad0e","#73ad0e", -3,-45, 0,-50, 3,-45, 0,-40], //sim     
			["#e3c38e", null, -2,-25 ,-2,-35, 0,-37, 3,-37, 6,-35, 6,-30, 5,-28], //cabeza
			["#9c9d72","#9c9d72", -3,-1, -3,-15, 4,-15, 3,-1, 'c'], //pantalón
			["#35363a","#35363a", -3,-15, -1,-27, 2,-26, 5,-15, 1,-15, 1,-13, 0,-13, 0,-15, 'c'], //camisa
			["#7d3f28","#7d3f28", -3,0, -3,-1, 5,-1, 5,0, 'c'], //zapato            
            ['#ffffff', null, 3,-33, 5,-33, 5,-30, 3,-30], //ojo
			['black', null, 4,-32, 5,-32, 5,-31, 4,-31], //pupila
            ["#e3c38e", null, -1,-11, -1,-12, 1,-12, 1,-11], //mano
        ];
		/*
		let defs = [
            ["#7d92a9","#7d92a9", -8,0, -3,-15, -2,-27, 5,-20, 5,0, 'c'], //traje
            ["#e3c38e", null, -2,-30, 0,-32, 3,-32, 6,-30, 6,-20, 2,-21, -2,-24], //cabeza
			["#7d92a9", null, -3,-28, -6,-40, -8,-50, -6,-55, 6,-30, 10,-32, 6,-32], //sombrero
			["white", null, -2,-32, -4,-18, -3,-28, 6,-23, 6,1], //barba
            ['#ffffff', null, 3,-28, 5,-28, 5,-26, 3,-26], //ceja
			['black', null, 4,-28, 4,-27, 5,-26, 3,-26], //ojo
            [null, '#c7b081', 5,0, 10,-35], //baston
            ["#e3c38e", null, -1,-7, -1,-9, 1,-9, 1,-7], //mano
			["#e3c38e", null, 6,-17, 7,-17, 7,-16, 6,-16], //mano
        ];
		*/
        this.paths = {
            r: createPath(defs),
            l: createPath(defs, true)
        };
        defs.push([null, color.bone, -8,-7, -20,-7]);
        defs.push([null, color.bone, -8,-14, -25,-14]);
        defs.push([null, color.bone, -6,-20, -22,-20]);
        this.paths.dr = createPath(defs);
        this.paths.dl = createPath(defs, true);
        
        this.currentPath = this.paths.r;
    }
    update(delta) {
        if(this.stopUpdates) {
            return;
        }
        let walking = this.grounded;
        if(game.actions.l) {
            this.dPos.x = -this.speed;
            this.currentPath = this.paths.l;
        } else if(game.actions.r) {
            this.dPos.x = this.speed;
            this.currentPath = this.paths.r;
        } else {
            this.dPos.x *= 0.2;
            walking = false;
            this.lastWalkDust = 0;
        }
        if(walking) {
            this.lastWalkDust -= delta;
            if(this.lastWalkDust < 0) {
                this.createWalkDust();
                this.lastWalkDust = this.walkDustTimout;
            }
        }
 
        if(this.grounded) { 
            if(this.groundedTo && this.groundedTo.type == "jumppad") {
                this.dPos.y = -this.jumpForce * (this.groundedTo.jumpforce);
            } else if(game.actions.j && this.jumpReleased) {
                this.jumpReleased = false;
                this.dPos.y = -this.jumpForce;
                this.dashtimer = this.dashDuration;
                this.createJumpDust();
            } else {
                this.dPos.y = 0;
            }
        } else {
            if(game.actions.j && this.dPos.y <0) {
                this.dPos.y += this.gravity * 0.5 * delta;
            } else {
                this.dPos.y += this.gravity * delta;
            }
            if(game.actions.d && this.dashtimer > 0) {
                this.dashtimer -= delta;
                if(game.actions.l) {
                    this.dPos.x = -this.speed * this.dashFactor;
                    this.currentPath = this.paths.dl;
                }
                if(game.actions.r) {
                    this.dPos.x = this.speed * this.dashFactor;
                    this.currentPath = this.paths.dr;
                }
            }
        }
        if(this.dPos.y > this.maxFallSpeed) {
            this.dPos.y = this.maxFallSpeed;
        }

        this.pos = this.pos.plus(this.dPos.multi(delta));

        // Collisions
        this.grounded = false;
        let br = this.pos.clone().add(6,0);
        let bl = this.pos.clone().add(-6,0);
        let tl = bl.clone().add(0,-29);
        let tr = br.clone().add(0,-29);
        let t = this.pos.clone().add(0,-29);
        let r = this.pos.clone().add(7,-15);
        let l = this.pos.clone().add(-7,-15);

        let deadlyContact = false;
        game.getColliderObjs("level").forEach(o=> {
            let deadlyObject = ['spikes'].indexOf(o.type) >= 0;
            let otl = o.pos.clone().add(
                -o.size.x * o.origin.x,
                -o.size.y * o.origin.y,
            );
            let obr = o.pos.clone().add(
                o.size.x * (1 - o.origin.x),
                o.size.y * (1 - o.origin.y),
            );
            // jump - head
            if(this.dPos.y < 0 && t.y >= otl.y && t.y <= obr.y && t.x >= otl.x && t.x <= obr.x) {
                this.dPos.y = 0;
                this.pos.y = obr.y + 28;
                deadlyContact |= deadlyObject;
            }

            // right
            if(this.dPos.x > 0 && r.y >= otl.y && r.y <= obr.y && r.x >= otl.x && r.x <= obr.x) {
                this.dPos.x = 0;
                this.pos.x = otl.x -8;
                br = this.pos.clone().add(6,0);
                bl = this.pos.clone().add(-6,0);
                deadlyContact |= deadlyObject;
            }

            // left
            if(this.dPos.x < 0 && l.y >= otl.y && l.y <= obr.y && l.x >= otl.x && l.x <= obr.x) {
                this.dPos.x = 0;
                this.pos.x = obr.x +8;
                br = this.pos.clone().add(6,0);
                bl = this.pos.clone().add(-6,0);
                deadlyContact |= deadlyObject;
            }

            // bottom
            if(
                (br.y >= otl.y && br.y <= obr.y && br.x >= otl.x && br.x <= obr.x)
                || (bl.y >= otl.y && bl.y <= obr.y && bl.x >= otl.x && bl.x <= obr.x)
            ) {
                this.grounded = true;
                if(!this.groundedTo || this.groundedTo.type != "jumppad")
                this.groundedTo = o;
                this.pos.y = otl.y;
                deadlyContact |= deadlyObject;
            }
            
        });
        if(!this.grounded) {
            this.groundedTo = null;
        }
        game.getColliderObjs("collect").forEach(o=> {
            if (
                tl.x < o.pos.x + o.size.x * (1-o.origin.x) &&
                tr.x > o.pos.x - o.size.x * (1-o.origin.x) &&
                tl.y < o.pos.y + o.size.y * o.origin.y &&
                bl.y > o.pos.y - o.size.y * o.origin.y
            ) {
                this.game.removeObj(o);
            }
        });
        game.getColliderObjs("keys").forEach(o=> {
            if (
                tl.x < o.pos.x + o.size.x * (1-o.origin.x) &&
                tr.x > o.pos.x - o.size.x * (1-o.origin.x) &&
                tl.y < o.pos.y + o.size.y * o.origin.y &&
                bl.y > o.pos.y - o.size.y * o.origin.y
            ) {
                game.getColliderObjs("level").forEach(d=> {
                    if(d.lock == o.unlocking) {
                        d.unlocked = true;
                    }
                })
                console.log(o.unlocking);
                this.game.removeObj(o);
            }
        });
        if(game.getColliderObjs("collect").length == 0) {
            game.finishedCurrentLevel();
        }
        
        if(this.pos.y > this.game.canvas.height || deadlyContact) {
            this.dPos.x = 0;
            this.dPos.y = 0;
            this.createDeathDust(10);
            this.stopUpdates = true;
            this.stopRendering = true;
            let player = this;
            setTimeout(()=> player.respawn(), 1000);
        }
    }
    respawn() {
        this.stopUpdates = false;
        this.stopRendering = false;
        this.pos = this.respawnPos.clone();
        this.createDeathDust(15);
    }
    createDeathDust(amount) {
        for(let i = 0; i < (amount || 10); i++) {
            let dustPos = new Vec(this.pos.x + Math.random() * 20 - 10, this.pos.y - 14 + Math.random() * 30 - 15);
            this.game.addObj(new Dust({
                pos:dustPos, 
                size:Math.random() * 8 + 5, 
                ttl:Math.random() * 0.8 + 0.5
            }))
        }
    }
    createWalkDust() {
        this.game.addObj(new Dust({
            pos:this.pos.clone(), 
            size:2, 
            ttl:Math.random() * 0.4 + 0.2,
            dx:80, dy:40,
            dyd:40
        }));
    }
    createJumpDust() {
        for(let i = 0; i < 5; i++) {
            this.game.addObj(new Dust({
                pos:this.pos.clone(), 
                size:4, 
                ttl:Math.random() * 0.4 + 0.2,
                dx:80, dy:20,
                dxd:40, dyd:20
            }));
        }
    }
    render(ctx) {
        if(this.stopRendering) {
            return;
        }
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        renderPaths(ctx, this.currentPath);
        ctx.restore();
    }
}

const levelData = `
f~71~103~35~400§f~0~592~695~53§f~758~594~43~6§d~86~503~5~76~allLocks§f~636~128~35~455§f~172~575~24~8§f~187~571~18~12§f~203~565~19~17§f~221~557~18~25§f~252~542~79~39§s~334~570~42~10~1§f~240~477~18~11§f~227~472~22~12§f~212~466~30~13§f~207~460~27~14§f~197~453~28~16§f~244~386~17~12§f~250~381~21~13§f~238~390~20~11§f~258~376~23~15§f~266~370~22~16§f~275~365~24~18§f~377~359~13~222§f~282~360~60~13§f~246~483~19~11§f~254~488~18~10§f~66~581~606~11§f~1413~153~14~139§f~329~359~13~137§f~236~548~17~34§f~173~365~25~103§f~106~364~93~19§f~379~360~257~14§k~56~561~allLocks§p~20~114§t~363~74~JC ADVENTURE~0~50§f~411~266~207~21§f~516~197~98~15§f~562~133~55~15§h~653~112~0
#
p~12~112§h~784~402~0§h~49~473~0§f~-36~135~66~366§f~1~497~236~36§f~89~493~146~9§f~142~488~92~9§f~192~483~43~9§f~232~483~89~50§f~374~481~268~50§f~613~472~30~11§f~627~465~18~11§f~638~458~19~11§f~648~453~20~10§f~658~442~23~12§f~670~436~21~11§f~686~427~17~12§f~702~418~100~113§f~753~0~14~359§d~756~358~5~59~allLocks§k~723~404~allLocks§f~640~468~72~65§f~658~453~60~27§f~682~438~31~22§f~1~529~320~108§f~376~521~423~131§t~343~361~Cuidado con el agujero de la obra~0~12§t~530~382~Antes era Negro~0~12§f~158~34~24~352§f~546~48~21~306§f~176~116~377~16§f~173~211~383~20§f~178~294~374~18§t~538~31~MYCAMP~0~15§t~90~22~Vamos a tomar Café~0~20§f~163~35~404~29§j~383~476~180~5~1.2
#
f~-2~94~450~15§f~568~92~233~16§f~438~105~16~9§f~448~110~15~9§f~455~118~17~6§f~462~120~16~8§f~468~127~17~8§f~475~133~17~9§f~483~141~17~7§f~491~147~18~8§f~500~153~21~10§f~511~160~19~9§f~569~105~15~20§f~520~166~207~11§f~781~164~20~13§f~774~171~13~10§f~768~176~12~10§f~764~181~10~7§f~758~183~10~11§f~754~191~10~7§f~748~195~11~6§f~745~197~7~9§f~737~200~11~9§f~732~206~12~8§f~727~211~10~8§f~724~218~11~6§f~716~220~11~7§f~709~223~11~8§f~701~226~10~8§f~694~232~11~7§f~681~237~17~8§f~677~240~11~9§f~670~246~11~9§f~664~252~11~8§f~597~257~68~8§f~585~259~14~9§f~579~263~10~8§f~571~268~11~8§f~563~275~13~7§f~559~280~11~7§f~553~284~10~8§f~543~290~14~8§f~535~295~14~6§f~530~299~11~10§f~525~307~12~7§f~519~310~10~7§f~512~313~9~9§f~506~318~10~7§f~502~323~10~7§f~498~327~9~6§f~491~329~8~8§f~486~335~11~6§f~476~340~13~7§f~471~342~9~8§f~465~346~9~10§f~459~351~10~11§f~449~354~13~12§f~444~362~12~9§f~437~367~12~8§f~430~371~10~8§f~421~376~11~8§f~415~381~9~8§f~407~386~9~7§f~400~388~10~8§f~331~388~69~9§f~-4~476~203~129§f~196~520~223~86§f~217~515~9~4§f~267~516~11~5§f~320~514~11~4§f~372~515~11~5§f~419~478~381~122§f~539~310~261~169§f~542~297~258~14§f~593~261~206~38§f~732~218~68~45§f~767~187~31~33§f~413~173~107~69§f~332~219~111~79§f~412~225~65~38§f~-3~286~363~26§f~2~105~354~185§f~348~107~88~114§f~425~109~27~71§f~448~116~16~60§f~459~121~9~55§f~463~131~17~45§f~475~137~11~38§f~484~144~11~31§f~495~151~9~25§f~500~156~13~20§f~508~161~12~15§f~498~173~58~35§f~553~171~48~13§f~467~345~130~10§f~412~387~171~8§f~482~352~106~40§f~514~318~52~30§f~571~274~33~28§f~690~239~52~28§f~717~226~26~16§f~744~203~29~20§f~787~173~13~48§f~697~383~72~123§f~631~456~73~58§f~-1~307~81~193§f~444~369~46~20§f~466~353~25~18§f~431~379~14~9§f~499~332~20~14§f~564~288~10~10§f~676~247~22~16§f~709~232~14~10§f~687~233~7~5§s~655~248~8~9~1§s~401~376~9~13~1§s~199~508~15~12~1§s~228~507~36~15~1§s~281~505~36~15~1§s~332~504~38~16~1§s~385~506~32~14~1§t~571~45~<Begoña>~0~20§f~573~54~8~40§t~707~125~Cuidado con las escaleras mecánicas~0~12§t~233~351~Ahora hay que llegar al andén~0~12§p~17~82§h~468~456~0§t~178~418~Mierda! Me he equivocado de andén~0~12§h~130~452~0
#
f~42~93~97~36§f~227~1~24~468§f~67~562~98~37§f~226~560~23~26§f~339~557~100~33§f~502~494~100~25§f~345~419~87~28§f~506~350~75~33§f~387~292~41~33§f~511~236~52~28§f~389~165~42~29§f~511~109~104~24§f~646~95~27~530§f~552~105~95~5§f~573~100~75~5§f~599~95~50~5§f~620~89~86~7§f~723~552~28~64§f~705~543~63~9§p~92~33§h~734~510~0§h~295~502~0§h~522~89~0§t~409~29~Some more todos, young apprentice...~0~18§t~354~48~Go, get 'em all! Quick!~0~12
#
f~687~271~33~115§f~93~271~32~114§f~92~383~628~29§f~92~264~628~7§p~154~301§h~640~354~15§t~253~207~I recently mentioned the word "quick"...~0~18§t~373~225~...some hourglasses have only a few seconds left...~0~14§t~512~240~... so you got to hurry up!~0~12§t~551~440~As soon as one hourglass reaches zero, your lesson will restart.~0~12§t~621~462~An apprenticeship is no piece of cake, after all.~0~12
#
f~289~298~210~131§f~321~494~145~60§f~465~536~211~18§f~102~537~219~17§f~675~104~19~450§f~84~99~610~5§f~82~100~21~456§f~578~246~47~23§f~103~305~42~20§f~120~354~61~20§f~198~467~47~19§f~150~410~64~20§f~184~257~47~20§f~637~307~39~20§f~605~366~45~20§f~570~425~42~23§f~537~475~40~17§p~388~256§h~602~219~22§h~198~228~17§h~129~506~32§h~639~504~6§t~384~57~It's time for a little test, my apprentice!~0~18§t~385~80~You'll have to choose the order in which you should collect the hourglasses.~0~12
#
f~166~329~28~275§f~488~329~30~270§f~90~310~167~19§f~437~308~168~21§p~115~281§h~586~286~0§t~204~77~Sometimes, when it looks too far...~0~18§t~462~90~... a little well timed SHIFT helps.~0~18§t~232~152~Jump while walking, aaaand...~0~12§t~417~166~.. press [SHIFT] for a little extra push.~0~12§f~76~229~14~99
#
h~595~398~0§f~123~429~585~20§p~284~392§j~389~424~44~5~1.7§j~677~424~30~5~2§f~538~301~117~14§h~178~399~0§t~261~83~An obstacle is to big for you to jump over it? ~0~18§t~377~116~When you are lucky, Death left a handy jumppad for you nearby.~0~14§t~467~145~Just walk onto it, and let the thing do its magic... weeee!eh!~0~12§t~310~473~Always remember: when you are stuck, just jump off a cliff. You'll respawn. ;-)~0~12§f~443~300~36~129§f~233~298~41~131
#
d~411~267~5~97~d1§k~471~535~d1§f~71~434~210~15§f~222~427~59~8§f~243~420~60~8§f~261~413~57~8§f~279~408~54~7§f~294~400~56~9§f~313~395~60~9§f~325~387~65~10§f~345~379~63~10§f~363~372~67~9§f~387~362~347~10§f~382~131~42~134§f~377~258~370~11§f~289~122~146~13§f~725~253~29~120§h~690~336~0§f~7~564~522~15§j~15~559~32~5~2§t~164~77~When your path is locked...~0~20§t~462~461~... the indirect way may turns out to be the "KEY" to success.~0~14§p~329~287
#
f~13~18~765~18§f~752~34~26~547§f~228~202~22~172§f~246~359~190~15§f~416~217~20~157§f~523~421~114~17§f~481~375~28~15§f~568~259~25~13§f~608~201~148~17§j~680~569~43~5~1.8§f~13~35~27~541§f~40~208~143~18§f~162~226~18~274§j~40~569~101~5~2.2§f~226~182~124~21§f~334~35~20~147§f~107~112~172~18§f~179~34~18~80§p~148~76§k~230~78~1§d~571~472~5~102~1§f~564~438~21~34§f~242~372~17~70§d~373~373~5~71~2§f~244~440~211~17§k~284~265~3§f~327~203~21~92§j~257~356~152~5~2§h~301~408~0§f~510~35~23~101§f~533~117~144~19§d~661~36~5~81~3§h~563~79~0§k~638~241~2§f~624~314~128~18§h~96~373~0§f~14~573~300~20§f~404~573~374~20§t~83~53~Jump around~0~14§f~538~318~86~14
#
s~224~453~124~45~1§s~410~454~262~81~1§f~212~495~153~30§f~403~528~279~20§f~348~449~62~101§f~673~450~91~104§f~38~447~185~86§f~466~390~36~16§f~555~357~38~19§h~733~426~0§p~64~412§t~234~119~Spikes in Death's domain ?!?!??~0~20§t~325~157~Well, yes. Why not?~0~16§t~394~187~Dont touch them.~0~12
#
s~155~552~244~49~1§s~160~381~250~45~0§f~29~548~127~53§f~510~394~54~55§f~152~361~263~30§f~397~548~94~56§f~248~519~59~17§j~445~543~37~5~2§s~431~176~45~21~1§s~521~176~38~19~1§s~605~173~38~22~1§h~726~165~0§d~364~92~5~104~allLocks§k~588~343~allLocks§j~200~357~31~5~1.7§p~55~517§s~289~209~410~60~0§f~283~193~482~26§f~34~15~342~83§t~186~50~Roses are red, Violets are blue.~0~18§t~221~70~A spike on the head, will also hurt you.~0~15
#
f~0~576~802~77§f~95~569~37~8§f~106~560~36~9§f~115~551~39~9§f~126~540~40~11§f~137~533~38~8§f~147~521~38~12§f~159~511~43~11§f~171~496~51~15§f~319~493~62~112§f~440~492~21~116§f~587~492~25~113§f~605~485~32~13§f~614~476~34~10§f~623~465~37~10§f~633~454~42~11§f~648~442~46~13§f~675~447~63~153§f~768~264~59~338§j~697~440~39~5~1.7§s~170~557~149~19~1§s~381~554~59~22~1§s~461~554~126~23~1§s~612~552~62~25~1§s~737~548~31~29~1§f~-4~263~692~97§s~641~240~47~23~1§f~120~125~694~66§s~522~241~61~22~1§s~195~191~288~17~0§d~633~190~5~74~3§d~676~359~5~84~2§d~120~190~5~74~4§f~-10~358~66~118§f~23~404~472~14§f~146~539~24~40§f~129~558~20~26§d~465~359~5~47~1§k~70~388~2§k~448~477~1§k~786~253~3§k~492~194~4§f~113~2~156~70§f~34~46~77~30§f~40~72~25~145§f~102~54~37~20§f~102~33~19~26§f~61~66~21~21§f~36~71~13~45§f~29~115~20~12§f~30~125~23~88§f~-5~-2~11~266§f~3~-13~280~23§f~193~8~22~44§k~103~21~5§d~257~72~5~55~5§j~12~259~33~5~1.7§h~726~43~0§s~682~99~118~27~1§f~280~2~231~33§f~277~0~134~21§f~406~1~132~46§f~398~-16~127~40§f~518~-3~65~22§f~317~62~64~104§f~42~417~51~20§f~48~435~30~17§f~91~417~51~10§f~489~416~5~6§f~404~416~13~8§f~336~414~18~9§f~286~416~29~7§f~161~416~94~6§f~320~526~30~77§f~432~583~15~25§f~604~582~18~21§f~731~582~19~20§f~785~334~16~75§f~21~318~40~49§f~53~298~265~43§f~307~322~108~37§f~600~287~83~53§f~580~315~47~34§f~485~143~85~35§f~556~135~47~23§f~591~151~30~20§f~717~147~92~25§f~708~156~29~23§f~297~144~41~33§f~361~156~28~17§f~128~146~58~28§f~170~161~45~22§f~203~127~37~37§f~236~135~45~21§f~256~148~46~30§f~456~14~30~17§f~373~10~42~20§f~707~511~28~90§f~344~519~16~30§p~19~551§s~755~191~46~17~0§f~185~180~300~6
#
f~14~570~60~16§f~116~500~70~13§f~357~574~23~11§f~422~538~27~10§f~466~484~38~11§f~521~438~37~10§f~465~388~39~13§f~527~328~44~12§f~473~259~16~10§f~527~197~20~10§f~565~195~42~12§f~615~90~44~11§f~670~559~46~11§f~741~343~47~14§f~709~283~17~10§f~698~47~11~305§f~747~230~39~11§f~147~69~136~10§j~159~495~26~5~1.7§j~571~191~36~5~1.7§f~648~90~12~421§j~696~554~20~5~1.7§j~749~225~35~5~1.7§f~187~251~133~262§p~34~33§h~151~59~0§k~380~232~1§f~401~177~10~310§f~436~212~13~11§s~75~571~278~28~1§s~384~575~284~24~1§s~719~580~80~19~1§f~777~520~15~12§k~778~509~2§d~648~51~5~40~1§f~532~41~177~10§f~533~46~12~55§f~282~92~263~18§f~475~0~24~58§f~134~0~13~79§f~147~0~329~14§f~499~-10~209~14§d~648~4~5~37~2§f~356~108~13~170§s~283~69~90~23~1
#
p~15~343§h~789~49~0§f~1~364~66~23§j~49~359~18~5~1.7§f~67~209~77~178§f~271~470~9~9§j~270~465~11~5~1.7§s~217~480~113~121~1§f~552~75~93~256§f~366~0~91~174§f~366~226~91~375§f~551~0~249~29§k~537~312~2§f~456~265~8~9§f~545~218~8~9§f~455~165~8~8§f~545~112~8~8§d~595~30~5~45~2§d~372~174~5~53~1§f~717~25~25~368§f~745~439~55~162§f~710~210~8~7§f~644~324~9~9§f~644~475~9~10§f~737~517~9~9§f~737~461~8~8§f~741~250~8~8§f~740~176~9~6§f~204~306~13~299§f~330~308~13~293§s~645~292~8~32~1§k~272~375~1§f~456~-6~94~15§s~456~9~94~18~0§s~0~386~144~24~0§k~649~457~3§d~745~381~5~57~4§f~742~368~10~12§f~789~61~11~42§f~789~105~13~336§j~768~433~20~5~2§f~456~385~90~54§f~524~439~22~26§f~532~465~14~32§f~457~439~12~32§f~546~332~97~182§f~542~556~10~44§f~531~562~10~40§f~523~567~8~35§f~513~572~10~31§f~504~576~9~27§f~457~583~49~27§k~466~571~4§d~628~515~5~35~3§f~0~459~142~157§s~0~424~141~35~1§f~552~551~95~60§s~647~566~97~34~1§s~457~342~89~44~1§f~691~323~27~11§s~692~297~26~25~1§f~554~307~87~57§f~605~354~36~49§f~87~198~57~11
#
f~0~202~67~400§f~713~197~90~410§f~107~202~15~7§f~91~202~14~8§f~69~202~20~8§f~654~196~17~6§f~694~197~18~7§f~673~197~19~6§f~247~404~19~196§f~480~404~19~196§f~207~386~104~18§f~446~380~87~24§f~208~327~13~59§f~300~355~11~30§f~222~360~17~25§f~446~243~16~136§f~520~296~13~83§f~463~348~14~31§f~501~344~13~35§f~508~314~12~29§f~253~371~42~14§f~282~356~17~14§p~18~182§h~772~177~0§t~415~197~You trust your powers...~0~25§f~694~205~18~8§f~696~215~16~8§f~678~204~14~9§f~69~212~20~12§f~69~225~13~13§f~91~212~22~8§j~910~736~208~5~5§f~0~-3~65~135§f~61~-4~77~90§f~133~-5~74~60§f~206~-5~81~48§f~273~28~9~30§f~234~31~6~29§f~247~29~5~19§f~204~37~3~20§f~195~37~5~29§f~282~-3~138~32§f~419~-5~8~47§f~426~-3~72~34§f~455~16~6~43§f~483~18~3~25§f~496~0~138~49§f~612~-6~103~77§f~711~-1~92~108§f~536~30~5~34§f~596~42~20~19§f~687~62~29~30§f~659~62~5~29§f~631~59~5~20§f~568~41~5~17§f~516~40~4~16§f~355~2~59~17§f~259~1~15~3§f~274~4~8~3§f~276~12~23~4§f~187~9~35~12§f~119~16~27~14§f~43~48~33~17§f~133~75~5~16§f~165~42~6~20§f~686~78~4~26§f~695~15~25~55§f~601~9~36~21§f~519~10~42~26§f~475~2~40~13§f~755~1~33~39§f~768~23~28~39§f~50~7~28~43§f~128~25~26~38§s~287~29~131~13~0§s~428~31~26~11~0§f~645~196~8~6§f~662~203~14~6§f~705~225~7~14§f~419~42~4~15§s~416~58~10~16~0§j~381~600~56~5~3.2
#
s~-11~566~822~37~1§f~286~469~215~23§j~472~464~28~5~1.7§j~286~464~29~5~1.7§f~628~412~32~22§f~128~412~28~17§j~629~407~29~5~1.7§j~127~407~30~5~1.7§f~356~207~55~43§f~331~159~112~50§f~329~111~18~53§f~382~116~13~46§f~431~110~12~49§f~339~95~97~21§f~361~135~10~11§f~409~139~11~8§t~386~53~That's the end, my apprentice!~0~32§t~384~295~You took {speedRunTime} to complete your training~0~18§t~385~325~(Your best time ever was {bestTime})~0~12§t~390~514~THX for playing! Hope you had fun~0~12§p~386~357§t~385~340~Press F5, if you want to try again...~0~12`;
const game = new Game(document.getElementById('canvas'), levelData.trim());
game.run();
game.loadNextLevel();
