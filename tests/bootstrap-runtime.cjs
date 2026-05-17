const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const bootstrap = read('src/business/chatBootstrap.js');
const chatRuntime = read('src/composables/useChatRuntime.js');
const chatSubmit = read('src/composables/useChatSubmit.js');
const chatContainerController = read('src/composables/chat/useChatContainerController.js');

assert(
  bootstrap.includes('Promise.allSettled') || bootstrap.includes('settled'),
  'bootstrap should keep graceful degradation based on allSettled/settled result handling'
);
assert(
  chatContainerController.includes('useChatSubmit') &&
    chatRuntime.includes('appendUserAndAssistantMessages'),
  'chat container/runtime should still compose submit logic and message state'
);
assert(
  chatSubmit.includes('isGenerating') && chatSubmit.includes('streamText'),
  'chat submit/runtime should preserve guarded streaming flow'
);

console.log('bootstrap/runtime checks passed');
