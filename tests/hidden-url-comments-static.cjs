const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const commentFiles = [
  'src/composables/chat/internal/container/useChatScrollController.js',
  'src/stores/chatStore.js',
  'src/stores/chatStreamStore.js',
];

const combined = commentFiles.map(read).join('\n');

assert(
  !combined.includes('대화방 내부(/chat/:id)') &&
    !combined.includes('현행 /chat/:id 기반') &&
    !combined.includes('/chat/:id 또는 /chat') &&
    !combined.includes('URL 표시/숨김 정책'),
  'runtime comments must not describe normal chat navigation with old /chat/:id or visible/hidden URL mode wording'
);

assert(
  combined.includes('hidden-only /chat') &&
    combined.includes('URL param 대신 Pinia 기준'),
  'runtime comments must explain the hidden-only /chat entry and Pinia-based active chat id policy'
);
