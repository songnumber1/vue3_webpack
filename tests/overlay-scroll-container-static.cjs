const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const componentPath = path.join(root, 'src/components/common/OverlayScrollContainer.vue');
const composablePath = path.join(root, 'src/composables/ui/useOverlayScrollContainer.js');
const runAllPath = path.join(root, 'tests/run-all.cjs');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  fs.existsSync(componentPath),
  'OverlayScrollContainer component must exist as the common overlay scroll container'
);
assert(
  fs.existsSync(composablePath),
  'useOverlayScrollContainer composable must exist as the common overlay scroll adapter'
);

const component = read(componentPath);
const composable = read(composablePath);

[
  'useOverlayScrollContainer',
  '@focusin="handleFocusIn"',
  '@focusout="handleFocusOut"',
  '@pointerdown="handlePointerDown"',
  ':data-overlay-scroll-area="area"',
  ':data-keyboard-aware=',
  'defineExpose',
  'getViewport',
  'update',
  'destroy',
].forEach((snippet) => {
  assert(component.includes(snippet), `OverlayScrollContainer missing ${snippet}`);
});

[
  'export function useOverlayScrollContainer',
  'useOverlayScrollbar',
  'useOverlayKeyboardScrollController',
  'useOverlayScrollPolicy',
  'keyboardControllerEnabled',
  'isActualAndroidRuntime.value',
  'viewport: overlay',
  'updateOverlay: overlay.update',
  'handleFocusIn: keyboardController.handleFocusIn',
  'handlePointerDown: keyboardController.handlePointerDown',
].forEach((snippet) => {
  assert(composable.includes(snippet), `useOverlayScrollContainer missing ${snippet}`);
});


assert(
  component.includes('function resolveEnabledProp()') &&
    component.includes('typeof props.enabled === "function" ? props.enabled() : props.enabled') &&
    component.includes('enabled: resolveEnabledProp'),
  'OverlayScrollContainer must evaluate function-valued enabled props before passing them to the composable'
);

const runAll = read(runAllPath);
assert(
  runAll.includes("require('./overlay-scroll-container-static.cjs')"),
  'run-all.cjs must include overlay scroll container static test'
);

console.log('overlay scroll container static checks passed');
