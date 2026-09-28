HEXATEGOS 0.34.2 · STABILITY UPDATE

Base: HEXATEGOS 0.34.1 sobre Stable Rebuild 8.

Cambios principales:
- Partidas de 16 / 25 / 35 / 50 naciones sobre capacidad fija de 50 plazas.
- Compatibilidad con partidas antiguas de 16 naciones.
- Migración de matrices diplomáticas antiguas 16x16 a 50x50.
- Red diplomática escalable según frontera, región, distancia, puertos y relaciones existentes.
- Generación reforzada: una partida solo se acepta si crea exactamente el número de naciones solicitado.
- Recuperación determinista de capitales con relajación progresiva de distancia.
- Auditoría de capitales, propietarios inactivos y capacidad diplomática.
- Métricas específicas para partidas de 50 naciones.
- Smoke test automático para escala y compatibilidad de guardados.
- Sin MutationObserver ni nuevos temporizadores periódicos.

Diagnóstico en consola:
- HexategosNationScale0341.validate()
- HexategosDiplomacyNetwork3301.stats()
- HexategosStability0342.stats()
- HexategosStability0342.validate(true)
- HexategosStability0342.smoke()

Rama estable de recuperación:
- hexategos-stable-0.33-r8
