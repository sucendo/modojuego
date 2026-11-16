#!/usr/bin/env node
// Preparación de los escudos para jugar sin conexión.
// Ejecutar desde el repositorio: node pcfutbol/scripts/downloadCoats.mjs
// Las URLs se utilizan exclusivamente durante esta descarga, nunca en el juego.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { COMPETITIONS_2026_27 } from '../js/catalog_2026_27.js';
import {
  GOOGLE_SPORTS_COATS, OTHER_REMOTE_COATS, LOCAL_COAT_ADDITIONS
} from '../js/ui/utils/coatSources.js';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coatsDir = path.join(projectRoot, 'img', 'coats', '2026-27');
const reportPath = path.join(coatsDir, 'manifest.json');
const force = process.argv.includes('--force');
const clubs = COMPETITIONS_2026_27.flatMap(league => league.clubs);

function candidatesFor(id) {
  const candidates = [];
  const google = GOOGLE_SPORTS_COATS[id];
  if (google) {
    const match = google.match(/^https:\/\/ssl\.gstatic\.com\/onebox\/media\/sports\/logos\/(?:optimized\/)?([\w-]+)_(?:48x48|96x96|500x500)\.png$/);
    if (match) candidates.push({ url: `https://ssl.gstatic.com/onebox/media/sports/logos/optimized/${match[1]}_96x96.png`, source: 'Google Sports' });
    candidates.push({ url: google, source: 'Google Sports' });
  }
  if (OTHER_REMOTE_COATS[id]) candidates.push({ url: OTHER_REMOTE_COATS[id], source: new URL(OTHER_REMOTE_COATS[id]).hostname });
  const local = LOCAL_COAT_ADDITIONS[id] || (id === 'excelsior' ? 'nl/Excelsior.png' : null);
  if (local) candidates.push({ local: path.join(projectRoot, 'img', 'coats', local), source: 'archivo local previo' });
  return candidates.filter((candidate, index, all) => all.findIndex(other => other.url === candidate.url && other.local === candidate.local) === index);
}

async function dimensions(file) {
  const buffer = await fs.readFile(file);
  if (buffer.length < 400 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('El archivo no es un PNG válido o es demasiado pequeño');
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width < 24 || height < 24 || width > 2048 || height > 2048) {
    throw new Error(`Dimensiones no válidas: ${width}x${height}`);
  }
  return { width, height };
}

async function prepareCoat(club, temporaryDir) {
  const output = path.join(coatsDir, `${club.id}.png`);
  if (!force) {
    try {
      const { width, height } = await dimensions(output);
      if (width === 96 && height === 96) return { id: club.id, source: 'ya descargado', output };
    } catch { /* Descargar de nuevo */ }
  }

  let lastFailure = 'sin fuentes';
  for (const [index, candidate] of candidatesFor(club.id).entries()) {
    const downloaded = path.join(temporaryDir, `${club.id}-${index}.png`);
    try {
      if (candidate.local) {
        await fs.copyFile(candidate.local, downloaded);
      } else {
        await execFileAsync('curl', [
          '--fail', '--location', '--silent', '--show-error', '--retry', '1',
          '--retry-all-errors', '--retry-delay', '1', '--connect-timeout', '8',
          '--max-time', '25', '--output', downloaded, candidate.url
        ], { timeout: 60000, maxBuffer: 64 * 1024 });
      }
      await dimensions(downloaded);
      const normalized = path.join(temporaryDir, `${club.id}-normalized.png`);
      await execFileAsync('magick', [downloaded, '-auto-orient', '-thumbnail', '96x96',
        '-background', 'none', '-gravity', 'center', '-extent', '96x96',
        '-strip', '-define', 'png:compression-level=9', normalized], { timeout: 25000 });
      const normalizedDimensions = await dimensions(normalized);
      if (normalizedDimensions.width !== 96 || normalizedDimensions.height !== 96) throw new Error('La conversión no generó 96x96');
      await fs.copyFile(normalized, output);
      return { id: club.id, source: candidate.source, url: candidate.url, output };
    } catch (error) {
      lastFailure = `${candidate.source}: ${error.message.trim().slice(0, 130)}`;
    } finally {
      await fs.rm(downloaded, { force: true });
    }
  }
  return { id: club.id, error: lastFailure };
}

async function main() {
  await fs.mkdir(coatsDir, { recursive: true });
  const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pcf-coats-'));
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < clubs.length) {
      const index = next++;
      const result = await prepareCoat(clubs[index], temporaryDir);
      results.push(result);
      if (result.error) console.error(`ERROR ${result.id}: ${result.error}`);
      if (results.length % 25 === 0) console.log(`Escudos procesados: ${results.length}/${clubs.length}`);
    }
  };
  try {
    await Promise.all(Array.from({ length: 12 }, worker));
  } finally {
    await fs.rm(temporaryDir, { recursive: true, force: true });
  }
  const manifest = {};
  for (const result of results.sort((a, b) => a.id.localeCompare(b.id))) {
    if (result.error) continue;
    const bytes = await fs.readFile(result.output);
    manifest[result.id] = {
      file: `${result.id}.png`, source: result.source,
      ...(result.url ? { originalUrl: result.url } : {}),
      sha256: createHash('sha256').update(bytes).digest('hex')
    };
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ width: 96, height: 96, clubs: manifest }, null, 2)}\n`);
  const failed = results.filter(result => result.error);
  console.log(`Descarga finalizada: ${results.length - failed.length}/${clubs.length} escudos PNG locales.`);
  if (failed.length) {
    console.error(`Sin escudo: ${failed.map(result => result.id).join(', ')}`);
    process.exitCode = 1;
  }
}

await main();
