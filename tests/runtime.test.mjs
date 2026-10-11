import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createThemeController } from '../packages/runtime/dist/index.js';

function browser({stored, dark=false, storageFail=false, mediaFail=false, legacy=false, listenerFail=false}={}) {
  const listeners = new Set(); let storedMode = stored;
  const media = {matches:dark, addEventListener(_,fn) {if(listenerFail) throw Error('blocked');listeners.add(fn);},removeEventListener(_,fn) {listeners.delete(fn);},addListener(fn) {listeners.add(fn);},removeListener(fn) {listeners.delete(fn);}};
  if (legacy) {delete media.addEventListener;delete media.removeEventListener;}
  const window = {document:{documentElement:{dataset:{}}},matchMedia() {if(mediaFail) throw Error('blocked');return media;},localStorage:{getItem() {if(storageFail) throw Error('blocked');return storedMode;},setItem(key,value) {if(storageFail) throw Error('blocked');storedMode=value;}}};
  return {window,listeners,get stored() {return storedMode;},setDark(dark) {media.matches=dark;listeners.forEach(fn=>fn());}};
}
test('import and controller are safe without browser globals',() => {
  const theme = createThemeController();assert.deepEqual(theme.getState(),{mode:'system',effective:'light'});theme.setMode('dark');assert.equal(theme.getState().effective,'dark');theme.destroy();
});
for (const mode of ['light','dark','system']) test(`persisted ${mode}, OS change and explicit preference`,() => {
  const mock = browser({stored:mode});const theme = createThemeController({window:mock.window});const states=[];const off=theme.subscribe(state=>states.push(state));
  mock.setDark(true);assert.equal(theme.getState().effective,mode === 'light' ? 'light' : 'dark');assert.equal(theme.getState().mode,mode);
  theme.setMode('light');mock.setDark(false);mock.setDark(true);assert.equal(theme.getState().effective,'light');assert.equal(mock.stored,'light');
  theme.setMode('system');mock.setDark(false);assert.equal(theme.getState().effective,'light');assert.equal(mock.stored,'system');
  assert(Object.isFrozen(theme.getState()));off();const count=states.length;theme.setMode('dark');assert.equal(states.length,count);theme.destroy();assert.equal(mock.listeners.size,0);theme.setMode('light');assert.equal(theme.getState().mode,'dark');
});
test('invalid input/stored values fall back to system without overwriting on initialization',() => {
  const mock=browser({stored:'invalid',dark:true});const theme=createThemeController({window:mock.window});assert.deepEqual(theme.getState(),{mode:'system',effective:'dark'});assert.equal(mock.stored,'invalid');theme.setMode('wrong');assert.equal(mock.stored,'system');
});
test('storage rejection retains choice in memory; refresh defaults to system',() => {
  const mock=browser({storageFail:true});const theme=createThemeController({window:mock.window});theme.setMode('dark');assert.equal(theme.getState().mode,'dark');assert.equal(mock.window.document.documentElement.dataset.theme,'dark');assert.equal(createThemeController({window:mock.window}).getState().mode,'system');
});
test('matchMedia failure forces safe light even if CSS might report dark',() => {
  const mock=browser({mediaFail:true});const theme=createThemeController({window:mock.window});assert.equal(mock.window.document.documentElement.dataset.theme,'light');theme.setMode('dark');assert.equal(theme.getState().effective,'dark');theme.setMode('system');assert.equal(theme.getState().effective,'light');
});
test('custom storage key, legacy media listener and unsubscribe',() => {
  const mock=browser({legacy:true});const keys=[];mock.window.localStorage={getItem:key=>{keys.push(key);return 'system';},setItem:key=>keys.push(key)};
  const theme=createThemeController({window:mock.window,storageKey:'product.preference'});mock.setDark(true);assert.equal(theme.getState().effective,'dark');theme.setMode('light');assert.deepEqual(keys,['product.preference','product.preference']);theme.destroy();assert.equal(mock.listeners.size,0);
});
test('listener registration failure retains initial theme and usable explicit modes',() => {
  const mock=browser({listenerFail:true,dark:true});const theme=createThemeController({window:mock.window});assert.equal(theme.getState().effective,'dark');theme.setMode('light');assert.equal(theme.getState().effective,'light');theme.destroy();
});
