// Effects.js — Efectos visuales (explosión, flash con brillo por distancia, humo, marca y fuego GLB)
export class Effects {
  /**
   * @param {Cesium.Viewer} viewer
   * @param {Object} [opts]
   * @param {number} [opts.maxConcurrent=64]   Máximo de sistemas simultáneos (autolimpieza).
   */
  constructor(viewer, opts={}) {
    this.viewer = viewer;
    this.entities = viewer.entities;
    this.prims = viewer.scene.primitives;
    this.maxConcurrent = opts.maxConcurrent ?? 64;

    // Listas de efectos activos
    this._flashes = [];   // {ent, t, life, size0, size1, colorBase, sourcePos}
    this._smokes  = [];   // {ents:[], t, life, rise, drift, baseAlpha}
    this._decals  = [];   // {ent, t, life}
    this._fires   = [];   // {ent, t, life, scale0, scale1, baseAlpha}

    // Textura procedural (luminancia radial) para el flash/humo
    this._tex = this.#makeRadialCanvas(128);

    // Reutilizar objetos temporales
    this._scratch = {
      carto: new Cesium.Cartographic(),
      cart : new Cesium.Cartesian3()
    };
  }

  // ===================== API PÚBLICA =====================

  /**
   * Crea una explosión con:
   *  - Flash (billboard grande que escala y desvanece, brillo por distancia a sourcePos)
   *  - Humo (billboards pequeños que suben y se expanden)
   *  - Marca de quemado (ellipse) que se difumina
   *  - Modelo de incendio (incendio.glb) SOLO si building=true (impacto en edificio)
   *
   * @param {Cesium.Cartesian3} positionCart
   * @param {Object} [opt]
   * @param {Cesium.Cartesian3} [opt.sourcePos]     // p.ej. posición del avión para atenuación del flash
   * @param {boolean} [opt.persistentSmoke=false]   // humo largo (incendio en edificio)
   * @param {boolean} [opt.building=false]          // si el impacto es en edificio => fuego GLB en la POSICIÓN EXACTA
   */
  explosionAt(positionCart, opt={}) {
    const { sourcePos=null, persistentSmoke=false, building=false } = opt;

    // 1) FLASH
    const lifeFlash = 0.85;       // s
    const size0 = 6.0;            // m
    const size1 = persistentSmoke ? 90.0 : 60.0; // m
    const base = new Cesium.Color(1.0, 0.85, 0.55, 1.0);

    const flashEnt = this.entities.add({
      position: Cesium.Cartesian3.clone(positionCart),
      billboard: {
        image: this._tex,
        color: base,
        width: new Cesium.CallbackProperty(() => 64, false),
        height: new Cesium.CallbackProperty(() => 64, false),
        alignedAxis: Cesium.Cartesian3.UNIT_Z,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    this._flashes.push({ ent: flashEnt, t:0, life: lifeFlash, size0, size1, colorBase: base, sourcePos });

    // 2) HUMO
    const smokeLife = persistentSmoke ? 16 : 6;  // s
    const count     = persistentSmoke ? 36 : 16;
    const rise      = persistentSmoke ? 2.2 : 1.4; // m/s
    const drift     = persistentSmoke ? 0.9 : 0.5;

    const smoke = {
      ents: [],
      center: Cesium.Cartesian3.clone(positionCart),
      t: 0, life: smokeLife,
      rise, drift,
      baseAlpha: persistentSmoke ? 0.65 : 0.45
    };

    for (let i=0;i<count;i++){
      const randR = 1.0 + 3.0*Math.random();
      const theta = Math.random()*Math.PI*2;
      const off = new Cesium.Cartesian3(randR*Math.cos(theta), randR*Math.sin(theta), 0.5+Math.random()*2.0);
      const pos  = Cesium.Cartesian3.add(positionCart, off, new Cesium.Cartesian3());
      const startSize = 2.0 + Math.random()*4.0;
      const endSize   = startSize + (persistentSmoke ? 22.0 : 12.0);

      const c = new Cesium.Color(0.25,0.25,0.26, smoke.baseAlpha*(0.7+0.3*Math.random()));

      const ent = this.entities.add({
        position: pos,
        billboard:{
          image: this._tex,
          color: new Cesium.Color(c.red, c.green, c.blue, c.alpha),
          width:  new Cesium.CallbackProperty(()=> startSize*8, false),
          height: new Cesium.CallbackProperty(()=> startSize*8, false),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      ent.__smoke = {
        size0: startSize, size1: endSize,
        drift: new Cesium.Cartesian3(
          (Math.random()-0.5)*this._clamp(drift,0,1.5),
          (Math.random()-0.5)*this._clamp(drift,0,1.5),
          this._clamp(rise*0.5,0,4)
        ),
        color0: c
      };
      smoke.ents.push(ent);
    }
    this._smokes.push(smoke);

    // 3) DECAL (marca de quemado) — SOLO tiene sentido si hay suelo debajo
    const carto = Cesium.Cartographic.fromCartesian(positionCart, Cesium.Ellipsoid.WGS84, this._scratch.carto);
    const groundH = this.viewer.scene.globe.getHeight(carto);
    if (Number.isFinite(groundH)){
      const posOnGround = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, groundH+0.05);
      const radX = persistentSmoke ? 14 : 8;
      const radY = persistentSmoke ? 10 : 6;
      const ent = this.entities.add({
        position: posOnGround,
        ellipse : {
          semiMinorAxis: radY,
          semiMajorAxis: radX,
          height: groundH+0.02,
          material: new Cesium.Color(0.05,0.05,0.05, 0.85),
          stRotation: Math.random()*Math.PI
        }
      });
      this._decals.push({ ent, t:0, life: persistentSmoke ? 22 : 12 });
    }

    // 4) MODELO INCENDIO (GLB) — SOLO si fue un edificio (building = true)
    if (building) {
      try {
        // ¡SIN CLAMP! Queremos EXACTAMENTE la posición del impacto en fachada/volumen:
        const fireEnt = this.entities.add({
          position: Cesium.Cartesian3.clone(positionCart),
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            positionCart,
            new Cesium.HeadingPitchRoll(0, 0, 0)
          ),
          model: {
            uri: 'models/simulador/incendio.glb',
            minimumPixelSize: 32,
            scale: 1.0,
            runAnimations: true,
            color: new Cesium.Color(1,1,1,0.95)
          }
        });

        const life = 8 + Math.random()*4; // 8–12 s
        this._fires.push({
          ent: fireEnt,
          t: 0,
          life,
          scale0: 0.9,
          scale1: 1.6,
          baseAlpha: 0.95
        });

      } catch(e) {
        // Fallback si fallase el GLB — usar la POSICIÓN exacta también
        const bb = this.entities.add({
          position: Cesium.Cartesian3.clone(positionCart),
          billboard: {
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="orange"/></svg>',
            width: 72, height: 72,
            color: new Cesium.Color(1,0.7,0.2,0.9),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        this._smokes.push({
          ents: [bb], t:0, life:3.5,
          baseAlpha: 0.9, rise: 0.6, drift: 0.4
        });
      }
    }

    // Limitar memoria
    this.#trimQueues();
  }

  /**
   * Llamar en cada frame.
   * @param {number} dt     deltaTime en segundos
   * @param {Cesium.Cartesian3} [sourcePos]  para atenuar brillo del flash por distancia (p.ej. avión) si no se pasó en cada flash
   */
  update(dt, sourcePos=null){
    // FLASHES (brillo por distancia a sourcePos)
    for (let i=this._flashes.length-1; i>=0; i--){
      const f = this._flashes[i];
      f.t += dt;
      const k = f.t / f.life; // 0..1

      const size = Cesium.Math.lerp(f.size0, f.size1, Math.sqrt(this._clamp(k,0,1)));
      const ent = f.ent;

      // tamaño en px para mantener presencia
      ent.billboard.width  = size*10;
      ent.billboard.height = size*10;

      // Atenuación por distancia (1 / (1 + (d/R)^2))
      const now = Cesium.JulianDate.now();
      const src = f.sourcePos ?? sourcePos ?? this.viewer.scene.camera.positionWC;
      const dist = Cesium.Cartesian3.distance(src, ent.position.getValue(now));
      const R = 350;
      const att = 1.0 / (1.0 + (dist*dist)/(R*R)); // 0..1

      // Perfil temporal del flash: pico rápido y decaimiento
      const temporal = Math.sin(Math.PI*Math.min(1,k)); // 0..1..0
      const alpha = att * temporal;

      // Color seguro (sin usar .clone() en propiedades que no sean Cesium.Color)
      const base = (f.colorBase instanceof Cesium.Color)
        ? f.colorBase
        : new Cesium.Color(1.0,0.85,0.55,1);
      const c = new Cesium.Color(base.red, base.green, base.blue, alpha);
      ent.billboard.color = c;

      if (k>=1){
        this.entities.remove(ent);
        this._flashes.splice(i,1);
      }
    }

    // SMOKES
    for (let i=this._smokes.length-1; i>=0; i--){
      const s = this._smokes[i];
      s.t += dt;
      const k = this._clamp(s.t / s.life, 0, 1);

      const now = Cesium.JulianDate.now();
      for (const ent of s.ents){
        const p = ent.position.getValue(now);
        const v = ent.__smoke?.drift ?? new Cesium.Cartesian3(0,0,0.6);
        // subir y derivar
        p.x += v.x * dt;
        p.y += v.y * dt;
        p.z += v.z * dt;
        ent.position = p;

        // expandir y atenuar
        const sz = Cesium.Math.lerp(ent.__smoke?.size0 ?? 2, ent.__smoke?.size1 ?? 12, Math.sqrt(k));
        ent.billboard.width  = sz * 12;
        ent.billboard.height = sz * 12;

        // color seguro
        const alpha0 = ent.__smoke?.color0?.alpha ?? s.baseAlpha;
        const col = new Cesium.Color(0.24, 0.24, 0.24, (1 - k) * alpha0);
        ent.billboard.color = col;
      }

      if (k>=1){
        for (const ent of s.ents) this.entities.remove(ent);
        this._smokes.splice(i,1);
      }
    }

    // DECALS
    for (let i=this._decals.length-1;i>=0;i--){
      const d = this._decals[i];
      d.t += dt;
      const k = this._clamp(d.t/d.life, 0, 1);
      const c = new Cesium.Color(0.05,0.05,0.05, 0.85 * (1 - k));
      d.ent.ellipse.material = c;
      if (k>=1){
        this.entities.remove(d.ent);
        this._decals.splice(i,1);
      }
    }

    // FIRES (modelo GLB)
    const camPos = this.viewer.scene.camera.positionWC;
    for (let i=this._fires.length-1; i>=0; i--){
      const f = this._fires[i];
      f.t += dt;
      const k = this._clamp(f.t / f.life, 0, 1);

      // Suavizado: arranque rápido, cola más lenta
      const ease = Math.sqrt(1 - (1-k)*(1-k));

      // Escala de 0.9 a 1.6 (ajustable)
      const sc = Cesium.Math.lerp(f.scale0, f.scale1, ease);
      if (f.ent.model && typeof f.ent.model.scale !== 'undefined'){
        f.ent.model.scale = sc;
      }

      // Desvanecer alpha en la parte final
      const fade = (k < 0.6) ? 1.0 : this._clamp(1 - (k-0.6)/0.4, 0, 1);
      let base = f.baseAlpha * fade;

      // Atenuación por distancia a cámara (suave)
      const now = Cesium.JulianDate.now();
      const p = f.ent.position.getValue(now);
      const d = Cesium.Cartesian3.distance(p, camPos);
      const R = 500; // radio de “pleno brillo”
      const falloff = 1 / (1 + (d/R)*(d/R));
      base *= (0.6 + 0.4*falloff);

      // Asignar color con alpha actualizado
      if (f.ent.model){
        f.ent.model.color = new Cesium.Color(1,1,1, base);
      }

      // Fin de vida
      if (k >= 1){
        this.entities.remove(f.ent);
        this._fires.splice(i,1);
      }
    }

    // Memoria bajo control
    this.#trimQueues();
  }

  // ===================== Helpers =====================

  #makeRadialCanvas(N=128){
    const cnv = document.createElement('canvas');
    cnv.width = cnv.height = N;
    const ctx = cnv.getContext('2d');
    const g = ctx.createRadialGradient(N/2,N/2,1, N/2,N/2,N/2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.15, 'rgba(255,240,200,0.75)');
    g.addColorStop(0.5, 'rgba(180,120,30,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,N,N);
    return cnv;
  }

  #trimQueues(){
    const drop = (arr, remover) => {
      while (arr.length > this.maxConcurrent){
        const x = arr.shift();
        remover(x);
      }
    };
    drop(this._flashes, (f)=> this.entities.remove(f.ent));
    drop(this._smokes,  (s)=> s.ents.forEach(e=>this.entities.remove(e)));
    drop(this._decals,  (d)=> this.entities.remove(d.ent));
    drop(this._fires,   (f)=> this.entities.remove(f.ent));
  }

  _clamp(v,a,b){ return Math.min(b, Math.max(a,v)); }
}

