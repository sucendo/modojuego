import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../scripts/main.js',import.meta.url),'utf8');
const menu=readFileSync(new URL('../scripts/menu.js',import.meta.url),'utf8');
const i18n=readFileSync(new URL('../scripts/i18n.js',import.meta.url),'utf8');

test('el título y el botón continuar aparecen una vez en la cabecera fija',()=>{
  for(const id of ['menu-title','start-game','menu-current-world','world-list','create-world']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
  }
  const hero=html.slice(html.indexOf('<header class="menu-hero">'),html.indexOf('</header>'));
  assert.match(hero,/id="menu-title"/);
  assert.match(hero,/id="start-game"/);
});

test('el menú limita altura, desplaza contenido y conserva el título visible',()=>{
  assert.match(css,/#overlay \.menu-panel \{[\s\S]*?max-height:calc\(100dvh - 24px\)/);
  assert.match(css,/#overlay \.menu-panel \{[\s\S]*?overflow-y:auto/);
  assert.match(css,/\.menu-hero \{[\s\S]*?position:sticky/);
  assert.match(css,/\.menu-hero,\.menu-content\{flex-shrink:0;\}/);
  assert.match(css,/@media\(max-width:540px\)/);
});

test('todas las acciones siguen vinculadas una sola vez al menú',()=>{
  for(const id of ['open-world-map','open-inventory','save-game','load-game','export-game','import-game','language-select','new-world-seed','new-world-type','new-world-mode']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
  }
  assert.match(menu,/heroWorld\.textContent = currentWorldLabel/);
});

test('hay traducción de las acciones en los tres idiomas',()=>{
  for(const text of ['Partida y herramientas','Game and tools','Partie et outils']) assert.ok(i18n.includes(text),text);
});

test('la atmósfera se inicializa antes de entregarla al panel F3',()=>{
  const atmosphere=main.indexOf('const atmosphere = new Atmosphere(scene,world);');
  const panel=main.indexOf('const performancePanel=setupPerformanceUI({renderer,world,sun,atmosphere});');
  assert.ok(atmosphere>=0 && panel>atmosphere);
});
