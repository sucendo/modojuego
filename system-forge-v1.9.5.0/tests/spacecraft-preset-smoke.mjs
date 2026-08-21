import fs from 'node:fs';
import assert from 'node:assert/strict';
const preset=JSON.parse(fs.readFileSync(new URL('../presets/solar-system.json',import.meta.url),'utf8'));
assert.equal(preset.version,'1.9.5.0');
assert.equal(preset.appVersion,'1.9.5.0');
assert.equal(preset.schemaVersion,22);
assert.equal(preset.bodies.length,75,'Solar preset should contain 70 previous bodies + 5 spacecraft');
assert.ok(preset.labelCategories.includes('spacecraft'));
const byId=new Map(preset.bodies.map(b=>[b.id,b]));
for(const id of ['iss','hubble','parker-solar-probe','voyager-1','voyager-2']){
  const b=byId.get(id);assert.ok(b,`missing ${id}`);assert.equal(b.type,'spacecraft');assert.ok(b.spacecraftClass);assert.ok(b.dryMassKg>0);
}
assert.equal(byId.get('iss').parentId,'tierra');
assert.equal(byId.get('hubble').parentId,'tierra');
assert.equal(byId.get('parker-solar-probe').parentId,'sol');
assert.equal(byId.get('voyager-1').trajectoryMode,'cartesian');
assert.equal(byId.get('voyager-2').trajectoryMode,'cartesian');
const norm=v=>Math.hypot(...v);
const v1=norm(byId.get('voyager-1').cartesianInitial.posAU),v2=norm(byId.get('voyager-2').cartesianInitial.posAU);
assert.ok(v1>160&&v1<180,`Voyager 1 modeled heliocentric distance ${v1}`);
assert.ok(v2>135&&v2<150,`Voyager 2 modeled heliocentric distance ${v2}`);
const iss=byId.get('iss');const AU_KM=149597870.7;
assert.ok(iss.a_AU*AU_KM>6750&&iss.a_AU*AU_KM<6850);
console.log('spacecraft-preset-smoke OK');
