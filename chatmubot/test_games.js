/* Pruebas deterministas para las regresiones de juegos de ChatmuBot v3.0.1.
   Ejecutar: node tests/test_games.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'data/chatmubot/chatbotrespuestas.json'),'utf8'));
const ctx = { window: {}, Math: Object.create(Math) };
ctx.Math.random=()=>0;
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/modules/chatbotJuegos.js'),'utf8'),ctx);
const estado=()=>({adivinanza:{usadas:[],aciertos:0,fallos:0,ronda:0,activa:false,esperandoSiguiente:false},duelo:{usadas:[],ganados:0,perdidos:0,ronda:0,intentoActual:0,activa:false,esperandoSiguiente:false}});
let s=estado();
ctx.window.iniciarAdivinanza(s,data);
assert.equal(s.adivinanza.actual.respuesta.toLowerCase(),'el plátano');
assert.match(ctx.window.manejarAdivinanza(s,'p',data),/No es eso/);
assert.equal(s.adivinanza.aciertos,0,'La letra p NO debe resolver plátano');
assert.match(ctx.window.manejarAdivinanza(s,'plátano',data),/¡Correcto!/);
assert.equal(s.adivinanza.aciertos,1);
assert.equal(ctx.window.manejarAdivinanza(s,'hola',data),null,'Tras acabar una ronda puede cambiar de tema');
s=estado();
ctx.window.iniciarDueloDeInsultos(s,data);
const claves=s.duelo.actual.palabrasClave;
assert.ok(claves.length>=2);
assert.doesNotMatch(ctx.window.manejarRespuestaInsulto(s,claves.join(' '),data),/¡Buena réplica!/);
assert.equal(s.duelo.ganados,0,'Las dos palabras clave NO bastan para ganar');
assert.match(ctx.window.manejarRespuestaInsulto(s,s.duelo.actual.respuesta,data),/¡Buena réplica!/);
console.log('OK: 7 comprobaciones de juegos (adivinanza, duelo, cambio de tema)');
