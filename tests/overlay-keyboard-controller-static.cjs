const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const controllerPath = path.join(
  root,
  'src/composables/ui/useOverlayKeyboardScrollController.js'
);
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
  fs.existsSync(controllerPath),
  'useOverlayKeyboardScrollController must exist for Android overlay keyboard stabilization'
);

const source = read(controllerPath);

[
  'export function useOverlayKeyboardScrollController',
  'handleFocusIn',
  'handleFocusOut',
  'handlePointerDown',
  'scheduleCorrection',
  'runCorrection',
  'getViewport',
  'const handleViewportChange = () => scheduleCorrection()',
  'function bindViewportListeners()',
  'function unbindViewportListeners()',
  'visualViewport.addEventListener("resize", handleViewportChange',
  'visualViewport.addEventListener("scroll", handleViewportChange',
  'visualViewport.removeEventListener("resize", handleViewportChange',
  'visualViewport.removeEventListener("scroll", handleViewportChange',
  'bindViewportListeners();',
  'removeViewportListeners?.();',
  'viewport.scrollBy?.({top: delta, left: 0, behavior: "auto"})',
  'restoreDocumentScrollPosition',
  'textareaTopScrollSentinel',
].forEach((snippet) => {
  assert(source.includes(snippet), `overlay keyboard controller missing ${snippet}`);
});


assert(
  !source.includes('if (isClient()) {\n    window.visualViewport?.addEventListener'),
  'overlay keyboard controller must not bind visualViewport listeners eagerly'
);

assert(
  !source.includes('scrollIntoView'),
  'overlay keyboard controller must avoid scrollIntoView and use viewport.scrollBy only'
);
assert(
  !source.includes('window.scrollTo({top: delta'),
  'overlay keyboard controller must not move window for focused field correction'
);

const runAll = read(runAllPath);
assert(
  runAll.includes("require('./overlay-keyboard-controller-static.cjs')"),
  'run-all.cjs must include overlay keyboard controller static test'
);

console.log('overlay keyboard controller static checks passed');
