const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const headerPolicy = read('src/composables/chat/internal/policy/chatHeaderPolicy.js');
const dataController = read('src/composables/chat/internal/container/useChatDataController.js');
const flowBaseline = read('tests/chat-flow-baseline.cjs');
const runAll = read('tests/run-all.cjs');

assert(
  runAll.includes("require('./chat-header-policy-static.cjs')"),
  'regression runner must include chat header policy checks'
);
assert(
  headerPolicy.includes('export function resolveConversationTitle') &&
    headerPolicy.includes('export function resolveWorkspaceAssistantLabel'),
  'chatHeaderPolicy must expose title and assistant label policies'
);
assert(
  headerPolicy.includes('activeSession?.displayAssistantLabel') &&
    headerPolicy.includes('activeSession?.assistantLabel') &&
    headerPolicy.includes('!activeSession?.isModelUnavailable') &&
    headerPolicy.includes('currentAssistant?.label') &&
    headerPolicy.includes('fallbackLabel'),
  'workspace assistant label priority must preserve saved display label, available session label, current assistant, and fallback order'
);
assert(
  headerPolicy.includes('chat.sharedConversationTitle') &&
    headerPolicy.includes('activeHistory?.title'),
  'conversation title policy must preserve shared title and normal history title behavior'
);
assert(
  dataController.includes('resolveConversationTitle({') &&
    dataController.includes('resolveWorkspaceAssistantLabel({') &&
    !dataController.includes('if (activeSession.value?.displayAssistantLabel)') &&
    !dataController.includes('return currentAssistant.value?.label || t("chat.assistant")'),
  'useChatDataController must delegate header title and label decisions to chatHeaderPolicy'
);
assert(
  flowBaseline.includes('resolveWorkspaceAssistantLabel({') &&
    flowBaseline.includes('chatHeaderPolicy.includes') &&
    !flowBaseline.includes('dataController.includes(\'if (activeSession.value?.displayAssistantLabel)\')'),
  'chat flow baseline must check header behavior through chatHeaderPolicy instead of inline DataController logic'
);

console.log('chat header policy checks passed');
