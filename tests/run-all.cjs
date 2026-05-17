const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'src/services/chatStream/chatStreamState.js',
  'src/services/chatStream/streamAbortManager.js',
  'src/services/chatStream/mockChatStream.js',
  'src/bridge/adapters/androidBridgeAdapter.js',
  'src/bridge/registry/bridgeCallbackRegistry.js',
  'src/bridge/validation.js',
  'src/composables/bottomSheet/useBottomSheetViewport.js',
  'src/composables/bottomSheet/useBottomSheetMeasurements.js',
  'src/composables/bottomSheet/useBottomSheetDrag.js',
  'src/services/mobileKeyboard/mobileKeyboardManager.js',
  'src/services/chatScroll/stickyBottomScroll.js',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} is missing`);
}

const submitSource = fs.readFileSync(path.join(root, 'src/composables/useChatSubmit.js'), 'utf8');
assert(submitSource.includes('CHAT_STREAM_STATE'), 'useChatSubmit must use stream state');
assert(submitSource.includes('createMockChatStream'), 'useChatSubmit must use stream service abstraction');

const bridgeSource = fs.readFileSync(path.join(root, 'src/bridge/bridgeClient.js'), 'utf8');
assert(bridgeSource.includes('androidBridgeAdapter'), 'bridgeClient must delegate platform bridge logic');
assert(bridgeSource.includes('bridgeCallbackRegistry'), 'bridgeClient must delegate callback registry');
assert(bridgeSource.includes('./validation'), 'bridgeClient must delegate contract validation');

const bottomSheetSource = fs.readFileSync(path.join(root, 'src/composables/useBottomSheetSizing.js'), 'utf8');
assert(bottomSheetSource.includes('createBottomSheetViewportController'), 'bottom sheet viewport logic must be separated');
assert(bottomSheetSource.includes('createBottomSheetDragController'), 'bottom sheet drag logic must be separated');
assert(bottomSheetSource.includes('createBodyScrollLock'), 'bottom sheet body lock logic must be separated');

console.log('architecture checks passed');
