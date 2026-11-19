import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DAY_MS } from '../scripts/dayNight.js';
import { WEATHER_KINDS, sampleWeather, forecastForPeriod } from '../scripts/weather.js';

const TYPES=['classic','ocean','jungle','desert','snow','lava'];
const at=(day,hour)=>({day,timeMs:hour/24*DAY_MS});

test('forecast is determined by seed, world type and saved clock',()=>{
  for(const type of TYPES)for(const hour of [0,5.5,9.75,15.25,22.5]){
    const result=sampleWeather(1234,type,at(7,hour));
    assert.deepEqual(result,sampleWeather(1234,type,at(7,hour)));
    assert.ok(WEATHER_KINDS.includes(result.kind));
  }
});
test('weather data stays finite and bounded over many days and biomes',()=>{
  for(const type of TYPES)for(let day=1;day<=25;day++)for(let hour=0;hour<24;hour+=.75){
    const w=sampleWeather(1201,type,at(day,hour));
    for(const key of ['rain','snow','storm','ash','dust','cloudCover','lightning']){
      assert.ok(Number.isFinite(w[key])&&w[key]>=0&&w[key]<=1,`${type} ${day} ${hour} ${key}`);
    }
    assert.ok(Number.isFinite(w.windX)&&Number.isFinite(w.windZ));
  }
});
test('fronts blend smoothly at four-hour boundaries',()=>{
  for(const type of TYPES)for(let boundary=4;boundary<=20;boundary+=4){
    const a=sampleWeather(66,type,at(12,boundary-.0001));
    const b=sampleWeather(66,type,at(12,boundary+.0001));
    for(const key of ['rain','snow','dust','ash','storm','cloudCover','windX','windZ']){
      assert.ok(Math.abs(a[key]-b[key])<.03,`${type} boundary ${boundary} ${key}`);
    }
  }
});
test('biome weather types fit their environment, including snow storms',()=>{
  for(let period=0;period<1000;period++){
    const dry=forecastForPeriod(67,'desert',period);
    assert.equal(dry.rain,0);assert.equal(dry.snow,0);
    const volcanic=forecastForPeriod(67,'lava',period);
    assert.equal(volcanic.rain,0);assert.equal(volcanic.snow,0);
    const cold=forecastForPeriod(67,'snow',period);
    assert.equal(cold.rain,0);assert.equal(cold.dust,0);
  }
});
test('each thematic biome produces expected distinctive weather',()=>{
  const kinds=(type)=>new Set(Array.from({length:2000},(_,i)=>forecastForPeriod(777,type,i).kind));
  assert.ok(kinds('ocean').has('rain')&&kinds('ocean').has('storm'));
  assert.ok(kinds('snow').has('snow'));
  assert.ok(kinds('desert').has('dust'));
  assert.ok(kinds('lava').has('ash'));
});
test('lightning only occurs during storms and never exceeds strength',()=>{
  for(const type of TYPES)for(let hour=0;hour<24;hour+=.01){
    const w=sampleWeather(800,type,at(10,hour));
    if(w.lightning>0){assert.ok(w.storm>.45);assert.ok(w.lightning<=w.storm);}
  }
});
test('legacy clouds are no longer generated as collision blocks',()=>{
  const source=readFileSync(new URL('../scripts/worldChunk.js',import.meta.url),'utf8');
  const generate=source.slice(source.indexOf('  generate() {'),source.indexOf('  generateLandmark()'));
  assert.doesNotMatch(generate,/this\.generateClouds\(rng\)/);
  assert.match(generate,/this\.loadPlayerChanges\(\)/);
});
test('clouds use two instanced layers, no textures and limited particle counts',()=>{
  const cloud=readFileSync(new URL('../scripts/cloudLayer.js',import.meta.url),'utf8');
  const rain=readFileSync(new URL('../scripts/precipitation.js',import.meta.url),'utf8');
  assert.match(cloud,/new THREE\.InstancedMesh/);
  assert.match(cloud,/cloudCell\(/);
  assert.match(cloud,/cloudHorizonOpacity\(/);
  assert.match(cloud,/cloudCoverOpacity\(/);
  assert.match(rain,/RAIN_COUNT=280,SNOW_COUNT=215/);
  assert.match(rain,/checkRoof\(/);
});
test('weather toggle is persisted without changing saved world format v9',()=>{
  const saves=readFileSync(new URL('../scripts/saveManager.js',import.meta.url),'utf8');
  assert.match(saves,/const SAVE_VERSION = 15;/);
  assert.match(saves,/weatherEnabled:world\.weatherEnabled/);
  assert.match(saves,/world\.weatherEnabled=normalized\.settings\.weatherEnabled \?\? true/);
  assert.match(saves,/typeof value\.weatherEnabled !== 'boolean'/);
});
test('weather display has translations and does not intercept game controls',()=>{
  const messages=readFileSync(new URL('../scripts/i18n.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.equal((messages.match(/weatherEffects:/g)||[]).length,3);
  assert.match(css,/#weather-hud\{[^}]*pointer-events:none/s);
});
