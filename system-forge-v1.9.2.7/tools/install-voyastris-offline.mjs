#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const EXPECTED_GALAXY="b79b61ba4523005daa9433d3fd63dbd0c3f1dcc4";
const EXPECTED_SYSTEMS="123ceea4c5557f99e232ac8390cedd4a509f3fe5";
const here=path.dirname(fileURLToPath(import.meta.url));
const systemForge=path.resolve(here,"..");

function blobSha(buffer){
  const head=Buffer.from(`blob ${buffer.length}\0`,"utf8");
  return crypto.createHash("sha1").update(head).update(buffer).digest("hex");
}
function die(msg){console.error(`\nERROR: ${msg}`);process.exit(1)}
function findVoyastris(explicit){
  const candidates=[];
  if(explicit)candidates.push(explicit);
  if(process.env.VOYASTRIS_DIR)candidates.push(process.env.VOYASTRIS_DIR);
  candidates.push(path.resolve(systemForge,"..","voyastris"));
  if(process.env.USERPROFILE){
    candidates.push(path.join(process.env.USERPROFILE,"Programacion","proyectos","GitHub","voyastris"));
    candidates.push(path.join(process.env.USERPROFILE,"Documents","GitHub","voyastris"));
    candidates.push(path.join(process.env.USERPROFILE,"source","repos","voyastris"));
  }
  for(const candidate of candidates){
    const p=path.resolve(candidate);
    if(fs.existsSync(path.join(p,"src","data","galaxy.js"))&&fs.existsSync(path.join(p,"src","data","systems.js")))return p;
  }
  return null;
}

const args=process.argv.slice(2);
let explicit=null,allowNewer=false;
for(let i=0;i<args.length;i++){
  if(args[i]==="--voyastris"||args[i]==="-v")explicit=args[++i];
  else if(args[i]==="--allow-newer")allowNewer=true;
  else if(args[i]==="--help"||args[i]==="-h"){
    console.log('Uso: node tools\\install-voyastris-offline.mjs [--voyastris "C:\\ruta\\voyastris"] [--allow-newer]');
    process.exit(0);
  }else die(`Argumento desconocido: ${args[i]}`);
}
const voyastris=findVoyastris(explicit);
if(!voyastris)die('No encuentro el checkout local de Voyastris. Ejecuta de nuevo con --voyastris "C:\\ruta\\voyastris".');

const srcGalaxy=path.join(voyastris,"src","data","galaxy.js");
const srcSystems=path.join(voyastris,"src","data","systems.js");
const galaxy=fs.readFileSync(srcGalaxy),systems=fs.readFileSync(srcSystems);
const galaxySha=blobSha(galaxy),systemsSha=blobSha(systems);
console.log(`Voyastris: ${voyastris}`);
console.log(`galaxy.js : ${galaxySha}`);
console.log(`systems.js: ${systemsSha}`);
if(!allowNewer&&galaxySha!==EXPECTED_GALAXY)die(`galaxy.js no coincide con la revisión validada ${EXPECTED_GALAXY}. Actual: ${galaxySha}`);
if(!allowNewer&&systemsSha!==EXPECTED_SYSTEMS)die(`systems.js no coincide con la revisión validada ${EXPECTED_SYSTEMS}. Actual: ${systemsSha}`);

const target=path.join(systemForge,"src","catalog","voyastris-source");
fs.mkdirSync(target,{recursive:true});
fs.copyFileSync(srcGalaxy,path.join(target,"galaxy.js"));
fs.copyFileSync(srcSystems,path.join(target,"systems.js"));

// Ensure byte-for-byte identity after copy.
const copiedGalaxy=fs.readFileSync(path.join(target,"galaxy.js"));
const copiedSystems=fs.readFileSync(path.join(target,"systems.js"));
if(!copiedGalaxy.equals(galaxy)||!copiedSystems.equals(systems))die("La verificación byte a byte tras la copia ha fallado.");

console.log("\nOK — snapshot local instalado byte a byte.");
console.log("System Forge ya no necesita GitHub/jsDelivr para cargar el catálogo de Voyastris.");
console.log("Ejecuta ahora: node tools\\smoke-test-voyastris.mjs");
