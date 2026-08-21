#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { fileURLToPath,pathToFileURL } from "node:url";

const EXPECTED_GALAXY="b79b61ba4523005daa9433d3fd63dbd0c3f1dcc4";
const EXPECTED_SYSTEMS="123ceea4c5557f99e232ac8390cedd4a509f3fe5";
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const sourceDir=path.join(root,"src","catalog","voyastris-source");
const galaxyPath=path.join(sourceDir,"galaxy.js"),systemsPath=path.join(sourceDir,"systems.js");
function blobSha(buffer){return crypto.createHash("sha1").update(Buffer.from(`blob ${buffer.length}\0`)).update(buffer).digest("hex")}
for(const p of [galaxyPath,systemsPath])if(!fs.existsSync(p)){console.error(`Falta ${p}. Ejecuta setup-voyastris-offline.cmd primero.`);process.exit(1)}
assert.equal(blobSha(fs.readFileSync(galaxyPath)),EXPECTED_GALAXY,"blob galaxy.js inesperado");
assert.equal(blobSha(fs.readFileSync(systemsPath)),EXPECTED_SYSTEMS,"blob systems.js inesperado");

// Node treats .js as CommonJS here. Copy exact modules to a temporary ESM fixture,
// rewriting only the relative import extension for the test; source files remain untouched.
const tmp=fs.mkdtempSync(path.join(process.env.TEMP||process.env.TMP||"/tmp","system-forge-voyastris-"));
try{
  fs.writeFileSync(path.join(tmp,"systems.mjs"),fs.readFileSync(systemsPath));
  let galaxyText=fs.readFileSync(galaxyPath,"utf8").replace("./systems.js","./systems.mjs");
  fs.writeFileSync(path.join(tmp,"galaxy.mjs"),galaxyText,"utf8");
  globalThis.fetch=async()=>{throw new Error("NETWORK_FORBIDDEN")};
  globalThis.BABYLON={
    Vector3:class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}},
    Color3:class Color3{constructor(r=0,g=0,b=0){this.r=r;this.g=g;this.b=b}},
    Color4:class Color4{constructor(r=0,g=0,b=0,a=1){this.r=r;this.g=g;this.b=b;this.a=a}}
  };
  const {GALAXY}=await import(pathToFileURL(path.join(tmp,"galaxy.mjs")).href+`?t=${Date.now()}`);
  assert.ok(GALAXY&&typeof GALAXY==="object");
  const stars=GALAXY.star||{},planets=GALAXY.planets||{};
  const direct=parent=>Object.entries(planets).filter(([,v])=>v?.orbits===parent).map(([k])=>k).sort();
  assert.ok(stars["Barnard's Star"],"Falta Barnard's Star");
  assert.deepEqual(direct("Barnard's Star"),["Barnard b","Barnard c","Barnard d","Barnard e"]);
  assert.ok(stars["Wolf 359"],"Falta Wolf 359");
  assert.deepEqual(direct("Wolf 359"),["Wolf 359 b","Wolf 359 c"]);
  assert.ok(stars["Lalande 21185"],"Falta Lalande 21185");
  assert.deepEqual(direct("Lalande 21185"),["Lalande 21185 b","Lalande 21185 c","Lalande 21185 d"]);
  const counts={stars:Object.keys(stars).length,planets:Object.keys(planets).length,satellites:Object.keys(GALAXY.satellites||{}).length,artificialSatellites:Object.keys(GALAXY.artificialSatellites||{}).length,comets:Object.keys(GALAXY.comets||{}).length,asteroids:Object.keys(GALAXY.asteroids||{}).length};
  assert.deepEqual(counts,{stars:424,planets:108,satellites:35,artificialSatellites:1,comets:3,asteroids:10});
  console.log("SMOKE TEST VOYASTRIS: OK");
  console.table(counts);
  console.log("Barnard's Star: 4 planetas · Wolf 359: 2 · Lalande 21185: 3");
  console.log("Los ficheros fuente coinciden con los blobs validados y la prueba bloquea fetch().");
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
