import { computeCompassFromForward, wrap180 } from './utils.js';
import { rho0 } from './config.js';

export class HUD {
  constructor() {
    this.els = {
      coords: document.getElementById("coords"),
      alt: document.getElementById("alt"),
      spd: document.getElementById("spd"),
      throttle: document.getElementById("throttle"),
      ab: document.getElementById("ab"),
      vs: document.getElementById("vs"),
      pitch: document.getElementById("pitch"),
      yaw: document.getElementById("yaw"),
      roll: document.getElementById("roll"),
      rollRate: document.getElementById("rollRate"),
      pitchRate: document.getElementById("pitchRate"),
      yawRate: document.getElementById("yawRate"),
      aoa: document.getElementById("aoa"),
      gLoad: document.getElementById("gLoad"),
      compassTrack: document.getElementById('compassTrack'),
      compassBug: document.getElementById('compassBug'),
      hdgFlag: document.getElementById('hdgFlag'),
      hdgBug: document.getElementById('hdgBug'),
            // Canvas
            canvas: document.getElementById('hudCanvas'),
            slipBall: document.getElementById('slipBall'),
            slipDot: document.getElementById('slipBallDot'),
	  
      ctrlDefl: document.getElementById('ctrlDefl'),
      boxAoA: document.getElementById("boxAoA"),
      boxG: document.getElementById("boxG"),
      boxVS: document.getElementById("boxVS"),
      boxSPD: document.getElementById("boxSPD"),
    };

        // Canvas setup
        this.ctx = this.els.canvas.getContext('2d');
        this.ppd = 7.5; // píxeles por grado para ladder (se adapta en resize)
        this.rollRadius = 120; // radio del arco de alabeo
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = this.els.canvas.clientWidth;
            const h = this.els.canvas.clientHeight;
            this.els.canvas.width = Math.floor(w * dpr);
            this.els.canvas.height = Math.floor(h * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Ajustes suaves para móviles
            this.ppd = Math.max(6, Math.min(9, h / 120)); // escala con la altura
            this.rollRadius = Math.max(90, Math.min(160, Math.min(w, h) * 0.18));
        };
        resize();
        window.addEventListener('resize', resize);

	
    this.prevPlaneVelocity = new Cesium.Cartesian3(0, 0, 0);
  }

  setState(el, state) {
    if (!el) return;
    el.classList.remove('ok','warn','alert');
    if (state) el.classList.add(state);
  }

  update(state, aero, sim, controls, deltaTime, gravity) {
    const { carto, hpr, forward, planeVelocity, angularVel, position, speed, verticalSpeed } = state;
    const { throttle, afterburner } = sim; const { hdgHold, hdgBugDeg } = controls;

    // Coordenadas / ángulos
    const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(5);
    const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(5);
    const altVal = carto.height.toFixed(1);
    // Ángulos referenciados a TIERRA (evita offsets del modelo)
    const earthAngles = this.getEarthAngles(state); // { roll, pitch }
    const rollDeg = Cesium.Math.toDegrees(earthAngles.roll).toFixed(1);
        // FPA (γ) desde la VELOCIDAD real: asin(V·Up)
        const enu4 = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        const UP = Cesium.Matrix3.getColumn(Cesium.Matrix4.getMatrix3(enu4, new Cesium.Matrix3()), 2, new Cesium.Cartesian3());
        const Vhat = Cesium.Cartesian3.normalize(planeVelocity, new Cesium.Cartesian3());
        const fpaRad = Math.asin(Cesium.Math.clamp(Cesium.Cartesian3.dot(Vhat, UP), -1, 1));
        const fpaDeg = Cesium.Math.toDegrees(fpaRad).toFixed(1);
        // Rumbo (HDG) 0–360 de la brújula superior
        const hdgDeg = Math.round(this.computeHeadingDeg(position, state.forward, sim.compassOffsetDeg));

    // Tasas
    const rollRateDeg = Cesium.Math.toDegrees(angularVel.x).toFixed(1);
    const pitchRateDeg = Cesium.Math.toDegrees(angularVel.y).toFixed(1);
    const yawRateDeg = Cesium.Math.toDegrees(angularVel.z).toFixed(1);

    // G-load
    const accel = Cesium.Cartesian3.subtract(planeVelocity, this.prevPlaneVelocity, new Cesium.Cartesian3());
    Cesium.Cartesian3.divideByScalar(accel, Math.max(deltaTime, 1e-3), accel);
    const gravVec = new Cesium.Cartesian3(0, 0, -gravity);
    const totalAccel = Cesium.Cartesian3.add(accel, gravVec, new Cesium.Cartesian3());
    const gLoad = (Cesium.Cartesian3.magnitude(totalAccel) / gravity).toFixed(2);
    this.prevPlaneVelocity = Cesium.Cartesian3.clone(planeVelocity);

    // AoA
    /*const aoaDeg = Cesium.Math.toDegrees(aero.aoa).toFixed(1);*/
    // AoA: en modo simple 'aero' es null → usa 0.0
    const aoaDeg = (aero && Number.isFinite(aero.aoa))
      ? Cesium.Math.toDegrees(aero.aoa).toFixed(1)
      : '0.0';

    // DOM
    this.els.coords.textContent = `${lat}, ${lon}`;
    this.els.alt.textContent = altVal;
    // IAS: sqrt(2*qd/rho0). Si qd no está listo, fallback a TAS
    /*const ias_mps  = aero && aero.qd > 0 ? Math.sqrt((2 * aero.qd) / rho0) : 0;*/
    // IAS: sqrt(2*qd/rho0). En modo simple aero=null → fallback a TAS
    const ias_mps  = (aero && aero.qd > 0) ? Math.sqrt((2 * aero.qd) / rho0) : 0;

    const ias_kmh  = ias_mps * 3.6;
    const spdShown = Number.isFinite(ias_kmh) && ias_kmh > 0 ? ias_kmh : (speed * 3.6);
    this.els.spd.textContent = spdShown.toFixed(0);
    // Etiqueta “IAS” en el HUD si activas esto.
    this.els.throttle.textContent = (throttle * 100).toFixed(0);
    this.els.ab.textContent = afterburner ? "ON" : "OFF";
    this.els.vs.textContent = verticalSpeed.toFixed(1);
    // BANK / FPA / HDG
    this.els.roll.textContent  = rollDeg;                 // BANK
    this.els.pitch.textContent = fpaDeg;                  // FPA
    this.els.yaw.textContent   = String(hdgDeg).padStart(3,'0'); // HDG
    this.els.rollRate.textContent = rollRateDeg;
    this.els.pitchRate.textContent = pitchRateDeg;
    this.els.yawRate.textContent = yawRateDeg;
    this.els.aoa.textContent = aoaDeg;
    this.els.gLoad.textContent = gLoad;

    // Compass
    this.updateCompass(position, forward, hdgHold, hdgBugDeg, sim.compassOffsetDeg);
	
    // Dibujo canvas (horizonte, pitch ladder, roll arc, FPM) con ángulos tierra
    this.drawPrimaryHUD(state, aero, earthAngles);

       // Slip/skid ball (bola centrada si coordinado)
        this.updateSlipBall(state, aero, deltaTime);

    // Estados visuales
    const aoaVal = Math.abs(parseFloat(aoaDeg));
    const gVal = Math.abs(parseFloat(gLoad));
    const vsVal = parseFloat(verticalSpeed);
    const spdVal = parseFloat(spdShown);
    this.setState(this.els.boxAoA, aoaVal < 10 ? 'ok' : aoaVal < 14 ? 'warn' : 'alert');
    this.setState(this.els.boxG, gVal < 3.5 ? 'ok' : gVal < 5.0 ? 'warn' : 'alert');
    this.setState(this.els.boxVS, Math.abs(vsVal) < 5 ? 'ok' : Math.abs(vsVal) < 12 ? 'warn' : 'alert');
    this.setState(this.els.boxSPD, spdVal > 220 ? (spdVal < 1700 ? 'ok' : 'warn') : 'warn');

    // Deflexiones actuales (deg) para depuración
    if (this.els.ctrlDefl && typeof sim.defl === 'object') {
      const { daDeg=0,deDeg=0,drDeg=0 } = sim.defl;
      this.els.ctrlDefl.textContent = `${daDeg.toFixed(1)} / ${deDeg.toFixed(1)} / ${drDeg.toFixed(1)}`;
    }
  }
  
    computeHeadingDeg(position, forward, offsetDeg=0){
        // mismo cálculo que la cinta de rumbo para mantener coherencia
        const enu4 = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        const enu  = Cesium.Matrix4.getMatrix3(enu4, new Cesium.Matrix3());
        const EAST = Cesium.Matrix3.getColumn(enu, 0, new Cesium.Cartesian3());
        const NORTH= Cesium.Matrix3.getColumn(enu, 1, new Cesium.Cartesian3());
        const x = Cesium.Cartesian3.dot(forward, EAST);
        const y = Cesium.Cartesian3.dot(forward, NORTH);
        const hdg = (Cesium.Math.toDegrees(Math.atan2(x,y)) + offsetDeg + 360) % 360;
        return hdg;
    }
  
    // ============ Dibujo principal en canvas ============
    drawPrimaryHUD(state, aero, earth){
        const ctx = this.ctx;
        const w = this.els.canvas.clientWidth;
        const h = this.els.canvas.clientHeight;
        const cx = w/2, cy = h/2;
        ctx.clearRect(0,0,w,h);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';

        // 1) Arco de alabeo (roll scale) con marcas en 0, 10, 20, 30, 45
        this.drawRollArc(ctx, cx, cy, earth.roll);

        // 2) Horizonte y pitch-ladder (marcas cada 5°, etiquetas cada 10°)
        this.drawPitchLadder(ctx, cx, cy, earth.pitch, earth.roll);

        // 3) Flight Path Marker (FPM): proyecta ángulo de trayectoria
        this.drawFPM(ctx, cx, cy, state);
    }

    drawRollArc(ctx, cx, cy, roll){
        const R = this.rollRadius;
        const topY = cy - R - 24;
        // Arco
        ctx.beginPath();
        ctx.arc(cx, topY, R, Math.PI*0.1, Math.PI*0.9, false);
        ctx.stroke();
        // Marcas
        const marks = [0,10,20,30,45];
        marks.forEach(deg=>{
            const rad = Cesium.Math.toRadians(deg);
            [ +rad, -rad ].forEach(sgn=>{
                const a = Math.PI*0.5 + sgn;
                const x1 = cx + Math.cos(a)*(R-6);
                const y1 = topY + Math.sin(a)*(R-6);
                const x2 = cx + Math.cos(a)*(R+6);
                const y2 = topY + Math.sin(a)*(R+6);
                ctx.beginPath();
                ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
            });
        });
        // Índice de alabeo actual (triangulito)
        const a = Math.PI*0.5 + roll;
        const x = cx + Math.cos(a)*R;
        const y = topY + Math.sin(a)*R;
        ctx.beginPath();
        ctx.moveTo(x, y-6); ctx.lineTo(x-6, y+6); ctx.lineTo(x+6, y+6); ctx.closePath(); ctx.fill();
    }

    drawPitchLadder(ctx, cx, cy, pitch, roll){
        const ppd = this.ppd; // píxeles por grado
	const baseY = cy + Cesium.Math.toDegrees(pitch) * ppd; // pitch respecto a TIERRA
        ctx.save();
        // Ladder/horizonte REFERENCIADOS A TIERRA:
        // deben inclinarse con el MISMO signo que el bank del avión.
        ctx.translate(cx, cy);
        ctx.rotate(roll);
        ctx.translate(-cx, -cy);

        // rango visible de líneas
        const maxLines = Math.ceil((cy/ppd)/5) + 2; // cada 5°
        for (let k=-maxLines; k<=maxLines; k++){
            const deg = k*5;
            const y = baseY - deg*ppd;
            if (y < 40 || y > (cy*2 - 40)) continue;
            const is10 = (deg % 10 === 0);
            const len = is10 ? 90 : 45;
            // Línea
            ctx.beginPath();
            ctx.moveTo(cx - len, y);
            ctx.lineTo(cx + len, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.stroke();
            // Etiqueta cada 10°
            if (is10 && deg !== 0){
                ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto';
                ctx.fillStyle = '#fff';
                const txt = String(deg > 0 ? deg : -deg);
                ctx.fillText(txt, cx - len - 22, y + 4);
                ctx.fillText(txt, cx + len + 8,  y + 4);
            }
        }

        // Línea del horizonte (grado 0) un pelín más gruesa
        const y0 = baseY;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 110, y0);
        ctx.lineTo(cx + 110, y0);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.restore();
    }
	
    // Obtiene roll/pitch referenciados a TIERRA usando la normal geodésica local
    getEarthAngles(state){
        // Vectores cuerpo en mundo
        const fwd = state.forward;
        const right = state.right;
        const up = state.up;
        // Normal geodésica (UP local de la Tierra)
        const U = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(state.position, new Cesium.Cartesian3());
        // Roll “earth-referenced”: inclinación de alas respecto a vertical local
        const roll = Math.atan2(
            Cesium.Cartesian3.dot(right, U),  // lateral contra vertical
            Cesium.Cartesian3.dot(up, U)      // “cuánto mira arriba” el eje Z cuerpo
        );
        // Pitch “earth-referenced”: nariz vs horizonte (vertical local)
        const dotFU = Cesium.Math.clamp(Cesium.Cartesian3.dot(fwd, U), -1, 1);
        const pitch = Math.asin(dotFU);
        return { roll, pitch };
    }

    drawFPM(ctx, cx, cy, state){
        // Ángulos de trayectoria desde la velocidad (no desde el morro)
        const V = Cesium.Cartesian3.magnitude(state.planeVelocity);
        if (V < 1) return;
        const flightDir = Cesium.Cartesian3.normalize(state.planeVelocity, new Cesium.Cartesian3());
        // ENU local
        const enu4 = Cesium.Transforms.eastNorthUpToFixedFrame(state.position);
        const enu = Cesium.Matrix4.getMatrix3(enu4, new Cesium.Matrix3());
        const EAST  = Cesium.Matrix3.getColumn(enu, 0, new Cesium.Cartesian3());
        const NORTH = Cesium.Matrix3.getColumn(enu, 1, new Cesium.Cartesian3());
        const UP    = Cesium.Matrix3.getColumn(enu, 2, new Cesium.Cartesian3());
        const fwd   = state.forward;

        // Gamma (vertical): asin(dir·UP) ; Beta (lateral): desviación lateral en grados aprox
        const sinG = Cesium.Cartesian3.dot(flightDir, UP); // ~sin(gamma)
        const gamma = Math.asin(Cesium.Math.clamp(sinG, -1, 1)); // rad

        // Proyección horizontal para lateral drift
        const horizDir = Cesium.Cartesian3.normalize(
            new Cesium.Cartesian3(
                Cesium.Cartesian3.dot(flightDir, EAST),
                Cesium.Cartesian3.dot(flightDir, NORTH),
                0
            ), new Cesium.Cartesian3()
        );
        const bodyRight = (() => {
            const rotMatrix = Cesium.Matrix3.fromQuaternion(state.rotMatrix ? state.rotMatrix : Cesium.Quaternion.IDENTITY);
            // cuando computeFrameState ya da right:
            return state.right || Cesium.Matrix3.multiplyByVector(rotMatrix, Cesium.Cartesian3.UNIT_Y, new Cesium.Cartesian3());
        })();
        // Lateral “beta” aproximada: signo por right·horizDir frente a morro
        const lateral = Cesium.Cartesian3.dot(horizDir, bodyRight); // [-1..1] aprox

        const ppd = this.ppd;
        const x = cx + Cesium.Math.clamp(lateral, -0.12, 0.12) * (cx*1.6); // limita 12% para no salirse
        const y = cy - Cesium.Math.toDegrees(gamma) * ppd;

        // Dibujo del FPM (“círculo con alas”)
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-16,0); ctx.lineTo(-4,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 16,0); ctx.lineTo( 4,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 4); ctx.stroke();
        ctx.restore();
    }

    updateSlipBall(state, aero, dt){
        // “Bola” basada en aceleración lateral (muy simple): usa yaw-rate y lateral drift
        const yawRate = state.angularVel.z; // rad/s
        const slip = Cesium.Math.clamp(yawRate * 1.8, -0.8, 0.8); // ganancia suave
        const tray = this.els.slipBall.getBoundingClientRect();
        const dot = this.els.slipDot;
        const half = (tray.width - dot.offsetWidth) / 2;
        dot.style.transform = `translateX(${(slip * half).toFixed(1)}px)`;
    }


  updateCompass(position, forward, hdgHold, hdgBugDeg, compassOffsetDeg) {
    const track = this.els.compassTrack; const bugEl = this.els.compassBug; const flag = this.els.hdgFlag; const bugTxt = this.els.hdgBug;

    if (!track.dataset.built) {
      track.innerHTML = "";
      const pxPerDeg = 4;
      for (let d = -180; d <= 180; d += 10) {
        const x = d * pxPerDeg;
        const t = document.createElement('div'); t.className = 'tick ' + (d % 30 === 0 ? 't30' : 't10'); t.style.left = `calc(50% + ${x}px)`; track.appendChild(t);
        if (d % 30 === 0) {
          const lab = document.createElement('div'); lab.className = 'tick-label'; lab.style.left = `calc(50% + ${x}px)`;
          const h = (d + 360) % 360; lab.textContent = (h===0?'N':h===90?'E':h===180?'S':h===270?'W':String(h).padStart(3,'0'));
          track.appendChild(lab);
        }
      }
      track.dataset.built = '1';
    }

    const hdgNow = computeCompassFromForward(position, forward, compassOffsetDeg); // 0–360
    const pxPerDeg = 4;
    const dx = -(hdgNow % 360) * pxPerDeg + (track.clientWidth / 2);
    track.style.transform = `translateX(${dx}px)`;

    const bugDx = (wrap180(hdgBugDeg - hdgNow)) * pxPerDeg + (track.clientWidth / 2);
    bugEl.style.left = `${bugDx - 8}px`;

    flag.textContent = hdgHold ? 'ON' : 'OFF';
    bugTxt.textContent = ('000' + Math.round(hdgBugDeg)).slice(-3);
  }
}


