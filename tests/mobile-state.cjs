const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const viewportGuard = read('src/composables/mobile-runtime/useViewportGuard.js');
const mobileState = read('src/composables/chat/container/useChatMobileState.js');
const viewportUtils = read('src/utils/viewport.js');
const promptComposer = read('src/composables/prompt/usePromptComposer.js');

assert(
  viewportGuard.includes('window.visualViewport') &&
    viewportGuard.includes('focusin') &&
    viewportGuard.includes('focusout'),
  'viewport guard must keep visualViewport and keyboard focus tracking'
);
assert(
  mobileState.includes('shouldUseMobilePlatformLayout') &&
    mobileState.includes('platformInfo.value') &&
    !mobileState.includes('querySelector'),
  'chat mobile state should derive mobile mode from media/platform state without DOM class probing'
);
assert(
  viewportUtils.includes('getMobileBrowserFamily') &&
    viewportUtils.includes('Chrome|CriOS|Chromium') &&
    !viewportUtils.includes('SamsungBrowser') &&
    !viewportUtils.includes('Firefox'),
  'viewport utils should keep Chrome/WebView-oriented mobile browser detection without unsupported browser branches'
);
assert(
  promptComposer.includes('orientationchange') &&
    promptComposer.includes('window.visualViewport'),
  'prompt composer must preserve orientation and visualViewport handling'
);

console.log('mobile state checks passed');
