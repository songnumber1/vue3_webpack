const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const workspace = read('src/components/chat/ChatWorkspace.vue');
const promptWrapper = read('src/components/chat/ChatPromptInput.vue');
const viewportGuard = read('src/composables/useViewportGuard.js');
const promptComposer = read('src/composables/usePromptComposer.js');

assert(
  fs.existsSync(path.join(root, 'src/components/chat/ChatPromptInput.vue')),
  'ChatPromptInput wrapper is missing'
);
assert(
  (workspace.match(/<ChatPromptInput/g) || []).length === 2,
  'ChatWorkspace should use the shared ChatPromptInput wrapper for main/chat modes'
);
assert(
  !workspace.includes('<PromptInput'),
  'ChatWorkspace should not render PromptInput directly'
);
assert(
  (promptWrapper.match(/<PromptInput/g) || []).length === 1,
  'ChatPromptInput should keep the actual PromptInput declaration centralized'
);
assert(
  workspace.includes('mobile-main-fixed-prompt') && workspace.includes('desktop-center-prompt'),
  'main prompt must preserve existing mobile and desktop CSS hooks'
);
assert(
  viewportGuard.includes('requestAnimationFrame') && viewportGuard.includes('cancelAnimationFrame'),
  'viewport guard must coalesce resize/visualViewport updates and clean them up'
);
assert(
  viewportGuard.includes('window.visualViewport') && viewportGuard.includes('focusin'),
  'viewport guard must continue tracking visualViewport and focus keyboard events'
);
assert(
  promptComposer.includes('window.visualViewport') && promptComposer.includes('orientationchange'),
  'prompt composer must react to visualViewport/orientation changes'
);
assert(
  promptComposer.includes('const maxHeight = isMobileSheet.value'),
  'prompt textarea sizing should use the synchronized mobile sheet mode'
);

console.log('phase2 mobile prompt and viewport checks passed');
