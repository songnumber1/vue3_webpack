const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const workspace = read('src/components/chat/ChatWorkspace.vue');
const promptWrapper = read('src/components/chat/ChatPromptInput.vue');
const viewportGuard = read('src/composables/useViewportGuard.js');
const promptComposer = read('src/composables/usePromptComposer.js');

assert(
  exists('src/components/chat/ChatPromptInput.vue'),
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

const bridgeFiles = [
  'src/bridge/bridgeClient.js',
  'src/bridge/bridgeCallbackRegistry.js',
  'src/bridge/bridgeValidation.js',
  'src/bridge/bridgeAndroidTransport.js',
  'src/bridge/bridgeIosTransport.js',
  'src/bridge/bridgeNativeRuntime.js',
  'src/bridge/bridgeAndroidToJsRuntime.js',
  'src/bridge/bridgeWebApiRuntime.js',
  'src/bridge/bridgeErrors.js',
  'src/bridge/bridgeResponses.js',
  'src/bridge/bridgeRuntime.js',
  'src/bridge/bridgeUtils.js',
];

bridgeFiles.forEach((file) => assert(exists(file), `${file} is missing`));

const bridgeClient = read('src/bridge/bridgeClient.js');
const bridgeNativeRuntime = read('src/bridge/bridgeNativeRuntime.js');
const bridgeAndroidTransport = read('src/bridge/bridgeAndroidTransport.js');
const bridgeCallbackRegistry = read('src/bridge/bridgeCallbackRegistry.js');
const bridgeRuntime = read('src/bridge/bridgeRuntime.js');
const bridgeAndroidToJsRuntime = read('src/bridge/bridgeAndroidToJsRuntime.js');

assert(
  bridgeClient.includes('export {callNative}') &&
    bridgeClient.includes('export {executeWebApi}') &&
    bridgeClient.includes('export function executeContract'),
  'bridgeClient must keep the existing public exports'
);
assert(
  bridgeRuntime.includes('window.__bridgeResponse = completeBridgeResponse') &&
    bridgeAndroidToJsRuntime.includes('window.__receiveNativeEvent = receiveNativeEventAsJson'),
  'bridge global callback entry points must be preserved'
);
assert(
  bridgeAndroidToJsRuntime.includes('window.onAppResume') &&
    bridgeAndroidToJsRuntime.includes('window.onBackPressed') &&
    bridgeAndroidToJsRuntime.includes('window.onFileSelected'),
  'Android-to-JS global event handlers must be preserved'
);
assert(
  bridgeNativeRuntime.includes('postAndroidBridgeMessage({') &&
    bridgeNativeRuntime.includes('requestId,') &&
    bridgeNativeRuntime.includes('type,') &&
    bridgeNativeRuntime.includes('payload: validPayload'),
  'postMessage payload shape must remain { requestId, type, payload }'
);
assert(
  bridgeAndroidTransport.includes('window.AndroidBridge || null') &&
    bridgeAndroidTransport.includes('bridge[methodName](JSON.stringify(payload))'),
  'AndroidBridge direct method contract must be preserved'
);
assert(
  bridgeCallbackRegistry.includes('setBridgeCallback') &&
    bridgeCallbackRegistry.includes('deleteBridgeCallback') &&
    bridgeCallbackRegistry.includes('completeBridgeResponse'),
  'callback registry must own callback registration and cleanup'
);
assert(
  bridgeNativeRuntime.includes('window.clearTimeout(timer)') &&
    bridgeNativeRuntime.includes('deleteBridgeCallback(requestId)') &&
    bridgeNativeRuntime.includes('ANDROID_BRIDGE_TIMEOUT'),
  'bridge timeout and callback cleanup flow must be preserved'
);

console.log('phase3 bridge split, mobile prompt, and viewport checks passed');
