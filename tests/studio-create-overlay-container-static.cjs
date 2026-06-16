const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const studioCreatePath = path.join(root, 'src/components/studio/StudioCreatePage.vue');
const runAllPath = path.join(root, 'tests/run-all.cjs');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const source = read(studioCreatePath);

[
  'import OverlayScrollContainer from "@/components/common/OverlayScrollContainer.vue"',
  '<OverlayScrollContainer',
  'class="studio-create-content tw-min-h-0 tw-min-w-0 tw-flex-1 tw-overflow-y-auto"',
  'area="studio-create"',
  'keyboard-aware',
  ':overlay-options="studioCreateOverlayOptions"',
  ':keyboard-options="studioCreateKeyboardOptions"',
  '</OverlayScrollContainer>',
  'const studioCreateOverlayOptions = Object.freeze({',
  'overflow: {x: "hidden", y: "scroll"}',
  'const studioCreateKeyboardOptions = Object.freeze({',
  'textareaTopScrollSentinel: 12',
  'delays: [0, 40, 90, 160, 260, 420, 620]',
].forEach((snippet) => {
  assert(source.includes(snippet), `StudioCreatePage missing ${snippet}`);
});

[
  'useOverlayScrollbar',
  'useKeyboardFocusGuard',
  'textareaFocusTimers',
  'focusedTextarea',
  'textareaFocusState',
  'handleCreateFocusIn',
  'handleCreatePointerDown',
  'scheduleTextareaFocusCorrection',
  'ensureTextareaVisibleInCreateViewport',
].forEach((snippet) => {
  assert(!source.includes(snippet), `StudioCreatePage must not keep legacy manual scroll code: ${snippet}`);
});

const openSheets = (source.match(/<BaseBottomSheet/g) || []).length;
const closeSheets = (source.match(/<\/BaseBottomSheet>/g) || []).length;
assert(openSheets === closeSheets, 'StudioCreatePage must keep BaseBottomSheet tags balanced');

const runAll = read(runAllPath);
assert(
  runAll.includes("require('./studio-create-overlay-container-static.cjs')"),
  'run-all.cjs must include Studio create overlay container static test'
);

console.log('studio create overlay container static checks passed');
