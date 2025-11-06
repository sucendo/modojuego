// Efectos visuales (explosión, humo, marcas de impacto)
export class Effects {
  constructor(viewer){
    this.viewer = viewer;
    this._systems = []; // partículas/expansiones temporales
    this.prims  = viewer.scene.primitives;
    this.entities = viewer.entities;

    // Textura procedural para partículas (canvas radial)
    this.particleTexture = this.#makeRadialTexture(64);

    // Listas de efectos activos
    this.explosions = [];   // billboards que escalan y desvanecen
    this.particles  = [];   // Cesium.ParticleSystem con TTL
    this.decals     = [];   // “scorch marks” (ellipses) que se difuminan

    // Ajustes por defecto
    this.cfg = {
      explosionLife: 0.6,
      explosionMaxScale: 22,    // px
      smokeLife: 1.8,           // s por sistema
      scorchLife: 18.0,         // s
      scorchRadius: 18.0        // m
    };
  }
  
  // Llamada por frame para “envejecer” partículas/expansiones
  update(dt){
    for (let i = this._systems.length - 1; i >= 0; i--){
      const s = this._systems[i];
      if (!s.tick(dt)) this._systems.splice(i,1);
    }
  }

  // Crear textura radial (blanca -> alpha radial)
  #makeRadialTexture(size=64){
    const cnv = document.createElement('canvas');
    cnv.width = cnv.height = size;
    const ctx = cnv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return cnv;
  }

  /**
   * Explosión en una posición (cartesian3). Añade:
   *  1) flash/billboard expansivo
   *  2) sistema de humo (particle system)
   *  3) marca en el suelo (decal/ellipse) si hay terreno
   */
  explosionAt(positionCart){
    // 1) FLASH (billboard que escala y desvanece)
    const flash = this.entities.add({
      position: positionCart,
      billboard: {
        image: this.particleTexture,
        color: Cesium.Color.fromBytes(255, 200, 80, 255), // ámbar
        scale: 1.0,
        pixelOffset: new Cesium.Cartesian2(0,0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    this.explosions.push({ ent: flash, t: 0, life: this.cfg.explosionLife });

    // 2) HUMO
    this.#spawnSmoke(positionCart);

    // 3) MARCA EN EL SUELO (si hay altura de terreno)
    try {
      const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionCart);
      const terrainH = this.viewer.scene.globe.getHeight(carto);
      if (typeof terrainH === 'number' && Number.isFinite(terrainH)) {
        const onGround = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, terrainH + 0.1);
        const scorch = this.entities.add({
          position: onGround,
          ellipse: {
            semiMinorAxis: this.cfg.scorchRadius,
            semiMajorAxis: this.cfg.scorchRadius * 1.4,
            height: terrainH + 0.05,
            material: new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty((time, result)=>{
                // se desvanece con el tiempo
                return Cesium.Color.fromBytes(40, 35, 30, 220, result);
              }, false)
            ),
            stRotation: Math.random() * Math.PI,
            outline: false
          }
        });
        this.decals.push({ ent: scorch, t: 0, life: this.cfg.scorchLife });
      }
    } catch {}
  }

  #spawnSmoke(positionCart){
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(positionCart);
    const sys = new Cesium.ParticleSystem({
      image: this.particleTexture,
      startScale: 1.5,
      endScale: 8.0,
      particleLife: 1.6,
      speed: 3.5,
      emissionRate: 160,
      lifetime: this.cfg.smokeLife,
      bursts: [
        new Cesium.ParticleBurst({ time: 0.0, minimum: 120, maximum: 160 }),
        new Cesium.ParticleBurst({ time: 0.3, minimum:  60, maximum:  90 })
      ],
      emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(55)),
      modelMatrix
    });
    this.prims.add(sys);
    this.particles.push({ ps: sys, t: 0, life: this.cfg.smokeLife });
  }

  update(dt){
    // FLASH: escala y alpha
    for (let i = this.explosions.length-1; i >= 0; i--){
      const fx = this.explosions[i];
      fx.t += dt;
      const k = Math.min(1, fx.t / fx.life);
      const ent = fx.ent;
      // Ease-out en escala y fade-out en alpha
      const scale = 1 + k * this.cfg.explosionMaxScale;
      const alpha = 1 - k;
      ent.billboard.scale = scale;
      ent.billboard.color = new Cesium.Color(1.0, 0.78, 0.31, alpha);
      if (fx.t >= fx.life){
        this.entities.remove(ent);
        this.explosions.splice(i, 1);
      }
    }

    // HUMO: Cesium elimina el ParticleSystem al quitarlo de primitives
    for (let i = this.particles.length-1; i >= 0; i--){
      const p = this.particles[i];
      p.t += dt;
      if (p.t >= p.life){
        try { this.prims.remove(p.ps); } catch {}
        this.particles.splice(i, 1);
      }
    }

    // SCORCH: atenuación gradual del material (alpha)
    for (let i = this.decals.length-1; i >= 0; i--){
      const d = this.decals[i];
      d.t += dt;
      const k = Math.min(1, d.t / d.life); // 0..1
      const alpha = 1 - k;
      // material definido por CallbackProperty; no necesitamos settear aquí,
      // pero si quisieras variar el color con el tiempo podrías hacerlo.
      if (d.t >= d.life){
        this.entities.remove(d.ent);
        this.decals.splice(i, 1);
      }
    }
  }
}
