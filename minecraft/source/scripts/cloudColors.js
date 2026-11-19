// Color de las nubes según la hora del reloj del mundo. Los colores se
// interpolan suavemente para que nunca haya saltos al amanecer/anochecer.
// Módulo sin dependencias de Three.js: también sirve para tests unitarios.
const COLOR_STOPS = Object.freeze([
  [0,     0x303a56], // Noche: azul grisáceo
  [4.5,   0x34415c],
  [5.5,   0x816e81], // Primeras luces rosadas
  [6.25,  0xe5a086], // Amanecer
  [7,     0xfbd4a9], // Luz dorada
  [8.25,  0xf5f3ee],
  [11.5,  0xf8fafc], // Día: blanco suave
  [15.75, 0xf8fafc],
  [17,    0xfce5c7], // Tarde cálida
  [18,    0xeeaf90], // Atardecer
  [18.75, 0xad7388], // Últimas luces violetas
  [19.75, 0x525c78],
  [21,    0x303a56],
  [24,    0x303a56]
]);

// Los biomas conservan su carácter. Solo afectan el matiz de las nubes;
// el amanecer/anochecer sigue siendo visible en todos los mundos.
const WORLD_FILTERS = Object.freeze({
  classic: [1, 1, 1],
  ocean:   [0.96, 1, 1.03],
  jungle:  [0.98, 1, 0.97],
  desert:  [1, 0.97, 0.9],
  snow:    [0.97, 1, 1.04],
  lava:    [0.77, 0.72, 0.72]
});

const clampByte = n => Math.max(0, Math.min(255, Math.round(n)));
const smoothStep = t => t * t * (3 - 2 * t);

export function cloudColorAtHour(hour, worldType = 'classic') {
  if (!Number.isFinite(hour)) hour = 12;
  hour = ((hour % 24) + 24) % 24;
  let i = 1;
  while (i < COLOR_STOPS.length - 1 && COLOR_STOPS[i][0] < hour) i++;
  const [startHour, first] = COLOR_STOPS[i - 1];
  const [endHour, second] = COLOR_STOPS[i];
  const amount = smoothStep((hour - startHour) / (endHour - startHour));
  const filter = WORLD_FILTERS[worldType] || WORLD_FILTERS.classic;
  let output = 0;
  for (const shift of [16, 8, 0]) {
    const channel = 2 - shift / 8;
    const a = (first >>> shift) & 255;
    const b = (second >>> shift) & 255;
    output |= clampByte((a + (b - a) * amount) * filter[channel]) << shift;
  }
  return output >>> 0;
}
