const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expectedFiles = [
  'src/composables/bottom-sheet/bottomSheetConstants.js',
  'src/composables/bottom-sheet/useBottomSheetDrag.js',
  'src/composables/bottom-sheet/useBottomSheetSnap.js',
  'src/composables/bottom-sheet/useBottomSheetSafeArea.js',
  'src/composables/bottom-sheet/useBottomSheetViewport.js',
];

expectedFiles.forEach((file) => assert(exists(file), `${file} is missing`));

const sizing = read('src/composables/useBottomSheetSizing.js');
const drag = read('src/composables/bottom-sheet/useBottomSheetDrag.js');
const snap = read('src/composables/bottom-sheet/useBottomSheetSnap.js');
const viewport = read('src/composables/bottom-sheet/useBottomSheetViewport.js');
const safeArea = read('src/composables/bottom-sheet/useBottomSheetSafeArea.js');

assert(
  sizing.includes('createBottomSheetDrag') &&
    sizing.includes('createBottomSheetSnap') &&
    sizing.includes('createBottomSheetViewport'),
  'useBottomSheetSizing should compose drag/snap/viewport modules'
);
assert(
  sizing.includes('watch(') && sizing.includes('onBeforeUnmount'),
  'useBottomSheetSizing should keep lifecycle ownership'
);
assert(
  sizing.includes('registerViewportListeners') &&
    sizing.includes('unregisterViewportListeners'),
  'viewport listener registration flow should remain explicit'
);
assert(
  drag.includes('pointermove') &&
    drag.includes('pointerup') &&
    drag.includes('pointercancel') &&
    drag.includes('emit("close")'),
  'drag module must preserve pointer and close behavior'
);
assert(
  snap.includes('fullThreshold') &&
    snap.includes('expand()') &&
    snap.includes('collapse()'),
  'snap module must preserve full/min snap behavior'
);
assert(
  viewport.includes('window.visualViewport') &&
    viewport.includes('BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS') &&
    viewport.includes('contentFirefox'),
  'viewport module must preserve visualViewport, delayed refresh, and Firefox ratio logic'
);
assert(
  safeArea.includes('getSafeAreaBottom'),
  'safe-area handling must be isolated behind the bottom-sheet safe-area module'
);
assert(
  sizing.split('\n').length < 160,
  'useBottomSheetSizing should stay as a small facade after split'
);

console.log('bottom sheet structure checks passed');
