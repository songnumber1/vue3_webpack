const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'src/assets/styles/index.scss');
const runtimePath = path.join(
  root,
  'src/assets/styles/03-runtime/_overlay-scroll-container-runtime.scss'
);
const keyboardControllerPath = path.join(
  root,
  'src/composables/ui/useOverlayKeyboardScrollController.js'
);
const createResponsivePath = path.join(
  root,
  'src/assets/styles/studio/_create-responsive.scss'
);

assert(fs.existsSync(runtimePath), 'OverlayScrollContainer runtime SCSS must exist');

const index = fs.readFileSync(indexPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const keyboardController = fs.readFileSync(keyboardControllerPath, 'utf8');
const createResponsive = fs.readFileSync(createResponsivePath, 'utf8');

const finalImport = '@use "./03-runtime/overlay-scroll-container-runtime" as *;';
assert(index.includes(finalImport), 'index.scss must import the final OverlayScrollContainer runtime cascade');
assert(
  index.trim().endsWith(finalImport),
  'OverlayScrollContainer runtime cascade must remain the last Sass import'
);

[
  '.overlay-scroll-container[data-overlayscrollbars-initialize]',
  '.overlay-scroll-container[data-overlay-scrollbar-enhanced="true"]',
  'body.actual-android-runtime.overlay-scroll-runtime',
  '[data-overlayscrollbars-viewport]',
  'scroll-padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px));',
].forEach((snippet) => {
  assert(runtime.includes(snippet), `OverlayScrollContainer runtime SCSS missing ${snippet}`);
});

[
  'function bindViewportListeners()',
  'function unbindViewportListeners()',
  'bindViewportListeners();',
  'removeViewportListeners?.();',
].forEach((snippet) => {
  assert(keyboardController.includes(snippet), `Keyboard controller missing lazy viewport listener guard ${snippet}`);
});

assert(
  !keyboardController.includes('if (isClient()) {\n    window.visualViewport?.addEventListener'),
  'Keyboard controller must not bind visualViewport listeners eagerly for non-Android/non-focused screens'
);

assert(
  createResponsive.includes('Studio create keyboard correction is now owned by OverlayScrollContainer'),
  'Studio create responsive comment must match the OverlayScrollContainer ownership model'
);

console.log('Overlay scroll cascade static checks passed');
