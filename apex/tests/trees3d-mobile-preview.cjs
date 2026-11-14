'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/trees3d-mobile-preview.js'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'perf6a-preview.html'), 'utf8');
const production = fs.readFileSync(path.join(root, 'apex.html'), 'utf8');

assert.match(preview, /js\/trees3d-mobile-preview\.js\?v=mobile-opt-in-v1/);
assert.match(production,/url=perf6a-preview\.html/);
assert.match(preview, /const count=28;/);
assert.doesNotMatch(preview, /\\n\/\/ part-024/, 'preview loader comment must use real newlines');

function launch({ userAgent = 'Mozilla/5.0 (Linux; Android 14) Mobile', saved = '0',
                  pressure = 1, search = '', renderer = true } = {}) {
  const controls = Object.create(null);
  const store = Object.create(null);
  if (saved !== null) store['apex26.preview.mobileTrees3d.v1'] = saved;
  const calls = [];
  const parent = { 
    append(...nodes) { nodes.forEach(n => { n.parentElement = this; if (n.id) controls[n.id] = n; }); }
  };
  const anchor = { parentElement: parent, after(...nodes) { parent.append(...nodes); } };
  class Node {
    constructor(tagName) {
      this.tagName = tagName;
      this.children = [];
      this.style = {};
      this.listeners = {};
      this.disabled = false;
    }
    setAttribute(k, v) { this[k] = v; }
    appendChild(node) { this.children.push(node); node.parentElement = this; return node; }
    addEventListener(type, handler) { this.listeners[type] = handler; }
  }
  const document = {
    body: {classList: {contains: () => false}},
    documentElement: {},
    querySelector(query) { return query === '#apex9aOptionsScreen .apexProtoOptionsGrid > section' ? parent : null; },
    getElementById(id) { return id === 'apexProtoQualityText' ? anchor : controls[id] || null; },
    createElement(tagName) { return new Node(tagName); },
    addEventListener() {}
  };
  const window = {
    addEventListener() {},
    apexTrees3dTrialInfo: () => ({ scope: 'all-circuits' })
  };
  if (renderer) {
    window.apexTrees3dRender = c => { calls.push(c); return !c.mobile; };
  }
  const localStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value) { store[key] = value; }
  };
  const MutationObserver = class { observe() {} disconnect() {} };
  vm.runInNewContext(source, {
    window, document, navigator: {userAgent}, localStorage,
    location: {search}, URLSearchParams, MutationObserver,
    mobileRenderPressure: () => pressure
  }, {filename: 'trees3d-mobile-preview.js'});
  return {window, controls, store, calls};
}

const mobile = launch();
const select = mobile.controls.apexProtoTrees3dMobile;
assert.ok(select, 'mobile tree option absent in the Options screen');
assert.equal(select.value, '0', 'mobile must default to classic trees');
assert.equal(select.children.length, 2, 'mobile option must have on/off choices');
assert.equal(mobile.window.apexTrees3dRender({mobile:true,depth:70,lod:0}), false);
assert.equal(mobile.calls.length, 0, 'disabled mobile option must not call expensive 3D renderer');
select.value = '1';
select.listeners.change();
assert.equal(mobile.store['apex26.preview.mobileTrees3d.v1'], '1', 'enabled preference was not persisted');
assert.equal(mobile.window.apexTrees3dRender({mobile:true,depth:80,lod:0}), true);
assert.equal(mobile.calls[0].mobile, false, 'opted-in mobile must enter the full 3D renderer');
assert.equal(mobile.window.apexTrees3dRender({mobile:true,depth:999,lod:0}), false);
assert.equal(mobile.window.apexTrees3dRender({mobile:true,depth:80,lod:2}), false);
assert.equal(mobile.window.apexTrees3dMobilePreviewInfo().mobile3dDrawsSinceLoad, 1);
assert.equal(mobile.window.apexTrees3dTrialInfo().mobilePreview.enabled, true);
select.value = '0';
select.listeners.change();
assert.equal(mobile.window.apexTrees3dRender({mobile:true,depth:80,lod:0}), false);

const saved = launch({saved:'1', pressure: .1});
assert.equal(saved.controls.apexProtoTrees3dMobile.value, '1', 'persisted enabled setting must reload');
assert.equal(saved.window.apexTrees3dRender({mobile:true,depth:210,lod:0}), false, 'low-FPS fallback should reduce 3D distance');
assert.equal(saved.window.apexTrees3dRender({mobile:true,depth:60,lod:0}), true, 'nearby tree should stay 3D');
const desktop = launch({userAgent:'Mozilla/5.0 (X11; Linux x86_64)', saved:'0'});
assert.equal(desktop.window.apexTrees3dRender({mobile:false,depth:100,lod:0}), true, 'desktop behaviour must remain unchanged');

const forcedOff = launch({search:'?trees3d=0',renderer:false});
assert.equal(forcedOff.controls.apexProtoTrees3dMobile.disabled,true,'global 3D override must be respected');
assert.equal(forcedOff.window.apexTrees3dRender,undefined);

console.log(JSON.stringify({test:'trees3d-mobile-preview',options:2,persistence:true,adaptiveCulling:true,desktopUnchanged:true,offOverride:true,ok:true}));
