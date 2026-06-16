const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const indexScss = read('src/assets/styles/index.scss');
const keyboardRuntime = read('src/assets/styles/03-runtime/_keyboard.scss');
const keyboardPatches = read('src/assets/styles/03-runtime/_responsive-keyboard-patches.scss');
const runtimeKeyboardDir = 'src/assets/styles/03-runtime/responsive-keyboard';
const oldLegacyDir = 'src/assets/styles/99-legacy';

assert(exists('src/assets/styles/03-runtime/_responsive-keyboard-patches.scss'), 'responsive keyboard patch aggregator must live under 03-runtime');
assert(exists(runtimeKeyboardDir), 'responsive keyboard partials must live under 03-runtime/responsive-keyboard');
assert(!exists(`${oldLegacyDir}/_responsive-keyboard-extracted-patches.scss`), 'old legacy responsive keyboard aggregator must stay removed');
assert(!exists(`${oldLegacyDir}/responsive-keyboard`), 'old legacy responsive keyboard partial directory must stay removed');
assert(!exists(oldLegacyDir), '99-legacy directory should stay removed after responsive keyboard runtime migration');

assert(indexScss.includes('./03-runtime/keyboard'), 'keyboard runtime must stay imported');
assert(indexScss.includes('./03-runtime/responsive-keyboard-patches'), 'index.scss must import responsive keyboard patches from 03-runtime');
assert(!indexScss.includes('99-legacy'), 'index.scss must not import 99-legacy after responsive keyboard migration');

const keyboardIndex = indexScss.indexOf('./03-runtime/keyboard');
const patchesIndex = indexScss.indexOf('./03-runtime/responsive-keyboard-patches');
const mobileModeIndex = indexScss.indexOf('./03-runtime/mobile-mode');
assert(keyboardIndex >= 0 && patchesIndex > keyboardIndex, 'responsive keyboard patches must remain immediately after keyboard runtime');
assert(mobileModeIndex > patchesIndex, 'responsive keyboard patches must stay before mobile-mode to preserve cascade');

const expectedOrder = [
  './responsive-keyboard/shared-message-prompt-icons',
  './responsive-keyboard/desktop-topbar-model',
  './responsive-keyboard/mobile-shell-visibility',
  './responsive-keyboard/mobile-topbar-prompt-model',
  './responsive-keyboard/mobile-sidebar-drawer',
  './responsive-keyboard/mobile-main-icons-home',
  './responsive-keyboard/mobile-message-bubbles',
  './responsive-keyboard/keyboard-responsive-layout',
];
let lastIndex = -1;
for (const importPath of expectedOrder) {
  const currentIndex = keyboardPatches.indexOf(importPath);
  assert(currentIndex > lastIndex, `${importPath} must keep its historical import order`);
  lastIndex = currentIndex;
}

assert(
  keyboardRuntime.includes('03-runtime/_responsive-keyboard-patches.scss'),
  'keyboard runtime comment should point to the migrated responsive keyboard patch aggregator'
);

console.log('responsive keyboard SCSS structure static checks passed');
